// Sistema de Ranking
const API_URL = window.API_CONFIG?.API_URL || 'http://localhost:3000/api';
let currentTab = 'money';
let rankingData = {
    money: null,
    weapons: null,
    level: null
};

// Inicializar sistema de traducción
let i18n;
document.addEventListener('DOMContentLoaded', () => {
    i18n = new TranslationSystem();
    i18n.updatePageTranslations();
});

// Verificar autenticación
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert(i18n ? i18n.t('auth_login_required') : 'Debes iniciar sesión para ver el ranking');
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Cambiar entre pestañas
function showTab(tabName) {
    currentTab = tabName;
    
    // Actualizar pestañas
    document.querySelectorAll('.ranking-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Actualizar contenido
    document.querySelectorAll('.ranking-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${tabName}-ranking`).classList.add('active');
    
    // Cargar datos si no están cargados
    if (!rankingData[tabName]) {
        loadRanking(tabName);
    }
}

// Cargar ranking desde API
async function loadRanking(type) {
    const token = localStorage.getItem('token');
    const sectionId = `${type}-ranking`;
    const section = document.getElementById(sectionId);
    
    try {
        section.innerHTML = `<div class="loading">${i18n ? i18n.t('ranking_loading') : 'Cargando ranking'}</div>`;
        
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
        
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar ranking');
        }
        
        const data = await response.json();
        rankingData[type] = data;
        
        // Renderizar tabla
        renderRanking(type, data);
        
    } catch (error) {
        console.error('Error al cargar ranking:', error);
        const t = (key) => i18n ? i18n.t(key) : key;
        section.innerHTML = `
            <div class="error-message">
                ${t('ranking_error')}
            </div>
        `;
    }
}

// Renderizar tabla de ranking
function renderRanking(type, data) {
    const section = document.getElementById(`${type}-ranking`);
    const t = (key) => i18n ? i18n.t(key) : key;
    
    if (!data || data.length === 0) {
        section.innerHTML = `
            <div class="error-message">
                ${t('ranking_no_data')}
            </div>
        `;
        return;
    }
    
    let tableHTML = '<table class="ranking-table"><thead><tr>';
    
    // Headers según el tipo
    switch(type) {
        case 'money':
            tableHTML += `
                <th style="width: 60px; text-align: center;">${t('ranking_position')}</th>
                <th>${t('ranking_player')}</th>
                <th>${t('ranking_level')}</th>
                <th>${t('ranking_money')}</th>
            `;
            break;
        case 'weapons':
            tableHTML += `
                <th style="width: 60px; text-align: center;">${t('ranking_position')}</th>
                <th>${t('ranking_player')}</th>
                <th>${t('ranking_level')}</th>
                <th>${t('ranking_total_value')}</th>
                <th>${t('ranking_weapons')}</th>
            `;
            break;
        case 'level':
            tableHTML += `
                <th style="width: 60px; text-align: center;">${t('ranking_position')}</th>
                <th>${t('ranking_player')}</th>
                <th>${t('ranking_level')}</th>
                <th>${t('ranking_experience')}</th>
                <th>${t('ranking_money')}</th>
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
        
        // Crear celda del jugador con icono y borde
        const playerIcon = player.selected_icon || '🎮';
        const playerBorder = player.selected_border || 'none';
        const topWeaponImage = player.top_weapon_image || '';
        
        // En el ranking no mostramos bordes, solo iconos
        tableHTML += `
            <td class="player-name">
                <div class="player-profile-mini">
                    <div class="player-icon-wrapper">
                        <div class="player-icon-container">
                            <span class="player-icon-emoji">${playerIcon}</span>
                            ${topWeaponImage ? `<img src="${topWeaponImage}" class="weapon-overlay-mini" alt="arma">` : ''}
                        </div>
                    </div>
                    <span class="player-username">${escapeHtml(player.username)}</span>
                </div>
            </td>
        `;
        
        switch(type) {
            case 'money':
                tableHTML += `<td class="level-value">Nivel ${player.level}</td>`;
                tableHTML += `<td class="money-value">$${formatNumber(player.money)}</td>`;
                break;
                
            case 'weapons':
                tableHTML += `<td class="level-value">Nivel ${player.level}</td>`;
                tableHTML += `<td class="money-value">$${formatNumber(player.total_weapons_value)}</td>`;
                tableHTML += `<td class="weapon-info">${player.top_weapons || 'Sin armas'}</td>`;
                break;
                
            case 'level':
                tableHTML += `<td class="level-value">Nivel ${player.level}</td>`;
                tableHTML += `<td>${formatNumber(player.experience)} XP</td>`;
                tableHTML += `<td class="money-value">$${formatNumber(player.money)}</td>`;
                break;
        }
        
        tableHTML += '</tr>';
    });
    
    tableHTML += '</tbody></table>';
    section.innerHTML = tableHTML;
}

// Formatear números con separadores de miles
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Recargar todos los rankings
function refreshAllRankings() {
    rankingData = {
        money: null,
        weapons: null,
        level: null
    };
    loadRanking(currentTab);
}

// Inicializar
window.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) {
        // Cargar el ranking inicial (dinero)
        loadRanking('money');
    }
});

// Auto-refresh cada 30 segundos
setInterval(() => {
    if (document.hasFocus()) {
        loadRanking(currentTab);
    }
}, 30000);
