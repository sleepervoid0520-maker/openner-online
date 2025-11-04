const express = require('express');
const router = express.Router();
const { db } = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

// Obtener estadísticas de un arma específica
router.get('/stats/:weaponId', (req, res) => {
  const { weaponId } = req.params;
  
  db.get(
    'SELECT total_openings, current_existing, total_conta_openings, current_conta_existing FROM weapon_stats WHERE weapon_id = ?',
    [weaponId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Error obteniendo estadísticas' });
      }
      
      if (!row) {
        // Si no existe, crear con valores en 0
        db.run(
          'INSERT INTO weapon_stats (weapon_id, total_openings, current_existing, total_conta_openings, current_conta_existing) VALUES (?, 0, 0, 0, 0)',
          [weaponId],
          (insertErr) => {
            if (insertErr) {
              return res.status(500).json({ error: 'Error inicializando estadísticas' });
            }
            res.json({ total_openings: 0, current_existing: 0, total_conta_openings: 0, current_conta_existing: 0 });
          }
        );
      } else {
        res.json(row);
      }
    }
  );
});

// Obtener estadísticas de todas las armas
router.get('/stats', (req, res) => {
  db.all('SELECT * FROM weapon_stats', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error obteniendo estadísticas' });
    }
    res.json(rows);
  });
});

// Incrementar contador cuando se obtiene un arma
router.post('/increment-opening', authenticateToken, (req, res) => {
  const { weaponId, isConta } = req.body;
  
  let query;
  if (isConta) {
    query = `UPDATE weapon_stats 
             SET total_openings = total_openings + 1, 
                 current_existing = current_existing + 1,
                 total_conta_openings = total_conta_openings + 1,
                 current_conta_existing = current_conta_existing + 1
             WHERE weapon_id = ?`;
  } else {
    query = `UPDATE weapon_stats 
             SET total_openings = total_openings + 1, 
                 current_existing = current_existing + 1 
             WHERE weapon_id = ?`;
  }
  
  db.run(query, [weaponId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error actualizando estadísticas' });
      }
      
      // Obtener valores actualizados
      db.get(
        'SELECT total_openings, current_existing, total_conta_openings, current_conta_existing FROM weapon_stats WHERE weapon_id = ?',
        [weaponId],
        (getErr, row) => {
          if (getErr) {
            return res.status(500).json({ error: 'Error obteniendo estadísticas actualizadas' });
          }
          res.json({ 
            success: true, 
            stats: row 
          });
        }
      );
    }
  );
});

// Decrementar contador cuando se vende un arma
router.post('/decrement-existing', authenticateToken, (req, res) => {
  const { weaponId, isConta } = req.body;
  
  let query;
  if (isConta) {
    query = `UPDATE weapon_stats 
             SET current_existing = CASE 
               WHEN current_existing > 0 THEN current_existing - 1 
               ELSE 0 
             END,
             current_conta_existing = CASE 
               WHEN current_conta_existing > 0 THEN current_conta_existing - 1 
               ELSE 0 
             END 
             WHERE weapon_id = ?`;
  } else {
    query = `UPDATE weapon_stats 
             SET current_existing = CASE 
               WHEN current_existing > 0 THEN current_existing - 1 
               ELSE 0 
             END 
             WHERE weapon_id = ?`;
  }
  
  db.run(query, [weaponId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error actualizando estadísticas' });
      }
      
      // Obtener valores actualizados
      db.get(
        'SELECT total_openings, current_existing, total_conta_openings, current_conta_existing FROM weapon_stats WHERE weapon_id = ?',
        [weaponId],
        (getErr, row) => {
          if (getErr) {
            return res.status(500).json({ error: 'Error obteniendo estadísticas actualizadas' });
          }
          res.json({ 
            success: true, 
            stats: row 
          });
        }
      );
    }
  );
});

module.exports = router;
