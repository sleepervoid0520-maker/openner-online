const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'game.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Iniciando recálculo de estadísticas...\n');

// Primero, reiniciar todos los contadores a 0
db.run('UPDATE weapon_stats SET total_openings = 0, current_existing = 0', (resetErr) => {
  if (resetErr) {
    console.error('❌ Error reiniciando estadísticas:', resetErr);
    process.exit(1);
  }
  
  console.log('✅ Estadísticas reiniciadas a 0\n');
  
  // Contar armas en inventario
  db.all(
    `SELECT weapon_id, COUNT(*) as count 
     FROM inventory 
     GROUP BY weapon_id`,
    [],
    (err, rows) => {
      if (err) {
        console.error('❌ Error contando inventario:', err);
        process.exit(1);
      }
      
      console.log('📊 Conteo de armas en inventario:');
      console.table(rows);
      
      if (!rows || rows.length === 0) {
        console.log('\nℹ️  No hay armas en inventario');
        db.close();
        process.exit(0);
      }
      
      // Actualizar estadísticas para cada arma
      let completed = 0;
      const total = rows.length;
      
      rows.forEach(row => {
        const weaponId = parseInt(row.weapon_id);
        const count = row.count;
        
        db.run(
          `UPDATE weapon_stats 
           SET total_openings = ?, 
               current_existing = ? 
           WHERE weapon_id = ?`,
          [count, count, weaponId],
          function(updateErr) {
            if (updateErr) {
              console.error(`❌ Error actualizando arma ${weaponId}:`, updateErr);
            } else {
              console.log(`✅ Arma ${weaponId}: ${count} aperturas/existentes (${this.changes} filas actualizadas)`);
            }
            
            completed++;
            
            if (completed === total) {
              // Todas las actualizaciones completadas
              console.log('\n📈 Estadísticas finales:');
              db.all('SELECT * FROM weapon_stats WHERE current_existing > 0 OR total_openings > 0', [], (getAllErr, allStats) => {
                if (getAllErr) {
                  console.error('❌ Error obteniendo estadísticas finales:', getAllErr);
                } else {
                  console.table(allStats);
                }
                
                console.log('\n✅ Recálculo completado!');
                db.close();
                process.exit(0);
              });
            }
          }
        );
      });
    }
  );
});
