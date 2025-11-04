// Sistema de Mercado - Market.js

const API_BASE_URL = 'http://localhost:3000/api';

// Variables globales
let currentFilters = {
    search: '',
    weapon_id: '',
    weapon_type: '',
    rarity: '',
    quality: '',
    is_conta: '',
    sort: 'newest'
};

let selectedItemForSale = null;
let selectedListingToBuy = null;

// Función para formatear números grandes
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

// Hacer funciones globales
window.openBuyConfirm = function(listingId) {
    openBuyConfirmInternal(listingId);
};

window.openSellItemModal = function(inventoryId) {
    openSellItemModalInternal(inventoryId);
};

window.cancelListing = function(listingId) {
    cancelListingInternal(listingId);
};

// Inicialización del mercado
document.addEventListener('DOMContentLoaded', () => {
    initializeMarket();
});

function initializeMarket() {
    // Botón para abrir el mercado
    const marketBtn = document.getElementById('market-btn');
    if (marketBtn) {
        marketBtn.addEventListener('click', openMarket);
    }

    // Botón para cerrar el mercado
    const closeMarketBtn = document.getElementById('close-market-modal');
    if (closeMarketBtn) {
        closeMarketBtn.addEventListener('click', closeMarket);
    }

    // Pestañas principales (Compra/Venta)
    const marketTabs = document.querySelectorAll('.market-tab');
    marketTabs.forEach(tab => {
        tab.addEventListener('click', () => switchMarketTab(tab.dataset.tab));
    });

    // Sub-pestañas de venta
    const sellSubTabs = document.querySelectorAll('.sell-sub-tab');
    sellSubTabs.forEach(tab => {
        tab.addEventListener('click', () => switchSellSubTab(tab.dataset.subtab));
    });

    // Filtros
    document.getElementById('market-search')?.addEventListener('input', applyFilters);
    document.getElementById('filter-weapon-type')?.addEventListener('change', applyFilters);
    document.getElementById('filter-rarity')?.addEventListener('change', applyFilters);
    document.getElementById('filter-quality')?.addEventListener('change', applyFilters);
    document.getElementById('filter-conta')?.addEventListener('change', applyFilters);
    document.getElementById('filter-sort')?.addEventListener('change', applyFilters);

    // Modal de venta
    document.getElementById('close-sell-item-modal')?.addEventListener('click', closeSellItemModal);
    document.getElementById('cancel-sell-btn')?.addEventListener('click', closeSellItemModal);
    document.getElementById('confirm-sell-btn')?.addEventListener('click', confirmSellItem);

    // Modal de confirmación de compra
    document.getElementById('cancel-buy-btn')?.addEventListener('click', closeBuyConfirmModal);
    document.getElementById('confirm-buy-btn')?.addEventListener('click', confirmBuyItem);
}

// Abrir modal del mercado
async function openMarket() {
    const modal = document.getElementById('market-modal');
    if (modal) {
        modal.classList.add('active');
        // Cargar listings por defecto
        await loadMarketListings();
    }
}

// Cerrar modal del mercado
function closeMarket() {
    const modal = document.getElementById('market-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Cambiar entre pestañas de Compra/Venta
function switchMarketTab(tabName) {
    // Actualizar pestañas
    document.querySelectorAll('.market-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Actualizar contenido
    document.querySelectorAll('.market-tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab-content`);
    });

    // Cargar datos según la pestaña
    if (tabName === 'buy') {
        loadMarketListings();
    } else if (tabName === 'sell') {
        loadSellInventory();
    }
}

// Cambiar entre sub-pestañas de venta
function switchSellSubTab(subtabName) {
    // Actualizar pestañas
    document.querySelectorAll('.sell-sub-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.subtab === subtabName);
    });

    // Actualizar contenido
    document.querySelectorAll('.sell-sub-content').forEach(content => {
        if (content.id === `${subtabName === 'inventory' ? 'sell-inventory' : 'my-listings'}-content`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });

    // Cargar datos según la sub-pestaña
    if (subtabName === 'inventory') {
        loadSellInventory();
    } else if (subtabName === 'listings') {
        loadMyListings();
    }
}

// Aplicar filtros
async function applyFilters() {
    currentFilters.search = document.getElementById('market-search')?.value || '';
    currentFilters.weapon_type = document.getElementById('filter-weapon-type')?.value || '';
    currentFilters.rarity = document.getElementById('filter-rarity')?.value || '';
    currentFilters.quality = document.getElementById('filter-quality')?.value || '';
    currentFilters.is_conta = document.getElementById('filter-conta')?.value || '';
    currentFilters.sort = document.getElementById('filter-sort')?.value || 'newest';

    await loadMarketListings();
}

// Cargar listings del mercado
async function loadMarketListings() {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        // Obtener perfil del usuario para saber su ID
        const profileResponse = await fetch(`${API_BASE_URL}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const profileData = await profileResponse.json();
        const currentUserId = profileData.success ? profileData.user.id : null;

        // Construir query params
        const params = new URLSearchParams();
        Object.entries(currentFilters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });

        const response = await fetch(`${API_BASE_URL}/market/listings?${params}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        
        if (data.success) {
            displayMarketListings(data.listings, currentUserId);
        } else {
            showNotification('Error al cargar el mercado', 'error');
        }
    } catch (error) {
        console.error('Error al cargar listings:', error);
        showNotification('Error al cargar el mercado', 'error');
    }
}

// Mostrar listings en la UI
function displayMarketListings(listings, currentUserId = null) {
    const grid = document.getElementById('market-listings-grid');
    if (!grid) return;

    if (listings.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <p>No se encontraron armas en venta</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = listings.map(listing => {
        const rarityClass = getRarityClass(listing.rarity);
        const isOwnListing = currentUserId && listing.seller_id === currentUserId;
        
        // Extraer solo la letra del grado - manejar diferentes formatos
        let gradeDisplay = '';
        if (listing.quality) {
            if (typeof listing.quality === 'string') {
                // Si es string, puede ser "Grado E" o solo "E"
                gradeDisplay = listing.quality.includes('Grado') ? listing.quality.split(' ')[1] : listing.quality;
            } else if (typeof listing.quality === 'object') {
                // Si es objeto, buscar la propiedad letter o name
                gradeDisplay = listing.quality.letter || listing.quality.name || '';
                // Si name incluye "Grado", extraer solo la letra
                if (gradeDisplay.includes && gradeDisplay.includes('Grado')) {
                    gradeDisplay = gradeDisplay.split(' ')[1] || gradeDisplay;
                }
            }
        }
        
        const clickHandler = isOwnListing ? '' : `onclick="window.openBuyConfirm(${listing.id})" style="cursor: pointer;"`;
        
        return `
            <div class="market-listing-card ${rarityClass}" data-listing-id="${listing.id}" ${clickHandler}>
                <div class="listing-image-container">
                    <img src="${listing.image}" alt="${listing.name}" class="listing-weapon-image">
                    ${listing.is_conta ? '<div class="listing-conta-badge">⚡ CONTA</div>' : ''}
                </div>
                <div class="listing-info">
                    <div class="listing-name">${listing.name}</div>
                    <div class="listing-rarity ${rarityClass}">${getRarityName(listing.rarity)}</div>
                    ${gradeDisplay ? `<div class="listing-quality">Grado ${gradeDisplay}</div>` : ''}
                    <div class="listing-seller">Vendedor: ${listing.seller_username}</div>
                    <div class="listing-price">💰 ${formatPrice(listing.price)}</div>
                    ${isOwnListing ? '<div class="own-listing-badge">📌 TU ARMA</div>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Variables para filtros del inventario de venta
let sellInventoryFilters = {
    search: '',
    weaponType: '',
    rarity: '',
    quality: '',
    conta: ''
};

let fullSellInventory = []; // Almacenar el inventario completo
let listedInventoryIds = []; // IDs de items ya en venta

// Cargar inventario para vender
async function loadSellInventory() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        showNotification('Debes iniciar sesión para acceder al inventario', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/inventory`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        
        if (data.success) {
            // También obtener mis listings activos para marcar items ya en venta
            const listingsResponse = await fetch(`${API_BASE_URL}/market/my-listings`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const listingsData = await listingsResponse.json();
            listedInventoryIds = listingsData.success ? 
                listingsData.listings.map(l => l.inventory_id) : [];

            fullSellInventory = data.inventory;
            setupSellInventoryFilters();
            applyInventoryFilters();
        } else {
            showNotification('Error al cargar inventario', 'error');
        }
    } catch (error) {
        console.error('Error al cargar inventario:', error);
        showNotification('Error al cargar inventario', 'error');
    }
}

// Configurar event listeners para filtros de inventario
function setupSellInventoryFilters() {
    // Buscar
    const searchInput = document.getElementById('sell-search');
    if (searchInput) {
        searchInput.removeEventListener('input', applyInventoryFilters);
        searchInput.addEventListener('input', (e) => {
            sellInventoryFilters.search = e.target.value.toLowerCase();
            applyInventoryFilters();
        });
    }

    // Tipo de arma
    setupFilterButtons('sell-weapon-type-filters', 'weaponType');
    
    // Rareza
    setupFilterButtons('sell-rarity-filters', 'rarity');
    
    // Grado
    setupFilterButtons('sell-quality-filters', 'quality');
    
    // Conta
    setupFilterButtons('sell-conta-filters', 'conta');
}

// Configurar botones de filtro
function setupFilterButtons(containerId, filterKey) {
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
            sellInventoryFilters[filterKey] = btn.dataset.value;
            applyInventoryFilters();
        });
    });
}

// Aplicar filtros al inventario
function applyInventoryFilters() {
    let filtered = [...fullSellInventory];
    
    // DEBUG: Ver formato de rarezas
    if (filtered.length > 0) {
        console.log('Primer item del inventario:', filtered[0]);
        console.log('Rareza del primer item:', filtered[0].rarity);
    }

    // Filtro de búsqueda
    if (sellInventoryFilters.search) {
        filtered = filtered.filter(item => 
            item.name.toLowerCase().includes(sellInventoryFilters.search)
        );
    }

    // Filtro de tipo de arma
    if (sellInventoryFilters.weaponType) {
        filtered = filtered.filter(item => item.weapon_type === sellInventoryFilters.weaponType);
    }

    // Filtro de rareza
    if (sellInventoryFilters.rarity) {
        filtered = filtered.filter(item => {
            // Manejar diferentes formatos de rareza
            let itemRarity = '';
            if (typeof item.rarity === 'string') {
                itemRarity = item.rarity;
            } else if (typeof item.rarity === 'object' && item.rarity) {
                itemRarity = item.rarity.name || item.rarity.key || '';
            }
            
            // Mapeo de rarezas en español a claves del sistema
            const rarityMap = {
                'Común': 'COMUN',
                'Poco Común': 'POCO_COMUN',
                'Raro': 'RARO',
                'Épico': 'EPICO',
                'Legendario': 'LEGENDARIO',
                'Mítico': 'MITICO',
                'Ancestral': 'ANCESTRAL'
            };
            
            // Si itemRarity es en español, convertir a clave
            const normalizedItemRarity = rarityMap[itemRarity] || itemRarity;
            
            return normalizedItemRarity === sellInventoryFilters.rarity;
        });
    }

    // Filtro de grado
    if (sellInventoryFilters.quality) {
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
            return itemQuality === sellInventoryFilters.quality;
        });
    }

    // Filtro de conta
    if (sellInventoryFilters.conta !== '') {
        const contaValue = parseInt(sellInventoryFilters.conta);
        filtered = filtered.filter(item => {
            const isConta = item.is_conta ? 1 : 0;
            return isConta === contaValue;
        });
    }

    displaySellInventory(filtered, listedInventoryIds);
}

// Mostrar inventario para vender
function displaySellInventory(inventory, listedInventoryIds = []) {
    const grid = document.getElementById('sell-inventory-grid');
    if (!grid) return;

    if (inventory.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <p>No tienes armas en tu inventario</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = inventory.map(item => {
        const rarityClass = getRarityClass(item.rarity);
        const isListed = listedInventoryIds.includes(item.id);
        
        // Extraer solo la letra del grado - manejar diferentes formatos
        let gradeDisplay = '';
        if (item.quality) {
            if (typeof item.quality === 'string') {
                // Si es string, puede ser "Grado E" o solo "E"
                gradeDisplay = item.quality.includes('Grado') ? item.quality.split(' ')[1] : item.quality;
            } else if (typeof item.quality === 'object') {
                // Si es objeto, buscar la propiedad letter o name
                gradeDisplay = item.quality.letter || item.quality.name || '';
                // Si name incluye "Grado", extraer solo la letra
                if (gradeDisplay.includes('Grado')) {
                    gradeDisplay = gradeDisplay.split(' ')[1] || gradeDisplay;
                }
            }
        }
        
        return `
            <div class="sell-inventory-item ${rarityClass} ${isListed ? 'already-listed' : ''}" 
                 ${!isListed ? `onclick="openSellItemModal(${item.id})"` : ''}>
                <div class="sell-item-image-container">
                    <img src="${item.image}" alt="${item.name}" class="sell-item-weapon-image">
                </div>
                <div class="listing-name">${item.name}</div>
                <div class="listing-rarity ${rarityClass}">${getRarityName(item.rarity)}</div>
                ${gradeDisplay ? `<div class="listing-quality">Grado ${gradeDisplay}</div>` : ''}
                ${item.is_conta ? '<div class="listing-conta-badge">⚡ CONTA</div>' : ''}
                ${isListed ? '<div class="already-listed-badge">YA EN VENTA</div>' : ''}
            </div>
        `;
    }).join('');
}

// Cargar mis ventas activas
async function loadMyListings() {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/market/my-listings`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        
        if (data.success) {
            displayMyListings(data.listings);
        } else {
            showNotification('Error al cargar tus ventas', 'error');
        }
    } catch (error) {
        console.error('Error al cargar ventas:', error);
        showNotification('Error al cargar tus ventas', 'error');
    }
}

// Mostrar mis ventas activas
function displayMyListings(listings) {
    const grid = document.getElementById('my-listings-grid');
    if (!grid) return;

    if (listings.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💼</div>
                <p>No tienes ventas activas en el mercado</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = listings.map(listing => {
        const rarityClass = getRarityClass(listing.rarity);
        
        // Extraer solo la letra del grado - manejar diferentes formatos
        let gradeDisplay = '';
        if (listing.quality) {
            if (typeof listing.quality === 'string') {
                // Si es string, puede ser "Grado E" o solo "E"
                gradeDisplay = listing.quality.includes('Grado') ? listing.quality.split(' ')[1] : listing.quality;
            } else if (typeof listing.quality === 'object') {
                // Si es objeto, buscar la propiedad letter o name
                gradeDisplay = listing.quality.letter || listing.quality.name || '';
                // Si name incluye "Grado", extraer solo la letra
                if (gradeDisplay.includes && gradeDisplay.includes('Grado')) {
                    gradeDisplay = gradeDisplay.split(' ')[1] || gradeDisplay;
                }
            }
        }
        
        return `
            <div class="my-listing-card ${rarityClass}">
                <div class="listing-image-container">
                    <img src="${listing.image}" alt="${listing.name}" class="listing-weapon-image">
                    ${listing.is_conta ? '<div class="listing-conta-badge">⚡ CONTA</div>' : ''}
                </div>
                <div class="listing-info">
                    <div class="listing-name">${listing.name}</div>
                    <div class="listing-rarity ${rarityClass}">${getRarityName(listing.rarity)}</div>
                    ${gradeDisplay ? `<div class="listing-quality">Grado ${gradeDisplay}</div>` : ''}
                    <div class="listing-price">${formatPrice(listing.price)}</div>
                    <button class="cancel-listing-btn" onclick="cancelListing(${listing.id})">
                        ❌ CANCELAR VENTA
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Abrir modal para vender un item
async function openSellItemModalInternal(inventoryId) {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        // Obtener datos del item
        const response = await fetch(`${API_BASE_URL}/inventory`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        
        if (data.success) {
            const item = data.inventory.find(i => i.id === inventoryId);
            if (!item) return;

            selectedItemForSale = item;

            // Llenar el modal
            document.getElementById('sell-item-image').src = item.image;
            document.getElementById('sell-item-name').textContent = item.name;
            
            const rarityEl = document.getElementById('sell-item-rarity');
            rarityEl.textContent = item.rarity;
            rarityEl.className = `sell-item-rarity ${getRarityClass(item.rarity)}`;
            
            const qualityEl = document.getElementById('sell-item-quality');
            qualityEl.textContent = item.quality || '';
            qualityEl.style.display = item.quality ? 'block' : 'none';

            // Obtener los 5 precios más bajos del mercado
            await loadLowestPrices(item.weapon_id, item.quality, item.is_conta, item.rarity);

            // Limpiar input de precio
            document.getElementById('sell-price-input').value = '';

            // Abrir modal
            document.getElementById('sell-item-modal').classList.add('active');
        }
    } catch (error) {
        console.error('Error al abrir modal de venta:', error);
        showNotification('Error al cargar item', 'error');
    }
}

// Cargar los 5 precios más bajos del mercado
async function loadLowestPrices(weaponId, quality, isConta, rarity) {
    try {
        // Extraer letra del grado si es objeto
        let qualityLetter = null;
        if (quality) {
            if (typeof quality === 'object') {
                qualityLetter = quality.letter || quality.name;
                if (qualityLetter && qualityLetter.includes('Grado')) {
                    qualityLetter = qualityLetter.split(' ')[1];
                }
            } else if (typeof quality === 'string') {
                qualityLetter = quality.includes('Grado') ? quality.split(' ')[1] : quality;
            }
        }
        
        // Extraer nombre de la rareza si es objeto
        let rarityName = null;
        if (rarity) {
            if (typeof rarity === 'object') {
                rarityName = rarity.name;
            } else if (typeof rarity === 'string') {
                rarityName = rarity;
            }
        }

        // Construir parámetros para la consulta
        const params = new URLSearchParams();
        if (qualityLetter) params.append('quality', qualityLetter);
        if (isConta !== undefined) params.append('is_conta', isConta);
        if (rarityName) params.append('rarity', rarityName);

        const response = await fetch(`${API_BASE_URL}/market/lowest-price/${weaponId}?${params}`);
        const data = await response.json();

        const priceEl = document.getElementById('lowest-market-price');
        
        if (data.success && data.lowest_prices && data.lowest_prices.length > 0) {
            // Mostrar los precios más bajos con formato
            const pricesText = data.lowest_prices
                .map((price, index) => `${index + 1}. ${formatPrice(price)}`)
                .join('\n');
            
            priceEl.innerHTML = pricesText.replace(/\n/g, '<br>');
            priceEl.style.color = '#4ecdc4';
            priceEl.style.whiteSpace = 'pre-line';
        } else {
            priceEl.textContent = 'No hay ventas activas de esta arma con estas características';
            priceEl.style.color = 'rgba(255, 255, 255, 0.5)';
        }
    } catch (error) {
        console.error('Error al obtener precios más bajos:', error);
        const priceEl = document.getElementById('lowest-market-price');
        priceEl.textContent = 'Error al cargar precios';
        priceEl.style.color = 'rgba(255, 99, 99, 0.8)';
    }
}

// Cerrar modal de venta
function closeSellItemModal() {
    document.getElementById('sell-item-modal').classList.remove('active');
    selectedItemForSale = null;
}

// Confirmar venta de item
async function confirmSellItem() {
    if (!selectedItemForSale) return;

    const token = localStorage.getItem('authToken');
    if (!token) return;

    const priceInput = document.getElementById('sell-price-input');
    const price = parseFloat(priceInput.value);

    if (isNaN(price) || price < 0.0001) {
        showNotification('El precio mínimo es $0.0001', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/market/list`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                inventory_id: selectedItemForSale.id,
                price: price
            })
        });

        const data = await response.json();

        if (data.success) {
            // 🔊 Reproducir sonido de transacción exitosa
            if (window.soundSystem) {
                window.soundSystem.playTransaction();
            }
            
            showNotification('¡Arma listada en el mercado exitosamente!', 'success');
            closeSellItemModal();
            
            // Recargar inventario para vender
            loadSellInventory();
            
            // Recargar mis listings
            loadMyListings();
            
            // Recargar el mercado (pestaña comprar) para que aparezca la nueva venta
            loadMarketListings();
            
            // También recargar el inventario principal por si acaso
            if (window.inventorySystem && window.inventorySystem.loadInventory) {
                window.inventorySystem.loadInventory();
            }
        } else {
            showNotification(data.error || 'Error al listar item', 'error');
        }
    } catch (error) {
        console.error('Error al vender item:', error);
        showNotification('Error al listar item en el mercado', 'error');
    }
}

// Abrir modal de confirmación de compra
async function openBuyConfirmInternal(listingId) {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        showNotification('Debes iniciar sesión para comprar', 'error');
        return;
    }

    try {
        // Obtener datos del listing
        const params = new URLSearchParams();
        params.append('sort', 'newest');
        
        const response = await fetch(`${API_BASE_URL}/market/listings?${params}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        
        if (data.success) {
            const listing = data.listings.find(l => l.id === listingId);
            
            if (!listing) {
                showNotification('Listing no encontrado', 'error');
                return;
            }

            // Obtener dinero del usuario
            const profileResponse = await fetch(`${API_BASE_URL}/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const profileData = await profileResponse.json();
            if (!profileData.success) {
                showNotification('Error al obtener tu perfil', 'error');
                return;
            }

            const userMoney = parseFloat(profileData.user.money || 0);
            const itemPrice = parseFloat(listing.price);

            selectedListingToBuy = listing;

            // Llenar modal de confirmación
            document.getElementById('buy-confirm-image').src = listing.image;
            document.getElementById('buy-confirm-name').textContent = listing.name;
            
            const rarityEl = document.getElementById('buy-confirm-rarity');
            rarityEl.textContent = getRarityName(listing.rarity);
            rarityEl.className = `buy-confirm-rarity ${getRarityClass(listing.rarity)}`;

            document.querySelector('#buy-confirm-seller span').textContent = listing.seller_username;
            document.querySelector('#buy-confirm-price span').textContent = formatPrice(itemPrice);

            // Mostrar dinero disponible y verificar si puede comprar
            const confirmBtn = document.getElementById('confirm-buy-btn');
            
            if (userMoney < itemPrice) {
                confirmBtn.disabled = true;
                confirmBtn.textContent = '❌ DINERO INSUFICIENTE';
                confirmBtn.style.opacity = '0.5';
                confirmBtn.style.cursor = 'not-allowed';
                showNotification(`No tienes suficiente dinero. Necesitas ${formatPrice(itemPrice)} pero solo tienes ${formatPrice(userMoney)}`, 'error');
            } else {
                confirmBtn.disabled = false;
                confirmBtn.textContent = '✅ CONFIRMAR COMPRA';
                confirmBtn.style.opacity = '1';
                confirmBtn.style.cursor = 'pointer';
            }

            // Abrir modal
            document.getElementById('buy-confirm-modal').classList.add('active');
        }
    } catch (error) {
        console.error('Error al cargar listing:', error);
        showNotification('Error al cargar listing', 'error');
    }
}

// Cerrar modal de confirmación de compra
function closeBuyConfirmModal() {
    document.getElementById('buy-confirm-modal').classList.remove('active');
    selectedListingToBuy = null;
}

// Confirmar compra
async function confirmBuyItem() {
    if (!selectedListingToBuy) return;

    const token = localStorage.getItem('authToken');
    if (!token) return;

    // Deshabilitar botón mientras procesa
    const confirmBtn = document.getElementById('confirm-buy-btn');
    const originalText = confirmBtn.textContent;
    confirmBtn.disabled = true;
    confirmBtn.textContent = '⏳ PROCESANDO...';

    try {
        const response = await fetch(`${API_BASE_URL}/market/buy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                listing_id: selectedListingToBuy.id
            })
        });

        const data = await response.json();

        if (data.success) {
            // Mensaje base de compra
            let message = `¡Compraste ${data.item.name} por ${formatPrice(data.item.price)}!`;
            
            // Agregar mensaje de desbloqueos si aplica
            if (data.unlocked) {
                const unlocks = [];
                if (data.unlocked.weapon) {
                    unlocks.push('🎯 Desbloqueado en Dex');
                }
                if (data.unlocked.icon) {
                    unlocks.push('🖼️ Icono desbloqueado');
                }
                if (unlocks.length > 0) {
                    message += '\n' + unlocks.join(' | ');
                }
            }
            
            // 🔊 Reproducir sonido de transacción exitosa
            if (window.soundSystem) {
                window.soundSystem.playTransaction();
            }
            
            showNotification(message, 'success');
            closeBuyConfirmModal();
            // Recargar listings
            loadMarketListings();
            
            // Actualizar dinero en la UI si existe el sistema de inventario
            if (window.inventorySystem && window.inventorySystem.updateMoneyDisplay) {
                // Actualizar con el nuevo balance del servidor
                if (data.new_balance !== null && data.new_balance !== undefined) {
                    window.inventorySystem.userMoney = parseFloat(data.new_balance);
                    window.inventorySystem.updateMoneyDisplay();
                }
            }
            
            // También recargar el inventario por si acaso
            if (window.inventorySystem && window.inventorySystem.loadInventory) {
                window.inventorySystem.loadInventory();
            }
            
            // Si se desbloqueó algo, recargar Dex y sistema de iconos
            if (data.unlocked && (data.unlocked.weapon || data.unlocked.icon)) {
                // Recargar Dex si está disponible
                if (window.dexSystem && window.dexSystem.loadUnlockedWeapons) {
                    setTimeout(() => {
                        window.dexSystem.loadUnlockedWeapons();
                    }, 100);
                }
                
                // Recargar iconos si está disponible
                if (window.iconSystem && window.iconSystem.loadUnlockedIconsFromBackend) {
                    setTimeout(() => {
                        window.iconSystem.loadUnlockedIconsFromBackend();
                    }, 100);
                }
            }
        } else {
            // Mostrar error específico
            showNotification(data.error || 'Error al comprar item', 'error');
            // Restaurar botón
            confirmBtn.disabled = false;
            confirmBtn.textContent = originalText;
        }
    } catch (error) {
        console.error('Error al comprar item:', error);
        showNotification('Error de conexión al procesar compra', 'error');
        // Restaurar botón
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
    }
}

// Cancelar listing
async function cancelListingInternal(listingId) {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const confirmed = await showConfirmModal(
        'Cancelar Venta',
        '¿Estás seguro de que quieres cancelar esta venta?',
        '❌'
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/market/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                listing_id: listingId
            })
        });

        const data = await response.json();

        if (data.success) {
            // 🔊 Reproducir sonido de transacción exitosa
            if (window.soundSystem) {
                window.soundSystem.playTransaction();
            }
            
            showNotification('Venta cancelada exitosamente', 'success');
            loadMyListings();
        } else {
            showNotification(data.error || 'Error al cancelar venta', 'error');
        }
    } catch (error) {
        console.error('Error al cancelar listing:', error);
        showNotification('Error al cancelar venta', 'error');
    }
}

// Obtener clase CSS según rareza
function getRarityClass(rarity) {
    // Manejar si rarity es un objeto o string
    const rarityName = typeof rarity === 'object' ? (rarity.name || rarity) : rarity;
    
    const rarityMap = {
        'Común': 'rarity-comun',
        'Poco Común': 'rarity-poco-comun',
        'Raro': 'rarity-raro',
        'Épico': 'rarity-epico',
        'Legendario': 'rarity-legendario',
        'Mítico': 'rarity-mitico',
        'Ancestral': 'rarity-ancestral'
    };
    return rarityMap[rarityName] || 'rarity-comun';
}

// Función para mostrar modal de confirmación personalizado
function showConfirmModal(title, message, icon = '⚠️') {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const titleEl = document.getElementById('confirm-title');
        const messageEl = document.getElementById('confirm-message');
        const iconEl = document.getElementById('confirm-icon');
        const acceptBtn = document.getElementById('confirm-accept-btn');
        const cancelBtn = document.getElementById('confirm-cancel-btn');

        titleEl.textContent = title;
        messageEl.textContent = message;
        iconEl.textContent = icon;

        modal.classList.add('active');

        const handleAccept = () => {
            modal.classList.remove('active');
            acceptBtn.removeEventListener('click', handleAccept);
            cancelBtn.removeEventListener('click', handleCancel);
            resolve(true);
        };

        const handleCancel = () => {
            modal.classList.remove('active');
            acceptBtn.removeEventListener('click', handleAccept);
            cancelBtn.removeEventListener('click', handleCancel);
            resolve(false);
        };

        acceptBtn.addEventListener('click', handleAccept);
        cancelBtn.addEventListener('click', handleCancel);

        // Cerrar al hacer click fuera del modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                handleCancel();
            }
        });
    });
}

// Obtener nombre de rareza
function getRarityName(rarity) {
    return typeof rarity === 'object' ? (rarity.name || 'Común') : rarity;
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    const container = document.getElementById('notifications');
    if (container) {
        container.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}
