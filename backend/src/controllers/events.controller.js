const pool = require('../db/connection');
const { validationResult } = require('express-validator');

const shouldLogControllers = String(process.env.LOG_CONTROLLERS || '').toLowerCase() === 'true';
const logEvent = (action, data) => {
  if (!shouldLogControllers) return;
  console.log('[events]', action, data);
};

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim() + '-' + Date.now();
};

const toNullableNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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

const normalizeEvent = (row) => {
  if (!row) {
    return row;
  }

  let selectedExtras = [];
  if (row.extrasJson) {
    try {
      selectedExtras = JSON.parse(row.extrasJson);
    } catch {
      selectedExtras = [];
    }
  }

  return {
    ...row,
    basePrice: row.basePrice !== null ? Number(row.basePrice) : null,
    extrasTotal: row.extrasTotal !== null ? Number(row.extrasTotal) : null,
    totalPrice: row.totalPrice !== null ? Number(row.totalPrice) : null,
    selectedExtras,
  };
};

const mapEventPayload = (body) => ({
  title: body.title,
  description: body.description?.trim() || null,
  eventDate: body.eventDate || null,
  location: body.location?.trim() || null,
  category: body.category || 'other',
  isPublished: body.isPublished,
  coverImage: body.coverImage?.trim() || null,
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

exports.getAll = async (req, res) => {
  logEvent('getAll', { userId: req.user?.id, query: req.query });
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (safePage - 1) * safeLimit;

    let query = 'SELECT * FROM events WHERE userId = ?';
    const params = [req.user.id];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ? OR location LIKE ? OR planName LIKE ? OR customExtraNote LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(safeLimit, offset);

    const [rows] = await pool.query(query, params);
    res.json(rows.map(normalizeEvent));
  } catch (error) {
    console.error('Error al obtener eventos:', error.message || error);
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
};

exports.getById = async (req, res) => {
  logEvent('getById', { userId: req.user?.id, id: req.params.id });
  try {
    const [rows] = await pool.query(
      'SELECT * FROM events WHERE id = ? AND userId = ?',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    res.json(normalizeEvent(rows[0]));
  } catch (error) {
    console.error('Error al obtener el evento:', error.message || error);
    res.status(500).json({ error: 'Error al obtener el evento' });
  }
};

exports.create = async (req, res) => {
  logEvent('create', { userId: req.user?.id, body: { ...req.body, description: req.body?.description ? '***' : undefined } });
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const payload = mapEventPayload(req.body);
    const slug = generateSlug(payload.title);

    const [result] = await pool.query(
      `INSERT INTO events (
        userId, title, slug, description, eventDate, location, category, isPublished, coverImage,
        planId, planName, planSummary, basePrice, extrasTotal, totalPrice, customExtraNote, extrasJson, source
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        payload.title,
        slug,
        payload.description,
        payload.eventDate,
        payload.location,
        payload.category,
        Boolean(payload.isPublished),
        payload.coverImage,
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

    const [newEvent] = await pool.query('SELECT * FROM events WHERE id = ?', [result.insertId]);
    res.status(201).json(normalizeEvent(newEvent[0]));
  } catch (error) {
    console.error('Error al crear el evento:', error.message || error);
    res.status(500).json({ error: 'Error al crear el evento' });
  }
};

exports.update = async (req, res) => {
  logEvent('update', { userId: req.user?.id, id: req.params.id, body: { ...req.body, description: req.body?.description ? '***' : undefined } });
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const [existing] = await pool.query(
      'SELECT id FROM events WHERE id = ? AND userId = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    const payload = mapEventPayload(req.body);
    const allowed = [
      'title',
      'description',
      'eventDate',
      'location',
      'category',
      'isPublished',
      'coverImage',
      'planId',
      'planName',
      'planSummary',
      'basePrice',
      'extrasTotal',
      'totalPrice',
      'customExtraNote',
      'selectedExtras',
      'source',
    ];
    const fields = allowed.filter((key) => req.body[key] !== undefined);

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No hay campos validos para actualizar' });
    }

    if (fields.includes('title')) {
      payload.slug = generateSlug(payload.title);
      fields.push('slug');
    }

    const dbFields = fields.map((field) => field === 'selectedExtras' ? 'extrasJson' : field);
    const setClause = dbFields.map((field) => `${field} = ?`).join(', ');
    const values = [
      ...fields.map((field) => {
        if (field === 'slug') return payload.slug;
        if (field === 'isPublished') return Boolean(payload.isPublished);
        if (field === 'selectedExtras') return JSON.stringify(payload.selectedExtras);
        return payload[field];
      }),
      req.params.id,
      req.user.id,
    ];

    await pool.query(
      `UPDATE events SET ${setClause} WHERE id = ? AND userId = ?`,
      values
    );

    const [updated] = await pool.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
    res.json(normalizeEvent(updated[0]));
  } catch (error) {
    console.error('Error al actualizar el evento:', error.message || error);
    res.status(500).json({ error: 'Error al actualizar el evento' });
  }
};

exports.remove = async (req, res) => {
  logEvent('remove', { userId: req.user?.id, id: req.params.id });
  try {
    const [existing] = await pool.query(
      'SELECT id FROM events WHERE id = ? AND userId = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length === 0) {
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
