const express = require('express');
const router = express.Router();
const { query } = require('../database/database-postgres');
const { authenticateToken } = require('../middleware/auth');

// GET: Obtener iconos desbloqueados del usuario autenticado
router.get('/unlocked', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await query('SELECT unlocked_icons FROM users WHERE id = $1', [userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }

        let unlockedIcons = [];
        if (result.rows[0] && result.rows[0].unlocked_icons) {
            try {
                unlockedIcons = JSON.parse(result.rows[0].unlocked_icons);
            } catch (e) {
                unlockedIcons = [];
            }
        }
        res.json({ success: true, unlocked_icons: unlockedIcons });
    } catch (error) {
        console.error('Error obteniendo iconos:', error);
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
        await query('UPDATE users SET unlocked_icons = $1 WHERE id = $2', [iconsString, userId]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error actualizando iconos:', error);
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
        
        await query('UPDATE users SET selected_icon = $1 WHERE id = $2', [icon, userId]);
        res.json({ success: true, message: 'Icono actualizado correctamente' });
    } catch (error) {
        console.error('Error en selección de icono:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

module.exports = router;
