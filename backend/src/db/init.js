const db = require('./connection');

const ensureColumn = async (tableName, columnName, definition) => {
  const [rows] = await db.query(`SHOW COLUMNS FROM ${tableName} LIKE ?`, [columnName]);
  if (rows.length === 0) {
    await db.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
};

const ensureUsersTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(191) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const ensureEventsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      title VARCHAR(200) NOT NULL,
      slug VARCHAR(255) NOT NULL,
      description TEXT NULL,
      eventDate DATE NULL,
      location VARCHAR(255) NULL,
      category VARCHAR(50) NOT NULL DEFAULT 'other',
      isPublished TINYINT(1) NOT NULL DEFAULT 0,
      coverImage VARCHAR(500) NULL,
      planId VARCHAR(80) NULL,
      planName VARCHAR(120) NULL,
      planSummary TEXT NULL,
      basePrice DECIMAL(10,2) NULL,
      extrasTotal DECIMAL(10,2) NULL,
      totalPrice DECIMAL(10,2) NULL,
      customExtraNote TEXT NULL,
      extrasJson LONGTEXT NULL,
      source VARCHAR(50) NULL DEFAULT 'manual',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_events_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await ensureColumn('events', 'title', 'VARCHAR(200) NOT NULL');
  await ensureColumn('events', 'slug', "VARCHAR(255) NOT NULL DEFAULT ''");
  await ensureColumn('events', 'description', 'TEXT NULL');
  await ensureColumn('events', 'eventDate', 'DATE NULL');
  await ensureColumn('events', 'location', 'VARCHAR(255) NULL');
  await ensureColumn('events', 'category', "VARCHAR(50) NOT NULL DEFAULT 'other'");
  await ensureColumn('events', 'isPublished', 'TINYINT(1) NOT NULL DEFAULT 0');
  await ensureColumn('events', 'coverImage', 'VARCHAR(500) NULL');
  await ensureColumn('events', 'planId', 'VARCHAR(80) NULL');
  await ensureColumn('events', 'planName', 'VARCHAR(120) NULL');
  await ensureColumn('events', 'planSummary', 'TEXT NULL');
  await ensureColumn('events', 'basePrice', 'DECIMAL(10,2) NULL');
  await ensureColumn('events', 'extrasTotal', 'DECIMAL(10,2) NULL');
  await ensureColumn('events', 'totalPrice', 'DECIMAL(10,2) NULL');
  await ensureColumn('events', 'customExtraNote', 'TEXT NULL');
  await ensureColumn('events', 'extrasJson', 'LONGTEXT NULL');
  await ensureColumn('events', 'source', "VARCHAR(50) NULL DEFAULT 'manual'");
  await ensureColumn('events', 'createdAt', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await ensureColumn('events', 'updatedAt', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
};

const initDatabase = async () => {
  await ensureUsersTable();
  await ensureEventsTable();
};

module.exports = { initDatabase };
