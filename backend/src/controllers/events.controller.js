const pool = require('../db/connection');
const { validationResult } = require('express-validator');

const shouldLogControllers = String(process.env.LOG_CONTROLLERS || '').toLowerCase() === 'true';
const logEvent = (action, data) => {
  if (!shouldLogControllers) return;
  console.log('[events]', action, data);
};

const parseJsonArray = (value) => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const baseSlug = (title) =>
  String(title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'evento';

const buildUniqueSlug = async (title, excludeId = null) => {
  const slugBase = baseSlug(title);
  let slug = slugBase;
  let counter = 2;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const [rows] = await pool.query(
      `SELECT id FROM events WHERE slug = ? ${excludeId ? 'AND id <> ?' : ''} LIMIT 1`,
      excludeId ? [slug, excludeId] : [slug]
    );

    if (rows.length === 0) {
      return slug;
    }

    slug = `${slugBase}-${counter}`;
    counter += 1;
  }
};

const toNullableNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  const normalized = String(value).trim().toLowerCase();
  return ['true', '1', 'yes', 'si', 'on'].includes(normalized);
};

const sanitizeSelectedExtras = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => ({
      id: String(item.id || '').trim(),
      name: String(item.name || '').trim(),
      detail: String(item.detail || '').trim(),
      price: toNullableNumber(item.price) || 0,
    }))
    .filter((item) => item.id && item.name);
};

const sanitizeImages = (images, coverImage) => {
  const clean = Array.isArray(images)
    ? images
        .map((item) => String(item || '').trim())
        .filter(Boolean)
    : [];

  if (coverImage && !clean.includes(coverImage)) {
    clean.unshift(coverImage);
  }

  return clean.slice(0, 20);
};

const normalizeEvent = (row) => {
  if (!row) {
    return row;
  }

  const selectedExtras = parseJsonArray(row.extrasJson);
  const images = sanitizeImages(parseJsonArray(row.imagesJson), row.coverImage);

  return {
    ...row,
    isPublished: Boolean(row.isPublished),
    basePrice: row.basePrice !== null ? Number(row.basePrice) : null,
    extrasTotal: row.extrasTotal !== null ? Number(row.extrasTotal) : null,
    totalPrice: row.totalPrice !== null ? Number(row.totalPrice) : null,
    selectedExtras,
    images,
  };
};

const mapEventPayload = (body) => ({
  title: String(body.title || '').trim(),
  description: body.description?.trim() || null,
  eventDate: body.eventDate || null,
  location: body.location?.trim() || null,
  category: body.category || 'other',
  isPublished: toBoolean(body.isPublished),
  coverImage: body.coverImage?.trim() || null,
  images: sanitizeImages(body.images, body.coverImage?.trim() || null),
  planId: body.planId?.trim() || null,
  planName: body.planName?.trim() || null,
  planSummary: body.planSummary?.trim() || null,
  basePrice: toNullableNumber(body.basePrice),
  extrasTotal: toNullableNumber(body.extrasTotal),
  totalPrice: toNullableNumber(body.totalPrice),
  customExtraNote: body.customExtraNote?.trim() || null,
  selectedExtras: sanitizeSelectedExtras(body.selectedExtras),
  source: body.source?.trim() || 'manual',
});

const findOwnedEvent = async (id, userId) => {
  const [rows] = await pool.query(
    'SELECT * FROM events WHERE id = ? AND userId = ? LIMIT 1',
    [id, userId]
  );

  return rows[0] || null;
};

exports.getStatsSummary = async (req, res) => {
  logEvent('getStatsSummary', { userId: req.user?.id });

  try {
    const userId = req.user.id;

    const [[totalRow]] = await pool.query(
      'SELECT COUNT(*) as total FROM events WHERE userId = ?',
      [userId]
    );

    const [byStatus] = await pool.query(
      `SELECT COALESCE(category, 'other') as status, COUNT(*) as count
       FROM events
       WHERE userId = ?
       GROUP BY COALESCE(category, 'other')
       ORDER BY count DESC`,
      [userId]
    );

    const [recent] = await pool.query(
      'SELECT * FROM events WHERE userId = ? ORDER BY createdAt DESC LIMIT 5',
      [userId]
    );

    const [[thisWeekRow]] = await pool.query(
      `SELECT COUNT(*) as count
       FROM events
       WHERE userId = ?
       AND createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
      [userId]
    );

    res.json({
      total: totalRow.total,
      byStatus,
      recent: recent.map(normalizeEvent),
      thisWeek: thisWeekRow.count,
    });
  } catch (error) {
    console.error('Error al obtener estadisticas:', error.message || error);
    res.status(500).json({ error: 'Error al obtener estadisticas' });
  }
};

exports.getPublicEvents = async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT *
       FROM events
       WHERE isPublished = 1
       ORDER BY COALESCE(eventDate, createdAt) DESC, createdAt DESC`
    );

    res.json(rows.map(normalizeEvent));
  } catch (error) {
    console.error('Error al obtener eventos publicos:', error.message || error);
    res.status(500).json({ error: 'Error al obtener eventos publicos' });
  }
};

exports.getPublicEventBySlug = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT *
       FROM events
       WHERE slug = ? AND isPublished = 1
       LIMIT 1`,
      [req.params.slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Evento publico no encontrado' });
    }

    res.json(normalizeEvent(rows[0]));
  } catch (error) {
    console.error('Error al obtener evento publico:', error.message || error);
    res.status(500).json({ error: 'Error al obtener evento publico' });
  }
};

exports.getAdminEvents = async (req, res) => {
  logEvent('getAdminEvents', { userId: req.user?.id, query: req.query });

  try {
    const { search, category, page = 1, limit = 30 } = req.query;
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 30, 1), 100);
    const offset = (safePage - 1) * safeLimit;

    let query = 'SELECT * FROM events WHERE userId = ?';
    const params = [req.user.id];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ? OR location LIKE ? OR planName LIKE ? OR slug LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY COALESCE(eventDate, createdAt) DESC, createdAt DESC LIMIT ? OFFSET ?';
    params.push(safeLimit, offset);

    const [rows] = await pool.query(query, params);
    res.json(rows.map(normalizeEvent));
  } catch (error) {
    console.error('Error al obtener eventos admin:', error.message || error);
    res.status(500).json({ error: 'Error al obtener eventos admin' });
  }
};

exports.getAdminEventById = async (req, res) => {
  try {
    const event = await findOwnedEvent(req.params.id, req.user.id);

    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    res.json(normalizeEvent(event));
  } catch (error) {
    console.error('Error al obtener evento admin:', error.message || error);
    res.status(500).json({ error: 'Error al obtener evento admin' });
  }
};

exports.createAdminEvent = async (req, res) => {
  logEvent('createAdminEvent', { userId: req.user?.id, title: req.body?.title });

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const payload = mapEventPayload(req.body);
    const slug = await buildUniqueSlug(payload.title);

    const [result] = await pool.query(
      `INSERT INTO events (
        userId, title, slug, description, eventDate, location, category, isPublished, coverImage, imagesJson,
        planId, planName, planSummary, basePrice, extrasTotal, totalPrice, customExtraNote, extrasJson, source
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        payload.title,
        slug,
        payload.description,
        payload.eventDate,
        payload.location,
        payload.category,
        payload.isPublished,
        payload.coverImage,
        JSON.stringify(payload.images),
        payload.planId,
        payload.planName,
        payload.planSummary,
        payload.basePrice,
        payload.extrasTotal,
        payload.totalPrice,
        payload.customExtraNote,
        JSON.stringify(payload.selectedExtras),
        payload.source,
      ]
    );

    const created = await findOwnedEvent(result.insertId, req.user.id);
    res.status(201).json(normalizeEvent(created));
  } catch (error) {
    console.error('Error al crear el evento:', error.message || error);
    res.status(500).json({ error: 'Error al crear el evento' });
  }
};

exports.updateAdminEvent = async (req, res) => {
  logEvent('updateAdminEvent', { userId: req.user?.id, id: req.params.id, title: req.body?.title });

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const current = await findOwnedEvent(req.params.id, req.user.id);
    if (!current) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    const payload = mapEventPayload(req.body);
    const fields = [];
    const values = [];

    const assign = (field, value) => {
      fields.push(`${field} = ?`);
      values.push(value);
    };

    if (req.body.title !== undefined) {
      assign('title', payload.title);
      assign('slug', await buildUniqueSlug(payload.title, current.id));
    }
    if (req.body.description !== undefined) assign('description', payload.description);
    if (req.body.eventDate !== undefined) assign('eventDate', payload.eventDate);
    if (req.body.location !== undefined) assign('location', payload.location);
    if (req.body.category !== undefined) assign('category', payload.category);
    if (req.body.isPublished !== undefined) assign('isPublished', payload.isPublished);
    if (req.body.coverImage !== undefined) assign('coverImage', payload.coverImage);
    if (req.body.images !== undefined || req.body.coverImage !== undefined) {
      assign('imagesJson', JSON.stringify(payload.images));
    }
    if (req.body.planId !== undefined) assign('planId', payload.planId);
    if (req.body.planName !== undefined) assign('planName', payload.planName);
    if (req.body.planSummary !== undefined) assign('planSummary', payload.planSummary);
    if (req.body.basePrice !== undefined) assign('basePrice', payload.basePrice);
    if (req.body.extrasTotal !== undefined) assign('extrasTotal', payload.extrasTotal);
    if (req.body.totalPrice !== undefined) assign('totalPrice', payload.totalPrice);
    if (req.body.customExtraNote !== undefined) assign('customExtraNote', payload.customExtraNote);
    if (req.body.selectedExtras !== undefined) assign('extrasJson', JSON.stringify(payload.selectedExtras));
    if (req.body.source !== undefined) assign('source', payload.source);

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No hay campos validos para actualizar' });
    }

    values.push(req.params.id, req.user.id);
    await pool.query(
      `UPDATE events SET ${fields.join(', ')} WHERE id = ? AND userId = ?`,
      values
    );

    const updated = await findOwnedEvent(req.params.id, req.user.id);
    res.json(normalizeEvent(updated));
  } catch (error) {
    console.error('Error al actualizar el evento:', error.message || error);
    res.status(500).json({ error: 'Error al actualizar el evento' });
  }
};

exports.publishAdminEvent = async (req, res) => {
  try {
    const current = await findOwnedEvent(req.params.id, req.user.id);
    if (!current) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    await pool.query(
      'UPDATE events SET isPublished = 1 WHERE id = ? AND userId = ?',
      [req.params.id, req.user.id]
    );

    const updated = await findOwnedEvent(req.params.id, req.user.id);
    res.json(normalizeEvent(updated));
  } catch (error) {
    console.error('Error al publicar el evento:', error.message || error);
    res.status(500).json({ error: 'Error al publicar el evento' });
  }
};

exports.unpublishAdminEvent = async (req, res) => {
  try {
    const current = await findOwnedEvent(req.params.id, req.user.id);
    if (!current) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    await pool.query(
      'UPDATE events SET isPublished = 0 WHERE id = ? AND userId = ?',
      [req.params.id, req.user.id]
    );

    const updated = await findOwnedEvent(req.params.id, req.user.id);
    res.json(normalizeEvent(updated));
  } catch (error) {
    console.error('Error al despublicar el evento:', error.message || error);
    res.status(500).json({ error: 'Error al despublicar el evento' });
  }
};

exports.removeAdminEvent = async (req, res) => {
  try {
    const current = await findOwnedEvent(req.params.id, req.user.id);
    if (!current) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    await pool.query(
      'DELETE FROM events WHERE id = ? AND userId = ?',
      [req.params.id, req.user.id]
    );

    res.json({ message: 'Evento eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el evento:', error.message || error);
    res.status(500).json({ error: 'Error al eliminar el evento' });
  }
};

exports.generateSlug = baseSlug;
