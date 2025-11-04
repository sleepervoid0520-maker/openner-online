const { Pool } = require('pg');

// Configuración de conexión a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Función para ejecutar queries
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Ejecutada query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error en query:', error);
    throw error;
  }
}

// Inicializar base de datos
async function initializeDatabase() {
  try {
    console.log('🔄 Inicializando base de datos PostgreSQL...');

    // Tabla de usuarios
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
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
        dinero_por_segundo DECIMAL(10,2) DEFAULT 0.00,
        dinero_por_segundo_porcentaje DECIMAL(10,2) DEFAULT 0.00,
        selected_icon VARCHAR(255) DEFAULT '/arma/glock 17 cereza.png',
        selected_border VARCHAR(50) DEFAULT 'none',
        unlocked_weapons TEXT,
        unlocked_icons TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla de usuarios creada correctamente');

    // Tabla de inventario
    await query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        weapon_id VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        rarity TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        image VARCHAR(255) NOT NULL,
        quality TEXT,
        final_price DECIMAL(10,2),
        pasiva_tipo TEXT,
        pasiva_valor DECIMAL(10,4),
        pasiva_stackeable INTEGER DEFAULT 0,
        is_conta INTEGER DEFAULT 0,
        weapon_type TEXT,
        obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabla de inventario creada correctamente');

    // Tabla de estadísticas globales de armas
    await query(`
      CREATE TABLE IF NOT EXISTS weapon_stats (
        weapon_id INTEGER PRIMARY KEY,
        total_openings INTEGER DEFAULT 0,
        current_existing INTEGER DEFAULT 0,
        total_conta_openings INTEGER DEFAULT 0,
        current_conta_existing INTEGER DEFAULT 0
      )
    `);
    console.log('✅ Tabla de estadísticas de armas creada correctamente');

    // Inicializar estadísticas para todas las armas (IDs 1-16) si no existen
    for (let i = 1; i <= 16; i++) {
      await query(
        `INSERT INTO weapon_stats (weapon_id, total_openings, current_existing, total_conta_openings, current_conta_existing) 
         VALUES ($1, 0, 0, 0, 0) 
         ON CONFLICT (weapon_id) DO NOTHING`,
        [i]
      );
    }
    console.log('✅ Estadísticas de armas inicializadas (1-16)');

    // Tabla de mercado
    await query(`
      CREATE TABLE IF NOT EXISTS market_listings (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER NOT NULL,
        inventory_id INTEGER NOT NULL,
        weapon_id VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        rarity TEXT NOT NULL,
        quality TEXT,
        is_conta INTEGER DEFAULT 0,
        price DECIMAL(10,4) NOT NULL CHECK (price >= 0.0001),
        original_price DECIMAL(10,2),
        image VARCHAR(255) NOT NULL,
        weapon_type TEXT,
        pasiva_tipo TEXT,
        pasiva_valor DECIMAL(10,4),
        pasiva_stackeable INTEGER DEFAULT 0,
        listed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'active',
        FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (inventory_id) REFERENCES inventory (id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabla de mercado creada correctamente');

    // Tabla de historial de ventas
    await query(`
      CREATE TABLE IF NOT EXISTS market_history (
        id SERIAL PRIMARY KEY,
        weapon_id VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        rarity TEXT NOT NULL,
        quality TEXT,
        is_conta INTEGER DEFAULT 0,
        price DECIMAL(10,4) NOT NULL,
        seller_id INTEGER NOT NULL,
        buyer_id INTEGER NOT NULL,
        sold_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (buyer_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabla de historial de ventas creada correctamente');

    // Tabla de bordes desbloqueados
    await query(`
      CREATE TABLE IF NOT EXISTS unlocked_borders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        border_id VARCHAR(50) NOT NULL,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, border_id),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabla de bordes desbloqueados creada correctamente');

    console.log('🎉 Base de datos PostgreSQL inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    throw error;
  }
}

// Función auxiliar para obtener una conexión del pool
function getPool() {
  return pool;
}

// Cerrar todas las conexiones
async function closePool() {
  await pool.end();
}

module.exports = { 
  query, 
  initializeDatabase, 
  pool,
  getPool,
  closePool
};
