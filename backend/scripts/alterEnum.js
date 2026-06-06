/**
 * Temporary script to alter the llm_usage_logs.feature ENUM
 * to add 'content_assistant' as a valid value.
 * Run with: node scripts/alterEnum.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Sequelize } = require('sequelize');

async function main() {
  const sequelize = new Sequelize(
    process.env.DB_NAME || 'west_pokot_erp',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: console.log,
    }
  );

  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // MySQL doesn't allow adding values to ENUM via ALTER TABLE MODIFY
    // without redefining the entire ENUM
    await sequelize.query(`
      ALTER TABLE llm_usage_logs 
      MODIFY COLUMN feature ENUM('grammar','translate','tags','seo','alt','improve','summarise','content_assistant') 
      NOT NULL DEFAULT 'summarise' 
      COMMENT 'Which AI feature was used';
    `);

    console.log('✅ ENUM altered successfully - content_assistant added.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

main();
