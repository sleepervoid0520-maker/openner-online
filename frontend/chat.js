// Sistema de Chat en Tiempo Real
class ChatSystem {
    constructor() {
        this.socket = null;
        this.currentChannel = 'Español 🇪🇸';
        this.username = '';
        this.level = 1;
        this.icon = '/arma/glock 17 cereza.png';
        this.border = 'none';
        this.isConnected = false;
        
        this.initializeElements();
    }
    
    initializeElements() {
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('send-message-btn');
        this.channelSelector = document.getElementById('channel-selector');
        
        // Esperar a que el usuario esté autenticado
        this.waitForAuth();
    }
    
    waitForAuth() {
        // Verificar cada 500ms si el usuario ya está autenticado
        const checkAuth = setInterval(() => {
            const usernameDisplay = document.getElementById('username-display');
            const levelDisplay = document.getElementById('user-level');
            const iconImg = document.getElementById('player-icon-img');
            
            if (usernameDisplay && usernameDisplay.textContent !== 'Nick') {
                this.username = usernameDisplay.textContent;
                this.level = parseInt(levelDisplay.textContent) || 1;
                this.icon = iconImg.src;
                this.border = localStorage.getItem('playerBorder') || 'none';
                
                clearInterval(checkAuth);
                this.initialize();
            }
        }, 500);
    }
    
    initialize() {
        // Conectar con Socket.IO usando la URL configurada
        this.socket = io(window.API_CONFIG.BASE_URL);
        
        // Event listeners
        this.setupSocketListeners();
        this.setupUIListeners();
        
        // Conectar al chat
        this.socket.on('connect', () => {
            console.log('🔌 Conectado al chat');
            this.isConnected = true;
            this.joinChat();
        });
        
        this.socket.on('disconnect', () => {
            console.log('🔌 Desconectado del chat');
            this.isConnected = false;
            this.addSystemMessage('Desconectado del chat. Intentando reconectar...');
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('Error de conexión:', error);
            this.addSystemMessage('Error de conexión al chat');
        });
    }
    
    setupSocketListeners() {
        // Nuevo mensaje recibido
        this.socket.on('new-message', (message) => {
            this.addMessage(message);
        });
        
        // Usuario se unió
        this.socket.on('user-joined', (data) => {
            this.addSystemMessage(data.message);
        });
        
        // Usuario salió
        this.socket.on('user-left', (data) => {
            this.addSystemMessage(data.message);
        });
        
        // Canal cambiado
        this.socket.on('channel-changed', (channelName) => {
            this.currentChannel = channelName;
            this.clearMessages();
            this.addSystemMessage(`Te has unido a ${channelName}`);
        });
    }
    
    setupUIListeners() {
        // Enviar mensaje con botón
        this.sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Enviar mensaje con Enter
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        
        // Cambiar canal
        this.channelSelector.addEventListener('change', (e) => {
            this.changeChannel(e.target.value);
        });
    }
    
    joinChat() {
        this.socket.emit('join-chat', {
            username: this.username,
            level: this.level,
            icon: this.icon,
            channel: this.currentChannel
        });
        
        // Usar sistema de traducción si está disponible
        const welcomeText = window.i18n ? window.i18n.t('chat_welcome') : 'Bienvenido a';
        this.addSystemMessage(`${welcomeText} ${this.currentChannel}`);
    }
    
    sendMessage() {
        const message = this.chatInput.value.trim();
        
        if (!message || !this.isConnected) {
            return;
        }
        
        // Actualizar el borde actual desde localStorage
        this.border = localStorage.getItem('playerBorder') || 'none';
        
        // Enviar mensaje al servidor
        this.socket.emit('send-message', {
            message: message,
            border: this.border
        });
        
        // Limpiar input
        this.chatInput.value = '';
    }
    
    changeChannel(channelName) {
        if (channelName === this.currentChannel) {
            return;
        }
        
        this.socket.emit('change-channel', channelName);
    }
    
    addMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        
        const timestamp = this.formatTimestamp(message.timestamp);
        
        // Extraer solo el nombre del archivo de la ruta del icono
        const iconPath = message.icon || '/arma/glock 17 cereza.png';
        
        // Determinar la clase del borde
        const borderClass = this.getBorderClass(message.border || 'none');
        
        messageElement.innerHTML = `
            <div class="message-icon ${borderClass}" data-username="${this.escapeHtml(message.username)}" style="cursor: pointer;" title="Ver perfil de ${this.escapeHtml(message.username)}">
                <img src="${iconPath}" alt="${message.username}">
                <div class="message-level">${message.level}</div>
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-username">${this.escapeHtml(message.username)}</span>
                    <span class="message-timestamp">${timestamp}</span>
                </div>
                <div class="message-text">${this.escapeHtml(message.message)}</div>
            </div>
        `;
        
        // Añadir evento click al icono para ver el perfil
        const iconElement = messageElement.querySelector('.message-icon');
        iconElement.addEventListener('click', () => {
            this.viewPlayerProfile(message.username);
        });
        
        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }
    
    getBorderClass(borderId) {
        const borderMap = {
            'fire': 'border-fire',
            'lightning': 'border-lightning',
            'none': ''
        };
        return borderMap[borderId] || '';
    }
    
    viewPlayerProfile(username) {
        // No mostrar perfil si es el mismo usuario
        if (username === this.username) {
            return;
        }
        
        // Abrir modal con perfil del jugador
        if (window.playerProfileViewer) {
            window.playerProfileViewer.openProfile(username);
        }
    }
    
    addSystemMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'system-message';
        messageElement.textContent = message;
        
        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }
    
    clearMessages() {
        this.chatMessages.innerHTML = '';
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Actualizar información del usuario cuando cambie
    updateUserInfo(username, level, icon) {
        this.username = username;
        this.level = level;
        this.icon = icon;
        
        if (this.isConnected) {
            // Reconectar con nueva información
            this.socket.emit('join-chat', {
                username: this.username,
                level: this.level,
                icon: this.icon,
                channel: this.currentChannel
            });
        }
    }
    
    // Desconectar del chat
    disconnect() {
        if (this.socket && this.isConnected) {
            this.socket.disconnect();
            this.isConnected = false;
            this.clearMessages();
            console.log('🔌 Desconectado del chat');
        }
    }
    
    // Reconectar al chat
    reconnect() {
        if (this.socket && !this.isConnected) {
            this.socket.connect();
        } else if (!this.socket) {
            this.initialize();
        }
    }
}

// Inicializar el sistema de chat cuando el DOM esté listo
let chatSystem;

document.addEventListener('DOMContentLoaded', () => {
    chatSystem = new ChatSystem();
});

// Exportar para poder actualizar desde otros scripts
window.chatSystem = chatSystem;
