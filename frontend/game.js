// Box Opening Game - JavaScript Principal
class BoxOpeningGame {
    constructor() {
        this.apiUrl = '/api';
        this.currentUser = null;
        this.token = localStorage.getItem('gameToken');
        this.boxes = [];
        this.items = [];
        this.inventory = [];
        this.fullInventory = []; // Inventario completo sin filtrar
        this.stats = {};
        
        // Filtros del inventario
        this.inventoryFilters = {
            search: '',
            weaponType: '',
            rarity: '',
            quality: '',
            conta: ''
        };
        
        this.init();
    }

    async init() {
        console.log('🎮 Iniciando Box Opening Game...');
        
        // Event listeners
        this.setupEventListeners();
        
        // Verificar si hay token guardado
        if (this.token) {
            await this.verifyToken();
        } else {
            this.showAuthScreen();
        }
    }

    setupEventListeners() {
        // Forms
        document.getElementById('login-form-element').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form-element').addEventListener('submit', (e) => this.handleRegister(e));
        
        // Botones
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        document.getElementById('ranking-btn').addEventListener('click', () => this.openRankingModal());
        document.getElementById('close-ranking-modal').addEventListener('click', () => this.closeModal('ranking-modal'));
        
        // Modals
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    // Autenticación
    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            this.showNotification('Por favor completa todos los campos', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                this.token = data.token;
                this.currentUser = data.user;
                localStorage.setItem('gameToken', this.token);
                
                this.showNotification(`¡Bienvenido ${data.user.username}!`, 'success');
                await this.showGameScreen();
            } else {
                this.showNotification(data.error || 'Error en el login', 'error');
            }
        } catch (error) {
            console.error('Error en login:', error);
            this.showNotification('Error de conexión', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;

        if (!username || !email || !password) {
            this.showNotification('Por favor completa todos los campos', 'error');
            return;
        }

        if (password.length < 6) {
            this.showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch(`${this.apiUrl}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (data.success) {
                this.token = data.token;
                this.currentUser = data.user;
                localStorage.setItem('gameToken', this.token);
                
                this.showNotification(`¡Cuenta creada! Bienvenido ${data.user.username}!`, 'success');
                await this.showGameScreen();
            } else {
                this.showNotification(data.error || 'Error en el registro', 'error');
            }
        } catch (error) {
            console.error('Error en registro:', error);
            this.showNotification('Error de conexión', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async verifyToken() {
        if (!this.token) return false;

        try {
            const response = await fetch(`${this.apiUrl}/auth/verify`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            const data = await response.json();

            if (data.success) {
                this.currentUser = data.user;
                await this.showGameScreen();
                return true;
            } else {
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('Error verificando token:', error);
            this.logout();
            return false;
        }
    }

    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('gameToken');
        this.showAuthScreen();
        this.showNotification('Sesión cerrada', 'success');
    }

    // Pantallas
    showAuthScreen() {
        document.getElementById('auth-screen').classList.add('active');
        document.getElementById('game-screen').classList.remove('active');
        
        // Limpiar formularios
        document.getElementById('login-form-element').reset();
        document.getElementById('register-form-element').reset();
    }

    async showGameScreen() {
        document.getElementById('auth-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
        
        // Actualizar interfaz de usuario
        this.updateUserInterface();
        
        // Cargar datos del juego
        await Promise.all([
            this.loadBoxes(),
            this.loadItems(),
            this.loadInventory(),
            this.loadStats()
        ]);
        
        // Mostrar tab de cajas por defecto
        this.showGameTab('boxes');
    }

    updateUserInterface() {
        if (this.currentUser) {
            document.getElementById('username-display').textContent = this.currentUser.username;
            // Actualiza el nivel
            document.getElementById('user-level').textContent = this.currentUser.level;
            // Actualiza el dinero en la nueva ubicación
            const moneyElem = document.getElementById('user-money');
            if (moneyElem && typeof formatPrice === 'function') {
                moneyElem.textContent = formatPrice(this.currentUser.coins || 0);
            }
        }
    }

    // Gestión de datos del juego
    async loadBoxes() {
        try {
            const response = await fetch(`${this.apiUrl}/game/boxes`);
            const data = await response.json();
            
            if (data.success) {
                this.boxes = data.boxes;
                this.renderBoxes();
            }
        } catch (error) {
            console.error('Error cargando cajas:', error);
        }
    }

    async loadItems() {
        try {
            const response = await fetch(`${this.apiUrl}/game/items`);
            const data = await response.json();
            
            if (data.success) {
                this.items = data.items;
            }
        } catch (error) {
            console.error('Error cargando items:', error);
        }
    }

    async loadInventory() {
        try {
            const response = await fetch(`${this.apiUrl}/game/inventory`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await response.json();
            
            if (data.success) {
                this.fullInventory = data.inventory;
                this.inventory = data.inventory;
                this.setupInventoryFilters();
                this.renderInventory();
            }
        } catch (error) {
            console.error('Error cargando inventario:', error);
        }
    }

    // Configurar filtros del inventario
    setupInventoryFilters() {
        // Buscar
        const searchInput = document.getElementById('inventory-search');
        if (searchInput) {
            searchInput.removeEventListener('input', () => this.applyInventoryFilters());
            searchInput.addEventListener('input', (e) => {
                this.inventoryFilters.search = e.target.value.toLowerCase();
                this.applyInventoryFilters();
            });
        }

        // Tipo de arma
        this.setupInventoryFilterButtons('inventory-weapon-type-filters', 'weaponType');
        
        // Rareza
        this.setupInventoryFilterButtons('inventory-rarity-filters', 'rarity');
        
        // Grado
        this.setupInventoryFilterButtons('inventory-quality-filters', 'quality');
        
        // Conta
        this.setupInventoryFilterButtons('inventory-conta-filters', 'conta');
    }

    // Configurar botones de filtro del inventario
    setupInventoryFilterButtons(containerId, filterKey) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const buttons = container.querySelectorAll('.filter-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remover active de todos los botones del grupo
                buttons.forEach(b => b.classList.remove('active'));
                // Añadir active al botón clickeado
                btn.classList.add('active');
                // Actualizar filtro
                this.inventoryFilters[filterKey] = btn.dataset.value;
                this.applyInventoryFilters();
            });
        });
    }

    // Aplicar filtros al inventario
    applyInventoryFilters() {
        let filtered = [...this.fullInventory];

        // Filtro de búsqueda
        if (this.inventoryFilters.search) {
            filtered = filtered.filter(item => 
                item.name.toLowerCase().includes(this.inventoryFilters.search)
            );
        }

        // Filtro de tipo de arma
        if (this.inventoryFilters.weaponType) {
            filtered = filtered.filter(item => item.weapon_type === this.inventoryFilters.weaponType);
        }

        // Filtro de rareza
        if (this.inventoryFilters.rarity) {
            filtered = filtered.filter(item => {
                let itemRarity = '';
                if (typeof item.rarity === 'string') {
                    itemRarity = item.rarity;
                } else if (typeof item.rarity === 'object' && item.rarity) {
                    itemRarity = item.rarity.name || item.rarity.key || '';
                }
                
                const rarityMap = {
                    'Común': 'COMUN',
                    'Poco Común': 'POCO_COMUN',
                    'Raro': 'RARO',
                    'Épico': 'EPICO',
                    'Legendario': 'LEGENDARIO',
                    'Mítico': 'MITICO',
                    'Ancestral': 'ANCESTRAL'
                };
                
                const normalizedItemRarity = rarityMap[itemRarity] || itemRarity;
                return normalizedItemRarity === this.inventoryFilters.rarity;
            });
        }

        // Filtro de grado
        if (this.inventoryFilters.quality) {
            filtered = filtered.filter(item => {
                let itemQuality = '';
                if (typeof item.quality === 'string') {
                    itemQuality = item.quality.includes('Grado') ? item.quality.split(' ')[1] : item.quality;
                } else if (typeof item.quality === 'object') {
                    itemQuality = item.quality.letter || item.quality.name || '';
                    if (itemQuality.includes && itemQuality.includes('Grado')) {
                        itemQuality = itemQuality.split(' ')[1] || itemQuality;
                    }
                }
                return itemQuality === this.inventoryFilters.quality;
            });
        }

        // Filtro de conta
        if (this.inventoryFilters.conta !== '') {
            const contaValue = parseInt(this.inventoryFilters.conta);
            filtered = filtered.filter(item => {
                const isConta = item.is_conta ? 1 : 0;
                return isConta === contaValue;
            });
        }

        this.inventory = filtered;
        this.renderInventory();
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.apiUrl}/game/stats`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await response.json();
            
            if (data.success) {
                this.stats = data.stats;
                this.renderStats();
            }
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }

    // Renderizado
    renderBoxes() {
        const container = document.getElementById('boxes-container');
        
        if (this.boxes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No hay cajas disponibles</h3>
                    <p>Vuelve más tarde para ver nuevas cajas</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.boxes.map(box => `
            <div class="box-card" onclick="game.confirmOpenBox(${box.id})">
                <span class="box-icon">📦</span>
                <h3>${box.name}</h3>
                <p>${box.description}</p>
                <div class="box-cost">💰 ${box.cost} monedas</div>
                <button class="btn btn-primary" ${this.currentUser?.coins < box.cost ? 'disabled' : ''}>
                    ${this.currentUser?.coins >= box.cost ? 'Abrir Caja' : 'Sin monedas suficientes'}
                </button>
            </div>
        `).join('');
    }

    renderInventory() {
        const container = document.getElementById('inventory-container');
        
        if (this.inventory.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Tu inventario está vacío</h3>
                    <p>Abre algunas cajas para obtener items increíbles</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.inventory.map(item => {
            // Obtener información de la pasiva desde la función centralizada
            const passiveInfo = window.WeaponsSystem.getPassiveInfo(item.pasiva);
            const passiveName = passiveInfo.name;
            const passiveDescription = passiveInfo.description;
            
            let stackableText = '';
            if (item.pasiva && item.pasiva.stackeable) {
                stackableText = '<span class="stackable-icon">✅</span> <span class="stackable-text">Apilable</span>';
            } else {
                stackableText = '<span class="stackable-icon">⛔</span> <span class="stackable-text">No apilable</span>';
            }
            return `
                <div class="item-card rarity-${item.rarity}">
                    <span class="item-icon">${this.getItemIcon(item.rarity)}</span>
                    <div class="item-name">${item.name}</div>
                    <div class="item-rarity">${item.rarity}</div>
                    <div class="item-value">💰 ${item.value}</div>
                    <div class="item-quantity">${item.total_quantity}</div>
                    <div class="item-passive">
                        <strong>${passiveName}</strong>
                        <div class="passive-desc">${passiveDescription}</div>
                        <div class="passive-stackable">${stackableText}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderStats() {
        const container = document.getElementById('stats-container');
        
        container.innerHTML = `
            <div class="stat-card">
                <h3>💰 Monedas</h3>
                <div class="stat-value">${this.stats.coins || 0}</div>
            </div>
            <div class="stat-card">
                <h3>🏆 Nivel</h3>
                <div class="stat-value">${this.stats.level || 1}</div>
            </div>
            <div class="stat-card">
                <h3>⭐ Experiencia</h3>
                <div class="stat-value">${this.stats.experience || 0}</div>
            </div>
            <div class="stat-card">
                <h3>📦 Cajas Abiertas</h3>
                <div class="stat-value">${this.stats.boxesOpened || 0}</div>
            </div>
            <div class="stat-card">
                <h3>💎 Items Raros</h3>
                <div class="stat-value">${this.stats.rareItems || 0}</div>
            </div>
            <div class="stat-card">
                <h3>📅 Miembro desde</h3>
                <div class="stat-value" style="font-size: 1rem;">
                    ${this.stats.memberSince ? new Date(this.stats.memberSince).toLocaleDateString() : 'Hoy'}
                </div>
            </div>
        `;
    }

    getItemIcon(rarity) {
        const icons = {
            common: '🔹',
            rare: '💎',
            epic: '🌟',
            legendary: '👑'
        };
        return icons[rarity] || '❓';
    }

    // Mecánica del juego
    confirmOpenBox(boxId) {
        const box = this.boxes.find(b => b.id === boxId);
        if (!box) return;

        if (this.currentUser.coins < box.cost) {
            this.showNotification('No tienes suficientes monedas', 'error');
            return;
        }

        this.showConfirmModal(
            `¿Quieres abrir ${box.name} por ${box.cost} monedas?`,
            () => this.openBox(boxId)
        );
    }

    async openBox(boxId) {
        this.showLoading(true);

        try {
            const response = await fetch(`${this.apiUrl}/game/open-box`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ boxId })
            });

            const data = await response.json();

            if (data.success) {
                // Actualizar monedas del usuario
                this.currentUser.coins = data.newCoinBalance;
                this.updateUserInterface();
                
                // Mostrar resultados
                this.showResults(data);
                
                // Recargar datos
                await Promise.all([
                    this.loadInventory(),
                    this.loadStats()
                ]);
                
                this.showNotification('¡Caja abierta exitosamente!', 'success');
            } else {
                this.showNotification(data.error || 'Error abriendo la caja', 'error');
            }
        } catch (error) {
            console.error('Error abriendo caja:', error);
            this.showNotification('Error de conexión', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showResults(data) {
        const modal = document.getElementById('results-modal');
        const content = document.getElementById('results-content');
        
        content.innerHTML = data.items.map(item => `
            <div class="result-item rarity-${item.rarity}">
                <div class="result-item-name">
                    ${this.getItemIcon(item.rarity)} ${item.name}
                </div>
                <div class="result-item-value">💰 ${item.value} monedas</div>
            </div>
        `).join('');

        document.getElementById('coins-spent').textContent = data.coinsSpent;
        document.getElementById('coins-earned').textContent = data.coinsEarned;
        document.getElementById('new-balance').textContent = data.newCoinBalance;

        this.showModal('results-modal');
    }

    // Navegación del juego
    showGameTab(tabName) {
        try {
            // Remover active de todos los tabs
            document.querySelectorAll('.game-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });

            // Activar tab seleccionado
            const tabElement = document.getElementById(`${tabName}-tab`);
            const btnElement = document.querySelector(`[onclick="showGameTab('${tabName}')"]`);
            
            if (tabElement) {
                tabElement.classList.add('active');
            } else {
                console.warn(`Tab element not found: ${tabName}-tab`);
            }
            
            if (btnElement) {
                btnElement.classList.add('active');
            } else {
                console.warn(`Button element not found for tab: ${tabName}`);
            }
        } catch (error) {
            console.error('Error in showGameTab:', error);
        }
    }

    // Gestión de modales
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = 'auto';
    }

    showConfirmModal(message, onConfirm) {
        document.getElementById('confirm-message').textContent = message;
        this.pendingConfirmAction = onConfirm;
        this.showModal('confirm-modal');
    }

    confirmAction() {
        if (this.pendingConfirmAction) {
            this.pendingConfirmAction();
            this.pendingConfirmAction = null;
        }
        this.closeModal('confirm-modal');
    }

    // UI Utilities
    showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.add('active');
        } else {
            loading.classList.remove('active');
        }
    }

    showNotification(message, type = 'success') {
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);

        // Auto remove después de 3 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // Sistema de Ranking
    openRankingModal() {
        // Verificar que el usuario esté logueado
        const token = this.token || localStorage.getItem('gameToken');
        if (!token) {
            this.showNotification('Debes iniciar sesión para ver el ranking', 'error');
            return;
        }
        
        // Actualizar el token si no estaba disponible
        if (!this.token) {
            this.token = token;
        }
        
        this.showModal('ranking-modal');
        this.setupRankingTabs();
        this.loadRanking('money'); // Cargar primero el ranking de dinero
    }

    setupRankingTabs() {
        const tabs = document.querySelectorAll('.ranking-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = tab.dataset.tab;
                
                // Actualizar tabs activos
                document.querySelectorAll('.ranking-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Actualizar secciones activas
                document.querySelectorAll('.ranking-section').forEach(section => {
                    section.classList.remove('active');
                });
                document.getElementById(`${tabName}-ranking`).classList.add('active');
                
                // Cargar datos si no están cargados
                this.loadRanking(tabName);
            });
        });
    }

    async loadRanking(type) {
        const section = document.getElementById(`${type}-ranking`);
        
        try {
            section.innerHTML = '<div class="loading-ranking">Cargando ranking</div>';
            
            // Asegurarse de que el token esté actualizado
            const token = this.token || localStorage.getItem('gameToken');
            
            if (!token) {
                throw new Error('No hay sesión activa');
            }
            
            let endpoint = '';
            switch(type) {
                case 'money':
                    endpoint = '/ranking/top-money';
                    break;
                case 'weapons':
                    endpoint = '/ranking/top-weapons';
                    break;
                case 'level':
                    endpoint = '/ranking/top-level';
                    break;
            }
            
            const response = await fetch(`${this.apiUrl}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al cargar ranking');
            }
            
            const data = await response.json();
            this.renderRanking(type, data);
            
        } catch (error) {
            console.error('Error al cargar ranking:', error);
            section.innerHTML = `
                <div class="ranking-error">
                    ❌ Error al cargar el ranking. Intenta de nuevo más tarde.
                </div>
            `;
        }
    }

    renderRanking(type, data) {
        const section = document.getElementById(`${type}-ranking`);
        
        if (!data || data.length === 0) {
            section.innerHTML = `
                <div class="ranking-error">
                    📊 No hay datos disponibles en este ranking todavía.
                </div>
            `;
            return;
        }
        
        let tableHTML = '<table class="ranking-table"><thead><tr>';
        
        // Headers según el tipo
        switch(type) {
            case 'money':
                tableHTML += `
                    <th style="width: 60px; text-align: center;">#</th>
                    <th>Jugador</th>
                    <th>Nivel</th>
                    <th>Dinero</th>
                `;
                break;
            case 'weapons':
                tableHTML += `
                    <th style="width: 60px; text-align: center;">#</th>
                    <th>Jugador</th>
                    <th>Nivel</th>
                    <th>Valor Total (Top 3 Armas)</th>
                `;
                break;
            case 'level':
                tableHTML += `
                    <th style="width: 60px; text-align: center;">#</th>
                    <th>Jugador</th>
                    <th>Nivel</th>
                    <th>Experiencia</th>
                    <th>Dinero</th>
                `;
                break;
        }
        
        tableHTML += '</tr></thead><tbody>';
        
        // Filas de datos
        data.forEach((player, index) => {
            const position = index + 1;
            let rankClass = '';
            if (position === 1) rankClass = 'rank-1';
            else if (position === 2) rankClass = 'rank-2';
            else if (position === 3) rankClass = 'rank-3';
            
            tableHTML += '<tr>';
            tableHTML += `<td class="rank-position ${rankClass}">${position}</td>`;
            
            // Columna del jugador con icono y borde
            const icon = player.selected_icon || '/arma/glock 17 cereza.png';
            const border = player.selected_border || 'none';
            const borderClass = border !== 'none' ? `border-${border}` : '';
            const safeUsername = this.escapeHtml(player.username);
            
            tableHTML += `
                <td class="player-info-cell">
                    <div class="player-rank-container" onclick="openPlayerProfile('${safeUsername}')">
                        <div class="player-rank-icon ${borderClass}">
                            <img src="${this.escapeHtml(icon)}" alt="${safeUsername}" class="player-icon-img" onerror="this.src='/arma/glock 17 cereza.png'">
                        </div>
                        <span class="player-rank-name">${safeUsername}</span>
                    </div>
                </td>
            `;
            
            switch(type) {
                case 'money':
                    tableHTML += `<td class="level-value">Nivel ${player.level}</td>`;
                    tableHTML += `<td class="money-value">$${this.formatNumber(player.money)}</td>`;
                    break;
                    
                case 'weapons':
                    tableHTML += `<td class="level-value">Nivel ${player.level}</td>`;
                    tableHTML += `<td class="money-value">$${this.formatNumber(player.total_weapons_value)}</td>`;
                    break;
                    
                case 'level':
                    tableHTML += `<td class="level-value">Nivel ${player.level}</td>`;
                    tableHTML += `<td>${this.formatNumber(player.experience)} XP</td>`;
                    tableHTML += `<td class="money-value">$${this.formatNumber(player.money)}</td>`;
                    break;
            }
            
            tableHTML += '</tr>';
        });
        
        tableHTML += '</tbody></table>';
        section.innerHTML = tableHTML;
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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Funciones globales para HTML
function showLoginForm() {
    document.getElementById('login-form').classList.add('active');
    document.getElementById('register-form').classList.remove('active');
}

function showRegisterForm() {
    document.getElementById('register-form').classList.add('active');
    document.getElementById('login-form').classList.remove('active');
}

function showGameTab(tabName) {
    game.showGameTab(tabName);
}

function closeResultsModal() {
    game.closeModal('results-modal');
}

function closeConfirmModal() {
    game.closeModal('confirm-modal');
}

function confirmAction() {
    game.confirmAction();
}

// Abrir perfil del jugador desde el ranking
function openPlayerProfile(username) {
    if (window.playerProfileViewer) {
        window.playerProfileViewer.openProfile(username);
    } else {
        console.log('Visor de perfil no disponible todavía');
    }
}

// Inicializar el juego cuando la página esté lista
let game;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Box Opening Game - Iniciando...');
    game = new BoxOpeningGame();
});

// Prevenir que el usuario cierre accidentalmente
window.addEventListener('beforeunload', (e) => {
    if (game && game.currentUser) {
        e.preventDefault();
        e.returnValue = '¿Estás seguro de que quieres salir del juego?';
    }
});

// Optimizaciones para OperaGX
if (navigator.userAgent.includes('OPR')) {
    console.log('🎮 Ejecutándose en OperaGX - Optimizaciones activadas');
    
    // Configuraciones específicas para OperaGX
    document.addEventListener('DOMContentLoaded', () => {
        // Mejorar rendimiento
        document.body.style.willChange = 'transform';
        
        // Configurar meta tags para OperaGX
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = '#4ecdc4';
        document.head.appendChild(meta);
    });
}