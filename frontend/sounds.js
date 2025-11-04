// Sistema de Sonidos del Juego
// Utiliza Web Audio API para generar sonidos sintéticos

class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.volume = 0.3; // Volumen por defecto (30%)
        this.init();
    }

    init() {
        try {
            // Crear contexto de audio
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 Sistema de sonidos inicializado');
        } catch (e) {
            console.warn('⚠️ Web Audio API no soportada');
            this.enabled = false;
        }
    }

    // Función auxiliar para crear un oscilador
    createOscillator(frequency, type = 'sine') {
        if (!this.audioContext || !this.enabled) return null;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gainNode.gain.value = this.volume;

        return { oscillator, gainNode };
    }

    // Sonido de click para botones
    playClick() {
        if (!this.audioContext || !this.enabled) return;

        const { oscillator, gainNode } = this.createOscillator(800, 'sine');
        const now = this.audioContext.currentTime;

        gainNode.gain.setValueAtTime(this.volume * 0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        oscillator.start(now);
        oscillator.stop(now + 0.1);
    }

    // Sonido de hover para botones
    playHover() {
        if (!this.audioContext || !this.enabled) return;

        const { oscillator, gainNode } = this.createOscillator(600, 'sine');
        const now = this.audioContext.currentTime;

        gainNode.gain.setValueAtTime(this.volume * 0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        oscillator.start(now);
        oscillator.stop(now + 0.08);
    }

    // Sonido de ruleta girando (loop)
    playRouletteSpinStart() {
        if (!this.audioContext || !this.enabled) return;

        // Crear un oscilador de baja frecuencia que aumenta gradualmente
        const { oscillator, gainNode } = this.createOscillator(100, 'sawtooth');
        const now = this.audioContext.currentTime;

        // Aumentar frecuencia gradualmente
        oscillator.frequency.setValueAtTime(100, now);
        oscillator.frequency.linearRampToValueAtTime(300, now + 2);

        gainNode.gain.setValueAtTime(this.volume * 0.2, now);

        oscillator.start(now);
        
        // Guardar referencia para poder detenerlo
        this.rouletteOscillator = oscillator;
        this.rouletteGain = gainNode;

        // Auto-detener después de 3 segundos
        setTimeout(() => this.playRouletteSpinStop(), 3000);
    }

    // Detener sonido de ruleta
    playRouletteSpinStop() {
        if (!this.rouletteOscillator || !this.enabled) return;

        const now = this.audioContext.currentTime;
        
        // Fade out suave
        this.rouletteGain.gain.setValueAtTime(this.rouletteGain.gain.value, now);
        this.rouletteGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        this.rouletteOscillator.stop(now + 0.3);
        this.rouletteOscillator = null;
        this.rouletteGain = null;
    }

    // Sonido de tick de ruleta (cada item que pasa)
    playRouletteTick() {
        if (!this.audioContext || !this.enabled) return;

        const { oscillator, gainNode } = this.createOscillator(1200, 'square');
        const now = this.audioContext.currentTime;

        gainNode.gain.setValueAtTime(this.volume * 0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        oscillator.start(now);
        oscillator.stop(now + 0.05);
    }

    // Sonido de victoria/premio (cuando se detiene la ruleta)
    playWin(rarity = 'COMUN') {
        if (!this.audioContext || !this.enabled) return;

        const now = this.audioContext.currentTime;
        
        // Diferentes melodías según rareza
        const melodies = {
            'COMUN': [523, 659, 784], // Do-Mi-Sol
            'POCO_COMUN': [523, 659, 784, 1047], // Do-Mi-Sol-Do
            'RARO': [659, 784, 1047, 1319], // Mi-Sol-Do-Mi
            'EPICO': [784, 1047, 1319, 1568], // Sol-Do-Mi-Sol
            'LEGENDARIO': [1047, 1319, 1568, 2093], // Do-Mi-Sol-Do (octava alta)
            'MITICO': [1047, 1319, 1568, 2093, 2637], // Con nota extra
            'ANCESTRAL': [1047, 1319, 1568, 2093, 2637, 3136] // Melodía completa
        };

        const melody = melodies[rarity] || melodies['COMUN'];
        
        melody.forEach((freq, index) => {
            setTimeout(() => {
                const { oscillator, gainNode } = this.createOscillator(freq, 'sine');
                const startTime = this.audioContext.currentTime;
                
                gainNode.gain.setValueAtTime(this.volume * 0.4, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
                
                oscillator.start(startTime);
                oscillator.stop(startTime + 0.3);
            }, index * 100);
        });
    }

    // Sonido de éxito
    playSuccess() {
        if (!this.audioContext || !this.enabled) return;

        const now = this.audioContext.currentTime;
        
        [523, 659, 784].forEach((freq, index) => {
            setTimeout(() => {
                const { oscillator, gainNode } = this.createOscillator(freq, 'sine');
                const startTime = this.audioContext.currentTime;
                
                gainNode.gain.setValueAtTime(this.volume * 0.3, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
                
                oscillator.start(startTime);
                oscillator.stop(startTime + 0.2);
            }, index * 80);
        });
    }

    // Sonido de error
    playError() {
        if (!this.audioContext || !this.enabled) return;

        const { oscillator, gainNode } = this.createOscillator(200, 'sawtooth');
        const now = this.audioContext.currentTime;

        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.3);

        gainNode.gain.setValueAtTime(this.volume * 0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        oscillator.start(now);
        oscillator.stop(now + 0.3);
    }

    // Sonido de nivel up
    playLevelUp() {
        if (!this.audioContext || !this.enabled) return;

        const now = this.audioContext.currentTime;
        const notes = [523, 659, 784, 1047, 1319]; // Do-Mi-Sol-Do-Mi ascendente
        
        notes.forEach((freq, index) => {
            setTimeout(() => {
                const { oscillator, gainNode } = this.createOscillator(freq, 'triangle');
                const startTime = this.audioContext.currentTime;
                
                gainNode.gain.setValueAtTime(this.volume * 0.35, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);
                
                oscillator.start(startTime);
                oscillator.stop(startTime + 0.25);
            }, index * 60);
        });
    }

    // Sonido de compra/venta
    playTransaction() {
        if (!this.audioContext || !this.enabled) return;

        const { oscillator, gainNode } = this.createOscillator(880, 'sine');
        const now = this.audioContext.currentTime;

        gainNode.gain.setValueAtTime(this.volume * 0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        oscillator.start(now);
        oscillator.stop(now + 0.15);
    }

    // Alternar sonidos on/off
    toggle() {
        this.enabled = !this.enabled;
        console.log(`🔊 Sonidos: ${this.enabled ? 'ON' : 'OFF'}`);
        return this.enabled;
    }

    // Ajustar volumen (0.0 - 1.0)
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        console.log(`🔊 Volumen ajustado a: ${(this.volume * 100).toFixed(0)}%`);
    }
}

// Crear instancia global
window.soundSystem = new SoundSystem();

// Añadir event listeners a todos los botones
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar música de fondo
    const bgMusic = document.getElementById('background-music');
    if (bgMusic) {
        bgMusic.volume = 0.15; // Volumen bajo para no molestar (15%)
        
        // Algunos navegadores bloquean autoplay, intentar reproducir al hacer click
        const playMusic = () => {
            bgMusic.play().catch(e => {
                console.log('🎵 Música se reproducirá después del primer click del usuario');
            });
            // Remover listener después del primer click
            document.removeEventListener('click', playMusic);
        };
        
        // Intentar reproducir de inmediato
        playMusic();
        // Si falla, esperar al primer click
        document.addEventListener('click', playMusic);
    }
    
    // Sonido de click en todos los botones
    document.addEventListener('click', (e) => {
        const button = e.target.closest('button, .btn, .box-open-btn, .change-icon-btn, .filter-btn');
        if (button && window.soundSystem) {
            window.soundSystem.playClick();
        }
    });

    // Sonido de hover en botones
    document.addEventListener('mouseover', (e) => {
        const button = e.target.closest('button, .btn, .box-open-btn, .change-icon-btn');
        if (button && window.soundSystem) {
            window.soundSystem.playHover();
        }
    });
});

console.log('🔊 Sistema de sonidos cargado');
