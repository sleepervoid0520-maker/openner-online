const express = require('express');
const router = express.Router();
const { query } = require('../database/database-postgres');
const { authenticateToken } = require('../middleware/auth');

// Obtener top 20 jugadores con más dinero
router.get('/top-money', authenticateToken, async (req, res) => {
    try {
        const queryText = `
            SELECT 
                u.id,
                u.username,
                u.money,
                u.level,
                u.selected_icon,
                u.selected_border,
                (SELECT image FROM inventory WHERE user_id = u.id ORDER BY price DESC LIMIT 1) as top_weapon_image
            FROM users u
            ORDER BY money DESC
            LIMIT 20
        `;

        const result = await query(queryText, []);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener ranking de dinero:', error);
        res.status(500).json({ error: 'Error al obtener ranking' });
    }
});

// Obtener top 20 jugadores con las 3 armas más caras
router.get('/top-weapons', authenticateToken, async (req, res) => {
    try {
        // Primero obtener los usuarios y el valor total
        const usersQuery = `
            SELECT 
                u.id,
                u.username,
                u.level,
                u.selected_icon,
                u.selected_border,
                (SELECT SUM(price) FROM inventory WHERE user_id = u.id ORDER BY price DESC LIMIT 3) as total_weapons_value
            FROM users u
            WHERE EXISTS (SELECT 1 FROM inventory WHERE user_id = u.id)
            ORDER BY total_weapons_value DESC
            LIMIT 20
        `;

        const usersResult = await query(usersQuery, []);
        const users = usersResult.rows;

        if (users.length === 0) {
            return res.json([]);
        }

        // Para cada usuario, obtener sus 3 armas más caras con todos los detalles
        const results = await Promise.all(users.map(async (user) => {
            const weaponsQuery = `
                SELECT name, price, image, quality, rarity, final_price
                FROM inventory
                WHERE user_id = $1
                ORDER BY price DESC
                LIMIT 3
            `;

            const weaponsResult = await query(weaponsQuery, [user.id]);

            return {
                id: user.id,
                username: user.username,
                level: user.level,
                selected_icon: user.selected_icon,
                selected_border: user.selected_border,
                total_weapons_value: user.total_weapons_value || 0,
                weapons: weaponsResult.rows
            };
        }));

        // Ordenar por valor total y enviar
        results.sort((a, b) => b.total_weapons_value - a.total_weapons_value);
        res.json(results);
    } catch (error) {
        console.error('Error al obtener ranking de armas:', error);
        res.status(500).json({ error: 'Error al obtener ranking' });
    }
});

// Obtener top 20 jugadores con mayor nivel
router.get('/top-level', authenticateToken, async (req, res) => {
    try {
        const queryText = `
            SELECT 
                u.id,
                u.username,
                u.level,
                u.experience,
                u.money,
                u.selected_icon,
                u.selected_border,
                (SELECT image FROM inventory WHERE user_id = u.id ORDER BY price DESC LIMIT 1) as top_weapon_image
            FROM users u
            ORDER BY level DESC, experience DESC
            LIMIT 20
        `;

        const result = await query(queryText, []);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener ranking de nivel:', error);
        res.status(500).json({ error: 'Error al obtener ranking' });
    }
});

module.exports = router;
