/**
 * CMS Seeder - seeds default settings, sample categories, and sample facts.
 * Run with: node src/seeders/cmsSeeder.js
 */
const sequelize = require('../config/database');
const Setting = require('../models/Setting');
const Taxonomy = require('../models/Taxonomy');
const Fact = require('../models/Fact');

const seedSettings = [
  {
    key: 'site_name',
    value: 'West Pokot County',
    description: 'Public-facing site name',
  },
  {
    key: 'site_description',
    value: 'Official website of West Pokot County Government',
    description: 'Site tagline or description',
  },
  {
    key: 'llm_enabled',
    value: 'false',
    description: 'Enable AI summarisation via DeepSeek',
  },
  {
    key: 'llm_api_key',
    value: '',
    description: 'DeepSeek API key',
  },
  {
    key: 'llm_model',
    value: 'deepseek-chat',
    description: 'DeepSeek model name',
  },
  {
    key: 'llm_max_tokens',
    value: '1000',
    description: 'Maximum output tokens for summarisation',
  },
  {
    key: 'llm_temperature',
    value: '0.3',
    description: 'LLM temperature setting (0.0 - 1.0)',
  },
  {
    key: 'default_locale',
    value: 'en',
    description: 'Default content locale',
  },
  {
    key: 'supported_locales',
    value: JSON.stringify(['en', 'sw', 'pok']),
    description: 'JSON array of supported locales',
  },
  {
    key: 'ai_assist_enabled',
    value: 'false',
    description: 'Enable AI Assist features (grammar, translate, tags, SEO, alt text, improve)',
  },
  {
    key: 'ai_assist_monthly_budget_kes',
    value: '0',
    description: 'Monthly budget for AI Assist in KES (0 = unlimited)',
  },
];

const seedCategories = [
  { name: 'General', type: 'category', slug: 'general' },
  { name: 'Agriculture', type: 'category', slug: 'agriculture' },
  { name: 'Education', type: 'category', slug: 'education' },
  { name: 'Health', type: 'category', slug: 'health' },
  { name: 'Infrastructure', type: 'category', slug: 'infrastructure' },
  { name: 'Finance', type: 'category', slug: 'finance' },
  { name: 'Governance', type: 'category', slug: 'governance' },
];

const seedFacts = [
  {
    text_en: 'West Pokot County covers an area of approximately 9,169 square kilometers.',
    text_sw: 'Kaunti ya West Pokot ina eneo la takriban kilomita za mraba 9,169.',
    text_pok: 'West Pokot County kiyan kiyan che pokta 9,169 square kilometers.',
    active: true,
    sort_order: 1,
  },
  {
    text_en: 'The county has a population of over 600,000 people.',
    text_sw: 'Kaunti ina wakazi zaidi ya 600,000.',
    text_pok: 'Kaunti nyo ngoleeta 600,000.',
    active: true,
    sort_order: 2,
  },
  {
    text_en: 'Kapenguria is the capital and largest town of West Pokot County.',
    text_sw: 'Kapenguria ni mji mkuu na mkubwa wa Kaunti ya West Pokot.',
    text_pok: 'Kapenguria nyo town che kiyan che West Pokot County.',
    active: true,
    sort_order: 3,
  },
];

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected.');

    // Seed settings
    for (const setting of seedSettings) {
      await Setting.findOrCreate({
        where: { key: setting.key },
        defaults: setting,
      });
    }
    console.log(`✅ Seeded ${seedSettings.length} settings.`);

    // Seed categories
    for (const category of seedCategories) {
      await Taxonomy.findOrCreate({
        where: { type: 'category', slug: category.slug },
        defaults: category,
      });
    }
    console.log(`✅ Seeded ${seedCategories.length} categories.`);

    // Seed facts
    for (const fact of seedFacts) {
      await Fact.findOrCreate({
        where: { text_en: fact.text_en },
        defaults: fact,
      });
    }
    console.log(`✅ Seeded ${seedFacts.length} facts.`);

    console.log('🎉 CMS seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ CMS seeding failed:', error.message);
    process.exit(1);
  }
};

seed();
