const pool = require('../db/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const SALT_ROUNDS = 12;
const shouldLogControllers = String(process.env.LOG_CONTROLLERS || '').toLowerCase() === 'true';

const logAuth = (action, data) => {
  if (!shouldLogControllers) return;
  console.log('[auth]', action, data);
};

// POST /api/auth/register
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { name, email, password } = req.body;
    logAuth('register request', { name, email });

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Este email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    const token = jwt.sign(
      { id: result.insertId, email, name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Usuario registrado correctamente',
      token,
      user: { id: result.insertId, name, email },
    });
  } catch (error) {
    console.error('Error en registro:', error.message || error);
    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    logAuth('login request', { email });

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login correcto',
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Error en login:', error.message || error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// GET /api/auth/me
exports.me = async (req, res) => {
  try {
    logAuth('me request', { userId: req.user?.id });
    const [rows] = await pool.query(
      'SELECT id, name, email, createdAt FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error en me:', error.message || error);
    res.status(500).json({ error: 'Error al obtener el perfil' });
  }
};
