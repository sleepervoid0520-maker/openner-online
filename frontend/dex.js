// Sistema DEX (Codex de Armas)
// Gestión del sistema de colección de armas

class WeaponDex {
    constructor() {
        this.unlockedWeapons = new Set();
        this.categories = {
            'PISTOLA': { name: 'Pistola', icon: '/iconos/pistola.png', weapons: [] },
            'RIFLE': { name: 'Rifle', icon: '/iconos/rifle.png', weapons: [] },
            'ESCOPETA': { name: 'Escopeta', icon: '/iconos/escopeta.png', weapons: [] },
            'SMG': { name: 'SMG', icon: '/iconos/smg.png', weapons: [] },
            'LMG': { name: 'LMG', icon: '/iconos/neveg.png', weapons: [] },
            'SNIPER': { name: 'Sniper Rifle', icon: '/iconos/sniper rifle.png', weapons: [] },
            'CUCHILLO': { name: 'Cuchillo', icon: '/iconos/cuchillo.png', weapons: [] },
            'ESPECIAL': { name: 'Especial', icon: '/iconos/guantes.png', weapons: [] }
        };
        this.currentCategory = null;
        this.init();
    }

    init() {
        // Cargar armas desbloqueadas del servidor
        this.loadUnlockedWeapons();
        
        // Organizar armas por categoría
        this.organizeWeaponsByCategory();
        
        // Configurar event listeners
        this.setupEventListeners();
    }

    async loadUnlockedWeapons() {
        try {
            const token = localStorage.getItem('authToken');
            const API_URL = window.API_CONFIG?.API_URL || 'http://localhost:3000/api';
            
            const response = await fetch(`${API_URL}/dex/unlocked`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.unlockedWeapons = new Set(data.unlockedWeapons || []);
            } else {
                // Si hay error, cargar desde localStorage como fallback
                const saved = localStorage.getItem('unlockedWeapons');
                if (saved) {
                    this.unlockedWeapons = new Set(JSON.parse(saved));
                }
            }
        } catch (error) {
            // Si hay error, cargar desde localStorage como fallback
            const saved = localStorage.getItem('unlockedWeapons');
            if (saved) {
                this.unlockedWeapons = new Set(JSON.parse(saved));
            }
        }
    }

    async saveUnlockedWeapons() {
        try {
            const token = localStorage.getItem('authToken');
            const API_URL = window.API_CONFIG?.API_URL || 'http://localhost:3000/api';
            const response = await fetch(`${API_URL}/dex/unlock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    unlockedWeapons: Array.from(this.unlockedWeapons)
                })
            });
            
            // También guardar en localStorage
            localStorage.setItem('unlockedWeapons', JSON.stringify(Array.from(this.unlockedWeapons)));
        } catch (error) {
            // Guardar solo en localStorage si falla el servidor
            localStorage.setItem('unlockedWeapons', JSON.stringify(Array.from(this.unlockedWeapons)));
        }
    }

    getBoxForWeapon(weapon) {
        // Mapeo de armas a imágenes de cajas
        if ([1,2,3,4,5,6].includes(weapon.id)) {
            return '/cajas/1.png';
        }
        if ([7,8,9,10,11,12,13,14,15,16].includes(weapon.id)) {
            return '/cajas/2.png';
        }
        if ([17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32].includes(weapon.id)) {
            return '/cajas/3.png';
        }
        if ([33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48].includes(weapon.id)) {
            return '/cajas/4.png';
        }
        return '/cajas/1.png';
    }

    organizeWeaponsByCategory() {
        // Limpiar categorías
        Object.keys(this.categories).forEach(key => {
            this.categories[key].weapons = [];
        });

        // Obtener todas las armas del sistema
        const allWeapons = window.WeaponsSystem.getAllWeapons();
        
        // Mapeo de tipos de arma a claves de categoría
        const typeToCategory = {
            'Pistola': 'PISTOLA',
            'Rifle': 'RIFLE',
            'Escopeta': 'ESCOPETA',
            'SMG': 'SMG',
            'LMG': 'LMG',
            'Sniper Rifle': 'SNIPER',
            'Cuchillo': 'CUCHILLO',
            'Especial': 'ESPECIAL'
        };
        
        // Organizar por categoría
        allWeapons.forEach(weapon => {
            const categoryKey = typeToCategory[weapon.type];
            if (categoryKey && this.categories[categoryKey]) {
                this.categories[categoryKey].weapons.push(weapon);
            }
        });

        // Ordenar armas dentro de cada categoría por rareza y nombre
        Object.keys(this.categories).forEach(key => {
            this.categories[key].weapons.sort((a, b) => {
                // Primero por rareza (orden: COMÚN, POCO COMÚN, RARO, ÉPICO, LEGENDARIO, MÍTICO)
                const rarityOrder = ['COMUN', 'POCO_COMUN', 'RARO', 'EPICO', 'LEGENDARIO', 'MITICO'];
                const rarityA = rarityOrder.indexOf(Object.keys(window.WeaponsSystem.RARITIES).find(
                    key => window.WeaponsSystem.RARITIES[key] === a.rarity
                ));
                const rarityB = rarityOrder.indexOf(Object.keys(window.WeaponsSystem.RARITIES).find(
                    key => window.WeaponsSystem.RARITIES[key] === b.rarity
                ));
                
                if (rarityA !== rarityB) return rarityA - rarityB;
                
                // Luego por nombre
                return a.displayName.localeCompare(b.displayName);
            });
        });
    }

    setupEventListeners() {
        // Botón para abrir el Dex
        const dexBtn = document.getElementById('open-dex-btn');
        if (dexBtn) {
            dexBtn.addEventListener('click', () => this.openDex());
        }

        // Botón para cerrar el Dex
        const closeDexBtn = document.getElementById('close-dex-modal');
        if (closeDexBtn) {
            closeDexBtn.addEventListener('click', () => this.closeDex());
        }

        // Cerrar al hacer click fuera del modal
        const dexModal = document.getElementById('dex-modal');
        if (dexModal) {
            dexModal.addEventListener('click', (e) => {
                if (e.target === dexModal) {
                    this.closeDex();
                }
            });
        }

        // Botón de volver desde vista de armas
        const backBtn = document.getElementById('dex-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.showCategories());
        }
    }

    openDex() {
        const modal = document.getElementById('dex-modal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Recalcular pasivas para asegurar que estén actualizadas
            this.recalculateAllPassives();
            
            // Recargar armas desbloqueadas antes de mostrar
            this.loadUnlockedWeapons().then(() => {
                this.showCategories();
            });
        }
    }

    closeDex() {
        const modal = document.getElementById('dex-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    showCategories() {
        this.currentCategory = null;
        
        const categoriesView = document.getElementById('dex-categories-view');
        const weaponsView = document.getElementById('dex-weapons-view');
        const backBtn = document.getElementById('dex-back-btn');
        const title = document.getElementById('dex-title');
        
        if (categoriesView) categoriesView.classList.add('active');
        if (weaponsView) weaponsView.classList.remove('active');
        if (backBtn) backBtn.style.display = 'none';
        if (title) title.textContent = '📚 DEX - Codex de Armas';
        
        this.renderCategories();
    }

    showWeapons(categoryKey) {
        this.currentCategory = categoryKey;
        
        const categoriesView = document.getElementById('dex-categories-view');
        const weaponsView = document.getElementById('dex-weapons-view');
        const backBtn = document.getElementById('dex-back-btn');
        const title = document.getElementById('dex-title');
        
        if (categoriesView) categoriesView.classList.remove('active');
        if (weaponsView) weaponsView.classList.add('active');
        if (backBtn) backBtn.style.display = 'flex';
        if (title) title.textContent = `📚 ${this.categories[categoryKey].name}`;
        
        this.renderWeapons(categoryKey);
    }

    getCategoryName(key) {
        // Mapeo de categorías a claves de traducción
        const categoryKeys = {
            'PISTOLA': 'weapon_type_pistol',
            'RIFLE': 'weapon_type_rifle',
            'ESCOPETA': 'weapon_type_shotgun',
            'SMG': 'weapon_type_smg',
            'LMG': 'weapon_type_lmg',
            'SNIPER': 'weapon_type_sniper',
            'CUCHILLO': 'weapon_type_knife',
            'ESPECIAL': 'weapon_type_special'
        };
        
        const translationKey = categoryKeys[key];
        if (translationKey && window.i18n) {
            return window.i18n.t(translationKey);
        }
        return this.categories[key]?.name || key;
    }

    renderCategories() {
        const container = document.getElementById('dex-categories-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        Object.entries(this.categories).forEach(([key, category]) => {
            const totalWeapons = category.weapons.length;
            const unlockedCount = category.weapons.filter(w => this.unlockedWeapons.has(w.id)).length;
            const isLocked = totalWeapons === 0;
            const categoryName = this.getCategoryName(key);
            
            const categoryCard = document.createElement('div');
            categoryCard.className = `dex-category-card ${isLocked ? 'locked' : ''}`;
            
            categoryCard.innerHTML = `
                <div class="category-icon">
                    <img src="${category.icon}" alt="${categoryName}">
                </div>
                <div class="category-info">
                    <h3>${categoryName}</h3>
                    <div class="category-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${totalWeapons > 0 ? (unlockedCount / totalWeapons * 100) : 0}%"></div>
                        </div>
                        <span class="progress-text">${unlockedCount}/${totalWeapons}</span>
                    </div>
                </div>
                ${isLocked ? '<div class="locked-overlay"><span>🔒</span></div>' : ''}
            `;
            
            if (!isLocked) {
                categoryCard.addEventListener('click', () => this.showWeapons(key));
            }
            
            container.appendChild(categoryCard);
        });
    }

    renderWeapons(categoryKey) {
        const container = document.getElementById('dex-weapons-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        const category = this.categories[categoryKey];
        
        if (category.weapons.length === 0) {
            container.innerHTML = `
                <div class="dex-empty">
                    <div class="empty-icon">📭</div>
                    <p>No hay armas disponibles en esta categoría</p>
                </div>
            `;
            return;
        }
        
        category.weapons.forEach(weapon => {
            const isUnlocked = this.unlockedWeapons.has(weapon.id);
            
            const weaponCard = document.createElement('div');
            weaponCard.className = `dex-weapon-card ${!isUnlocked ? 'locked' : ''}`;
            
            // Color de rareza
            const rarityKey = Object.keys(window.WeaponsSystem.RARITIES).find(
                key => window.WeaponsSystem.RARITIES[key] === weapon.rarity
            );
            const rarityColor = weapon.rarity.color;
            const rarityGlow = weapon.rarity.glow;
            
            // Obtener nombre traducido de rareza
            const translatedRarity = isUnlocked && window.WeaponsSystem?.getTranslatedRarityName 
                ? window.WeaponsSystem.getTranslatedRarityName(weapon.rarity) 
                : (isUnlocked ? weapon.rarity.name : '???');
            
            // Obtener skin traducida
            const translatedSkin = isUnlocked && window.i18n && weapon.skin
                ? window.i18n.t(`skin_${weapon.skin.toLowerCase()}`) || weapon.skin
                : (isUnlocked ? weapon.skin : '???');
            
            weaponCard.innerHTML = `
                <div class="weapon-card-inner" style="border-color: ${isUnlocked ? rarityColor : '#333'}; box-shadow: ${isUnlocked ? `0 0 20px ${rarityGlow}` : 'none'}">
                    <div class="weapon-image-container">
                        <img src="${weapon.image}" alt="${weapon.name}" class="weapon-image ${!isUnlocked ? 'weapon-locked-image' : ''}">
                    </div>
                    <div class="weapon-info">
                        <h4 class="weapon-name">${isUnlocked ? weapon.displayName : '???'}</h4>
                        <p class="weapon-skin">${translatedSkin}</p>
                        <div class="weapon-rarity" style="background: ${isUnlocked ? rarityColor : '#333'}; box-shadow: ${isUnlocked ? `0 0 10px ${rarityGlow}` : 'none'}">
                            ${translatedRarity}
                        </div>
                    </div>
                </div>
            `;
            
            // Permitir clic tanto en armas desbloqueadas como bloqueadas
            weaponCard.addEventListener('click', () => this.showWeaponDetail(weapon, isUnlocked));
            
            container.appendChild(weaponCard);
        });
    }

    async showWeaponDetail(weapon, isUnlocked) {
        // Crear modal de detalle
        const detailModal = document.createElement('div');
        detailModal.className = 'weapon-detail-modal';
        
        const rarityColor = isUnlocked ? weapon.rarity.color : '#333';
        const rarityGlow = isUnlocked ? weapon.rarity.glow : 'rgba(0,0,0,0.3)';
        
        // Obtener información de la caja
        const boxInfo = this.getBoxForWeapon(weapon);
        
        // Obtener estadísticas globales del arma
        let stats = { total_openings: 0, current_existing: 0, total_conta_openings: 0, current_conta_existing: 0 };
        try {
            const API_URL = window.API_CONFIG?.API_URL || 'http://localhost:3000/api';
            const response = await fetch(`${API_URL}/weapon-stats/stats/${weapon.id}`);
            if (response.ok) {
                stats = await response.json();
            }
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
        }
        
        // Calidades disponibles
        const qualities = window.WeaponsSystem.QUALITY_GRADES;
        
        // Obtener traducciones
        const t = (key) => window.i18n ? window.i18n.t(key) : key;
        const translatedRarity = isUnlocked && window.WeaponsSystem?.getTranslatedRarityName 
            ? window.WeaponsSystem.getTranslatedRarityName(weapon.rarity) 
            : (isUnlocked ? weapon.rarity.name : '???');
        const translatedSkin = isUnlocked && weapon.skin
            ? (window.i18n ? window.i18n.t(`skin_${weapon.skin.toLowerCase()}`) : weapon.skin) || weapon.skin
            : '???';
        
        detailModal.innerHTML = `
            <div class="weapon-detail-content">
                <button class="close-detail-btn">&times;</button>
                <div class="weapon-detail-showcase" style="box-shadow: 0 0 40px ${rarityGlow}">
                    <img src="${weapon.image}" alt="${weapon.name}" class="${!isUnlocked ? 'weapon-locked-image' : ''}">
                </div>
                <div class="weapon-detail-info">
                    <h2>${isUnlocked ? weapon.displayName : '???'}</h2>
                    <h3>${translatedSkin}</h3>
                    <div class="weapon-detail-rarity" style="background: ${rarityColor}; box-shadow: 0 0 15px ${rarityGlow}">
                        ${translatedRarity}
                    </div>
                    <div class="weapon-detail-box">
                        <img src="${boxInfo}" alt="Caja" class="box-image">
                    </div>
                    <div class="weapon-detail-stats">
                        <div class="stat-item">
                            <span class="stat-label">🌍 ${t('dex_total_openings')}:</span>
                            <span class="stat-value">${(stats.total_openings || 0).toLocaleString()}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">💎 ${t('dex_current_existing')}:</span>
                            <span class="stat-value">${(stats.current_existing || 0).toLocaleString()}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">✨ ${t('dex_total_conta')}:</span>
                            <span class="stat-value">${(stats.total_conta_openings || 0).toLocaleString()}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">🌟 ${t('dex_conta_existing')}:</span>
                            <span class="stat-value">${(stats.current_conta_existing || 0).toLocaleString()}</span>
                        </div>
                    </div>
                                        </div>
                    
                    <!-- Nueva sección de pasiva -->
                    <div class="weapon-detail-passive">
                        <h4 class="passive-title">${t('dex_weapon_passive')}</h4>
                        <div class="passive-content">
                            <div class="passive-info">
                                <div class="passive-name" id="dex-passive-name">${t('dex_no_passive')}</div>
                                <div class="passive-description" id="dex-passive-description">${t('dex_no_passive_desc')}</div>
                                <div class="passive-stackable" id="dex-passive-stackable">
                                    <span class="stackable-icon">🚫</span>
                                    <span class="stackable-text">${t('dex_not_stackable')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    ${weapon.isConta ? `<div class="weapon-detail-stattrak">✨ ${t('weapon_conta')}</div>` : ''}
                    ${isUnlocked ? `
                        <div class="weapon-price-calculator">
                            <h4>${t('dex_price_calculator')}</h4>
                            <div class="quality-selector">
                                <button class="quality-btn active" data-quality="E" data-multiplier="1.0" style="background: #553f03ff;">E</button>
                                <button class="quality-btn" data-quality="F" data-multiplier="1.2" style="background: #bd710fff;">F</button>
                                <button class="quality-btn" data-quality="D" data-multiplier="1.45" style="background: #b3b8b3ff;">D</button>
                                <button class="quality-btn" data-quality="C" data-multiplier="1.7" style="background: #e1e96eff;">C</button>
                                <button class="quality-btn" data-quality="B" data-multiplier="2.0" style="background: #f3e40cff;">B</button>
                                <button class="quality-btn" data-quality="A" data-multiplier="2.5" style="background: #f55111ff;">A</button>
                                <button class="quality-btn" data-quality="S" data-multiplier="3.5" style="background: #ff0000ff;">S</button>
                                <button class="quality-btn" data-quality="M" data-multiplier="6.0" style="background: #02c3f3ff;">M</button>
                            </div>
                            <div class="conta-selector">
                                <label class="conta-checkbox">
                                    <input type="checkbox" id="conta-toggle">
                                    <span>✨ ${t('weapon_conta')} (+80%)</span>
                                </label>
                            </div>
                            <div class="calculated-price">
                                <span class="price-label">${t('dex_calculated_price')}:</span>
                                <span class="price-value" id="calculated-price">$${weapon.price.toFixed(2)}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(detailModal);
        
        // Poblar información de la pasiva usando la función centralizada
        const passiveNameEl = detailModal.querySelector('#dex-passive-name');
        const passiveDescEl = detailModal.querySelector('#dex-passive-description');
        const passiveStackableEl = detailModal.querySelector('#dex-passive-stackable');
        
        // Obtener información de la pasiva desde la función centralizada
        // Mostrar con el rango completo de valores por grado
        const passiveInfo = window.WeaponsSystem.getPassiveInfo(weapon.pasiva, 1.0, true);
        
        if (passiveNameEl) passiveNameEl.textContent = passiveInfo.name;
        if (passiveDescEl) {
            passiveDescEl.textContent = passiveInfo.description;
            passiveDescEl.style.whiteSpace = 'pre-line'; // Permitir saltos de línea
        }
        
        // Mostrar si es apilable
        if (passiveStackableEl && weapon.pasiva) {
            if (weapon.pasiva.stackeable) {
                passiveStackableEl.innerHTML = `
                    <span class="stackable-icon">✅</span>
                    <span class="stackable-text">${t('dex_stackable')}</span>
                `;
            } else {
                passiveStackableEl.innerHTML = `
                    <span class="stackable-icon">🚫</span>
                    <span class="stackable-text">${t('dex_not_stackable')}</span>
                `;
            }
        } else if (passiveStackableEl) {
            passiveStackableEl.innerHTML = `
                <span class="stackable-icon">🚫</span>
                <span class="stackable-text">${t('dex_not_stackable')}</span>
            `;
        }
        
        // Animar entrada
        setTimeout(() => detailModal.classList.add('active'), 10);
        
        // Sistema de cálculo de precio (solo si está desbloqueado)
        if (isUnlocked) {
            const qualityButtons = detailModal.querySelectorAll('.quality-btn');
            const contaToggle = detailModal.querySelector('#conta-toggle');
            const priceDisplay = detailModal.querySelector('#calculated-price');
            
            let selectedQuality = 1.0;
            let selectedGradeMultiplier = 1.0; // E por defecto
            let isConta = false;
            
            const updatePrice = () => {
                const basePrice = weapon.price;
                const qualityMultiplier = selectedQuality;
                const contaMultiplier = isConta ? 1.8 : 1.0;
                const finalPrice = Math.round(basePrice * qualityMultiplier * contaMultiplier);
                priceDisplay.textContent = `$${finalPrice.toFixed(2)}`;
            };
            
            const updatePassiveDescription = () => {
                if (weapon.pasiva) {
                    const updatedPassiveInfo = window.WeaponsSystem.getPassiveInfo(weapon.pasiva, selectedGradeMultiplier, false, isConta);
                    if (passiveDescEl) {
                        passiveDescEl.textContent = updatedPassiveInfo.description;
                    }
                }
            };
            
            qualityButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    qualityButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    selectedQuality = parseFloat(btn.dataset.multiplier);
                    
                    // Obtener el multiplicador de pasiva según el grado
                    const gradeKey = btn.dataset.quality;
                    selectedGradeMultiplier = window.WeaponsSystem.PASSIVE_GRADE_MULTIPLIERS[gradeKey] || 1.0;
                    
                    updatePrice();
                    updatePassiveDescription();
                });
            });
            
            contaToggle.addEventListener('change', (e) => {
                isConta = e.target.checked;
                updatePrice();
                updatePassiveDescription(); // También actualizar la descripción de la pasiva
            });
        }
        
        // Cerrar modal
        const closeBtn = detailModal.querySelector('.close-detail-btn');
        closeBtn.addEventListener('click', () => {
            detailModal.classList.remove('active');
            setTimeout(() => detailModal.remove(), 300);
        });
        
        detailModal.addEventListener('click', (e) => {
            if (e.target === detailModal) {
                detailModal.classList.remove('active');
                setTimeout(() => detailModal.remove(), 300);
            }
        });
    }

    unlockWeapon(weaponId) {
        if (!this.unlockedWeapons.has(weaponId)) {
            this.unlockedWeapons.add(weaponId);
            this.saveUnlockedWeapons();
            
            // Mostrar notificación de desbloqueo
            this.showUnlockNotification(weaponId);
            
            return true;
        } else {
            return false;
        }
    }

    showUnlockNotification(weaponId) {
        const weapon = window.WeaponsSystem.getWeaponById(weaponId);
        if (!weapon) return;
        
        const notification = document.createElement('div');
        notification.className = 'unlock-notification';
        notification.innerHTML = `
            <div class="unlock-content">
                <div class="unlock-icon">🎉</div>
                <div class="unlock-text">
                    <h4>¡Nueva arma desbloqueada!</h4>
                    <p>${weapon.displayName} - ${weapon.skin}</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getProgress() {
        const totalWeapons = window.WeaponsSystem.getAllWeapons().length;
        const unlockedCount = this.unlockedWeapons.size;
        
        return {
            total: totalWeapons,
            unlocked: unlockedCount,
            percentage: totalWeapons > 0 ? (unlockedCount / totalWeapons * 100) : 0
        };
    }

    async recalculateAllPassives() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            const API_URL = window.API_CONFIG?.API_URL || 'http://localhost:3000/api';
            
            const response = await fetch(`${API_URL}/inventory/recalculate-all-passives`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                console.log('✅ Pasivas recalculadas para todos los usuarios');
            } else {
                console.log('⚠️ No se pudieron recalcular las pasivas');
            }
        } catch (error) {
            console.error('Error recalculando pasivas:', error);
        }
    }
}

// Instancia global del Dex
let weaponDex = null;

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        weaponDex = new WeaponDex();
        window.weaponDex = weaponDex;
    });
} else {
    weaponDex = new WeaponDex();
    window.weaponDex = weaponDex;
}

// Exportar para uso global
window.WeaponDex = WeaponDex;
