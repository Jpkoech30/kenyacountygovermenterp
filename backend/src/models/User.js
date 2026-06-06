const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');

/**
 * User model - core user entity for the ERP system.
 * Handles password hashing automatically on creation/update.
 * Excludes password_hash from JSON serialization by default.
 */
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'id',
    },
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id',
    },
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  guide_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  guide_seen: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  allow_ai_assist: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Grant this user access to AI Assist features',
  },
}, {
  tableName: 'users',
  defaultScope: {
    attributes: { exclude: ['password_hash'] },
  },
  scopes: {
    withPassword: {
      attributes: { include: ['password_hash'] },
    },
  },
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    },
  },
});

/**
 * Instance method to compare a plaintext password with the stored hash.
 * @param {string} password - Plaintext password to compare
 * @returns {Promise<boolean>}
 */
User.prototype.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password_hash);
};

module.exports = User;
