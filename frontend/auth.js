// Función global para formatear precios
function formatPrice(price) {
    const num = parseFloat(price);
    
    if (num < 10000) {
        return `$${num.toFixed(2)}`;
    } else if (num < 1000000) {
        // Miles (K)
        return `$${(num / 1000).toFixed(2)}k`;
    } else if (num < 1000000000) {
        // Millones (M)
        return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num < 1000000000000) {
        // Miles de millones (B)
        return `$${(num / 1000000000).toFixed(2)}B`;
    } else if (num < 1000000000000000) {
        // Billones (T)
        return `$${(num / 1000000000000).toFixed(2)}T`;
    } else if (num < 1000000000000000000) {
        // Cuatrillones (Q)
        return `$${(num / 1000000000000000).toFixed(2)}Q`;
    } else if (num < 1000000000000000000000) {
        // Quintillones (QI)
        return `$${(num / 1000000000000000000).toFixed(2)}QI`;
    } else {
        // Sextillones (S)
        return `$${(num / 1000000000000000000000).toFixed(2)}S`;
    }
}

// Sistema de Autenticación Simple
class AuthSystem {
    constructor() {
        this.apiUrl = '/api';
        this.currentUser = null;
        this.token = localStorage.getItem('authToken');
        this.statsManager = null;
        this.passiveStats = null;
        
        this.init();
    }

    async init() {
        console.log('🔐 Iniciando Sistema de Autenticación...');
        
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
        
        // Botones para cambiar entre forms
        document.getElementById('show-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });
        
        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });
        
        // Botón logout
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Limpiar formularios con Escape
                this.clearForms();
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
                localStorage.setItem('authToken', this.token);
                
                this.showNotification(`¡Bienvenido ${data.user.username}!`, 'success');
                // Reinicializar sistema de iconos para este usuario
                if (window.playerIconSystem) {
                    await window.playerIconSystem.loadUnlockedIconsFromBackend();
                    window.playerIconSystem.updatePlayerIcon();
                }
                this.showDashboard();
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

        // Validar email básico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showNotification('Por favor ingresa un email válido', 'error');
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
                localStorage.setItem('authToken', this.token);
                
                this.showNotification(`¡Cuenta creada! Bienvenido ${data.user.username}!`, 'success');
                // Reinicializar sistema de iconos para este usuario
                if (window.playerIconSystem) {
                    await window.playerIconSystem.loadUnlockedIconsFromBackend();
                    window.playerIconSystem.updatePlayerIcon();
                }
                await this.showDashboard();
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
                // Reinicializar sistema de iconos para este usuario
                if (window.playerIconSystem) {
                    await window.playerIconSystem.loadUnlockedIconsFromBackend();
                    window.playerIconSystem.updatePlayerIcon();
                }
                this.showDashboard();
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
        localStorage.removeItem('authToken');
        
        // Desconectar del chat
        if (window.chatSystem) {
            window.chatSystem.disconnect();
        }
        
        this.showAuthScreen();
        this.clearForms();
        this.showNotification('Sesión cerrada', 'success');
    }

    // Pantallas
    showAuthScreen() {
        document.getElementById('auth-screen').classList.add('active');
        document.getElementById('game-screen').classList.remove('active');
        
        // Mostrar login por defecto
        this.showLoginForm();
    }

    async showDashboard() {
        document.getElementById('auth-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
        
        // Inicializar sistema de stats
        this.statsManager = new StatsManager(this);
        
        // Actualizar interfaz con datos del usuario
        this.updateGameScreen();
        
        // Actualizar información del chat si está disponible
        if (window.chatSystem) {
            const iconImg = document.getElementById('player-icon-img');
            window.chatSystem.updateUserInfo(
                this.currentUser.username,
                this.currentUser.level || 1,
                iconImg.src
            );
        }
    }

    showLoginForm() {
        document.getElementById('login-form').classList.add('active');
        document.getElementById('register-form').classList.remove('active');
        this.clearForms();
    }

    showRegisterForm() {
        document.getElementById('register-form').classList.add('active');
        document.getElementById('login-form').classList.remove('active');
        this.clearForms();
    }

    updateGameScreen() {
        if (this.currentUser) {
            document.getElementById('username-display').textContent = this.currentUser.username;
            document.getElementById('user-level').textContent = this.currentUser.level || 1;
            
            // Actualizar barra de experiencia
            this.updateExperienceBar();
        }
    }

    updateExperienceBar() {
        if (!this.currentUser) return;

        const currentExp = this.currentUser.experience || 0;
        const currentLevel = this.currentUser.level || 1;
        const maxExpForLevel = this.calculateExpForLevel(currentLevel);
        
        // Actualizar elementos de la interfaz
        document.getElementById('current-exp').textContent = currentExp;
        document.getElementById('max-exp').textContent = maxExpForLevel;
        
        // Calcular y actualizar el porcentaje de la barra
        const progressPercent = (currentExp / maxExpForLevel) * 100;
        const expFill = document.getElementById('experience-fill');
        if (expFill) {
            expFill.style.width = `${Math.min(progressPercent, 100)}%`;
        }
    }

    calculateExpForLevel(level) {
        return level * 100 + (level - 1) * 50;
    }
    
    // Función para recargar experiencia desde el servidor
    async refreshUserExperience() {
        try {
            const response = await fetch(`${this.apiUrl}/stats/user`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success && data.stats) {
                // Actualizar datos del usuario en memoria
                this.currentUser.experience = data.stats.experience;
                this.currentUser.level = data.stats.level;
                
                // Actualizar UI
                document.getElementById('user-level').textContent = data.stats.level;
                this.updateExperienceBar();
            }
        } catch (error) {
            console.error('Error refrescando experiencia:', error);
        }
    }

    // Función para añadir experiencia (será útil más tarde)
    async addExperience(exp) {
        try {
            const response = await fetch(`${this.apiUrl}/stats/add-experience`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ experience: exp })
            });

            const data = await response.json();

            if (data.success) {
                // Actualizar nivel en la interfaz
                document.getElementById('user-level').textContent = data.newLevel;
                
                // Actualizar barra de experiencia en tiempo real
                const currentExpEl = document.getElementById('current-exp');
                const maxExpEl = document.getElementById('max-exp');
                const experienceFill = document.getElementById('experience-fill');
                
                if (currentExpEl) currentExpEl.textContent = data.currentExp;
                if (maxExpEl) maxExpEl.textContent = data.maxExp;
                if (experienceFill) {
                    const percentage = (data.currentExp / data.maxExp) * 100;
                    experienceFill.style.width = `${percentage}%`;
                }
                
                if (data.leveledUp) {
                    this.showNotification(`🎉 ¡Subiste al nivel ${data.newLevel}!`, 'success');
                } else {
                    this.showNotification(`+${exp} XP ganada`, 'success');
                }

                // Actualizar datos del usuario actual
                this.currentUser.level = data.newLevel;
                this.currentUser.experience = data.newExperience;
            }

            return data;
        } catch (error) {
            console.error('Error añadiendo experiencia:', error);
            return null;
        }
    }

    clearForms() {
        document.getElementById('login-form-element').reset();
        document.getElementById('register-form-element').reset();
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
        // 🔊 Reproducir sonido según el tipo de notificación
        if (window.soundSystem) {
            if (type === 'error') {
                window.soundSystem.playError();
            } else if (message.includes('nivel') || message.includes('Nivel')) {
                window.soundSystem.playLevelUp();
            } else if (type === 'success') {
                window.soundSystem.playSuccess();
            }
        }
        
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);

        // Auto remove después de 4 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 4000);
    }
}

// Inicializar el sistema cuando la página esté lista
let authSystem;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔐 Sistema de Autenticación - Iniciando...');
    authSystem = new AuthSystem();
    
    // Inicializar sistema de ruleta
    rouletteSystem = new RouletteSystem();
});

// Sistema de Cajas
let boxesData = [];
let currentBoxIndex = 0;

async function loadBoxesData() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/boxes', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (data.success) {
            boxesData = data.boxes;
        }
    } catch (error) {
        console.error('Error cargando datos de cajas:', error);
    }
}

function openBoxesModal() {
    const modal = document.getElementById('boxes-modal');
    modal.classList.add('active');
    
    // DEBUG: Mostrar contenido de boxesData y currentBoxIndex
    console.log('[DEBUG] openBoxesModal - boxesData:', boxesData);
    console.log('[DEBUG] openBoxesModal - currentBoxIndex:', currentBoxIndex);
    
    // Cargar cajas y pasivas si no están cargadas
    Promise.all([
        boxesData.length === 0 ? loadBoxesData() : Promise.resolve(),
        inventorySystem ? inventorySystem.loadPlayerPassiveStats() : Promise.resolve()
    ]).then(() => {
        console.log('[DEBUG] loadBoxesData terminado - boxesData:', boxesData);
        renderBoxes();
    });
}

function closeBoxesModal() {
    const modal = document.getElementById('boxes-modal');
    modal.classList.remove('active');
}

function renderBoxes() {
    const container = document.getElementById('boxes-container');
    container.innerHTML = '';
    // DEBUG: Mostrar contenido de boxesData y currentBoxIndex
    console.log('[DEBUG] renderBoxes - boxesData:', boxesData);
    console.log('[DEBUG] renderBoxes - currentBoxIndex:', currentBoxIndex);
    if (boxesData.length === 0) return;

    // Navegación entre cajas
    const box = boxesData[currentBoxIndex];
    if (!box) {
        console.log('[DEBUG] renderBoxes - box no encontrado para currentBoxIndex:', currentBoxIndex);
        return;
    }

    // Obtener descuento de pasiva
    const discountPercent = inventorySystem?.passiveStats?.menorCostoCajasPercent || 0;
    const originalPrice = box.price || 0;
    const discountedPrice = originalPrice * (1 - discountPercent / 100);

    // Traducciones
    const t = (key) => window.i18n ? window.i18n.t(key) : key;
    
    // Traducir nombre de la caja
    const getTranslatedBoxName = (boxName) => {
        const boxNameMap = {
            'OPENER GUNS': 'box_name_opener_guns',
            'Caja Thunder': 'box_name_thunder',
            'Caja Somp': 'box_name_somp',
            'Caja Elite': 'box_name_elite',
            'Caja Snonbli': 'box_name_snonbli'
        };
        const key = boxNameMap[boxName];
        return key ? t(key) : boxName;
    };
    
    // Mostrar armas de la caja
    let weaponsList = '';
    if (window.WeaponsSystem && box.id) {
        const weapons = window.WeaponsSystem.getWeaponsForBox(box.id);
        weaponsList = `<div class="box-weapons-list"><b>${t('box_weapons')}</b><ul style='margin:0;padding-left:18px;'>${weapons.map(w => {
            const rarityColor = w.rarity?.color || '#fff';
            const rarityName = window.WeaponsSystem.getTranslatedRarityName(w.rarity);
            const weaponName = window.WeaponsSystem.getTranslatedWeaponName(w);
            return `<li>${weaponName} <span style='color:${rarityColor};font-weight:bold;'>[${rarityName}]</span></li>`;
        }).join('')}</ul></div>`;
    }

    // Mostrar bonus si hay descuento
    const bonusText = discountPercent > 0 ? `<div class="box-bonus">🎁 Bonus pasiva: -${discountPercent}% costo de cajas</div>` : '';

    container.innerHTML = `
        <div class="box-navigation-container">
            <button class='box-nav-arrow' id='box-arrow-left' ${currentBoxIndex === 0 ? 'disabled' : ''}>&#8592;</button>
            <div class="box-content-wrapper">
                <div class="box-item">
                    <div class="box-header">
                        <div class="box-name">${getTranslatedBoxName(box.name)}</div>
                    </div>
                    <div class="box-image-container">
                        <img src="${box.image || '/cajas/1.png'}" alt="${getTranslatedBoxName(box.name)}" class="box-image" />
                    </div>
                    ${bonusText}
                    <div class="box-price">${originalPrice === 0 ? t('box_free') : (discountPercent > 0 ? `<span style='text-decoration:line-through;color:#999;'>$${originalPrice}</span> <span style='color:#4CAF50;'>$${discountedPrice.toFixed(2)}</span>` : '$' + originalPrice)}</div>
                    ${weaponsList}
                    <button class="box-open-btn" onclick="handleBoxPurchase('${box.id}')">${t('box_select')}</button>
                </div>
            </div>
            <button class='box-nav-arrow' id='box-arrow-right' ${currentBoxIndex === boxesData.length-1 ? 'disabled' : ''}>&#8594;</button>
        </div>
    `;

    // Eventos de flechas
    setTimeout(() => {
        const leftBtn = document.getElementById('box-arrow-left');
        const rightBtn = document.getElementById('box-arrow-right');
        if (leftBtn) leftBtn.onclick = () => { if (currentBoxIndex > 0) { currentBoxIndex--; renderBoxes(); } };
        if (rightBtn) rightBtn.onclick = () => { if (currentBoxIndex < boxesData.length-1) { currentBoxIndex++; renderBoxes(); } };
    }, 0);
}

function handleBoxPurchase(boxId) {
    // Encontrar la caja seleccionada
    const selectedBox = boxesData.find(box => box.id == boxId);
    if (selectedBox) {
        showSelectedBox(selectedBox);
        closeBoxesModal();
        authSystem.showNotification(`¡Caja ${selectedBox.name} seleccionada!`, 'success');
        // Guardar la caja seleccionada para experiencia si es la caja 2
        window.selectedBoxForExp = selectedBox;
    }
}

function showSelectedBox(box) {
    const container = document.getElementById('selected-box-area');
    const image = document.getElementById('selected-box-image');
    const name = document.getElementById('selected-box-name');
    const openBtn = document.getElementById('open-box-btn');
    
    // Actualizar contenido
    image.src = box.image;
    image.alt = box.name;
    name.textContent = box.name;
    
    // Mostrar el área de caja seleccionada
    container.classList.remove('hidden');
    
    // Configurar botón de abrir
    openBtn.onclick = () => openSelectedBox(box);
}

function openSelectedBox(box) {
    // Aquí implementarás la lógica de apertura de cajas
    console.log(`Abriendo caja: ${box.name}`);
    // Si es la caja 2, dar 25 de exp
    if (box.id == 2) {
        authSystem.addExperience(25);
        authSystem.showNotification('+25 XP por abrir esta caja', 'success');
    }
    authSystem.showNotification('¡Función de apertura próximamente!', 'info');
}

// Event Listeners para el modal
document.addEventListener('DOMContentLoaded', () => {
    // Botón de cajas
    document.getElementById('cajas-btn').addEventListener('click', openBoxesModal);
    
    // Botón cerrar modal
    document.getElementById('close-boxes-modal').addEventListener('click', closeBoxesModal);
    
    // Cerrar modal haciendo click fuera
    document.getElementById('boxes-modal').addEventListener('click', (e) => {
        if (e.target.id === 'boxes-modal') {
            closeBoxesModal();
        }
    });
    
    // Cerrar modal con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeBoxesModal();
        }
    });
});

// ===== SISTEMA DE RULETA COUNTER-STRIKE =====
class RouletteSystem {
    constructor() {
        this.isSpinning = false;
        this.rouletteItems = [];
        this.winningItem = null;
        this.currentBox = null;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Botón de abrir caja (cuando ya hay una caja seleccionada)
        document.getElementById('open-box-btn')?.addEventListener('click', () => {
            if (this.currentBox) {
                this.openBox(this.currentBox.id);
            }
        });
        
        // Botón abrir de nuevo (después de cada tirada)
        document.getElementById('open-again-btn')?.addEventListener('click', () => {
            if (this.currentBox) {
                this.openBoxAgain(this.currentBox.id);
            }
        });
        
        // Botón salir de ruleta
        document.getElementById('exit-roulette-btn')?.addEventListener('click', () => {
            this.closeRouletteModal();
        });
        
        // Botón recoger arma (nuevo modal)
        document.getElementById('collect-weapon-btn')?.addEventListener('click', () => {
            this.collectWeapon();
        });
        
        // Botón cerrar modal de resultado
        document.getElementById('close-result-modal')?.addEventListener('click', () => {
            this.closeResultModal();
        });
        
        // Botón cerrar modal de saldo insuficiente
        document.getElementById('close-insufficient-balance')?.addEventListener('click', () => {
            this.closeInsufficientBalanceModal();
        });
        
        // Cerrar modal de saldo insuficiente con click fuera
        document.getElementById('insufficient-balance-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'insufficient-balance-modal') {
                this.closeInsufficientBalanceModal();
            }
        });
        
        // Cerrar con ESC solo si la ruleta no está girando
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !rouletteSystem?.isSpinning) {
                this.closeRouletteModal();
                this.closeResultModal();
            }
        });
    }
    
    async openBox(boxId) {
        if (this.isSpinning) {
            console.log('⚠️ La ruleta ya está girando, ignorando...');
            return;
        }
        
        try {
            // Cargar stats del jugador primero (asegurar que estén disponibles)
            if (inventorySystem && !inventorySystem.currentPassiveStats) {
                await inventorySystem.loadPlayerPassiveStats();
            }
            
            // Verificar precio de la caja
            const boxConfig = window.BOX_CONFIGURATIONS?.[boxId];
            if (!boxConfig) {
                throw new Error('Configuración de caja no encontrada');
            }
            
            const originalPrice = boxConfig.price || 0;
            const discountPercent = inventorySystem?.passiveStats?.menorCostoCajasPercent || 0;
            const boxPrice = originalPrice * (1 - discountPercent / 100);
            
            // Verificar saldo suficiente
            if (!inventorySystem || inventorySystem.userMoney < boxPrice) {
                console.log('❌ Saldo insuficiente');
                this.showInsufficientBalanceModal();
                return;
            }
            
            // Restar dinero del saldo
            const newBalance = inventorySystem.userMoney - boxPrice;
            inventorySystem.userMoney = newBalance;
            inventorySystem.updateMoneyDisplay(newBalance);
            
            // Mostrar modal de ruleta
            this.showRouletteModal(boxId);
            
            // Cargar armas disponibles
            this.loadAvailableWeapons(boxId);
            
            // Generar items de ruleta
            await this.generateRouletteItems(boxId);
            
            // Obtener arma ganadora del servidor
            const winningWeapon = await this.getWinningWeapon(boxId);
            
            if (!winningWeapon) {
                console.error('❌ getWinningWeapon retornó null o undefined');
                // Devolver el dinero si falla
                inventorySystem.userMoney += boxPrice;
                inventorySystem.updateMoneyDisplay(inventorySystem.userMoney);
                throw new Error('No se pudo obtener arma ganadora');
            }
            
            this.winningItem = winningWeapon;
            
            // Iniciar animación de ruleta
            setTimeout(() => {
                this.startRouletteAnimation();
            }, 1000);
            
        } catch (error) {
            console.error('Error abriendo caja:', error);
            authSystem.showNotification('Error al abrir la caja', 'error');
        }
    }
    
    async openBoxAgain(boxId) {
        // Esta función se llama cuando presionan ABRIR después de una tirada
        // Reinicia la pista y vuelve a girar la ruleta
        if (this.isSpinning) {
            console.log('⚠️ La ruleta ya está girando, ignorando...');
            return;
        }
        
        try {
            // Cargar stats del jugador primero (asegurar que estén disponibles)
            if (inventorySystem && !inventorySystem.currentPassiveStats) {
                await inventorySystem.loadPlayerPassiveStats();
            }
            
            // Verificar precio de la caja
            const boxConfig = window.BOX_CONFIGURATIONS?.[boxId];
            if (!boxConfig) {
                throw new Error('Configuración de caja no encontrada');
            }
            
            const originalPrice = boxConfig.price || 0;
            const discountPercent = inventorySystem?.passiveStats?.menorCostoCajasPercent || 0;
            const boxPrice = originalPrice * (1 - discountPercent / 100);
            
            // Verificar saldo suficiente
            if (!inventorySystem || inventorySystem.userMoney < boxPrice) {
                console.log('❌ Saldo insuficiente');
                this.showInsufficientBalanceModal();
                return;
            }
            
            // Restar dinero del saldo
            const newBalance = inventorySystem.userMoney - boxPrice;
            inventorySystem.userMoney = newBalance;
            inventorySystem.updateMoneyDisplay(newBalance);
            
            // Ocultar botones de control
            this.hideRouletteControls();
            
            // Resetear la pista con animación suave
            const track = document.getElementById('roulette-track');
            
            // Eliminar transición temporalmente para el reset instantáneo
            track.style.transition = 'none';
            track.style.transform = 'translateX(0px)';
            
            // Forzar reflow para que se aplique el cambio instantáneo
            track.offsetHeight;
            
            // Limpiar y regenerar items
            track.innerHTML = '';
            await this.generateRouletteItems(boxId);
            
            // Obtener nueva arma ganadora del servidor
            const winningWeapon = await this.getWinningWeapon(boxId);
            
            if (!winningWeapon) {
                // Devolver el dinero si falla
                inventorySystem.userMoney += boxPrice;
                inventorySystem.updateMoneyDisplay(inventorySystem.userMoney);
                throw new Error('No se pudo obtener arma ganadora');
            }
            
            this.winningItem = winningWeapon;
            
            // Iniciar animación de ruleta con pequeño delay para que se vea el reset
            setTimeout(() => {
                this.startRouletteAnimation();
            }, 100);
            
        } catch (error) {
            console.error('Error abriendo caja de nuevo:', error);
            authSystem.showNotification('Error al abrir la caja', 'error');
        }
    }
    
    showRouletteModal(boxId) {
        const modal = document.getElementById('roulette-modal');
        const boxName = document.getElementById('roulette-box-name');
        
        // Configurar nombre de la caja
        if (boxId === 1) {
            boxName.textContent = 'OPENER GUNS';
        }
        
        modal.classList.add('active');
        
        // Resetear estado
        this.resetRouletteState();
    }
    
    closeRouletteModal(preserveWinningItem = false) {
        const modal = document.getElementById('roulette-modal');
        modal.classList.remove('active');
        
        if (!preserveWinningItem) {
            this.resetRouletteState();
        } else {
            // Solo limpiar la pista pero preservar el winningItem
            this.isSpinning = false;
            const track = document.getElementById('roulette-track');
            track.innerHTML = '';
            track.style.transform = 'translateX(0px)';
        }
    }
    
    resetRouletteState() {
        this.isSpinning = false;
        this.winningItem = null;
        
        // Cerrar modal de resultado si está abierto
        this.closeResultModal();
        
        // Ocultar botones de control
        this.hideRouletteControls();
        
        // Limpiar pista
        const track = document.getElementById('roulette-track');
        track.innerHTML = '';
        track.style.transform = 'translateX(0px)';
    }
    
    showInsufficientBalanceModal() {
        const modal = document.getElementById('insufficient-balance-modal');
        modal.classList.add('active');
    }
    
    closeInsufficientBalanceModal() {
        const modal = document.getElementById('insufficient-balance-modal');
        modal.classList.remove('active');
    }
    
    loadAvailableWeapons(boxId) {
        // Obtener armas disponibles ordenadas por rareza
        const weapons = WeaponsSystem.getWeaponsForBox(boxId);
        
        // Definir orden de rareza (de común a mítico/ancestral)
        const rarityOrder = ['Común', 'Poco Común', 'Raro', 'Épico', 'Legendario', 'Mítico', 'Ancestral'];
        
        // Ordenar armas por rareza
        const sortedWeapons = weapons.sort((a, b) => {
            const rarityNameA = a.rarity?.name || 'Común';
            const rarityNameB = b.rarity?.name || 'Común';
            const indexA = rarityOrder.indexOf(rarityNameA);
            const indexB = rarityOrder.indexOf(rarityNameB);
            return indexA - indexB;
        });
        
        // Obtener la suerte actual del jugador desde inventorySystem
        const playerLuck = inventorySystem?.currentPassiveStats?.suerte || 0;
        console.log('🍀 Suerte del jugador:', playerLuck);
        console.log('📊 Stats disponibles:', inventorySystem?.currentPassiveStats);
        
        // Calcular probabilidades base y ajustadas por suerte
        const baseProbabilities = WeaponsSystem.getAdjustedProbabilities(boxId, 0);
        const adjustedProbabilities = WeaponsSystem.getAdjustedProbabilities(boxId, playerLuck);
        console.log('📈 Probabilidades base:', baseProbabilities);
        console.log('📈 Probabilidades ajustadas:', adjustedProbabilities);
        
        // Obtener contenedor de slots
        const container = document.getElementById('weapons-slots-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Mapeo de nombres de rareza a clases CSS
        const rarityClassMap = {
            'Común': 'comun',
            'Poco Común': 'poco_comun',
            'Raro': 'raro',
            'Épico': 'epico',
            'Legendario': 'legendario',
            'Mítico': 'mitico',
            'Ancestral': 'ancestral'
        };
        
        // Actualizar contador de armas
        const weaponsCountEl = document.getElementById('weapons-count');
        if (weaponsCountEl) {
            weaponsCountEl.textContent = sortedWeapons.length;
        }
        
        // Crear un slot por cada arma
        sortedWeapons.forEach(weapon => {
            const rarityClass = rarityClassMap[weapon.rarity.name] || 'comun';
            const baseProb = baseProbabilities && baseProbabilities[weapon.id] ? parseFloat(baseProbabilities[weapon.id]) : 0;
            const adjustedProb = adjustedProbabilities && adjustedProbabilities[weapon.id] ? parseFloat(adjustedProbabilities[weapon.id]) : 0;
            
            // Determinar si tiene bono de suerte (solo para épico o superior)
            const hasLuckBonus = playerLuck > 0 && ['Épico', 'Legendario', 'Mítico'].includes(weapon.rarity.name);
            const probDisplay = hasLuckBonus ? adjustedProb.toFixed(2) : baseProb.toFixed(2);
            
            if (weapon.rarity.name === 'Legendario') {
                console.log(`🎯 ${weapon.displayName}:`, {
                    rareza: weapon.rarity.name,
                    suerte: playerLuck,
                    baseProb,
                    adjustedProb,
                    hasLuckBonus,
                    probDisplay
                });
            }
            
            const slot = document.createElement('div');
            slot.className = `weapon-slot ${rarityClass}`;
            slot.title = weapon.name;
            
            // Si tiene bono, mostrar con indicador
            const probHTML = hasLuckBonus 
                ? `<div class="weapon-probability luck-bonus">
                     ${probDisplay}%
                     <span class="luck-indicator">🍀 +${((adjustedProb - baseProb) / baseProb * 100).toFixed(0)}%</span>
                   </div>`
                : `<div class="weapon-probability">${probDisplay}%</div>`;
            
            slot.innerHTML = `
                ${probHTML}
                <img src="${weapon.image}" alt="${weapon.name}" class="weapon-slot-image">
                <div class="weapon-slot-name">${weapon.displayName}</div>
                <div class="weapon-slot-rarity">${weapon.rarity.name}</div>
            `;
            
            container.appendChild(slot);
        });
        
        // Añadir control de visibilidad de indicadores de scroll
        this.updateScrollIndicators(container);
        container.addEventListener('scroll', () => this.updateScrollIndicators(container));
    }
    
    updateScrollIndicators(container) {
        const panel = container.parentElement;
        if (!panel) return;
        
        const isAtStart = container.scrollLeft <= 5;
        const isAtEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 5;
        
        // Controlar la opacidad de los indicadores
        if (isAtStart) {
            panel.style.setProperty('--left-indicator-opacity', '0');
        } else {
            panel.style.setProperty('--left-indicator-opacity', '1');
        }
        
        if (isAtEnd || container.scrollWidth <= container.clientWidth) {
            panel.style.setProperty('--right-indicator-opacity', '0');
        } else {
            panel.style.setProperty('--right-indicator-opacity', '1');
        }
    }
    
    async generateRouletteItems(boxId) {
        // Generar muchos más items para cubrir las vueltas extra
        // Con 3 vueltas extra necesitamos al menos 400 items
        this.rouletteItems = WeaponsSystem.generateRouletteItems(boxId, 500);
        
        // Renderizar items en la pista
        this.renderRouletteItems();
    }
    
    renderRouletteItems() {
        const track = document.getElementById('roulette-track');
        track.innerHTML = '';
        
        // Mapeo correcto de nombres de rareza a clases CSS
        const rarityClassMap = {
            'Común': 'comun',
            'Poco Común': 'poco_comun',
            'Raro': 'raro',
            'Épico': 'epico',
            'Legendario': 'legendario',
            'Mítico': 'mitico',
            'Ancestral': 'ancestral'
        };
        
        this.rouletteItems.forEach((weapon, index) => {
            const item = document.createElement('div');
            item.className = 'roulette-item';
            
            const rarityClass = rarityClassMap[weapon.rarity.name] || 'comun';
            
            // Obtener la calidad del arma
            const qualityLetter = weapon.quality ? weapon.quality.letter : 'E';
            const qualityColor = weapon.quality ? weapon.quality.color : '#808080';
            
            item.innerHTML = `
                <div class="quality-badge" style="background: ${qualityColor}; box-shadow: 0 0 10px ${qualityColor}50;">
                    ${qualityLetter}
                </div>
                ${weapon.isConta ? '<div class="conta-badge">✨ Conta</div>' : ''}
                <img src="${weapon.image}" alt="${weapon.name}" class="roulette-item-image">
                <div class="roulette-item-name">${weapon.displayName}</div>
                <div class="roulette-item-rarity ${rarityClass}">${weapon.rarity.name}</div>
            `;
            
            track.appendChild(item);
        });
    }
    
    async getWinningWeapon(boxId) {
        try {
            console.log('🔑 Token:', authSystem.token ? 'Presente' : 'No presente');
            
            const response = await fetch(`/api/boxes/open/${boxId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authSystem.token}`
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            
            // Guardar el resultado completo para usar después (experiencia, etc.)
            this.lastOpenResult = data;
            
            // El servidor envía 'wonItem', no 'weapon'
            return data.success ? data.wonItem : null;
        } catch (error) {
            console.error('💥 Error obteniendo arma ganadora:', error);
            return null;
        }
    }
    
    startRouletteAnimation() {
        if (this.isSpinning) return;
        this.isSpinning = true;
        
        const track = document.getElementById('roulette-track');
        
        // Calcular dimensiones
        const itemWidth = 160; // Ancho de cada item
        const containerWidth = track.parentElement.offsetWidth;
        const centerOffset = containerWidth / 2;
        
        // Calcular cuántos items caben en la pantalla
        const itemsPerScreen = Math.ceil(containerWidth / itemWidth);
        
        // Elegir una posición más adelante en la pista (entre items 300-350)
        // para que las vueltas se vean mejor
        const randomItemIndex = Math.floor(300 + Math.random() * 50);
        
        // Generar un offset aleatorio DENTRO del slot del arma elegida
        const randomOffsetPercent = (Math.random() - 0.5) * 0.6; // -30% a +30%
        const randomOffset = randomOffsetPercent * itemWidth;
        
        // Posición del item donde se detendrá
        const stopPosition = randomItemIndex * itemWidth;
        
        // Calcular posición final de la pista
        const finalPosition = -(stopPosition - centerOffset - randomOffset);
        
        // Guardar el índice
        this.finalItemIndex = randomItemIndex;
        
        // Duración más larga para desaceleración más lenta (5-6.5 segundos)
        const duration = 5000 + Math.random() * 1500; // 5000-6500ms
        
        // 🔊 Reproducir ticks mientras gira (se acelera al principio, luego desacelera)
        let tickInterval = 50; // Empezar rápido
        const maxTickInterval = 200; // Terminar lento
        const tickIncrement = 8; // Incremento progresivo
        let ticksStopped = false;
        
        const playTickSound = () => {
            if (ticksStopped) return;
            
            if (window.soundSystem) {
                window.soundSystem.playRouletteTick();
            }
            
            // Incrementar intervalo progresivamente (desaceleración)
            tickInterval = Math.min(tickInterval + tickIncrement, maxTickInterval);
            
            // Programar siguiente tick
            setTimeout(playTickSound, tickInterval);
        };
        
        // Iniciar ticks
        playTickSound();
        
        // Detener ticks cuando termine
        setTimeout(() => { ticksStopped = true; }, duration);
        
        // Animación con desaceleración ULTRA suave y gradual
        // Esta curva hace que la ruleta desacelere muy lentamente al final
        // Similar a CS:GO pero con más "arrastre" al final
        const easing = 'cubic-bezier(0.11, 0.65, 0.25, 0.995)';
        
        // Aplicar animación suave
        track.style.transition = `transform ${duration}ms ${easing}`;
        track.style.transform = `translateX(${finalPosition}px)`;
        
        // Cuando termine la animación, determinar qué arma ganó
        setTimeout(() => {
            this.determineWinningWeapon();
            this.showResult();
        }, duration + 300);
    }
    
    determineWinningWeapon() {
        // Obtener la posición REAL del track después de la animación
        const track = document.getElementById('roulette-track');
        const container = track.parentElement;
        
        // Obtener el transform actual del track
        const transform = window.getComputedStyle(track).transform;
        const matrix = new DOMMatrix(transform);
        const currentTranslateX = matrix.m41; // Posición X actual en píxeles
        
        // Calcular el centro del contenedor (donde está el highlight)
        const containerWidth = container.offsetWidth;
        const centerPosition = containerWidth / 2;
        
        // Ancho de cada item
        const itemWidth = 160;
        
        // Calcular qué item está en el centro (bajo el highlight)
        // Fórmula: (posición del centro - desplazamiento del track) / ancho del item
        const itemIndexUnderHighlight = Math.floor((centerPosition - currentTranslateX) / itemWidth);
        
        // Asegurar que el índice esté dentro del rango válido
        const validIndex = Math.max(0, Math.min(this.rouletteItems.length - 1, itemIndexUnderHighlight));
        
        // El arma ganadora es el item que está dentro del slot iluminado
        if (this.rouletteItems && this.rouletteItems[validIndex]) {
            this.winningItem = this.rouletteItems[validIndex];
            console.log('✨ SLOT ILUMINADO - Arma ganadora:', this.winningItem.name);
            console.log('� TranslateX:', currentTranslateX.toFixed(2), '| Centro:', centerPosition, '| Índice:', validIndex);
        }
    }
    
    insertWinningWeapon() {
        // Esta función ya no se usa para insertar el arma antes de la animación
        // Se mantiene por compatibilidad pero no hace nada
    }
    
    createRouletteItem(weapon) {
        const item = document.createElement('div');
        item.className = 'roulette-item';
        
        // Mapeo correcto de nombres de rareza a clases CSS
        const rarityClassMap = {
            'Común': 'comun',
            'Poco Común': 'poco_comun',
            'Raro': 'raro',
            'Épico': 'epico',
            'Legendario': 'legendario',
            'Mítico': 'mitico',
            'Ancestral': 'ancestral'
        };
        
        const rarityClass = rarityClassMap[weapon.rarity.name] || 'comun';
        
        // Obtener la calidad del arma (si existe)
        const qualityLetter = weapon.quality ? weapon.quality.letter : 'E';
        const qualityColor = weapon.quality ? weapon.quality.color : '#808080';
        
        item.innerHTML = `
            <div class="quality-badge" style="background: ${qualityColor}; box-shadow: 0 0 10px ${qualityColor}50;">
                ${qualityLetter}
            </div>
            ${weapon.isConta ? '<div class="conta-badge">✨ Conta</div>' : ''}
            <img src="${weapon.image}" alt="${weapon.name}" class="roulette-item-image">
            <div class="roulette-item-name">${weapon.displayName}</div>
            <div class="roulette-item-rarity ${rarityClass}">${weapon.rarity.name}</div>
        `;
        
        return item;
    }
    
    showResult() {
        if (!this.winningItem) {
            console.error('❌ showResult: No hay winningItem');
            return;
        }
        
        // 🔊 Reproducir sonido de victoria según rareza
        if (window.soundSystem && this.winningItem.rarity) {
            window.soundSystem.playWin(this.winningItem.rarity.name);
        }
        
        // La experiencia ya es añadida por el backend al abrir la caja
        // Simplemente mostrar mensaje en consola
        if (this.lastOpenResult && this.lastOpenResult.experienceGained) {
            console.log(`✨ +${this.lastOpenResult.experienceGained} EXP ganada por abrir caja`);
        }

        // Enviar el arma directamente al inventario
        setTimeout(async () => {
            // Mostrar botones de control
            this.showRouletteControls();

            // Añadir arma al inventario automáticamente
            if (inventorySystem) {
                const success = await inventorySystem.addWeaponToInventory(this.winningItem);

                if (success) {
                    // Mostrar notificación personalizada en esquina inferior izquierda
                    this.showWeaponNotification(this.winningItem);

                    // Actualizar inventario si está abierto
                    if (document.getElementById('inventory-modal').classList.contains('active')) {
                        await inventorySystem.loadInventory();
                        inventorySystem.renderInventory();
                    }

                    // Actualizar stats de pasivas después de añadir arma
                    await inventorySystem.loadPlayerPassiveStats();
                    
                    // Recargar datos del usuario desde el servidor para actualizar experiencia
                    if (authSystem) {
                        await authSystem.refreshUserExperience();
                    }
                    
                    // Mostrar notificación de experiencia ganada
                    if (this.lastOpenResult && this.lastOpenResult.experienceGained) {
                        this.showExperienceNotification(this.lastOpenResult.experienceGained, this.lastOpenResult.boxId);
                    }

                } else {
                    console.error('❌ Error al añadir arma al inventario');
                    authSystem.showNotification('Error al guardar el arma', 'error');
                }
            }

            // NO limpiar la pista de ruleta - dejar las armas visibles
            // Solo resetear el flag de spinning
            this.isSpinning = false;
            this.winningItem = null;

        }, 1000);
    }
    
    showExperienceNotification(expGained, boxId) {
        // Calcular EXP base según la caja
        let baseExp = 10;
        if (boxId === 1) {
            baseExp = 5;
        } else if (boxId === 2) {
            baseExp = 20;
        }
        
        // Calcular el bonus
        const bonusPercent = inventorySystem?.currentPassiveStats?.mayor_exp_caja || 0;
        const hasBonus = bonusPercent > 0;
        
        // Crear notificación flotante
        const notification = document.createElement('div');
        notification.className = 'exp-notification';
        
        notification.innerHTML = `
            <div class="exp-notif-content">
                <div class="exp-icon">⭐</div>
                <div class="exp-info">
                    <div class="exp-title">+${expGained} EXP</div>
                    ${hasBonus ? `
                        <div class="exp-bonus">
                            Base: ${baseExp} XP + Bonus: ${bonusPercent.toFixed(1)}%
                        </div>
                    ` : `
                        <div class="exp-base">Experiencia ganada</div>
                    `}
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 3000);
    }
    
    showRouletteControls() {
        // Mostrar botones de abrir de nuevo y salir
        const openAgainBtn = document.getElementById('open-again-btn');
        const exitBtn = document.getElementById('exit-roulette-btn');
        
        if (openAgainBtn) openAgainBtn.classList.remove('hidden');
        if (exitBtn) exitBtn.classList.remove('hidden');
    }
    
    hideRouletteControls() {
        // Ocultar botones de control
        const openAgainBtn = document.getElementById('open-again-btn');
        const exitBtn = document.getElementById('exit-roulette-btn');
        
        if (openAgainBtn) openAgainBtn.classList.add('hidden');
        if (exitBtn) exitBtn.classList.add('hidden');
    }
    
    showWeaponNotification(weapon) {
        // Crear contenedor de notificación si no existe
        let notificationContainer = document.getElementById('weapon-notifications');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'weapon-notifications';
            notificationContainer.className = 'weapon-notifications-container';
            document.body.appendChild(notificationContainer);
        }
        
        // Crear notificación
        const notification = document.createElement('div');
        notification.className = 'weapon-notification';
        
        // Mapeo de rareza a clase CSS
        const rarityClassMap = {
            'Común': 'comun',
            'Poco Común': 'poco_comun',
            'Raro': 'raro',
            'Épico': 'epico',
            'Legendario': 'legendario',
            'Mítico': 'mitico',
            'Ancestral': 'ancestral'
        };
        
        const rarityClass = rarityClassMap[weapon.rarity.name] || 'comun';
        notification.classList.add(`notification-${rarityClass}`);
        
        // Información de calidad
        const qualityLetter = weapon.quality ? weapon.quality.letter : 'E';
        const qualityName = weapon.quality ? weapon.quality.name : 'Grado E';
        const qualityColor = weapon.quality ? weapon.quality.color : '#808080';
        const finalPrice = weapon.finalPrice || weapon.price;
        
        notification.innerHTML = `
            <div class="weapon-notif-content">
                <div class="quality-badge-notif" style="background: ${qualityColor}; box-shadow: 0 0 15px ${qualityColor}70;">
                    ${qualityLetter}
                </div>
                <img src="${weapon.image}" alt="${weapon.name}" class="weapon-notif-image">
                <div class="weapon-notif-info">
                    <div class="weapon-notif-name">${weapon.name}</div>
                    <div class="weapon-notif-rarity ${rarityClass}">${weapon.rarity.name}</div>
                    <div class="weapon-notif-quality" style="color: ${qualityColor};">${qualityName}</div>
                    <div class="weapon-notif-price">💰 $${finalPrice}</div>
                </div>
            </div>
        `;
        
        notificationContainer.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Remover después de 5 segundos (aumentado para ver la calidad)
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
    
    showResultModal() {
        if (!this.winningItem) {
            console.error('❌ No hay winningItem para mostrar');
            return;
        }
        
        const modal = document.getElementById('weapon-result-modal');
        if (!modal) {
            console.error('❌ No se encontró el modal weapon-result-modal');
            return;
        }
        
        const weaponImage = document.getElementById('result-weapon-image');
        const weaponName = document.getElementById('result-weapon-name');
        const weaponRarity = document.getElementById('result-weapon-rarity');
        const weaponPrice = document.getElementById('result-weapon-price');
        
        // Configurar resultado
        if (weaponImage) {
            weaponImage.src = this.winningItem.image;
            weaponImage.alt = this.winningItem.name;
        }
        if (weaponName) weaponName.textContent = this.winningItem.name;
        if (weaponRarity) weaponRarity.textContent = this.winningItem.rarity.name;
        if (weaponPrice) weaponPrice.textContent = `$${this.winningItem.price.toFixed(2)}`;
        
        // Aplicar color de rareza
        if (weaponRarity) {
            const rarityClass = this.winningItem.rarity.name.toLowerCase().replace(/[^a-z]/g, '_');
            weaponRarity.className = `result-weapon-rarity ${rarityClass}`;
            console.log('🎨 Clase de rareza aplicada:', rarityClass);
        }
        
        // Forzar visibilidad del modal
        modal.style.display = 'flex';
        modal.style.zIndex = '99999';
        modal.classList.add('active');
        
    }
    
    closeResultModal() {
        const modal = document.getElementById('weapon-result-modal');
        modal.classList.remove('active');
    }
    
    collectWeapon() {
        if (!this.winningItem) return;
        
        // Aquí podrías agregar la lógica para agregar el arma al inventario
        authSystem.showNotification(`¡${this.winningItem.name} añadido al inventario!`, 'success');
        
        // Cerrar modal de resultado
        this.closeResultModal();
        
        // Ahora sí limpiar completamente el estado
        this.resetRouletteState();
    }
}

// Instancia global del sistema de ruleta
let rouletteSystem;

// Actualizar el manejo de selección de cajas para integrar con ruleta
function handleBoxPurchase(boxId) {
    const box = boxesData.find(b => b.id == boxId);
    if (!box) return;
    
    // Guardar caja actual para el sistema de ruleta
    if (rouletteSystem) {
        rouletteSystem.currentBox = box;
    }
    
    // Mostrar caja en pantalla principal
    showSelectedBox(box);
    
    // Cerrar modal de cajas
    closeBoxesModal();
    
    authSystem.showNotification(`Caja "${box.name}" seleccionada. ¡Haz click en ABRIR para continuar!`, 'success');
}

function showSelectedBox(box) {
    const selectedArea = document.getElementById('selected-box-area');
    const boxImage = document.getElementById('selected-box-image');
    const boxName = document.getElementById('selected-box-name');
    
    boxImage.src = box.image;
    boxImage.alt = box.name;
    boxName.textContent = box.name;
    
    selectedArea.classList.remove('hidden');
}

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

// ===== SISTEMA DE INVENTARIO Y DINERO =====
class InventorySystem {
    constructor(authSystem) {
        this.authSystem = authSystem;
        this.currentInventory = [];
        this.fullInventory = []; // Inventario completo sin filtrar
        this.userMoney = 0;
        this.selectedItem = null;
        this.lockedItems = new Set(); // IDs de items bloqueados
        
        // Filtros del inventario
        this.inventoryFilters = {
            search: '',
            weaponType: '',
            rarity: '',
            quality: '',
            conta: ''
        };
        
        // Cargar items bloqueados de localStorage
        const saved = localStorage.getItem('lockedItems');
        if (saved) {
            this.lockedItems = new Set(JSON.parse(saved));
        }
        
        this.setupEventListeners();
        
        // Cargar dinero inmediatamente al inicializar
        this.loadUserMoney().then(() => {
            // Iniciar sistema de dinero automático por pasivas
            this.startPassiveMoneySystem();
        }).catch(err => {
            console.error('❌ Error cargando dinero inicial:', err);
        });
    }
    
    startPassiveMoneySystem() {
        // Sistema que da dinero automáticamente cada segundo basado en pasivas
        this.passiveMoneyInterval = setInterval(async () => {
            try {
                // Obtener las stats actuales (incluyendo dinero_por_segundo)
                const statsResponse = await fetch('/api/stats/user', {
                    headers: {
                        'Authorization': `Bearer ${this.authSystem.token}`
                    }
                });
                
                const statsData = await statsResponse.json();
                
                if (statsData.success) {
                    const dineroPorSegundo = statsData.stats.dinero_por_segundo || 0;
                    
                    // Actualizar el modal si está abierto
                    const modal = document.getElementById('passives-modal');
                    if (modal && modal.classList.contains('active')) {
                        const dineroElement = document.getElementById('dinero-por-segundo-value');
                        if (dineroElement) {
                            dineroElement.textContent = `$${(dineroPorSegundo || 0).toFixed(2)}/s`;
                        }
                    }
                    
                    if (dineroPorSegundo > 0) {
                        // Añadir dinero al usuario
                        const addMoneyResponse = await fetch('/api/auth/add-money', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${this.authSystem.token}`
                            },
                            body: JSON.stringify({
                                amount: dineroPorSegundo
                            })
                        });
                        
                        const addMoneyData = await addMoneyResponse.json();
                        
                        if (addMoneyData.success) {
                            // Actualizar dinero local
                            this.userMoney += dineroPorSegundo;
                            this.updateMoneyDisplay();
                        } else {
                            console.error('❌ Error añadiendo dinero pasivo:', addMoneyData.error);
                        }
                    } else {
                        // No hay dinero por segundo
                    }
                } else {
                    console.error('❌ Error obteniendo stats para dinero pasivo:', statsData.error);
                }
            } catch (error) {
                console.error('💥 Error en sistema de dinero pasivo:', error);
                // No detener el intervalo por errores, solo loggear
            }
        }, 1000); // Cada segundo
    }
    
    setupEventListeners() {
        // Botón inventario en menú principal
        document.getElementById('inventario-btn')?.addEventListener('click', () => {
            this.openInventoryModal();
        });
        
        // Botón pasivas en menú principal
        document.getElementById('pasivas-btn')?.addEventListener('click', () => {
            this.openPassivesModal();
        });
        
        // Botones del modal de inventario
        document.getElementById('close-inventory-modal')?.addEventListener('click', () => {
            this.closeInventoryModal();
        });
        
        // Botones del modal de pasivas
        document.getElementById('close-passives-modal')?.addEventListener('click', () => {
            this.closePassivesModal();
        });
        
        // Botón Vender Todo
        document.getElementById('sell-all-btn')?.addEventListener('click', () => {
            this.sellAllUnlockedItems();
        });
        
        // Botones del modal de detalles del objeto
        document.getElementById('close-item-detail')?.addEventListener('click', () => {
            this.closeItemDetailModal();
        });
        
        document.getElementById('sell-item-btn')?.addEventListener('click', () => {
            this.sellSelectedItem();
        });
        
        document.getElementById('use-item-btn')?.addEventListener('click', () => {
            this.useSelectedItem();
        });
        
        // Botón Bloquear/Desbloquear
        document.getElementById('lock-toggle-btn')?.addEventListener('click', () => {
            this.toggleLockItem();
        });
        
        // Cerrar modales con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeInventoryModal();
                this.closeItemDetailModal();
                this.closePassivesModal();
            }
        });
        
        // Cerrar modales clickeando fuera
        document.getElementById('inventory-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'inventory-modal') {
                this.closeInventoryModal();
            }
        });
        
        document.getElementById('item-detail-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'item-detail-modal') {
                this.closeItemDetailModal();
            }
        });
    }
    
    async openInventoryModal() {
        const modal = document.getElementById('inventory-modal');
        modal.classList.add('active');
        
        // Recalcular pasivas para asegurar que estén actualizadas
        await this.forceRecalculatePassives();
        
        // Cargar inventario, dinero y pasivas
        await this.loadInventory();
        await this.loadUserMoney();
        await this.loadPlayerPassiveStats();
        
        // Actualizar UI
        this.renderInventory();
        this.updateMoneyDisplay();
    }
    
    closeInventoryModal() {
        const modal = document.getElementById('inventory-modal');
        modal.classList.remove('active');
    }
    
    async openPassivesModal() {
        const modal = document.getElementById('passives-modal');
        modal.classList.add('active');
        
        // Forzar recálculo de pasivas antes de mostrar
        await this.forceRecalculatePassives();
        
        // Agregar efecto visual de carga
        const statsGrid = document.querySelector('.passive-stats-grid');
        if (statsGrid) {
            statsGrid.style.opacity = '0';
            statsGrid.style.transform = 'translateY(20px)';
            setTimeout(() => {
                statsGrid.style.transition = 'all 0.6s ease';
                statsGrid.style.opacity = '1';
                statsGrid.style.transform = 'translateY(0)';
            }, 100);
        }
    }
    
    closePassivesModal() {
        const modal = document.getElementById('passives-modal');
        modal.classList.remove('active');
    }
    
    async forceRecalculatePassives() {
        try {
            // Llamar al endpoint para recalcular pasivas
            const response = await fetch('/api/inventory/recalculate-passives', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authSystem.token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Pasivas recalculadas correctamente');
                // Ahora cargar las estadísticas actualizadas
                this.loadPlayerPassiveStats();
            } else {
                console.error('Error recalculando pasivas:', data.error);
                // Cargar de todas formas
                this.loadPlayerPassiveStats();
            }
        } catch (error) {
            console.error('Error forzando recálculo de pasivas:', error);
            // Cargar de todas formas
            this.loadPlayerPassiveStats();
        }
    }
    
    async loadPlayerPassiveStats() {
        try {
            // Obtener estadísticas del usuario
            const statsResponse = await fetch('/api/stats/user', {
                headers: {
                    'Authorization': `Bearer ${this.authSystem.token}`
                }
            });
            
            const statsData = await statsResponse.json();
            
            if (statsData.success) {
                const stats = statsData.stats;
                
                // Actualizar los valores en la UI con animación
                // mayor_costo_armas ya viene como porcentaje listo para mostrar (0.2 = 0.2%)
                const mayorCostoDisplay = (stats.mayor_costo_armas || 0) < 1 
                    ? (stats.mayor_costo_armas || 0).toFixed(3) 
                    : (stats.mayor_costo_armas || 0).toFixed(2);
                this.updateStatWithAnimation('mayor-costo-armas-value', `+${mayorCostoDisplay}%`);
                this.updateStatWithAnimation('suerte-value', stats.suerte || 0);
                this.updateStatWithAnimation('menor-costo-cajas-value', `${stats.menor_costo_caja || 0}%`);
                this.updateStatWithAnimation('mayor-exp-caja-value', `+${stats.mayor_exp_caja || 0}%`);
                this.updateStatWithAnimation('mayor-probabilidad-grado-value', `+${stats.mayor_probabilidad_grado || 0}`);
                this.updateStatWithAnimation('dinero-por-segundo-value', `$${(stats.dinero_por_segundo || 0).toFixed(2)}/s`);
                this.updateStatWithAnimation('dinero-por-segundo-porcentaje-value', `+${(stats.dinero_por_segundo_porcentaje || 0).toFixed(2)}%`);
                
                // Guardar stats en memoria para uso posterior
                this.currentPassiveStats = stats;
                
                console.log('✅ Estadísticas de pasivas cargadas:', stats);
            } else {
                console.error('Error cargando estadísticas de pasivas:', statsData.error);
            }
        } catch (error) {
            console.error('Error obteniendo estadísticas de pasivas:', error);
        }
    }
    
    updateStatWithAnimation(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('stat-update');
            element.textContent = value;
            setTimeout(() => {
                element.classList.remove('stat-update');
            }, 500);
        }
    }
    
    closeItemDetailModal() {
        const modal = document.getElementById('item-detail-modal');
        modal.classList.remove('active');
        this.selectedItem = null;
    }
    
    async loadInventory() {
        try {
            const response = await fetch('/api/inventory', {
                headers: {
                    'Authorization': `Bearer ${this.authSystem.token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.fullInventory = data.inventory;
                this.currentInventory = data.inventory;
                // Cargar también las stats pasivas para calcular precios con bonos
                await this.loadPlayerPassiveStats();
                // Configurar filtros después de cargar
                this.setupInventoryFilters();
            } else {
                console.error('Error cargando inventario:', data.error);
                this.currentInventory = [];
                this.fullInventory = [];
            }
        } catch (error) {
            console.error('Error obteniendo inventario:', error);
            this.currentInventory = [];
            this.fullInventory = [];
        }
    }
    
    async loadUserMoney() {
        try {
            const response = await fetch('/api/inventory/money', {
                headers: {
                    'Authorization': `Bearer ${this.authSystem.token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.userMoney = data.money;
                
                // Actualizar dinero en la UI principal también
                const mainMoneyDisplay = document.getElementById('user-money');
                if (mainMoneyDisplay) {
                    mainMoneyDisplay.textContent = formatPrice(this.userMoney);
                }
            } else {
                console.error('Error cargando dinero:', data.error);
                this.userMoney = 0;
            }
        } catch (error) {
            console.error('Error obteniendo dinero:', error);
            this.userMoney = 0;
        }
    }
    
    // Configurar filtros del inventario
    setupInventoryFilters() {
        // Buscar
        const searchInput = document.getElementById('inventory-search');
        if (searchInput) {
            // Remover listener anterior si existe
            const newInput = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newInput, searchInput);
            newInput.addEventListener('input', (e) => {
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
            // Clonar el botón para remover todos los event listeners anteriores
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', () => {
                // Remover active de todos los botones del grupo
                container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                // Añadir active al botón clickeado
                newBtn.classList.add('active');
                // Actualizar filtro
                this.inventoryFilters[filterKey] = newBtn.dataset.value;
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

        this.currentInventory = filtered;
        this.renderInventory();
    }
    
    renderInventory() {
        const container = document.getElementById('inventory-container');
        const emptyState = document.getElementById('inventory-empty');
        const countDisplay = document.getElementById('inventory-count');
        
        // Actualizar contador
        countDisplay.textContent = this.currentInventory.length;
        
        if (this.currentInventory.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            container.innerHTML = '';
            
            this.currentInventory.forEach(item => {
                const itemElement = this.createInventoryItemElement(item);
                container.appendChild(itemElement);
            });
        }
    }
    
    createInventoryItemElement(item) {
        const element = document.createElement('div');
        // Remover acentos y caracteres especiales, convertir espacios a guion bajo
        const rarityClass = item.rarity.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remover acentos
            .replace(/[^a-z0-9]+/g, '_')      // Convertir no-alfanuméricos a guion bajo
            .replace(/^_+|_+$/g, '');         // Remover guiones bajos al inicio/final
        element.className = `inventory-item rarity-${rarityClass}`;
        
        // Agregar clase locked si el item está bloqueado
        if (this.lockedItems.has(item.id)) {
            element.classList.add('locked');
        }
        
        element.onclick = () => this.openItemDetailModal(item);
        
        // Obtener info de calidad
        const qualityLetter = item.quality ? item.quality.letter : 'E';
        const qualityColor = item.quality ? item.quality.color : '#808080';
        const finalPrice = item.final_price || item.price;
        
        // Calcular precio con bono de venta
        let displayPrice = finalPrice;
        if (this.passiveStats && this.passiveStats.mayorCostoArmas > 0) {
            displayPrice = finalPrice * (1 + this.passiveStats.mayorCostoArmas / 100);
        }
        
        // Obtener nombres traducidos
        const translatedWeaponName = window.WeaponsSystem?.getTranslatedWeaponName 
            ? window.WeaponsSystem.getTranslatedWeaponName(item) 
            : item.name;
        const translatedRarity = window.WeaponsSystem?.getTranslatedRarityName 
            ? window.WeaponsSystem.getTranslatedRarityName(item.rarity) 
            : item.rarity.name;
        
        element.innerHTML = `
            <div class="quality-badge-inventory" style="background: ${qualityColor}; box-shadow: 0 0 12px ${qualityColor}70;">
                ${qualityLetter}
            </div>
            <img src="${item.image}" alt="${item.name}" class="inventory-item-img">
            <div class="inventory-item-name">${translatedWeaponName}</div>
            <div class="inventory-item-rarity">${translatedRarity}</div>
            <div class="inventory-item-price">$${parseFloat(displayPrice).toFixed(2)}</div>
        `;
        
        return element;
    }
    
    openItemDetailModal(item) {
        this.selectedItem = item;
        
        const modal = document.getElementById('item-detail-modal');
        const showcase = document.querySelector('.item-showcase');
        const image = document.getElementById('detail-item-image');
        const name = document.getElementById('detail-item-name');
        const rarity = document.getElementById('detail-item-rarity');
        const price = document.getElementById('detail-item-price-value');
        const priceWithBonus = document.getElementById('detail-item-price-with-bonus');
        const bonusInfo = document.getElementById('detail-item-bonus-info');
        const date = document.getElementById('detail-item-date');
        
        // Info de calidad
        const qualityLetter = item.quality ? item.quality.letter : 'E';
        const qualityName = item.quality ? item.quality.name : 'Grado E';
        const qualityColor = item.quality ? item.quality.color : '#808080';
        const finalPrice = item.final_price || item.price;
        
        // Helper para traducción
        const t = (key) => window.i18n ? window.i18n.t(key) : key;
        
        // Calcular precio con bonificación de pasiva mayor_costo_armas
        let bonusPrice = finalPrice;
        let bonusInfoText = t('inventory_no_passive_applied');
        
        // Obtener el valor actual de la pasiva desde currentPassiveStats
        if (this.currentPassiveStats && this.currentPassiveStats.mayor_costo_armas > 0) {
            const bonusPercent = this.currentPassiveStats.mayor_costo_armas;
            bonusPrice = finalPrice * (1 + bonusPercent / 100);
            const bonusAmount = bonusPrice - finalPrice;
            bonusInfoText = `+${bonusPercent.toFixed(3)}% ${t('inventory_passive_applied')} (+$${bonusAmount.toFixed(2)})`;
        }
        
        // Obtener nombres traducidos
        const translatedWeaponName = window.WeaponsSystem?.getTranslatedWeaponName 
            ? window.WeaponsSystem.getTranslatedWeaponName(item) 
            : item.name;
        const translatedRarity = window.WeaponsSystem?.getTranslatedRarityName 
            ? window.WeaponsSystem.getTranslatedRarityName(item.rarity) 
            : item.rarity.name;
        
        // Configurar contenido
        image.src = item.image;
        image.alt = item.name;
        name.textContent = translatedWeaponName;
        rarity.textContent = translatedRarity;
        price.textContent = `$${parseFloat(finalPrice).toFixed(2)}`;
        priceWithBonus.textContent = `$${parseFloat(bonusPrice).toFixed(2)}`;
        bonusInfo.textContent = bonusInfoText;
        
        // Configurar fecha de obtención
        const obtainedDate = new Date(item.obtained_at).toLocaleDateString();
        date.textContent = obtainedDate;
        
        // Aplicar clase de rareza al badge de rareza
        const rarityClass = item.rarity.name.toLowerCase().replace(/[^a-z]/g, '_');
        rarity.className = `detail-item-rarity ${rarityClass}`;
        
        // Añadir badge de calidad grande al lado de la imagen
        const qualityBadge = showcase.querySelector('.quality-badge-detail');
        if (qualityBadge) {
            qualityBadge.remove();
        }
        
        const newQualityBadge = document.createElement('div');
        newQualityBadge.className = 'quality-badge-detail';
        newQualityBadge.style.background = qualityColor;
        newQualityBadge.style.boxShadow = `0 0 30px ${qualityColor}, inset 0 0 20px ${qualityColor}50`;
        newQualityBadge.style.border = `3px solid ${qualityColor}`;
        newQualityBadge.innerHTML = `
            <div class="quality-letter">${qualityLetter}</div>
            <div class="quality-name">${qualityName}</div>
        `;
        
        showcase.appendChild(newQualityBadge);
        
        // Aplicar borde de calidad a la imagen
        image.style.border = `4px solid ${qualityColor}`;
        image.style.boxShadow = `0 0 30px ${qualityColor}70, inset 0 0 20px ${qualityColor}30`;
        
        // Aplicar clase de rareza al showcase (fondo)
        if (showcase) {
            // Limpiar clases de rareza previas
            showcase.classList.remove('rarity-common', 'rarity-uncommon', 'rarity-rare', 'rarity-epic', 'rarity-legendary', 'rarity-mythic');
            // Agregar nueva clase de rareza
            showcase.classList.add(`rarity-${rarityClass}`);
        }
        
        // Actualizar estado del botón de bloqueo
        this.updateLockButton();
        
        // Mostrar/ocultar botón "Usar" según el tipo de item
        const useButton = document.getElementById('use-item-btn');
        if (useButton) {
            // Solo mostrar el botón "Usar" para el Borde Thunder (weapon_id 32 o nombre "Borde Thunder")
            console.log('Item details:', { weapon_id: item.weapon_id, name: item.name });
            if (item.weapon_id === 32 || item.name === 'Borde Thunder') {
                useButton.style.display = 'inline-block';
                console.log('Mostrando botón USAR para Borde Thunder');
            } else {
                useButton.style.display = 'none';
            }
        }
        
        // Poblar información de pasiva usando la función centralizada
        const passiveName = document.getElementById('detail-item-passive-name');
        const passiveDescription = document.getElementById('detail-item-passive-description');
        const passiveStackable = document.getElementById('detail-item-passive-stackable');

        // Obtener el multiplicador de grado para la pasiva
        const gradeMultiplier = item.quality && item.quality.letter 
            ? (window.WeaponsSystem.PASSIVE_GRADE_MULTIPLIERS[item.quality.letter] || 1.0)
            : 1.0;

        // Verificar si el item es Conta
        const isConta = item.is_conta === 1 || item.isConta === true;

        // Obtener información de la pasiva desde la función centralizada con el multiplicador de grado y conta
        const passiveInfo = window.WeaponsSystem.getPassiveInfo(item.pasiva, gradeMultiplier, false, isConta);
        
        if (passiveName) passiveName.textContent = passiveInfo.name;
        if (passiveDescription) passiveDescription.textContent = passiveInfo.description;
        
        // Mostrar si es apilable
        if (passiveStackable) {
            if (item.pasiva && item.pasiva.stackeable) {
                passiveStackable.innerHTML = `
                    <span class="stackable-icon">✅</span>
                    <span class="stackable-text">${t('dex_stackable')}</span>
                `;
            } else {
                passiveStackable.innerHTML = `
                    <span class="stackable-icon">🚫</span>
                    <span class="stackable-text">${t('dex_not_stackable')}</span>
                `;
            }
        }

        modal.classList.add('active');
    }
    
    async sellSelectedItem() {
        if (!this.selectedItem) return;
        
        // Guardar referencia del item ANTES de cualquier operación async
        const itemToSell = this.selectedItem;
        
        // Verificar si el item está bloqueado
        if (this.lockedItems.has(itemToSell.id)) {
            this.authSystem.showNotification('⚠️ Este item está bloqueado. Desbloquéalo primero.', 'error');
            return;
        }
        
        // Confirmar venta con modal personalizado
        const itemPrice = parseFloat(itemToSell.final_price || itemToSell.price);
        const formattedPrice = window.formatPrice ? window.formatPrice(itemPrice) : `$${itemPrice.toFixed(2)}`;
        const confirmed = await showConfirmModal(
            'Vender Arma',
            `¿Estás seguro de que quieres vender ${itemToSell.name} por ${formattedPrice}?`,
            '💸'
        );
        
        if (!confirmed) {
            return;
        }
        
        try {
            const response = await fetch('/api/inventory/sell', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authSystem.token}`
                },
                body: JSON.stringify({
                    inventoryId: itemToSell.id
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Actualizar dinero local
                this.userMoney = parseFloat(data.newMoney ?? data.newBalance ?? this.userMoney);
                this.updateMoneyDisplay();
                
                // Remover item del inventario local usando la referencia guardada
                this.currentInventory = this.currentInventory.filter(item => item.id !== itemToSell.id);
                
                // Actualizar UI
                this.renderInventory();
                this.closeItemDetailModal();
                
                // Actualizar stats de pasivas después de vender
                await this.loadPlayerPassiveStats();
                
                this.authSystem.showNotification(
                    `¡Vendiste ${itemToSell.name} por $${data.salePrice.toFixed(2)}!`, 
                    'success'
                );
                
            } else {
                this.authSystem.showNotification(data.error || 'Error al vender objeto', 'error');
            }
        } catch (error) {
            console.error('Error vendiendo objeto:', error);
            this.authSystem.showNotification('Error de conexión al vender', 'error');
        }
    }
    
    async useSelectedItem() {
        if (!this.selectedItem) return;
        
        const itemToUse = this.selectedItem;
        
        console.log('🔧 FRONTEND DEBUG: Intentando usar item:', itemToUse);
        console.log('🔧 FRONTEND DEBUG: weapon_id:', itemToUse.weapon_id, 'tipo:', typeof itemToUse.weapon_id);
        console.log('🔧 FRONTEND DEBUG: name:', itemToUse.name);
        
        // Verificar que sea el Borde Thunder (por weapon_id o nombre)
        if (itemToUse.weapon_id !== 32 && itemToUse.name !== 'Borde Thunder') {
            console.log('❌ FRONTEND DEBUG: Item no es Borde Thunder, rechazando');
            this.authSystem.showNotification('⚠️ Este item no se puede usar', 'error');
            return;
        }
        
        console.log('✅ FRONTEND DEBUG: Item es Borde Thunder, enviando al backend...');
        
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch('/api/inventory/use', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ inventoryId: itemToUse.id })
            });
            
            const data = await res.json();
            
            if (data.success) {
                // Remover item del inventario local
                this.currentInventory = this.currentInventory.filter(item => item.id !== itemToUse.id);
                
                // Actualizar UI
                this.renderInventory();
                this.closeItemDetailModal();
                
                // Actualizar stats de pasivas después de usar el item
                await this.loadPlayerPassiveStats();
                
                // Notificar al sistema de bordes que se desbloqueó uno nuevo
                if (window.playerBorderSystem && data.borderUnlocked) {
                    await window.playerBorderSystem.loadUnlockedBordersFromBackend();
                }
                
                this.authSystem.showNotification(data.message, 'success');
                
            } else {
                this.authSystem.showNotification(data.error || 'Error al usar el item', 'error');
            }
        } catch (error) {
            console.error('Error usando item:', error);
            this.authSystem.showNotification('Error de conexión al usar el item', 'error');
        }
    }
    
    async sellAllUnlockedItems() {
        const unlockedItems = this.currentInventory.filter(item => !this.lockedItems.has(item.id));
        
        if (unlockedItems.length === 0) {
            this.authSystem.showNotification('⚠️ No hay items desbloqueados para vender', 'error');
            return;
        }
        
        const totalValue = unlockedItems.reduce((sum, item) => sum + parseFloat(item.final_price || item.price), 0);
        const itemCount = unlockedItems.length;
        
        // Confirmar venta con modal personalizado
        const formattedPrice = window.formatPrice ? window.formatPrice(totalValue) : `$${totalValue.toFixed(2)}`;
        const confirmed = await showConfirmModal(
            'Vender Todo',
            `¿Vender ${itemCount} items por ${formattedPrice}?`,
            '💰'
        );
        
        if (!confirmed) {
            return;
        }
        
        let soldCount = 0;
        let totalEarned = 0;
        
        for (const item of unlockedItems) {
            try {
                const response = await fetch('/api/inventory/sell', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.authSystem.token}`
                    },
                    body: JSON.stringify({
                        inventoryId: item.id
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    soldCount++;
                    totalEarned += parseFloat(item.final_price || item.price);
                    this.userMoney = parseFloat(data.newMoney ?? data.newBalance ?? this.userMoney);
                }
            } catch (error) {
                console.error('Error vendiendo item:', item.name, error);
            }
        }
        
        // Actualizar inventario
        await this.loadInventory();
        this.renderInventory();
        this.updateMoneyDisplay();
        
        // Actualizar stats de pasivas después de vender
        await this.loadPlayerPassiveStats();
        
        this.authSystem.showNotification(
            `✅ Vendidos ${soldCount} items por $${totalEarned.toFixed(2)}!`, 
            'success'
        );
    }
    
    toggleLockItem() {
        if (!this.selectedItem) return;
        
        const itemId = this.selectedItem.id;
        
        if (this.lockedItems.has(itemId)) {
            // Desbloquear
            this.lockedItems.delete(itemId);
            this.authSystem.showNotification('🔓 Item desbloqueado', 'success');
        } else {
            // Bloquear
            this.lockedItems.add(itemId);
            this.authSystem.showNotification('🔒 Item bloqueado', 'success');
        }
        
        // Guardar en localStorage
        localStorage.setItem('lockedItems', JSON.stringify([...this.lockedItems]));
        
        // Actualizar UI
        this.updateLockButton();
        this.renderInventory();
    }
    
    updateLockButton() {
        if (!this.selectedItem) return;
        
        const lockBtn = document.getElementById('lock-toggle-btn');
        const lockIcon = lockBtn?.querySelector('.lock-icon');
        
        if (this.lockedItems.has(this.selectedItem.id)) {
            lockBtn?.classList.add('locked');
            if (lockIcon) lockIcon.textContent = '🔒';
            lockBtn?.setAttribute('title', 'Desbloquear item');
        } else {
            lockBtn?.classList.remove('locked');
            if (lockIcon) lockIcon.textContent = '🔓';
            lockBtn?.setAttribute('title', 'Bloquear item');
        }
    }
    
    updateMoneyDisplay() {
        // Asegurar que userMoney sea un número válido
        const money = this.userMoney || 0;
        // Actualizar dinero en el modal de inventario
        const inventoryMoney = document.getElementById('inventory-money-display');
        if (inventoryMoney) {
            inventoryMoney.textContent = formatPrice(money);
        }
        
        // Actualizar dinero en la UI principal
        const mainMoney = document.getElementById('user-money');
        if (mainMoney) {
            mainMoney.textContent = formatPrice(money);
        }
    }
    
    async addWeaponToInventory(weapon) {
        try {
            // Usar originalId si existe (para armas de ruleta), sino usar id normal
            const realWeaponId = weapon.originalId || weapon.id;
            
            const response = await fetch('/api/inventory/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authSystem.token}`
                },
                body: JSON.stringify({
                    weaponId: realWeaponId,
                    weaponName: weapon.name,
                    weaponImage: weapon.image,
                    weaponPrice: weapon.price,
                    weaponRarity: weapon.rarity.name,
                    weaponType: weapon.type || null,
                    quality: weapon.quality || null,
                    finalPrice: weapon.finalPrice || weapon.price,
                    isConta: weapon.isConta || false,
                    pasiva: weapon.pasiva || null
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.authSystem.showNotification(`¡${weapon.name} añadido al inventario!`, 'success');
                
                // Desbloquear icono cuando se obtiene un arma
                if (window.playerIconSystem) {
                    window.playerIconSystem.unlockIcon(weapon.image);
                }
                
                // Desbloquear arma en el Dex
                if (window.weaponDex) {
                    window.weaponDex.unlockWeapon(realWeaponId);
                } else {
                    // Fallback: guardar en localStorage
                    const saved = localStorage.getItem('unlockedWeapons');
                    const unlockedWeapons = saved ? JSON.parse(saved) : [];
                    if (!unlockedWeapons.includes(realWeaponId)) {
                        unlockedWeapons.push(realWeaponId);
                        localStorage.setItem('unlockedWeapons', JSON.stringify(unlockedWeapons));
                    }
                }
                
                return true;
            } else {
                this.authSystem.showNotification(data.error || 'Error al añadir al inventario', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error añadiendo arma al inventario:', error);
            this.authSystem.showNotification('Error de conexión', 'error');
            return false;
        }
    }
    
    async sellWeaponDirectly(weapon) {
        try {
            console.log('💸 Iniciando venta directa:', weapon.name, 'por $', weapon.price);
            const response = await fetch('/api/inventory/sell-direct', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authSystem.token}`
                },
                body: JSON.stringify({
                    weaponPrice: weapon.price
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                const serverMoney = parseFloat(data.newMoney ?? data.newBalance);
                
                // Actualizar dinero local con fallback seguro
                if (Number.isFinite(serverMoney)) {
                    this.userMoney = serverMoney;
                } else {
                    // Fallback: sumar localmente (no ideal, pero evita NaN en UI)
                    this.userMoney = (this.userMoney || 0) + (weapon.price || 0);
                }
                
                // Actualizar también en authSystem si existe
                if (this.authSystem && this.authSystem.currentUser) {
                    this.authSystem.currentUser.money = this.userMoney;
                }
                
                // Forzar actualización visual
                this.updateMoneyDisplay();
                
                this.authSystem.showNotification(
                    `¡Vendiste ${weapon.name} por $${weapon.price.toFixed(2)}!`, 
                    'success'
                );
                
                return true;
            } else {
                this.authSystem.showNotification(data.error || 'Error al vender arma', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error vendiendo arma directamente:', error);
            this.authSystem.showNotification('Error de conexión', 'error');
            return false;
        }
    }
}

// Variable global para el sistema de inventario
let inventorySystem;

// Actualizar la función collectWeapon en RouletteSystem para usar los nuevos botones
RouletteSystem.prototype.collectWeapon = function() {
    if (!this.winningItem) return;
    
    // No hacer nada aquí, los botones TOMAR y VENDER manejarán las acciones
    console.log('collectWeapon llamado pero los botones manejan las acciones');
};

// Añadir event listeners para los botones TOMAR y VENDER
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 Configurando event listeners de botones TOMAR/VENDER...');
    
    // Inicializar sistema de inventario cuando se cargue el auth system
    setTimeout(() => {
        if (authSystem) {
            inventorySystem = new InventorySystem(authSystem);
        } else {
            console.error('❌ authSystem no disponible para inicializar inventario');
        }
    }, 1000);
    
    // Verificar que los botones existen
    const takeBtn = document.getElementById('take-weapon-btn');
    
    // Botón TOMAR
    takeBtn?.addEventListener('click', async () => {
        if (!rouletteSystem?.winningItem) {
            console.error('❌ No hay winningItem disponible');
            return;
        }
        
        if (!inventorySystem) {
            console.error('❌ Sistema de inventario no disponible');
            return;
        }
        
        const success = await inventorySystem.addWeaponToInventory(rouletteSystem.winningItem);
        
        if (success) {
            // Actualizar inventario en tiempo real si el modal está abierto
            if (document.getElementById('inventory-modal').classList.contains('active')) {
                await inventorySystem.loadInventory();
                inventorySystem.renderInventory();
            }
            
            // Cerrar solo el modal de resultado, NO la caja
            const modal = document.getElementById('weapon-result-modal');
            modal.classList.remove('active');
            modal.style.display = 'none';
            
            // Limpiar SOLO la pista de ruleta, pero mantener el modal de caja abierto
            const track = document.getElementById('roulette-track');
            track.innerHTML = '';
            track.style.transform = 'translateX(0px)';
            rouletteSystem.isSpinning = false;
            rouletteSystem.winningItem = null;
            
            console.log('✅ Modal de resultado cerrado, caja sigue abierta');
        } else {
            console.error('❌ Error añadiendo arma al inventario');
        }
    });
    
});

// ===== Sistema de Opciones =====
document.addEventListener('DOMContentLoaded', () => {
    const optionsBtn = document.getElementById('options-btn');
    const optionsModal = document.getElementById('options-modal');
    const closeOptionsModal = document.getElementById('close-options-modal');
    
    const musicVolumeSlider = document.getElementById('music-volume');
    const musicVolumeValue = document.getElementById('music-volume-value');
    const sfxVolumeSlider = document.getElementById('sfx-volume');
    const sfxVolumeValue = document.getElementById('sfx-volume-value');
    
    const bgMusic = document.getElementById('background-music');
    
    // Abrir modal de opciones
    if (optionsBtn) {
        optionsBtn.addEventListener('click', () => {
            optionsModal.classList.add('active');
        });
    }
    
    // Cerrar modal de opciones
    if (closeOptionsModal) {
        closeOptionsModal.addEventListener('click', () => {
            optionsModal.classList.remove('active');
        });
    }
    
    // Cerrar al hacer click fuera del modal
    optionsModal.addEventListener('click', (e) => {
        if (e.target === optionsModal) {
            optionsModal.classList.remove('active');
        }
    });
    
    // Control de volumen de música
    if (musicVolumeSlider && bgMusic) {
        musicVolumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value;
            musicVolumeValue.textContent = `${volume}%`;
            bgMusic.volume = volume / 100;
            
            // Guardar en localStorage
            localStorage.setItem('musicVolume', volume);
        });
        
        // Cargar volumen guardado
        const savedMusicVolume = localStorage.getItem('musicVolume');
        if (savedMusicVolume) {
            musicVolumeSlider.value = savedMusicVolume;
            musicVolumeValue.textContent = `${savedMusicVolume}%`;
            bgMusic.volume = savedMusicVolume / 100;
        }
    }
    
    // Control de volumen de efectos
    if (sfxVolumeSlider && window.soundSystem) {
        sfxVolumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value;
            sfxVolumeValue.textContent = `${volume}%`;
            window.soundSystem.volume = volume / 100;
            
            // Guardar en localStorage
            localStorage.setItem('sfxVolume', volume);
        });
        
        // Cargar volumen guardado
        const savedSfxVolume = localStorage.getItem('sfxVolume');
        if (savedSfxVolume) {
            sfxVolumeSlider.value = savedSfxVolume;
            sfxVolumeValue.textContent = `${savedSfxVolume}%`;
            window.soundSystem.volume = savedSfxVolume / 100;
        }
    }
    
    // Control de idioma
    const languageSelect = document.getElementById('language-select');
    if (languageSelect && window.i18n) {
        // Establecer idioma actual
        languageSelect.value = window.i18n.currentLanguage;
        
        // Cambiar idioma al seleccionar
        languageSelect.addEventListener('change', (e) => {
            const newLanguage = e.target.value;
            if (window.i18n.setLanguage(newLanguage)) {
                // Recargar página para aplicar todas las traducciones
                location.reload();
            }
        });
    }
});