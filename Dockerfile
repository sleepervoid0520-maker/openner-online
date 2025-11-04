# Dockerfile para Openner Online - Optimizado para Fly.io

# Usar imagen oficial de Node.js LTS
FROM node:18-alpine

# Instalar dependencias necesarias para SQLite
RUN apk add --no-cache python3 make g++ sqlite

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json del backend
COPY backend/package*.json ./backend/

# Instalar dependencias de producción
WORKDIR /app/backend
RUN npm ci --only=production

# Copiar todo el código
WORKDIR /app
COPY . .

# Crear directorio para la base de datos si no existe
RUN mkdir -p /app/backend/database

# Exponer el puerto
EXPOSE 8080

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=8080

# Comando de inicio
CMD ["node", "backend/server.js"]
