// Variables globales
let currentHeroSlide = 0;
let currentGameSlide = 0;
let currentPS5Slide = 0;
let currentPlusSlide = 0;
let subscriptionListener = null; // Variable global
let isLoggedIn = false;
let cart = [];

// ========================================
// SISTEMA DE SUSCRIPCIONES Y DESCUENTOS
// ========================================

// Configuración de descuentos por suscripción
const SUBSCRIPTION_DISCOUNTS = {
    'Essential': 0.05,  // 5%
    'Extra': 0.15,      // 15%
    'Premium': 0.25     // 25%
};

// Variable global para almacenar la suscripción actual
let currentUserSubscription = 'none';  // ✅ Cambiar 'Essential' por 'none'
let subscriptionRequestStatus = null;
let subscriptionRequestedPlan = null;
let selectedSubscriptionPlan = null;

/**
 * Obtiene el descuento según la suscripción del usuario
 * @param {string} subscription - Tipo de suscripción
 * @returns {number} Porcentaje de descuento (0.05, 0.15, 0.25)
 */
function getSubscriptionDiscount(subscription) {
    return SUBSCRIPTION_DISCOUNTS[subscription] || 0;
}

/**
 * Calcula el precio final con descuento aplicado
 * @param {number} originalPrice - Precio original del producto
 * @param {string} subscription - Tipo de suscripción
 * @returns {object} Objeto con precio original, descuento y precio final
 */
function calculateDiscountedPrice(originalPrice, subscription = currentUserSubscription) {
    // 🆕 USAR SUBSCRIPTION MANAGER
    return SubscriptionManager.calculateDiscount('ps5', subscription, originalPrice);
}

/**
 * Formatea el precio con información de descuento
 * @param {number} price - Precio original
 * @param {string} subscription - Tipo de suscripción
 * @returns {string} HTML con el precio formateado
 */
function formatPriceWithDiscount(price, subscription = currentUserSubscription) {
    const priceInfo = calculateDiscountedPrice(price, subscription);
    
    if (priceInfo.discountPercentage === 0) {
        return `<span class="price-final">$${price.toFixed(2)}</span>`;
    }
    
    return `
        <div class="price-container">
            <span class="price-original">$${priceInfo.original.toFixed(2)}</span>
            <span class="price-discount-badge">-${priceInfo.discountPercentage}%</span>
            <span class="price-final">$${priceInfo.final.toFixed(2)}</span>
        </div>
    `;
}

/**
 * Carga la suscripción del usuario desde Firestore
 */
/**
 * Carga la suscripción del usuario desde Firestore
 */
async function loadUserSubscription() {
    if (!currentUser) {
        currentUserSubscription = 'none';
        return;
    }
    
    try {
        const doc = await db.collection('users').doc(currentUser.uid).get();
        if (doc.exists) {
            const userData = doc.data();
            
            // 🆕 COMPATIBILIDAD CON AMBAS ESTRUCTURAS
            let subscription = 'none';
            let requestStatus = null;
            let requestedPlan = null;
            
            // 1. Intentar leer estructura NUEVA (subscriptions.ps5)
            if (userData.subscriptions && userData.subscriptions.ps5) {
                subscription = userData.subscriptions.ps5.plan || 'none';
                
                // Leer solicitud pendiente
                if (userData.subscriptionRequests && userData.subscriptionRequests.ps5) {
                    requestStatus = userData.subscriptionRequests.ps5.requestStatus;
                    requestedPlan = userData.subscriptionRequests.ps5.requestedPlan;
                }
            }
            // 2. Si no, intentar estructura ANTIGUA (subscription)
            else if (userData.subscription) {
                subscription = userData.subscription;
                requestStatus = userData.subscriptionRequestStatus;
                requestedPlan = userData.subscriptionRequestedPlan;
            }
            
            currentUserSubscription = subscription;
            subscriptionRequestStatus = requestStatus;
            subscriptionRequestedPlan = requestedPlan;
            
            console.log('📦 Suscripción cargada:', {
                plan: currentUserSubscription,
                estructura: userData.subscriptions ? 'nueva' : 'antigua'
            });
            
            updateSubscriptionBadge();
            refreshAllPrices();
        }
    } catch (error) {
        console.error('Error cargando suscripción:', error);
        currentUserSubscription = 'none';
    }
}
/**
 * Actualiza el badge de suscripción en el header
 */
function updateSubscriptionBadge() {
    const loginBtn = document.querySelector('.login-btn');
    if (!loginBtn) return;
    
    const existingBadge = document.getElementById('subscription-badge');
    if (existingBadge) existingBadge.remove();
    
    // Badge de solicitud de cambio pendiente
    if (subscriptionRequestStatus === 'pending' && currentUserSubscription !== 'none') {
        const badge = document.createElement('span');
        badge.id = 'subscription-badge';
        badge.className = 'subscription-badge pending-change';
        badge.innerHTML = `
            <i class="fas fa-clock"></i> Cambio a ${subscriptionRequestedPlan}
        `;
        badge.title = `Cambio de ${currentUserSubscription} a ${subscriptionRequestedPlan} pendiente`;
        badge.style.background = 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)';
        badge.style.animation = 'pulse 2s infinite';
        loginBtn.parentElement.insertBefore(badge, loginBtn.nextSibling);
        return;
    }
    
    // Badge de suscripción activa
    if (currentUserSubscription !== 'none') {
        const badge = document.createElement('span');
        badge.id = 'subscription-badge';
        badge.className = `subscription-badge ${currentUserSubscription.toLowerCase()}`;
        badge.textContent = currentUserSubscription;
        badge.title = `Descuento: ${Math.round(getSubscriptionDiscount(currentUserSubscription) * 100)}%`;
        loginBtn.parentElement.insertBefore(badge, loginBtn.nextSibling);
        return;
    }
    
    // Badge de solicitud nueva pendiente
    if (subscriptionRequestStatus === 'pending') {
        const badge = document.createElement('span');
        badge.id = 'subscription-badge';
        badge.className = 'subscription-badge pending';
        badge.textContent = 'En revisión';
        badge.title = `Solicitud de ${subscriptionRequestedPlan} pendiente`;
        loginBtn.parentElement.insertBefore(badge, loginBtn.nextSibling);
    }
}

/**
 * Refresca todos los precios visibles en la página
 */
function refreshAllPrices() {
    // Actualizar precios en tarjetas de juegos
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        const priceMatch = btn.textContent.match(/\$?(\d+\.?\d*)/);
        if (priceMatch) {
            const originalPrice = parseFloat(priceMatch[1]);
            const priceInfo = calculateDiscountedPrice(originalPrice);
            btn.innerHTML = `Añadir - $${priceInfo.final.toFixed(2)}`;
            
            if (priceInfo.discountPercentage > 0) {
                btn.innerHTML += ` <small style="text-decoration: line-through; opacity: 0.6;">$${priceInfo.original.toFixed(2)}</small>`;
            }
        }
    });
    
    // Actualizar carrito si está visible
    displayCartItems();
}

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA8pmCj75_X_3dY-687gb23kXmCr5nqKgo",
    authDomain: "playstation-store-b81cb.firebaseapp.com",
    projectId: "playstation-store-b81cb",
    storageBucket: "playstation-store-b81cb.firebasestorage.app",
    messagingSenderId: "284724171611",
    appId: "1:284724171611:web:fce6bff4c39e09044fc07e"
};

// Inicializar Firebase si no está inicializado
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();
let currentUser = null;

// Datos de ejemplo para los juegos
const gamesData = {
    'the-last-of-us': { name: 'The Last of Us', price: 59.99, image: 'https://image.api.playstation.com/vulcan/ap/rnd/202206/0720/7g7kTy7JAK1F4VEqVbCiAGXh.png' },
    'god-of-war': { name: 'God of War', price: 49.99, image: 'https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/4xJ8XB3bi888QTLZYdl7Oi0s.png' },
    'uncharted': { name: 'Uncharted Collection', price: 39.99, image: 'https://image.api.playstation.com/vulcan/ap/rnd/202110/2000/phvVT0qZfcRms5qDAk0SI3CM.png' }
};

// ========================================
// BASE DE DATOS DE BÚSQUEDA
// ========================================
const searchDatabase = [
    // Juegos Sección Principal (Featured Games)
    {
        id: 'the-last-of-us-featured',
        title: 'The Last of Us',
        price: 59.99,
        image: 'https://image.api.playstation.com/vulcan/ap/rnd/202206/0720/ca6Dr3k7PXKaDgEbhN9eODeD.png',
        type: 'Juego PS5',
        category: 'juegos',
        section: 'section-juegos'
    },
    {
        id: 'god-of-war-featured',
        title: 'God of War',
        price: 49.99,
        image: 'https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/4xJ8XB3bi888QTLZYdl7Oi0s.png',
        type: 'Juego PS5',
        category: 'juegos',
        section: 'section-juegos'
    },
    {
        id: 'Uncharted Coleccion',
        title: 'Uncharted Coleccion',
        price: 39.99,
        image: 'https://image.api.playstation.com/vulcan/ap/rnd/202111/2000/B3Xbu6aW10scvc4SE7yXA1lZ.png',
        type: 'Juego PS5',
        category: 'juegos',
        section: 'section-juegos'
    },
    {
        id: 'resident-evil-featured',
        title: 'Resident Evil',
        price: 44.99,
        image: 'https://image.api.playstation.com/vulcan/ap/rnd/202101/0812/FkzwjnJknkrFlozkTdeQBMub.png',
        type: 'Juego PS5',
        category: 'juegos',
        section: 'section-juegos'
    },
    {
        id: 'final-fantasy-featured',
        title: 'Final Fantasy',
        price: 57.99,
        image: 'https://image.api.playstation.com/vulcan/ap/rnd/202211/0711/kh4MUIuMmHlktOHar3lVl6rY.png',
        type: 'Juego PS5',
        category: 'juegos',
        section: 'section-juegos'
    },
    {
        id: 'spider-man-featured',
        title: 'Marvel\'s Spider-Man',
        price: 69.99,
        image: 'https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/1c7b75d8ed9271516546560d219ad0b22ee0a263b4537bd8.png',
        type: 'Juego PS5',
        category: 'juegos',
        section: 'section-juegos'
    },
    {
        id: 'fc25-featured',
        title: 'EA Sports FC 25',
        price: 87.99,
        image: 'https://image.api.playstation.com/vulcan/ap/rnd/202503/2520/f3d0535d2ea21c58eac54e17bc3d4bd6f143e38f403cd02d.png',
        type: 'Juego PS5',
        category: 'juegos',
        section: 'section-juegos'
    },
    {
        id: 'nba-2k25-featured',
        title: 'NBA 2K25',
        price: 47.99,
        image: 'https://assets.nintendo.com/image/upload/f_auto/q_auto/dpr_1.5/c_scale,w_400/ncom/software/switch/70010000080189/ac7bcc68c5e45d6dbb4ad996c8bb012f204e422b987511b3283f35a08d458bdf',
        type: 'Juego PS5',
        category: 'juegos',
        section: 'section-juegos'
    },
    {
        id: 'horizon-featured',
        title: 'Horizon Forbidden West',
        price: 59.99,
        image: 'https://blizzstoreperu.com/cdn/shop/products/1dy5w3SNiJnXjP8YvmydCL9X_png.jpg?v=1644610548',
        type: 'Juego PS5',
        category: 'juegos',
        section: 'section-juegos'
    },
    // Juegos Carrusel PS5 Available
    {
        id: 'spider-man-2',
        title: 'Marvel\'s Spider-Man 2',
        price: 69.99,
        image: 'https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/1c7b75d8ed9271516546560d219ad0b22ee0a263b4537bd8.png',
        type: 'Juego PS5',
        category: 'juegos',
        section: 'section-juegos'
    },
    {
        id: 'astro-bot',
        title: 'ASTRO BOT',
        price: 59.99,
        image: 'https://image.api.playstation.com/vulcan/ap/rnd/202406/0500/8f15268257b878597757fcc5f2c9545840867bc71fc863b1.png',
        type: 'Juego PS5',
        category: 'juegos',
        section: 'section-juegos'
    },
    {
        id: 'helldivers-2',
        title: 'HELLDIVERSâ„¢ 2',
        price: 49.99,
        image: 'https://image.api.playstation.com/vulcan/ap/rnd/202309/2117/3fe5f0891356f4c9988336e68bb9d2b6d29bed389e57cab4.png',
        type: 'Juego PS5',
        category: 'juegos',
        section: 'section-juegos'
    },
    {
        id: 'god-of-war-ragnarok',
        title: 'God of War Ragnarök',
        price: 69.99,
        image: 'https://game-reviewer.com/wp-content/uploads/2022/10/1173124.jpg',
        type: 'Juego PS5',
        category: 'juegos',
        section: 'section-juegos'
    },
    {
        id: 'ratchet-clank',
        title: 'Ratchet & Clank: Rift Apart',
        price: 69.99,
        image: 'https://image.api.playstation.com/vulcan/ap/rnd/202101/2921/QYQ3S7LubGFoVfn8vJ3cmZHw.png',
        type: 'Juego PS5',
        category: 'juegos',
        section: 'section-juegos'
    },
        {
        id: 'resident-evil',
        title: 'Resident Evil 4',
        price: 59.99,
        image: 'https://image.api.playstation.com/vulcan/ap/rnd/202210/0706/EVWyZD63pahuh95eKloFaJuC.png',
        type: 'Juego PS5',
        category: 'juegos',
        section: 'section-juegos'
    },
        {
        id: 'bloodborne',
        title: 'Bloodborne',
        price: 19.99,
        image: 'https://image.api.playstation.com/vulcan/img/rnd/202010/2614/Sy5e8DmeKIJVjlAGraPAJYkT.png',
        type: 'Juego PS4',
        category: 'juegos',
        section: 'section-juegos'
    },
    {
        id: 'persona-5',
        title: 'Persona 5 Royal',
        price: 59.99,
        image: 'https://image.api.playstation.com/cdn/UP2611/CUSA05877_00/S9mV1Ye62EQBXVa96tffknkA4EIEqSBa.png',
        type: 'Juego PS4',
        category: 'juegos',
        section: 'section-juegos'
    },
    {
        id: 'Uncharted 4',
        title: 'Uncharted 4',
        price: 59.99,
        image: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1a/Uncharted_4_box_artwork.jpg/250px-Uncharted_4_box_artwork.jpg',
        type: 'Juego PS4',
        category: 'juegos',
        section: 'section-juegos'
    },
    {
        id: 'red-dead-2',
        title: 'Red Dead Redemption 2',
        price: 39.99,
        image: 'https://image.api.playstation.com/cdn/UP1004/CUSA03041_00/Hpl5MtwQgOVF9vJqlfui6SDB5Jl4oBSq.png?w=440',
        type: 'Juego PS4',
        category: 'juegos',
        section: 'section-juegos'
    },
    {
        id: 'ghost-of-tsushima',
        title: 'Ghost of Tsushima',
        price: 59.99,
        image: 'https://image.api.playstation.com/vulcan/ap/rnd/202010/0222/b3iB2zf2xHj9shC0XDTULxND.png',
        type: 'Juego PS4',
        category: 'juegos',
        section: 'section-juegos'
    },
    {
        id: 'death-stranding',
        title: 'Death Stranding',
        price: 39.99,
        image: 'https://image.api.playstation.com/vulcan/ap/rnd/202106/2214/UXDlNJfdtZJ080ONmH8q3CUX.png',
        type: 'Juego PS4',
        category: 'juegos',
        section: 'section-juegos'
    },
    {
        id: 'sekiro',
        title: 'Sekiro: Shadows Die Twice',
        price: 59.99,
        image: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6e/Sekiro_art.jpg/250px-Sekiro_art.jpg',
        type: 'Juego PS4',
        category: 'juegos',
        section: 'section-juegos'
    },
    {
        id: 'final-fantasy-7-remake',
        title: 'Final Fantasy VII Remake',
        price: 69.99,
        image: 'https://upload.wikimedia.org/wikipedia/en/c/ce/FFVIIRemake.png',
        type: 'Juego PS4',
        category: 'juegos',
        section: 'section-juegos'
    },
    {
        id: 'marvel-spider-man',
        title: 'Marvel\'s Spider-Man',
        price: 39.99,
        image: 'https://image.api.playstation.com/vulcan/ap/rnd/202011/0402/C784xeOFo2wViCf4m5bxgoeH.png',
        type: 'Juego PS4',
        category: 'juegos',
        section: 'section-juegos'
    },
    {
        id: 'days-gone',
        title: 'Days Gone',
        price: 29.99,
        image: 'https://blizzstoreperu.com/cdn/shop/products/40.jpg?v=1601600509',
        type: 'Juego PS4',
        category: 'juegos',
        section: 'section-juegos'
    },
    // Juegos PS4
    {
        id: 'God of War Ragnarök',
        title: 'God of War Ragnarök',
        price: 49.99,
        image: 'https://game-reviewer.com/wp-content/uploads/2022/10/1173124.jpg',
        type: 'Juego PS4',
        category: 'ps4',
        section: 'section-ps4'
    },
    {
        id: 'Uncharted 4',
        title: 'Uncharted 4',
        price: 49.99,
        image: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1a/Uncharted_4_box_artwork.jpg/250px-Uncharted_4_box_artwork.jpg',
        type: 'Juego PS4',
        category: 'ps4',
        section: 'section-ps4'
    },
    {
        id: 'Red Dead Redemption 2',
        title: 'Red Dead Redemption 2',
        price: 39.99,
        image: 'https://image.api.playstation.com/cdn/UP1004/CUSA03041_00/Hpl5MtwQgOVF9vJqlfui6SDB5Jl4oBSq.png?w=440',
        type: 'Juego PS4',
        category: 'ps4',
        section: 'section-ps4'
    },
    {
        id: 'GTA: The Trilogy',
        title: 'GTA: The Trilogy',
        price: 39.99,
        image: 'https://image.api.playstation.com/vulcan/ap/rnd/202110/0106/9EfOgkd9XN01Hzre1v61y27z.png',
        type: 'Juego PS4',
        category: 'ps4',
        section: 'section-ps4'
    },
    {
        id: 'Red Dead Redemption 2',
        title: 'Red Dead Redemption 2',
        price: 39.99,
        image: 'https://image.api.playstation.com/cdn/UP1004/CUSA03041_00/Hpl5MtwQgOVF9vJqlfui6SDB5Jl4oBSq.png?w=440',
        type: 'Juego PS4',
        category: 'ps4',
        section: 'section-ps4'
    },
    {
        id: 'GTA IV',
        title: 'GTA IV',
        price: 39.99,
        image: 'https://upload.wikimedia.org/wikipedia/en/b/b7/Grand_Theft_Auto_IV_cover.jpg',
        type: 'Juego PS4',
        category: 'ps4',
        section: 'section-ps4'
    },
    {
        id: 'GTA V',
        title: 'GTA V',
        price: 39.99,
        image: 'https://upload.wikimedia.org/wikipedia/ru/thumb/c/c8/GTAV_Official_Cover_Art.jpg/330px-GTAV_Official_Cover_Art.jpg',
        type: 'Juego PS4',
        category: 'ps4',
        section: 'section-ps4'
    },
    {
        id: 'FIFA 21',
        title: 'FIFA 21',
        price: 39.99,
        image: 'https://gamescenter.pe/wp-content/uploads/2024/08/FIFA-21-N-1.jpg',
        type: 'Juego PS4',
        category: 'ps4',
        section: 'section-ps4'
    },
    {
        id: 'Gran Turismo 7',
        title: 'Gran Turismo 7',
        price: 39.99,
        image: 'https://image.api.playstation.com/vulcan/ap/rnd/202109/1321/3mjMyRiJaq8lw1EFWiTCUJRV.png',
        type: 'Juego PS4',
        category: 'ps4',
        section: 'section-ps4'
    },
    {
        id: 'pes-2021',
        title: 'PES 2021',
        price: 29.99,
        image: 'https://vulcan.dl.playstation.net/img/rnd/202011/0201/DCT1LwEUb8fXfS2PZfkzXV59.png',
        type: 'Juego PS4',
        category: 'ps4',
        section: 'section-ps4'
    },
    // Accesorios
    {
        id: 'dualsense-white',
        title: 'DualSense Controller',
        price: 69.99,
        image: 'https://pesonyb2c.vtexassets.com/arquivos/ids/223550-800-800?v=638521577332230000&width=800&height=800&aspect=true',
        type: 'Accesorio',
        category: 'accesorios',
        section: 'section-accesorios'
    },
    {
        id: 'pulse-3d',
        title: 'PULSE 3D Wireless Headset',
        price: 99.99,
        image: 'https://m.media-amazon.com/images/I/619NnSrYabL._SL1500_.jpg',
        type: 'Accesorio',
        category: 'accesorios',
        section: 'section-accesorios'
    },
    {
        id: 'charging-station',
        title: 'DualSense Charging Station',
        price: 29.99,
        image: 'https://templo.com.pe/wp-content/uploads/2024/09/PS-711719542162-2.jpg',
        type: 'Accesorio',
        category: 'accesorios',
        section: 'section-accesorios'
    },
    // Consolas PS5
    {
        id: 'ps4-console',
        title: 'PlayStation 4 Slim',
        price: 299.99,
        image: 'https://gmedia.playstation.com/is/image/SIEPDC/ps4-slim-image-block-01-en-24jul20?$1600px--t$',
        type: 'Consola',
        category: 'ps5',
        section: 'section-ps5'
    },
    {
        id: 'ps4-console',
        title: 'PlayStation 4 Standar',
        price: 279.99,
        image: 'ps4.png',
        type: 'Consola',
        category: 'ps5',
        section: 'section-ps5'
    },
    {
        id: 'ps4-console',
        title: 'PlayStation 4 Pro',
        price: 369.99,
        image: 'https://gmedia.playstation.com/is/image/SIEPDC/ps4-pro-image-block-01-en-24jul20?$1600px--t$',
        type: 'Consola',
        category: 'ps5',
        section: 'section-ps5'
    },
    {
        id: 'ps5-console',
        title: 'PlayStation 5 Pro',
        price: 749.99,
        image: 'https://media.hifi.lu/sys-master/products/9441763524638/2160x2160.43001107_04.webp',
        type: 'Consola',
        category: 'ps5',
        section: 'section-ps5'
    },
    {
        id: 'ps5-console',
        title: 'PlayStation 5',
        price: 549.99,
        image: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-slim-edition-left-image-block-01-en-24jun24?$1600px--t$',
        type: 'Consola',
        category: 'ps5',
        section: 'section-ps5'
    },
    {
        id: 'ps5-digital',
        title: 'PlayStation 5 Digital Edition',
        price: 499.99,
        image: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-slim-digital-edition-right-image-block-01-en-24jun24?$1600px--t$',
        type: 'Consola',
        category: 'ps5',
        section: 'section-ps5'
    }
];

// Inicialización cuando el DOM está listo
window.addEventListener('load', function() {
    console.log('Página completamente cargada');
    initializeApp();
});

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM listo');
    setTimeout(function() {
        initializeApp();
    }, 500);
});

// Función principal de inicialización
let appInitialized = false;

function initializeApp() {
    if (appInitialized) return;
    appInitialized = true;

    checkAuth();
    startHeroCarousel();
    initializeEventListeners();
    updateCartDisplay();
    initializePS5Carousel();
    addCartButtonsToGames();
    addCartButtonsToPS5Games();
    addUserMenuStyles();
    addSubscriptionStyles();
    initializeNotificationSystem();
    initializeNavigation();
    initializeSearch();
    restoreSection();
    startUsersAutoRefresh();
}


// ========================================
// SISTEMA DE AUTENTICACIÓN
// ========================================

// Función para verificar autenticación
function checkAuth() {
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        isLoggedIn = true;
        
        // Actualizar lastLogin
        try {
            await db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                lastActivity: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.log('Error updating login:', error);
        }
        
        await loadUserSubscription();
        
        // ✅ AGREGAR ESTA LÍNEA
        setupSubscriptionListener();
        
        updateLoginButton();
        loadCartFromFirestore();
        
        if (typeof startActivityUpdater === 'function') {
            startActivityUpdater();
        }
        
    } else {
        currentUser = null;
        isLoggedIn = false;
        currentUserSubscription = 'none';
        
        // ✅ AGREGAR: Limpiar listener al desconectar
        if (subscriptionListener) {
            subscriptionListener(); 
            subscriptionListener = null;
        }
        
        updateLoginButton();
        cart = [];
        updateCartDisplay();
    }
});

}

/**
 * ✅ NUEVA FUNCIÓN en ps5.js - Actualiza actividad cada 2 minutos
 */
function startActivityUpdater() {
    // Actualizar actividad cada 2 minutos mientras el usuario esté activo
    setInterval(() => {
        if (currentUser && isLoggedIn) {
            db.collection('users').doc(currentUser.uid).update({
                lastActivity: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(error => {
                console.log('Error updating activity:', error);
            });
        }
    }, 120000); // 2 minutos
    
    // También actualizar al hacer acciones
    ['click', 'scroll', 'keydown', 'mousemove'].forEach(event => {
        let lastUpdate = 0;
        document.addEventListener(event, () => {
            const now = Date.now();
            // Actualizar solo si han pasado más de 60 segundos desde la última actualización
            if (currentUser && isLoggedIn && (now - lastUpdate > 60000)) {
                lastUpdate = now;
                db.collection('users').doc(currentUser.uid).update({
                    lastActivity: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(() => {});
            }
        }, { passive: true });
    });
}
// Función para redirigir a la página de autenticación
function redirectToAuth() {
    if (isLoggedIn) {
        toggleUserDropdown();
    } else {
        window.location.href = 'auth.html?redirect=ps5.html';
    }
}

// Función para actualizar el botón de login
function updateLoginButton() {
    const loginBtn = document.querySelector('.login-btn');
    if (isLoggedIn && currentUser) {
        db.collection('users').doc(currentUser.uid).get()
            .then((doc) => {
                if (doc.exists) {
                    const userName = doc.data().name;
                    loginBtn.innerHTML = `<i class="fas fa-user-circle"></i> Hola, ${userName.split(' ')[0]}`;
                    loginBtn.onclick = toggleUserDropdown;
                } else {
                    loginBtn.innerHTML = `<i class="fas fa-user-circle"></i> Mi Cuenta`;
                    loginBtn.onclick = toggleUserDropdown;
                }
            })
            .catch(() => {
                loginBtn.innerHTML = `<i class="fas fa-user-circle"></i> Mi Cuenta`;
                loginBtn.onclick = toggleUserDropdown;
            });
    } else {
        loginBtn.innerHTML = 'Iniciar sesión';
        loginBtn.onclick = redirectToAuth;
    }
}

// Función para mostrar/ocultar menú desplegable de usuario
function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    const isVisible = dropdown.style.display === 'block';
    
    if (isVisible) {
        dropdown.style.display = 'none';
    } else {
        dropdown.style.display = 'block';
    }
    
    if (!isVisible) {
        setTimeout(() => {
            document.addEventListener('click', function closeDropdown(e) {
                if (!dropdown.contains(e.target) && !e.target.closest('.login-btn')) {
                    dropdown.style.display = 'none';
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }, 0);
    }
}

// Función para cerrar sesión
function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        
        // ✅ AGREGAR: Limpiar listener
        if (subscriptionListener) {
            subscriptionListener();
            subscriptionListener = null;
        }
        
        auth.signOut().then(() => {
            isLoggedIn = false;
            currentUser = null;
            cart = [];
            currentUserSubscription = 'none';
            
            updateCartDisplay();
            updateLoginButton();
            
            const dropdown = document.getElementById('userDropdown');
            if (dropdown) dropdown.style.display = 'none';
            
            showNotification('Sesión cerrada correctamente', 'success');
        }).catch((error) => {
            showNotification('Error al cerrar sesión', 'error');
        });
    }
}

// Funciones del menú de cuenta
function viewProfile() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.style.display = 'none';
    
    if (currentUser) {
        db.collection('users').doc(currentUser.uid).get()
            .then((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    showProfileModal(userData);
                }
            })
            .catch(() => {
                showNotification('Error al cargar perfil', 'error');
            });
    }
}

// ✅ NUEVA FUNCIÓN: Mostrar modal de suscripción
function showSubscriptionUpgradeModal() {
    const currentDiscount = Math.round(getSubscriptionDiscount(currentUserSubscription) * 100);
    
    const modal = document.createElement('div');
    modal.className = 'subscription-modal';
    modal.innerHTML = `
        <div class="subscription-modal-content">
            <span class="close-subscription" onclick="closeSubscriptionModal()">&times;</span>
            <h2><i class="fas fa-crown"></i> PlayStation Plus</h2>
            
            <div class="current-subscription">
                <div class="subscription-badge-large ${currentUserSubscription.toLowerCase()}">
                    ${currentUserSubscription}
                </div>
                <p>Tu descuento actual: <strong>${currentDiscount}%</strong></p>
            </div>
            
            <div class="subscription-plans">
                <div class="plan ${currentUserSubscription === 'Essential' ? 'active' : ''}">
                    <h3>Essential</h3>
                    <div class="plan-discount">5% descuento</div>
                    <ul>
                        <li>Juegos mensuales</li>
                        <li>Multijugador online</li>
                        <li>Descuentos exclusivos</li>
                    </ul>
                    <div class="plan-price">$9.99/mes</div>
                </div>
                
                <div class="plan ${currentUserSubscription === 'Extra' ? 'active' : ''}">
                    <h3>Extra</h3>
                    <div class="plan-discount">15% descuento</div>
                    <ul>
                        <li>Todo de Essential</li>
                        <li>+400 juegos del catálogo</li>
                        <li>Acceso anticipado</li>
                    </ul>
                    <div class="plan-price">$14.99/mes</div>
                </div>
                
                <div class="plan premium ${currentUserSubscription === 'Premium' ? 'active' : ''}">
                    <h3>Premium</h3>
                    <div class="plan-discount">25% descuento</div>
                    <ul>
                        <li>Todo de Extra</li>
                        <li>+740 juegos totales</li>
                        <li>Juegos clásicos</li>
                        <li>Streaming en la nube</li>
                    </ul>
                    <div class="plan-price">$17.99/mes</div>
                </div>
            </div>
            
            <p style="text-align: center; color: #888; margin-top: 20px; font-size: 0.9rem;">
                Contacta con un administrador para cambiar tu suscripción
            </p>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeSubscriptionModal() {
    const modal = document.querySelector('.subscription-modal');
    if (modal) modal.remove();
}

/**
 * ✅ FUNCIÓN 1: HISTORIAL DE PEDIDOS
 * 
 */
function viewOrderHistory() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.style.display = 'none';
    
    if (!currentUser) {
        showNotification('Debes iniciar sesión', 'warning');
        return;
    }
    
    showLoading(true);
    
    // Cargar pedidos del usuario
    db.collection('orders')
        .where('customer.uid', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            showLoading(false);
            
            const orders = [];
            snapshot.forEach(doc => {
                orders.push({ id: doc.id, ...doc.data() });
            });
            
            displayOrderHistoryModal(orders);
        })
        .catch(error => {
            showLoading(false);
            console.error('Error cargando pedidos:', error);
            showNotification('Error al cargar historial de pedidos', 'error');
        });
}

function displayOrderHistoryModal(orders) {
    // Crear modal
    const modal = document.createElement('div');
    modal.className = 'order-history-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease-out;
    `;
    
    let ordersHTML = '';
    
    if (orders.length === 0) {
        ordersHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #666;">
                <i class="fas fa-shopping-bag" style="font-size: 4rem; margin-bottom: 20px; color: #444;"></i>
                <h3 style="color: #999; margin-bottom: 10px;">No tienes pedidos aún</h3>
                <p style="color: #666;">Cuando realices compras, aparecerán aquí</p>
                <button onclick="this.closest('.order-history-modal').remove()" 
                        style="margin-top: 20px; background: #0070f3; color: white; border: none; 
                               padding: 12px 30px; border-radius: 25px; cursor: pointer; font-weight: 600;">
                    Explorar Juegos
                </button>
            </div>
        `;
    } else {
        orders.forEach(order => {
            const date = order.createdAt ? 
                order.createdAt.toDate().toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }) : 'Fecha no disponible';
            
            const statusColors = {
                pending: '#ff9800',
                confirmed: '#4caf50',
                rejected: '#f44336',
                completed: '#0070f3'
            };
            
            const statusTexts = {
                pending: 'Pendiente',
                confirmed: 'Confirmado',
                rejected: 'Rechazado',
                completed: 'Completado'
            };
            
            const statusColor = statusColors[order.status] || '#666';
            const statusText = statusTexts[order.status] || order.status;
            
            let itemsHTML = '';
            if (order.items && order.items.length > 0) {
                order.items.forEach(item => {
                    itemsHTML += `
                        <div style="display: flex; align-items: center; gap: 10px; padding: 8px; 
                                    background: #2a2a2a; border-radius: 6px; margin-bottom: 8px;">
                            <img src="${item.image}" alt="${item.name}" 
                                 style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;">
                            <div style="flex: 1;">
                                <div style="color: #fff; font-size: 0.9rem;">${item.name}</div>
                                <div style="color: #0070f3; font-size: 0.85rem;">$${item.price.toFixed(2)} x ${item.quantity}</div>
                            </div>
                        </div>
                    `;
                });
            }
            
            ordersHTML += `
                <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 12px; 
                            padding: 20px; margin-bottom: 15px; transition: transform 0.2s;"
                     onmouseover="this.style.transform='translateY(-2px)'"
                     onmouseout="this.style.transform='translateY(0)'">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                        <div>
                            <h3 style="color: #0070f3; margin: 0 0 5px 0; font-size: 1.1rem;">
                                <i class="fas fa-receipt"></i> Pedido #${order.orderNumber}
                            </h3>
                            <p style="color: #999; margin: 0; font-size: 0.9rem;">
                                <i class="fas fa-calendar-alt"></i> ${date}
                            </p>
                        </div>
                        <span style="background: ${statusColor}; color: white; padding: 6px 16px; 
                                     border-radius: 20px; font-size: 0.85rem; font-weight: 600;">
                            ${statusText}
                        </span>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        ${itemsHTML}
                    </div>
                    
                    <div style="border-top: 1px solid #333; padding-top: 12px; 
                                display: flex; justify-content: space-between; align-items: center;">
                        <div style="color: #ccc; font-size: 0.9rem;">
                            <i class="fas fa-box"></i> ${order.items ? order.items.length : 0} producto(s)
                        </div>
                        <div style="color: #fff; font-size: 1.2rem; font-weight: bold;">
                            Total: <span style="color: #0070f3;">$${(order.total || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    modal.innerHTML = `
        <div style="background: #1e1e1e; border-radius: 15px; max-width: 800px; width: 90%; 
                    max-height: 85vh; overflow: hidden; position: relative; border: 1px solid #333;">
            <div style="background: linear-gradient(135deg, #0070f3 0%, #0056b3 100%); 
                        padding: 25px; border-radius: 15px 15px 0 0;">
                <h2 style="color: white; margin: 0; font-size: 1.8rem; display: flex; 
                           align-items: center; gap: 12px;">
                    <i class="fas fa-history"></i>
                    Historial de Pedidos
                </h2>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 0.95rem;">
                    ${orders.length} pedido${orders.length !== 1 ? 's' : ''} realizado${orders.length !== 1 ? 's' : ''}
                </p>
            </div>
            
            <div style="padding: 20px; max-height: calc(85vh - 140px); overflow-y: auto;">
                ${ordersHTML}
            </div>
            
            <div style="padding: 20px; border-top: 1px solid #333; display: flex; gap: 10px; 
                        justify-content: flex-end; background: #1a1a1a; border-radius: 0 0 15px 15px;">
                <button onclick="this.closest('.order-history-modal').remove()" 
                        style="background: #666; color: white; border: none; padding: 12px 30px; 
                               border-radius: 25px; cursor: pointer; font-weight: 600; transition: all 0.3s;"
                        onmouseover="this.style.background='#777'"
                        onmouseout="this.style.background='#666'">
                    Cerrar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cerrar al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

/**
 * ✅ FUNCIÓN 2: LISTA DE DESEOS
 * Reemplazar la función viewWishlist() existente
 */
function viewWishlist() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.style.display = 'none';
    
    if (!currentUser) {
        showNotification('Debes iniciar sesión', 'warning');
        return;
    }
    
    showLoading(true);
    
    // Cargar lista de deseos del usuario
    db.collection('users').doc(currentUser.uid).get()
        .then(doc => {
            showLoading(false);
            
            const wishlist = doc.exists ? (doc.data().wishlist || []) : [];
            displayWishlistModal(wishlist);
        })
        .catch(error => {
            showLoading(false);
            console.error('Error cargando wishlist:', error);
            showNotification('Error al cargar lista de deseos', 'error');
        });
}

function displayWishlistModal(wishlist) {
    const modal = document.createElement('div');
    modal.className = 'wishlist-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease-out;
    `;
    
    let wishlistHTML = '';
    
    if (wishlist.length === 0) {
        wishlistHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #666;">
                <i class="fas fa-heart" style="font-size: 4rem; margin-bottom: 20px; color: #444;"></i>
                <h3 style="color: #999; margin-bottom: 10px;">Tu lista de deseos está vacía</h3>
                <p style="color: #666;">Agrega juegos que te interesen para comprarlos más tarde</p>
                <button onclick="this.closest('.wishlist-modal').remove()" 
                        style="margin-top: 20px; background: #0070f3; color: white; border: none; 
                               padding: 12px 30px; border-radius: 25px; cursor: pointer; font-weight: 600;">
                    Explorar Juegos
                </button>
            </div>
        `;
    } else {
        wishlist.forEach((item, index) => {
            const priceInfo = calculateDiscountedPrice(item.price);
            
            wishlistHTML += `
                <div style="display: flex; gap: 15px; background: #1a1a1a; border: 1px solid #333; 
                            border-radius: 12px; padding: 15px; margin-bottom: 12px; transition: all 0.3s;"
                     onmouseover="this.style.transform='translateX(5px)'; this.style.borderColor='#0070f3'"
                     onmouseout="this.style.transform='translateX(0)'; this.style.borderColor='#333'">
                    <img src="${item.image}" alt="${item.name}" 
                         style="width: 100px; height: 100px; border-radius: 8px; object-fit: cover;">
                    
                    <div style="flex: 1;">
                        <h3 style="color: #fff; margin: 0 0 8px 0; font-size: 1.1rem;">${item.name}</h3>
                        <p style="color: #999; margin: 0 0 12px 0; font-size: 0.9rem;">
                            Agregado el ${item.addedDate || 'fecha desconocida'}
                        </p>
                        
                        <div style="display: flex; align-items: center; gap: 15px;">
                            ${priceInfo.discountPercentage > 0 ? `
                                <div>
                                    <span style="text-decoration: line-through; color: #666; font-size: 0.9rem;">
                                        $${priceInfo.original.toFixed(2)}
                                    </span>
                                    <span style="color: #4caf50; font-size: 0.85rem; margin-left: 8px;">
                                        -${priceInfo.discountPercentage}%
                                    </span>
                                </div>
                            ` : ''}
                            <div style="color: #0070f3; font-size: 1.3rem; font-weight: bold;">
                                $${priceInfo.final.toFixed(2)}
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 8px; justify-content: center;">
                        <button onclick="addToCartFromWishlist('${item.id}', '${item.name}', ${item.price}, '${item.image}', ${index})" 
                                style="background: #0070f3; color: white; border: none; padding: 10px 20px; 
                                       border-radius: 20px; cursor: pointer; font-weight: 600; transition: all 0.3s;
                                       white-space: nowrap;"
                                onmouseover="this.style.background='#0056b3'"
                                onmouseout="this.style.background='#0070f3'">
                            <i class="fas fa-cart-plus"></i> Añadir
                        </button>
                        <button onclick="removeFromWishlist(${index})" 
                                style="background: #dc3545; color: white; border: none; padding: 10px 20px; 
                                       border-radius: 20px; cursor: pointer; font-weight: 600; transition: all 0.3s;"
                                onmouseover="this.style.background='#c82333'"
                                onmouseout="this.style.background='#dc3545'">
                            <i class="fas fa-trash"></i> Quitar
                        </button>
                    </div>
                </div>
            `;
        });
    }
    
    modal.innerHTML = `
        <div style="background: #1e1e1e; border-radius: 15px; max-width: 900px; width: 90%; 
                    max-height: 85vh; overflow: hidden; position: relative; border: 1px solid #333;">
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
                        padding: 25px; border-radius: 15px 15px 0 0;">
                <h2 style="color: white; margin: 0; font-size: 1.8rem; display: flex; 
                           align-items: center; gap: 12px;">
                    <i class="fas fa-heart"></i>
                    Lista de Deseos
                </h2>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 0.95rem;">
                    ${wishlist.length} juego${wishlist.length !== 1 ? 's' : ''} guardado${wishlist.length !== 1 ? 's' : ''}
                </p>
            </div>
            
            <div style="padding: 20px; max-height: calc(85vh - 140px); overflow-y: auto;">
                ${wishlistHTML}
            </div>
            
            <div style="padding: 20px; border-top: 1px solid #333; display: flex; gap: 10px; 
                        justify-content: space-between; background: #1a1a1a; border-radius: 0 0 15px 15px;">
                <button onclick="addAllToCart()" 
                        style="background: #4caf50; color: white; border: none; padding: 12px 30px; 
                               border-radius: 25px; cursor: pointer; font-weight: 600; transition: all 0.3s;
                               ${wishlist.length === 0 ? 'opacity: 0.5; cursor: not-allowed;' : ''}"
                        ${wishlist.length === 0 ? 'disabled' : ''}
                        onmouseover="if(!this.disabled) this.style.background='#45a049'"
                        onmouseout="if(!this.disabled) this.style.background='#4caf50'">
                    <i class="fas fa-cart-plus"></i> Añadir Todo al Carrito
                </button>
                <button onclick="this.closest('.wishlist-modal').remove()" 
                        style="background: #666; color: white; border: none; padding: 12px 30px; 
                               border-radius: 25px; cursor: pointer; font-weight: 600; transition: all 0.3s;"
                        onmouseover="this.style.background='#777'"
                        onmouseout="this.style.background='#666'">
                    Cerrar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Funciones auxiliares para wishlist
function addToCartFromWishlist(gameId, gameName, price, image, wishlistIndex) {
    addToCart(gameId, gameName, price, image);
    removeFromWishlist(wishlistIndex);
}

function removeFromWishlist(index) {
    if (!currentUser) return;
    
    db.collection('users').doc(currentUser.uid).get()
        .then(doc => {
            const wishlist = doc.data().wishlist || [];
            wishlist.splice(index, 1);
            
            return db.collection('users').doc(currentUser.uid).update({
                wishlist: wishlist
            });
        })
        .then(() => {
            showNotification('Juego eliminado de la lista de deseos', 'success');
            // Recargar modal
            const modal = document.querySelector('.wishlist-modal');
            if (modal) {
                modal.remove();
                viewWishlist();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error al eliminar', 'error');
        });
}

function addAllToCart() {
    if (!currentUser) return;
    
    db.collection('users').doc(currentUser.uid).get()
        .then(doc => {
            const wishlist = doc.data().wishlist || [];
            
            if (wishlist.length === 0) {
                showNotification('La lista está vacía', 'info');
                return;
            }
            
            wishlist.forEach(item => {
                addToCart(item.id, item.name, item.price, item.image);
            });
            
            showNotification(`${wishlist.length} juegos añadidos al carrito`, 'success');
            
            const modal = document.querySelector('.wishlist-modal');
            if (modal) modal.remove();
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error al añadir al carrito', 'error');
        });
}

/**
 * ✅ FUNCIÓN 3: CONFIGURACIÓN
 * Reemplazar la función viewSettings() existente
 */
function viewSettings() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.style.display = 'none';
    
    if (!currentUser) {
        showNotification('Debes iniciar sesión', 'warning');
        return;
    }
    
    showLoading(true);
    
    // Cargar configuración del usuario
    db.collection('users').doc(currentUser.uid).get()
        .then(doc => {
            showLoading(false);
            
            const userData = doc.exists ? doc.data() : {};
            displaySettingsModal(userData);
        })
        .catch(error => {
            showLoading(false);
            console.error('Error cargando configuración:', error);
            showNotification('Error al cargar configuración', 'error');
        });
}

function displaySettingsModal(userData) {
    const modal = document.createElement('div');
    modal.className = 'settings-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease-out;
    `;
    
    const emailNotifications = userData.emailNotifications !== false; // default true
    const smsNotifications = userData.smsNotifications || false;
    const marketingEmails = userData.marketingEmails !== false;
    
    modal.innerHTML = `
        <div style="background: #1e1e1e; border-radius: 15px; max-width: 700px; width: 90%; 
                    max-height: 85vh; overflow: hidden; position: relative; border: 1px solid #333;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        padding: 25px; border-radius: 15px 15px 0 0;">
                <h2 style="color: white; margin: 0; font-size: 1.8rem; display: flex; 
                           align-items: center; gap: 12px;">
                    <i class="fas fa-cog"></i>
                    Configuración
                </h2>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 0.95rem;">
                    Personaliza tu experiencia
                </p>
            </div>
            
            <div style="padding: 25px; max-height: calc(85vh - 180px); overflow-y: auto;">
                
                <!-- Información Personal -->
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #0070f3; margin: 0 0 15px 0; font-size: 1.2rem; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-user-circle"></i> Información Personal
                    </h3>
                    <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 10px; padding: 20px;">
                        <div style="margin-bottom: 15px;">
                            <label style="color: #ccc; display: block; margin-bottom: 8px; font-size: 0.9rem;">
                                Nombre
                            </label>
                            <input type="text" id="userName" value="${userData.name || ''}" 
                                   style="width: 100%; padding: 12px; background: #2a2a2a; border: 1px solid #444; 
                                          border-radius: 8px; color: white; font-size: 1rem;">
                        </div>
                        <div>
                            <label style="color: #ccc; display: block; margin-bottom: 8px; font-size: 0.9rem;">
                                Email (no editable)
                            </label>
                            <input type="email" value="${userData.email || currentUser.email}" 
                                   disabled
                                   style="width: 100%; padding: 12px; background: #1a1a1a; border: 1px solid #333; 
                                          border-radius: 8px; color: #666; font-size: 1rem; cursor: not-allowed;">
                        </div>
                    </div>
                </div>
                
                <!-- Notificaciones -->
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #0070f3; margin: 0 0 15px 0; font-size: 1.2rem; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-bell"></i> Notificaciones
                    </h3>
                    <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 10px; padding: 20px;">
                        <label style="display: flex; align-items: center; justify-content: space-between; 
                                      padding: 12px 0; border-bottom: 1px solid #333; cursor: pointer;">
                            <div>
                                <div style="color: #fff; font-weight: 600; margin-bottom: 4px;">
                                    Notificaciones por Email
                                </div>
                                <div style="color: #999; font-size: 0.85rem;">
                                    Recibe actualizaciones de tus pedidos
                                </div>
                            </div>
                            <input type="checkbox" id="emailNotifications" ${emailNotifications ? 'checked' : ''}
                                   style="width: 20px; height: 20px; cursor: pointer; accent-color: #0070f3;">
                        </label>
                        
                        <label style="display: flex; align-items: center; justify-content: space-between; 
                                      padding: 12px 0; border-bottom: 1px solid #333; cursor: pointer;">
                            <div>
                                <div style="color: #fff; font-weight: 600; margin-bottom: 4px;">
                                    Notificaciones SMS
                                </div>
                                <div style="color: #999; font-size: 0.85rem;">
                                    Alertas importantes por mensaje
                                </div>
                            </div>
                            <input type="checkbox" id="smsNotifications" ${smsNotifications ? 'checked' : ''}
                                   style="width: 20px; height: 20px; cursor: pointer; accent-color: #0070f3;">
                        </label>
                        
                        <label style="display: flex; align-items: center; justify-content: space-between; 
                                      padding: 12px 0; cursor: pointer;">
                            <div>
                                <div style="color: #fff; font-weight: 600; margin-bottom: 4px;">
                                    Ofertas y Promociones
                                </div>
                                <div style="color: #999; font-size: 0.85rem;">
                                    Recibe emails con descuentos exclusivos
                                </div>
                            </div>
                            <input type="checkbox" id="marketingEmails" ${marketingEmails ? 'checked' : ''}
                                   style="width: 20px; height: 20px; cursor: pointer; accent-color: #0070f3;">
                        </label>
                    </div>
                </div>
                
                <!-- Privacidad -->
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #0070f3; margin: 0 0 15px 0; font-size: 1.2rem; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-shield-alt"></i> Privacidad y Seguridad
                    </h3>
                    <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 10px; padding: 20px;">
                        <button onclick="changePassword()" 
                                style="width: 100%; background: #0070f3; color: white; border: none; 
                                       padding: 14px; border-radius: 8px; font-weight: 600; cursor: pointer; 
                                       font-size: 1rem; margin-bottom: 12px; transition: all 0.3s;"
                                onmouseover="this.style.background='#0056b3'"
                                onmouseout="this.style.background='#0070f3'">
                            <i class="fas fa-key"></i> Cambiar Contraseña
                        </button>
                        <button onclick="confirmDeleteAccount()" 
                                style="width: 100%; background: #dc3545; color: white; border: none; 
                                       padding: 14px; border-radius: 8px; font-weight: 600; cursor: pointer; 
                                       font-size: 1rem; transition: all 0.3s;"
                                onmouseover="this.style.background='#c82333'"
                                onmouseout="this.style.background='#dc3545'">
                            <i class="fas fa-trash-alt"></i> Eliminar Cuenta
                        </button>
                    </div>
                </div>
                
            </div>
            
            <div style="padding: 20px; border-top: 1px solid #333; display: flex; gap: 10px; 
                        justify-content: flex-end; background: #1a1a1a; border-radius: 0 0 15px 15px;">
                <button onclick="this.closest('.settings-modal').remove()" 
                        style="background: #666; color: white; border: none; padding: 12px 30px; 
                               border-radius: 25px; cursor: pointer; font-weight: 600; transition: all 0.
                               <function_calls>
<invoke name="artifacts">
<parameter name="command">update</parameter>
<parameter name="id">user_menu_features</parameter>
<parameter name="old_str">                <button onclick="this.closest('.settings-modal').remove()"
style="background: #666; color: white; border: none; padding: 12px 30px;
border-radius: 25px; cursor: pointer; font-weight: 600; transition: all 0.</parameter>
<parameter name="new_str">                <button onclick="this.closest('.settings-modal').remove()" 
                     style="background: #666; color: white; border: none; padding: 12px 30px; 
                            border-radius: 25px; cursor: pointer; font-weight: 600; transition: all 0.3s;"
                     onmouseover="this.style.background='#777'"
                     onmouseout="this.style.background='#666'">
Cancelar
</button>
<button onclick="saveSettings()" 
                     style="background: #4caf50; color: white; border: none; padding: 12px 30px; 
                            border-radius: 25px; cursor: pointer; font-weight: 600; transition: all 0.3s;"
                     onmouseover="this.style.background='#45a049'"
                     onmouseout="this.style.background='#4caf50'">
<i class="fas fa-save"></i> Guardar Cambios
</button>
</div>
</div>
`;
document.body.appendChild(modal);

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.remove();
    }
});
}
// Funciones auxiliares de configuración
function saveSettings() {
if (!currentUser) return;
showLoading(true);

const newName = document.getElementById('userName').value.trim();
const emailNotifications = document.getElementById('emailNotifications').checked;
const smsNotifications = document.getElementById('smsNotifications').checked;
const marketingEmails = document.getElementById('marketingEmails').checked;

db.collection('users').doc(currentUser.uid).update({
    name: newName,
    emailNotifications: emailNotifications,
    smsNotifications: smsNotifications,
    marketingEmails: marketingEmails,
    settingsUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
})
.then(() => {
    showLoading(false);
    showNotification('Configuración guardada correctamente', 'success');
    
    // Actualizar botón de login con nuevo nombre
    updateLoginButton();
    
    // Cerrar modal
    const modal = document.querySelector('.settings-modal');
    if (modal) modal.remove();
})
.catch(error => {
    showLoading(false);
    console.error('Error:', error);
    showNotification('Error al guardar configuración', 'error');
});
}
function changePassword() {
const currentPassword = prompt('Ingresa tu contraseña actual:');
if (!currentPassword) return;
const newPassword = prompt('Ingresa tu nueva contraseña (mínimo 6 caracteres):');
if (!newPassword || newPassword.length < 6) {
    showNotification('La contraseña debe tener al menos 6 caracteres', 'warning');
    return;
}

const confirmPassword = prompt('Confirma tu nueva contraseña:');
if (newPassword !== confirmPassword) {
    showNotification('Las contraseñas no coinciden', 'error');
    return;
}

showLoading(true);

// Reautenticar usuario
const credential = firebase.auth.EmailAuthProvider.credential(
    currentUser.email,
    currentPassword
);

currentUser.reauthenticateWithCredential(credential)
    .then(() => {
        return currentUser.updatePassword(newPassword);
    })
    .then(() => {
        showLoading(false);
        showNotification('Contraseña actualizada correctamente', 'success');
    })
    .catch(error => {
        showLoading(false);
        console.error('Error:', error);
        
        if (error.code === 'auth/wrong-password') {
            showNotification('Contraseña actual incorrecta', 'error');
        } else {
            showNotification('Error al cambiar contraseña', 'error');
        }
    });
}
function confirmDeleteAccount() {
if (!confirm('⚠️ ¿Estás seguro? Esta acción NO se puede deshacer.\n\nSe eliminarán:\n- Tu cuenta\n- Historial de pedidos\n- Lista de deseos\n- Toda tu información')) {
return;
}
const password = prompt('Para confirmar, ingresa tu contraseña:');
if (!password) return;

showLoading(true);

const credential = firebase.auth.EmailAuthProvider.credential(
    currentUser.email,
    password
);

const userId = currentUser.uid;

// Reautenticar y eliminar
currentUser.reauthenticateWithCredential(credential)
    .then(() => {
        // Eliminar datos del usuario en Firestore
        return db.collection('users').doc(userId).delete();
    })
    .then(() => {
        // Eliminar cuenta de autenticación
        return currentUser.delete();
    })
    .then(() => {
        showLoading(false);
        showNotification('Cuenta eliminada correctamente', 'success');
        
        setTimeout(() => {
            window.location.href = 'ps5.html';
        }, 2000);
    })
    .catch(error => {
        showLoading(false);
        console.error('Error:', error);
        
        if (error.code === 'auth/wrong-password') {
            showNotification('Contraseña incorrecta', 'error');
        } else {
            showNotification('Error al eliminar cuenta', 'error');
        }
    });
    }

// Función para mostrar modal de perfil
function showProfileModal(userData) {
    // 🆕 COMPATIBILIDAD CON AMBAS ESTRUCTURAS
    let subscription = 'Essential';
    let subscriptionDate = 'N/A';
    
    if (userData.subscriptions && userData.subscriptions.ps5) {
        subscription = userData.subscriptions.ps5.plan || 'Essential';
        subscriptionDate = formatDate(userData.subscriptions.ps5.startDate);
    } else if (userData.subscription) {
        subscription = userData.subscription;
        subscriptionDate = formatDate(userData.subscriptionStartDate);
    }
    
    const subscriptionDiscount = Math.round(getSubscriptionDiscount(subscription) * 100);
    
    const modal = document.createElement('div');
    modal.className = 'profile-modal';
    modal.innerHTML = `
        <div class="profile-modal-content">
            <span class="close-profile" onclick="closeProfileModal()">&times;</span>
            <h2><i class="fas fa-user"></i> Mi Perfil</h2>
            
            <div class="profile-info">
                <div class="profile-field">
                    <label>Nombre:</label>
                    <span>${userData.name}</span>
                </div>
                <div class="profile-field">
                    <label>Email:</label>
                    <span>${userData.email}</span>
                </div>
                <div class="profile-field">
                    <label>Miembro desde:</label>
                    <span>${formatDate(userData.createdAt)}</span>
                </div>
                <div class="profile-field">
                    <label>Última conexión:</label>
                    <span>${formatDate(userData.lastLogin)}</span>
                </div>
            </div>
            
            <div class="subscription-section">
                <h3><i class="fas fa-crown"></i> PlayStation Plus</h3>
                <div class="subscription-card ${subscription.toLowerCase()}">
                    <div class="subscription-header">
                        <span class="subscription-name">${subscription}</span>
                        <span class="subscription-discount">${subscriptionDiscount}% OFF</span>
                    </div>
                    <div class="subscription-details">
                        <p><i class="fas fa-calendar"></i> Desde: ${subscriptionDate}</p>
                        <p><i class="fas fa-tag"></i> Descuento en todos los juegos: <strong>${subscriptionDiscount}%</strong></p>
                    </div>
                    ${subscription !== 'Premium' ? `
                        <button class="upgrade-btn" onclick="closeProfileModal(); showSubscriptionUpgradeModal();">
                            <i class="fas fa-arrow-up"></i> Mejorar Suscripción
                        </button>
                    ` : `
                        <div class="max-tier">
                            <i class="fas fa-star"></i> ¡Tienes el mejor plan!
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Función para cerrar modal de perfil
function closeProfileModal() {
    const modal = document.querySelector('.profile-modal');
    if (modal) {
        modal.remove();
    }
}

// Función para formatear fecha
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    
    if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    return 'N/A';
}

// ========================================
// SISTEMA DE CARRITO
// ========================================

// Guardar carrito en Firestore
function saveCartToFirestore() {
    if (!currentUser) return;
    
    db.collection('users').doc(currentUser.uid).update({
        cart: cart,
        cartUpdated: firebase.firestore.FieldValue.serverTimestamp()
    }).catch((error) => {
        console.error('Error guardando carrito:', error);
    });
}

// Cargar carrito desde Firestore
function loadCartFromFirestore() {
    if (!currentUser) return;
    
    db.collection('users').doc(currentUser.uid).get()
        .then((doc) => {
            if (doc.exists && doc.data().cart) {
                cart = doc.data().cart;
                updateCartDisplay();
                displayCartItems();
            }
        })
        .catch((error) => {
            console.error('Error cargando carrito:', error);
        });
}

// Función para añadir al carrito
function addToCart(gameId, gameName, price, image) {
    if (!isLoggedIn) {
        showNotification('Debes iniciar sesión para añadir productos al carrito', 'warning');
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1500);
        return;
    }
    
    // ✅ NUEVO: Calcular precio con descuento
    const priceInfo = calculateDiscountedPrice(price);
    
    const existingItem = cart.find(item => item.id === gameId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: gameId,
            name: gameName,
            originalPrice: price, // ✅ NUEVO: Precio original
            price: priceInfo.final, // ✅ MODIFICADO: Precio con descuento
            discount: priceInfo.discount, // ✅ NUEVO: Monto del descuento
            discountPercentage: priceInfo.discountPercentage, // ✅ NUEVO
            image: image,
            quantity: 1,
            subscription: currentUserSubscription // ✅ NUEVO: Guardar suscripción aplicada
        });
    }
    
    updateCartDisplay();
    saveCartToFirestore();
    
    // ✅ NUEVO: Notificación mejorada
    const savingsMsg = priceInfo.discountPercentage > 0 
        ? ` (Ahorro: $${priceInfo.discount.toFixed(2)} con ${currentUserSubscription})` 
        : '';
    showNotification(`${gameName} añadido al carrito${savingsMsg}`, 'success');
}

// Función para eliminar del carrito
function removeFromCart(gameId) {
    cart = cart.filter(item => item.id !== gameId);
    updateCartDisplay();
    displayCartItems();
    saveCartToFirestore();
}

// Función para actualizar cantidad en el carrito
function updateCartQuantity(gameId, change) {
    const item = cart.find(item => item.id === gameId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(gameId);
        } else {
            updateCartDisplay();
            displayCartItems();
            saveCartToFirestore();
        }
    }
}

// Actualizar display del carrito
function updateCartDisplay() {
    const cartCount = document.querySelector('.cart-count');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.disabled = cart.length === 0;
        checkoutBtn.onclick = proceedToCheckout;
    }
}

// Mostrar items del carrito
function displayCartItems() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">Tu carrito está vacío</p>';
        cartTotalElement.textContent = '0.00';
        return;
    }
    
    let cartHTML = '';
    let total = 0;
    
    // DENTRO DE displayCartItems, BUSCA el forEach y REEMPLAZA:
cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    
    // ✅ NUEVO: Mostrar información de descuento
    const discountInfo = item.discountPercentage > 0 
        ? `<small style="color: #4caf50; display: block; margin-top: 3px;">
             <i class="fas fa-tag"></i> -${item.discountPercentage}% (${currentUserSubscription})
           </small>`
        : '';
    
    const originalPriceDisplay = item.originalPrice && item.originalPrice !== item.price
        ? `<span style="text-decoration: line-through; opacity: 0.5; font-size: 0.9rem; margin-right: 8px;">
             $${item.originalPrice.toFixed(2)}
           </span>`
        : '';
    
    cartHTML += `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p style="color: #0070f3; font-weight: bold;">
                    ${originalPriceDisplay}
                    $${item.price.toFixed(2)}
                </p>
                ${discountInfo}
            </div>
            <div class="cart-item-controls">
                <button class="cart-quantity-btn" onclick="updateCartQuantity('${item.id}', -1)">
                    <i class="fas fa-minus"></i>
                </button>
                <span class="cart-quantity">${item.quantity}</span>
                <button class="cart-quantity-btn" onclick="updateCartQuantity('${item.id}', 1)">
                    <i class="fas fa-plus"></i>
                </button>
                <button class="cart-remove-btn" onclick="removeFromCart('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <hr class="cart-separator">
    `;
});
    
    cartItemsContainer.innerHTML = cartHTML;
    cartTotalElement.textContent = total.toFixed(2);
    
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.disabled = false;
        checkoutBtn.onclick = proceedToCheckout;
    }
}

// Proceder al checkout
function proceedToCheckout() {
    if (cart.length === 0) {
        showNotification('El carrito está vacío', 'warning');
        return;
    }
    
    localStorage.setItem('guestCart', JSON.stringify(cart));
    
    const currentPlatformFile = window.location.pathname.split('/').pop();
    localStorage.setItem('checkoutOrigin', currentPlatformFile);
    
    if (isLoggedIn && currentUser) {
        saveCartToFirestore();
    }
    
    window.location.href = 'checkout.html';
}

// ========================================
// SISTEMA DE CARRUSELES
// ========================================

// Hero Carousel
function startHeroCarousel() {
    const slides = document.querySelectorAll('.hero-slide');
    let currentIndex = 0;

    // Ocultar todos los slides menos el primero
    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === 0);
    });

    setInterval(() => {
        slides[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % slides.length;
        slides[currentIndex].classList.add('active');
    }, 7000); // cambia cada 7 segundos
}


// Featured Games Carousel
function moveCarousel(direction) {
    const container = document.querySelector('.games-container');
    const cards = document.querySelectorAll('.game-card');
    const cardWidth = 330;
    const totalCards = cards.length;
    const visibleCards = Math.floor(window.innerWidth / cardWidth);
    const maxSlide = Math.max(0, totalCards - visibleCards);
    
    currentGameSlide += direction;
    
    if (currentGameSlide < 0) {
        currentGameSlide = 0;
    } else if (currentGameSlide > maxSlide) {
        currentGameSlide = maxSlide;
    }
    
    const translateX = -currentGameSlide * cardWidth;
    container.style.transform = `translateX(${translateX}px)`;
}

// PS5 Available Games Carousel
function movePS5Carousel(direction) {
    const container = document.querySelector('.ps5-available-container');
    const cards = document.querySelectorAll('.ps5-available-card');
    const totalCards = cards.length;

    currentPS5Slide += direction;

    if (currentPS5Slide < 0) {
        currentPS5Slide = 0;
    } else if (currentPS5Slide > totalCards - 1) {
        currentPS5Slide = totalCards - 1;
    }

    updatePS5Carousel();
    updatePS5Dots();
}

function goToPS5Slide(slideIndex) {
    const cards = document.querySelectorAll('.ps5-available-card');
    const totalCards = cards.length;
    const maxSlides = totalCards - 2;
    
    if (slideIndex < 0) slideIndex = 0;
    if (slideIndex >= maxSlides) slideIndex = maxSlides - 1;
    
    currentPS5Slide = slideIndex;
    updatePS5Carousel();
    updatePS5Dots();
}

function updatePS5Carousel() {
    const container = document.querySelector('.ps5-available-container');
    const cards = document.querySelectorAll('.ps5-available-card');
    const cardWidth = 320;
    const visibleCards = 3;
    const offset = (visibleCards - 1) / 2;
    const translateX = -(currentPS5Slide - offset) * cardWidth;

    container.style.transform = `translateX(${translateX}px)`;

    cards.forEach(card => card.classList.remove('featured-card'));
    cards[currentPS5Slide].classList.add('featured-card');
}

function updatePS5Dots() {
    const dots = document.querySelectorAll('.dot');
    const cards = document.querySelectorAll('.ps5-available-card');
    const totalCards = cards.length;
    const maxSlides = totalCards - 2;
    
    dots.forEach((dot, index) => {
        if (index < maxSlides) {
            dot.style.display = 'inline-block';
            dot.classList.toggle('active', index === currentPS5Slide);
        } else {
            dot.style.display = 'none';
        }
    });
}

function initializePS5Carousel() {
    const cards = document.querySelectorAll('.ps5-available-card');
    if (cards.length > 1) {
        cards[1].classList.add('featured-card');
    }
    
    updatePS5Dots();
    
    setInterval(() => {
        const cards = document.querySelectorAll('.ps5-available-card');
        const totalCards = cards.length;
        const maxSlides = totalCards - 2;
        
        if (currentPS5Slide < maxSlides - 1) {
            movePS5Carousel(1);
        } else {
            goToPS5Slide(0);
        }
    }, 8000);
}

// PlayStation Plus Carousel
function movePlusCarousel(direction) {
    const container = document.querySelector('.plus-container');
    const cards = document.querySelectorAll('.plus-card');
    const cardWidth = 380;
    const totalCards = cards.length;
    const visibleCards = Math.floor(window.innerWidth / cardWidth);
    const maxSlide = Math.max(0, totalCards - visibleCards);
    
    currentPlusSlide += direction;
    
    if (currentPlusSlide < 0) {
        currentPlusSlide = 0;
    } else if (currentPlusSlide > maxSlide) {
        currentPlusSlide = maxSlide;
    }
    
    const translateX = -currentPlusSlide * cardWidth;
    container.style.transform = `translateX(${translateX}px)`;
}

// Modal functions
function toggleCart() {
    const modal = document.getElementById('cartModal');
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
    
    if (modal.style.display === 'block') {
        displayCartItems();
    }
}

// ========================================
// SISTEMA DE NAVEGACIÓN
// ========================================

// Navigation functions
function goToGameDetail(gameId) {
    const gamePages = {
        'spider-man-2': 'juegos/game-detail.html?id=spider-man-2',
        'god-of-war': 'juegos/game-detail.html?id=god-of-war',
        'the-last-of-us': 'juegos/game-detail.html?id=the-last-of-us',
        'astro-bot': 'juegos/game-detail.html?id=astro-bot',
        'helldivers-2': 'juegos/game-detail.html?id=helldivers-2',
        'horizon-forbidden-west': 'juegos/game-detail.html?id=horizon-forbidden-west',
        'gta-v': 'juegos/game-detail.html?id=gta-v',
        'pes-2021': 'juegos/game-detail.html?id=pes-2021',
        'ratchet-clank': 'juegos/game-detail.html?id=ratchet-clank',
        'call-of-duty': 'juegos/game-detail.html?id=call-of-duty',
        'final-fantasy': 'juegos/game-detail.html?id=final-fantasy',
        'resident-evil': 'juegos/game-detail.html?id=resident-evil',
        'bloodborne': 'juegos/game-detail.html?id=bloodborne',
        'persona-5': 'juegos/game-detail.html?id=persona-5',
        'uncharted-4': 'juegos/game-detail.html?id=uncharted-4',
        'red-dead-2': 'juegos/game-detail.html?id=red-dead-2',
        'ghost-of-tsushima': 'juegos/game-detail.html?id=ghost-of-tsushima',
        'death-stranding': 'juegos/game-detail.html?id=death-stranding',
        'sekiro': 'juegos/game-detail.html?id=sekiro',
        'final-fantasy-7-remake': 'juegos/game-detail.html?id=final-fantasy-7-remake',
        'marvel-spider-man': 'juegos/game-detail.html?id=marvel-spider-man',
        'days-gone': 'juegos/game-detail.html?id=days-gone',
        'nba-2k25': 'juegos/game-detail.html?id=nba-2k25'
    };
    
    const targetPage = gamePages[gameId];
    if (targetPage) {
        window.location.href = targetPage;
    } else {
        showNotification('Página de detalles no disponible', 'info');
    }
}

function initializeNavigation() {
    console.log('Inicializando navegación...');
    
    setTimeout(function() {
        const navLinks = document.querySelectorAll('.nav-link');
        console.log('Enlaces encontrados:', navLinks.length);
        
        if (navLinks.length === 0) {
            console.error('No se encontraron enlaces de navegación');
            return;
        }
        
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Click en:', this.textContent);
                
                const sectionName = this.textContent.trim().toLowerCase();
                const sectionId = normalizeSectionName(sectionName);
                
                console.log('Navegando a sección:', sectionId);
                
                showSection(sectionId);
                markActiveLink(this);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }, 100);
}

function normalizeSectionName(name) {
    const cleanName = name.replace(/[^a-záéíóúñ0-9\s]/gi, '').trim();
    
    const nameMap = {
        'home': 'juegos',
        'consolas': 'ps5',
        'juegos': 'ps4',
        'servicios': 'servicios',
        'accesorios': 'accesorios',
        'noticias': 'noticias',
        'tienda': 'tienda',
        'asistencia': 'asistencia'
    };
    
    return nameMap[cleanName] || 'ps5-juegos';
}

function showSection(sectionId) {
    const allSections = document.querySelectorAll('.content-section');
    allSections.forEach(section => {
        section.style.display = 'none';
    });
    
    const targetSection = document.getElementById(`section-${sectionId}`);
    if (targetSection) {
        targetSection.style.display = 'block';
        sessionStorage.setItem('currentSection', sectionId);
    } else {
        console.warn(`Sección no encontrada: section-${sectionId}`);
        document.getElementById('section-juegos').style.display = 'block';
    }
}

function markActiveLink(activeLink) {
    const allLinks = document.querySelectorAll('.nav-link');
    allLinks.forEach(link => {
        link.classList.remove('active');
        link.style.color = '#fff';
    });
    
    activeLink.classList.add('active');
    activeLink.style.color = '#0070f3';
}

function restoreSection() {
    const savedSection = sessionStorage.getItem('currentSection') || 'juegos';
    showSection(savedSection);
    
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const linkSection = normalizeSectionName(link.textContent.trim().toLowerCase());
        if (linkSection === savedSection) {
            markActiveLink(link);
        }
    });
}

// ========================================
// SISTEMA DE NOTIFICACIONES
// ========================================

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; font-size: 18px; cursor: pointer; margin-left: 10px;">&times;</button>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 3000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 300px;
        animation: slideInRight 0.3s ease-out;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196f3'};
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// ========================================
// SISTEMA DE NOTIFICACIONES EN TIEMPO REAL
// ========================================

let notificationListener = null;
let notificationContainer = null;

function initializeNotificationSystem() {
    createNotificationContainer();
    
    auth.onAuthStateChanged((user) => {
        if (user) {
            setupNotificationListener(user.uid);
        } else {
            if (notificationListener) {
                notificationListener();
                notificationListener = null;
            }
        }
    });
}

function createNotificationContainer() {
    if (document.getElementById('user-notifications')) return;
    
    const container = document.createElement('div');
    container.id = 'user-notifications';
    container.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        z-index: 5000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 400px;
        pointer-events: none;
    `;
    document.body.appendChild(container);
    notificationContainer = container;
    
    createNotificationButton();
}

function createNotificationButton() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions || document.getElementById('notification-btn')) return;
    
    const notificationBtn = document.createElement('button');
    notificationBtn.id = 'notification-btn';
    notificationBtn.innerHTML = `
        <i class="fas fa-bell"></i>
        <span class="notification-badge" id="notification-count">0</span>
    `;
    notificationBtn.style.cssText = `
        background: none;
        border: 1px solid #444;
        color: #fff;
        padding: 0.5rem;
        border-radius: 6px;
        cursor: pointer;
        position: relative;
        margin-right: 1rem;
        transition: all 0.3s;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        .notification-badge {
            position: absolute;
            top: -8px;
            right: -8px;
            background: #f44336;
            color: white;
            border-radius: 50%;
            padding: 2px 6px;
            font-size: 0.7rem;
            min-width: 18px;
            text-align: center;
            display: none;
        }
        
        .notification-badge.show {
            display: block;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        #notification-btn:hover {
            border-color: #0070f3;
            background: rgba(0, 112, 243, 0.1);
        }
    `;
    document.head.appendChild(style);
    
    notificationBtn.addEventListener('click', showNotificationCenter);
    navActions.insertBefore(notificationBtn, navActions.firstChild);
}

function setupNotificationListener(userId) {
    if (notificationListener) {
        notificationListener();
    }
    
    notificationListener = db.collection('notifications')
        .where('userId', '==', userId)
        .where('read', '==', false)
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const notification = { id: change.doc.id, ...change.doc.data() };
                    showRealTimeNotification(notification);
                    updateNotificationBadge();
                }
            });
        }, (error) => {
            console.error('Error listening to notifications:', error);
        });
}

function showRealTimeNotification(notification) {
    if (!notificationContainer) return;
    
    const notificationElement = document.createElement('div');
    notificationElement.className = 'real-time-notification';
    notificationElement.style.cssText = `
        background: ${getNotificationColor(notification.type)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        border-left: 4px solid ${getNotificationAccentColor(notification.type)};
        animation: slideInRight 0.5s ease-out;
        pointer-events: auto;
        cursor: pointer;
        max-width: 100%;
        position: relative;
    `;
    
    notificationElement.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
            <div style="font-size: 1.2rem; margin-top: 0.1rem;">
                ${getNotificationIcon(notification.type)}
            </div>
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 600; margin-bottom: 0.25rem; font-size: 0.95rem;">
                    ${notification.title}
                </div>
                <div style="font-size: 0.85rem; line-height: 1.4; opacity: 0.95;">
                    ${notification.message}
                </div>
                ${notification.orderNumber ? 
                    `<div style="margin-top: 0.5rem; font-size: 0.8rem; opacity: 0.8;">
                        Pedido: #${notification.orderNumber}
                    </div>` : ''
                }
            </div>
            <button onclick="dismissNotification('${notification.id}', this.closest('.real-time-notification'))" 
                    style="background: none; border: none; color: white; font-size: 1rem; cursor: pointer; opacity: 0.7; padding: 0;">
                ×
            </button>
        </div>
    `;
    
    notificationContainer.appendChild(notificationElement);
    
    playNotificationSound();
    
    setTimeout(() => {
        if (notificationElement.parentNode) {
            notificationElement.style.animation = 'slideOutRight 0.5s ease-out forwards';
            setTimeout(() => {
                if (notificationElement.parentNode) {
                    notificationElement.remove();
                }
            }, 500);
        }
    }, 8000);
    
    notificationElement.addEventListener('click', () => {
        markNotificationAsRead(notification.id);
        notificationElement.style.animation = 'slideOutRight 0.5s ease-out forwards';
        setTimeout(() => notificationElement.remove(), 500);
    });
}

function getNotificationColor(type) {
    switch (type) {
        case 'order_confirmed': return 'linear-gradient(135deg, #4caf50, #45a049)';
        case 'order_rejected': return 'linear-gradient(135deg, #f44336, #d32f2f)';
        case 'order_shipped': return 'linear-gradient(135deg, #0070f3, #0056b3)';
        case 'custom': return 'linear-gradient(135deg, #ff9800, #f57c00)';
        default: return 'linear-gradient(135deg, #666, #555)';
    }
}

function getNotificationAccentColor(type) {
    switch (type) {
        case 'order_confirmed': return '#66bb6a';
        case 'order_rejected': return '#ef5350';
        case 'order_shipped': return '#42a5f5';
        case 'custom': return '#ffb74d';
        default: return '#999';
    }
}

function getNotificationIcon(type) {
    switch (type) {
        case 'order_confirmed': return '✅';
        case 'order_rejected': return '❌';
        case 'order_shipped': return '🚚';
        case 'custom': return '📢';
        default: return '🔔';
    }
}

function updateNotificationBadge() {
    if (!currentUser) return;
    
    db.collection('notifications')
        .where('userId', '==', currentUser.uid)
        .where('read', '==', false)
        .get()
        .then(snapshot => {
            const count = snapshot.size;
            const badge = document.getElementById('notification-count');
            if (badge) {
                badge.textContent = count;
                if (count > 0) {
                    badge.classList.add('show');
                } else {
                    badge.classList.remove('show');
                }
            }
        });
}

function markNotificationAsRead(notificationId) {
    db.collection('notifications').doc(notificationId).update({
        read: true,
        readAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        updateNotificationBadge();
    });
}

function dismissNotification(notificationId, element) {
    element.style.animation = 'slideOutRight 0.5s ease-out forwards';
    setTimeout(() => element.remove(), 500);
    markNotificationAsRead(notificationId);
}

function showNotificationCenter() {
    if (!currentUser) return;
    
    const modal = document.createElement('div');
    modal.id = 'notification-center-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 6000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease-out;
    `;
    
    modal.innerHTML = `
        <div style="background: #1e1e1e; border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow: hidden; border: 1px solid #333;">
            <div style="padding: 1.5rem; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">
                <h2 style="color: #0070f3; margin: 0;">Centro de Notificaciones</h2>
                <button onclick="closeNotificationCenter()" style="background: none; border: none; color: #ccc; font-size: 1.5rem; cursor: pointer;">×</button>
            </div>
            <div id="notification-list" style="padding: 1rem; max-height: 400px; overflow-y: auto;">
                <div style="text-align: center; color: #666; padding: 2rem;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i><br>
                    Cargando notificaciones...
                </div>
            </div>
            <div style="padding: 1rem; border-top: 1px solid #333; text-align: center;">
                <button onclick="markAllNotificationsRead()" style="background: #0070f3; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">
                    Marcar todas como leídas
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    loadUserNotifications();
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeNotificationCenter();
        }
    });
}

function loadUserNotifications() {
    if (!currentUser) return;
    
    db.collection('notifications')
        .where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get()
        .then(snapshot => {
            const notificationList = document.getElementById('notification-list');
            if (!notificationList) return;
            
            if (snapshot.empty) {
                notificationList.innerHTML = `
                    <div style="text-align: center; color: #666; padding: 2rem;">
                        <i class="fas fa-bell-slash" style="font-size: 2rem; margin-bottom: 1rem;"></i><br>
                        No tienes notificaciones
                    </div>
                `;
                return;
            }
            
            let html = '';
            snapshot.forEach(doc => {
                const notification = { id: doc.id, ...doc.data() };
                const date = notification.createdAt ? 
                    notification.createdAt.toDate().toLocaleString('es-ES') : 
                    'Fecha no disponible';
                
                html += `
                    <div style="padding: 1rem; border: 1px solid #333; border-radius: 8px; margin-bottom: 1rem; 
                                background: ${notification.read ? '#2a2a2a' : '#0070f320'}; 
                                ${!notification.read ? 'border-left: 4px solid #0070f3;' : ''}">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <span style="font-size: 1.2rem;">${getNotificationIcon(notification.type)}</span>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; color: ${notification.read ? '#ccc' : '#fff'};">
                                    ${notification.title}
                                </div>
                                <div style="font-size: 0.8rem; color: #999;">
                                    ${date}
                                </div>
                            </div>
                            ${!notification.read ? '<div style="width: 8px; height: 8px; background: #0070f3; border-radius: 50%;"></div>' : ''}
                        </div>
                        <div style="color: ${notification.read ? '#999' : '#ccc'}; line-height: 1.4;">
                            ${notification.message}
                        </div>
                        ${notification.orderNumber ? 
                            `<div style="margin-top: 0.5rem; font-size: 0.8rem; color: #0070f3;">
                                Pedido: #${notification.orderNumber}
                            </div>` : ''
                        }
                    </div>
                `;
            });
            
            notificationList.innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading notifications:', error);
        });
}

function closeNotificationCenter() {
    const modal = document.getElementById('notification-center-modal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => modal.remove(), 300);
    }
}

function markAllNotificationsRead() {
    if (!currentUser) return;
    
    db.collection('notifications')
        .where('userId', '==', currentUser.uid)
        .where('read', '==', false)
        .get()
        .then(snapshot => {
            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.update(doc.ref, { 
                    read: true, 
                    readAt: firebase.firestore.FieldValue.serverTimestamp() 
                });
            });
            return batch.commit();
        })
        .then(() => {
            updateNotificationBadge();
            loadUserNotifications();
            showNotification('Todas las notificaciones marcadas como leídas', 'success');
        })
        .catch(error => {
            console.error('Error marking notifications as read:', error);
            showNotification('Error marcando notificaciones como leídas', 'error');
        });
}

function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        console.log('Could not play notification sound:', error);
    }
}

const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    .real-time-notification {
        transition: all 0.3s ease;
    }
    
    .real-time-notification:hover {
        transform: translateX(-5px);
        box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4) !important;
    }
    
    #notification-center-modal {
        backdrop-filter: blur(5px);
    }
`;
document.head.appendChild(notificationStyles);

function testNotification() {
    if (!currentUser) {
        showNotification('Debes estar autenticado para probar notificaciones', 'warning');
        return;
    }
    
    const testNotification = {
        id: 'test-' + Date.now(),
        type: 'order_confirmed',
        title: '¡Pedido de Prueba Confirmado!',
        message: 'Esta es una notificación de prueba para verificar que el sistema funciona correctamente.',
        orderNumber: 'TEST-123456',
        createdAt: { toDate: () => new Date() },
        read: false
    };
    
    showRealTimeNotification(testNotification);
}

window.testNotification = testNotification;

// ========================================
// SISTEMA DE BLOQUEO DE USUARIOS
// ========================================

let blockCheckInterval;

function startBlockedCheck() {
    blockCheckInterval = setInterval(() => {
        const user = auth.currentUser;
        if (user) {
            db.collection('users').doc(user.uid).get()
                .then(doc => {
                    if (doc.exists && doc.data().blocked === true) {
                        clearInterval(blockCheckInterval);
                        handleBlockedUser();
                    }
                })
                .catch(error => {
                    console.error('Error en verificación periódica:', error);
                });
        }
    }, 30000);
}

function handleBlockedUser() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
    `;
    
    modal.innerHTML = `
        <div style="background: #1a1a1a; padding: 30px; border-radius: 10px; 
                    text-align: center; border: 2px solid #dc3545; max-width: 400px;">
            <h2 style="color: #dc3545; margin-bottom: 15px;">
                <i class="fas fa-exclamation-triangle"></i> Cuenta Bloqueada
            </h2>
            <p style="color: #ccc; margin-bottom: 20px;">
                Tu cuenta ha sido bloqueada por el administrador. 
                Serás redirigido a la página de inicio.
            </p>
            <p style="color: #888; font-size: 14px;">
                Si crees que esto es un error, contacta con soporte.
            </p>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => {
        auth.signOut().then(() => {
            window.location.href = 'ps5.html';
        });
    }, 3000);
}

auth.onAuthStateChanged((user) => {
    if (user) {
        db.collection('users').doc(user.uid).get()
            .then(doc => {
                if (doc.exists && doc.data().blocked === true) {
                    handleBlockedUser();
                } else {
                    startBlockedCheck();
                }
            });
    } else {
        if (blockCheckInterval) {
            clearInterval(blockCheckInterval);
        }
    }
});

window.addEventListener('beforeunload', () => {
    if (blockCheckInterval) {
        clearInterval(blockCheckInterval);
    }
});

// ========================================
// SISTEMA DE BÚSQUEDA MEJORADO
// ========================================

function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim().toLowerCase();
    
    if (!query) {
        hideSearchResults();
        return;
    }
    
    const results = searchDatabase.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
    
    displaySearchResults(results, query);
}

function displaySearchResults(results, query) {
    let searchResultsContainer = document.getElementById('searchResults');
    
    if (!searchResultsContainer) {
        searchResultsContainer = document.createElement('div');
        searchResultsContainer.id = 'searchResults';
        searchResultsContainer.className = 'search-results';
        
        const searchContainer = document.querySelector('.search-container');
        searchContainer.style.position = 'relative';
        searchContainer.appendChild(searchResultsContainer);
    }
    
    if (results.length === 0) {
        searchResultsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 10px; color: #0070f3;"></i>
                <p>No se encontraron resultados para "${query}"</p>
                <p style="font-size: 0.9rem; color: #888; margin-top: 10px;">Intenta con otras palabras clave</p>
            </div>
        `;
    } else {
        let resultsHTML = '';
        
        results.forEach(item => {
            const highlightedTitle = highlightText(item.title, query);
            const highlightedType = highlightText(item.type, query);
            
            resultsHTML += `
                <div class="search-result-item" onclick="selectSearchResult('${item.id}', '${item.section}')">
                    <img src="${item.image}" alt="${item.title}" class="search-result-image" 
                        onerror="this.src='https://via.placeholder.com/50x50/333333/ffffff?text=PS'">
                    <div class="search-result-info">
                        <div class="search-result-title">${highlightedTitle}</div>
                        <div style="display: flex; align-items: center;">
                            <span class="search-result-price">${item.price.toFixed(2)}</span>
                            <span class="search-result-type">${highlightedType}</span>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right" style="color: #0070f3; margin-left: 10px;"></i>
                </div>
            `;
        });
        
        resultsHTML = `
            <div style="padding: 10px 15px; border-bottom: 1px solid #333; color: #0070f3; font-size: 0.9rem; background: rgba(0, 112, 243, 0.1);">
                <i class="fas fa-search"></i> ${results.length} resultado${results.length !== 1 ? 's' : ''} encontrado${results.length !== 1 ? 's' : ''}
            </div>
            ${resultsHTML}
        `;
        
        searchResultsContainer.innerHTML = resultsHTML;
    }
    
    searchResultsContainer.style.display = 'block';
}

function highlightText(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

function selectSearchResult(productId, sectionId) {
    const product = searchDatabase.find(item => item.id === productId);
    
    if (product) {
        let targetSection = product.category;
        
        showSection(targetSection);
        
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const linkText = link.textContent.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            if (linkText.includes(targetSection) || 
                (targetSection === 'juegos' && linkText === 'juegos') ||
                (targetSection === 'ps4' && linkText === 'ps4') ||
                (targetSection === 'ps5' && linkText === 'ps5')) {
                markActiveLink(link);
            }
        });
        
        hideSearchResults();
        document.getElementById('searchInput').value = '';
        
        setTimeout(() => {
            if (targetSection === 'juegos') {
                scrollToProductInMainPage(productId, product);
            } else {
                highlightProductInOtherSection(productId, product);
            }
            showNotification(`Producto encontrado: ${product.title}`, 'success');
        }, 500);
    }
}

function scrollToProductInMainPage(productId, product) {
    let productElement = null;
    let carouselSection = null;
    
    const featuredCards = document.querySelectorAll('.featured-games .game-card');
    featuredCards.forEach(card => {
        const title = card.querySelector('h3');
        if (title && title.textContent.trim() === product.title) {
            productElement = card;
            carouselSection = 'featured';
        }
    });
    
    const ps5Cards = document.querySelectorAll('.ps5-available-section .ps5-available-card');
    ps5Cards.forEach(card => {
        const title = card.querySelector('h3');
        if (title && title.textContent.trim() === product.title) {
            productElement = card;
            carouselSection = 'ps5-available';
        }
    });
    
    if (productElement && carouselSection) {
        if (carouselSection === 'featured') {
            scrollToFeaturedGameSection(productElement);
        } else if (carouselSection === 'ps5-available') {
            scrollToPS5AvailableSection(productElement);
        }
    } else {
        scrollToDefaultPS5Available();
    }
}

function scrollToFeaturedGameSection(productElement) {
    const container = document.querySelector('.games-container');
    const cards = Array.from(document.querySelectorAll('.featured-games .game-card'));
    
    const cardIndex = cards.indexOf(productElement);
    
    if (cardIndex !== -1) {
        currentGameSlide = cardIndex;
        const cardWidth = 330;
        const translateX = -currentGameSlide * cardWidth;
        container.style.transform = `translateX(${translateX}px)`;
    }
    
    const featuredSection = document.querySelector('.featured-games');
    if (featuredSection) {
        setTimeout(() => {
            const yOffset = -100;
            const y = featuredSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
            
            window.scrollTo({
                top: y,
                behavior: 'smooth'
            });
            
            setTimeout(() => {
                highlightCard(productElement);
            }, 1000);
        }, 300);
    }
}

function scrollToPS5AvailableSection(productElement) {
    const container = document.querySelector('.ps5-available-container');
    const cards = Array.from(document.querySelectorAll('.ps5-available-section .ps5-available-card'));
    
    const cardIndex = cards.indexOf(productElement);
    
    if (cardIndex !== -1) {
        currentPS5Slide = cardIndex;
        updatePS5Carousel();
        updatePS5Dots();
    }
    
    const ps5Section = document.querySelector('.ps5-available-section');
    if (ps5Section) {
        setTimeout(() => {
            const yOffset = -100;
            const y = ps5Section.getBoundingClientRect().top + window.pageYOffset + yOffset;
            
            window.scrollTo({
                top: y,
                behavior: 'smooth'
            });
            
            setTimeout(() => {
                highlightCard(productElement);
            }, 1000);
        }, 300);
    }
}

function scrollToDefaultPS5Available() {
    const ps5Section = document.querySelector('.ps5-available-section');
    if (ps5Section) {
        setTimeout(() => {
            const yOffset = -100;
            const y = ps5Section.getBoundingClientRect().top + window.pageYOffset + yOffset;
            
            window.scrollTo({
                top: y,
                behavior: 'smooth'
            });
        }, 300);
    }
}

function highlightCard(card) {
    const originalBoxShadow = card.style.boxShadow;
    const originalTransform = card.style.transform;
    const originalBorder = card.style.border;
    
    card.style.boxShadow = '0 0 0 4px #0070f3, 0 0 30px rgba(0, 112, 243, 0.8), 0 0 60px rgba(0, 112, 243, 0.4)';
    card.style.border = '2px solid #0070f3';
    card.style.transform = 'scale(1.05)';
    card.style.transition = 'all 0.3s ease';
    card.style.zIndex = '100';
    
    let pulseCount = 0;
    const pulseInterval = setInterval(() => {
        if (pulseCount % 2 === 0) {
            card.style.boxShadow = '0 0 0 4px #0070f3, 0 0 30px rgba(0, 112, 243, 0.8), 0 0 60px rgba(0, 112, 243, 0.4)';
            card.style.transform = 'scale(1.05)';
        } else {
            card.style.boxShadow = '0 0 0 2px #0070f3, 0 0 15px rgba(0, 112, 243, 0.5)';
            card.style.transform = 'scale(1.02)';
        }
        pulseCount++;
        
        if (pulseCount >= 6) {
            clearInterval(pulseInterval);
            
            setTimeout(() => {
                card.style.boxShadow = originalBoxShadow;
                card.style.transform = originalTransform;
                card.style.border = originalBorder;
                card.style.zIndex = '';
            }, 2000);
        }
    }, 400);
}

function highlightProductInOtherSection(productId, product) {
    setTimeout(() => {
        let productElement = null;
        
        const allCards = document.querySelectorAll('.game-card, .ps5-available-card');
        allCards.forEach(card => {
            const title = card.querySelector('h3');
            const image = card.querySelector('img');
            
            if (title && title.textContent.trim() === product.title) {
                productElement = card;
            }
        });
        
        if (!productElement) {
            const allContainers = document.querySelectorAll('[style*="grid"]');
            allContainers.forEach(container => {
                const cards = container.querySelectorAll('div[style*="background"]');
                cards.forEach(card => {
                    const h3 = card.querySelector('h3');
                    const img = card.querySelector('img');
                    
                    if (h3 && h3.textContent.trim() === product.title) {
                        productElement = card;
                    } else if (img && img.alt === product.title) {
                        productElement = card;
                    }
                });
            });
        }
        
        if (productElement) {
            const yOffset = -120;
            const y = productElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
            
            window.scrollTo({
                top: y,
                behavior: 'smooth'
            });
            
            setTimeout(() => {
                highlightCard(productElement);
            }, 800);
        } else {
            window.scrollTo({
                top: 200,
                behavior: 'smooth'
            });
        }
    }, 300);
}

function hideSearchResults() {
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
        searchResults.style.display = 'none';
    }
}

function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    
    if (!searchInput) {
        console.error('No se encontró el input de búsqueda');
        return;
    }
    
    searchInput.addEventListener('input', function() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            performSearch();
        }, 300);
    });
    
    document.addEventListener('click', function(e) {
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer && !searchContainer.contains(e.target)) {
            hideSearchResults();
        }
    });
    
    searchInput.addEventListener('keydown', function(e) {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults || searchResults.style.display === 'none') return;
        
        const results = searchResults.querySelectorAll('.search-result-item');
        let currentIndex = -1;
        
        results.forEach((result, index) => {
            if (result.style.background.includes('0, 112, 243')) {
                currentIndex = index;
            }
        });
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentIndex = (currentIndex + 1) % results.length;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentIndex = (currentIndex - 1 + results.length) % results.length;
        } else if (e.key === 'Enter' && currentIndex !== -1) {
            e.preventDefault();
            results[currentIndex].click();
            return;
        }
        
        results.forEach(result => {
            result.style.background = '';
            result.style.borderLeft = 'none';
        });
        
        if (currentIndex !== -1) {
            results[currentIndex].style.background = 'rgba(0, 112, 243, 0.1)';
            results[currentIndex].style.borderLeft = '3px solid #0070f3';
        }
    });
}

function handleSearch(query) {
    if (query.trim()) {
        document.getElementById('searchInput').value = query;
        performSearch();
    }
}

// ========================================
// FUNCIONES AUXILIARES
// ========================================

// Event listeners
function initializeEventListeners() {
    window.addEventListener('click', function(event) {
        const cartModal = document.getElementById('cartModal');
        
        if (event.target === cartModal) {
            cartModal.style.display = 'none';
        }
    });
    
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    const infoButtons = document.querySelectorAll('.info-btn');
    infoButtons.forEach((btn, index) => {
        btn.addEventListener('click', function() {
            const gameCard = this.closest('.game-card');
            const gameTitle = gameCard.querySelector('h3').textContent;
            showNotification(`Navegando a detalles de: ${gameTitle}`, 'info');
        });
    });
}

// Función para añadir botones de "Añadir al carrito" a las tarjetas de juego
function addCartButtonsToGames() {
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach((card, index) => {
        let addToCartBtn = card.querySelector('.add-to-cart-btn');
        
        const gameInfo = card.querySelector('.game-info');
        const title = card.querySelector('h3').textContent;
        const image = card.querySelector('img').src;

        const gamePricesSection1 = {
            'The Last of Us': 59.99,
            'God of War': 49.99,
            'Unchartedâ„¢': 39.99,
            'Resident Evil': 44.99,
            'Final Fantasy': 57.99,
            'Marvel\'s Spider-Man': 69.99,
            'EA Sports FC 25': 87.99,
            'NBA 2K25': 47.99,
            'Horizon Forbidden West': 59.99
        };

        const price = gamePricesSection1[title] || 49.99;
        
        if (!addToCartBtn && gameInfo) {
            addToCartBtn = document.createElement('button');
            addToCartBtn.className = 'add-to-cart-btn';
            addToCartBtn.style.cssText = `
                background: #0070f3;
                color: white;
                border: none;
                margin-top: 10px;
                padding: 10px 20px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s;
                width: 100%;
            `;
            
            addToCartBtn.addEventListener('mouseenter', function() {
                this.style.background = '#0056b3';
                this.style.transform = 'translateY(-2px)';
            });
            
            addToCartBtn.addEventListener('mouseleave', function() {
                this.style.background = '#0070f3';
                this.style.transform = 'translateY(0)';
            });
            
            addToCartBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                addToCart(`game-${index}`, title, price, image);
            });
            
            gameInfo.appendChild(addToCartBtn);
        }
        
        if (addToCartBtn) {
            addToCartBtn.textContent = `Añadir - ${price.toFixed(2)}`;
        }
    });
}

// Función para añadir botones a las tarjetas PS5
function addCartButtonsToPS5Games() {
    const ps5Cards = document.querySelectorAll('.ps5-available-card');
    
    ps5Cards.forEach((card, index) => {
        let addToCartBtn = card.querySelector('.add-to-cart-btn');
        
        const cardInfo = card.querySelector('.card-info');
        const title = card.querySelector('h3').textContent;
        const image = card.querySelector('img').src;
        
        const gamePrices = {
            'Marvel\'s Spider-Man 2': 69.99,
            'ASTRO BOT': 59.99,
            'HELLDIVERSâ„¢ 2': 49.99,
            'God of War Ragnarök': 69.99,
            'Horizon Forbidden West': 59.99,
            'The Last of Us Part I': 69.99,
            'Grand Theft Auto V': 39.99,
            'PES 2021': 29.99,
            'Ratchet & Clank: Rift Apart': 69.99
        };
        
        const price = gamePrices[title] || 59.99;
        
        if (!addToCartBtn && cardInfo) {
            addToCartBtn = document.createElement('button');
            addToCartBtn.className = 'add-to-cart-btn';
            addToCartBtn.style.cssText = `
                background: #0070f3;
                color: white;
                border: none;
                margin-top: 10px;
                padding: 10px 20px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s;
                width: 100%;
            `;
            
            addToCartBtn.addEventListener('mouseenter', function() {
                this.style.background = '#0056b3';
                this.style.transform = 'translateY(-2px)';
            });
            
            addToCartBtn.addEventListener('mouseleave', function() {
                this.style.background = '#0070f3';
                this.style.transform = 'translateY(0)';
            });
            
            addToCartBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                addToCart(`ps5-game-${index}`, title, price, image);
            });
            
            cardInfo.appendChild(addToCartBtn);
        }
        
        if (addToCartBtn) {
            addToCartBtn.textContent = `Añadir - ${price.toFixed(2)}`;
        }
    });
}

// Función para añadir estilos del menú de usuario
function addUserMenuStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .user-menu {
            position: relative;
        }
        
        .user-dropdown {
            position: absolute;
            top: 50px;
            right: 0;
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 8px;
            min-width: 220px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            z-index: 1000;
            overflow: hidden;
        }
        
        .dropdown-item {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            color: #fff;
            cursor: pointer;
            transition: background 0.3s;
            font-size: 14px;
        }
        
        .dropdown-item i {
            width: 20px;
            margin-right: 12px;
        }
        
        .dropdown-item:hover {
            background: #0070f3;
        }
        
        .dropdown-item.logout-item {
            color: #ff4757;
        }
        
        .dropdown-item.logout-item:hover {
            background: #ff4757;
            color: white;
        }
        
        .dropdown-divider {
            height: 1px;
            background: #333;
            margin: 8px 0;
        }
        
        .profile-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        }
        
        .profile-modal-content {
            background: #1a1a1a;
            border-radius: 12px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            position: relative;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        
        .close-profile {
            position: absolute;
            top: 15px;
            right: 20px;
            font-size: 28px;
            color: #ccc;
            cursor: pointer;
            transition: color 0.3s;
        }
        
        .close-profile:hover {
            color: #fff;
        }
        
        .profile-modal h2 {
            color: #fff;
            margin-bottom: 25px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .profile-info {
            margin-bottom: 25px;
        }
        
        .profile-field {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #333;
        }
        
        .profile-field:last-child {
            border-bottom: none;
        }
        
        .profile-field label {
            font-weight: bold;
            color: #ccc;
        }
        
        .profile-field span {
            color: #fff;
        }
        
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .cart-item {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            padding: 10px;
            background: #2a2a2a;
            border-radius: 8px;
        }
        
        .notification {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .add-to-cart-btn {
            background: #0070f3;
            color: white;
            border: none;
            margin-top: 10px;
            padding: 10px 20px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s;
            width: 100%;
        }
        
        .add-to-cart-btn:hover {
            background: #0056b3;
            transform: translateY(-2px);
        }
        
        .add-to-cart-btn:active {
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);
}

// Responsive carousel handling
function handleResize() {
    currentGameSlide = 0;
    currentPS5Slide = 0;
    currentPlusSlide = 0;
    
    const gamesContainer = document.querySelector('.games-container');
    const ps5Container = document.querySelector('.ps5-available-container');
    const plusContainer = document.querySelector('.plus-container');
    
    if (gamesContainer) gamesContainer.style.transform = 'translateX(0px)';
    if (ps5Container) {
        ps5Container.style.transform = 'translateX(0px)';
        const cards = document.querySelectorAll('.ps5-available-card');
        cards.forEach(card => card.classList.remove('featured-card'));
        if (cards[0]) cards[0].classList.add('featured-card');
        updatePS5Dots();
    }
    if (plusContainer) plusContainer.style.transform = 'translateX(0px)';
}

window.addEventListener('resize', handleResize);

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});


// ========================================
// ANUNCIO DE SALUD - Juega Responsablemente
// ========================================

function showHealthWarning() {
    // Verificar si ya se marcó "no mostrar nuevamente" en ESTA sesión
    const dontShow = sessionStorage.getItem('dontShowHealthWarning');
    if (dontShow === 'true') {
        return; // No mostrar el anuncio en esta sesión
    }
    
    const warning = document.getElementById('healthWarning');
    if (warning) {
        // Esperar un poco para que cargue la página
        setTimeout(() => {
            warning.style.display = 'block';
        }, 2000); // Aparece después de 2 segundos
    }
}

function closeHealthWarning() {
    const warning = document.getElementById('healthWarning');
    const dontShowCheckbox = document.getElementById('dontShowAgain');
    
    if (warning) {
        warning.style.display = 'none';
    }
    
    // Guardar preferencia SOLO para esta sesión si marcó el checkbox
    if (dontShowCheckbox && dontShowCheckbox.checked) {
        sessionStorage.setItem('dontShowHealthWarning', 'true');
    }
}

// Modificar el event listener para incluir el anuncio
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM listo');
    
    // Inicializar la app normalmente
    setTimeout(function() {
        initializeApp();
        
        // Mostrar anuncio de salud después de inicializar
        showHealthWarning();
    }, 500);
});

// La función initializeApp se mantiene igual


// ✅ AÑADIR AL FINAL DEL ARCHIVO, ANTES DEL ÚLTIMO CIERRE
function addSubscriptionStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Badge de suscripción en header */
        .subscription-badge {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            margin-left: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            animation: subtle-pulse 3s infinite;
        }
        
        .subscription-badge.extra {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        
        .subscription-badge.premium {
            background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
            box-shadow: 0 2px 12px rgba(255, 215, 0, 0.5);
        }
        
        @keyframes subtle-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        /* Sección de suscripción en perfil */
        .subscription-section {
            margin-top: 25px;
            padding-top: 20px;
            border-top: 1px solid #333;
        }
        
        .subscription-section h3 {
            color: #0070f3;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .subscription-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            border-radius: 12px;
            color: white;
        }
        
        .subscription-card.extra {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        
        .subscription-card.premium {
            background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
        }
        
        .subscription-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .subscription-name {
            font-size: 1.5rem;
            font-weight: 700;
        }
        
        .subscription-discount {
            background: rgba(255, 255, 255, 0.3);
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.9rem;
        }
        
        .subscription-details p {
            margin: 8px 0;
            display: flex;
            align-items: center;
            gap: 8px;
            opacity: 0.95;
        }
        
        .upgrade-btn {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid white;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            cursor: pointer;
            font-weight: 600;
            margin-top: 15px;
            transition: all 0.3s;
            width: 100%;
        }
        
        .upgrade-btn:hover {
            background: white;
            color: #667eea;
        }
        
        .max-tier {
            text-align: center;
            padding: 12px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            margin-top: 15px;
            font-weight: 600;
        }
        
        /* Modal de suscripciones */
        .subscription-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3000;
            animation: fadeIn 0.3s;
        }
        
        .subscription-modal-content {
            background: #1a1a1a;
            border-radius: 15px;
            padding: 30px;
            max-width: 900px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
        }
        
        .close-subscription {
            position: absolute;
            top: 15px;
            right: 20px;
            font-size: 28px;
            color: #ccc;
            cursor: pointer;
        }
        
        .current-subscription {
            text-align: center;
            margin: 30px 0;
        }
        
        .subscription-badge-large {
            display: inline-block;
            padding: 15px 40px;
            border-radius: 30px;
            font-size: 1.5rem;
            font-weight: 700;
            color: white;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin-bottom: 10px;
        }
        
        .subscription-badge-large.extra {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        
        .subscription-badge-large.premium {
            background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
        }
        
        .subscription-plans {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        
        .plan {
            background: #2a2a2a;
            padding: 25px;
            border-radius: 12px;
            border: 2px solid transparent;
            transition: all 0.3s;
        }
        
        .plan.active {
            border-color: #0070f3;
            box-shadow: 0 0 20px rgba(0, 112, 243, 0.3);
        }
        
        .plan.premium {
            background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 140, 0, 0.1) 100%);
        }
        
        .plan h3 {
            color: #0070f3;
            margin-bottom: 10px;
        }
        
        .plan-discount {
            background: #0070f3;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-block;
            font-weight: 600;
            margin-bottom: 15px;
        }
        
        .plan ul {
            list-style: none;
            padding: 0;
            margin: 15px 0;
        }
        
        .plan ul li {
            padding: 8px 0;
            color: #ccc;
        }
        
        .plan ul li::before {
            content: "✓ ";
            color: #4caf50;
            font-weight: bold;
            margin-right: 8px;
        }
        
        .plan-price {
            font-size: 1.5rem;
            font-weight: 700;
            color: #fff;
            margin-top: 15px;
        }
           /* Precios con descuento en las tarjetas */
        .price-container {
display: flex;
align-items: center;
gap: 8px;
flex-wrap: wrap;
}
.price-original {
        text-decoration: line-through;
        opacity: 0.5;
        font-size: 0.9rem;
    }
    
    .price-discount-badge {
        background: #4caf50;
        color: white;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    
    .price-final {
        color: #0070f3;
        font-weight: 700;
        font-size: 1.1rem;
    }
`;
document.head.appendChild(style);
}


// ========================================
// SISTEMA DE SOLICITUD DE SUSCRIPCIONES
// ========================================

/**
 * Abre el modal de pago para un plan específico
 */
function openSubscriptionPaymentModal(plan) {
    console.log('Abriendo modal para plan:', plan);
    
    // Verificar autenticación
    if (!isLoggedIn || !currentUser) {
        showNotification('Debes iniciar sesión para suscribirte', 'warning');
        setTimeout(() => {
            window.location.href = 'auth.html?redirect=ps5.html';
        }, 1500);
        return;
    }
    
    // ✅ NUEVO: Lógica de cambio de plan
    if (currentUserSubscription !== 'none') {
        // Si ya tiene el mismo plan, mostrar mensaje
        if (currentUserSubscription === plan) {
            showNotification(`Ya tienes suscripción ${currentUserSubscription} activa`, 'info');
            return;
        } else {
            // ✅ PERMITIR CAMBIO DE PLAN
            if (confirm(`¿Quieres cambiar de ${currentUserSubscription} a ${plan}?\n\nTu solicitud será revisada por un administrador.`)) {
                selectedSubscriptionPlan = plan;
                
                // Mostrar modal con indicador de cambio
                const modal = document.getElementById('subscriptionPaymentModal');
                modal.style.display = 'block';
                
                // ✅ Mostrar aviso de cambio de plan
                displayPlanChangeNotice(currentUserSubscription, plan);
                
                // Configurar información del plan
                const planInfo = getSubscriptionPlanInfo(plan);
                displaySelectedPlanInfo(planInfo);
                resetSubscriptionForm();
                
                return;
            } else {
                return;
            }
        }
    }
    
    // Verificar si ya tiene solicitud pendiente
    if (subscriptionRequestStatus === 'pending') {
        showNotification(`Ya tienes una solicitud de suscripción en revisión para el plan ${subscriptionRequestedPlan}`, 'info');
        return;
    }
    
    // Flujo normal para usuarios sin suscripción
    selectedSubscriptionPlan = plan;
    const planInfo = getSubscriptionPlanInfo(plan);
    
    const modal = document.getElementById('subscriptionPaymentModal');
    modal.style.display = 'block';
    
    displaySelectedPlanInfo(planInfo);
    resetSubscriptionForm();
}


/**
 * ✅ NUEVA FUNCIÓN - Muestra aviso de cambio de plan en el modal
 */
function displayPlanChangeNotice(currentPlan, newPlan) {
    const planInfoDisplay = document.getElementById('planInfoDisplay');
    
    // Agregar aviso de cambio al inicio del modal
    const changeNotice = document.createElement('div');
    changeNotice.id = 'planChangeNotice';
    changeNotice.style.cssText = `
        background: linear-gradient(135deg, rgba(255,193,7,0.2), rgba(255,152,0,0.2));
        border-left: 4px solid #ffc107;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 12px;
    `;
    
    changeNotice.innerHTML = `
        <i class="fas fa-exchange-alt" style="color: #ffc107; font-size: 1.5rem;"></i>
        <div>
            <strong style="color: #ffc107; display: block; margin-bottom: 5px;">
                Cambiando de plan
            </strong>
            <span style="color: #ccc;">
                <strong>${currentPlan}</strong> → <strong style="color: #0070f3;">${newPlan}</strong>
            </span>
            <p style="font-size: 0.85rem; margin-top: 8px; color: #999;">
                Tu suscripción actual se mantendrá hasta que un administrador apruebe el cambio.
            </p>
        </div>
    `;
    
    // Insertar al inicio del planInfoDisplay
    planInfoDisplay.insertBefore(changeNotice, planInfoDisplay.firstChild);
}

/**
 * Cierra el modal de pago
 */
function closeSubscriptionPaymentModal() {
    const modal = document.getElementById('subscriptionPaymentModal');
    modal.style.display = 'none';
    selectedSubscriptionPlan = null;
    resetSubscriptionForm();
}

/**
 * Obtiene información del plan
 */
function getSubscriptionPlanInfo(plan) {
    const plans = {
        'Essential': {
            name: 'Essential',
            price: 9.99,
            discount: 5,
            color1: '#667eea',
            color2: '#764ba2',
            features: [
                '2-3 juegos gratuitos mensuales',
                'Multijugador online',
                'Descuentos del 5%',
                'Almacenamiento en la nube'
            ]
        },
        'Extra': {
            name: 'Extra',
            price: 14.99,
            discount: 15,
            color1: '#f093fb',
            color2: '#f5576c',
            features: [
                'Todo de Essential',
                '+400 juegos del catálogo',
                'Descuentos del 15%',
                'Acceso anticipado a demos'
            ]
        },
        'Premium': {
            name: 'Premium',
            price: 17.99,
            discount: 25,
            color1: '#4facfe',
            color2: '#00f2fe',
            features: [
                'Todo de Extra',
                '+740 juegos en total',
                'Descuentos del 25%',
                'Clásicos de PS1, PS2, PS3',
                'Streaming en la nube'
            ]
        }
    };
    
    return plans[plan] || plans['Essential'];
}

/**
 * Muestra información del plan seleccionado en el modal
 */
function displaySelectedPlanInfo(planInfo) {
    const container = document.getElementById('planInfoDisplay');
    
    container.innerHTML = `
        <div class="plan-display-card" style="--plan-color-1: ${planInfo.color1}; --plan-color-2: ${planInfo.color2};">
            <h3>${planInfo.name}</h3>
            <div class="plan-discount">
                <i class="fas fa-tag"></i> ${planInfo.discount}% de descuento en juegos
            </div>
            <div class="plan-price">$${planInfo.price.toFixed(2)}<span style="font-size: 1rem;">/mes</span></div>
        </div>
    `;
    
    // Actualizar resumen
    document.getElementById('summaryPlan').textContent = `PlayStation Plus ${planInfo.name}`;
    document.getElementById('summaryPrice').textContent = `$${planInfo.price.toFixed(2)}/mes`;
    document.getElementById('summaryDiscount').textContent = `${planInfo.discount}% en todos los juegos`;
    document.getElementById('summaryTotal').textContent = `$${planInfo.price.toFixed(2)}`;
}

/**
 * Formatea el número de tarjeta
 */
function formatSubCardNumber(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 16) {
        value = value.substring(0, 16);
    }
    
    let formattedValue = '';
    for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) {
            formattedValue += ' ';
        }
        formattedValue += value[i];
    }
    
    input.value = formattedValue;
    
    // Validación visual
    const error = document.getElementById('subCardNumberError');
    if (value.length === 16) {
        input.style.borderColor = '#4caf50';
        error.style.display = 'none';
    } else if (value.length > 0) {
        input.style.borderColor = '#ff9800';
    } else {
        input.style.borderColor = '#444';
    }
}

/**
 * Formatea la fecha de expiración
 */
function formatSubCardExpiry(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    
    input.value = value;
    
    // Validación básica
    const error = document.getElementById('subCardExpiryError');
    if (value.length === 5) {
        const [month, year] = value.split('/');
        const monthNum = parseInt(month);
        
        if (monthNum >= 1 && monthNum <= 12) {
            input.style.borderColor = '#4caf50';
            error.style.display = 'none';
        } else {
            input.style.borderColor = '#f44336';
            error.textContent = 'Mes inválido (01-12)';
            error.style.display = 'block';
        }
    } else if (value.length > 0) {
        input.style.borderColor = '#ff9800';
    }
}

/**
 * Procesa el pago de suscripción (ficticio)
 */
async function processSubscriptionPayment(event) {
    event.preventDefault();
    
    if (!validateSubscriptionForm()) {
        return;
    }
    
    const submitBtn = document.getElementById('submitSubscriptionBtn');
    const btnText = submitBtn.querySelector('span');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const userName = userDoc.exists ? userDoc.data().name : 'Usuario';
        
        // ✅ NUEVO: Detectar si es cambio de plan
        const isChangePlan = currentUserSubscription !== 'none';
        
        // Crear solicitud
        const requestData = {
            userId: currentUser.uid,
            userName: userName,
            userEmail: currentUser.email,
            requestedPlan: selectedSubscriptionPlan,
            planPrice: getSubscriptionPlanInfo(selectedSubscriptionPlan).price,
            status: 'pending',
            type: isChangePlan ? 'change_plan' : 'new_subscription', // ✅ NUEVO
            currentPlan: isChangePlan ? currentUserSubscription : 'none', // ✅ NUEVO
            cardLastFour: document.getElementById('subCardNumber').value.replace(/\D/g, '').slice(-4),
            cardName: document.getElementById('subCardName').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            processedAt: null,
            processedBy: null
        };
        
        await db.collection('subscriptionRequests').add(requestData);
        
        // Actualizar estado del usuario
        await db.collection('users').doc(currentUser.uid).update({
            subscriptionRequestedPlan: selectedSubscriptionPlan,
            subscriptionRequestStatus: 'pending',
            subscriptionRequestType: isChangePlan ? 'change_plan' : 'new_subscription', // ✅ NUEVO
            subscriptionRequestDate: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        subscriptionRequestedPlan = selectedSubscriptionPlan;
        subscriptionRequestStatus = 'pending';
        
        updateSubscriptionBadge();
        closeSubscriptionPaymentModal();
        
        // ✅ MENSAJE ADAPTADO
        const message = isChangePlan
            ? `¡Solicitud de cambio enviada! Tu solicitud para cambiar de ${currentUserSubscription} a ${selectedSubscriptionPlan} está en revisión.`
            : `¡Solicitud enviada! Tu solicitud para PlayStation Plus ${selectedSubscriptionPlan} está en revisión.`;
        
        showNotification(message, 'success');
        
    } catch (error) {
        console.error('Error procesando solicitud:', error);
        showNotification('Error al enviar la solicitud. Por favor, intenta nuevamente.', 'error');
    } finally {
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

/**
 * Valida el formulario de suscripción
 */
function validateSubscriptionForm() {
    let isValid = true;
    
    // Número de tarjeta
    const cardNumber = document.getElementById('subCardNumber').value.replace(/\D/g, '');
    const cardNumberError = document.getElementById('subCardNumberError');
    
    if (cardNumber.length !== 16) {
        cardNumberError.textContent = 'El número de tarjeta debe tener 16 dígitos';
        cardNumberError.style.display = 'block';
        isValid = false;
    } else {
        cardNumberError.style.display = 'none';
    }
    
    // Nombre en tarjeta
    const cardName = document.getElementById('subCardName').value.trim();
    const cardNameError = document.getElementById('subCardNameError');
    
    if (cardName.length < 3) {
        cardNameError.textContent = 'Ingresa el nombre completo';
        cardNameError.style.display = 'block';
        isValid = false;
    } else {
        cardNameError.style.display = 'none';
    }
    
    // Fecha de expiración
    const cardExpiry = document.getElementById('subCardExpiry').value;
    const cardExpiryError = document.getElementById('subCardExpiryError');
    
    if (cardExpiry.length !== 5 || !cardExpiry.includes('/')) {
        cardExpiryError.textContent = 'Formato debe ser MM/AA';
        cardExpiryError.style.display = 'block';
        isValid = false;
    } else {
        const [month, year] = cardExpiry.split('/');
        const monthNum = parseInt(month);
        
        if (monthNum < 1 || monthNum > 12) {
            cardExpiryError.textContent = 'Mes inválido (01-12)';
            cardExpiryError.style.display = 'block';
            isValid = false;
        } else {
            cardExpiryError.style.display = 'none';
        }
    }
    
    // CVV
    const cardCVV = document.getElementById('subCardCVV').value;
    const cardCVVError = document.getElementById('subCardCVVError');
    
    if (cardCVV.length !== 3) {
        cardCVVError.textContent = 'CVV debe tener 3 dígitos';
        cardCVVError.style.display = 'block';
        isValid = false;
    } else {
        cardCVVError.style.display = 'none';
    }
    
    // Términos y condiciones
    const acceptTerms = document.getElementById('acceptSubscriptionTerms').checked;
    
    if (!acceptTerms) {
        showNotification('Debes aceptar los términos y condiciones', 'warning');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Resetea el formulario de suscripción
 */
function resetSubscriptionForm() {
    document.getElementById('subscriptionPaymentForm').reset();
    
    // Resetear estilos de validación
    const inputs = document.querySelectorAll('#subscriptionPaymentForm input');
    inputs.forEach(input => {
        input.style.borderColor = '#444';
    });
    
    // Ocultar mensajes de error
    const errors = document.querySelectorAll('#subscriptionPaymentForm .field-error');
    errors.forEach(error => {
        error.style.display = 'none';
    });
}

/**
 * Muestra términos y condiciones
 */
function showSubscriptionTerms(event) {
    event.preventDefault();
    
    const termsModal = document.createElement('div');
    termsModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;
    
    termsModal.innerHTML = `
        <div style="background: #1a1a1a; padding: 30px; border-radius: 15px; max-width: 600px; max-height: 80vh; overflow-y: auto;">
            <h2 style="color: #0070f3; margin-bottom: 20px;">Términos y Condiciones - PlayStation Plus</h2>
            <div style="color: #ccc; line-height: 1.6;">
                <p><strong>1. Suscripción:</strong> Al solicitar una suscripción, aceptas que tu solicitud será revisada y aprobada por un administrador.</p>
                <p><strong>2. Pago:</strong> El cargo mensual se realizará automáticamente cada mes hasta que canceles la suscripción.</p>
                <p><strong>3. Descuentos:</strong> Los descuentos solo aplican una vez tu suscripción sea aprobada por un administrador.</p>
                <p><strong>4. Cancelación:</strong> Puedes cancelar tu suscripción en cualquier momento desde tu perfil.</p>
                <p><strong>5. Cambios:</strong> Nos reservamos el derecho de modificar precios y beneficios con aviso previo.</p>
            </div>
            <button onclick="this.closest('div').parentElement.remove()" 
                    style="background: #0070f3; color: white; border: none; padding: 12px 30px; border-radius: 25px; margin-top: 20px; cursor: pointer; width: 100%;">
                Entendido
            </button>
        </div>
    `;
    
    document.body.appendChild(termsModal);
    
    termsModal.addEventListener('click', (e) => {
        if (e.target === termsModal) {
            termsModal.remove();
        }
    });
}

// Cerrar modal al hacer clic fuera
window.addEventListener('click', function(event) {
    const modal = document.getElementById('subscriptionPaymentModal');
    if (event.target === modal) {
        closeSubscriptionPaymentModal();
    }
});

// ==========================================
// FIN DE LAS NUEVAS FUNCIONES
// ==========================================


function setupSubscriptionListener() {
    // Si no hay usuario, salir
    if (!currentUser) {
        console.warn('⚠️ No se puede configurar listener sin usuario');
        return;
    }
    
    // Limpiar listener anterior si existe
    if (subscriptionListener) {
        subscriptionListener();
        subscriptionListener = null;
    }
    
    console.log('👀 Configurando listener de suscripciones para:', currentUser.uid);
    
    // ✅ CORRECCIÓN 1: Listener con reintentos
    let retryCount = 0;
    const maxRetries = 3;
    
    function attachListener() {
        subscriptionListener = db.collection('users')
            .doc(currentUser.uid)
            .onSnapshot((doc) => {
                if (!doc.exists) {
                    console.warn('⚠️ Documento de usuario no existe');
                    return;
                }
                
                const userData = doc.data();
                console.log('📦 Datos recibidos:', userData);
                
                // ✅ CORRECCIÓN 2: Leer estructura multi-plataforma correcta
                const platform = 'ps5'; // Detectar automáticamente o usar parámetro
                const subscriptionData = userData.subscriptions?.[platform];
                
                const newSubscription = subscriptionData?.plan || 'none';
                const newStatus = subscriptionData?.status || 'inactive';
                
                // También leer solicitudes pendientes
                const requestData = userData.subscriptionRequests?.[platform];
                const newRequestStatus = requestData?.requestStatus || null;
                const newRequestedPlan = requestData?.requestedPlan || null;
                
                console.log('🔍 Suscripción actual:', {
                    anterior: currentUserSubscription,
                    nueva: newSubscription,
                    estado: newStatus,
                    solicitud: newRequestStatus
                });
                
                // ✅ CORRECCIÓN 3: Detectar cambios correctamente
                const subscriptionChanged = currentUserSubscription !== newSubscription;
                const statusChanged = newStatus === 'active' && currentUserSubscription === 'none';
                
                if (subscriptionChanged || statusChanged) {
                    console.log('🔄 CAMBIO DETECTADO:', currentUserSubscription, '→', newSubscription);
                    
                    // Actualizar variables globales
                    currentUserSubscription = newSubscription;
                    subscriptionRequestStatus = newRequestStatus;
                    subscriptionRequestedPlan = newRequestedPlan;
                    
                    // ✅ ACTUALIZAR INTERFAZ
                    updateSubscriptionBadge();
                    refreshAllPrices();
                    
                    // Mostrar notificación solo si se activó
                    if (newStatus === 'active' && newSubscription !== 'none') {
                        const planInfo = SubscriptionManager.getPlanInfo(platform, newSubscription);
                        const discount = planInfo ? Math.round(planInfo.discount * 100) : 0;
                        
                        showNotification(
                            `✨ ¡Tu suscripción ${newSubscription} está activa! Descuento del ${discount}% aplicado`,
                            'success'
                        );
                        
                        // 🔔 Reproducir sonido de éxito
                        playNotificationSound();
                    }
                }
                
                // ✅ CORRECCIÓN 4: Manejar cambios de solicitud
                if (subscriptionRequestStatus !== newRequestStatus) {
                    console.log('📝 Estado de solicitud cambió:', subscriptionRequestStatus, '→', newRequestStatus);
                    subscriptionRequestStatus = newRequestStatus;
                    subscriptionRequestedPlan = newRequestedPlan;
                    updateSubscriptionBadge();
                }
                
            }, (error) => {
                console.error('❌ Error en listener de suscripciones:', error);
                
                // ✅ CORRECCIÓN 5: Reintentar en caso de error
                if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(`🔄 Reintentando listener (${retryCount}/${maxRetries})...`);
                    setTimeout(() => attachListener(), 2000 * retryCount);
                } else {
                    console.error('💥 No se pudo establecer listener después de', maxRetries, 'intentos');
                    showNotification('Error conectando con el servidor. Recarga la página.', 'error');
                }
            });
    }
    
    // Iniciar listener
    attachListener();
    
    console.log('✅ Listener de suscripciones configurado correctamente');
}

/**
 * 🔄 FUNCIÓN AUXILIAR: Forzar recarga de suscripción
 */
async function forceReloadSubscription() {
    if (!currentUser) return;
    
    try {
        console.log('🔄 Forzando recarga de suscripción...');
        const doc = await db.collection('users').doc(currentUser.uid).get();
        
        if (doc.exists) {
            const userData = doc.data();
            const platform = 'ps5';
            const subscriptionData = userData.subscriptions?.[platform];
            
            currentUserSubscription = subscriptionData?.plan || 'none';
            subscriptionRequestStatus = userData.subscriptionRequests?.[platform]?.requestStatus || null;
            
            updateSubscriptionBadge();
            refreshAllPrices();
            
            console.log('✅ Suscripción recargada:', currentUserSubscription);
        }
    } catch (error) {
        console.error('Error recargando suscripción:', error);
    }
}


// ========================================
// FUNCIONES GLOBALES PARA MODALES (AGREGAR DESPUÉS DE LAS FUNCIONES PRINCIPALES)
// ========================================

// Hacer funciones globales para que funcionen en onclick
window.addToCartFromWishlist = function(gameId, gameName, price, image, wishlistIndex) {
    addToCart(gameId, gameName, price, image);
    removeFromWishlist(wishlistIndex);
};

window.removeFromWishlist = function(index) {
    if (!currentUser) return;
    
    db.collection('users').doc(currentUser.uid).get()
        .then(doc => {
            const wishlist = doc.data().wishlist || [];
            wishlist.splice(index, 1);
            
            return db.collection('users').doc(currentUser.uid).update({
                wishlist: wishlist
            });
        })
        .then(() => {
            showNotification('Juego eliminado de la lista de deseos', 'success');
            const modal = document.querySelector('.wishlist-modal');
            if (modal) {
                modal.remove();
                viewWishlist();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error al eliminar', 'error');
        });
};

window.addAllToCart = function() {
    if (!currentUser) return;
    
    db.collection('users').doc(currentUser.uid).get()
        .then(doc => {
            const wishlist = doc.data().wishlist || [];
            
            if (wishlist.length === 0) {
                showNotification('La lista está vacía', 'info');
                return;
            }
            
            wishlist.forEach(item => {
                addToCart(item.id, item.name, item.price, item.image);
            });
            
            showNotification(`${wishlist.length} juegos añadidos al carrito`, 'success');
            
            const modal = document.querySelector('.wishlist-modal');
            if (modal) modal.remove();
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error al añadir al carrito', 'error');
        });
};

window.saveSettings = function() {
    if (!currentUser) return;
    
    showLoading(true);
    
    const newName = document.getElementById('userName').value.trim();
    const emailNotifications = document.getElementById('emailNotifications').checked;
    const smsNotifications = document.getElementById('smsNotifications').checked;
    const marketingEmails = document.getElementById('marketingEmails').checked;
    
    db.collection('users').doc(currentUser.uid).update({
        name: newName,
        emailNotifications: emailNotifications,
        smsNotifications: smsNotifications,
        marketingEmails: marketingEmails,
        settingsUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        showLoading(false);
        showNotification('Configuración guardada correctamente', 'success');
        updateLoginButton();
        
        const modal = document.querySelector('.settings-modal');
        if (modal) modal.remove();
    })
    .catch(error => {
        showLoading(false);
        console.error('Error:', error);
        showNotification('Error al guardar configuración', 'error');
    });
};

window.changePassword = function() {
    const currentPassword = prompt('Ingresa tu contraseña actual:');
    if (!currentPassword) return;
    
    const newPassword = prompt('Ingresa tu nueva contraseña (mínimo 6 caracteres):');
    if (!newPassword || newPassword.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'warning');
        return;
    }
    
    const confirmPassword = prompt('Confirma tu nueva contraseña:');
    if (newPassword !== confirmPassword) {
        showNotification('Las contraseñas no coinciden', 'error');
        return;
    }
    
    showLoading(true);
    
    const credential = firebase.auth.EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
    );
    
    currentUser.reauthenticateWithCredential(credential)
        .then(() => {
            return currentUser.updatePassword(newPassword);
        })
        .then(() => {
            showLoading(false);
            showNotification('Contraseña actualizada correctamente', 'success');
        })
        .catch(error => {
            showLoading(false);
            console.error('Error:', error);
            
            if (error.code === 'auth/wrong-password') {
                showNotification('Contraseña actual incorrecta', 'error');
            } else {
                showNotification('Error al cambiar contraseña', 'error');
            }
        });
};

window.confirmDeleteAccount = function() {
    if (!confirm('⚠️ ¿Estás seguro? Esta acción NO se puede deshacer.\n\nSe eliminarán:\n- Tu cuenta\n- Historial de pedidos\n- Lista de deseos\n- Toda tu información')) {
        return;
    }
    
    const password = prompt('Para confirmar, ingresa tu contraseña:');
    if (!password) return;
    
    showLoading(true);
    
    const credential = firebase.auth.EmailAuthProvider.credential(
        currentUser.email,
        password
    );
    
    const userId = currentUser.uid;
    
    currentUser.reauthenticateWithCredential(credential)
        .then(() => {
            return db.collection('users').doc(userId).delete();
        })
        .then(() => {
            return currentUser.delete();
        })
        .then(() => {
            showLoading(false);
            showNotification('Cuenta eliminada correctamente', 'success');
            
            setTimeout(() => {
                window.location.href = 'ps5.html';
            }, 2000);
        })
        .catch(error => {
            showLoading(false);
            console.error('Error:', error);
            
            if (error.code === 'auth/wrong-password') {
                showNotification('Contraseña incorrecta', 'error');
            } else {
                showNotification('Error al eliminar cuenta', 'error');
            }
        });
};

// Función de loading helper
function showLoading(show) {
    let loader = document.getElementById('global-loader');
    
    if (show) {
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            `;
            loader.innerHTML = `
                <div style="background: #1a1a1a; padding: 30px; border-radius: 10px; text-align: center;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #0070f3;"></i>
                    <p style="color: #fff; margin-top: 15px;">Procesando...</p>
                </div>
            `;
            document.body.appendChild(loader);
        }
        loader.style.display = 'flex';
    } else {
        if (loader) {
            loader.style.display = 'none';
        }
    }
}