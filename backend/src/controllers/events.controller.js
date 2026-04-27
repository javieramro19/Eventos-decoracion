const pool = require('../db/connection');
const { validationResult } = require('express-validator');

const generateSlug = (title) => {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim() + '-' + Date.now();
};

// GET /api/events
exports.getAll = async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        const safePage = Math.max(parseInt(page, 10) || 1, 1);
        const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
        const offset = (safePage - 1) * safeLimit;

        let query = 'SELECT * FROM events WHERE userId = ?';
        const params = [req.user.id];

        if (search) {
            query += ' AND (title LIKE ? OR description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
        params.push(safeLimit, offset);

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener eventos' });
    }
};

// GET /api/events/:id
exports.getById = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM events WHERE id = ? AND userId = ?',
            [req.params.id, req.user.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el evento' });
    }
};

// POST /api/events
exports.create = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    try {
        const { title, description, eventDate, location, category } = req.body;
        const slug = generateSlug(title);

        const [result] = await pool.query(
            `INSERT INTO events (userId, title, slug, description, eventDate, location, category) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, title, slug, description || null, 
             eventDate || null, location || null, category || 'other']
        );

        const [newEvent] = await pool.query(
            'SELECT * FROM events WHERE id = ?',
            [result.insertId]
        );
        res.status(201).json(newEvent[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear el evento' });
    }
};

// PUT /api/events/:id
exports.update = async (req, res) => {
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

        const allowed = ['title', 'description', 'eventDate', 'location', 
                         'category', 'isPublished', 'coverImage'];
        const fields = Object.keys(req.body).filter(
            (key) => allowed.includes(key) && req.body[key] !== undefined
        );

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
        }

        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const values = [...fields.map(f => req.body[f]), req.params.id, req.user.id];

        await pool.query(
            `UPDATE events SET ${setClause} WHERE id = ? AND userId = ?`,
            values
        );

        const [updated] = await pool.query(
            'SELECT * FROM events WHERE id = ?',
            [req.params.id]
        );
        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el evento' });
    }
};

// DELETE /api/events/:id
exports.remove = async (req, res) => {
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
        res.status(500).json({ error: 'Error al eliminar el evento' });
    }
};
