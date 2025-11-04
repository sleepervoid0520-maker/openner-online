// Script para actualizar weapon_type en tablas existentes
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'game.db');
const db = new sqlite3.Database(dbPath);

// Mapeo de weapon_id a weapon_type
const weaponTypeMap = {
    1: 'Pistola',        // Beretta 92FS Manzana
    2: 'Rifle',          // Galil ACE Arena
    3: 'Pistola',        // Glock-17 Cereza
    4: 'SMG',            // MP5 Militar
    5: 'Escopeta',       // Remington 870 Celeste
    6: 'Sniper Rifle',   // SSG 08 Cazador Morado
    7: 'Escopeta',       // Beretta 1301 Arena
    8: 'Pistola',        // Sig Sauer P226 Limon
    9: 'Rifle',          // Famas Militar
    10: 'Pistola',       // Glock 26 Navideña
    11: 'Sniper Rifle',  // G3SG1 Milicia
    12: 'Rifle',         // AR-10 Esmeralda
    13: 'Rifle',         // M16A4 Noche Lunar
    14: 'Pistola',       // Desert Eagle Sonriente
    15: 'Rifle',         // AK 47 Fuego Artificial
    16: 'Sniper Rifle'   // AWP Flama
};

console.log('🔄 Iniciando actualización de weapon_type...\n');

db.serialize(() => {
    // Actualizar inventory
    console.log('📦 Actualizando tabla inventory...');
    let inventoryUpdated = 0;
    Object.keys(weaponTypeMap).forEach(weaponId => {
        const weaponType = weaponTypeMap[weaponId];
        db.run(
            `UPDATE inventory SET weapon_type = ? WHERE weapon_id = ? AND weapon_type IS NULL`,
            [weaponType, weaponId],
            function(err) {
                if (err) {
                    console.error(`❌ Error actualizando weapon_id ${weaponId}:`, err);
                } else if (this.changes > 0) {
                    inventoryUpdated += this.changes;
                    console.log(`✅ Inventory: ${this.changes} armas actualizadas para weapon_id ${weaponId} (${weaponType})`);
                }
            }
        );
    });

    // Actualizar market_listings
    console.log('\n🏪 Actualizando tabla market_listings...');
    let marketUpdated = 0;
    Object.keys(weaponTypeMap).forEach(weaponId => {
        const weaponType = weaponTypeMap[weaponId];
        db.run(
            `UPDATE market_listings SET weapon_type = ? WHERE weapon_id = ? AND weapon_type IS NULL`,
            [weaponType, weaponId],
            function(err) {
                if (err) {
                    console.error(`❌ Error actualizando weapon_id ${weaponId}:`, err);
                } else if (this.changes > 0) {
                    marketUpdated += this.changes;
                    console.log(`✅ Market: ${this.changes} listings actualizados para weapon_id ${weaponId} (${weaponType})`);
                }
            }
        );
    });

    // Esperar un momento y mostrar resumen
    setTimeout(() => {
        console.log('\n📊 Resumen de actualización:');
        db.get('SELECT COUNT(*) as total FROM inventory WHERE weapon_type IS NOT NULL', (err, row) => {
            if (!err) console.log(`   Inventory: ${row.total} armas con tipo`);
        });
        db.get('SELECT COUNT(*) as total FROM market_listings WHERE weapon_type IS NOT NULL', (err, row) => {
            if (!err) console.log(`   Market: ${row.total} listings con tipo`);
        });
        
        setTimeout(() => {
            console.log('\n✅ Actualización completada!');
            db.close();
        }, 500);
    }, 2000);
});
