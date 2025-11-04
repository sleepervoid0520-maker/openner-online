// Cargar variables de entorno
require('dotenv').config();

// Debug: Verificar variables de entorno en Railway
console.log('🔍 DEBUG - Variables de entorno:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurada' : '❌ NO configurada');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');

const app = express();

// Confiar en el proxy de Railway para obtener la IP real del cliente
app.set('trust proxy', 1);

const server = http.createServer(app);

// Configuración dinámica para desarrollo y producción
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const PORT = process.env.PORT || 3000;

const io = socketIO(server, {
  cors: {
    origin: [FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
  }
});

// Base de datos y rutas - usando PostgreSQL
const { initializeDatabase } = require('./database/database-postgres');
const authRoutes = require('./routes/auth');
const statsRoutes = require('./routes/stats');
const boxesRoutes = require('./routes/boxes');
const inventoryRoutes = require('./routes/inventory');
const dexRoutes = require('./routes/dex');
const weaponStatsRoutes = require('./routes/weapon-stats');
const recalculateStatsRoutes = require('./routes/recalculate-stats');
const playerProfileRoutes = require('./routes/player-profile');
const iconosRoutes = require('./routes/iconos');
const bordersRoutes = require('./routes/borders');
const marketRoutes = require('./routes/market');
const rankingRoutes = require('./routes/ranking');

// Configuración de seguridad para OperaGX
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'"]
    }
  }
}));

// Rate limiting - Ajustado para gaming
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 1000, // 1000 requests por IP (mucho más generoso)
  message: { error: 'Demasiadas solicitudes, espera un momento' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS para desarrollo y producción
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Middlewares
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (frontend)
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));
app.use('/cajas', express.static(path.join(__dirname, '../frontend/cajas')));
app.use('/arma', express.static(path.join(__dirname, '../frontend/arma')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/boxes', boxesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dex', dexRoutes);
app.use('/api/weapon-stats', weaponStatsRoutes);
app.use('/api/recalculate-stats', recalculateStatsRoutes);
app.use('/api/player', playerProfileRoutes);
app.use('/api/iconos', iconosRoutes);
app.use('/api/borders', bordersRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/ranking', rankingRoutes);

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Manejar rutas SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API endpoint no encontrado' });
  } else {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Inicializar servidor
async function startServer() {
  try {
    await initializeDatabase();
    console.log('✅ Base de datos inicializada');
    
    // Configurar Socket.IO para el chat
    const chatUsers = new Map(); // userId -> {username, level, icon, currentChannel}
    const channels = [
      'Español 🇪🇸',
      'English 🇺🇸', 
      'Português 🇧🇷',
      'Français 🇫🇷',
      'Deutsch 🇩🇪',
      'Italiano 🇮🇹',
      'Русский 🇷🇺',
      '日本語 🇯🇵',
      '中文 🇨🇳',
      '한국어 🇰🇷',
      'العربية 🇸🇦',
      'Polski 🇵🇱',
      'Nederlands 🇳🇱',
      'Türkçe 🇹🇷',
      'International 🌍'
    ];
    
    io.on('connection', (socket) => {
      console.log('🔌 Usuario conectado al chat:', socket.id);
      
      // Usuario se une al chat
      socket.on('join-chat', (userData) => {
        chatUsers.set(socket.id, {
          username: userData.username,
          level: userData.level,
          icon: userData.icon,
          currentChannel: userData.channel || 'Español 🇪🇸'
        });
        
        // Unirse al canal por defecto
        socket.join(userData.channel || 'Español 🇪🇸');
        
        // Notificar a todos en el canal
        socket.to(userData.channel || 'Español 🇪🇸').emit('user-joined', {
          username: userData.username,
          message: `${userData.username} se ha unido al canal`
        });
      });
      
      // Cambiar de canal
      socket.on('change-channel', (channelName) => {
        const user = chatUsers.get(socket.id);
        if (user) {
          const oldChannel = user.currentChannel;
          socket.leave(oldChannel);
          socket.join(channelName);
          user.currentChannel = channelName;
          chatUsers.set(socket.id, user);
          
          // Notificar cambio
          socket.emit('channel-changed', channelName);
        }
      });
      
      // Enviar mensaje
      socket.on('send-message', (messageData) => {
        const user = chatUsers.get(socket.id);
        if (user) {
          const message = {
            id: Date.now() + Math.random(),
            username: user.username,
            level: user.level,
            icon: user.icon,
            border: messageData.border || 'none',
            message: messageData.message,
            timestamp: new Date().toISOString(),
            channel: user.currentChannel
          };
          
          // Enviar a todos en el canal (incluyendo el emisor)
          io.to(user.currentChannel).emit('new-message', message);
        }
      });
      
      // Usuario se desconecta
      socket.on('disconnect', () => {
        const user = chatUsers.get(socket.id);
        if (user) {
          socket.to(user.currentChannel).emit('user-left', {
            username: user.username,
            message: `${user.username} ha salido del canal`
          });
          chatUsers.delete(socket.id);
        }
        console.log('🔌 Usuario desconectado del chat:', socket.id);
      });
    });
    
    // En producción, escuchar en 0.0.0.0 (todas las interfaces)
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
    server.listen(PORT, host, () => {
      console.log(`🚀 Servidor corriendo en http://${host}:${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log('🔐 ¡Sistema de Autenticación listo!');
      console.log('💬 Sistema de chat en tiempo real activo');
    });
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();