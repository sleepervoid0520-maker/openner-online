const express = require('express');
const { db } = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

// Debug: Verificar si el sistema de armas se importa correctamente
try {
  const weaponsModule = require('../../frontend/armas.js');
  
  const { getWeaponsForBox, generateRandomLoot, generateRouletteItems } = weaponsModule;
  
  // Test básico
  const testWeapons = getWeaponsForBox(1);
  
} catch (error) {
  console.error('❌ Error importando sistema de armas:', error);
}

// Declarar las funciones después de la importación
let getWeaponsForBox, generateRandomLoot, generateRouletteItems;

try {
  const weaponsModule = require('../../frontend/armas.js');
  ({ getWeaponsForBox, generateRandomLoot, generateRouletteItems } = weaponsModule);
} catch (error) {
  console.error('❌ Error asignando funciones del sistema de armas:', error);
  
  // Funciones fallback
  getWeaponsForBox = () => [];
  generateRandomLoot = () => null;
  generateRouletteItems = () => [];
}

const router = express.Router();

// Funciones de cálculo de experiencia
function calculateTotalExpForLevel(level) {
  let totalExp = 0;
  for (let i = 1; i < level; i++) {
    totalExp += i * 100 + (i - 1) * 50;
  }
  return totalExp;
}

function calculateExpForNextLevel(level) {
  return level * 100 + (level - 1) * 50;
}

// Obtener todas las cajas disponibles (ruta principal)
router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.id;

  // Consultar estadísticas pasivas del usuario
  db.get('SELECT menor_costo_cajas_percent FROM users WHERE id = ?', [userId], (err, userStats) => {
    if (err) {
      console.error('Error obteniendo stats de usuario:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    const discountPercent = userStats?.menor_costo_cajas_percent || 0;

    // Obtener armas disponibles para todas las cajas
    const boxWeapons1 = getWeaponsForBox(1);
    const boxWeapons2 = getWeaponsForBox(2);
    const boxWeapons3 = getWeaponsForBox(3);
    const boxWeapons4 = getWeaponsForBox(4);

    const boxes = [
      {
        id: 1,
        name: "OPENER GUNS",
        description: "Caja con armas variadas",
        originalPrice: 0,
        price: 0, // Gratis siempre
        priceText: "Gratis",
        image: "/cajas/1.png",
        weaponTypes: [],
        availableWeapons: boxWeapons1,
        weaponCount: boxWeapons1.length,
        isActive: true
      },
      {
        id: 2,
        name: "Caja somp",
        description: "Caja especial con armas exclusivas",
        originalPrice: 65,
        price: Math.max(0, Math.round(65 * (1 - discountPercent / 100))),
        priceText: discountPercent > 0 ? `$${Math.max(0, Math.round(65 * (1 - discountPercent / 100)))}` : "$65",
        image: "/cajas/2.png",
        weaponTypes: [],
        availableWeapons: boxWeapons2,
        weaponCount: boxWeapons2.length,
        isActive: true,
        discountApplied: discountPercent > 0
      },
      {
        id: 3,
        name: "Caja Thunder",
        description: "Caja premium con armas legendarias y míticas",
        originalPrice: 350,
        price: Math.max(0, Math.round(350 * (1 - discountPercent / 100))),
        priceText: discountPercent > 0 ? `$${Math.max(0, Math.round(350 * (1 - discountPercent / 100)))}` : "$350",
        image: "/cajas/3.png",
        weaponTypes: [],
        availableWeapons: boxWeapons3,
        weaponCount: boxWeapons3.length,
        isActive: true,
        discountApplied: discountPercent > 0
      },
      {
        id: 4,
        name: "Caja Snonbli",
        description: "Caja snonbli con armas de alta calidad y pasivas poderosas",
        originalPrice: 1050,
        price: Math.max(0, Math.round(1050 * (1 - discountPercent / 100))),
        priceText: discountPercent > 0 ? `$${Math.max(0, Math.round(1050 * (1 - discountPercent / 100)))}` : "$1050",
        image: "/cajas/4.png",
        weaponTypes: [],
        availableWeapons: boxWeapons4,
        weaponCount: boxWeapons4.length,
        isActive: true,
        discountApplied: discountPercent > 0
      }
    ];

    res.json({
      success: true,
      boxes: boxes
    });
  });
});

// Obtener todas las cajas disponibles (ruta alternativa)
router.get('/available', (req, res) => {
  // Por ahora devolvemos una caja hardcodeada como pediste
  const boxes = [
    {
      id: 1,
      name: "OPENER GUNS",
      description: "Caja con armas variadas",
      price: 0, // Gratis como pediste
      priceText: "Gratis",
      image: "/cajas/1.png",
      weaponTypes: [], // Sin tipos de armas
      isActive: true
    }
  ];

  res.json({
    success: true,
    boxes: boxes
  });
});

// Obtener información de una caja específica
router.get('/:id', (req, res) => {
  const boxId = parseInt(req.params.id);
  
  if (boxId === 1) {
    res.json({
      success: true,
      box: {
        id: 1,
        name: "OPENER GUNS",
        description: "Caja con armas variadas",
        price: 0,
        priceText: "Gratis",
        image: "/cajas/1.png",
        weaponTypes: [], // Sin tipos de armas
        isActive: true
      }
    });
  } else {
    res.status(404).json({
      success: false,
      error: "Caja no encontrada"
    });
  }
});

// Ruta para abrir una caja (generar loot)
router.post('/open/:id', authenticateToken, (req, res) => {
  const boxId = parseInt(req.params.id);
  
  if (boxId === 1 || boxId === 2 || boxId === 3 || boxId === 4) {
    // Verificar que la función existe
    if (typeof generateRandomLoot !== 'function') {
      console.error('❌ generateRandomLoot no es una función');
      return res.status(500).json({
        success: false,
        error: "Error interno: función de loot no disponible"
      });
    }
    // Obtener las estadísticas pasivas del usuario
    db.get('SELECT suerte, mayor_probabilidad_grado, mayor_exp_caja_percent FROM users WHERE id = ?', [req.user.userId], (uErr, uRow) => {
      if (uErr) {
        console.error('Error obteniendo stats del usuario:', uErr);
        return res.status(500).json({ success: false, error: 'Error interno al obtener datos del usuario' });
      }

      const userLuck = (uRow && uRow.suerte) ? parseInt(uRow.suerte, 10) : 0;
      const gradeBonus = (uRow && uRow.mayor_probabilidad_grado) ? parseInt(uRow.mayor_probabilidad_grado) : 0;
      const expBonus = (uRow && uRow.mayor_exp_caja_percent) ? parseFloat(uRow.mayor_exp_caja_percent) : 0;
      
      // Generar loot aleatorio pasando la suerte y bonus de grado
      const wonItem = generateRandomLoot(boxId, userLuck, gradeBonus);

      if (wonItem) {
        // Calcular experiencia ganada con bonus según la caja
        let baseExp = 10; // Por defecto
        if (boxId === 1) {
          baseExp = 5; // Caja gratis da 5 EXP
        } else if (boxId === 2) {
          baseExp = 20; // Caja de 65 da 20 EXP
        } else if (boxId === 3) {
          baseExp = 50; // Caja Thunder da 50 EXP
        } else if (boxId === 4) {
          baseExp = 105; // Caja Snonbli da 105 EXP
        }
        
        // Aplicar bonus de mayor_exp_caja_percent
        const expGained = Math.round(baseExp * (1 + expBonus / 100));
        
        // Añadir experiencia y calcular niveles
        db.get('SELECT * FROM users WHERE id = ?', [req.user.userId], (err, user) => {
          if (err || !user) {
            console.error('Error obteniendo usuario para exp:', err);
            // Continuar sin actualizar experiencia
            const rouletteItems = generateRouletteItems(boxId, 50);
            return res.json({
              success: true,
              wonItem: wonItem,
              rouletteItems: rouletteItems,
              boxId: boxId,
              experienceGained: expGained,
              message: `¡Has ganado: ${wonItem.name}!`
            });
          }
          
          let newExp = user.experience + expGained;
          let newLevel = user.level;
          let leveledUp = false;
          
          // Calcular si sube de nivel (la exp se resetea al subir)
          while (newExp >= calculateExpForNextLevel(newLevel)) {
            newExp -= calculateExpForNextLevel(newLevel); // Restar la exp usada
            newLevel++;
            leveledUp = true;
          }
          
          // Actualizar nivel y experiencia
          db.run('UPDATE users SET level = ?, experience = ? WHERE id = ?', [newLevel, newExp, req.user.userId], (expErr) => {
            if (expErr) {
              console.error('Error actualizando nivel/experiencia:', expErr);
            }
            
            // Generar items para la ruleta
            const rouletteItems = generateRouletteItems(boxId, 50);
            res.json({
              success: true,
              wonItem: wonItem,
              rouletteItems: rouletteItems,
              boxId: boxId,
              experienceGained: expGained,
              leveledUp: leveledUp,
              newLevel: newLevel,
              message: `¡Has ganado: ${wonItem.name}!${leveledUp ? ' ¡SUBISTE DE NIVEL!' : ''}`
            });
          });
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Error generando loot"
        });
      }
    });
  } else {
    res.status(404).json({
      success: false,
      error: "Caja no encontrada"
    });
  }
});

// Ruta para obtener items de ruleta (para previsualización)
router.get('/roulette/:id', (req, res) => {
  const boxId = parseInt(req.params.id);
  
  if (boxId === 1 || boxId === 2 || boxId === 3) {
    const rouletteItems = generateRouletteItems(boxId, 50);
    
    res.json({
      success: true,
      items: rouletteItems,
      boxId: boxId
    });
  } else {
    res.status(404).json({
      success: false,
      error: "Caja no encontrada"
    });
  }
});

module.exports = router;