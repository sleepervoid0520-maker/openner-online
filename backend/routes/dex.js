const express = require('express');
const router = express.Router();
const { query } = require('../database/database-postgres');
const { authenticateToken } = require('../middleware/auth');

// GET - Obtener armas desbloqueadas del usuario
router.get('/unlocked', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const result = await query(`
            SELECT unlocked_weapons 
            FROM users 
            WHERE id = $1
        `, [userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        const user = result.rows[0];
        
        // Parsear el JSON de armas desbloqueadas (si existe)
        let unlockedWeapons = [];
        if (user.unlocked_weapons) {
            try {
                unlockedWeapons = JSON.parse(user.unlocked_weapons);
            } catch (e) {
                console.error('Error parseando armas desbloqueadas:', e);
                unlockedWeapons = [];
            }
        }
        
        res.json({
            success: true,
            unlockedWeapons: unlockedWeapons
        });
    } catch (error) {
        console.error('Error obteniendo armas desbloqueadas:', error);
        res.status(500).json({ error: 'Error al obtener armas desbloqueadas' });
    }
});

// POST - Actualizar armas desbloqueadas del usuario
router.post('/unlock', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { unlockedWeapons } = req.body;
        
        if (!Array.isArray(unlockedWeapons)) {
            return res.status(400).json({ error: 'unlockedWeapons debe ser un array' });
        }
        
        // Convertir a JSON para almacenar
        const weaponsJson = JSON.stringify(unlockedWeapons);
        
        const result = await query(`
            UPDATE users 
            SET unlocked_weapons = $1
            WHERE id = $2
        `, [weaponsJson, userId]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json({
            success: true,
            message: 'Armas desbloqueadas actualizadas correctamente',
            unlockedCount: unlockedWeapons.length
        });
    } catch (error) {
        console.error('Error actualizando armas desbloqueadas:', error);
        res.status(500).json({ error: 'Error al actualizar armas desbloqueadas' });
    }
});

// POST - Desbloquear una arma específica
router.post('/unlock-weapon', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { weaponId } = req.body;
        
        if (!weaponId) {
            return res.status(400).json({ error: 'weaponId es requerido' });
        }
        
        // Obtener armas actuales
        const result = await query(`
            SELECT unlocked_weapons 
            FROM users 
            WHERE id = $1
        `, [userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        const user = result.rows[0];
        
        // Parsear armas actuales
        let unlockedWeapons = [];
        if (user.unlocked_weapons) {
            try {
                unlockedWeapons = JSON.parse(user.unlocked_weapons);
            } catch (e) {
                console.error('Error parseando armas desbloqueadas:', e);
                unlockedWeapons = [];
            }
        }
        
        // Verificar si ya está desbloqueada
        if (unlockedWeapons.includes(weaponId)) {
            return res.json({
                success: true,
                message: 'Arma ya estaba desbloqueada',
                alreadyUnlocked: true
            });
        }
        
        // Agregar nueva arma
        unlockedWeapons.push(weaponId);
        
        // Actualizar en la base de datos
        await query(`
            UPDATE users 
            SET unlocked_weapons = $1
            WHERE id = $2
        `, [JSON.stringify(unlockedWeapons), userId]);
        
        res.json({
            success: true,
            message: 'Arma desbloqueada correctamente',
            weaponId: weaponId,
            alreadyUnlocked: false,
            totalUnlocked: unlockedWeapons.length
        });
    } catch (error) {
        console.error('Error desbloqueando arma:', error);
        res.status(500).json({ error: 'Error al desbloquear arma' });
    }
});

// GET - Obtener progreso del Dex
router.get('/progress', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const result = await query(`
            SELECT unlocked_weapons 
            FROM users 
            WHERE id = $1
        `, [userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        const user = result.rows[0];
        
        // Parsear armas desbloqueadas
        let unlockedWeapons = [];
        if (user.unlocked_weapons) {
            try {
                unlockedWeapons = JSON.parse(user.unlocked_weapons);
            } catch (e) {
                console.error('Error parseando armas desbloqueadas:', e);
                unlockedWeapons = [];
            }
        }
        
        // Importar sistema de armas para obtener total
        const weaponsSystem = require('../../frontend/armas.js');
        const totalWeapons = weaponsSystem.getAllWeapons().length;
        
        const unlockedCount = unlockedWeapons.length;
        const percentage = totalWeapons > 0 ? (unlockedCount / totalWeapons * 100) : 0;
        
        res.json({
            success: true,
            progress: {
                total: totalWeapons,
                unlocked: unlockedCount,
                percentage: percentage.toFixed(2)
            }
        });
    } catch (error) {
        console.error('Error obteniendo progreso del Dex:', error);
        res.status(500).json({ error: 'Error al obtener progreso' });
    }
});

module.exports = router;
