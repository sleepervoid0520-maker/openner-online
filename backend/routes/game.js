const express = require('express');
const { db } = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Obtener cajas disponibles
router.get('/boxes', (req, res) => {
  db.all('SELECT * FROM boxes ORDER BY cost ASC', [], (err, boxes) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener cajas' });
    }
    res.json({ success: true, boxes });
  });
});

// Obtener items disponibles
router.get('/items', (req, res) => {
  db.all('SELECT * FROM items ORDER BY rarity, value DESC', [], (err, items) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener items' });
    }
    res.json({ success: true, items });
  });
});

// Abrir caja
router.post('/open-box', authenticateToken, (req, res) => {
  const { boxId } = req.body;
  const userId = req.user.userId;

  if (!boxId) {
    return res.status(400).json({ error: 'ID de caja requerido' });
  }

  // Verificar que la caja existe
  db.get('SELECT * FROM boxes WHERE id = ?', [boxId], (err, box) => {
    if (err || !box) {
      return res.status(404).json({ error: 'Caja no encontrada' });
    }

    // Verificar que el usuario tenga suficientes monedas
    db.get('SELECT coins FROM users WHERE id = ?', [userId], (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      if (user.coins < box.cost) {
        return res.status(400).json({ error: 'Monedas insuficientes' });
      }

      // Obtener items disponibles para esta caja
      db.all('SELECT * FROM items', [], (err, items) => {
        if (err || items.length === 0) {
          return res.status(500).json({ error: 'Error al obtener items' });
        }

        // Algoritmo de drop aleatorio
        const randomItems = getRandomItems(items, boxId);
        
        if (randomItems.length === 0) {
          return res.status(500).json({ error: 'Error en el sistema de recompensas' });
        }

        // Calcular valor total de los items obtenidos
        const totalValue = randomItems.reduce((sum, item) => sum + item.value, 0);

        // Actualizar monedas del usuario y estadísticas
        const newCoins = user.coins - box.cost + Math.floor(totalValue * 0.3);
        
        db.run(`
          UPDATE users 
          SET coins = ?, boxes_opened = boxes_opened + 1, experience = experience + 10,
              rare_items = rare_items + ?
          WHERE id = ?
        `, [
          newCoins, 
          randomItems.filter(item => item.rarity === 'rare' || item.rarity === 'epic' || item.rarity === 'legendary').length,
          userId
        ], (err) => {
          if (err) {
            return res.status(500).json({ error: 'Error al actualizar usuario' });
          }

          // Agregar items al inventario y actualizar weapon_stats si corresponde
          let completed = 0;
          randomItems.forEach(item => {
            // Si el item es un arma (tiene weapon_id o id de arma), actualiza weapon_stats
            const weaponId = item.weapon_id || item.id;
            
            // Preparar datos de pasiva
            const pasivaTipo = item.pasiva ? item.pasiva.tipo : null;
            const pasivaValor = item.pasiva ? item.pasiva.valor : null;
            const pasivaStackeable = item.pasiva ? (item.pasiva.stackeable ? 1 : 0) : 0;
            
            db.run(
              'INSERT INTO inventory (user_id, weapon_id, name, rarity, price, image, quality, final_price, is_conta, pasiva_tipo, pasiva_valor, pasiva_stackeable) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [userId, weaponId, item.name, item.rarity || '', item.value || 0, item.image || '', null, item.value || 0, 0, pasivaTipo, pasivaValor, pasivaStackeable],
              function(err) {
                if (!err) {
                  // Actualizar estadísticas globales del arma
                  db.run(
                    `UPDATE weapon_stats SET total_openings = total_openings + 1, current_existing = current_existing + 1 WHERE weapon_id = ?`,
                    [weaponId],
                    function(statsErr) {
                      // Opcional: log de error
                    }
                  );
                }
                completed++;
                if (completed === randomItems.length) {
                  res.json({
                    success: true,
                    message: 'Caja abierta exitosamente',
                    items: randomItems,
                    coinsSpent: box.cost,
                    coinsEarned: Math.floor(totalValue * 0.3),
                    newCoinBalance: newCoins
                  });
                }
              }
            );
          });
        });
      });
    });
  });
});

// Función para obtener items aleatorios
function getRandomItems(items, boxId) {
  const result = [];
  let itemCount = 1; // Número de items por caja

  // Ajustar probabilidades según el tipo de caja
  let rarityMultiplier = 1;
  if (boxId == 2) rarityMultiplier = 1.5; // Caja Premium
  if (boxId == 3) rarityMultiplier = 2; // Caja Legendaria

  for (let i = 0; i < itemCount; i++) {
    const random = Math.random();
    let selectedItem = null;
    let cumulativeProbability = 0;

    // Ajustar probabilidades
    const adjustedItems = items.map(item => ({
      ...item,
      adjustedDropRate: item.drop_rate * (item.rarity !== 'common' ? rarityMultiplier : 1)
    }));

    // Normalizar probabilidades
    const totalProbability = adjustedItems.reduce((sum, item) => sum + item.adjustedDropRate, 0);
    
    for (const item of adjustedItems) {
      cumulativeProbability += item.adjustedDropRate / totalProbability;
      if (random <= cumulativeProbability) {
        selectedItem = item;
        break;
      }
    }

    if (selectedItem) {
      result.push(selectedItem);
    }
  }

  return result;
}

// Obtener inventario del usuario
router.get('/inventory', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  db.all(`
    SELECT i.*, it.name, it.description, it.rarity, it.value, it.image,
           SUM(i.quantity) as total_quantity
    FROM inventory i
    JOIN items it ON i.item_id = it.id
    WHERE i.user_id = ?
    GROUP BY it.id
    ORDER BY it.rarity DESC, it.value DESC
  `, [userId], (err, inventory) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener inventario' });
    }

    res.json({ success: true, inventory });
  });
});

// Obtener estadísticas del usuario
router.get('/stats', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      success: true,
      stats: {
        username: user.username,
        coins: user.coins,
        level: user.level,
        experience: user.experience,
        boxesOpened: user.boxes_opened,
        rareItems: user.rare_items,
        memberSince: user.created_at
      }
    });
  });
});

module.exports = router;