/**
 * Migration script: Add user_id column to persons table
 * Run: node scripts/addUserIdColumn.js
 */
const sequelize = require('../src/config/database');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    // Check if column exists
    const [rows] = await sequelize.query("SHOW COLUMNS FROM persons LIKE 'user_id'");
    if (rows.length > 0) {
      console.log('Column user_id already exists in persons table.');
    } else {
      await sequelize.query(
        "ALTER TABLE persons ADD COLUMN user_id INT NULL AFTER content_id, ADD INDEX persons_user_idx (user_id);"
      );
      console.log('Added user_id column to persons table.');
    }

    await sequelize.close();
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

run();
