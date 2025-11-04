const express = require('express');
const router = express.Router();
const { query } = require('../database/database-postgres');
const { authenticateToken } = require('../middleware/auth');

// Obtener perfil de un jugador por username
router.get('/:username', authenticateToken, async (req, res) => {
    try {
        const { username } = req.params;
        
        // Obtener información del usuario
        const userResult = await query(
            'SELECT id, username, level, experience, money, created_at FROM users WHERE username = $1',
            [username]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Usuario no encontrado' 
            });
        }

        const user = userResult.rows[0];

        // Obtener estadísticas del jugador desde el inventario
        const statsResult = await query(
            `SELECT 
                weapon_id,
                name as weapon_name,
                rarity,
                price,
                COUNT(*) as times_obtained
            FROM inventory
            WHERE user_id = $1
            GROUP BY weapon_id, name, rarity, price
            ORDER BY times_obtained DESC`,
            [user.id]
        );
        const stats = statsResult.rows;

        // Calcular estadísticas generales
        const totalWeaponsObtained = stats.reduce((sum, stat) => sum + parseInt(stat.times_obtained), 0);
        
        // Contar armas vendidas (necesitamos otra query o tabla para esto)
        const totalWeaponsSold = 0; // Por ahora 0, se puede implementar con historial
        
        // Calcular dinero total ganado (aproximado desde el inventario)
        const totalMoneyEarned = parseFloat(user.money || 0);

        // Obtener top 3 armas por rareza en el inventario
        const topWeaponsResult = await query(
            `SELECT 
                weapon_id,
                name as weapon_name,
                image as weapon_image,
                price,
                rarity,
                quality,
                obtained_at
            FROM inventory
            WHERE user_id = $1
            ORDER BY 
                CASE rarity
                    WHEN 'encubierto' THEN 1
                    WHEN 'clasificado' THEN 2
                    WHEN 'restringido' THEN 3
                    WHEN 'de_grado_militar' THEN 4
                    WHEN 'de_grado_industrial' THEN 5
                    WHEN 'de_grado_consumidor' THEN 6
                    ELSE 7
                END,
                price DESC
            LIMIT 3`,
            [user.id]
        );
        const topWeapons = topWeaponsResult.rows;

        // Obtener armas desbloqueadas en el DEX
        const unlockedResult = await query(
            'SELECT unlocked_weapons FROM users WHERE id = $1',
            [user.id]
        );
        const unlocked = unlockedResult.rows[0]?.unlocked_weapons || '[]';
        const unlockedWeapons = JSON.parse(unlocked).length;

        res.json({
            success: true,
            player: {
                username: user.username,
                level: user.level,
                experience: user.experience,
                money: user.money,
                member_since: user.created_at,
                stats: {
                    total_weapons_obtained: totalWeaponsObtained,
                    total_weapons_sold: totalWeaponsSold,
                    total_money_earned: totalMoneyEarned,
                    weapons_unlocked: unlockedWeapons,
                    total_unique_weapons: stats.length
                },
                top_weapons: topWeapons,
                weapon_stats: stats.slice(0, 10) // Top 10 armas más obtenidas
            }
        });

    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener perfil del jugador' 
        });
    }
});

module.exports = router;
