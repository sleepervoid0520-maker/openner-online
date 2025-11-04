const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'game.db');
const db = new sqlite3.Database(dbPath);

// Inicializar base de datos
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabla de usuarios
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          level INTEGER DEFAULT 1,
          experience INTEGER DEFAULT 0,
          money DECIMAL(10,2) DEFAULT 0.00,
          mayor_costo_armas INTEGER DEFAULT 0,
          suerte INTEGER DEFAULT 0,
          menor_costo_cajas_percent DECIMAL(5,2) DEFAULT 0.00,
          mayor_exp_caja_percent DECIMAL(5,2) DEFAULT 0.00,
          mayor_probabilidad_grado INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creando tabla users:', err);
          reject(err);
        } else {
          console.log('✅ Tabla de usuarios creada correctamente');
          
          // Agregar columna money si no existe (para usuarios existentes)
          db.run(`ALTER TABLE users ADD COLUMN money DECIMAL(10,2) DEFAULT 0.00`, (alterErr) => {
            // Ignorar error si la columna ya existe
            if (alterErr && !alterErr.message.includes('duplicate column')) {
              console.error('Error añadiendo columna money:', alterErr);
            }
          });
          
          // Agregar columnas de pasivas si no existen
          const passiveColumns = [
            'mayor_costo_armas INTEGER DEFAULT 0',
            'suerte INTEGER DEFAULT 0',
            'menor_costo_cajas_percent DECIMAL(5,2) DEFAULT 0.00',
            'mayor_exp_caja_percent DECIMAL(5,2) DEFAULT 0.00',
            'mayor_probabilidad_grado INTEGER DEFAULT 0',
            'dinero_por_segundo DECIMAL(10,2) DEFAULT 0.00',
            'dinero_por_segundo_porcentaje DECIMAL(10,2) DEFAULT 0.00',
            'selected_icon VARCHAR(255) DEFAULT "/arma/glock 17 cereza.png"',
            'selected_border VARCHAR(50) DEFAULT "none"'
          ];
          // Normalizar valores NULL en columna dinero_por_segundo para usuarios existentes
          db.run(`UPDATE users SET dinero_por_segundo = 0.00 WHERE dinero_por_segundo IS NULL`, (updErr) => {
            if (updErr) {
              console.warn('⚠️  No se pudo normalizar dinero_por_segundo de usuarios existentes:', updErr.message);
            } else {
              console.log('💾 dinero_por_segundo normalizado a 0.00 para usuarios con NULL');
            }
          });
          
          passiveColumns.forEach(columnDef => {
            const columnName = columnDef.split(' ')[0];
            db.run(`ALTER TABLE users ADD COLUMN ${columnDef}`, (alterErr) => {
              if (alterErr && !alterErr.message.includes('duplicate column')) {
                console.error(`Error añadiendo columna ${columnName}:`, alterErr);
              } else {
                console.log(`✅ Columna ${columnName} verificada`);
              }
            });
          });
        }
      });

      // Tabla de inventario
      db.run(`
        CREATE TABLE IF NOT EXISTS inventory (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          weapon_id VARCHAR(50) NOT NULL,
          name VARCHAR(100) NOT NULL,
          rarity TEXT NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          image VARCHAR(255) NOT NULL,
          quality TEXT,
          final_price DECIMAL(10,2),
          obtained_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creando tabla inventory:', err);
          reject(err);
        } else {
          console.log('✅ Tabla de inventario creada correctamente');
          
          // Añadir columnas de calidad si no existen (para inventarios existentes)
          db.run(`ALTER TABLE inventory ADD COLUMN quality TEXT`, (alterErr) => {
            if (alterErr && !alterErr.message.includes('duplicate column')) {
              console.error('Error añadiendo columna quality:', alterErr);
            }
          });
          db.run(`ALTER TABLE inventory ADD COLUMN final_price DECIMAL(10,2)`, (alterErr) => {
            if (alterErr && !alterErr.message.includes('duplicate column')) {
              console.error('Error añadiendo columna final_price:', alterErr);
            }
          });
          // Añadir columnas de pasivas si no existen
          db.run(`ALTER TABLE inventory ADD COLUMN pasiva_tipo TEXT`, (alterErr) => {
            if (alterErr && !alterErr.message.includes('duplicate column')) {
              console.error('Error añadiendo columna pasiva_tipo:', alterErr);
            }
          });
          db.run(`ALTER TABLE inventory ADD COLUMN pasiva_valor DECIMAL(10,4)`, (alterErr) => {
            if (alterErr && !alterErr.message.includes('duplicate column')) {
              console.error('Error añadiendo columna pasiva_valor:', alterErr);
            }
          });
          db.run(`ALTER TABLE inventory ADD COLUMN pasiva_stackeable INTEGER DEFAULT 0`, (alterErr) => {
            if (alterErr && !alterErr.message.includes('duplicate column')) {
              console.error('Error añadiendo columna pasiva_stackeable:', alterErr);
            }
          });
          
          db.run(`ALTER TABLE inventory ADD COLUMN is_conta INTEGER DEFAULT 0`, (alterErr) => {
            if (alterErr && !alterErr.message.includes('duplicate column')) {
              console.error('Error añadiendo columna is_conta:', alterErr);
            }
          });
          
          db.run(`ALTER TABLE inventory ADD COLUMN weapon_type TEXT`, (alterErr) => {
            if (alterErr && !alterErr.message.includes('duplicate column')) {
              console.error('Error añadiendo columna weapon_type:', alterErr);
            }
          });

          // Normalizar valores NULL en columna money para usuarios existentes
          db.run(`UPDATE users SET money = 0.00 WHERE money IS NULL`, (updErr) => {
            if (updErr) {
              console.warn('⚠️  No se pudo normalizar dinero de usuarios existentes:', updErr.message);
            } else {
              console.log('💾 Dinero normalizado a 0.00 para usuarios con NULL');
            }
            
            // Agregar columna unlocked_weapons si no existe
              db.run(`ALTER TABLE users ADD COLUMN unlocked_weapons TEXT`, (alterErr) => {
                if (alterErr && !alterErr.message.includes('duplicate column')) {
                  console.error('Error añadiendo columna unlocked_weapons:', alterErr);
                } else {
                  console.log('✅ Columna unlocked_weapons verificada');
                }
              });
              // Agregar columna unlocked_icons si no existe
              db.run(`ALTER TABLE users ADD COLUMN unlocked_icons TEXT`, (alterErr) => {
                if (alterErr && !alterErr.message.includes('duplicate column')) {
                  console.error('Error añadiendo columna unlocked_icons:', alterErr);
                } else {
                  console.log('✅ Columna unlocked_icons verificada');
                }
              });
          });
        }
      });

      // Tabla de estadísticas globales de armas
      db.run(`
        CREATE TABLE IF NOT EXISTS weapon_stats (
          weapon_id INTEGER PRIMARY KEY,
          total_openings INTEGER DEFAULT 0,
          current_existing INTEGER DEFAULT 0,
          total_conta_openings INTEGER DEFAULT 0,
          current_conta_existing INTEGER DEFAULT 0
        )
      `, (err) => {
        if (err) {
          console.error('Error creando tabla weapon_stats:', err);
          reject(err);
        } else {
          console.log('✅ Tabla de estadísticas de armas creada correctamente');
          
          // Inicializar estadísticas para todas las armas (IDs 1-16) si no existen
          const initStats = db.prepare(`INSERT OR IGNORE INTO weapon_stats (weapon_id, total_openings, current_existing, total_conta_openings, current_conta_existing) VALUES (?, 0, 0, 0, 0)`);
          for (let i = 1; i <= 16; i++) {
            initStats.run(i);
          }
          initStats.finalize(() => {
            console.log('✅ Estadísticas de armas inicializadas (1-16)');
          });
        }
      });

      // Tabla de mercado
      db.run(`
        CREATE TABLE IF NOT EXISTS market_listings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          seller_id INTEGER NOT NULL,
          inventory_id INTEGER NOT NULL,
          weapon_id VARCHAR(50) NOT NULL,
          name VARCHAR(100) NOT NULL,
          rarity TEXT NOT NULL,
          quality TEXT,
          is_conta INTEGER DEFAULT 0,
          price DECIMAL(10,4) NOT NULL,
          original_price DECIMAL(10,2),
          image VARCHAR(255) NOT NULL,
          weapon_type TEXT,
          pasiva_tipo TEXT,
          pasiva_valor DECIMAL(10,4),
          pasiva_stackeable INTEGER DEFAULT 0,
          listed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          status TEXT DEFAULT 'active',
          FOREIGN KEY (seller_id) REFERENCES users (id),
          FOREIGN KEY (inventory_id) REFERENCES inventory (id),
          CHECK (price >= 0.0001)
        )
      `, (err) => {
        if (err) {
          console.error('Error creando tabla market_listings:', err);
          reject(err);
        } else {
          console.log('✅ Tabla de mercado creada correctamente');
          
          // Añadir columna weapon_type si no existe
          db.run(`ALTER TABLE market_listings ADD COLUMN weapon_type TEXT`, (alterErr) => {
            if (alterErr && !alterErr.message.includes('duplicate column')) {
              console.error('Error añadiendo columna weapon_type a market_listings:', alterErr);
            }
          });
        }
      });

      // Tabla de historial de ventas
      db.run(`
        CREATE TABLE IF NOT EXISTS market_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          weapon_id VARCHAR(50) NOT NULL,
          name VARCHAR(100) NOT NULL,
          rarity TEXT NOT NULL,
          quality TEXT,
          is_conta INTEGER DEFAULT 0,
          price DECIMAL(10,4) NOT NULL,
          seller_id INTEGER NOT NULL,
          buyer_id INTEGER NOT NULL,
          sold_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (seller_id) REFERENCES users (id),
          FOREIGN KEY (buyer_id) REFERENCES users (id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creando tabla market_history:', err);
          reject(err);
        } else {
          console.log('✅ Tabla de historial de ventas creada correctamente');
        }
      });

      // Tabla de bordes desbloqueados
      db.run(`
        CREATE TABLE IF NOT EXISTS unlocked_borders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          border_id VARCHAR(50) NOT NULL,
          unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, border_id),
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creando tabla unlocked_borders:', err);
          reject(err);
        } else {
          console.log('✅ Tabla de bordes desbloqueados creada correctamente');
          resolve();
        }
      });
    });
  });
}

module.exports = { db, initializeDatabase };