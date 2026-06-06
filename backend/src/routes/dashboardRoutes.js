/**
 * Dashboard Routes - Chart.js data endpoints with role-based access.
 * Mounted at /api/dashboard.
 *
 * Endpoints:
 *   GET /system       - admin only: CPU, memory, disk metrics (last 12 hours)
 *   GET /revenue      - admin, revenue_officer: monthly permits & revenue
 *   GET /hr           - admin, hr_officer, supervisor: department headcounts & leave usage
 *   GET /health       - admin, health_officer: low-stock items & campaign reach
 *
 * All endpoints return mock/aggregated data for MVP. When real tables exist,
 * replace the mock generators with actual Sequelize queries.
 */
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// ---------------------------------------------------------------------------
// Helper: generate realistic random values within a range
// ---------------------------------------------------------------------------
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// ---------------------------------------------------------------------------
// Helper: build timestamps for the last N hours
// ---------------------------------------------------------------------------
function lastNHours(n) {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now - (n - 1 - i) * hour);
    return d.toISOString().slice(0, 13) + ':00';
  });
}

// ---------------------------------------------------------------------------
// GET /api/dashboard/system  – admin only
// ---------------------------------------------------------------------------
router.get(
  '/system',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    try {
      const hours = 12;
      const timestamps = lastNHours(hours);

      const cpu = Array.from({ length: hours }, () => randFloat(15, 95));
      const memory = Array.from({ length: hours }, () => randFloat(30, 90));
      const disk = randFloat(40, 85);
      const dbConnections = rand(2, 20);

      res.json({ cpu, memory, disk, dbConnections, timestamps });
    } catch (error) {
      next(error);
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/dashboard/revenue  – admin, revenue_officer
// ---------------------------------------------------------------------------
router.get(
  '/revenue',
  authenticate,
  authorize('admin', 'revenue_officer'),
  async (req, res, next) => {
    try {
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];

      const months = monthNames;
      const permits = monthNames.map(() => rand(50, 500));
      const revenue = monthNames.map(() => randFloat(100000, 5000000, 0));

      // Doughnut data
      const pendingAssignments = rand(5, 40);
      const totalPending = rand(50, 200);

      res.json({ months, permits, revenue, pendingAssignments, totalPending });
    } catch (error) {
      next(error);
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/dashboard/hr  – admin, hr_officer, supervisor
// ---------------------------------------------------------------------------
router.get(
  '/hr',
  authenticate,
  authorize('admin', 'hr_officer', 'supervisor'),
  async (req, res, next) => {
    try {
      const departments = [
        'Administration',
        'Finance',
        'Health',
        'Education',
        'Agriculture',
        'Infrastructure',
        'Water & Sanitation',
      ];

      const headcounts = departments.map(() => rand(10, 120));

      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];

      const leaveUsage = monthNames.map((month) => ({
        month,
        annual: rand(2, 15),
        sick: rand(1, 10),
      }));

      res.json({ departments, headcounts, leaveUsage });
    } catch (error) {
      next(error);
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/dashboard/health  – admin, health_officer
// ---------------------------------------------------------------------------
router.get(
  '/health',
  authenticate,
  authorize('admin', 'health_officer'),
  async (req, res, next) => {
    try {
      const items = [
        'ARV Drugs',
        'Malaria Test Kits',
        'Vaccines (BCG)',
        'IV Fluids',
        'Antibiotics (Amoxicillin)',
      ];

      const stock = items.map(() => rand(5, 100));
      const reorderLevel = items.map(() => rand(20, 50));

      const campaigns = [
        { name: 'COVID-19 Vaccination', reached: rand(5000, 50000), target: 60000 },
        { name: 'Malaria Prevention', reached: rand(3000, 25000), target: 30000 },
        { name: 'Maternal Health', reached: rand(2000, 15000), target: 20000 },
        { name: 'Child Immunization', reached: rand(4000, 35000), target: 40000 },
      ];

      res.json({ items, stock, reorderLevel, campaigns });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
