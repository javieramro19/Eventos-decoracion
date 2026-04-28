const db = require('./connection');

const ensureColumn = async (tableName, columnName, definition) => {
  const [rows] = await db.query(`SHOW COLUMNS FROM ${tableName} LIKE ?`, [columnName]);
  if (rows.length === 0) {
    await db.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
};

const ensureColumnDefinition = async (tableName, columnName, definition, predicate) => {
  const [rows] = await db.query(`SHOW COLUMNS FROM ${tableName} LIKE ?`, [columnName]);
  if (rows.length === 0) {
    await db.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
    return;
  }

  if (predicate(rows[0])) {
    await db.query(`ALTER TABLE ${tableName} MODIFY COLUMN ${columnName} ${definition}`);
  }
};

const ensureIndex = async (tableName, indexName, statement) => {
  const [rows] = await db.query(`SHOW INDEX FROM ${tableName} WHERE Key_name = ?`, [indexName]);
  if (rows.length === 0) {
    await db.query(statement);
  }
};

const ensureUniqueIndex = async (tableName, indexName, statement) => {
  const [rows] = await db.query(`SHOW INDEX FROM ${tableName} WHERE Key_name = ?`, [indexName]);
  if (rows.length === 0) {
    await db.query(statement);
    return;
  }

  if (rows[0].Non_unique !== 0) {
    await db.query(`DROP INDEX ${indexName} ON ${tableName}`);
    await db.query(statement);
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

const ensureGalleryTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS gallery (
      id INT AUTO_INCREMENT PRIMARY KEY,
      eventId INT NOT NULL,
      imageUrl VARCHAR(500) NOT NULL,
      caption VARCHAR(255) NULL,
      \`order\` INT NOT NULL DEFAULT 0,
      isActive TINYINT(1) NOT NULL DEFAULT 1,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_gallery_event FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
    )
  `);

  await ensureColumn('gallery', 'imageUrl', 'VARCHAR(500) NOT NULL');
  await ensureColumn('gallery', 'caption', 'VARCHAR(255) NULL');
  await ensureColumn('gallery', 'order', 'INT NOT NULL DEFAULT 0');
  await ensureColumn('gallery', 'isActive', 'TINYINT(1) NOT NULL DEFAULT 1');
  await ensureColumn('gallery', 'createdAt', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await ensureColumn('gallery', 'updatedAt', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
  await ensureIndex('gallery', 'idx_gallery_event_order', 'CREATE INDEX idx_gallery_event_order ON gallery (eventId, `order`)');
  await ensureIndex('gallery', 'idx_gallery_event_active', 'CREATE INDEX idx_gallery_event_active ON gallery (eventId, isActive)');
};

const ensureContactsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      eventId INT NOT NULL,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(191) NOT NULL,
      phone VARCHAR(40) NULL,
      message TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_contacts_event FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
    )
  `);

  await ensureColumn('contacts', 'name', 'VARCHAR(120) NOT NULL');
  await ensureColumn('contacts', 'email', 'VARCHAR(191) NOT NULL');
  await ensureColumn('contacts', 'phone', 'VARCHAR(40) NULL');
  await ensureColumn('contacts', 'message', 'TEXT NOT NULL');
  await ensureColumn('contacts', 'status', "VARCHAR(20) NOT NULL DEFAULT 'pending'");
  await ensureColumn('contacts', 'createdAt', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await ensureColumn('contacts', 'updatedAt', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
  await ensureIndex('contacts', 'idx_contacts_event_created', 'CREATE INDEX idx_contacts_event_created ON contacts (eventId, createdAt)');
  await ensureIndex('contacts', 'idx_contacts_status_created', 'CREATE INDEX idx_contacts_status_created ON contacts (status, createdAt)');
};

const ensureSectionsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS sections (
      id INT AUTO_INCREMENT PRIMARY KEY,
      eventId INT NOT NULL,
      type VARCHAR(40) NOT NULL,
      content JSON NULL,
      isActive TINYINT(1) NOT NULL DEFAULT 1,
      \`order\` INT NOT NULL DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_sections_event FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
    )
  `);

  await ensureColumn('sections', 'type', 'VARCHAR(40) NOT NULL');
  await ensureColumn('sections', 'content', 'JSON NULL');
  await ensureColumn('sections', 'isActive', 'TINYINT(1) NOT NULL DEFAULT 1');
  await ensureColumn('sections', 'order', 'INT NOT NULL DEFAULT 0');
  await ensureColumn('sections', 'createdAt', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await ensureColumn('sections', 'updatedAt', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
  await ensureIndex('sections', 'idx_sections_event_order', 'CREATE INDEX idx_sections_event_order ON sections (eventId, `order`)');
  await ensureIndex('sections', 'idx_sections_event_type', 'CREATE INDEX idx_sections_event_type ON sections (eventId, type)');
};

const backfillGalleryTable = async () => {
  const [events] = await db.query('SELECT id, coverImage, imagesJson FROM events ORDER BY id ASC');

  for (const event of events) {
    const [[countRow]] = await db.query('SELECT COUNT(*) as total FROM gallery WHERE eventId = ?', [event.id]);
    if (countRow.total > 0) {
      continue;
    }

    const images = [];

    if (event.coverImage) {
      images.push(String(event.coverImage).trim());
    }

    if (event.imagesJson) {
      try {
        const parsed = JSON.parse(event.imagesJson);
        if (Array.isArray(parsed)) {
          for (const image of parsed) {
            const clean = String(image || '').trim();
            if (clean && !images.includes(clean)) {
              images.push(clean);
            }
          }
        }
      } catch {
        // Ignore malformed legacy gallery snapshots.
      }
    }

    for (const [index, imageUrl] of images.entries()) {
      await db.query(
        'INSERT INTO gallery (eventId, imageUrl, caption, `order`, isActive) VALUES (?, ?, NULL, ?, 1)',
        [event.id, imageUrl, index]
      );
    }
  }
};

const backfillSectionsTable = async () => {
  const [events] = await db.query(`
    SELECT id, title, description, planName, planSummary
    FROM events
    ORDER BY id ASC
  `);

  for (const event of events) {
    const [[countRow]] = await db.query('SELECT COUNT(*) as total FROM sections WHERE eventId = ?', [event.id]);
    if (countRow.total > 0) {
      continue;
    }

    const sections = [
      {
        type: 'hero',
        content: JSON.stringify({
          eyebrow: 'Evento publicado',
          title: event.title,
          summary: event.description || '',
        }),
        isActive: 1,
        order: 0,
      },
      {
        type: 'gallery',
        content: JSON.stringify({
          heading: 'Galeria del evento',
          description: 'Una seleccion visual del montaje, la ambientacion y los detalles del evento.',
        }),
        isActive: 1,
        order: 1,
      },
      {
        type: 'about',
        content: JSON.stringify({
          heading: 'La propuesta',
          body: event.description || '',
          planHeading: event.planName || 'Plan EventoSonic',
          planSummary: event.planSummary || '',
        }),
        isActive: 1,
        order: 2,
      },
      {
        type: 'contact',
        content: JSON.stringify({
          eyebrow: 'Solicitar informacion',
          heading: '¿Te interesa este montaje?',
          body: 'Envia tu solicitud y la guardaremos directamente en el panel de administracion del evento.',
          ctaLabel: 'Enviar solicitud',
        }),
        isActive: 1,
        order: 3,
      },
    ];

    for (const section of sections) {
      await db.query(
        'INSERT INTO sections (eventId, type, content, isActive, `order`) VALUES (?, ?, ?, ?, ?)',
        [event.id, section.type, section.content, section.isActive, section.order]
      );
    }
  }
};

const ensureEventsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      title VARCHAR(200) NOT NULL,
      slug VARCHAR(200) NOT NULL,
      description TEXT NULL,
      eventDate DATE NULL,
      location VARCHAR(255) NULL,
      category VARCHAR(50) NOT NULL DEFAULT 'other',
      isPublished TINYINT(1) NOT NULL DEFAULT 0,
      coverImage VARCHAR(500) NULL,
      imagesJson LONGTEXT NULL,
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
  await ensureColumnDefinition(
    'events',
    'slug',
    "VARCHAR(200) NOT NULL DEFAULT ''",
    (column) => Number(column.Type.match(/\d+/)?.[0] || 0) !== 200 || column.Null !== 'NO'
  );
  await ensureColumn('events', 'description', 'TEXT NULL');
  await ensureColumn('events', 'eventDate', 'DATE NULL');
  await ensureColumn('events', 'location', 'VARCHAR(255) NULL');
  await ensureColumn('events', 'category', "VARCHAR(50) NOT NULL DEFAULT 'other'");
  await ensureColumn('events', 'isPublished', 'TINYINT(1) NOT NULL DEFAULT 0');
  await ensureColumn('events', 'coverImage', 'VARCHAR(500) NULL');
  await ensureColumn('events', 'imagesJson', 'LONGTEXT NULL');
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
  await ensureUniqueIndex('events', 'idx_events_slug', 'CREATE UNIQUE INDEX idx_events_slug ON events (slug)');
  await ensureIndex('events', 'idx_events_published_date', 'CREATE INDEX idx_events_published_date ON events (isPublished, eventDate)');
};

const initDatabase = async () => {
  await ensureUsersTable();
  await ensureEventsTable();
  await ensureGalleryTable();
  await ensureContactsTable();
  await ensureSectionsTable();
  await backfillGalleryTable();
  await backfillSectionsTable();
};

module.exports = { initDatabase };
