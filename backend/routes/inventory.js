const express = require('express');
const { query } = require('../database/database-postgres');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Función para recalcular pasivas del usuario
async function recalculateUserPassives(userId, callback) {
  try {
    // Verificar si el usuario tiene el borde Thunder desbloqueado
    const borderResult = await query(`
      SELECT COUNT(*) as has_border
      FROM unlocked_borders
      WHERE user_id = $1 AND border_id = 'lightning'
    `, [userId]);
    
    const borderRow = borderResult.rows[0];
    const hasThunderBorder = borderRow && borderRow.has_border > 0;
    
    // Obtener todas las armas con pasivas del usuario
    const result = await query(`
      SELECT pasiva_tipo, pasiva_valor, pasiva_stackeable
      FROM inventory 
      WHERE user_id = $1 AND pasiva_tipo IS NOT NULL
    `, [userId]);
    
    const rows = result.rows;
      
      // Calcular totales por tipo de pasiva
      const passiveTotals = {};
      let totalSuerte = 0;
      let totalGradeBonus = 0;
      
      // Si tiene el borde Thunder desbloqueado, agregar sus bonos permanentes
      if (hasThunderBorder) {
        totalSuerte = 15; // Borde Thunder da +15 de suerte
        passiveTotals['exp_extra'] = 25; // Borde Thunder da +25% de experiencia
      }
    
    rows.forEach(row => {
      const tipo = row.pasiva_tipo;
      let valor = 0;
      let suerte = 0;
      let gradeBonus = 0;
      const stackeable = row.pasiva_stackeable === 1;
      
      // El valor en pasiva_valor YA incluye el multiplicador de grado y conta aplicado
      // cuando se generó el arma, así que usamos directamente ese valor
      
      // Manejar pasivas complejas
      if (tipo === 'suerte_y_grade' && row.pasiva_valor) {
        try {
          const pasivaData = JSON.parse(row.pasiva_valor);
          suerte = pasivaData.suerte || 0;
          gradeBonus = pasivaData.gradeBonus || 0;
        } catch (e) {
          // Si no se puede parsear, usar valores por defecto
          suerte = 0;
          gradeBonus = 0;
        }
      } else if (tipo === 'suerte' && row.pasiva_valor) {
        // Pasiva simple de suerte
        try {
          const pasivaData = JSON.parse(row.pasiva_valor);
          suerte = parseFloat(pasivaData.valor || 0);
        } catch (e) {
          suerte = parseFloat(row.pasiva_valor || 0);
        }
      } else if (tipo === 'aumento_calidad' && row.pasiva_valor) {
        // DEPRECATED: aumento_calidad se convirtió a mayor_probabilidad_grado
        // Mantener por compatibilidad con armas antiguas
        try {
          const pasivaData = JSON.parse(row.pasiva_valor);
          gradeBonus = parseFloat(pasivaData.valor || 0);
        } catch (e) {
          gradeBonus = parseFloat(row.pasiva_valor || 0);
        }
      } else if (tipo === 'exp_extra' && row.pasiva_valor) {
        try {
          const pasivaData = JSON.parse(row.pasiva_valor);
          // Convertir a porcentaje (0.2 -> 20)
          valor = parseFloat(pasivaData.valor || 0) * 100;
        } catch (e) {
          // Convertir a porcentaje (0.2 -> 20)
          valor = parseFloat(row.pasiva_valor || 0) * 100;
        }
      } else if (tipo === 'menor_costo_caja' && row.pasiva_valor) {
        try {
          const pasivaData = JSON.parse(row.pasiva_valor);
          // Convertir a porcentaje (0.5 -> 50)
          valor = parseFloat(pasivaData.valor || 0) * 100;
        } catch (e) {
          // Convertir a porcentaje (0.5 -> 50)
          valor = parseFloat(row.pasiva_valor || 0) * 100;
        }
      } else if (tipo === 'mayor_costo_armas' && row.pasiva_valor) {
        try {
          const pasivaData = JSON.parse(row.pasiva_valor);
          // Convertir a porcentaje (0.07 -> 7)
          valor = parseFloat(pasivaData.valor || 0) * 100;
        } catch (e) {
          // Convertir a porcentaje (0.07 -> 7)
          valor = parseFloat(row.pasiva_valor || 0) * 100;
        }
      } else if (row.pasiva_valor) {
        // Para otras pasivas simples (dinero_por_segundo, etc.)
        try {
          const pasivaData = JSON.parse(row.pasiva_valor);
          valor = parseFloat(pasivaData.valor || 0);
        } catch (e) {
          valor = parseFloat(row.pasiva_valor || 0);
        }
      } else {
        valor = parseFloat(row.pasiva_valor || 0);
      }
      
      if (!passiveTotals[tipo]) {
        passiveTotals[tipo] = 0;
      }
      
      if (stackeable) {
        // Si es stackeable, sumar todos los valores (ya multiplicados por grado y conta)
        passiveTotals[tipo] += valor;
      } else {
        // Si NO es stackeable, tomar el MÁXIMO valor (el que tiene mejor multiplicador)
        // Esto asegura que si tienes 3 armas con la misma pasiva no stackeable,
        // solo se aplica la que tiene el mayor valor (mejor grado/conta)
        passiveTotals[tipo] = Math.max(passiveTotals[tipo], valor);
      }
      
      // Sumar suerte y gradeBonus (no stackeables según la definición)
      if (tipo === 'suerte_y_grade') {
        totalSuerte = Math.max(totalSuerte, suerte);
        totalGradeBonus = Math.max(totalGradeBonus, gradeBonus);
      } else if (tipo === 'suerte') {
        totalSuerte = Math.max(totalSuerte, suerte);
      } else if (tipo === 'aumento_calidad') {
        // DEPRECATED: aumento_calidad ahora se maneja como mayor_probabilidad_grado
        totalGradeBonus = Math.max(totalGradeBonus, gradeBonus);
      }
    });
    
    // Actualizar la tabla users con los nuevos valores
    const dineroPorSegundo = passiveTotals['dinero_por_segundo'] || 0;
    // mayor_costo_armas ahora está en formato porcentaje (7 = 7%)
    const mayorCostoArmas = parseFloat((passiveTotals['mayor_costo_armas'] || 0).toFixed(4));
    const menorCostoCajas = passiveTotals['menor_costo_caja'] || 0;
    const mayorExpCaja = passiveTotals['exp_extra'] || 0;
    
    await query('UPDATE users SET dinero_por_segundo = $1, mayor_costo_armas = $2, menor_costo_cajas_percent = $3, suerte = $4, mayor_probabilidad_grado = $5, mayor_exp_caja_percent = $6 WHERE id = $7', 
      [dineroPorSegundo, mayorCostoArmas, menorCostoCajas, totalSuerte, totalGradeBonus, mayorExpCaja, userId]);
    
    console.log(`✅ Pasivas recalculadas para usuario ${userId}:`);
    console.log(`   💰 Dinero/seg: $${dineroPorSegundo.toFixed(2)}`);
    console.log(`   💵 Mayor costo armas: ${mayorCostoArmas.toFixed(3)}%`);
    console.log(`   📦 Menor costo cajas: ${menorCostoCajas}%`);
    console.log(`   🍀 Suerte: ${totalSuerte}`);
    console.log(`   🎯 Mayor prob. grado: ${totalGradeBonus}`);
    console.log(`   ⭐ Mayor EXP caja: ${mayorExpCaja}%`);
    console.log(`   📊 Total items con pasivas: ${rows.length}`);
    
    callback(null, {
      dineroPorSegundo,
      mayorCostoArmas,
      menorCostoCajas,
      totalSuerte,
      totalGradeBonus,
      mayorExpCaja,
      totalItems: rows.length
    });
  } catch (error) {
    console.error('Error recalculando pasivas:', error);
    callback(error);
  }
}

// Obtener inventario del usuario
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await query(`
      SELECT i.* FROM inventory i
      LEFT JOIN market_listings ml ON i.id = ml.inventory_id AND ml.status = 'active'
      WHERE i.user_id = $1 AND ml.id IS NULL
      ORDER BY i.obtained_at DESC
    `, [userId]);
    
    const rows = result.rows;
    
    // Procesar las filas para convertir rarity y quality de JSON string a objeto
    const inventory = rows.map(row => {
      let pasiva = null;
      if (row.pasiva_tipo) {
        if (row.pasiva_tipo === 'suerte_y_grade' && row.pasiva_valor) {
          // Para pasivas complejas, parsear el JSON completo
          try {
            pasiva = JSON.parse(row.pasiva_valor);
          } catch (e) {
            // Fallback si no se puede parsear
            pasiva = {
              tipo: row.pasiva_tipo,
              valor: parseFloat(row.pasiva_valor || 0),
              stackeable: row.pasiva_stackeable === 1
            };
          }
        } else if (row.pasiva_valor) {
          // Intentar parsear como JSON para pasivas guardadas con el nuevo formato
          try {
            pasiva = JSON.parse(row.pasiva_valor);
          } catch (e) {
            // Si no es JSON, es el formato antiguo con valor numérico
            pasiva = {
              tipo: row.pasiva_tipo,
              valor: parseFloat(row.pasiva_valor || 0),
              stackeable: row.pasiva_stackeable === 1
            };
          }
        } else {
          // Formato antiguo sin valor
          pasiva = {
            tipo: row.pasiva_tipo,
            valor: 0,
            stackeable: row.pasiva_stackeable === 1
          };
        }
      }
      
      return {
        ...row,
        rarity: JSON.parse(row.rarity),
        quality: row.quality ? JSON.parse(row.quality) : null,
        isConta: row.is_conta === 1,
        pasiva: pasiva
      };
    });
    
    res.json({
      success: true,
      inventory: inventory
    });
  } catch (error) {
    console.error('Error obteniendo inventario:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// Añadir arma al inventario
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { weaponId, weaponName, weaponRarity, weaponPrice, weaponImage, quality, finalPrice, isConta, pasiva, weaponType } = req.body;
    
    if (!weaponId || !weaponName || !weaponRarity || !weaponPrice || !weaponImage) {
      console.error('❌ Datos del arma incompletos');
      return res.status(400).json({ success: false, error: 'Datos del arma incompletos' });
    }
    
    // Crear objeto de rareza
    const rarityData = JSON.stringify({ name: weaponRarity });
    // Guardar la calidad como JSON si existe
    const qualityData = quality ? JSON.stringify(quality) : null;
    const actualPrice = finalPrice || weaponPrice;
    const isContaValue = isConta ? 1 : 0;
    
    // Procesar pasiva
    const pasivaData = pasiva ? JSON.stringify(pasiva) : null;
    
    const insertResult = await query(`
      INSERT INTO inventory (user_id, weapon_id, name, rarity, price, image, quality, final_price, is_conta, weapon_type, pasiva_tipo, pasiva_valor, pasiva_stackeable)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `, [userId, weaponId, weaponName, rarityData, weaponPrice, weaponImage, qualityData, actualPrice, isContaValue, weaponType || null, pasiva?.tipo || null, pasivaData, pasiva?.stackeable ? 1 : 0]);
    
    const inventoryId = insertResult.rows[0].id;
    
    // Incrementar estadísticas globales del arma
    const numericWeaponId = parseInt(weaponId);
    console.log(`📊 Actualizando estadísticas para arma ID: ${numericWeaponId}, isConta: ${isContaValue}`);
    
    let statsQuery;
    if (isContaValue === 1) {
      statsQuery = `UPDATE weapon_stats 
                    SET total_openings = total_openings + 1, 
                        current_existing = current_existing + 1,
                        total_conta_openings = total_conta_openings + 1,
                        current_conta_existing = current_conta_existing + 1
                    WHERE weapon_id = $1`;
    } else {
      statsQuery = `UPDATE weapon_stats 
                    SET total_openings = total_openings + 1, 
                        current_existing = current_existing + 1 
                        WHERE weapon_id = $1`;
    }
    
    const statsResult = await query(statsQuery, [numericWeaponId]);
    console.log(`✅ Estadísticas actualizadas. Filas afectadas: ${statsResult.rowCount}`);
    
    // Verificar el resultado
    const statsCheck = await query('SELECT * FROM weapon_stats WHERE weapon_id = $1', [numericWeaponId]);
    if (statsCheck.rows.length > 0) {
      console.log(`📈 Estadísticas actuales arma ${numericWeaponId}:`, statsCheck.rows[0]);
    }
    
    // Recalcular pasivas del usuario después de añadir el arma
    recalculateUserPassives(userId, (recalcErr) => {
      if (recalcErr) {
        console.error('Error recalculando pasivas:', recalcErr);
      }
    });
    
    console.log(`✅ Arma ${weaponName} añadida al inventario del usuario ${userId}`);
    res.json({
      success: true,
      message: `${weaponName} añadido al inventario`,
      inventoryId: inventoryId
    });
  } catch (error) {
    console.error('Error añadiendo al inventario:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});// Función auxiliar para vender por id de inventario
async function sellInventoryItemById(userId, inventoryId, res) {
  try {
    // Primero obtener las estadísticas pasivas del usuario
    const statsResult = await query('SELECT mayor_costo_armas FROM users WHERE id = $1', [userId]);
    const userStats = statsResult.rows[0];
    const bonusPercent = userStats?.mayor_costo_armas || 0;

    // Obtener la información del arma en inventario
    const itemResult = await query(
      `SELECT * FROM inventory WHERE id = $1 AND user_id = $2`,
      [inventoryId, userId]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Arma no encontrada' });
    }

    const row = itemResult.rows[0];
    
    // Usar el precio final si existe, si no usar el precio base
    let salePrice = parseFloat(row.final_price || row.price);
    
    // Aplicar bonus de mayor costo de armas (porcentaje adicional)
    if (bonusPercent > 0) {
      salePrice = salePrice * (1 + bonusPercent / 100);
    }
    
    const weaponName = row.name;
    const weaponId = row.weapon_id;
    const isConta = row.is_conta === 1;

    if (!Number.isFinite(salePrice) || salePrice <= 0) {
      return res.status(400).json({ success: false, error: 'Precio inválido al vender' });
    }

    // Eliminar arma del inventario
    await query(`DELETE FROM inventory WHERE id = $1`, [inventoryId]);

    // Decrementar estadísticas globales del arma
    let statsQuery;
    if (isConta) {
      statsQuery = `UPDATE weapon_stats 
                   SET current_existing = CASE 
                     WHEN current_existing > 0 THEN current_existing - 1 
                     ELSE 0 
                   END,
                   current_conta_existing = CASE 
                     WHEN current_conta_existing > 0 THEN current_conta_existing - 1 
                     ELSE 0 
                   END 
                   WHERE weapon_id = $1`;
    } else {
      statsQuery = `UPDATE weapon_stats 
                   SET current_existing = CASE 
                     WHEN current_existing > 0 THEN current_existing - 1 
                     ELSE 0 
                   END 
                   WHERE weapon_id = $1`;
    }
    
    await query(statsQuery, [weaponId]);

    // Añadir dinero al usuario
    await query(
      `UPDATE users SET money = COALESCE(money, 0) + $1 WHERE id = $2`,
      [salePrice, userId]
    );

    // Obtener el nuevo balance
    const moneyResult = await query(`SELECT COALESCE(money, 0) as money FROM users WHERE id = $1`, [userId]);
    const moneyRow = moneyResult.rows[0];

    // Recalcular pasivas del usuario después de vender el arma
    recalculateUserPassives(userId, (recalcErr) => {
      if (recalcErr) {
        console.error('Error recalculando pasivas después de venta:', recalcErr);
      }
    });

    // Unificar respuesta con la esperada por el frontend
    return res.json({
      success: true,
      message: `${weaponName} vendido por $${salePrice.toFixed(2)}`,
      salePrice: salePrice,
      newMoney: parseFloat(moneyRow.money)
    });
  } catch (error) {
    console.error('Error vendiendo item:', error);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
}// Usar item especial (como Borde Thunder)
router.post('/use', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { inventoryId } = req.body;

    console.log('🔧 DEBUG: Intentando usar item', { userId, inventoryId });

    if (!inventoryId) {
      console.log('❌ DEBUG: inventoryId falta');
      return res.status(400).json({ success: false, error: 'inventoryId requerido' });
    }

    // Obtener información del item
    const result = await query(`
      SELECT i.*, i.weapon_id, i.pasiva_tipo, i.pasiva_valor
      FROM inventory i
      WHERE i.id = $1 AND i.user_id = $2
    `, [inventoryId, userId]);

    if (result.rows.length === 0) {
      console.log('❌ DEBUG: Item no encontrado en la base de datos');
      return res.status(404).json({ success: false, error: 'Item no encontrado' });
    }

    const item = result.rows[0];
    console.log('✅ DEBUG: Item encontrado:', JSON.stringify(item, null, 2));
    console.log('🔍 DEBUG: Comparando - weapon_id:', item.weapon_id, 'tipo:', typeof item.weapon_id);
    console.log('🔍 DEBUG: Comparando - name:', item.name, 'tipo:', typeof item.name);
    console.log('🔍 DEBUG: ¿Es 32?', item.weapon_id === 32, '¿Es "Borde Thunder"?', item.name === 'Borde Thunder');

    // Verificar si es el Borde Thunder (weapon_id 32 o nombre "Borde Thunder")
    if (item.weapon_id === 32 || item.name === 'Borde Thunder') {
      console.log('✅ DEBUG: Item es Borde Thunder, procediendo a desbloquear...');
      // Desbloquear el borde lightning para el usuario (PostgreSQL usa ON CONFLICT DO NOTHING)
      await query(`
        INSERT INTO unlocked_borders (user_id, border_id)
        VALUES ($1, 'lightning')
        ON CONFLICT (user_id, border_id) DO NOTHING
      `, [userId]);

      // Eliminar el item del inventario
      await query(`DELETE FROM inventory WHERE id = $1`, [inventoryId]);

      // Aplicar la pasiva permanente del borde
      // La pasiva ya está aplicada mientras el item esté en el inventario
      // Al usar el item, la pasiva se mantiene porque el borde queda desbloqueado
      // Pero necesitamos recalcular las pasivas después de eliminar el item
      
      recalculateUserPassives(userId, (recalcErr) => {
        if (recalcErr) {
          console.error('Error recalculando pasivas:', recalcErr);
        }
      });

      console.log('✅ DEBUG: Borde desbloqueado exitosamente!');
      res.json({
        success: true,
        message: '⚡ ¡Borde Thunder desbloqueado! Has obtenido +15 de suerte y +25% de experiencia permanentemente.',
        borderUnlocked: 'lightning'
      });
    } else {
      console.log('❌ DEBUG: Item NO es Borde Thunder, rechazando uso');
      console.log('❌ DEBUG: weapon_id recibido:', item.weapon_id, 'esperado: 32');
      console.log('❌ DEBUG: name recibido:', item.name, 'esperado: "Borde Thunder"');
      return res.status(400).json({ success: false, error: 'Este item no se puede usar' });
    }
  } catch (error) {
    console.error('❌ DEBUG: Error en /use:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// Vender arma del inventario por parámetro de ruta (compatibilidad)
router.post('/sell/:id', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const inventoryId = req.params.id;
  sellInventoryItemById(userId, inventoryId, res);
});

// Vender arma del inventario recibiendo id por cuerpo (lo que usa el frontend)
router.post('/sell', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { inventoryId } = req.body;

  if (!inventoryId) {
    return res.status(400).json({ success: false, error: 'inventoryId requerido' });
  }

  sellInventoryItemById(userId, inventoryId, res);
});

// Vender arma directamente (sin añadir al inventario)
router.post('/sell-direct', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { weaponPrice } = req.body;
    
    if (!weaponPrice || weaponPrice <= 0) {
      return res.status(400).json({ success: false, error: 'Precio del arma inválido' });
    }
    
    const salePrice = parseFloat(weaponPrice);
    
    // Añadir dinero al usuario directamente
    await query(`
      UPDATE users SET money = COALESCE(money, 0) + $1 WHERE id = $2
    `, [salePrice, userId]);
    
    // Obtener el nuevo balance
    const result = await query(`SELECT COALESCE(money, 0) as money FROM users WHERE id = $1`, [userId]);
    const moneyRow = result.rows[0];
    
    res.json({
      success: true,
      message: `Arma vendida por $${salePrice.toFixed(2)}`,
      salePrice: salePrice,
      newMoney: parseFloat(moneyRow.money)
    });
  } catch (error) {
    console.error('Error en sell-direct:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// Obtener dinero del usuario
router.get('/money', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await query(`SELECT money FROM users WHERE id = $1`, [userId]);
    const row = result.rows[0];
    
    res.json({
      success: true,
      money: parseFloat(row.money) || 0
    });
  } catch (error) {
    console.error('Error obteniendo dinero:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// Endpoint para recalcular pasivas de todos los usuarios
router.post('/recalculate-all-passives', async (req, res) => {
  try {
    // Obtener todos los usuarios
    const result = await query('SELECT id FROM users', []);
    const users = result.rows;
    
    const total = users.length;
    
    if (total === 0) {
      return res.json({ success: true, message: 'No hay usuarios para recalcular' });
    }
    
    let completed = 0;
    for (const user of users) {
      recalculateUserPassives(user.id, (recalcErr) => {
        completed++;
        if (recalcErr) {
          console.error(`Error recalculando pasivas para usuario ${user.id}:`, recalcErr);
        }
        
        if (completed === total) {
          console.log(`✅ Recálculo completado para ${total} usuarios`);
          res.json({ success: true, message: `Pasivas recalculadas para ${total} usuarios` });
        }
      });
    }
  } catch (error) {
    console.error('Error en recalculate-all-passives:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// Endpoint para recalcular pasivas de un usuario específico
router.post('/recalculate-passives', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  recalculateUserPassives(userId, (err, passiveTotals) => {
    if (err) {
      console.error('Error recalculando pasivas:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Error recalculando pasivas' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Pasivas recalculadas correctamente',
      stats: passiveTotals
    });
  });
});

module.exports = router;