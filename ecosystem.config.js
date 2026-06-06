module.exports = {
  apps: [
    {
      name: 'county-erp-api',
      cwd: './backend',
      script: 'src/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 5000,
      max_restarts: 10,
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '../logs/api-error.log',
      out_file: '../logs/api-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],

  /**
   * Deployment configuration for remote server.
   * Usage: pm2 deploy ecosystem.config.js production setup
   *        pm2 deploy ecosystem.config.js production update
   */
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/master',
      repo: 'https://github.com/Jpkoech30/kenyacountygovermenterp.git',
      path: '/var/www/county-erp',
      'post-deploy':
        'cd backend && npm install --production && ' +
        'cd ../frontend && npm install && npm run build && ' +
        'cd .. && pm2 startOrRestart ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production',
      },
    },
  },
};
