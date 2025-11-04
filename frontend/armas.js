// Sistema de Armas y Skins del Juego
// Configuración de rareza de armas
const RARITIES = {
    COMUN: {
        name: 'Común',
        nameKey: 'rarity_common',
        color: '#B0C3D9',
        glow: 'rgba(176, 195, 217, 0.3)'
    },
    POCO_COMUN: {
        name: 'Poco Común',
        nameKey: 'rarity_uncommon',
        color: '#31ee5aff',
        glow: 'rgba(37, 184, 56, 0.4)'
    },
    RARO: {
        name: 'Raro',
        nameKey: 'rarity_rare',
        color: '#193cebff',
        glow: 'rgba(19, 42, 156, 0.5)'
    },
    EPICO: {
        name: 'Épico',
        nameKey: 'rarity_epic',
        color: '#b332e6ff',
        glow: 'rgba(245, 88, 245, 0.6)'
    },
    LEGENDARIO: {
        name: 'Legendario',
        nameKey: 'rarity_legendary',
        color: '#e71a35ff',
        glow: 'rgba(230, 44, 69, 0.8)'
    },
    MITICO: {
        name: 'Mítico',
        nameKey: 'rarity_mythic',
        color: '#eaee0dff',
        glow: 'rgba(235, 75, 75, 1.0)'
    },
    ANCESTRAL: {
        name: 'Ancestral',
        nameKey: 'rarity_ancestral',
        color: '#00ffffff',
        glow: 'rgba(0, 255, 255, 1.0)'
    }
};

// Sistema de Calidad de Armas (E-M)
// Mientras mayor la letra, más raro y más valor
const QUALITY_GRADES = {
    E: {
        name: 'Grado E',
        letter: 'E',
        probability: 35.0,      // 35%
        priceMultiplier: 1.0,   // Precio base (0%)
        color: '#553f03ff',       // Gris
        glow: 'rgba(75, 55, 2, 0.3)'
    },
    F: {
        name: 'Grado F',
        letter: 'F',
        probability: 25.0,      // 25%
        priceMultiplier: 1.2,   // +20%
        color: '#bd710fff',       // Gris claro
        glow: 'rgba(160, 160, 160, 0.4)'
    },
    D: {
        name: 'Grado D',
        letter: 'D',
        probability: 18.0,      // 18%
        priceMultiplier: 1.45,  // +45%
        color: '#b3b8b3ff',       // Verde claro
        glow: 'rgba(157, 160, 157, 0.4)'
    },
    C: {
        name: 'Grado C',
        letter: 'C',
        probability: 12.0,      // 12%
        priceMultiplier: 1.7,   // +70%
        color: '#e1e96eff',       // Azul real
        glow: 'rgba(195, 206, 103, 0.5)'
    },
    B: {
        name: 'Grado B',
        letter: 'B',
        probability: 6.0,       // 6%
        priceMultiplier: 2.0,   // +100%
        color: '#f3e40cff',       // Púrpura medio
        glow: 'rgba(218, 214, 13, 0.5)'
    },
    A: {
        name: 'Grado A',
        letter: 'A',
        probability: 2.5,       // 2.5%
        priceMultiplier: 2.5,   // +150%
        color: '#f55111ff',       // Rosa fuerte
        glow: 'rgba(245, 106, 26, 0.6)'
    },
    S: {
        name: 'Grado S',
        letter: 'S',
        probability: 1.0,       // 1%
        priceMultiplier: 3.5,   // +250%
        color: '#ff0000ff',       // Dorado
        glow: 'rgba(221, 13, 13, 0.7)'
    },
    M: {
        name: 'Masterpiece',
        letter: 'M',
        probability: 0.5,       // 0.5% (1 en 200)
        priceMultiplier: 6.0,   // +500%
        color: '#02c3f3ff',       // Rojo-naranja brillante
        glow: 'rgba(2, 238, 247, 0.9)'
    }
};

// Sistema de Multiplicadores de Pasivas por Grado
// Ejemplos de cómo se aplican los multiplicadores:
// 
// Beretta 92FS Manzana (pasiva base: 0.5% menor costo de caja):
//   E: 0.5% (base)
//   F: 0.6% (0.5 × 1.2)
//   D: 0.7% (0.5 × 1.4)
//   C: 0.8% (0.5 × 1.6)
//   B: 1.0% (0.5 × 2.0)
//   A: 1.2% (0.5 × 2.4)
//   S: 1.5% (0.5 × 3.0)
//   M: 2.0% (0.5 × 4.0)
//
// Si es Conta (+30% adicional):
//   E Conta: 0.65% (0.5 × 1.0 × 1.3)
//   F Conta: 0.78% (0.5 × 1.2 × 1.3)
//   ...
//   M Conta: 2.6% (0.5 × 4.0 × 1.3)
//
// Esto aplica a TODAS las pasivas (dinero por segundo, exp extra, suerte, etc.)
const PASSIVE_GRADE_MULTIPLIERS = {
    E: 1.0,    // Valor base (sin multiplicador)
    F: 1.2,    // +20%
    D: 1.4,    // +40%
    C: 1.6,    // +60%
    B: 2.0,    // +100%
    A: 2.4,    // +140%
    S: 3.0,    // +200%
    M: 5.0     // +400%
};

// Multiplicador adicional para armas Conta
const CONTA_PASSIVE_MULTIPLIER = 1.3; // +30% adicional

// Función para aplicar el multiplicador de grado y conta a una pasiva
function applyGradeMultiplierToPassive(pasiva, gradeMultiplier, isConta = false) {
    if (!pasiva || !pasiva.valor) return pasiva;
    
    // Aplicar multiplicador de grado primero, luego el de conta si aplica
    const contaMultiplier = isConta ? CONTA_PASSIVE_MULTIPLIER : 1.0;
    const finalMultiplier = gradeMultiplier * contaMultiplier;
    
    return {
        ...pasiva,
        valor: pasiva.valor * finalMultiplier,
        valorBase: pasiva.valorBase || pasiva.valor, // Guardar valor original si no existe
        isConta: isConta // Guardar si es conta
    };
}

// Función para obtener una calidad aleatoria basada en probabilidades
function getRandomQuality(bonusValue = 0) {
    // Calcular aumento directo a la probabilidad de M basado en el bonus
    let mIncrease = 0;
    if (bonusValue <= 10) {
        mIncrease = bonusValue * 0.01; // 0.1% por punto hasta 10
    } else if (bonusValue <= 100) {
        mIncrease = 0.1 + (bonusValue - 10) * 0.0025; // +0.025% por punto adicional
    } else if (bonusValue <= 1000) {
        mIncrease = 0.35 + (bonusValue - 100) * 0.00015; // +0.015% por punto adicional
    } else {
        mIncrease = 0.5; // Máximo 0.5% aumento
    }
    
    // Aplicar el aumento directo a la probabilidad de M
    const adjustedGrades = {};
    Object.keys(QUALITY_GRADES).forEach(grade => {
        adjustedGrades[grade] = { ...QUALITY_GRADES[grade] };
    });
    
    adjustedGrades.M.probability += mIncrease;
    
    // Normalizar para que la suma total sea 100
    const totalProb = Object.values(adjustedGrades).reduce((sum, grade) => sum + grade.probability, 0);
    if (totalProb > 100) {
        const scale = 100 / totalProb;
        Object.keys(adjustedGrades).forEach(grade => {
            adjustedGrades[grade].probability *= scale;
        });
    }
    
    const random = Math.random() * 100; // 0-100
    let accumulated = 0;
    
    // Recorrer desde E hasta M
    const grades = ['E', 'F', 'D', 'C', 'B', 'A', 'S', 'M'];
    
    for (const grade of grades) {
        accumulated += adjustedGrades[grade].probability;
        if (random < accumulated) {
            return adjustedGrades[grade];
        }
    }
    
    // Fallback a E si algo sale mal
    return adjustedGrades.E;
}

// Tipos de armas
const WEAPON_TYPES = {
    PISTOLA: 'Pistola',
    RIFLE: 'Rifle',
    ESCOPETA: 'Escopeta',
    SMG: 'SMG',
    LMG: 'LMG',
    SNIPER: 'Sniper Rifle',
    CUCHILLO: 'Cuchillo'
};

// Base de datos de armas disponibles
const WEAPONS_DATABASE = [
    {
        id: 1,
        name: 'Beretta 92FS Manzana',
        displayName: 'Beretta 92FS',
        skin: 'Manzana',
        type: WEAPON_TYPES.PISTOLA,
        rarity: RARITIES.RARO,
        price: 25,
        pasiva: { tipo: 'menor_costo_caja', valor: 0.05, stackeable: false },
        image: '/arma/baretta 92fs manzana.png',
        description: 'Una pistola clásica con un acabado colorido inspirado en manzanas frescas.'
    },
    {
        id: 7,
        name: 'Beretta 1301 Arena',
        displayName: 'Beretta 1301',
        skin: 'Arena',
        type: WEAPON_TYPES.ESCOPETA,
        rarity: RARITIES.COMUN,
        price: 12,
        pasiva: { tipo: 'dinero_por_segundo', valor: 0.08, stackeable: true },
        image: '/arma/Beretta 1301 arena.png',
        description: 'Escopeta táctica con acabado arena.'
    },
    {
        id: 8,
        name: 'Sig Sauer P226 Limon',
        displayName: 'Sig Sauer P226',
        skin: 'Limon',
        type: WEAPON_TYPES.PISTOLA,
        rarity: RARITIES.COMUN,
        price: 15,
        pasiva: { tipo: 'dinero_por_segundo', valor: 0.07, stackeable: true },
        image: '/arma/Sig Sauer P226 limon.png',
        description: 'Pistola con detalles en color limón.'
    },
    {
        id: 9,
        name: 'Famas Militar',
        displayName: 'Famas',
        skin: 'Militar',
        type: WEAPON_TYPES.RIFLE,
        rarity: RARITIES.COMUN,
        price: 11,
        pasiva: { tipo: 'dinero_por_segundo', valor: 0.07, stackeable: true },
        image: '/arma/Famas militar.png',
        description: 'Rifle Famas con camuflaje militar.'
    },
    {
        id: 10,
        name: 'Glock 26 Navideña',
        displayName: 'Glock 26',
        skin: 'Navideña',
        type: WEAPON_TYPES.PISTOLA,
        rarity: RARITIES.POCO_COMUN,
        price: 45,
        pasiva: { tipo: 'mayor_costo_armas', valor: 0.02, stackeable: true },
        image: '/arma/glock 26 navideña.png',
        description: 'Edición especial navideña.'
    },
    {
        id: 11,
        name: 'G3SG1 Milicia',
        displayName: 'G3SG1',
        skin: 'Milicia',
        type: WEAPON_TYPES.SNIPER,
        rarity: RARITIES.POCO_COMUN,
        price: 55,
        pasiva: { tipo: 'mayor_costo_armas', valor: 0.2, stackeable: true },
        image: '/arma/G3SG1 milicia.png',
        description: 'Francotirador con camuflaje de milicia.'
    },
    {
        id: 12,
        name: 'AR-10 Esmeralda',
        displayName: 'AR-10',
        skin: 'Esmeralda',
        type: WEAPON_TYPES.RIFLE,
        rarity: RARITIES.RARO,
        price: 132,
        pasiva: { tipo: 'menor_costo_caja', valor: 0.03, stackeable: false },
        image: '/arma/ar-10 Esmeralda.png',
        description: 'Rifle AR-10 con acabado esmeralda.'
    },
    {
        id: 13,
        name: 'M16A4 Noche Lunar',
        displayName: 'M16A4',
        skin: 'Noche Lunar',
        type: WEAPON_TYPES.RIFLE,
        rarity: RARITIES.RARO,
        price: 112,
        pasiva: { tipo: 'dinero_por_segundo', valor: 0.1, stackeable: true },
        image: '/arma/m16a4 noche lunar.png',
        description: 'Rifle M16A4 con diseño de noche lunar.'
    },
    {
        id: 14,
        name: 'Desert Eagle Sonriente',
        displayName: 'Desert Eagle',
        skin: 'Sonriente',
        type: WEAPON_TYPES.PISTOLA,
        rarity: RARITIES.EPICO,
        price: 350,
        pasiva: { tipo: 'exp_extra', valor: 0.1, stackeable: true },
        image: '/arma/Desert Eagle Sonriente.png',
        description: 'Desert Eagle edición sonriente.'
    },
    {
        id: 15,
        name: 'AK 47 Fuego Artificial',
        displayName: 'AK 47',
        skin: 'Fuego Artificial',
        type: WEAPON_TYPES.RIFLE,
        rarity: RARITIES.EPICO,
        price: 485,
        pasiva: { tipo: 'exp_extra', valor: 0.1, stackeable: true },
        image: '/arma/ak-47 fuego artificial.png',
        description: 'AK 47 con skin de fuegos artificiales.'
    },
    {
        id: 16,
        name: 'AWP Flama',
        displayName: 'AWP',
        skin: 'Flama',
        type: WEAPON_TYPES.SNIPER,
        rarity: RARITIES.LEGENDARIO,
        price: 1000,
           pasiva: { tipo: 'suerte', valor: 15, stackeable: false },
           image: '/arma/AWP Flama.png',
           description: 'AWP legendaria con diseño de flamas.'
    },
    {
        id: 2,
        name: 'Galil ACE Arena',
        displayName: 'Galil ACE',
        skin: 'Arena',
        type: WEAPON_TYPES.RIFLE,
        rarity: RARITIES.COMUN,
        price: 2.5,
        pasiva: { tipo: 'dinero_por_segundo', valor: 0.008, stackeable: true },
        image: '/arma/galil ace arena.png',
        description: 'Rifle Galil ACE con camuflaje de arena.'
    },
    {
        id: 3,
        name: 'Glock-17 Cereza',
        displayName: 'Glock-17',
        skin: 'Cereza',
        type: WEAPON_TYPES.PISTOLA,
        rarity: RARITIES.POCO_COMUN,
        price: 6,
        pasiva: { tipo: 'mayor_costo_armas', valor: 0.02, stackeable: true },
        image: '/arma/glock 17 cereza.png',
        description: 'Glock con un elegante diseño de cerezas rojas sobre fondo oscuro.'
    },
    {
        id: 4,
        name: 'MP5 Militar',
        displayName: 'MP5',
        skin: 'Militar',
        type: WEAPON_TYPES.SMG,
        rarity: RARITIES.COMUN,
        price: 2.7,
        pasiva: { tipo: 'dinero_por_segundo', valor: 0.008, stackeable: true },
        image: '/arma/mp5 militar.png',
        description: 'Subfusil con camuflaje militar táctico profesional.'
    },
    {
        id: 5,
        name: 'Remington 870 Celeste',
        displayName: 'Remington 870',
        skin: 'Celeste',
        type: WEAPON_TYPES.ESCOPETA,
        rarity: RARITIES.COMUN,
        price: 1.8,
        pasiva: { tipo: 'dinero_por_segundo', valor: 0.008, stackeable: true },
        image: '/arma/Remington 870 celeste.png',
        description: 'Escopeta con acabado celeste brillante y detalles cromados.'
    },
    {
        id: 6,
        name: 'SSG 08 Cazador Morado',
        displayName: 'SSG 08',
        skin: 'Cazador Morado',
        type: WEAPON_TYPES.SNIPER,
        rarity: RARITIES.EPICO,
        price: 125,
           pasiva: { tipo: 'exp_extra', valor: 0.2, stackeable: false },
           image: '/arma/SSG 08 cazador morado.png',
           description: 'Rifle de francotirador con diseño de cazador y tonos morados únicos.'
    },
    // Armas de la Caja Thunder (ID: 3)
    {
        id: 17,
        name: 'Kimber Micro 9 Arena',
        displayName: 'Kimber Micro 9',
        skin: 'Arena',
        type: WEAPON_TYPES.PISTOLA,
        rarity: RARITIES.COMUN,
        price: 33,
        pasiva: { tipo: 'dinero_por_segundo', valor: 0.03, stackeable: true },
        image: '/arma/kimber micro 9 arena.png',
        description: 'Pistola compacta con acabado arena.'
    },
    {
        id: 18,
        name: 'SCAR-H Negro Arena',
        displayName: 'SCAR-H',
        skin: 'Negro Arena',
        type: WEAPON_TYPES.RIFLE,
        rarity: RARITIES.COMUN,
        price: 35,
        pasiva: { tipo: 'dinero_por_segundo', valor: 0.03, stackeable: true },
        image: '/arma/scar-h negro arena.png',
        description: 'Rifle de asalto con acabado negro arena.'
    },
    {
        id: 19,
        name: 'Famas Madera',
        displayName: 'Famas',
        skin: 'Madera',
        type: WEAPON_TYPES.RIFLE,
        rarity: RARITIES.COMUN,
        price: 40,
        pasiva: { tipo: 'suerte', valor: 1, stackeable: false },
        image: '/arma/famas madera.png',
        description: 'Rifle Famas con acabado en madera.'
    },
    {
        id: 20,
        name: 'Steyr M9-A1 Bosque',
        displayName: 'Steyr M9-A1',
        skin: 'Bosque',
        type: WEAPON_TYPES.PISTOLA,
        rarity: RARITIES.POCO_COMUN,
        price: 115,
        pasiva: { tipo: 'menor_costo_caja', valor: 0.02, stackeable: false },
        image: '/arma/steyr m9-a1 bosque.png',
        description: 'Pistola con camuflaje de bosque.'
    },
    {
        id: 21,
        name: 'Dragunov SVD Solar',
        displayName: 'Dragunov SVD',
        skin: 'Solar',
        type: WEAPON_TYPES.SNIPER,
        rarity: RARITIES.POCO_COMUN,
        price: 100,
        pasiva: { tipo: 'mayor_costo_armas', valor: 0.07, stackeable: true },
        image: '/arma/dragunov svd solar.png',
        description: 'Francotirador con diseño solar.'
    },
    {
        id: 22,
        name: 'Ruger GP100 Calavera',
        displayName: 'Ruger GP100',
        skin: 'Calavera',
        type: WEAPON_TYPES.PISTOLA,
        rarity: RARITIES.POCO_COMUN,
        price: 103,
        pasiva: { tipo: 'dinero_por_segundo', valor: 0.08, stackeable: true },
        image: '/arma/ruger gp100 calavera.png',
        description: 'Revólver con diseño de calavera.'
    },
    {
        id: 23,
        name: 'Winchester 1887 Purpura Dorado',
        displayName: 'Winchester 1887',
        skin: 'Purpura Dorado',
        type: WEAPON_TYPES.ESCOPETA,
        rarity: RARITIES.RARO,
        price: 445,
        pasiva: { tipo: 'dinero_por_segundo', valor: 0.12, stackeable: true },
        image: '/arma/Winchester 1887 purpura dorado.png',
        description: 'Escopeta clásica con acabado púrpura y dorado.'
    },
    {
        id: 24,
        name: 'Mac-11 Tigrado',
        displayName: 'Mac-11',
        skin: 'Tigrado',
        type: WEAPON_TYPES.SMG,
        rarity: RARITIES.RARO,
        price: 450,
        pasiva: { tipo: 'suerte_y_grade', valor: { suerte: 0, gradeBonus: 5 }, stackeable: false },
        image: '/arma/mac-11 tigrado.png',
        description: 'Subametralladora con diseño tigrado.'
    },
    {
        id: 25,
        name: 'P90 Bad Bunny',
        displayName: 'P90',
        skin: 'Bad Bunny',
        type: WEAPON_TYPES.SMG,
        rarity: RARITIES.EPICO,
        price: 880,
        pasiva: { tipo: 'exp_extra', valor: 0.2, stackeable: false },
        image: '/arma/p90 bad bunny.png',
        description: 'P90 edición Bad Bunny.'
    },
    {
        id: 26,
        name: 'KRISS Vector Platinada',
        displayName: 'KRISS Vector',
        skin: 'Platinada',
        type: WEAPON_TYPES.SMG,
        rarity: RARITIES.EPICO,
        price: 420,
        pasiva: { tipo: 'menor_costo_caja', valor: 0.03, stackeable: false },
        image: '/arma/KRISS Vector platinada.png',
        description: 'Subametralladora KRISS Vector con acabado platinado.'
    },
    {
        id: 27,
        name: 'Glock 18 Case Hardened',
        displayName: 'Glock 18',
        skin: 'Case Hardened',
        type: WEAPON_TYPES.PISTOLA,
        rarity: RARITIES.LEGENDARIO,
        price: 2100,
        pasiva: { tipo: 'suerte_y_dinero', valor: { suerte: 2, dineroPorSegundo: 3 }, stackeable: true },
        image: '/arma/glock 18 case hardened.png',
        description: 'Glock 18 con acabado Case Hardened legendario.'
    },
    {
        id: 28,
        name: 'M4A4 Poseidon',
        displayName: 'M4A4',
        skin: 'Poseidon',
        type: WEAPON_TYPES.RIFLE,
        rarity: RARITIES.LEGENDARIO,
        price: 2250,
        pasiva: { tipo: 'exp_extra', valor: 0.35, stackeable: true },
        image: '/arma/m4a4 poseidon.png',
        description: 'M4A4 con el legendario skin Poseidon.'
    },
    {
        id: 29,
        name: 'Cuchillo A2 Militar',
        displayName: 'Cuchillo A2',
        skin: 'Militar',
        type: WEAPON_TYPES.CUCHILLO,
        rarity: RARITIES.MITICO,
        price: 12000,
        pasiva: { tipo: 'exp_extra', valor: 2.0, stackeable: false },
        image: '/arma/cuchillo a2 militar.png',
        description: 'Cuchillo táctico A2 de grado mítico.'
    },
    {
        id: 30,
        name: 'Cuchillo A2 Zafiro',
        displayName: 'Cuchillo A2',
        skin: 'Zafiro',
        type: WEAPON_TYPES.CUCHILLO,
        rarity: RARITIES.MITICO,
        price: 18500,
        pasiva: { tipo: 'suerte_y_grade', valor: { suerte: 12, gradeBonus: 25 }, stackeable: false },
        image: '/arma/cuchillo a2 zafiro.png',
        description: 'Cuchillo A2 con acabado de zafiro mítico.'
    },
    {
        id: 31,
        name: 'Cuchillo A2 Ruby',
        displayName: 'Cuchillo A2',
        skin: 'Ruby',
        type: WEAPON_TYPES.CUCHILLO,
        rarity: RARITIES.MITICO,
        price: 18500,
        pasiva: { tipo: 'dinero_compuesto', valor: { dineroPorSegundo: 25, porcentajeExtra: 0.15 }, stackeable: false },
        image: '/arma/cuchillo a2 ruby.png',
        description: 'Cuchillo A2 con acabado de rubí mítico.'
    },
    {
        id: 32,
        name: 'Borde Thunder',
        displayName: 'Borde Thunder',
        skin: '',
        type: 'Borde',
        rarity: RARITIES.ANCESTRAL,
        price: 500,
        pasiva: { tipo: 'borde_thunder', valor: { suerte: 15, exp_extra: 0.25 }, stackeable: false },
        image: '/arma/borde trueno.png',
        description: '⚡ Desbloquea el borde Thunder para tu perfil. Otorga +15 de suerte y +25% de experiencia permanentemente.',
        isBorderItem: true,
        borderUnlockId: 'lightning'
    },
    // === CAJA 4 - NUEVA ===
    {
        id: 33,
        name: 'Galil ACE Militar',
        displayName: 'Galil ACE',
        skin: 'Militar',
        type: WEAPON_TYPES.AR,
        rarity: RARITIES.COMUN,
        price: 65,
        pasiva: { tipo: 'dinero_por_segundo', valor: 0.15, stackeable: true },
        image: '/arma/galil ace militar.png',
        description: 'Galil ACE con acabado militar común.'
    },
    {
        id: 34,
        name: 'AWP Cielo',
        displayName: 'AWP',
        skin: 'Cielo',
        type: WEAPON_TYPES.SNIPER,
        rarity: RARITIES.COMUN,
        price: 65,
        pasiva: { tipo: 'dinero_por_segundo', valor: 0.15, stackeable: true },
        image: '/arma/awp cielo.png',
        description: 'AWP con skin Cielo.'
    },
    {
        id: 35,
        name: 'P90 Verde',
        displayName: 'P90',
        skin: 'Verde',
        type: WEAPON_TYPES.SMG,
        rarity: RARITIES.COMUN,
        price: 78,
        pasiva: { tipo: 'menor_costo_caja', valor: 1, stackeable: false },
        image: '/arma/p90 lima.png',
        description: 'P90 con acabado verde común.'
    },
    {
        id: 36,
        name: 'Neveg Manzana',
        displayName: 'Neveg',
        skin: 'Manzana',
        type: WEAPON_TYPES.LMG,
        rarity: RARITIES.POCO_COMUN,
        price: 190,
        pasiva: { tipo: 'dinero_por_segundo', valor: 0.33, stackeable: true },
        image: '/arma/neveg manzana.png',
        description: 'Neveg con skin Manzana poco común.'
    },
    {
        id: 37,
        name: 'Glock-17 Brisa',
        displayName: 'Glock-17',
        skin: 'Brisa',
        type: WEAPON_TYPES.PISTOLA,
        rarity: RARITIES.POCO_COMUN,
        price: 205,
        pasiva: { tipo: 'mayor_exp_caja', valor: 2, stackeable: true },
        image: '/arma/glock 17 brisa.png',
        description: 'Glock-17 con acabado Brisa poco común.'
    },
    {
        id: 38,
        name: 'Desert Deagle Cesped',
        displayName: 'Desert Deagle',
        skin: 'Cesped',
        type: WEAPON_TYPES.PISTOLA,
        rarity: RARITIES.POCO_COMUN,
        price: 215,
        pasiva: { tipo: 'mayor_probabilidad_grado', valor: 3, stackeable: false },
        image: '/arma/Desert Deagle cesped.png',
        description: 'Desert Eagle con acabado Cesped poco común.'
    },
    {
        id: 39,
        name: 'Dragunov SVD Dia Nublado',
        displayName: 'Dragunov SVD',
        skin: 'Dia Nublado',
        type: WEAPON_TYPES.SNIPER,
        rarity: RARITIES.RARO,
        price: 1200,
        pasiva: { tipo: 'suerte', valor: 1, stackeable: true },
        image: '/arma/Dragunov SDV dia nublado.png',
        description: 'Dragunov SVD con acabado Dia Nublado raro.'
    },
    {
        id: 40,
        name: 'Kimber Micro 9 Dulces',
        displayName: 'Kimber Micro 9',
        skin: 'Dulces',
        type: WEAPON_TYPES.PISTOLA,
        rarity: RARITIES.RARO,
        price: 1350,
        pasiva: { tipo: 'mayor_costo_armas', valor: 4.5, stackeable: true },
        image: '/arma/kimber micro 9 dulces.png',
        description: 'Kimber Micro 9 con acabado Dulces raro.'
    },
    {
        id: 41,
        name: 'MP5 Red Line',
        displayName: 'MP5',
        skin: 'Red Line',
        type: WEAPON_TYPES.SMG,
        rarity: RARITIES.RARO,
        price: 1450,
        pasiva: { tipo: 'dinero_por_segundo', valor: 1, stackeable: false },
        image: '/arma/mp5 red line.png',
        description: 'MP5 con skin Red Line rara.'
    },
    {
        id: 42,
        name: 'Beretta 1301 Iceberg',
        displayName: 'Beretta 1301',
        skin: 'Iceberg',
        type: WEAPON_TYPES.ESCOPETA,
        rarity: RARITIES.EPICO,
        price: 3800,
        pasiva: { tipo: 'dinero_exp_compuesto', valor: { dineroPorSegundo: 0.45, exp_extra: 3 }, stackeable: true },
        image: '/arma/beretta 1301 iceberg.png',
        description: 'Beretta 1301 con acabado Iceberg épico.'
    },
    {
        id: 43,
        name: 'SSG 08 Alien X',
        displayName: 'SSG 08',
        skin: 'Alien X',
        type: WEAPON_TYPES.SNIPER,
        rarity: RARITIES.EPICO,
        price: 4000,
        pasiva: { tipo: 'suerte', valor: 9, stackeable: false },
        image: '/arma/ssg 08 alien X.png',
        description: 'SSG 08 con skin Alien X épica.'
    },
    {
        id: 44,
        name: 'M16A4 Anime',
        displayName: 'M16A4',
        skin: 'Anime',
        type: WEAPON_TYPES.AR,
        rarity: RARITIES.LEGENDARIO,
        price: 12000,
        pasiva: { tipo: 'triple_pasiva', valor: { suerte: 10, mayor_probabilidad_grado: 10, exp_extra: 5 }, stackeable: true },
        image: '/arma/m16a4 anime.png',
        description: 'M16A4 con skin Anime legendaria.'
    },
    {
        id: 45,
        name: 'Ruger GP100 Oro',
        displayName: 'Ruger GP100',
        skin: 'Oro',
        type: WEAPON_TYPES.PISTOLA,
        rarity: RARITIES.LEGENDARIO,
        price: 9500,
        pasiva: { tipo: 'dinero_por_segundo_porcentaje', valor: 10, stackeable: true },
        image: '/arma/ruger gp 100 oro.png',
        description: 'Ruger GP100 con acabado de Oro legendario.'
    },
    {
        id: 46,
        name: 'Cuchillo Bowie Fade',
        displayName: 'Cuchillo Bowie',
        skin: 'Fade',
        type: WEAPON_TYPES.CUCHILLO,
        rarity: RARITIES.MITICO,
        price: 38500,
        pasiva: { tipo: 'mayor_exp_caja', valor: 250, stackeable: false },
        image: '/arma/cuchillo bowie fade.png',
        description: 'Cuchillo Bowie con acabado Fade mítico.'
    },
    {
        id: 47,
        name: 'Cuchillo Bowie Case Hardened',
        displayName: 'Cuchillo Bowie',
        skin: 'Case Hardened',
        type: WEAPON_TYPES.CUCHILLO,
        rarity: RARITIES.MITICO,
        price: 38500,
        pasiva: { tipo: 'suerte', valor: 35, stackeable: true },
        image: '/arma/cuchillo bowie case hardened.png',
        description: 'Cuchillo Bowie con acabado Case Hardened mítico.'
    },
    {
        id: 48,
        name: 'Cuchillo Bowie Original',
        displayName: 'Cuchillo Bowie',
        skin: 'Original',
        type: WEAPON_TYPES.CUCHILLO,
        rarity: RARITIES.MITICO,
        price: 38500,
        pasiva: { tipo: 'dinero_por_segundo', valor: 100, stackeable: true },
        image: '/arma/cuchillo bowie original.png',
        description: 'Cuchillo Bowie con acabado Original mítico.'
    }
];

// Configuración de cajas con probabilidades personalizadas
const BOX_CONFIGURATIONS = {
    // Caja Gratuita (ID: 1)
    1: {
        name: "OPENER GUNS",
        weaponProbabilities: {
            // ID del arma: PESO relativo (se normalizará automáticamente)
            1: 5,    // Beretta 92FS Manzana (RARO) - PESO: 5
            2: 35,   // Galil ACE Arena (COMÚN) - PESO: 35
            3: 12,   // Glock-17 Cereza (POCO COMÚN) - PESO: 12
            4: 35,   // MP5 Militar (COMÚN) - PESO: 35
            5: 35,   // Remington 870 Celeste (COMÚN) - PESO: 35
            6: 0.1   // SSG 08 Cazador Morado (ÉPICO) - PESO: 0.1
            // Total de pesos: 122.1 (se normalizará a 100%)
        }
    },
    // Nueva caja (ID: 2)
    2: {
        name: "Caja somp",
        image: "/cajas/2.png",
        price: 65,
        exp: 25,
        weaponProbabilities: {
            7: 42, // Beretta 1301 Arena (común) - PESO: 42
            8: 42, // Sig Sauer P226 Limon (común) - PESO: 42
            9: 42, // Famas Militar (común) - PESO: 42
            10: 10, // Glock 26 Navideña (poco común) - PESO: 10
            11: 10, // G3SG1 Milicia (poco común) - PESO: 10
            12: 3, // AR-10 Esmeralda (raro) - PESO: 3
            13: 2, // M16A4 Noche Lunar (raro) - PESO: 2
            14: 1.5, // Desert Eagle Sonriente (épico) - PESO: 1.5
            15: 1.3, // AK 47 Fuego Artificial (épico) - PESO: 1.3
            16: 0.5 // AWP Flama (legendaria) - PESO: 0.5
        }
    },
    // Caja Thunder (ID: 3)
    3: {
        name: "Caja Thunder",
        image: "/cajas/3.png",
        price: 350,
        exp: 50,
        weaponProbabilities: {
            17: 35, // Kimber Micro 9 Arena (común) - PESO: 35
            18: 35, // SCAR-H Negro Arena (común) - PESO: 35
            19: 35, // Famas Madera (común) - PESO: 35
            20: 12, // Steyr M9-A1 Bosque (poco común) - PESO: 12
            21: 12, // Dragunov SVD Solar (poco común) - PESO: 12
            22: 12, // Ruger GP100 Calavera (poco común) - PESO: 12
            23: 5, // Winchester 1887 Purpura Dorado (raro) - PESO: 5
            24: 5, // Mac-11 Tigrado (raro) - PESO: 5
            25: 2, // P90 Bad Bunny (épico) - PESO: 2
            26: 2, // KRISS Vector (épico) - PESO: 2
            27: 0.6, // Glock 18 Case Hardened (legendario) - PESO: 0.6
            28: 0.6, // M4A4 Poseidon (legendario) - PESO: 0.6
            29: 0.12, // Cuchillo A2 Militar (mítico) - PESO: 0.12
            30: 0.05, // Cuchillo A2 Zafiro (mítico) - PESO: 0.05
            31: 0.05, // Cuchillo A2 Ruby (mítico) - PESO: 0.05
            32: 0.03 // Borde Thunder (ancestral) - PESO: 0.005
        }
    },
    // Caja 4 - Nueva
    4: {
        name: "Caja Elite",
        image: "/cajas/4.png",
        price: 1050,
        exp: 75,
        weaponProbabilities: {
            33: 37, // Galil ACE Militar (común) - PESO: 37
            34: 37, // AWP Cielo (común) - PESO: 37
            35: 37, // P90 Verde (común) - PESO: 37
            36: 12, // Neveg Manzana (poco común) - PESO: 12
            37: 12, // Glock-17 Brisa (poco común) - PESO: 12
            38: 12, // Desert Deagle Cesped (poco común) - PESO: 12
            39: 5, // Dragunov SVD Dia Nublado (raro) - PESO: 5
            40: 5, // Kimber Micro 9 Dulces (raro) - PESO: 5
            41: 5, // MP5 Red Line (raro) - PESO: 5
            42: 1, // Beretta 1301 Iceberg (épico) - PESO: 2
            43: 1, // SSG 08 Alien X (épico) - PESO: 2
            44: 0.4, // M16A4 Anime (legendaria) - PESO: 0.4
            45: 0.4, // Ruger GP100 Oro (legendaria) - PESO: 0.4
            46: 0.04, // Cuchillo Bowie Fade (mítico) - PESO: 0.04
            47: 0.04, // Cuchillo Bowie Case Hardened (mítico) - PESO: 0.04
            48: 0.055 // Cuchillo Bowie Original (mítico) - PESO: 0.055
        }
    }
};

// Función para obtener todas las armas
function getAllWeapons() {
    return WEAPONS_DATABASE;
}

// Función para obtener armas por rareza
function getWeaponsByRarity(rarity) {
    return WEAPONS_DATABASE.filter(weapon => weapon.rarity === rarity);
}

// Función para obtener armas por tipo
function getWeaponsByType(type) {
    return WEAPONS_DATABASE.filter(weapon => weapon.type === type);
}

// Función para obtener un arma por ID
function getWeaponById(id) {
    return WEAPONS_DATABASE.find(weapon => weapon.id === id);
}

// Función para obtener armas disponibles en una caja específica
function getWeaponsForBox(boxId) {
    if (boxId === 1) {
        return WEAPONS_DATABASE.filter(w => w.id >= 1 && w.id <= 6);
    }
    if (boxId === 2) {
        // IDs de armas para la caja 2
        return WEAPONS_DATABASE.filter(w => [7,8,9,10,11,12,13,14,15,16].includes(w.id));
    }
    if (boxId === 3) {
        // IDs de armas para la caja Thunder (3)
        return WEAPONS_DATABASE.filter(w => [17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32].includes(w.id));
    }
    if (boxId === 4) {
        // IDs de armas para la caja 4
        return WEAPONS_DATABASE.filter(w => [33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48].includes(w.id));
    }
    return [];
}

// Función para generar loot basado en las probabilidades configuradas
// generateRandomLoot now accepts an optional `luck` parameter (integer).
// generateRandomLoot now accepts an optional `gradeBonusValue` parameter (integer).
// `luck` increases probabilities for EPICO+ items with diminishing returns.
// `gradeBonusValue` increases probability of M grade directly.
function generateRandomLoot(boxId, luck = 0, gradeBonusValue = 0) {
    const boxConfig = BOX_CONFIGURATIONS[boxId];
    if (!boxConfig) return null;

    const availableWeapons = getWeaponsForBox(boxId);
    if (availableWeapons.length === 0) return null;

    // Usar las probabilidades configuradas para esta caja (son PESOS, no probabilidades estrictas)
    const weights = Object.assign({}, boxConfig.weaponProbabilities);
    
    // Normalizar los pesos a probabilidades reales (sumar 1.0)
    let totalWeight = 0;
    for (const wid in weights) {
        totalWeight += weights[wid];
    }
    
    const probabilities = {};
    for (const wid in weights) {
        probabilities[wid] = weights[wid] / totalWeight;
    }

    // Aplicar efecto de suerte (solo a armas ÉPICO o superior)
    // Fórmula con rendimientos decrecientes: los primeros puntos dan más bonus
    // 1 suerte ≈ +9.5%, 10 suerte ≈ +16.7%, 20 suerte ≈ +20%, 50 suerte ≈ +23.8%
    const luckBonus = luck / (1 + luck * 0.05);
    const luckMultiplier = 1 + (luckBonus * 0.01);

    if (luck > 0 && luckMultiplier > 1) {
        // Identificar armas épicas o superiores
        const epicWeapons = [];
        for (const wid in probabilities) {
            const w = WEAPONS_DATABASE.find(x => x.id == wid);
            if (w && (w.rarity === RARITIES.EPICO || w.rarity === RARITIES.LEGENDARIO || w.rarity === RARITIES.MITICO)) {
                epicWeapons.push(wid);
            }
        }
        
        // Aplicar multiplicador a armas épicas+
        for (const wid of epicWeapons) {
            probabilities[wid] = probabilities[wid] * luckMultiplier;
        }
        
        // Normalizar para que la suma total sea 1.0
        const newTotal = Object.values(probabilities).reduce((sum, prob) => sum + prob, 0);
        if (newTotal > 0) {
            for (const wid in probabilities) {
                probabilities[wid] = probabilities[wid] / newTotal;
            }
        }
    }
    const random = Math.random();
    let cumulativeProbability = 0;

    for (const weaponId in probabilities) {
        cumulativeProbability += probabilities[weaponId];
        if (random <= cumulativeProbability) {
            const weapon = WEAPONS_DATABASE.find(w => w.id == weaponId);
            if (weapon) {
                // Los bordes no tienen calidad ni pueden ser Conta
                const isBorder = weapon.isBorderItem === true;
                const quality = isBorder ? null : getRandomQuality(gradeBonusValue);
                const isConta = isBorder ? false : (Math.random() < 0.10);
                const contaMultiplier = isConta ? 1.80 : 1.0;
                                // --- Lógica de pasivas ---
                                let pasiva = weapon.pasiva || null;
                                // Solo asignar manualmente para comunes, poco comunes y raras si no tienen pasiva en la base
                                if (!pasiva) {
                                    if (weapon.rarity === RARITIES.COMUN) {
                                        if (boxId === 1) {
                                            pasiva = { tipo: 'dinero_por_segundo', valor: 0.01, stackeable: true };
                                        } else if (boxId === 2) {
                                            pasiva = { tipo: 'dinero_por_segundo', valor: 0.07, stackeable: true };
                                        } else if (boxId === 3) {
                                            pasiva = { tipo: 'dinero_por_segundo', valor: 0.08, stackeable: true };
                                        }
                                    }
                                    if (weapon.rarity === RARITIES.POCO_COMUN) {
                                        pasiva = { tipo: 'mayor_costo_armas', valor: 0.002, stackeable: true };
                                    }
                                    if (weapon.rarity === RARITIES.RARO) {
                                        if (boxId === 1) {
                                            pasiva = { tipo: 'menor_costo_caja', valor: 0.5, stackeable: false };
                                        } else if (boxId === 2) {
                                            pasiva = { tipo: 'dinero_por_segundo', valor: 0.1, stackeable: true };
                                        } else if (boxId === 3) {
                                            pasiva = { tipo: 'dinero_por_segundo', valor: 1, stackeable: true };
                                        }
                                    }
                                }
                                
                                // Aplicar multiplicador de grado y conta a la pasiva (solo si no es un borde)
                                let pasivaConMultiplicador = pasiva;
                                let finalPrice = weapon.price;
                                
                                if (!isBorder) {
                                    const gradeMultiplier = PASSIVE_GRADE_MULTIPLIERS[quality.letter] || 1.0;
                                    pasivaConMultiplicador = applyGradeMultiplierToPassive(pasiva, gradeMultiplier, isConta);
                                    finalPrice = Math.round(weapon.price * quality.priceMultiplier * contaMultiplier);
                                } else {
                                    // Los bordes usan su precio base sin multiplicadores
                                    finalPrice = weapon.price;
                                }
                                
                                const finalWeapon = {
                                    ...weapon,
                                    quality: quality,
                                    isConta: isConta,
                                    finalPrice: finalPrice,
                                    pasiva: pasivaConMultiplicador
                                };
                                return finalWeapon;
            }
            return availableWeapons[0];
        }
    }
    // Fallback si algo sale mal (con calidad E por defecto)
    const fallbackWeapon = availableWeapons[0];
    const quality = QUALITY_GRADES.E;
    const isConta = Math.random() < 0.10;
    const contaMultiplier = isConta ? 1.80 : 1.0;
        let pasiva = null;
        if (fallbackWeapon) {
            if (fallbackWeapon.rarity === RARITIES.COMUN) {
                if (boxId === 1) {
                    pasiva = { tipo: 'dinero_por_segundo', valor: 0.01, stackeable: true };
                } else if (boxId === 2) {
                    pasiva = { tipo: 'dinero_por_segundo', valor: 0.07, stackeable: true };
                } else if (boxId === 3) {
                    pasiva = { tipo: 'dinero_por_segundo', valor: 0.08, stackeable: true };
                }
            }
            if (fallbackWeapon.rarity === RARITIES.POCO_COMUN) {
                pasiva = { tipo: 'mayor_costo_armas', valor: 0.002, stackeable: true };
            }
            if (fallbackWeapon.rarity === RARITIES.RARO) {
                if (boxId === 1) {
                    pasiva = { tipo: 'menor_costo_caja', valor: 0.5, stackeable: false };
                } else if (boxId === 2) {
                    pasiva = { tipo: 'dinero_por_segundo', valor: 0.1, stackeable: true };
                } else if (boxId === 3) {
                    pasiva = { tipo: 'dinero_por_segundo', valor: 1, stackeable: true };
                }
            }
        }
        
        // Aplicar multiplicador de grado y conta a la pasiva (E = 1.0, sin cambio en fallback)
        const gradeMultiplier = PASSIVE_GRADE_MULTIPLIERS[quality.letter] || 1.0;
        const pasivaConMultiplicador = applyGradeMultiplierToPassive(pasiva, gradeMultiplier, isConta);
        
        return {
                ...fallbackWeapon,
                quality: quality,
                isConta: isConta,
                finalPrice: Math.round(fallbackWeapon.price * quality.priceMultiplier * contaMultiplier),
                pasiva: pasivaConMultiplicador
        };
}

// Función para simular items de la ruleta
function generateRouletteItems(boxId, count = 50) {
    const items = [];
    
    // Generar cada item usando el sistema de probabilidades real
    for (let i = 0; i < count; i++) {
        // Usar la función generateRandomLoot que respeta las probabilidades
        const lootedWeapon = generateRandomLoot(boxId);
        
        // Crear un ID único para la ruleta
        items.push({
            ...lootedWeapon,
            originalId: lootedWeapon.id, // Guardar el ID original del arma
            id: `roulette_${i}_${lootedWeapon.id}` // ID único para la ruleta
        });
    }
    
    return items;
}

// Función para obtener la configuración de una caja específica
function getBoxConfiguration(boxId) {
    return BOX_CONFIGURATIONS[boxId] || null;
}

// Función para obtener las probabilidades de una caja
function getBoxProbabilities(boxId) {
    const config = BOX_CONFIGURATIONS[boxId];
    return config ? config.weaponProbabilities : null;
}

// Función para calcular probabilidades ajustadas por suerte para mostrar en UI
function getAdjustedProbabilities(boxId, luck = 0) {
    const boxConfig = BOX_CONFIGURATIONS[boxId];
    if (!boxConfig) return null;

    // Copiar las probabilidades originales (pesos)
    const weights = Object.assign({}, boxConfig.weaponProbabilities);
    
    // Normalizar los pesos a probabilidades reales (sumar 1.0)
    let totalWeight = 0;
    for (const wid in weights) {
        totalWeight += weights[wid];
    }
    
    const probabilities = {};
    for (const wid in weights) {
        probabilities[wid] = weights[wid] / totalWeight;
    }

    // Aplicar efecto de suerte (solo a armas ÉPICO o superior)
    // Fórmula con rendimientos decrecientes: los primeros puntos dan más bonus
    // 1 suerte ≈ +9.5%, 10 suerte ≈ +16.7%, 20 suerte ≈ +20%, 50 suerte ≈ +23.8%
    const luckBonus = luck / (1 + luck * 0.05);
    const luckMultiplier = 1 + (luckBonus * 0.01);

    if (luck > 0 && luckMultiplier > 1) {
        // Identificar armas épicas o superiores
        const epicWeapons = [];
        for (const wid in probabilities) {
            const w = WEAPONS_DATABASE.find(x => x.id == wid);
            if (w && (w.rarity === RARITIES.EPICO || w.rarity === RARITIES.LEGENDARIO || w.rarity === RARITIES.MITICO)) {
                epicWeapons.push(wid);
            }
        }
        
        // Aplicar multiplicador a armas épicas+
        for (const wid of epicWeapons) {
            probabilities[wid] = probabilities[wid] * luckMultiplier;
        }
        
        // Normalizar para que la suma total sea 1.0
        const newTotal = Object.values(probabilities).reduce((sum, prob) => sum + prob, 0);
        if (newTotal > 0) {
            for (const wid in probabilities) {
                probabilities[wid] = probabilities[wid] / newTotal;
            }
        }
    }

    // Convertir a porcentajes
    const percentages = {};
    for (const wid in probabilities) {
        percentages[wid] = (probabilities[wid] * 100).toFixed(2);
    }

    return percentages;
}

// Función centralizada para obtener información de pasivas
// Genera automáticamente el nombre y descripción de cualquier pasiva
// Parámetros:
//   - pasiva: objeto con tipo, valor, stackeable, isConta
//   - gradeMultiplier: multiplicador del grado (opcional, por defecto 1.0)
//   - showGradeInfo: si es true, muestra el rango de valores por grado (opcional)
//   - isConta: si es true, aplica el multiplicador de conta adicional (opcional)
function getPassiveInfo(pasiva, gradeMultiplier = 1.0, showGradeInfo = false, isConta = false) {
    const t = (key) => window.i18n ? window.i18n.t(key) : key;
    
    if (!pasiva || !pasiva.tipo) {
        return {
            name: t('dex_no_passive'),
            description: t('dex_no_passive_desc'),
            icon: '🔮'
        };
    }

    let name = t('passive_unknown');
    let description = t('passive_unknown_desc');
    let icon = '🔮';
    
    // Obtener valor base (sin multiplicador de grado ni conta)
    const valorBase = pasiva.valorBase || pasiva.valor;
    // Aplicar multiplicador de grado y conta si se proporciona
    const contaMultiplier = isConta ? CONTA_PASSIVE_MULTIPLIER : 1.0;
    const valorAjustado = valorBase * gradeMultiplier * contaMultiplier;

    switch (pasiva.tipo) {
        case 'exp_extra':
            icon = '⭐';
            name = t('passive_extra_exp');
            const expPercent = valorAjustado ? (valorAjustado * 100).toFixed(1) : '0.0';
            description = t('passive_exp_extra_desc').replace('{value}', expPercent) + (pasiva.stackeable ? ` (${t('dex_stackable')})` : ` (${t('dex_not_stackable')})`);
            if (isConta) {
                description += ` ✨ (${t('weapon_conta')} +30%)`;
            }
            if (showGradeInfo) {
                description += `\n\n${t('passive_grade_range')}: ${(valorBase * 100).toFixed(1)}% (E) - ${(valorBase * 5.0 * 100).toFixed(1)}% (M)`;
                if (isConta) {
                    description += `\n${t('weapon_conta')}: ${(valorBase * 1.3 * 100).toFixed(1)}% (E) - ${(valorBase * 5.0 * 1.3 * 100).toFixed(1)}% (M)`;
                }
            }
            break;
        
        case 'suerte':
            icon = '🍀';
            name = t('passive_luck');
            description = t('passive_luck_improved_desc').replace('{value}', Math.round(valorAjustado));
            if (isConta) {
                description += ` ✨ (${t('weapon_conta')} +30%)`;
            }
            if (showGradeInfo) {
                description += `\n\n${t('passive_grade_range')}: +${Math.round(valorBase)} (E) - +${Math.round(valorBase * 5.0)} (M)`;
                if (isConta) {
                    description += `\n${t('weapon_conta')}: +${Math.round(valorBase * 1.3)} (E) - +${Math.round(valorBase * 5.0 * 1.3)} (M)`;
                }
            }
            break;
        
        case 'dinero_por_segundo':
            icon = '💰';
            name = t('passive_income');
            description = t('passive_money_per_second_desc').replace('{value}', valorAjustado.toFixed(2));
            if (isConta) {
                description += ` ✨ (${t('weapon_conta')} +30%)`;
            }
            if (showGradeInfo) {
                description += `\n\n${t('passive_grade_range')}: $${valorBase.toFixed(2)} (E) - $${(valorBase * 5.0).toFixed(2)} (M)`;
                if (isConta) {
                    description += `\n${t('weapon_conta')}: $${(valorBase * 1.3).toFixed(2)} (E) - $${(valorBase * 5.0 * 1.3).toFixed(2)} (M)`;
                }
            }
            break;
        
        case 'mayor_costo_armas':
            icon = '📈';
            name = t('passive_sell_value');
            description = t('passive_weapon_cost_desc').replace('{value}', (valorAjustado * 100).toFixed(1)) + ` (${t('dex_stackable')})`;
            if (isConta) {
                description += ` ✨ (${t('weapon_conta')} +30%)`;
            }
            if (showGradeInfo) {
                description += `\n\n${t('passive_grade_range')}: ${(valorBase * 100).toFixed(1)}% (E) - ${(valorBase * 5.0 * 100).toFixed(1)}% (M)`;
                if (isConta) {
                    description += `\n${t('weapon_conta')}: ${(valorBase * 1.3 * 100).toFixed(1)}% (E) - ${(valorBase * 5.0 * 1.3 * 100).toFixed(1)}% (M)`;
                }
            }
            break;
        
        case 'menor_costo_caja':
            icon = '💸';
            name = t('passive_box_discount');
            description = t('passive_box_cost_desc').replace('{value}', (valorAjustado * 100).toFixed(1)) + ` (${t('dex_not_stackable')})`;
            if (isConta) {
                description += ` ✨ (${t('weapon_conta')} +30%)`;
            }
            if (showGradeInfo) {
                description += `\n\n${t('passive_grade_range')}: ${(valorBase * 100).toFixed(1)}% (E) - ${(valorBase * 5.0 * 100).toFixed(1)}% (M)`;
                if (isConta) {
                    description += `\n${t('weapon_conta')}: ${(valorBase * 1.3 * 100).toFixed(1)}% (E) - ${(valorBase * 5.0 * 1.3 * 100).toFixed(1)}% (M)`;
                }
            }
            break;
        
        case 'multiplicador_dinero':
            icon = '💎';
            name = 'Multiplicador de Dinero';
            description = `Multiplica el dinero ganado por ${valorAjustado.toFixed(2)}x.`;
            if (isConta) {
                description += ` ✨ (Conta +30%)`;
            }
            if (showGradeInfo) {
                description += `\n\nRango por grado: ${valorBase.toFixed(2)}x (E) - ${(valorBase * 5.0).toFixed(2)}x (M)`;
                if (isConta) {
                    description += `\nConta: ${(valorBase * 1.3).toFixed(2)}x (E) - ${(valorBase * 5.0 * 1.3).toFixed(2)}x (M)`;
                }
            }
            break;
        
        case 'multiplicador_experiencia':
            icon = '⭐';
            name = 'Multiplicador de Experiencia';
            description = `Multiplica la experiencia ganada por ${valorAjustado.toFixed(2)}x.`;
            if (isConta) {
                description += ` ✨ (Conta +30%)`;
            }
            if (showGradeInfo) {
                description += `\n\nRango por grado: ${valorBase.toFixed(2)}x (E) - ${(valorBase * 5.0).toFixed(2)}x (M)`;
                if (isConta) {
                    description += `\nConta: ${(valorBase * 1.3).toFixed(2)}x (E) - ${(valorBase * 5.0 * 1.3).toFixed(2)}x (M)`;
                }
            }
            break;
        
        case 'reduccion_precio':
            icon = '🏷️';
            name = 'Reducción de Precio';
            description = `Reduce el precio de las cajas en un ${(valorAjustado * 100).toFixed(1)}%.`;
            if (isConta) {
                description += ` ✨ (Conta +30%)`;
            }
            if (showGradeInfo) {
                description += `\n\nRango por grado: ${(valorBase * 100).toFixed(1)}% (E) - ${(valorBase * 5.0 * 100).toFixed(1)}% (M)`;
                if (isConta) {
                    description += `\nConta: ${(valorBase * 1.3 * 100).toFixed(1)}% (E) - ${(valorBase * 5.0 * 1.3 * 100).toFixed(1)}% (M)`;
                }
            }
            break;
        
        case 'aumento_calidad':
            // DEPRECATED: aumento_calidad ya no se usa, se convirtió a suerte_y_grade
            // Mantener por compatibilidad con armas antiguas en inventario
            icon = '✨';
            name = 'Mejora de Grado';
            description = `Otorga +${Math.round(valorAjustado)} al bono de grado Masterpiece.`;
            if (isConta) {
                description += ` ✨ (Conta +30%)`;
            }
            if (showGradeInfo) {
                description += `\n\nRango por grado: +${Math.round(valorBase)} grade (E) - +${Math.round(valorBase * 5.0)} grade (M)`;
                if (isConta) {
                    description += `\nConta: +${Math.round(valorBase * 1.3)} grade (E) - +${Math.round(valorBase * 5.0 * 1.3)} grade (M)`;
                }
            }
            break;
        
        case 'doble_apertura':
            icon = '🎁';
            name = 'Doble Apertura';
            description = `Tiene un ${(valorAjustado * 100).toFixed(1)}% de probabilidad de abrir dos cajas en una sola apertura.`;
            if (isConta) {
                description += ` ✨ (Conta +30%)`;
            }
            if (showGradeInfo) {
                description += `\n\nRango por grado: ${(valorBase * 100).toFixed(1)}% (E) - ${(valorBase * 5.0 * 100).toFixed(1)}% (M)`;
                if (isConta) {
                    description += `\nConta: ${(valorBase * 1.3 * 100).toFixed(1)}% (E) - ${(valorBase * 5.0 * 1.3 * 100).toFixed(1)}% (M)`;
                }
            }
            break;
        
        case 'suerte_y_grade':
            icon = '✨';
            if (pasiva.valor && typeof pasiva.valor === 'object') {
                const suerteBase = pasiva.valorBase?.suerte || pasiva.valor.suerte || 0;
                const gradeBonusBase = pasiva.valorBase?.gradeBonus || pasiva.valor.gradeBonus || 0;
                const suerteAjustada = Math.round(suerteBase * gradeMultiplier * contaMultiplier);
                const gradeBonusAjustado = Math.round(gradeBonusBase * gradeMultiplier * contaMultiplier);
                
                // Determinar el nombre y descripción según qué valores tiene
                if (suerteAjustada > 0 && gradeBonusAjustado > 0) {
                    name = 'Suerte y Calidad';
                    description = `Otorga +${suerteAjustada} de suerte y +${gradeBonusAjustado} al bono de grado Masterpiece.`;
                } else if (suerteAjustada > 0) {
                    name = 'Suerte';
                    description = `Otorga +${suerteAjustada} de suerte.`;
                } else if (gradeBonusAjustado > 0) {
                    name = 'Mejora de Grado';
                    description = `Otorga +${gradeBonusAjustado} al bono de grado Masterpiece.`;
                } else {
                    name = 'Suerte y Calidad';
                    description = 'Sin efecto activo.';
                }
                
                if (isConta) {
                    description += ` ✨ (Conta +30%)`;
                }
                if (showGradeInfo && (suerteBase > 0 || gradeBonusBase > 0)) {
                    let rangeText = '\n\nRango por grado: ';
                    if (suerteBase > 0) rangeText += `+${Math.round(suerteBase)} suerte`;
                    if (suerteBase > 0 && gradeBonusBase > 0) rangeText += ' / ';
                    if (gradeBonusBase > 0) rangeText += `+${Math.round(gradeBonusBase)} grade`;
                    rangeText += ' (E) - ';
                    if (suerteBase > 0) rangeText += `+${Math.round(suerteBase * 5.0)} suerte`;
                    if (suerteBase > 0 && gradeBonusBase > 0) rangeText += ' / ';
                    if (gradeBonusBase > 0) rangeText += `+${Math.round(gradeBonusBase * 5.0)} grade`;
                    rangeText += ' (M)';
                    description += rangeText;
                    
                    if (isConta) {
                        let contaText = '\nConta: ';
                        if (suerteBase > 0) contaText += `+${Math.round(suerteBase * 1.3)} suerte`;
                        if (suerteBase > 0 && gradeBonusBase > 0) contaText += ' / ';
                        if (gradeBonusBase > 0) contaText += `+${Math.round(gradeBonusBase * 1.3)} grade`;
                        contaText += ' (E) - ';
                        if (suerteBase > 0) contaText += `+${Math.round(suerteBase * 5.0 * 1.3)} suerte`;
                        if (suerteBase > 0 && gradeBonusBase > 0) contaText += ' / ';
                        if (gradeBonusBase > 0) contaText += `+${Math.round(gradeBonusBase * 5.0 * 1.3)} grade`;
                        contaText += ' (M)';
                        description += contaText;
                    }
                }
            } else {
                name = 'Suerte y Calidad';
                description = 'Aumenta la suerte y la probabilidad de obtener grado Masterpiece.';
            }
            break;
        
        case 'suerte_y_dinero':
            icon = '🍀💰';
            name = 'Suerte y Dinero';
            if (pasiva.valor && typeof pasiva.valor === 'object') {
                const suerteBase = pasiva.valorBase?.suerte || pasiva.valor.suerte || 0;
                const dineroBase = pasiva.valorBase?.dineroPorSegundo || pasiva.valor.dineroPorSegundo || 0;
                const suerteAjustada = Math.round(suerteBase * gradeMultiplier * contaMultiplier);
                const dineroAjustado = (dineroBase * gradeMultiplier * contaMultiplier).toFixed(2);
                description = `Otorga +${suerteAjustada} de suerte y $${dineroAjustado} por segundo.`;
                if (isConta) {
                    description += ` ✨ (Conta +30%)`;
                }
                if (showGradeInfo) {
                    description += `\n\nRango por grado: +${Math.round(suerteBase)} suerte / $${dineroBase.toFixed(2)}/s (E) - +${Math.round(suerteBase * 5.0)} suerte / $${(dineroBase * 5.0).toFixed(2)}/s (M)`;
                    if (isConta) {
                        description += `\nConta: +${Math.round(suerteBase * 1.3)} suerte / $${(dineroBase * 1.3).toFixed(2)}/s (E) - +${Math.round(suerteBase * 5.0 * 1.3)} suerte / $${(dineroBase * 5.0 * 1.3).toFixed(2)}/s (M)`;
                    }
                }
            } else {
                description = 'Aumenta la suerte y genera dinero por segundo.';
            }
            break;
        
        case 'dinero_compuesto':
            icon = '💎💰';
            name = 'Dinero Compuesto';
            if (pasiva.valor && typeof pasiva.valor === 'object') {
                const dineroBase = pasiva.valorBase?.dineroPorSegundo || pasiva.valor.dineroPorSegundo || 0;
                const porcentajeBase = pasiva.valorBase?.porcentajeExtra || pasiva.valor.porcentajeExtra || 0;
                const dineroAjustado = (dineroBase * gradeMultiplier * contaMultiplier).toFixed(2);
                const porcentajeAjustado = (porcentajeBase * gradeMultiplier * contaMultiplier * 100).toFixed(1);
                description = `Genera $${dineroAjustado} por segundo y aumenta el dinero por segundo en ${porcentajeAjustado}%.`;
                if (isConta) {
                    description += ` ✨ (Conta +30%)`;
                }
                if (showGradeInfo) {
                    description += `\n\nRango por grado: $${dineroBase.toFixed(2)}/s + ${(porcentajeBase * 100).toFixed(1)}% (E) - $${(dineroBase * 5.0).toFixed(2)}/s + ${(porcentajeBase * 5.0 * 100).toFixed(1)}% (M)`;
                    if (isConta) {
                        description += `\nConta: $${(dineroBase * 1.3).toFixed(2)}/s + ${(porcentajeBase * 1.3 * 100).toFixed(1)}% (E) - $${(dineroBase * 5.0 * 1.3).toFixed(2)}/s + ${(porcentajeBase * 5.0 * 1.3 * 100).toFixed(1)}% (M)`;
                    }
                }
            } else {
                description = 'Genera dinero por segundo y aumenta el dinero por segundo total.';
            }
            break;
        
        case 'dinero_exp_compuesto':
            icon = '💰⭐';
            name = 'Dinero y Experiencia';
            if (pasiva.valor && typeof pasiva.valor === 'object') {
                const dineroBase = pasiva.valorBase?.dineroPorSegundo || pasiva.valor.dineroPorSegundo || 0;
                const expBase = pasiva.valorBase?.exp_extra || pasiva.valor.exp_extra || 0;
                const dineroAjustado = (dineroBase * gradeMultiplier * contaMultiplier).toFixed(2);
                const expAjustado = (expBase * gradeMultiplier * contaMultiplier).toFixed(1);
                description = `Genera $${dineroAjustado} por segundo y otorga +${expAjustado}% de experiencia adicional${pasiva.stackeable ? ' (efectos acumulables)' : ' (efectos no acumulables)'}.`;
                if (isConta) {
                    description += ` ✨ (Conta +30%)`;
                }
                if (showGradeInfo) {
                    description += `\n\nRango por grado: $${dineroBase.toFixed(2)}/s + ${expBase.toFixed(1)}% exp (E) - $${(dineroBase * 5.0).toFixed(2)}/s + ${(expBase * 5.0).toFixed(1)}% exp (M)`;
                    if (isConta) {
                        description += `\nConta: $${(dineroBase * 1.3).toFixed(2)}/s + ${(expBase * 1.3).toFixed(1)}% exp (E) - $${(dineroBase * 5.0 * 1.3).toFixed(2)}/s + ${(expBase * 5.0 * 1.3).toFixed(1)}% exp (M)`;
                    }
                }
            } else {
                description = 'Genera dinero por segundo y otorga experiencia adicional.';
            }
            break;
        
        case 'triple_pasiva':
            icon = '✨🍀🎯';
            name = 'Triple Pasiva';
            if (pasiva.valor && typeof pasiva.valor === 'object') {
                const suerteBase = pasiva.valorBase?.suerte || pasiva.valor.suerte || 0;
                const gradeBase = pasiva.valorBase?.mayor_probabilidad_grado || pasiva.valor.mayor_probabilidad_grado || 0;
                const expBase = pasiva.valorBase?.exp_extra || pasiva.valor.exp_extra || 0;
                const suerteAjustada = Math.round(suerteBase * gradeMultiplier * contaMultiplier);
                const gradeAjustado = Math.round(gradeBase * gradeMultiplier * contaMultiplier);
                const expAjustado = (expBase * gradeMultiplier * contaMultiplier).toFixed(1);
                description = `Otorga +${suerteAjustada} de suerte, +${gradeAjustado} al bono de grado, y +${expAjustado}% de experiencia adicional${pasiva.stackeable ? ' (efectos acumulables)' : ' (efectos no acumulables)'}.`;
                if (isConta) {
                    description += ` ✨ (Conta +30%)`;
                }
                if (showGradeInfo) {
                    description += `\n\nRango por grado: +${Math.round(suerteBase)} suerte / +${Math.round(gradeBase)} grade / +${expBase.toFixed(1)}% exp (E) - +${Math.round(suerteBase * 5.0)} suerte / +${Math.round(gradeBase * 5.0)} grade / +${(expBase * 5.0).toFixed(1)}% exp (M)`;
                    if (isConta) {
                        description += `\nConta: +${Math.round(suerteBase * 1.3)} suerte / +${Math.round(gradeBase * 1.3)} grade / +${(expBase * 1.3).toFixed(1)}% exp (E) - +${Math.round(suerteBase * 5.0 * 1.3)} suerte / +${Math.round(gradeBase * 5.0 * 1.3)} grade / +${(expBase * 5.0 * 1.3).toFixed(1)}% exp (M)`;
                    }
                }
            } else {
                description = 'Otorga múltiples efectos pasivos poderosos.';
            }
            break;
        
        case 'dinero_por_segundo_porcentaje':
            icon = '📈';
            name = 'Ingresos Pasivos %';
            const percentValue = (valorAjustado || 0).toFixed(1);
            description = `Aumenta todos los ingresos pasivos (dinero por segundo) en ${percentValue}%${pasiva.stackeable ? ' (efecto acumulable)' : ' (efecto no acumulable)'}.`;
            if (isConta) {
                description += ` ✨ (Conta +30%)`;
            }
            if (showGradeInfo) {
                description += `\n\nRango por grado: ${(valorBase).toFixed(1)}% (E) - ${(valorBase * 5.0).toFixed(1)}% (M)`;
                if (isConta) {
                    description += `\nConta: ${(valorBase * 1.3).toFixed(1)}% (E) - ${(valorBase * 5.0 * 1.3).toFixed(1)}% (M)`;
                }
            }
            break;
        
        case 'borde_thunder':
            icon = '⚡';
            name = 'Borde Thunder';
            if (pasiva.valor && typeof pasiva.valor === 'object') {
                const suerteBase = pasiva.valor.suerte || 15;
                const expBase = pasiva.valor.exp_extra || 0.25;
                description = `Al usar este item, desbloqueas el borde Thunder permanentemente y obtienes +${suerteBase} de suerte y +${(expBase * 100).toFixed(0)}% de experiencia para siempre. ⚡ ¡ESTE ES UN ITEM ESPECIAL! Usa el botón "USAR" para desbloquearlo.`;
            } else {
                description = '⚡ Desbloquea el borde Thunder y otorga bonos permanentes de suerte y experiencia.';
            }
            break;
        
        case 'mayor_probabilidad_grado':
            icon = '🎯';
            name = 'Mejora de Grado';
            description = `Otorga +${Math.round(valorAjustado)} al bono de grado Masterpiece${pasiva.stackeable ? ' (efecto acumulable)' : ' (efecto no acumulable)'}.`;
            if (isConta) {
                description += ` ✨ (Conta +30%)`;
            }
            if (showGradeInfo) {
                description += `\n\nRango por grado: +${Math.round(valorBase)} (E) - +${Math.round(valorBase * 5.0)} (M)`;
                if (isConta) {
                    description += `\nConta: +${Math.round(valorBase * 1.3)} (E) - +${Math.round(valorBase * 5.0 * 1.3)} (M)`;
                }
            }
            break;
        
        default:
            icon = '🔮';
            name = 'Pasiva Especial';
            description = 'Esta pasiva tiene un efecto único y especial.';
    }

    return {
        name: `${icon} ${name}`,
        description: description,
        icon: icon
    };
}

// Exportar para uso en Node.js (backend) y navegador (frontend)
if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = {
        RARITIES,
        QUALITY_GRADES,
        PASSIVE_GRADE_MULTIPLIERS,
        CONTA_PASSIVE_MULTIPLIER,
        WEAPON_TYPES,
        WEAPONS_DATABASE,
        BOX_CONFIGURATIONS,
        getAllWeapons,
        getWeaponsByRarity,
        getWeaponsByType,
        getWeaponById,
        getWeaponsForBox,
        generateRandomLoot,
        generateRouletteItems,
        getBoxConfiguration,
        getBoxProbabilities,
        getRandomQuality,
        getPassiveInfo,
        getAdjustedProbabilities
    };
} else {
    // Navegador
    window.WeaponsSystem = {
        RARITIES,
        QUALITY_GRADES,
        PASSIVE_GRADE_MULTIPLIERS,
        CONTA_PASSIVE_MULTIPLIER,
        WEAPON_TYPES,
        WEAPONS_DATABASE,
        BOX_CONFIGURATIONS,
        getAllWeapons,
        getWeaponsByRarity,
        getWeaponsByType,
        getWeaponById,
        getWeaponsForBox,
        generateRandomLoot,
        generateRouletteItems,
        getBoxConfiguration,
        getBoxProbabilities,
        getRandomQuality,
        getPassiveInfo,
        getAdjustedProbabilities,
        // Función helper para traducir nombres de rareza
        getTranslatedRarityName: (rarity) => {
            if (!rarity) return 'Común';
            const nameKey = rarity.nameKey || 'rarity_common';
            return window.i18n ? window.i18n.t(nameKey) : rarity.name;
        },
        // Función helper para traducir nombres de armas
        getTranslatedWeaponName: (weapon) => {
            if (!weapon) return '';
            // Si tiene displayName y skin, intentar traducir el skin
            if (weapon.displayName && weapon.skin) {
                const skinKey = `skin_${weapon.skin.toLowerCase().replace(/\s+/g, '_')}`;
                const translatedSkin = window.i18n ? window.i18n.t(skinKey) : weapon.skin;
                return `${weapon.displayName} ${translatedSkin}`;
            }
            // Si no, devolver el nombre original
            return weapon.name;
        }
    };
    window.BOX_CONFIGURATIONS = BOX_CONFIGURATIONS;
}