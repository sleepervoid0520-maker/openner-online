const express = require('express');
const router = express.Router();
const { db } = require('../database/database');

// Endpoint para recalcular todas las estadísticas
router.post('/recalculate', (req, res) => {
  console.log('🔄 Iniciando recálculo de estadísticas...');
  
  // Primero, reiniciar todos los contadores a 0
  db.run('UPDATE weapon_stats SET total_openings = 0, current_existing = 0, total_conta_openings = 0, current_conta_existing = 0', (resetErr) => {
    if (resetErr) {
      console.error('Error reiniciando estadísticas:', resetErr);
      return res.status(500).json({ error: 'Error reiniciando estadísticas' });
    }
    
    console.log('✅ Estadísticas reiniciadas a 0');
    
    // Contar armas en inventario (totales y Conta)
    db.all(
      `SELECT weapon_id, 
              COUNT(*) as total_count,
              SUM(CASE WHEN is_conta = 1 THEN 1 ELSE 0 END) as conta_count
       FROM inventory 
       GROUP BY weapon_id`,
      [],
      (err, rows) => {
        if (err) {
          console.error('Error contando inventario:', err);
          return res.status(500).json({ error: 'Error contando inventario' });
        }
        
        console.log('📊 Conteo de armas en inventario:', rows);
        
        if (!rows || rows.length === 0) {
          console.log('ℹ️ No hay armas en inventario');
          return res.json({ 
            success: true, 
            message: 'Estadísticas recalculadas (sin armas en inventario)' 
          });
        }
        
        // Actualizar estadísticas para cada arma
        let completed = 0;
        const total = rows.length;
        
        rows.forEach(row => {
          const weaponId = parseInt(row.weapon_id);
          const totalCount = row.total_count;
          const contaCount = row.conta_count || 0;
          
          db.run(
            `UPDATE weapon_stats 
             SET total_openings = ?, 
                 current_existing = ?,
                 total_conta_openings = ?,
                 current_conta_existing = ?
             WHERE weapon_id = ?`,
            [totalCount, totalCount, contaCount, contaCount, weaponId],
            (updateErr) => {
              if (updateErr) {
                console.error(`Error actualizando arma ${weaponId}:`, updateErr);
              } else {
                console.log(`✅ Arma ${weaponId}: ${totalCount} totales (${contaCount} Conta)`);
              }
              
              completed++;
              
              if (completed === total) {
                // Todas las actualizaciones completadas
                db.all('SELECT * FROM weapon_stats', [], (getAllErr, allStats) => {
                  if (getAllErr) {
                    console.error('Error obteniendo estadísticas finales:', getAllErr);
                  } else {
                    console.log('📈 Estadísticas finales:', allStats);
                  }
                  
                  res.json({ 
                    success: true, 
                    message: 'Estadísticas recalculadas correctamente',
                    stats: allStats
                  });
                });
              }
            }
          );
        });
      }
    );
  });
});

module.exports = router;
