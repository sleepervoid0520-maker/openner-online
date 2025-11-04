// Sistema de Visualización de Perfiles de Otros Jugadores
class PlayerProfileViewer {
    constructor() {
        this.modal = document.getElementById('player-profile-modal');
        this.closeBtn = document.getElementById('close-player-profile');
        this.apiUrl = '/api';
        
        this.initializeElements();
        this.setupEventListeners();
    }
    
    initializeElements() {
        // Elementos del modal
        this.usernameDisplay = document.getElementById('profile-player-username');
        this.levelDisplay = document.getElementById('profile-player-level');
        this.moneyDisplay = document.getElementById('profile-player-money');
        
        // Grid de armas
        this.topWeaponsGrid = document.getElementById('profile-top-weapons-grid');
    }
    
    setupEventListeners() {
        // Cerrar modal
        this.closeBtn.addEventListener('click', () => this.closeProfile());
        
        // Cerrar al hacer click fuera del modal
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeProfile();
            }
        });
        
        // Cerrar con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.closeProfile();
            }
        });
    }
    
    async openProfile(username) {
        try {
            // Mostrar loading
            this.showLoading(true);
            
            // Obtener token
            const token = localStorage.getItem('authToken');
            if (!token) {
                this.showNotification('Debes iniciar sesión para ver perfiles', 'error');
                return;
            }
            
            // Hacer petición al backend
            const response = await fetch(`${this.apiUrl}/player/${encodeURIComponent(username)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.displayProfile(data.player);
                this.modal.classList.add('active');
            } else {
                this.showNotification(data.error || 'Error al cargar perfil', 'error');
            }
            
        } catch (error) {
            console.error('Error al cargar perfil:', error);
            this.showNotification('Error de conexión', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    displayProfile(player) {
        // Información básica
        this.usernameDisplay.textContent = player.username;
        this.levelDisplay.textContent = player.level;
        this.moneyDisplay.textContent = `$${this.formatNumber(player.money || 0)}`;
        
        // Top 3 armas
        this.displayTopWeapons(player.top_weapons);
    }
    
    displayTopWeapons(weapons) {
        this.topWeaponsGrid.innerHTML = '';
        
        console.log('Top weapons received:', weapons); // Debug
        
        if (!weapons || weapons.length === 0) {
            this.topWeaponsGrid.innerHTML = '<div class="profile-no-weapons">Este jugador aún no tiene armas en su inventario</div>';
            return;
        }
        
        weapons.forEach(weapon => {
            // Mapeo robusto de rareza
            function normalizeRarityKey(rarity) {
                if (!rarity) return '';
                let r = rarity.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
                if (r === 'comun') return 'COMUN';
                if (r === 'poco comun') return 'POCO_COMUN';
                if (r === 'raro') return 'RARO';
                if (r === 'epico') return 'EPICO';
                if (r === 'legendario') return 'LEGENDARIO';
                if (r === 'mitico') return 'MITICO';
                // fallback: buscar por inclusión
                if (r.includes('poco')) return 'POCO_COMUN';
                if (r.includes('comun')) return 'COMUN';
                if (r.includes('raro')) return 'RARO';
                if (r.includes('epic')) return 'EPICO';
                if (r.includes('legend')) return 'LEGENDARIO';
                if (r.includes('mitic')) return 'MITICO';
                return r.toUpperCase().replace(/\s/g, '_');
            }
            const rarityKey = normalizeRarityKey(weapon.rarity);
            const rarityData = window.WeaponsSystem?.RARITIES?.[rarityKey] || null;
            const rarityName = rarityData ? rarityData.name : (weapon.rarity || '');
            const rarityColor = rarityData ? rarityData.color : '#fff';
            const rarityGlow = rarityData ? rarityData.glow : 'rgba(255,255,255,0.1)';

            const weaponCard = document.createElement('div');
            weaponCard.className = 'profile-weapon-card';

            // Parsear quality si es un string JSON y obtener color
            let qualityText = '';
            let qualityColor = '#fff';
            if (weapon.quality) {
                try {
                    const qualityObj = typeof weapon.quality === 'string' 
                        ? JSON.parse(weapon.quality) 
                        : weapon.quality;
                    qualityText = qualityObj.name || weapon.quality;
                    // Obtener color del grado
                    if (qualityObj && qualityObj.letter && window.WeaponsSystem?.QUALITY_GRADES?.[qualityObj.letter]) {
                        qualityColor = window.WeaponsSystem.QUALITY_GRADES[qualityObj.letter].color;
                    }
                } catch (e) {
                    qualityText = weapon.quality;
                }
            }

            weaponCard.innerHTML = `
                <div class="profile-weapon-image-container">
                    <img src="${weapon.weapon_image}" alt="${weapon.weapon_name}">
                </div>
                <div class="profile-weapon-info">
                    <div class="profile-weapon-name">${weapon.weapon_name}</div>
                    <div class="profile-weapon-rarity" style="color: ${rarityColor}; background: ${rarityGlow}; box-shadow: 0 0 12px 2px ${rarityGlow}; font-weight: bold; border-radius: 4px; padding: 2px 8px; margin-bottom: 4px;">
                        ${rarityName}
                    </div>
                    ${qualityText ? `<div class=\"weapon-quality\" style=\\"color: ${qualityColor}; border-color: ${qualityColor};\\">${qualityText}${weapon.isConta ? ' <span class=\\"conta-badge\\">(CONTA)</span>' : ''}</div>` : ''}
                    <div class="profile-weapon-price">$${parseFloat(weapon.price).toFixed(2)}</div>
                </div>
            `;

            this.topWeaponsGrid.appendChild(weaponCard);
        });
    }
    
    getRarityClass(rarity) {
        const rarityMap = {
            'encubierto': 'rarity-encubierto',
            'clasificado': 'rarity-clasificado',
            'restringido': 'rarity-restringido',
            'de_grado_militar': 'rarity-militar',
            'de_grado_industrial': 'rarity-industrial',
            'de_grado_consumidor': 'rarity-consumidor'
        };
        return rarityMap[rarity] || 'rarity-default';
    }
    
    formatRarity(rarity) {
        const rarityNames = {
            'encubierto': 'ENCUBIERTO',
            'clasificado': 'CLASIFICADO',
            'restringido': 'RESTRINGIDO',
            'de_grado_militar': 'DE GRADO MILITAR',
            'de_grado_industrial': 'DE GRADO INDUSTRIAL',
            'de_grado_consumidor': 'DE GRADO CONSUMIDOR'
        };
        return rarityNames[rarity] || rarity.toUpperCase();
    }
    
    closeProfile() {
        this.modal.classList.remove('active');
    }
    
    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = show ? 'flex' : 'none';
        }
    }
    
    showNotification(message, type = 'info') {
        // Usar el sistema de notificaciones si está disponible
        if (window.authSystem && window.authSystem.showNotification) {
            window.authSystem.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    formatNumber(num) {
        // Convertir a número si es string
        num = parseFloat(num);
        
        // Si es menor a 1000, mostrar el número completo
        if (num < 1000) {
            return num.toFixed(2);
        }
        
        // Para miles (K)
        if (num < 1000000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        
        // Para millones (M)
        if (num < 1000000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        
        // Para billones (B)
        if (num < 1000000000000) {
            return (num / 1000000000).toFixed(1) + 'B';
        }
        
        // Para trillones (T)
        return (num / 1000000000000).toFixed(1) + 'T';
    }
}

// Inicializar cuando el DOM esté listo
let playerProfileViewer;

document.addEventListener('DOMContentLoaded', () => {
    playerProfileViewer = new PlayerProfileViewer();
    window.playerProfileViewer = playerProfileViewer;
});
