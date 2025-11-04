const express = require('express');
const router = express.Router();
const { db } = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

// ===== OBTENER BORDES DESBLOQUEADOS =====
router.get('/unlocked', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    
    db.all(
        'SELECT border_id FROM unlocked_borders WHERE user_id = ?',
        [userId],
        (err, rows) => {
            if (err) {
                console.error('Error al obtener bordes desbloqueados:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error al cargar bordes desbloqueados'
                });
            }
            
            const unlockedBorders = rows.map(row => row.border_id);
            
            res.json({
                success: true,
                unlocked_borders: unlockedBorders
            });
        }
    );
});

// ===== SELECCIONAR BORDE =====
router.post('/select', authenticateToken, (req, res) => {
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
        db.get(
            'SELECT 1 FROM unlocked_borders WHERE user_id = ? AND border_id = ?',
            [userId, border_id],
            (err, row) => {
                if (err) {
                    console.error('Error al verificar borde:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error al verificar borde'
                    });
                }
                
                if (!row) {
                    return res.status(403).json({
                        success: false,
                        message: 'Borde no desbloqueado'
                    });
                }
                
                // Actualizar borde seleccionado
                updateSelectedBorder(userId, border_id, res);
            }
        );
    } else {
        // Si es 'none', actualizar directamente
        updateSelectedBorder(userId, border_id, res);
    }
});

function updateSelectedBorder(userId, border_id, res) {
    db.run(
        'UPDATE users SET selected_border = ? WHERE id = ?',
        [border_id, userId],
        (err) => {
            if (err) {
                console.error('Error al seleccionar borde:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error al seleccionar borde'
                });
            }
            
            res.json({
                success: true,
                message: 'Borde seleccionado correctamente',
                selected_border: border_id
            });
        }
    );
}

// ===== DESBLOQUEAR BORDE =====
router.post('/unlock', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const { border_id } = req.body;
    
    if (!border_id) {
        return res.status(400).json({
            success: false,
            message: 'ID de borde requerido'
        });
    }
    
    // Verificar si ya está desbloqueado
    db.get(
        'SELECT 1 FROM unlocked_borders WHERE user_id = ? AND border_id = ?',
        [userId, border_id],
        (err, row) => {
            if (err) {
                console.error('Error al verificar borde:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error al desbloquear borde'
                });
            }
            
            if (row) {
                return res.json({
                    success: true,
                    message: 'Borde ya estaba desbloqueado',
                    already_unlocked: true
                });
            }
            
            // Desbloquear borde
            db.run(
                'INSERT INTO unlocked_borders (user_id, border_id) VALUES (?, ?)',
                [userId, border_id],
                (err) => {
                    if (err) {
                        console.error('Error al desbloquear borde:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Error al desbloquear borde'
                        });
                    }
                    
                    res.json({
                        success: true,
                        message: 'Borde desbloqueado correctamente',
                        border_id: border_id
                    });
                }
            );
        }
    );
});

// ===== OBTENER BORDE SELECCIONADO =====
router.get('/selected', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    
    db.get(
        'SELECT selected_border FROM users WHERE id = ?',
        [userId],
        (err, row) => {
            if (err) {
                console.error('Error al obtener borde seleccionado:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error al obtener borde seleccionado'
                });
            }
            
            const selectedBorder = row?.selected_border || 'none';
            
            res.json({
                success: true,
                selected_border: selectedBorder
            });
        }
    );
});

// ===== RESETEAR TODOS LOS BORDES (PARA TESTING) =====
router.post('/reset', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    
    // Eliminar todos los bordes desbloqueados del usuario
    db.run(
        'DELETE FROM unlocked_borders WHERE user_id = ?',
        [userId],
        (err) => {
            if (err) {
                console.error('Error al resetear bordes:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error al resetear bordes'
                });
            }
            
            // Resetear borde seleccionado a 'none'
            db.run(
                'UPDATE users SET selected_border = ? WHERE id = ?',
                ['none', userId],
                (err) => {
                    if (err) {
                        console.error('Error al actualizar borde seleccionado:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Error al resetear borde seleccionado'
                        });
                    }
                    
                    res.json({
                        success: true,
                        message: 'Bordes reseteados correctamente'
                    });
                }
            );
        }
    );
});

module.exports = router;
