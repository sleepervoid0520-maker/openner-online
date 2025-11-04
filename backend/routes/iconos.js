const express = require('express');
const router = express.Router();
const { db } = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

// GET: Obtener iconos desbloqueados del usuario autenticado
router.get('/unlocked', authenticateToken, async (req, res) => {
    try {
    const userId = req.user.userId;
    // ...existing code...
        db.get('SELECT unlocked_icons FROM users WHERE id = ?', [userId], (err, row) => {
            if (err) {
                // ...existing code...
                return res.status(500).json({ success: false, error: 'Error al obtener iconos desbloqueados' });
            }
            let unlockedIcons = [];
            if (row && row.unlocked_icons) {
                try {
                    unlockedIcons = JSON.parse(row.unlocked_icons);
                } catch (e) {
                    unlockedIcons = [];
                }
            }
            // ...existing code...
            res.json({ success: true, unlocked_icons: unlockedIcons });
        });
    } catch (error) {
    // ...existing code...
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// POST: Actualizar iconos desbloqueados del usuario autenticado
router.post('/unlocked', authenticateToken, async (req, res) => {
    try {
    const userId = req.user.userId;
        const { unlocked_icons } = req.body;
        if (!Array.isArray(unlocked_icons)) {
            return res.status(400).json({ success: false, error: 'Formato inválido para unlocked_icons' });
        }
        const iconsString = JSON.stringify(unlocked_icons);
        db.run('UPDATE users SET unlocked_icons = ? WHERE id = ?', [iconsString, userId], function(err) {
            if (err) {
                return res.status(500).json({ success: false, error: 'Error al actualizar iconos desbloqueados' });
            }
            res.json({ success: true });
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// POST: Seleccionar icono del usuario
router.post('/select', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { icon } = req.body;
        
        if (!icon) {
            return res.status(400).json({ success: false, error: 'Icono no proporcionado' });
        }
        
        db.run('UPDATE users SET selected_icon = ? WHERE id = ?', [icon, userId], function(err) {
            if (err) {
                console.error('Error al actualizar icono seleccionado:', err);
                return res.status(500).json({ success: false, error: 'Error al actualizar icono' });
            }
            res.json({ success: true, message: 'Icono actualizado correctamente' });
        });
    } catch (error) {
        console.error('Error en selección de icono:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

module.exports = router;
