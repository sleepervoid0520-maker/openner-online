const express = require('express');
const router = express.Router();
const { query } = require('../database/database-postgres');
const { authenticateToken } = require('../middleware/auth');

// GET - Obtener armas desbloqueadas del usuario
router.get('/unlocked', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    
    db.get(`
        SELECT unlocked_weapons 
        FROM users 
        WHERE id = ?
    `, [userId], (err, user) => {
        if (err) {
            console.error('Error obteniendo armas desbloqueadas:', err);
            return res.status(500).json({ error: 'Error al obtener armas desbloqueadas' });
        }
        
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
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
    });
});

// POST - Actualizar armas desbloqueadas del usuario
router.post('/unlock', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const { unlockedWeapons } = req.body;
    
    if (!Array.isArray(unlockedWeapons)) {
        return res.status(400).json({ error: 'unlockedWeapons debe ser un array' });
    }
    
    // Convertir a JSON para almacenar
    const weaponsJson = JSON.stringify(unlockedWeapons);
    
    db.run(`
        UPDATE users 
        SET unlocked_weapons = ?
        WHERE id = ?
    `, [weaponsJson, userId], function(err) {
        if (err) {
            console.error('Error actualizando armas desbloqueadas:', err);
            return res.status(500).json({ error: 'Error al actualizar armas desbloqueadas' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json({
            success: true,
            message: 'Armas desbloqueadas actualizadas correctamente',
            unlockedCount: unlockedWeapons.length
        });
    });
});

// POST - Desbloquear una arma específica
router.post('/unlock-weapon', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const { weaponId } = req.body;
    
    if (!weaponId) {
        return res.status(400).json({ error: 'weaponId es requerido' });
    }
    
    // Obtener armas actuales
    db.get(`
        SELECT unlocked_weapons 
        FROM users 
        WHERE id = ?
    `, [userId], (err, user) => {
        if (err) {
            console.error('Error obteniendo usuario:', err);
            return res.status(500).json({ error: 'Error al desbloquear arma' });
        }
        
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
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
        db.run(`
            UPDATE users 
            SET unlocked_weapons = ?
            WHERE id = ?
        `, [JSON.stringify(unlockedWeapons), userId], function(updateErr) {
            if (updateErr) {
                console.error('Error actualizando armas:', updateErr);
                return res.status(500).json({ error: 'Error al desbloquear arma' });
            }
            
            res.json({
                success: true,
                message: 'Arma desbloqueada correctamente',
                weaponId: weaponId,
                alreadyUnlocked: false,
                totalUnlocked: unlockedWeapons.length
            });
        });
    });
});

// GET - Obtener progreso del Dex
router.get('/progress', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    
    db.get(`
        SELECT unlocked_weapons 
        FROM users 
        WHERE id = ?
    `, [userId], (err, user) => {
        if (err) {
            console.error('Error obteniendo progreso del Dex:', err);
            return res.status(500).json({ error: 'Error al obtener progreso' });
        }
        
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
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
    });
});

module.exports = router;
