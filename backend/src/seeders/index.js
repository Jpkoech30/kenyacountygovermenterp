/**
 * Database Seeder
 * Seeds initial data: departments, roles, admin user, and permit types.
 *
 * Usage: node src/seeders/index.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const sequelize = require('../config/database');
const { Role, Department, User, PermitType, Position } = require('../models');

const departments = [
  { name: 'Health', code: 'HLT' },
  { name: 'Trade', code: 'TRD' },
  { name: 'Agriculture', code: 'AGR' },
  { name: 'ICT', code: 'ICT' },
  { name: 'Finance', code: 'FIN' },
];

const roles = [
  { name: 'admin', description: 'System administrator with full access' },
  { name: 'editor', description: 'Content editor' },
  { name: 'revenue_officer', description: 'Revenue collection officer' },
  { name: 'revenue_clerk', description: 'Revenue collection clerk' },
  { name: 'cyber_provider', description: 'Cyber/citizen service provider' },
  { name: 'hr_officer', description: 'Human resources officer' },
  { name: 'supervisor', description: 'Department supervisor' },
  { name: 'employee', description: 'General employee' },
  { name: 'health_officer', description: 'Health department officer' },
  { name: 'health_worker', description: 'Health department worker' },
  { name: 'health_manager', description: 'Health facility manager' },
  { name: 'health_records_officer', description: 'Health records officer' },
  { name: 'pharmacy_tech', description: 'Pharmacy technician' },
  { name: 'community_health_officer', description: 'Community health officer managing CHUs and CHVs' },
  { name: 'chv', description: 'Community Health Volunteer - frontline community health worker' },
];

const permitTypes = [
  { name: 'Single Business Permit', code: 'SBP', fee: 5000, duration_months: 12, is_active: true },
  { name: 'Health Certificate', code: 'HC', fee: 3000, duration_months: 12, is_active: true },
  { name: 'Liquor License', code: 'LL', fee: 15000, duration_months: 12, is_active: true },
  { name: 'Food Handling Permit', code: 'FHP', fee: 2000, duration_months: 6, is_active: true },
  { name: 'Advertisement Permit', code: 'ADV', fee: 1000, duration_months: 3, is_active: true },
];

const positions = [
  { title: 'County Clerk', job_grade: 'JG-Q', is_active: true },
  { title: 'Revenue Officer', job_grade: 'JG-P', is_active: true },
  { title: 'Revenue Clerk', job_grade: 'JG-N', is_active: true },
  { title: 'HR Officer', job_grade: 'JG-P', is_active: true },
  { title: 'Department Supervisor', job_grade: 'JG-Q', is_active: true },
  { title: 'Health Officer', job_grade: 'JG-P', is_active: true },
  { title: 'Health Worker', job_grade: 'JG-N', is_active: true },
  { title: 'ICT Officer', job_grade: 'JG-P', is_active: true },
  { title: 'Board Member', job_grade: 'JG-R', is_active: true },
  { title: 'General Employee', job_grade: 'JG-M', is_active: true },
];

/**
 * Seeds all initial data into the database.
 * Safe to run multiple times - skips existing records.
 */
const seed = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect and sync
    await sequelize.authenticate();
    console.log('✅ Database connected.');

    // Sync all models (create tables if they don't exist)
    await sequelize.sync();
    console.log('✅ Tables synchronized.');

    // Seed departments
    console.log('\n📁 Seeding departments...');
    for (const dept of departments) {
      const [department, created] = await Department.findOrCreate({
        where: { code: dept.code },
        defaults: dept,
      });
      console.log(`   ${created ? '✅ Created' : '⏭️  Exists'} - ${department.name} (${department.code})`);
    }

    // Seed roles
    console.log('\n👤 Seeding roles...');
    for (const role of roles) {
      const [createdRole, created] = await Role.findOrCreate({
        where: { name: role.name },
        defaults: role,
      });
      console.log(`   ${created ? '✅ Created' : '⏭️  Exists'} - ${createdRole.name}`);
    }

    // Seed permit types
    console.log('\n📋 Seeding permit types...');
    for (const pt of permitTypes) {
      const [permitType, created] = await PermitType.findOrCreate({
        where: { code: pt.code },
        defaults: pt,
      });
      console.log(`   ${created ? '✅ Created' : '⏭️  Exists'} - ${permitType.name} (${permitType.code}) - KES ${permitType.fee}`);
    }

    // Seed positions
    console.log('\n💼 Seeding positions...');
    for (const pos of positions) {
      const [position, created] = await Position.findOrCreate({
        where: { title: pos.title },
        defaults: pos,
      });
      console.log(`   ${created ? '✅ Created' : '⏭️  Exists'} - ${position.title} (${position.job_grade})`);
    }

    // Seed admin user
    console.log('\n🔑 Seeding admin user...');
    const adminRole = await Role.findOne({ where: { name: 'admin' } });

    if (adminRole) {
      const [adminUser, created] = await User.findOrCreate({
        where: { email: 'admin@westpokot.go.ke' },
        defaults: {
          email: 'admin@westpokot.go.ke',
          password_hash: 'Admin123!', // Will be hashed by the model hook
          first_name: 'System',
          last_name: 'Administrator',
          role_id: adminRole.id,
          is_active: true,
        },
      });
      console.log(`   ${created ? '✅ Created' : '⏭️  Exists'} - Admin user: admin@westpokot.go.ke`);
      if (created) {
        console.log('   🔑 Default password: Admin123!');
      }
    } else {
      console.log('   ❌ Admin role not found. Seed roles first.');
    }

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📋 Login credentials:');
    console.log('   Email:    admin@westpokot.go.ke');
    console.log('   Password: Admin123!');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seed();
