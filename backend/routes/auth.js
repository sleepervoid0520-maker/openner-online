const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database/database');
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
    db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Error en la base de datos' });
      }

      if (row) {
        return res.status(409).json({ error: 'Usuario o email ya existe' });
      }

      // Crear usuario
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Icono por defecto desbloqueado
      const defaultIcons = JSON.stringify(["/arma/glock 17 cereza.png"]);
      db.run(
        `INSERT INTO users (
          username, email, password_hash, unlocked_icons,
          level, experience, money,
          mayor_costo_armas, suerte, menor_costo_cajas_percent,
          mayor_exp_caja_percent, mayor_probabilidad_grado,
          dinero_por_segundo, dinero_por_segundo_porcentaje
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          username, email, hashedPassword, defaultIcons,
          1, 0, 1000, // level, experience, money inicial
          0, 0, 0,    // mayor_costo_armas, suerte, menor_costo_cajas_percent
          0, 0,       // mayor_exp_caja_percent, mayor_probabilidad_grado
          0, 0        // dinero_por_segundo, dinero_por_segundo_porcentaje
        ],
        function(err) {
          if (err) {
            console.error('Error al crear usuario:', err);
            return res.status(500).json({ error: 'Error al crear usuario' });
          }

          const token = jwt.sign({ userId: this.lastID, username }, JWT_SECRET, { expiresIn: '7d' });

          res.json({
            success: true,
            message: 'Usuario creado exitosamente',
            token,
            user: {
              id: this.lastID,
              username,
              email,
              level: 1,
              experience: 0,
              money: 1000,
              created_at: new Date().toISOString()
            }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Error en la base de datos' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Si unlocked_icons es null o vacío, inicializarlo con el icono por defecto
    if (!user.unlocked_icons || user.unlocked_icons === 'null' || user.unlocked_icons === '[]') {
      const defaultIcons = JSON.stringify(["/arma/glock 17 cereza.png"]);
      db.run('UPDATE users SET unlocked_icons = ? WHERE id = ?', [defaultIcons, user.id]);
      user.unlocked_icons = defaultIcons;
    }

    // Actualizar último login
    db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

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
  });
});

// Verificar token
router.get('/verify', authenticateToken, (req, res) => {
  db.get('SELECT * FROM users WHERE id = ?', [req.user.userId], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

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
  });
});

// Añadir dinero al usuario
router.post('/add-money', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Cantidad inválida' });
  }

  db.run('UPDATE users SET money = money + ? WHERE id = ?', [amount, userId], function(err) {
    if (err) {
      console.error('❌ [BACKEND] Error añadiendo dinero:', err);
      return res.status(500).json({ success: false, error: 'Error del servidor' });
    }

    if (this.changes === 0) {
      console.error('❌ [BACKEND] Usuario no encontrado:', userId);
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    res.json({
      success: true,
      message: `$${amount} añadido al saldo`,
      newBalance: null // El frontend ya maneja el balance localmente
    });
  });
});

module.exports = router;