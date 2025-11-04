// ===== SISTEMA DE ICONOS DE PERFIL =====

class PlayerIconSystem {
    constructor() {
        this.selectedIcon = localStorage.getItem('playerIcon') || '/arma/glock 17 cereza.png';
        this.unlockedIcons = new Set(['/arma/glock 17 cereza.png']);
        this.init();
    }

    async init() {
        console.log('🎨 Iniciando Sistema de Iconos de Perfil...');
        await this.loadUnlockedIconsFromBackend();
        this.updatePlayerIcon();
        this.setupEventListeners();
    }

    async loadUnlockedIconsFromBackend() {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        try {
            const res = await fetch('/api/iconos/unlocked', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success && Array.isArray(data.unlocked_icons)) {
                this.unlockedIcons = new Set(data.unlocked_icons);
            } else {
                this.unlockedIcons = new Set(['/arma/glock 17 cereza.png']);
            }
            
            // Refrescar UI si el selector está abierto
            this.refreshIconSelectorUI();
        } catch (e) {
            this.unlockedIcons = new Set(['/arma/glock 17 cereza.png']);
        }
    }

    refreshIconSelectorUI() {
        // Solo actualizar si el modal está abierto
        const modal = document.getElementById('icon-selector-modal');
        if (!modal || !modal.classList.contains('active')) return;

        // Actualizar los iconos en el grid
        const iconItems = document.querySelectorAll('.icon-item');
        iconItems.forEach(item => {
            const iconPath = item.dataset.icon;
            const isUnlocked = this.unlockedIcons.has(iconPath);
            
            if (isUnlocked) {
                item.classList.remove('locked');
                // Agregar event listener si no lo tiene
                if (!item.onclick) {
                    item.addEventListener('click', () => this.selectIcon(iconPath));
                }
            } else {
                item.classList.add('locked');
            }
        });
    }

    setupEventListeners() {
        // Click en el icono del jugador para abrir el menú de perfil
        const playerIcon = document.getElementById('player-icon');
        playerIcon?.addEventListener('click', () => this.openPlayerMenu());

        // Botón de cerrar menú de perfil (X)
        const closeMenuBtn = document.getElementById('close-player-menu');
        closeMenuBtn?.addEventListener('click', () => this.closePlayerMenu());

        // Botón para abrir selector de iconos desde el menú de perfil
        const openIconSelectorBtn = document.getElementById('open-icon-selector-btn');
        openIconSelectorBtn?.addEventListener('click', () => this.openIconSelector());

        // Botón de cerrar selector de iconos (X)
        const closeBtn = document.getElementById('close-icon-selector');
        closeBtn?.addEventListener('click', () => this.closeIconSelector());

        // Cerrar modales al hacer click fuera
        const playerMenuModal = document.getElementById('player-menu-modal');
        playerMenuModal?.addEventListener('click', (e) => {
            if (e.target === playerMenuModal) {
                this.closePlayerMenu();
            }
        });

        const iconModal = document.getElementById('icon-selector-modal');
        iconModal?.addEventListener('click', (e) => {
            if (e.target === iconModal) {
                this.closeIconSelector();
            }
        });

        // Tecla ESC para cerrar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (iconModal?.classList.contains('active')) {
                    this.closeIconSelector();
                } else if (playerMenuModal?.classList.contains('active')) {
                    this.closePlayerMenu();
                }
            }
        });
    }

    async openPlayerMenu() {
        console.log('👤 Abriendo menú de perfil...');
        const modal = document.getElementById('player-menu-modal');
        if (!modal) return;

        // Cargar armas más caras
        await this.loadTopWeapons();

        modal.classList.add('active');
    }

    closePlayerMenu() {
        const modal = document.getElementById('player-menu-modal');
        modal?.classList.remove('active');
    }

    async loadPlayerStats() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            // Obtener estadísticas
            const response = await fetch('/api/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            
            if (data.success && data.stats) {
                const stats = data.stats;
                
                document.getElementById('menu-boxes-opened').textContent = stats.boxesOpened || 0;
                document.getElementById('menu-total-spent').textContent = `$${(stats.totalSpent || 0).toFixed(2)}`;
                document.getElementById('menu-total-earned').textContent = `$${(stats.totalEarned || 0).toFixed(2)}`;
                document.getElementById('menu-items-sold').textContent = stats.itemsSold || 0;
                document.getElementById('menu-most-expensive').textContent = `$${(stats.mostExpensiveItem || 0).toFixed(2)}`;
                
                // Calcular balance actual (dinero del usuario)
                const userResponse = await fetch('/api/auth/verify', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const userData = await userResponse.json();
                
                if (userData.success && userData.user) {
                    document.getElementById('menu-current-balance').textContent = `$${(userData.user.money || 0).toFixed(2)}`;
                }
            }
        } catch (error) {
            console.error('❌ Error cargando estadísticas:', error);
        }
    }

    async loadTopWeapons() {
        const topWeaponsGrid = document.getElementById('top-weapons-grid');
        
        if (!topWeaponsGrid) {
            console.error('❌ No se encontró el elemento top-weapons-grid');
            return;
        }

        try {
            console.log('🔫 Cargando top armas...');
            const token = localStorage.getItem('authToken');
            console.log('🔑 Token:', token ? 'Existe ✓' : 'NO EXISTE ✗');
            
            if (!token) {
                console.error('❌ No hay token de autenticación');
                topWeaponsGrid.innerHTML = '<div class="no-weapons-message">Inicia sesión para ver tus armas</div>';
                return;
            }

            // Obtener inventario
            const response = await fetch('/api/inventory', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (data.success && data.inventory && data.inventory.length > 0) {
                // Ordenar por precio final (si tiene) o precio base, descendente
                const topWeapons = [...data.inventory]
                    .sort((a, b) => {
                        const priceA = a.final_price || a.price || 0;
                        const priceB = b.final_price || b.price || 0;
                        return priceB - priceA;
                    })
                    .slice(0, 3);

                console.log('🏆 Top 3 armas:', topWeapons);

                topWeaponsGrid.innerHTML = '';

                topWeapons.forEach((weapon, index) => {
                    // Manejar rareza como objeto o string
                    const rarityName = typeof weapon.rarity === 'object' && weapon.rarity.name 
                        ? weapon.rarity.name 
                        : weapon.rarity || 'Común';
                    
                    // Obtener calidad con logs de debug
                    
                    let quality = null;
                    if (weapon.quality) {
                        if (typeof weapon.quality === 'string') {
                            try {
                                quality = JSON.parse(weapon.quality);
                            } catch (e) {
                            }
                        } else if (typeof weapon.quality === 'object') {
                            quality = weapon.quality;
                        }
                    }
                    
                    const qualityGrade = quality ? quality.letter : null;
                    
                    const card = document.createElement('div');
                    card.className = `top-weapon-card ${this.getInventoryRarityClass(rarityName)}`;
                    
                    const rarityClass = this.getRarityTextClass(rarityName);
                    const displayPrice = weapon.final_price || weapon.price || 0;
                    
                    // Indicador de Conta
                    const contaBadge = weapon.isConta ? '<div class="conta-badge-top">CONTA</div>' : '';
                    
                    // Badge de calidad con atributo data-grade para los colores
                    const qualityBadge = qualityGrade ? `<div class="quality-badge-top" data-grade="${qualityGrade}">${qualityGrade}</div>` : '';
                    
                    card.innerHTML = `
                        <div class="top-weapon-rank">${index + 1}</div>
                        ${contaBadge}
                        ${qualityBadge}
                        <img src="${weapon.image}" alt="${weapon.name}" class="top-weapon-image">
                        <div class="top-weapon-info">
                            <div class="top-weapon-name">${weapon.name}</div>
                            <div class="top-weapon-price">$${displayPrice.toFixed(2)}</div>
                            <div class="top-weapon-rarity ${rarityClass}">${rarityName}</div>
                        </div>
                    `;
                    
                    topWeaponsGrid.appendChild(card);
                });
                
            } else {
                console.log('⚠️ No hay armas en el inventario o respuesta incorrecta');
                console.log('📊 Detalles:', { 
                    success: data.success, 
                    hasInventory: !!data.inventory, 
                    inventoryLength: data.inventory?.length 
                });
                topWeaponsGrid.innerHTML = '<div class="no-weapons-message">No tienes armas en tu inventario todavía</div>';
            }
        } catch (error) {
            console.error('❌ Error cargando top armas:', error);
            console.error('❌ Stack:', error.stack);
            topWeaponsGrid.innerHTML = '<div class="no-weapons-message">Error cargando armas</div>';
        }
    }

    getInventoryRarityClass(rarity) {
        if (!rarity) return 'rarity-comun';
        
        const rarityNormalized = rarity.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '_');
        
        return `rarity-${rarityNormalized}`;
    }

    getRarityTextClass(rarity) {
        if (!rarity) return 'rarity-text-common';
        
        const rarityLower = rarity.toLowerCase();
        
        if (rarityLower.includes('legendario')) return 'rarity-text-legendario';
        if (rarityLower.includes('epico') || rarityLower.includes('épico')) return 'rarity-text-epico';
        if (rarityLower.includes('raro')) return 'rarity-text-raro';
        if (rarityLower.includes('poco')) return 'rarity-text-poco-comun';
        
        return 'rarity-text-comun';
    }

    async openIconSelector() {
        console.log('🎨 Abriendo selector de iconos...');
        const modal = document.getElementById('icon-selector-modal');
        const iconsGrid = document.querySelector('.icons-grid');
        if (!modal || !iconsGrid) return;

        // Obtener todos los armas disponibles
        const weapons = await this.getAllWeapons();
        // Limpiar grid
        iconsGrid.innerHTML = '';

        // Crear elementos de iconos
        weapons.forEach(weapon => {
            // Un icono está desbloqueado para siempre si está en this.unlockedIcons
            const isUnlocked = this.unlockedIcons.has(weapon.image);
            const isSelected = this.selectedIcon === weapon.image;

            const iconItem = document.createElement('div');
            iconItem.className = `icon-item ${isUnlocked ? '' : 'locked'} ${isSelected ? 'selected' : ''}`;
            iconItem.dataset.icon = weapon.image;

            iconItem.innerHTML = `
                <img src="${weapon.image}" alt="${weapon.name}">
            `;

            // Solo permitir click si está desbloqueado
            if (isUnlocked) {
                iconItem.addEventListener('click', () => this.selectIcon(weapon.image));
            }

            iconsGrid.appendChild(iconItem);
        });

        modal.classList.add('active');
    }

    closeIconSelector() {
        const modal = document.getElementById('icon-selector-modal');
        modal?.classList.remove('active');
    }

    async selectIcon(iconImage) {
        // Guardar selección
        this.selectedIcon = iconImage;
        localStorage.setItem('playerIcon', iconImage);

        // Actualizar visualización
        this.updatePlayerIcon();

        // Actualizar grid (quitar selected de todos, añadir al seleccionado)
        document.querySelectorAll('.icon-item').forEach(item => {
            item.classList.remove('selected');
            if (item.dataset.icon === iconImage) {
                item.classList.add('selected');
            }
        });
        
        // Guardar en el backend
        await this.saveSelectedIconToBackend(iconImage);
        
        // Actualizar información del chat si está disponible
        if (window.chatSystem && authSystem && authSystem.currentUser) {
            window.chatSystem.updateUserInfo(
                authSystem.currentUser.username,
                authSystem.currentUser.level || 1,
                iconImage
            );
        }

        // Cerrar modal después de un momento
        setTimeout(() => this.closeIconSelector(), 500);
    }

    updatePlayerIcon() {
        const playerIconImg = document.getElementById('player-icon-img');
        if (!playerIconImg) return;

        playerIconImg.src = this.selectedIcon;
    }

    async unlockIcon(weaponImage) {
        console.log('🔓 Desbloqueando icono:', weaponImage);
        this.unlockedIcons.add(weaponImage);
        await this.saveUnlockedIconsToBackend();
    }

    async saveSelectedIconToBackend(icon) {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        try {
            const response = await fetch('/api/iconos/select', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ icon })
            });
            const data = await response.json();
            if (data.success) {
                console.log('✅ Icono seleccionado guardado en el backend');
            }
        } catch (e) {
            console.error('Error al guardar icono seleccionado:', e);
        }
    }

    async saveUnlockedIconsToBackend() {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        try {
            await fetch('/api/iconos/unlocked', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ unlocked_icons: [...this.unlockedIcons] })
            });
        } catch (e) {
            // ...existing code...
        }
    }

    async getAllWeapons() {
        // Obtener todas las armas únicas del sistema
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/boxes', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            if (!data.success || !data.boxes) {
                console.error('❌ Respuesta inválida de /api/boxes:', data);
                return [];
            }
            
            // Extraer todas las armas de todas las cajas y eliminar duplicados
            const allWeapons = [];
            const seenImages = new Set();
            
            data.boxes.forEach(box => {
                // Las armas pueden estar en box.items o box.availableWeapons
                const weapons = box.items || box.availableWeapons || [];
                
                weapons.forEach(weapon => {
                    if (!seenImages.has(weapon.image)) {
                        seenImages.add(weapon.image);
                        allWeapons.push(weapon);
                    }
                });
            });

            // Ordenar por nombre
            allWeapons.sort((a, b) => a.name.localeCompare(b.name));
            
            return allWeapons;
        } catch (error) {
            console.error('❌ Error obteniendo armas:', error);
            return [];
        }
    }
}

// Inicializar sistema de iconos cuando la página cargue
window.playerIconSystem = null;
document.addEventListener('DOMContentLoaded', () => {
    window.playerIconSystem = new PlayerIconSystem();
});
