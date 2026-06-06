const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Media model - stores metadata for uploaded files.
 * Files are stored on disk with UUID-based filenames to prevent collisions.
 * Original filenames are preserved for display purposes.
 */
const Media = sequelize.define('Media', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Original filename from upload',
  },
  disk_filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'UUID-based filename on disk',
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'File size in bytes',
  },
  alt_text: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  uploaded_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'media',
  indexes: [
    {
      fields: ['uploaded_by'],
      name: 'media_uploaded_by_idx',
    },
    {
      fields: ['mime_type'],
      name: 'media_mime_type_idx',
    },
  ],
});

module.exports = Media;
