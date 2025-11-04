// Script de ejemplo para desbloquear bordes desde cajas o logros

// ===== EJEMPLO 1: Desbloquear borde de fuego al abrir una caja especial =====
/*
async function handleSpecialBoxOpen(rarity) {
    // Si el arma es legendaria o superior, desbloquear borde de fuego
    if (rarity === 'Encubierta' || rarity === 'Mítica') {
        if (window.playerBorderSystem) {
            const unlocked = await window.playerBorderSystem.unlockBorder('fire');
            if (unlocked) {
                console.log('🔥 ¡Borde de fuego desbloqueado!');
            }
        }
    }
}
*/

// ===== EJEMPLO 2: Desbloquear borde de rayos al alcanzar nivel 10 =====
/*
function checkLevelUpRewards(newLevel) {
    if (newLevel === 10 && window.playerBorderSystem) {
        window.playerBorderSystem.unlockBorder('lightning');
    }
}
*/

// ===== EJEMPLO 3: Desbloquear todos los bordes (para desarrollo/testing) =====
/*
function unlockAllBorders() {
    if (window.playerBorderSystem) {
        window.playerBorderSystem.unlockBorder('fire');
        window.playerBorderSystem.unlockBorder('lightning');
        console.log('✨ Todos los bordes desbloqueados!');
    }
}
*/

// ===== EJEMPLO 4: Integración en el sistema de cajas existente =====
/*
// Agregar esto en el archivo donde manejes la apertura de cajas:

// Al final de la función que procesa la apertura de una caja:
if (weaponData.rarity === 'Encubierta') {
    // Probabilidad de desbloquear borde de fuego (30%)
    if (Math.random() < 0.3) {
        setTimeout(() => {
            window.playerBorderSystem?.unlockBorder('fire');
        }, 2000); // Esperar 2 segundos después de abrir la caja
    }
}

if (weaponData.rarity === 'Mítica') {
    // Probabilidad de desbloquear borde de rayos (50%)
    if (Math.random() < 0.5) {
        setTimeout(() => {
            window.playerBorderSystem?.unlockBorder('lightning');
        }, 2000);
    }
}
*/

// ===== PARA DEBUGGING: Desbloquear todos los bordes inmediatamente =====
// Puedes ejecutar esto en la consola del navegador para probar:
// window.playerBorderSystem.unlockBorder('fire');
// window.playerBorderSystem.unlockBorder('lightning');
