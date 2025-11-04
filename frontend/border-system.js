// ===== SISTEMA DE BORDES DE PERFIL =====

class PlayerBorderSystem {
    constructor() {
        this.selectedBorder = localStorage.getItem('playerBorder') || 'none';
        this.unlockedBorders = new Set(['none']); // 'none' siempre desbloqueado
        this.borders = [
            {
                id: 'none',
                name: 'Sin Borde',
                icon: '❌',
                cssClass: '',
                unlocked: true
            },
            {
                id: 'fire',
                name: 'Fuego',
                icon: '🔥',
                cssClass: 'border-fire',
                unlocked: false
            },
            {
                id: 'lightning',
                name: 'Rayos',
                icon: '⚡',
                cssClass: 'border-lightning',
                unlocked: false
            }
        ];
        this.init();
    }

    async init() {
        console.log('🎨 Iniciando Sistema de Bordes de Perfil...');
        
        // RESETEAR BORDES - DESHABILITADO para mantener bordes desbloqueados permanentemente
        // await this.resetAllBorders();
        
        await this.loadUnlockedBordersFromBackend();
        this.updatePlayerBorder();
        this.setupEventListeners();
    }
    
    async resetAllBorders() {
        console.log('🔒 Reseteando todos los bordes...');
        const token = localStorage.getItem('authToken');
        if (!token) return;
        
        try {
            // Eliminar bordes de la base de datos
            await fetch('/api/borders/reset', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            // Resetear borde seleccionado a 'none'
            this.selectedBorder = 'none';
            localStorage.setItem('playerBorder', 'none');
            
            console.log('✅ Bordes reseteados correctamente');
        } catch (e) {
            console.log('⚠️ Error al resetear bordes:', e);
        }
    }

    async loadUnlockedBordersFromBackend() {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        
        try {
            const res = await fetch('/api/borders/unlocked', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success && Array.isArray(data.unlocked_borders)) {
                this.unlockedBorders = new Set(['none', ...data.unlocked_borders]);
                
                // Actualizar estado de desbloqueo en el array de bordes
                this.borders.forEach(border => {
                    border.unlocked = this.unlockedBorders.has(border.id);
                });
            } else {
                this.unlockedBorders = new Set(['none']);
            }
            
            this.refreshBorderSelectorUI();
        } catch (e) {
            console.log('⚠️ No se pudieron cargar bordes desbloqueados, usando valores por defecto');
            this.unlockedBorders = new Set(['none']);
        }
    }

    refreshBorderSelectorUI() {
        const modal = document.getElementById('border-selector-modal');
        if (!modal || !modal.classList.contains('active')) return;

        const borderItems = document.querySelectorAll('.border-item');
        borderItems.forEach(item => {
            const borderId = item.dataset.border;
            const isUnlocked = this.unlockedBorders.has(borderId);
            
            if (isUnlocked) {
                item.classList.remove('locked');
                item.querySelector('.lock-overlay')?.remove();
            } else {
                item.classList.add('locked');
                if (!item.querySelector('.lock-overlay')) {
                    const lockOverlay = document.createElement('div');
                    lockOverlay.className = 'lock-overlay';
                    lockOverlay.innerHTML = '🔒';
                    item.appendChild(lockOverlay);
                }
            }
        });
    }

    updatePlayerBorder() {
        const playerIcon = document.getElementById('player-icon');
        if (!playerIcon) return;

        // Remover todas las clases de borde
        this.borders.forEach(border => {
            if (border.cssClass) {
                playerIcon.classList.remove(border.cssClass);
            }
        });

        // Aplicar el borde seleccionado
        const currentBorder = this.borders.find(b => b.id === this.selectedBorder);
        if (currentBorder && currentBorder.cssClass) {
            playerIcon.classList.add(currentBorder.cssClass);
        }

        console.log(`✅ Borde actualizado: ${currentBorder?.name || 'Sin Borde'}`);
    }

    setupEventListeners() {
        // Botón para abrir selector de bordes
        const openBtn = document.getElementById('open-border-selector-btn');
        if (openBtn) {
            openBtn.addEventListener('click', () => this.openBorderSelector());
        }

        // Botón para cerrar modal
        const closeBtn = document.getElementById('close-border-selector');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeBorderSelector());
        }

        // Cerrar al hacer clic fuera del modal
        const modal = document.getElementById('border-selector-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeBorderSelector();
                }
            });
        }
    }

    openBorderSelector() {
        console.log('🎨 Abriendo selector de bordes...');
        this.loadBordersIntoGrid();
        const modal = document.getElementById('border-selector-modal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    closeBorderSelector() {
        console.log('🎨 Cerrando selector de bordes...');
        const modal = document.getElementById('border-selector-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    loadBordersIntoGrid() {
        const grid = document.getElementById('borders-grid');
        if (!grid) return;

        grid.innerHTML = '';

        this.borders.forEach(border => {
            const isUnlocked = this.unlockedBorders.has(border.id);
            const isSelected = this.selectedBorder === border.id;

            const borderItem = document.createElement('div');
            borderItem.className = `border-item ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
            borderItem.dataset.border = border.id;

            // Crear preview del borde
            const preview = document.createElement('div');
            preview.className = 'border-preview';
            
            const iconPreview = document.createElement('div');
            iconPreview.className = `border-preview-icon ${border.cssClass}`;
            iconPreview.innerHTML = `<img src="/arma/glock 17 cereza.png" alt="Preview">`;
            
            preview.appendChild(iconPreview);

            const name = document.createElement('div');
            name.className = 'border-name';
            name.textContent = `${border.icon} ${border.name}`;

            borderItem.appendChild(preview);
            borderItem.appendChild(name);

            // Agregar overlay de candado si está bloqueado
            if (!isUnlocked) {
                const lockOverlay = document.createElement('div');
                lockOverlay.className = 'lock-overlay';
                lockOverlay.innerHTML = '🔒';
                borderItem.appendChild(lockOverlay);
            }

            // Agregar indicador de selección
            if (isSelected) {
                const checkmark = document.createElement('div');
                checkmark.className = 'selected-checkmark';
                checkmark.innerHTML = '✓';
                borderItem.appendChild(checkmark);
            }

            // Click handler
            borderItem.addEventListener('click', () => {
                if (isUnlocked) {
                    this.selectBorder(border.id);
                } else {
                    this.showLockedMessage(border.name);
                }
            });

            grid.appendChild(borderItem);
        });
    }

    async selectBorder(borderId) {
        console.log(`🎨 Seleccionando borde: ${borderId}`);
        
        this.selectedBorder = borderId;
        localStorage.setItem('playerBorder', borderId);
        
        // Actualizar en el backend
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                await fetch('/api/borders/select', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ border_id: borderId })
                });
            } catch (e) {
                console.error('Error al guardar borde en el servidor:', e);
            }
        }
        
        // Actualizar UI
        this.updatePlayerBorder();
        this.loadBordersIntoGrid(); // Recargar grid para mostrar selección
        
        const borderName = this.borders.find(b => b.id === borderId)?.name || 'Sin Borde';
        this.showNotification(`✅ Borde "${borderName}" aplicado`);
    }

    showLockedMessage(borderName) {
        this.showNotification(`🔒 El borde "${borderName}" está bloqueado`);
    }

    showNotification(message) {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = 'border-notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    // Método para desbloquear bordes (llamar desde cajas, logros, etc.)
    async unlockBorder(borderId) {
        if (this.unlockedBorders.has(borderId)) {
            console.log(`⚠️ El borde ${borderId} ya está desbloqueado`);
            return false;
        }

        const border = this.borders.find(b => b.id === borderId);
        if (!border) {
            console.error(`❌ Borde ${borderId} no encontrado`);
            return false;
        }

        this.unlockedBorders.add(borderId);
        border.unlocked = true;

        // Guardar en backend
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                await fetch('/api/borders/unlock', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ border_id: borderId })
                });
            } catch (e) {
                console.error('Error al desbloquear borde en el servidor:', e);
            }
        }

        this.showNotification(`🎉 ¡Borde "${border.name}" desbloqueado!`);
        this.refreshBorderSelectorUI();
        
        return true;
    }
}

// Instancia global
let playerBorderSystem;

// Inicializar cuando se cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
    playerBorderSystem = new PlayerBorderSystem();
    // Hacer accesible globalmente para debugging y otros sistemas
    window.playerBorderSystem = playerBorderSystem;
});
