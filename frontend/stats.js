// Script de Sistema de Estadísticas
class StatsManager {
    constructor(authSystem) {
        this.authSystem = authSystem;
        this.apiUrl = '/api/stats';
        this.currentStats = null;
    }

    // Obtener estadísticas completas del usuario
    async getUserStats() {
        try {
            const response = await fetch(`${this.apiUrl}/user`, {
                headers: { 'Authorization': `Bearer ${this.authSystem.token}` }
            });

            const data = await response.json();

            if (data.success) {
                this.currentStats = data.stats;
                return data.stats;
            } else {
                console.error('Error obteniendo stats:', data.error);
                return null;
            }
        } catch (error) {
            console.error('Error en getUserStats:', error);
            return null;
        }
    }

    // Añadir experiencia al jugador
    async addExperience(amount) {
        if (!amount || amount <= 0) {
            console.error('Cantidad de experiencia inválida');
            return false;
        }

        try {
            const response = await fetch(`${this.apiUrl}/add-experience`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authSystem.token}`
                },
                body: JSON.stringify({ experience: amount })
            });

            const data = await response.json();

            if (data.success) {
                // Actualizar interfaz
                this.updateLevelDisplay(data.newLevel);
                
                // Mostrar notificación
                if (data.leveledUp) {
                    this.showLevelUpNotification(data.newLevel);
                } else {
                    this.showExpGainedNotification(amount);
                }

                // Actualizar stats locales
                if (this.currentStats) {
                    this.currentStats.level = data.newLevel;
                    this.currentStats.experience = data.newExperience;
                    this.currentStats.experienceToNext = data.experienceToNext;
                }

                // Actualizar en authSystem también
                if (this.authSystem.currentUser) {
                    this.authSystem.currentUser.level = data.newLevel;
                    this.authSystem.currentUser.experience = data.newExperience;
                }

                return data;
            } else {
                console.error('Error añadiendo experiencia:', data.error);
                return false;
            }
        } catch (error) {
            console.error('Error en addExperience:', error);
            return false;
        }
    }

    // Actualizar el display del nivel en la interfaz
    updateLevelDisplay(level) {
        const levelElement = document.getElementById('user-level');
        if (levelElement) {
            levelElement.textContent = level;
            
            // Efecto visual de cambio de nivel
            levelElement.style.animation = 'none';
            setTimeout(() => {
                levelElement.style.animation = 'levelUp 0.6s ease-out';
            }, 10);
        }

        // Actualizar barra de experiencia
        if (this.authSystem && this.authSystem.updateExperienceBar) {
            this.authSystem.updateExperienceBar();
        }
    }

    // Mostrar notificación de subida de nivel
    showLevelUpNotification(newLevel) {
        if (this.authSystem && this.authSystem.showNotification) {
            this.authSystem.showNotification(`🎉 ¡LEVEL UP! Nivel ${newLevel}`, 'success');
        }
        
        // Actualizar información del chat si está disponible
        if (window.chatSystem && this.authSystem && this.authSystem.currentUser) {
            const iconImg = document.getElementById('player-icon-img');
            window.chatSystem.updateUserInfo(
                this.authSystem.currentUser.username,
                newLevel,
                iconImg.src
            );
        }
        
        // Crear efecto visual especial
        this.createLevelUpEffect();
    }

    // Mostrar notificación de experiencia ganada
    showExpGainedNotification(expAmount) {
        if (this.authSystem && this.authSystem.showNotification) {
            this.authSystem.showNotification(`+${expAmount} XP`, 'success');
        }
    }

    // Crear efecto visual de subida de nivel
    createLevelUpEffect() {
        const effect = document.createElement('div');
        effect.className = 'level-up-effect';
        effect.innerHTML = '✨ LEVEL UP! ✨';
        effect.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 3rem;
            font-weight: 900;
            color: #ffd700;
            text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
            z-index: 10000;
            pointer-events: none;
            animation: levelUpPop 2s ease-out forwards;
            font-family: 'Orbitron', monospace;
        `;

        document.body.appendChild(effect);

        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 2000);
    }

    // Calcular experiencia necesaria para el próximo nivel
    calculateExpForLevel(level) {
        return level * 100 + (level - 1) * 50;
    }

    // Obtener porcentaje de progreso del nivel actual
    getLevelProgress() {
        if (!this.currentStats) return 0;
        
        const totalExpForLevel = this.calculateExpForLevel(this.currentStats.level);
        const progress = (this.currentStats.experience / totalExpForLevel) * 100;
        return Math.min(progress, 100);
    }

    // Métodos de utilidad para dar experiencia por acciones específicas
    async giveLoginBonus() {
        return await this.addExperience(10); // 10 XP por login
    }

    async giveRegistrationBonus() {
        return await this.addExperience(50); // 50 XP por registro
    }

    async giveActionExperience(action) {
        const expValues = {
            'open_box': 25,
            'daily_login': 15,
            'first_win': 100,
            'achievement': 75
        };

        const expAmount = expValues[action] || 5;
        return await this.addExperience(expAmount);
    }
}

// CSS para efectos visuales
const statsCSS = `
@keyframes levelUp {
    0% { 
        transform: scale(1); 
        color: var(--secondary-color);
    }
    50% { 
        transform: scale(1.3); 
        color: #ffd700;
        text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
    }
    100% { 
        transform: scale(1); 
        color: var(--secondary-color);
    }
}

@keyframes levelUpPop {
    0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 0;
    }
    20% {
        transform: translate(-50%, -50%) scale(1.2);
        opacity: 1;
    }
    80% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
    }
    100% {
        transform: translate(-50%, -50%) scale(0.8);
        opacity: 0;
    }
}

.level-up-effect {
    animation: levelUpPop 2s ease-out forwards !important;
}
`;

// Añadir CSS al documento
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = statsCSS;
    document.head.appendChild(styleSheet);
}

// Exportar para uso global
window.StatsManager = StatsManager;