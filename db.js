/**
 * Simple JSON file-based database
 * Stores user data in a JSON file
 */

const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data', 'users.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read database
function readDB() {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    return {};
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return {};
  }
}

// Write database
function writeDB(data) {
  ensureDataDir();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing database:', error);
    return false;
  }
}

// Save user connection
function saveUser(zoomUserId, connectionData) {
  const db = readDB();
  db[zoomUserId] = connectionData;
  return writeDB(db);
}

// Get user by Zoom user ID
function getUser(zoomUserId) {
  const db = readDB();
  return db[zoomUserId] || null;
}

// Get all users
function getAllUsers() {
  return readDB();
}

module.exports = {
  saveUser,
  getUser,
  getAllUsers
};
