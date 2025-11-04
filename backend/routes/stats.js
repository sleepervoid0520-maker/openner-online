const express = require('express');
const { query } = require('../database/database-postgres');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Obtener estadísticas del usuario
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      stats: {
        id: user.id,
        username: user.username,
        level: user.level,
        experience: user.experience,
        experienceToNext: calculateExpForNextLevel(user.level) - user.experience,
        totalExpForCurrentLevel: calculateExpForNextLevel(user.level),
        memberSince: user.created_at,
        // Estadísticas de pasivas con nombres consistentes
        mayor_costo_armas: parseFloat(user.mayor_costo_armas || 0),
        suerte: parseInt(user.suerte || 0),
        menor_costo_caja: parseFloat(user.menor_costo_cajas_percent || 0),
        mayor_exp_caja: parseFloat(user.mayor_exp_caja_percent || 0),
        mayor_probabilidad_grado: parseInt(user.mayor_probabilidad_grado || 0),
        dinero_por_segundo: parseFloat(user.dinero_por_segundo || 0),
        dinero_por_segundo_porcentaje: parseFloat(user.dinero_por_segundo_porcentaje || 0)
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Añadir experiencia al usuario
router.post('/add-experience', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { experience } = req.body;

    if (!experience || experience <= 0) {
      return res.status(400).json({ error: 'Experiencia inválida' });
    }

    // Obtener datos actuales del usuario
    const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    let newExp = user.experience + experience;
    let newLevel = user.level;
    let leveledUp = false;

    // Calcular si sube de nivel (la exp se resetea al subir)
    while (newExp >= calculateExpForNextLevel(newLevel)) {
      newExp -= calculateExpForNextLevel(newLevel); // Restar la exp usada
      newLevel++;
      leveledUp = true;
    }

    // Actualizar en la base de datos
    await query(
      'UPDATE users SET level = $1, experience = $2 WHERE id = $3',
      [newLevel, newExp, userId]
    );

    res.json({
      success: true,
      message: leveledUp ? '¡Subiste de nivel!' : 'Experiencia añadida',
      leveledUp: leveledUp,
      newLevel: newLevel,
      newExperience: newExp,
      currentExp: newExp,
      maxExp: calculateExpForNextLevel(newLevel),
      experienceGained: experience,
      experienceToNext: calculateExpForNextLevel(newLevel) - newExp
    });
  } catch (error) {
    console.error('Error añadiendo experiencia:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Ruta temporal para recalcular nivel basado en experiencia actual
router.post('/recalculate-level', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    let totalExp = user.experience;
    let correctLevel = 1;
    let remainingExp = totalExp;
    
    // Calcular el nivel correcto restando la exp de cada nivel
    while (remainingExp >= calculateExpForNextLevel(correctLevel)) {
      let expForLevel = calculateExpForNextLevel(correctLevel);
      remainingExp -= expForLevel;
      correctLevel++;
    }
    
    // Actualizar nivel y experiencia (resetear a la exp del nivel actual)
    await query('UPDATE users SET level = $1, experience = $2 WHERE id = $3', [correctLevel, remainingExp, userId]);
    
    res.json({
      success: true,
      oldLevel: user.level,
      newLevel: correctLevel,
      experience: remainingExp,
      message: `Nivel recalculado de ${user.level} a ${correctLevel} con ${remainingExp} XP`
    });
  } catch (error) {
    console.error('Error recalculando nivel:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Función para calcular experiencia TOTAL acumulada necesaria para alcanzar un nivel
function calculateTotalExpForLevel(level) {
  let totalExp = 0;
  for (let i = 1; i < level; i++) {
    totalExp += i * 100 + (i - 1) * 50;
  }
  return totalExp;
}

// Función para calcular experiencia necesaria para el próximo nivel
function calculateExpForNextLevel(level) {
  // Fórmula: nivel * 100 + (nivel - 1) * 50
  return level * 100 + (level - 1) * 50;
}

module.exports = router;