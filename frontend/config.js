// Configuración de la API
const API_CONFIG = {
    // Detectar si estamos en desarrollo o producción
    BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : 'https://openner-backend-production-8639.up.railway.app',
    
    get API_URL() {
        return `${this.BASE_URL}/api`;
    }
};

// Exportar para uso global
window.API_CONFIG = API_CONFIG;
