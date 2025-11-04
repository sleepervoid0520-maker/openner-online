const express = require('express');
const router = express.Router();
const { db } = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

// Obtener top 20 jugadores con más dinero
router.get('/top-money', authenticateToken, (req, res) => {
    const query = `
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

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error al obtener ranking de dinero:', err);
            return res.status(500).json({ error: 'Error al obtener ranking' });
        }
        res.json(rows);
    });
});

// Obtener top 20 jugadores con las 3 armas más caras
router.get('/top-weapons', authenticateToken, (req, res) => {
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

    db.all(usersQuery, [], (err, users) => {
        if (err) {
            console.error('Error al obtener ranking de armas:', err);
            return res.status(500).json({ error: 'Error al obtener ranking' });
        }

        // Para cada usuario, obtener sus 3 armas más caras con todos los detalles
        const results = [];
        let processed = 0;

        if (users.length === 0) {
            return res.json([]);
        }

        users.forEach(user => {
            const weaponsQuery = `
                SELECT name, price, image, quality, rarity, final_price
                FROM inventory
                WHERE user_id = ?
                ORDER BY price DESC
                LIMIT 3
            `;

            db.all(weaponsQuery, [user.id], (err, weapons) => {
                if (err) {
                    console.error('Error al obtener armas del usuario:', err);
                    weapons = [];
                }

                results.push({
                    id: user.id,
                    username: user.username,
                    level: user.level,
                    selected_icon: user.selected_icon,
                    selected_border: user.selected_border,
                    total_weapons_value: user.total_weapons_value || 0,
                    weapons: weapons
                });

                processed++;
                if (processed === users.length) {
                    // Ordenar por valor total y enviar
                    results.sort((a, b) => b.total_weapons_value - a.total_weapons_value);
                    res.json(results);
                }
            });
        });
    });
});

// Obtener top 20 jugadores con mayor nivel
router.get('/top-level', authenticateToken, (req, res) => {
    const query = `
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

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error al obtener ranking de nivel:', err);
            return res.status(500).json({ error: 'Error al obtener ranking' });
        }
        res.json(rows);
    });
});

module.exports = router;
