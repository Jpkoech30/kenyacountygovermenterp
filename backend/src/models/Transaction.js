const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Transaction model - records M-Pesa payment transactions for permits.
 * Stores callback payload from Safaricom for audit trail.
 */
const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  permit_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'permits', key: 'id' },
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  mpesa_receipt: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'M-Pesa transaction receipt number',
  },
  phone_number: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
    defaultValue: 'pending',
  },
  callback_payload: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Full Safaricom callback JSON for audit',
  },
  merchant_request_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  checkout_request_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
}, {
  tableName: 'transactions',
  timestamps: true,
  underscored: true,
});

module.exports = Transaction;
