// Script para migrar rutas de SQLite a PostgreSQL
// Este script contiene las instrucciones de cambio para los archivos restantes

/*
ARCHIVOS PENDIENTES DE ACTUALIZAR:
1. player-profile.js
2. iconos.js
3. borders.js
4. dex.js
5. game.js
6. recalculate-stats.js
7. boxes.js (MUY COMPLEJO)
8. inventory.js (MUY COMPLEJO)
9. market.js (MUY COMPLEJO)

CAMBIOS NECESARIOS:
1. Cambiar: const { db } = require('../database/database');
   Por: const { query } = require('../database/database-postgres');

2. Convertir callbacks a async/await
3. Cambiar placeholders ? por $1, $2, $3, etc.
4. Cambiar db.get() por await query().then(result => result.rows[0])
5. Cambiar db.all() por await query().then(result => result.rows)
6. Cambiar db.run() por await query()
7. Cambiar this.lastID por result.rows[0].id con RETURNING id
8. Cambiar this.changes por result.rowCount
*/

console.log('Ver este archivo para instrucciones de migración manual');
