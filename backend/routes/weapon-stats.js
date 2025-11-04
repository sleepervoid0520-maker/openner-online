const express = require('express');
const router = express.Router();
const { query } = require('../database/database-postgres');
const { authenticateToken } = require('../middleware/auth');

// Obtener estadísticas de un arma específica
router.get('/stats/:weaponId', async (req, res) => {
  try {
    const { weaponId } = req.params;
    
    const result = await query(
      'SELECT total_openings, current_existing, total_conta_openings, current_conta_existing FROM weapon_stats WHERE weapon_id = $1',
      [weaponId]
    );
    
    if (result.rows.length === 0) {
      // Si no existe, crear con valores en 0
      await query(
        'INSERT INTO weapon_stats (weapon_id, total_openings, current_existing, total_conta_openings, current_conta_existing) VALUES ($1, 0, 0, 0, 0)',
        [weaponId]
      );
      res.json({ total_openings: 0, current_existing: 0, total_conta_openings: 0, current_conta_existing: 0 });
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

// Obtener estadísticas de todas las armas
router.get('/stats', async (req, res) => {
  try {
    const result = await query('SELECT * FROM weapon_stats', []);
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

// Incrementar contador cuando se obtiene un arma
router.post('/increment-opening', authenticateToken, async (req, res) => {
  try {
    const { weaponId, isConta } = req.body;
    
    let updateQuery;
    if (isConta) {
      updateQuery = `UPDATE weapon_stats 
               SET total_openings = total_openings + 1, 
                   current_existing = current_existing + 1,
                   total_conta_openings = total_conta_openings + 1,
                   current_conta_existing = current_conta_existing + 1
               WHERE weapon_id = $1`;
    } else {
      updateQuery = `UPDATE weapon_stats 
               SET total_openings = total_openings + 1, 
                   current_existing = current_existing + 1 
               WHERE weapon_id = $1`;
    }
    
    await query(updateQuery, [weaponId]);
    
    // Obtener valores actualizados
    const result = await query(
      'SELECT total_openings, current_existing, total_conta_openings, current_conta_existing FROM weapon_stats WHERE weapon_id = $1',
      [weaponId]
    );
    
    res.json({ 
      success: true, 
      stats: result.rows[0]
    });
  } catch (error) {
    console.error('Error actualizando estadísticas:', error);
    res.status(500).json({ error: 'Error actualizando estadísticas' });
  }
});

// Decrementar contador cuando se vende un arma
router.post('/decrement-existing', authenticateToken, async (req, res) => {
  try {
    const { weaponId, isConta } = req.body;
    
    let updateQuery;
    if (isConta) {
      updateQuery = `UPDATE weapon_stats 
               SET current_existing = CASE 
                 WHEN current_existing > 0 THEN current_existing - 1 
                 ELSE 0 
               END,
               current_conta_existing = CASE 
                 WHEN current_conta_existing > 0 THEN current_conta_existing - 1 
                 ELSE 0 
               END 
               WHERE weapon_id = $1`;
    } else {
      updateQuery = `UPDATE weapon_stats 
               SET current_existing = CASE 
                 WHEN current_existing > 0 THEN current_existing - 1 
                 ELSE 0 
               END 
               WHERE weapon_id = $1`;
    }
    
    await query(updateQuery, [weaponId]);
    
    // Obtener valores actualizados
    const result = await query(
      'SELECT total_openings, current_existing, total_conta_openings, current_conta_existing FROM weapon_stats WHERE weapon_id = $1',
      [weaponId]
    );
    
    res.json({ 
      success: true, 
      stats: result.rows[0]
    });
  } catch (error) {
    console.error('Error actualizando estadísticas:', error);
    res.status(500).json({ error: 'Error actualizando estadísticas' });
  }
});

module.exports = router;
