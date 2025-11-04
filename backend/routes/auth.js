const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../database/database-postgres');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Registro
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar si usuario existe
    const existingUser = await query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Usuario o email ya existe' });
    }

    // Crear usuario
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Icono por defecto desbloqueado
    const defaultIcons = JSON.stringify(["/arma/glock 17 cereza.png"]);
    
    const result = await query(
      `INSERT INTO users (
        username, email, password_hash, unlocked_icons,
        level, experience, money,
        mayor_costo_armas, suerte, menor_costo_cajas_percent,
        mayor_exp_caja_percent, mayor_probabilidad_grado,
        dinero_por_segundo, dinero_por_segundo_porcentaje
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
      [
        username, email, hashedPassword, defaultIcons,
  1, 0, 0, // level, experience, money inicial
        0, 0, 0,    // mayor_costo_armas, suerte, menor_costo_cajas_percent
        0, 0,       // mayor_exp_caja_percent, mayor_probabilidad_grado
        0, 0        // dinero_por_segundo, dinero_por_segundo_porcentaje
      ]
    );

    // No devolver token ni loguear automáticamente
    res.json({
      success: true,
      message: 'Registro exitoso. Ahora puedes iniciar sesión.'
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const result = await query('SELECT * FROM users WHERE username = $1 OR email = $1', [username]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Si unlocked_icons es null o vacío, inicializarlo con el icono por defecto
    if (!user.unlocked_icons || user.unlocked_icons === 'null' || user.unlocked_icons === '[]') {
      const defaultIcons = JSON.stringify(["/arma/glock 17 cereza.png"]);
      await query('UPDATE users SET unlocked_icons = $1 WHERE id = $2', [defaultIcons, user.id]);
      user.unlocked_icons = defaultIcons;
    }

    // Actualizar último login
    await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        level: user.level,
        experience: user.experience,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Verificar token
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [req.user.userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        level: user.level,
        experience: user.experience,
        money: user.money || 0,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Error en verify:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
});

// Añadir dinero al usuario
router.post('/add-money', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Cantidad inválida' });
    }

    const result = await query('UPDATE users SET money = money + $1 WHERE id = $2', [amount, userId]);

    if (result.rowCount === 0) {
      console.error('❌ [BACKEND] Usuario no encontrado:', userId);
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    res.json({
      success: true,
      message: `$${amount} añadido al saldo`,
      newBalance: null // El frontend ya maneja el balance localmente
    });
  } catch (error) {
    console.error('❌ [BACKEND] Error añadiendo dinero:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

module.exports = router;