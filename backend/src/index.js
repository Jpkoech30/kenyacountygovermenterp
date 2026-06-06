require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const lookupRoutes = require('./routes/lookupRoutes');

// CMS Routes
const contentRoutes = require('./routes/contentRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const taxonomyRoutes = require('./routes/taxonomyRoutes');
const publicRoutes = require('./routes/publicRoutes');
const adminRoutes = require('./routes/adminRoutes');
const llmRoutes = require('./routes/llmRoutes');
const aiRoutes = require('./routes/aiRoutes');
const menuRoutes = require('./routes/menuRoutes');

// Dashboard Routes
const dashboardRoutes = require('./routes/dashboardRoutes');

// Revenue & Business Licensing Routes
const permitRoutes = require('./routes/permitRoutes');

// Human Capital Management Routes
const hrRoutes = require('./routes/hrRoutes');

// Health Facility Management Routes
const healthRoutes = require('./routes/healthRoutes');

// Community Health Extension Routes
const communityHealthRoutes = require('./routes/communityHealthRoutes');

// Import models to ensure associations are registered
require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Middleware setup
 */
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for TipTap content
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded media files statically
app.use('/media', express.static(path.join(__dirname, '..', 'storage', 'media')));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
  });
}

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', lookupRoutes);

// CMS Routes
app.use('/api/content', contentRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/taxonomies', taxonomyRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', menuRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/ai', aiRoutes);

// Dashboard Routes
app.use('/api/dashboard', dashboardRoutes);

// Revenue & Business Licensing Routes
app.use('/api/permits', permitRoutes);
app.use('/api', permitRoutes); // For /api/mpesa/callback and /api/verify/:permit_id

// Human Capital Management Routes
app.use('/api', hrRoutes); // Mounts /api/hr/* and /api/public/*

// Health Facility Management Routes
app.use('/api/health', healthRoutes);

// Community Health Extension Routes
app.use('/api/health/community', communityHealthRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.url} not found.`,
  });
});

// Global error handler
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Process-level error handlers — prevent crashes from unhandled rejections
// ---------------------------------------------------------------------------
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED PROMISE REJECTION:');
  console.error('Reason:', reason instanceof Error ? reason.message : reason);
  console.error('Stack:', reason instanceof Error ? reason.stack : '');
  // Log but do NOT exit — let the server continue serving
});

process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:');
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
  // Log but do NOT exit — let the server continue serving
});

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
let server = null;

async function gracefulShutdown(signal) {
  console.log(`\n⚠️  Received ${signal}. Shutting down gracefully...`);

  // Close the HTTP server first — stop accepting new connections
  if (server) {
    await new Promise((resolve) => {
      server.close((err) => {
        if (err) {
          console.error('Error closing HTTP server:', err.message);
        } else {
          console.log('✅ HTTP server closed.');
        }
        resolve();
      });
    });
  }

  // Close database connection pool
  try {
    await sequelize.close();
    console.log('✅ Database connection closed.');
  } catch (err) {
    console.error('Error closing database connection:', err.message);
  }

  console.log('👋 Goodbye.');
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ---------------------------------------------------------------------------
// Database connection with retry logic (exponential backoff)
// ---------------------------------------------------------------------------
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;

async function connectWithRetry(attempt = 1) {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    if (attempt <= MAX_RETRIES) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.error(
        `❌ Database connection attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`
      );
      console.log(`⏳ Retrying in ${delay / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return connectWithRetry(attempt + 1);
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Safe model sync — use sync({ alter: false }) to avoid MySQL key limit issues
// ---------------------------------------------------------------------------
async function syncModels() {
  const env = process.env.NODE_ENV || 'development';

  if (env === 'development') {
    console.log('⏳ Syncing database models (creating missing tables only)...');
    const syncPromise = sequelize.sync({ alter: false });

    // If sync takes longer than 5 minutes, log a warning but don't crash
    const timeout = setTimeout(() => {
      console.warn(
        '⚠️  Database sync is taking longer than expected. ' +
        'The server will start once sync completes.'
      );
    }, 300000); // 5 minutes

    try {
      await syncPromise;
      clearTimeout(timeout);
      console.log('✅ Database models synchronized.');
    } catch (syncError) {
      clearTimeout(timeout);
      throw syncError;
    }
  } else {
    // Production: use sync without alter (safer)
    await sequelize.sync();
    console.log('✅ Database models synchronized (production mode).');
  }
}

// ---------------------------------------------------------------------------
// Server startup
// ---------------------------------------------------------------------------
const startServer = async () => {
  try {
    // Step 1: Connect to database with retry
    await connectWithRetry();

    // Step 2: Sync models
    await syncModels();

    // Step 3: Start HTTP server
    server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Extend server socket timeout to handle long-running requests
    server.timeout = 120000; // 2 minutes
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('Stack:', error.stack);
    console.log('⏳ Server will retry startup in 10 seconds...');

    // Auto-retry startup after delay
    setTimeout(() => {
      console.log('🔄 Retrying server startup...');
      startServer();
    }, 10000);
  }
};

startServer();

module.exports = app;
