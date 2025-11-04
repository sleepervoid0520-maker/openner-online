const { spawn } = require('child_process');
const open = require('open');
const path = require('path');

console.log('🔐 Iniciando Sistema de Autenticación...');
console.log('📦 Preparando servidor...');

// Iniciar el servidor backend
const server = spawn('node', ['backend/server.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

// Esperar un poco para que el servidor se inicie
setTimeout(async () => {
  console.log('🌐 Abriendo sistema en OperaGX...');
  
  try {
    // Intentar abrir en OperaGX primero
    await open('http://localhost:3000', {
      app: {
        name: open.apps.browserPrivate,
        arguments: ['--new-window']
      }
    });
  } catch (error) {
    console.log('⚠️  OperaGX no detectado, abriendo en navegador por defecto...');
    // Si no encuentra OperaGX, abrir en navegador por defecto
    await open('http://localhost:3000');
  }
  
  console.log('✅ ¡Sistema listo! Abre http://localhost:3000 si no se abrió automáticamente');
  console.log('🛑 Presiona Ctrl+C para cerrar el sistema');
}, 3000);

// Manejar cierre del juego
process.on('SIGINT', () => {
  console.log('\n🔄 Cerrando juego...');
  server.kill();
  process.exit(0);
});

server.on('close', (code) => {
  console.log(`🔚 Sistema cerrado con código: ${code}`);
  process.exit(code);
});