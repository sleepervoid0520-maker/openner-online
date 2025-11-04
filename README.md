# 🎮 Openner Online

Juego multijugador de apertura de cajas con sistema de inventario, mercado y chat en tiempo real.

## 🚀 Características

- 🎁 Sistema de cajas con diferentes rarezas
- ⚔️ Colección de armas únicas
- 💰 Mercado para comprar/vender items
- 🏆 Sistema de niveles y experiencia
- 💬 Chat multicanal en tiempo real
- 📊 Rankings y estadísticas
- 🎨 Sistema de iconos y bordes personalizables

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Backend**: Node.js, Express
- **Base de datos**: SQLite
- **Tiempo real**: Socket.IO
- **Seguridad**: JWT, bcrypt, Helmet

## 📦 Instalación Local

### 1. Clonar el repositorio
```bash
git clone <tu-repo>
cd Openner
```

### 2. Instalar dependencias
```bash
# Dependencias del backend
cd backend
npm install
```

### 3. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env y configurar:
# - JWT_SECRET (generar uno seguro)
# - FRONTEND_URL (si es necesario)
```

### 4. Iniciar el servidor
```bash
npm start
```

El servidor estará corriendo en `http://localhost:3000`

## 🌐 Deploy en Render

1. Sube el proyecto a GitHub
2. Conecta tu repositorio en [Render.com](https://render.com)
3. Render detectará automáticamente el `render.yaml`
4. Configura las variables de entorno en el dashboard
5. ¡Deploy automático!

## 📝 Variables de Entorno

- `PORT`: Puerto del servidor (asignado por Render)
- `JWT_SECRET`: Secreto para tokens JWT
- `FRONTEND_URL`: URL del frontend para CORS
- `NODE_ENV`: Entorno (production/development)

## 🗄️ Base de Datos

La base de datos SQLite (`game.db`) se crea automáticamente al iniciar el servidor.
**NO** se sube a Git - persiste en el servidor de producción.

## 📄 Licencia

MIT

## 👨‍💻 Autor

Game Developer
