const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Media Service - handles file storage operations.
 * Files are stored in storage/media/YYYY/MM/ with UUID-based filenames
 * to prevent collisions and path traversal attacks.
 */
const MEDIA_ROOT = path.join(__dirname, '..', '..', 'storage', 'media');

/**
 * Ensure a directory exists, creating it recursively if needed.
 * @param {string} dirPath - Directory path to ensure
 */
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Get the storage directory path for the current date.
 * Format: storage/media/YYYY/MM/
 * @returns {{ year: string, month: string, dir: string }}
 */
const getStoragePath = () => {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const dir = path.join(MEDIA_ROOT, year, month);
  ensureDir(dir);
  return { year, month, dir };
};

/**
 * Save an uploaded file to disk with a UUID filename.
 * @param {object} file - Express multer file object with originalname, buffer, mimetype
 * @returns {Promise<{ disk_filename: string, original_filename: string, mime_type: string, size: number, storage_path: string }>}
 */
const saveFile = async (file) => {
  const { year, month, dir } = getStoragePath();
  const ext = path.extname(file.originalname) || '';
  const diskFilename = `${uuidv4()}${ext}`;
  const filePath = path.join(dir, diskFilename);

  // Write file to disk
  fs.writeFileSync(filePath, file.buffer);

  return {
    disk_filename: diskFilename,
    original_filename: file.originalname,
    mime_type: file.mimetype,
    size: file.size,
    storage_path: path.join(year, month, diskFilename),
  };
};

/**
 * Delete a file from disk by its disk filename and storage path.
 * @param {string} diskFilename - UUID-based filename
 * @param {string} storagePath - Relative path (YYYY/MM/filename)
 * @returns {Promise<boolean>} - Whether deletion was successful
 */
const deleteFile = async (diskFilename, storagePath) => {
  try {
    const filePath = path.join(MEDIA_ROOT, storagePath || diskFilename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error.message);
    return false;
  }
};

/**
 * Get the full URL path for a media file.
 * @param {string} storagePath - Relative storage path
 * @returns {string} - URL path for the file
 */
const getFileUrl = (storagePath) => {
  return `/media/${storagePath.replace(/\\/g, '/')}`;
};

module.exports = {
  saveFile,
  deleteFile,
  getFileUrl,
  MEDIA_ROOT,
};
