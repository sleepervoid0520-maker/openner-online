const express = require('express');
const router = express.Router();
const { query } = require('../database/database-postgres');

// Endpoint para recalcular todas las estadísticas
router.post('/recalculate', async (req, res) => {
  try {
    console.log('🔄 Iniciando recálculo de estadísticas...');
    
    // Primero, reiniciar todos los contadores a 0
    await query('UPDATE weapon_stats SET total_openings = 0, current_existing = 0, total_conta_openings = 0, current_conta_existing = 0', []);
    console.log('✅ Estadísticas reiniciadas a 0');
    
    // Contar armas en inventario (totales y Conta)
    const result = await query(
      `SELECT weapon_id, 
              COUNT(*) as total_count,
              SUM(CASE WHEN is_conta = 1 THEN 1 ELSE 0 END) as conta_count
       FROM inventory 
       GROUP BY weapon_id`,
      []
    );
    
    const rows = result.rows;
    console.log('📊 Conteo de armas en inventario:', rows);
    
    if (!rows || rows.length === 0) {
      console.log('ℹ️ No hay armas en inventario');
      return res.json({ 
        success: true, 
        message: 'Estadísticas recalculadas (sin armas en inventario)' 
      });
    }
    
    // Actualizar estadísticas para cada arma
    for (const row of rows) {
      const weaponId = parseInt(row.weapon_id);
      const totalCount = parseInt(row.total_count);
      const contaCount = parseInt(row.conta_count) || 0;
      
      await query(
        `UPDATE weapon_stats 
         SET total_openings = $1, 
             current_existing = $2,
             total_conta_openings = $3,
             current_conta_existing = $4
         WHERE weapon_id = $5`,
        [totalCount, totalCount, contaCount, contaCount, weaponId]
      );
      
      console.log(`✅ Arma ${weaponId}: ${totalCount} totales (${contaCount} Conta)`);
    }
    
    // Obtener estadísticas finales
    const allStatsResult = await query('SELECT * FROM weapon_stats', []);
    console.log('📈 Estadísticas finales:', allStatsResult.rows);
    
    res.json({ 
      success: true, 
      message: 'Estadísticas recalculadas correctamente',
      stats: allStatsResult.rows
    });
  } catch (error) {
    console.error('Error recalculando estadísticas:', error);
    res.status(500).json({ error: 'Error recalculando estadísticas' });
  }
});

module.exports = router;
