const express = require('express');
const { db } = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Obtener todas las listings del mercado con filtros
router.get('/listings', (req, res) => {
  const { rarity, quality, is_conta, weapon_id, weapon_type, sort, search, min_price, max_price } = req.query;
  
  let query = `
    SELECT 
      ml.*,
      u.username as seller_username
    FROM market_listings ml
    JOIN users u ON ml.seller_id = u.id
    WHERE ml.status = 'active'
  `;
  const params = [];

  // Filtros
  if (rarity) {
    // Comparar contra el JSON parseado o string directo
    query += ` AND (ml.rarity = ? OR json_extract(ml.rarity, '$.name') = ?)`;
    params.push(rarity);
    params.push(rarity);
  }
  
  if (quality) {
    // Comparar contra el JSON parseado o string directo
    query += ` AND (ml.quality = ? OR json_extract(ml.quality, '$.letter') = ? OR json_extract(ml.quality, '$.name') = ?)`;
    params.push(quality);
    params.push(quality);
    params.push(`Grado ${quality}`);
  }
  
  if (is_conta !== undefined) {
    query += ` AND ml.is_conta = ?`;
    params.push(parseInt(is_conta));
  }
  
  if (weapon_id) {
    query += ` AND ml.weapon_id = ?`;
    params.push(weapon_id);
  }
  
  if (weapon_type) {
    query += ` AND ml.weapon_type = ?`;
    params.push(weapon_type);
  }
  
  if (search) {
    query += ` AND ml.name LIKE ?`;
    params.push(`%${search}%`);
  }
  
  if (min_price) {
    query += ` AND ml.price >= ?`;
    params.push(parseFloat(min_price));
  }
  
  if (max_price) {
    query += ` AND ml.price <= ?`;
    params.push(parseFloat(max_price));
  }

  // Ordenamiento
  if (sort === 'price_asc') {
    query += ` ORDER BY ml.price ASC`;
  } else if (sort === 'price_desc') {
    query += ` ORDER BY ml.price DESC`;
  } else if (sort === 'newest') {
    query += ` ORDER BY ml.listed_at DESC`;
  } else {
    query += ` ORDER BY ml.listed_at DESC`;
  }

  db.all(query, params, (err, listings) => {
    if (err) {
      console.error('Error al obtener listings:', err);
      return res.status(500).json({ error: 'Error al obtener listings del mercado' });
    }
    
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
  });
});

// Obtener los 5 precios más bajos de un arma específica
router.get('/lowest-price/:weaponId', (req, res) => {
  const { weaponId } = req.params;
  const { quality, is_conta, rarity } = req.query;
  
  let query = `
    SELECT price, quality, is_conta, rarity
    FROM market_listings
    WHERE weapon_id = ? AND status = 'active'
  `;
  const params = [weaponId];
  
  if (quality) {
    // Comparar contra el JSON parseado o string directo
    query += ` AND (quality = ? OR json_extract(quality, '$.letter') = ? OR json_extract(quality, '$.name') = ?)`;
    params.push(quality);
    params.push(quality);
    params.push(`Grado ${quality}`);
  }
  
  if (is_conta !== undefined) {
    query += ` AND is_conta = ?`;
    params.push(parseInt(is_conta));
  }
  
  if (rarity) {
    // Comparar contra el JSON parseado o string directo
    query += ` AND (rarity = ? OR json_extract(rarity, '$.name') = ?)`;
    params.push(rarity);
    params.push(rarity);
  }
  
  query += ` ORDER BY price ASC LIMIT 5`;

  db.all(query, params, (err, results) => {
    if (err) {
      console.error('Error al obtener precios más bajos:', err);
      return res.status(500).json({ error: 'Error al obtener precios' });
    }
    
    // Extraer solo los precios
    const prices = results.map(r => parseFloat(r.price));
    
    res.json({ 
      success: true, 
      lowest_prices: prices,
      count: prices.length
    });
  });
});

// Obtener historial de ventas de un arma
router.get('/history/:weaponId', (req, res) => {
  const { weaponId } = req.params;
  const { quality, is_conta, limit = 10 } = req.query;
  
  let query = `
    SELECT 
      mh.*,
      us.username as seller_username,
      ub.username as buyer_username
    FROM market_history mh
    JOIN users us ON mh.seller_id = us.id
    JOIN users ub ON mh.buyer_id = ub.id
    WHERE mh.weapon_id = ?
  `;
  const params = [weaponId];
  
  if (quality) {
    query += ` AND mh.quality = ?`;
    params.push(quality);
  }
  
  if (is_conta !== undefined) {
    query += ` AND mh.is_conta = ?`;
    params.push(parseInt(is_conta));
  }
  
  query += ` ORDER BY mh.sold_at DESC LIMIT ?`;
  params.push(parseInt(limit));

  db.all(query, params, (err, history) => {
    if (err) {
      console.error('Error al obtener historial:', err);
      return res.status(500).json({ error: 'Error al obtener historial' });
    }
    
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
  });
});

// Listar arma en el mercado
router.post('/list', authenticateToken, (req, res) => {
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
  db.get(
    `SELECT i.* FROM inventory i
     LEFT JOIN market_listings ml ON i.id = ml.inventory_id AND ml.status = 'active'
     WHERE i.id = ? AND i.user_id = ? AND ml.id IS NULL`,
    [inventory_id, userId],
    (err, item) => {
      if (err) {
        console.error('Error al verificar item:', err);
        return res.status(500).json({ error: 'Error al verificar item' });
      }
      
      if (!item) {
        return res.status(404).json({ error: 'Item no encontrado o ya está en el mercado' });
      }

      // Crear listing
      const insertQuery = `
        INSERT INTO market_listings (
          seller_id, inventory_id, weapon_id, name, rarity, quality,
          is_conta, price, original_price, image, weapon_type, pasiva_tipo, pasiva_valor, pasiva_stackeable
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(
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
        ],
        function(err) {
          if (err) {
            console.error('Error al crear listing:', err);
            return res.status(500).json({ error: 'Error al listar item en el mercado' });
          }

          res.json({
            success: true,
            message: 'Item listado en el mercado exitosamente',
            listing_id: this.lastID
          });
        }
      );
    }
  );
});

// Comprar item del mercado
router.post('/buy', authenticateToken, (req, res) => {
  const { listing_id } = req.body;
  const buyerId = req.user.userId;

  if (!listing_id) {
    return res.status(400).json({ error: 'ID de listing requerido' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Obtener información del listing
    db.get(
      `SELECT ml.*, u.username as seller_username
       FROM market_listings ml
       JOIN users u ON ml.seller_id = u.id
       WHERE ml.id = ? AND ml.status = 'active'`,
      [listing_id],
      (err, listing) => {
        if (err) {
          db.run('ROLLBACK');
          console.error('Error al obtener listing:', err);
          return res.status(500).json({ error: 'Error al obtener listing' });
        }

        if (!listing) {
          db.run('ROLLBACK');
          return res.status(404).json({ error: 'Listing no encontrado o ya vendido' });
        }

        if (listing.seller_id === buyerId) {
          db.run('ROLLBACK');
          return res.status(400).json({ error: 'No puedes comprar tu propio item' });
        }

        // Verificar que el comprador tenga suficiente dinero
        db.get('SELECT money FROM users WHERE id = ?', [buyerId], (err, buyer) => {
          if (err) {
            db.run('ROLLBACK');
            console.error('Error al obtener comprador:', err);
            return res.status(500).json({ error: 'Error al procesar compra' });
          }

          if (!buyer) {
            db.run('ROLLBACK');
            return res.status(404).json({ error: 'Usuario no encontrado' });
          }

          if (buyer.money < listing.price) {
            db.run('ROLLBACK');
            return res.status(400).json({ error: 'Dinero insuficiente' });
          }

          // Transferir dinero
          db.run(
            'UPDATE users SET money = money - ? WHERE id = ?',
            [listing.price, buyerId],
            (err) => {
              if (err) {
                db.run('ROLLBACK');
                console.error('Error al restar dinero al comprador:', err);
                return res.status(500).json({ error: 'Error al procesar compra' });
              }

              db.run(
                'UPDATE users SET money = money + ? WHERE id = ?',
                [listing.price, listing.seller_id],
                (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    console.error('Error al añadir dinero al vendedor:', err);
                    return res.status(500).json({ error: 'Error al procesar compra' });
                  }

                  // Transferir item al comprador
                  db.run(
                    'UPDATE inventory SET user_id = ?, obtained_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [buyerId, listing.inventory_id],
                    (err) => {
                      if (err) {
                        db.run('ROLLBACK');
                        console.error('Error al transferir item:', err);
                        return res.status(500).json({ error: 'Error al procesar compra' });
                      }

                      // Marcar listing como vendido
                      db.run(
                        'UPDATE market_listings SET status = ? WHERE id = ?',
                        ['sold', listing_id],
                        (err) => {
                          if (err) {
                            db.run('ROLLBACK');
                            console.error('Error al actualizar listing:', err);
                            return res.status(500).json({ error: 'Error al procesar compra' });
                          }

                          // Registrar en historial
                          db.run(
                            `INSERT INTO market_history (
                              weapon_id, name, rarity, quality, is_conta, price, seller_id, buyer_id
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                              listing.weapon_id,
                              listing.name,
                              listing.rarity,
                              listing.quality,
                              listing.is_conta,
                              listing.price,
                              listing.seller_id,
                              buyerId
                            ],
                            (err) => {
                              if (err) {
                                db.run('ROLLBACK');
                                console.error('Error al registrar historial:', err);
                                return res.status(500).json({ error: 'Error al procesar compra' });
                              }

                              // Desbloquear arma en Dex y icono
                              db.get('SELECT unlocked_weapons, unlocked_icons FROM users WHERE id = ?', [buyerId], (err, buyerData) => {
                                if (err) {
                                  console.error('Error al obtener datos del comprador:', err);
                                }

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
                                db.run(
                                  'UPDATE users SET unlocked_weapons = ?, unlocked_icons = ? WHERE id = ?',
                                  [JSON.stringify(unlockedWeapons), JSON.stringify(unlockedIcons), buyerId],
                                  (err) => {
                                    if (err) {
                                      console.error('Error al actualizar desbloqueos:', err);
                                    }

                                    db.run('COMMIT', (err) => {
                                      if (err) {
                                        db.run('ROLLBACK');
                                        console.error('Error al hacer commit:', err);
                                        return res.status(500).json({ error: 'Error al procesar compra' });
                                      }

                                      // Obtener el dinero actualizado del comprador
                                      db.get('SELECT money FROM users WHERE id = ?', [buyerId], (err, updatedBuyer) => {
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
                                      });
                                    });
                                  }
                                );
                              });
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        });
      }
    );
  });
});

// Cancelar listing
router.post('/cancel', authenticateToken, (req, res) => {
  const { listing_id } = req.body;
  const userId = req.user.userId;

  if (!listing_id) {
    return res.status(400).json({ error: 'ID de listing requerido' });
  }

  db.get(
    'SELECT * FROM market_listings WHERE id = ? AND seller_id = ? AND status = ?',
    [listing_id, userId, 'active'],
    (err, listing) => {
      if (err) {
        console.error('Error al verificar listing:', err);
        return res.status(500).json({ error: 'Error al cancelar listing' });
      }

      if (!listing) {
        return res.status(404).json({ error: 'Listing no encontrado o no te pertenece' });
      }

      db.run(
        'UPDATE market_listings SET status = ? WHERE id = ?',
        ['cancelled', listing_id],
        (err) => {
          if (err) {
            console.error('Error al cancelar listing:', err);
            return res.status(500).json({ error: 'Error al cancelar listing' });
          }

          res.json({
            success: true,
            message: 'Listing cancelado exitosamente'
          });
        }
      );
    }
  );
});

// Obtener listings propios del usuario
router.get('/my-listings', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  db.all(
    `SELECT * FROM market_listings 
     WHERE seller_id = ? AND status = 'active'
     ORDER BY listed_at DESC`,
    [userId],
    (err, listings) => {
      if (err) {
        console.error('Error al obtener listings propios:', err);
        return res.status(500).json({ error: 'Error al obtener tus listings' });
      }

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
    }
  );
});

// Obtener estadísticas del mercado de un arma
router.get('/stats/:weaponId', (req, res) => {
  const { weaponId } = req.params;
  
  db.all(
    `SELECT 
      COUNT(*) as active_listings,
      MIN(price) as min_price,
      MAX(price) as max_price,
      AVG(price) as avg_price
    FROM market_listings
    WHERE weapon_id = ? AND status = 'active'
    GROUP BY weapon_id`,
    [weaponId],
    (err, stats) => {
      if (err) {
        console.error('Error al obtener estadísticas:', err);
        return res.status(500).json({ error: 'Error al obtener estadísticas' });
      }

      // Obtener últimas ventas
      db.all(
        `SELECT price, sold_at
         FROM market_history
         WHERE weapon_id = ?
         ORDER BY sold_at DESC
         LIMIT 5`,
        [weaponId],
        (err, recentSales) => {
          if (err) {
            console.error('Error al obtener ventas recientes:', err);
            return res.status(500).json({ error: 'Error al obtener estadísticas' });
          }

          res.json({
            success: true,
            stats: stats[0] || {
              active_listings: 0,
              min_price: null,
              max_price: null,
              avg_price: null
            },
            recent_sales: recentSales
          });
        }
      );
    }
  );
});

module.exports = router;
