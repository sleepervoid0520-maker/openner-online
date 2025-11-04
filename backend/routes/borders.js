const express = require('express');
const router = express.Router();
const { query } = require('../database/database-postgres');
const { authenticateToken } = require('../middleware/auth');

// ===== OBTENER BORDES DESBLOQUEADOS =====
router.get('/unlocked', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const result = await query(
            'SELECT border_id FROM unlocked_borders WHERE user_id = $1',
            [userId]
        );
        
        const unlockedBorders = result.rows.map(row => row.border_id);
        
        res.json({
            success: true,
            unlocked_borders: unlockedBorders
        });
    } catch (error) {
        console.error('Error al obtener bordes desbloqueados:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cargar bordes desbloqueados'
        });
    }
});

// ===== SELECCIONAR BORDE =====
router.post('/select', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { border_id } = req.body;
        
        if (!border_id) {
            return res.status(400).json({
                success: false,
                message: 'ID de borde requerido'
            });
        }
        
        // Verificar si el borde está desbloqueado (excepto 'none')
        if (border_id !== 'none') {
            const result = await query(
                'SELECT 1 FROM unlocked_borders WHERE user_id = $1 AND border_id = $2',
                [userId, border_id]
            );
            
            if (result.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Borde no desbloqueado'
                });
            }
        }
        
        // Actualizar borde seleccionado
        await query(
            'UPDATE users SET selected_border = $1 WHERE id = $2',
            [border_id, userId]
        );
        
        res.json({
            success: true,
            message: 'Borde seleccionado correctamente',
            selected_border: border_id
        });
    } catch (error) {
        console.error('Error al seleccionar borde:', error);
        res.status(500).json({
            success: false,
            message: 'Error al seleccionar borde'
        });
    }
});

// ===== DESBLOQUEAR BORDE =====
router.post('/unlock', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { border_id } = req.body;
        
        if (!border_id) {
            return res.status(400).json({
                success: false,
                message: 'ID de borde requerido'
            });
        }
        
        // Verificar si ya está desbloqueado
        const result = await query(
            'SELECT 1 FROM unlocked_borders WHERE user_id = $1 AND border_id = $2',
            [userId, border_id]
        );
        
        if (result.rows.length > 0) {
            return res.json({
                success: true,
                message: 'Borde ya estaba desbloqueado',
                already_unlocked: true
            });
        }
        
        // Desbloquear borde
        await query(
            'INSERT INTO unlocked_borders (user_id, border_id) VALUES ($1, $2)',
            [userId, border_id]
        );
        
        res.json({
            success: true,
            message: 'Borde desbloqueado correctamente',
            border_id: border_id
        });
    } catch (error) {
        console.error('Error al desbloquear borde:', error);
        res.status(500).json({
            success: false,
            message: 'Error al desbloquear borde'
        });
    }
});

// ===== OBTENER BORDE SELECCIONADO =====
router.get('/selected', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const result = await query(
            'SELECT selected_border FROM users WHERE id = $1',
            [userId]
        );
        
        const selectedBorder = result.rows[0]?.selected_border || 'none';
        
        res.json({
            success: true,
            selected_border: selectedBorder
        });
    } catch (error) {
        console.error('Error al obtener borde seleccionado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener borde seleccionado'
        });
    }
});

// ===== RESETEAR TODOS LOS BORDES (PARA TESTING) =====
router.post('/reset', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Eliminar todos los bordes desbloqueados del usuario
        await query(
            'DELETE FROM unlocked_borders WHERE user_id = $1',
            [userId]
        );
        
        // Resetear borde seleccionado a 'none'
        await query(
            'UPDATE users SET selected_border = $1 WHERE id = $2',
            ['none', userId]
        );
        
        res.json({
            success: true,
            message: 'Bordes reseteados correctamente'
        });
    } catch (error) {
        console.error('Error al resetear bordes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al resetear bordes'
        });
    }
});

module.exports = router;
