const express = require('express');
const { query } = require('../database/database-postgres');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Obtener todas las listings del mercado con filtros
router.get('/listings', async (req, res) => {
  try {
    const { rarity, quality, is_conta, weapon_id, weapon_type, sort, search, min_price, max_price } = req.query;
    
    let queryText = `
      SELECT 
        ml.*,
        u.username as seller_username
      FROM market_listings ml
      JOIN users u ON ml.seller_id = u.id
      WHERE ml.status = 'active'
    `;
    const params = [];
    let paramIndex = 1;

    // Filtros
    if (rarity) {
      // PostgreSQL usa ->> para extraer JSON como texto
      queryText += ` AND (ml.rarity = $${paramIndex} OR ml.rarity::json->>'name' = $${paramIndex + 1})`;
      params.push(rarity);
      params.push(rarity);
      paramIndex += 2;
    }
    
    if (quality) {
      // Comparar contra el JSON parseado o string directo
      queryText += ` AND (ml.quality = $${paramIndex} OR ml.quality::json->>'letter' = $${paramIndex + 1} OR ml.quality::json->>'name' = $${paramIndex + 2})`;
      params.push(quality);
      params.push(quality);
      params.push(`Grado ${quality}`);
      paramIndex += 3;
    }
    
    if (is_conta !== undefined) {
      queryText += ` AND ml.is_conta = $${paramIndex}`;
      params.push(parseInt(is_conta));
      paramIndex++;
    }
    
    if (weapon_id) {
      queryText += ` AND ml.weapon_id = $${paramIndex}`;
      params.push(weapon_id);
      paramIndex++;
    }
    
    if (weapon_type) {
      queryText += ` AND ml.weapon_type = $${paramIndex}`;
      params.push(weapon_type);
      paramIndex++;
    }
    
    if (search) {
      queryText += ` AND ml.name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (min_price) {
      queryText += ` AND ml.price >= $${paramIndex}`;
      params.push(parseFloat(min_price));
      paramIndex++;
    }
    
    if (max_price) {
      queryText += ` AND ml.price <= $${paramIndex}`;
      params.push(parseFloat(max_price));
      paramIndex++;
    }

    // Ordenamiento
    if (sort === 'price_asc') {
      queryText += ` ORDER BY ml.price ASC`;
    } else if (sort === 'price_desc') {
      queryText += ` ORDER BY ml.price DESC`;
    } else if (sort === 'newest') {
      queryText += ` ORDER BY ml.listed_at DESC`;
    } else {
      queryText += ` ORDER BY ml.listed_at DESC`;
    }

    const result = await query(queryText, params);
    const listings = result.rows;
    
    // Parsear quality y rarity si están guardados como JSON
    const parsedListings = listings.map(listing => {
      let quality = listing.quality;
      let rarity = listing.rarity;
      
      // Intentar parsear quality si es string JSON
      if (quality && typeof quality === 'string') {
        try {
          quality = JSON.parse(quality);
        } catch (e) {
          // Si no se puede parsear, dejarlo como está
        }
      }
      
      // Intentar parsear rarity si es string JSON
      if (rarity && typeof rarity === 'string') {
        try {
          rarity = JSON.parse(rarity);
        } catch (e) {
          // Si no se puede parsear, dejarlo como está
        }
      }
      
      return {
        ...listing,
        quality,
        rarity
      };
    });
    
    res.json({ success: true, listings: parsedListings });
  } catch (error) {
    console.error('Error al obtener listings:', error);
    res.status(500).json({ error: 'Error al obtener listings del mercado' });
  }
});

// Obtener los 5 precios más bajos de un arma específica
router.get('/lowest-price/:weaponId', async (req, res) => {
  try {
    const { weaponId } = req.params;
    const { quality, is_conta, rarity } = req.query;
    
    let queryText = `
      SELECT price, quality, is_conta, rarity
      FROM market_listings
      WHERE weapon_id = $1 AND status = 'active'
    `;
    const params = [weaponId];
    let paramIndex = 2;
    
    if (quality) {
      // Comparar contra el JSON parseado o string directo
      queryText += ` AND (quality = $${paramIndex} OR quality::json->>'letter' = $${paramIndex + 1} OR quality::json->>'name' = $${paramIndex + 2})`;
      params.push(quality);
      params.push(quality);
      params.push(`Grado ${quality}`);
      paramIndex += 3;
    }
    
    if (is_conta !== undefined) {
      queryText += ` AND is_conta = $${paramIndex}`;
      params.push(parseInt(is_conta));
      paramIndex++;
    }
    
    if (rarity) {
      // Comparar contra el JSON parseado o string directo
      queryText += ` AND (rarity = $${paramIndex} OR rarity::json->>'name' = $${paramIndex + 1})`;
      params.push(rarity);
      params.push(rarity);
      paramIndex += 2;
    }
    
    queryText += ` ORDER BY price ASC LIMIT 5`;

    const result = await query(queryText, params);
    
    // Extraer solo los precios
    const prices = result.rows.map(r => parseFloat(r.price));
    
    res.json({ 
      success: true, 
      lowest_prices: prices,
      count: prices.length
    });
  } catch (error) {
    console.error('Error al obtener precios más bajos:', error);
    res.status(500).json({ error: 'Error al obtener precios' });
  }
});

// Obtener historial de ventas de un arma
router.get('/history/:weaponId', async (req, res) => {
  try {
    const { weaponId } = req.params;
    const { quality, is_conta, limit = 10 } = req.query;
    
    let queryText = `
      SELECT 
        mh.*,
        us.username as seller_username,
        ub.username as buyer_username
      FROM market_history mh
      JOIN users us ON mh.seller_id = us.id
      JOIN users ub ON mh.buyer_id = ub.id
      WHERE mh.weapon_id = $1
    `;
    const params = [weaponId];
    let paramIndex = 2;
    
    if (quality) {
      queryText += ` AND mh.quality = $${paramIndex}`;
      params.push(quality);
      paramIndex++;
    }
    
    if (is_conta !== undefined) {
      queryText += ` AND mh.is_conta = $${paramIndex}`;
      params.push(parseInt(is_conta));
      paramIndex++;
    }
    
    queryText += ` ORDER BY mh.sold_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await query(queryText, params);
    const history = result.rows;
    
    // Parsear quality y rarity si están guardados como JSON
    const parsedHistory = history.map(record => {
      let quality = record.quality;
      let rarity = record.rarity;
      
      // Intentar parsear quality si es string JSON
      if (quality && typeof quality === 'string') {
        try {
          quality = JSON.parse(quality);
        } catch (e) {
          // Si no se puede parsear, dejarlo como está
        }
      }
      
      // Intentar parsear rarity si es string JSON
      if (rarity && typeof rarity === 'string') {
        try {
          rarity = JSON.parse(rarity);
        } catch (e) {
          // Si no se puede parsear, dejarlo como está
        }
      }
      
      return {
        ...record,
        quality,
        rarity
      };
    });
    
    res.json({ success: true, history: parsedHistory });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// Listar arma en el mercado
router.post('/list', authenticateToken, async (req, res) => {
  try {
    const { inventory_id, price } = req.body;
    const userId = req.user.userId;

    if (!inventory_id || !price) {
      return res.status(400).json({ error: 'ID de inventario y precio son requeridos' });
    }

    const priceNum = parseFloat(price);
    if (priceNum < 0.0001) {
      return res.status(400).json({ error: 'El precio mínimo es 0.0001$' });
    }

    // Verificar que el item pertenece al usuario y no está ya en el mercado
    const itemResult = await query(
      `SELECT i.* FROM inventory i
       LEFT JOIN market_listings ml ON i.id = ml.inventory_id AND ml.status = 'active'
       WHERE i.id = $1 AND i.user_id = $2 AND ml.id IS NULL`,
      [inventory_id, userId]
    );
    
    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item no encontrado o ya está en el mercado' });
    }
    
    const item = itemResult.rows[0];

    // Crear listing
    const insertQuery = `
      INSERT INTO market_listings (
        seller_id, inventory_id, weapon_id, name, rarity, quality,
        is_conta, price, original_price, image, weapon_type, pasiva_tipo, pasiva_valor, pasiva_stackeable
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id
    `;

    const result = await query(
      insertQuery,
      [
        userId,
        inventory_id,
        item.weapon_id,
        item.name,
        item.rarity,
        item.quality,
        item.is_conta || 0,
        priceNum,
        item.final_price || item.price,
        item.image,
        item.weapon_type || null,
        item.pasiva_tipo,
        item.pasiva_valor,
        item.pasiva_stackeable || 0
      ]
    );

    res.json({
      success: true,
      message: 'Item listado en el mercado exitosamente',
      listing_id: result.rows[0].id
    });
  } catch (error) {
    console.error('Error al listar item:', error);
    res.status(500).json({ error: 'Error al listar item en el mercado' });
  }
});

// Comprar item del mercado
router.post('/buy', authenticateToken, async (req, res) => {
  const { listing_id } = req.body;
  const buyerId = req.user.userId;

  if (!listing_id) {
    return res.status(400).json({ error: 'ID de listing requerido' });
  }

  try {
    // PostgreSQL doesn't need explicit BEGIN - we'll handle errors and rollback via try-catch
    await query('BEGIN');

    // Obtener información del listing
    const listingResult = await query(
      `SELECT ml.*, u.username as seller_username
       FROM market_listings ml
       JOIN users u ON ml.seller_id = u.id
       WHERE ml.id = $1 AND ml.status = 'active'`,
      [listing_id]
    );

    if (listingResult.rows.length === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ error: 'Listing no encontrado o ya vendido' });
    }

    const listing = listingResult.rows[0];

    if (listing.seller_id === buyerId) {
      await query('ROLLBACK');
      return res.status(400).json({ error: 'No puedes comprar tu propio item' });
    }

    // Verificar que el comprador tenga suficiente dinero
    const buyerResult = await query('SELECT money FROM users WHERE id = $1', [buyerId]);
    
    if (buyerResult.rows.length === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const buyer = buyerResult.rows[0];

    if (buyer.money < listing.price) {
      await query('ROLLBACK');
      return res.status(400).json({ error: 'Dinero insuficiente' });
    }

    // Transferir dinero
    await query('UPDATE users SET money = money - $1 WHERE id = $2', [listing.price, buyerId]);
    await query('UPDATE users SET money = money + $1 WHERE id = $2', [listing.price, listing.seller_id]);

    // Transferir item al comprador
    await query('UPDATE inventory SET user_id = $1, obtained_at = CURRENT_TIMESTAMP WHERE id = $2', [buyerId, listing.inventory_id]);

    // Marcar listing como vendido
    await query('UPDATE market_listings SET status = $1 WHERE id = $2', ['sold', listing_id]);

    // Registrar en historial
    await query(
      `INSERT INTO market_history (
        weapon_id, name, rarity, quality, is_conta, price, seller_id, buyer_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        listing.weapon_id,
        listing.name,
        listing.rarity,
        listing.quality,
        listing.is_conta,
        listing.price,
        listing.seller_id,
        buyerId
      ]
    );

    // Desbloquear arma en Dex y icono
    const buyerDataResult = await query('SELECT unlocked_weapons, unlocked_icons FROM users WHERE id = $1', [buyerId]);
    const buyerData = buyerDataResult.rows[0];

    let unlockedWeapons = [];
    let unlockedIcons = [];
    let weaponUnlocked = false;
    let iconUnlocked = false;

    // Parsear armas desbloqueadas
    if (buyerData && buyerData.unlocked_weapons) {
      try {
        unlockedWeapons = JSON.parse(buyerData.unlocked_weapons);
      } catch (e) {
        unlockedWeapons = [];
      }
    }

    // Parsear iconos desbloqueados
    if (buyerData && buyerData.unlocked_icons) {
      try {
        unlockedIcons = JSON.parse(buyerData.unlocked_icons);
      } catch (e) {
        unlockedIcons = [];
      }
    }

    // Convertir weapon_id a número para comparación consistente
    const weaponIdNum = parseInt(listing.weapon_id);

    // Desbloquear arma si no estaba desbloqueada (usar ID numérico)
    if (!unlockedWeapons.includes(weaponIdNum)) {
      unlockedWeapons.push(weaponIdNum);
      weaponUnlocked = true;
    }

    // Desbloquear icono si no estaba desbloqueado (usar ruta de imagen)
    if (!unlockedIcons.includes(listing.image)) {
      unlockedIcons.push(listing.image);
      iconUnlocked = true;
    }

    // Actualizar desbloqueos
    await query(
      'UPDATE users SET unlocked_weapons = $1, unlocked_icons = $2 WHERE id = $3',
      [JSON.stringify(unlockedWeapons), JSON.stringify(unlockedIcons), buyerId]
    );

    await query('COMMIT');

    // Obtener el dinero actualizado del comprador
    const updatedBuyerResult = await query('SELECT money FROM users WHERE id = $1', [buyerId]);
    const updatedBuyer = updatedBuyerResult.rows[0];

    res.json({
      success: true,
      message: 'Compra realizada exitosamente',
      item: {
        name: listing.name,
        price: listing.price,
        seller: listing.seller_username
      },
      new_balance: updatedBuyer ? updatedBuyer.money : null,
      unlocked: {
        weapon: weaponUnlocked,
        icon: iconUnlocked
      }
    });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Error al procesar compra:', error);
    res.status(500).json({ error: 'Error al procesar compra' });
  }
});

// Cancelar listing
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const { listing_id } = req.body;
    const userId = req.user.userId;

    if (!listing_id) {
      return res.status(400).json({ error: 'ID de listing requerido' });
    }

    const result = await query(
      'SELECT * FROM market_listings WHERE id = $1 AND seller_id = $2 AND status = $3',
      [listing_id, userId, 'active']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing no encontrado o no te pertenece' });
    }

    await query(
      'UPDATE market_listings SET status = $1 WHERE id = $2',
      ['cancelled', listing_id]
    );

    res.json({
      success: true,
      message: 'Listing cancelado exitosamente'
    });
  } catch (error) {
    console.error('Error al cancelar listing:', error);
    res.status(500).json({ error: 'Error al cancelar listing' });
  }
});

// Obtener listings propios del usuario
router.get('/my-listings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await query(
      `SELECT * FROM market_listings 
       WHERE seller_id = $1 AND status = 'active'
       ORDER BY listed_at DESC`,
      [userId]
    );

    const listings = result.rows;

    // Parsear quality y rarity si están guardados como JSON
    const parsedListings = listings.map(listing => {
      let quality = listing.quality;
      let rarity = listing.rarity;
      
      // Intentar parsear quality si es string JSON
      if (quality && typeof quality === 'string') {
        try {
          quality = JSON.parse(quality);
        } catch (e) {
          // Si no se puede parsear, dejarlo como está
        }
      }
      
      // Intentar parsear rarity si es string JSON
      if (rarity && typeof rarity === 'string') {
        try {
          rarity = JSON.parse(rarity);
        } catch (e) {
          // Si no se puede parsear, dejarlo como está
        }
      }
      
      return {
        ...listing,
        quality,
        rarity
      };
    });

    res.json({ success: true, listings: parsedListings });
  } catch (error) {
    console.error('Error al obtener listings propios:', error);
    res.status(500).json({ error: 'Error al obtener tus listings' });
  }
});

// Obtener estadísticas del mercado de un arma
router.get('/stats/:weaponId', async (req, res) => {
  try {
    const { weaponId } = req.params;
    
    const statsResult = await query(
      `SELECT 
        COUNT(*) as active_listings,
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(price) as avg_price
      FROM market_listings
      WHERE weapon_id = $1 AND status = 'active'
      GROUP BY weapon_id`,
      [weaponId]
    );

    // Obtener últimas ventas
    const salesResult = await query(
      `SELECT price, sold_at
       FROM market_history
       WHERE weapon_id = $1
       ORDER BY sold_at DESC
       LIMIT 5`,
      [weaponId]
    );

    res.json({
      success: true,
      stats: statsResult.rows[0] || {
        active_listings: 0,
        min_price: null,
        max_price: null,
        avg_price: null
      },
      recent_sales: salesResult.rows
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

module.exports = router;
