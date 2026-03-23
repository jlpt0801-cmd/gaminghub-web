// ===============================================
// XBOX STORE - JAVASCRIPT COMPLETO Y ACTUALIZADO
// ===============================================

// Variables globales
let currentHeroSlide = 0;
let currentGameSlide = 0;
let currentXboxSlide = 0;
let currentGamePassSlide = 0;
let isLoggedIn = false;
let cart = [];
// Variables globales de suscripción Xbox
let currentUserSubscription = 'none';
let subscriptionRequestStatus = null;
let subscriptionRequestedPlan = null;
let selectedSubscriptionPlan = null;

// Variables del carrusel Xbox
const totalXboxCards = 9;
const visibleXboxCards = 5;
const centerXboxIndex = Math.floor(visibleXboxCards / 2);

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA8pmCj75_X_3dY-687gb23kXmCr5nqKgo",
  authDomain: "playstation-store-b81cb.firebaseapp.com",
  projectId: "playstation-store-b81cb",
  storageBucket: "playstation-store-b81cb.firebasestorage.app",
  messagingSenderId: "284724171611",
  appId: "1:284724171611:web:fce6bff4c39e09044fc07e"
};

// Inicializar Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();
let currentUser = null;

// BASE DE DATOS DE BÚSQUEDA ACTUALIZADA
const xboxSearchDatabase = [
    // Consolas
    {
        id: 'xbox-series-x',
        title: 'Xbox Series X',
        price: 499.00,
        image: 'https://compass-ssl.xbox.com/assets/d9/1a/d91ae87e-48c8-4007-ab9e-67c1dd7dd017.png',
        type: 'Consola',
        category: 'series',
        section: 'section-series'
    },
    {
        id: 'xbox-series-s',
        title: 'Xbox Series S',
        price: 299.00,
        image: 'https://compass-ssl.xbox.com/assets/cc/82/cc8283f3-7850-4e49-9d91-790b23d928c5.png',
        type: 'Consola',
        category: 'series',
        section: 'section-series'
    },
    
    // Juegos de la sección principal
    {
        id: 'halo-infinite',
        title: 'Halo Infinite',
        price: 59.99,
        image: 'https://wallpapercave.com/wp/wp4813418.png',
        type: 'Juego Xbox',
        category: 'xbox',
        section: 'section-xbox'
    },
    {
        id: 'forza-horizon-5',
        title: 'Forza Horizon 5',
        price: 59.99,
        image: 'https://image.api.playstation.com/vulcan/ap/rnd/202502/1900/631436cfbc1d64659c778e3783f29fafad6022145e0ffec8.jpg',
        type: 'Juego Xbox',
        category: 'xbox',
        section: 'section-xbox'
    },
    {
        id: 'gears-5',
        title: 'Gears 5',
        price: 39.99,
        image: 'https://cdn.gearsofwar.com/gearsofwar/sites/2/2024/05/Gears5_thumbnail-664e4051d0100.png',
        type: 'Juego Xbox',
        category: 'xbox',
        section: 'section-xbox'
    },
    {
        id: 'sea-of-thieves',
        title: 'Sea of Thieves',
        price: 49.99,
        image: 'https://image.api.playstation.com/vulcan/ap/rnd/202402/1314/4446be4f7d07f6944cc7cb856f92685b224f4577c281f627.png',
        type: 'Juego Xbox',
        category: 'xbox',
        section: 'section-xbox'
    },
    {
        id: 'starfield',
        title: 'Starfield',
        price: 69.99,
        image: 'https://media.wired.com/photos/64efaed1d89817fe9d9fc046/master/pass/Starfield-Review-Featured-Games.jpg',
        type: 'Juego Xbox',
        category: 'xbox',
        section: 'section-xbox'
    },
    {
        id: 'flight-simulator',
        title: 'Microsoft Flight Simulator',
        price: 69.99,
        image: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1250410/capsule_616x353.jpg',
        type: 'Juego Xbox',
        category: 'xbox',
        section: 'section-xbox'
    },
    {
        id: 'ea-sports-fc-24',
        title: 'EA Sports FC 24',
        price: 59.99,
        image: 'https://media.vandal.net/m/7-2023/20237101734547_1.jpg',
        type: 'Juego Xbox',
        category: 'xbox',
        section: 'section-xbox'
    },
    {
        id: 'call-of-duty',
        title: 'Call of Duty',
        price: 69.99,
        image: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3595230/03a32ef57a71955100af89dc40add1c4535fd813/capsule_616x353.jpg',
        type: 'Juego Xbox',
        category: 'xbox',
        section: 'section-xbox'
    },
    {
        id: 'age-of-empires-iv',
        title: 'Age of Empires IV',
        price: 59.99,
        image: 'https://www.masgamers.com/wp-content/uploads/2022/04/image-1.png',
        type: 'Juego Xbox',
        category: 'xbox',
        section: 'section-xbox'
    },

    // Juegos Xbox One
    {
        id: 'minecraft-xbox',
        title: 'Minecraft',
        price: 29.99,
        image: 'https://blizzstoreperu.com/cdn/shop/products/comprarminecraftjavaybedrock_png.jpg',
        type: 'Juego Xbox One',
        category: 'xbox-one',
        section: 'section-xbox-one'
    },
    {
        id: 'call-of-duty-xbox-one',
        title: 'Call of Duty Modern Warfare',
        price: 69.99,
        image: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3595230/03a32ef57a71955100af89dc40add1c4535fd813/capsule_616x353.jpg',
        type: 'Juego Xbox One',
        category: 'xbox-one',
        section: 'section-xbox-one'
    },

    // Game Pass
    {
        id: 'game-pass-ultimate',
        title: 'Xbox Game Pass Ultimate',
        price: 14.99,
        image: 'https://cdn2.steamgriddb.com/hero_thumb/c7aeec9bb7a36b06b5875e2300d8124e.jpg',
        type: 'Suscripción',
        category: 'game-pass',
        section: 'section-game-pass'
    },
    {
        id: 'game-pass-console',
        title: 'Game Pass Console',
        price: 9.99,
        image: 'https://cdn2.steamgriddb.com/hero_thumb/d7fc40b7aab1fbd784d09b662f5b175b.jpg',
        type: 'Suscripción',
        category: 'game-pass',
        section: 'section-game-pass'
    },
    {
        id: 'game-pass-pc',
        title: 'Game Pass PC',
        price: 9.99,
        image: 'https://cdn2.steamgriddb.com/logo_thumb/1708d3d39aa496d7afcd8aa682b5342b.png',
        type: 'Suscripción',
        category: 'game-pass',
        section: 'section-game-pass'
    },

    // Accesorios
    {
        id: 'xbox-controller',
        title: 'Xbox Wireless Controller',
        price: 59.99,
        image: 'https://m.media-amazon.com/images/I/61p7I8X1pQL._SL1500_.jpg',
        type: 'Accesorio',
        category: 'accesorios',
        section: 'section-accesorios'
    },
    {
        id: 'xbox-headset',
        title: 'Xbox Wireless Headset',
        price: 99.99,
        image: 'https://m.media-amazon.com/images/I/71Z8h0yS3+L._SL1500_.jpg',
        type: 'Accesorio',
        category: 'accesorios',
        section: 'section-accesorios'
    },
    {
        id: 'xbox-charger',
        title: 'Xbox Charging Station',
        price: 29.99,
        image: 'https://m.media-amazon.com/images/I/81P+MsHV2aL._SL1500_.jpg',
        type: 'Accesorio',
        category: 'accesorios',
        section: 'section-accesorios'
    }
];

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Función principal de inicialización
function initializeApp() {
    checkAuth();
    startHeroCarousel();
    initializeEventListeners();
    updateCartDisplay();
    initializeXboxCarousel();
    addCartButtonsToGames();
    addCartButtonsToXboxGames();
    addUserMenuStyles();
    initializeNotificationSystem();
    updateModalStructure();
    initializeNavigation();
    initializeSearch();
    restoreSection();
}

// Función para restructurar el modal del carrito con scroll
function updateModalStructure() {
    const modal = document.getElementById('cartModal');
    if (!modal) return;
    
    const modalContent = modal.querySelector('.modal-content');
    if (!modalContent) return;
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <h2>Carrito de Compras</h2>
            <span class="close" onclick="toggleCart()">&times;</span>
        </div>
        <div id="cartItems">
            <p class="empty-cart">Tu carrito está vacío</p>
        </div>
        <div class="cart-total">
            <h3>Total: $<span id="cartTotal">0.00</span></h3>
            <button class="checkout-btn" disabled>Proceder al Pago</button>
        </div>
    `;
}

// Función para verificar autenticación
// Función para verificar autenticación
function checkAuth() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            isLoggedIn = true;

            updateLoginButton();
            loadCartFromFirestore();
            loadXboxSubscription();
            setupSubscriptionListener();

            // 🔹 Actualizar lastLogin SIN romper el flujo
            updateUserActivity(user.uid);

        } else {
            currentUser = null;
            isLoggedIn = false;
            updateLoginButton();
            cart = [];
            updateCartDisplay();
        }
    });
}


// Función para redirigir a la página de autenticación
function redirectToAuth() {
    if (isLoggedIn) {
        toggleUserDropdown();
    } else {
        window.location.href = 'auth.html?redirect=xbox.html';
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
        auth.signOut().then(() => {
            isLoggedIn = false;
            currentUser = null;
            cart = [];
            updateCartDisplay();
            updateLoginButton();
            
            const dropdown = document.getElementById('userDropdown');
            dropdown.style.display = 'none';
            
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

function viewOrderHistory() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.style.display = 'none';
    showNotification('Funcionalidad de historial en desarrollo', 'info');
}

function viewWishlist() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.style.display = 'none';
    showNotification('Lista de deseos en desarrollo', 'info');
}

function viewSettings() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.style.display = 'none';
    showNotification('Configuración en desarrollo', 'info');
}

// Función para mostrar modal de perfil
function showProfileModal(userData) {
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
    
    const existingItem = cart.find(item => item.id === gameId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: gameId,
            name: gameName,
            price: price,
            image: image,
            quantity: 1,
            platform: 'xbox'
        });
    }
    
    updateCartDisplay();
    saveCartToFirestore();
    showNotification(`${gameName} añadido al carrito`, 'success');
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

// Hero Carousel
function startHeroCarousel() {
    const slides = document.querySelectorAll('.hero-slide');
    const totalSlides = slides.length;
    
    setInterval(() => {
        slides[currentHeroSlide].classList.remove('active');
        currentHeroSlide = (currentHeroSlide + 1) % totalSlides;
        slides[currentHeroSlide].classList.add('active');
    }, 5000);
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

// Xbox Available Games Carousel
function moveXboxCarousel(direction) {
    const maxSlide = totalXboxCards - visibleXboxCards;
    
    currentXboxSlide += direction;
    
    if (currentXboxSlide < 0) {
        currentXboxSlide = maxSlide;
    } else if (currentXboxSlide > maxSlide) {
        currentXboxSlide = 0;
    }
    
    updateXboxCarousel();
    updateXboxDots();
}

function goToXboxSlide(slideIndex) {
    const maxSlide = totalXboxCards - visibleXboxCards;
    
    if (slideIndex < 0) slideIndex = 0;
    if (slideIndex > maxSlide) slideIndex = maxSlide;
    
    currentXboxSlide = slideIndex;
    updateXboxCarousel();
    updateXboxDots();
}

function updateXboxCarousel() {
    const container = document.querySelector('.xbox-available-container');
    if (!container) return;
    
    const cards = document.querySelectorAll('.xbox-available-card');
    const cardWidth = 320;
    
    const offset = centerXboxIndex * cardWidth;
    const translateX = -currentXboxSlide * cardWidth + offset;
    
    container.style.transform = `translateX(${translateX}px)`;
    
    cards.forEach((card, index) => {
        card.classList.remove('featured-card', 'side-card');
        
        const cardPosition = index - currentXboxSlide;
        
        if (cardPosition === centerXboxIndex) {
            card.classList.add('featured-card');
        } else if (Math.abs(cardPosition - centerXboxIndex) === 1) {
            card.classList.add('side-card');
        }
    });
}

function updateXboxDots() {
    const dots = document.querySelectorAll('.dot');
    const maxSlide = totalXboxCards - visibleXboxCards;
    
    dots.forEach((dot, index) => {
        if (index <= maxSlide) {
            dot.style.display = 'inline-block';
            dot.classList.toggle('active', index === currentXboxSlide);
        } else {
            dot.style.display = 'none';
        }
    });
}

function createXboxDots() {
    const dotsContainer = document.querySelector('.carousel-dots');
    if (!dotsContainer) return;
    
    const maxSlide = totalXboxCards - visibleXboxCards;
    
    dotsContainer.innerHTML = '';
    for (let i = 0; i <= maxSlide; i++) {
        const dot = document.createElement('span');
        dot.className = 'dot';
        if (i === 0) dot.classList.add('active');
        dot.onclick = () => goToXboxSlide(i);
        dotsContainer.appendChild(dot);
    }
}

function initializeXboxCarousel() {
    createXboxDots();
    updateXboxCarousel();
    
    setInterval(() => {
        moveXboxCarousel(1);
    }, 6000);
}

// Game Pass Carousel
function moveGamePassCarousel(direction) {
    const container = document.querySelector('.gamepass-container');
    const cards = document.querySelectorAll('.gamepass-card');
    const cardWidth = 410;
    const totalCards = cards.length;
    const visibleCards = Math.floor(window.innerWidth / cardWidth);
    const maxSlide = Math.max(0, totalCards - visibleCards);
    
    currentGamePassSlide += direction;
    
    if (currentGamePassSlide < 0) {
        currentGamePassSlide = 0;
    } else if (currentGamePassSlide > maxSlide) {
        currentGamePassSlide = maxSlide;
    }
    
    const translateX = -currentGamePassSlide * cardWidth;
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
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        cartHTML += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p class="price">${item.price.toFixed(2)}</p>
                    <p class="platform">Xbox</p>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', -1)">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', 1)">+</button>
                    <button class="remove-btn" onclick="removeFromCart('${item.id}')">Eliminar</button>
                </div>
            </div>
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

// Navigation functions
function goToGameDetail(gameId) {
    showNotification(`Navegando a detalles de ${gameId}`, 'info');
    
    setTimeout(() => {
        window.location.href = `game-detail.html?id=${gameId}&platform=xbox`;
    }, 1000);
}

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
    `;
    
    switch(type) {
        case 'success':
            notification.style.background = 'linear-gradient(135deg, #00ff41, #00cc33)';
            notification.style.color = '#000';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(135deg, #ff4757, #ff3742)';
            break;
        case 'warning':
            notification.style.background = 'linear-gradient(135deg, #ffa502, #ff6348)';
            break;
        default:
            notification.style.background = 'linear-gradient(135deg, #3742fa, #2f3542)';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Event listeners
function initializeEventListeners() {
    window.addEventListener('click', function(event) {
        const cartModal = document.getElementById('cartModal');
        
        if (event.target === cartModal) {
            cartModal.style.display = 'none';
        }
    });
    
    const searchInput = document.querySelector('.search-input');
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

// Función para añadir botones de carrito a las tarjetas de juego
function addCartButtonsToGames() {
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach((card, index) => {
        let addToCartBtn = card.querySelector('.add-to-cart-btn');
        
        const gameInfo = card.querySelector('.game-info');
        const title = card.querySelector('h3').textContent;
        const image = card.querySelector('img').src;

        const gamePrices = {
            'Halo Infinite': 59.99,
            'Forza Horizon 5': 59.99,
            'Gears 5': 39.99,
            'Sea of Thieves': 49.99,
            'Microsoft Flight Simulator': 69.99,
            'Starfield': 69.99,
            'EA Sports FC 24': 59.99,
            'Call of Duty': 69.99,
            'Age of Empires IV': 59.99
        };

        const price = gamePrices[title] || 49.99;
        
        if (!addToCartBtn && gameInfo) {
            addToCartBtn = document.createElement('button');
            addToCartBtn.className = 'add-to-cart-btn';
            addToCartBtn.style.cssText = `
                background: linear-gradient(135deg, #00ff41, #00cc33);
                color: #000;
                border: none;
                margin-top: 10px;
                padding: 10px 20px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                transition: all 0.3s;
                width: 100%;
                box-shadow: 0 3px 10px rgba(0, 255, 65, 0.3);
            `;
            
            addToCartBtn.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 5px 15px rgba(0, 255, 65, 0.4)';
            });
            
            addToCartBtn.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 3px 10px rgba(0, 255, 65, 0.3)';
            });
            
            addToCartBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                addToCart(`xbox-game-${index}`, title, price, image);
            });
            
            gameInfo.appendChild(addToCartBtn);
        }
        
        if (addToCartBtn) {
            addToCartBtn.textContent = `Añadir - ${price.toFixed(2)}`;
        }
    });
}

// Función para añadir botones a las tarjetas Xbox
function addCartButtonsToXboxGames() {
    const xboxCards = document.querySelectorAll('.xbox-available-card');
    
    xboxCards.forEach((card, index) => {
        let addToCartBtn = card.querySelector('.add-cart-btn');
        
        const cardInfo = card.querySelector('.card-info');
        const title = card.querySelector('h3').textContent;
        const image = card.querySelector('img').src;
        
        const gamePrices = {
            'Halo Infinite': 59.99,
            'Forza Horizon 5': 59.99,
            'Gears 5': 39.99,
            'Sea of Thieves': 49.99,
            'Microsoft Flight Simulator': 69.99,
            'Starfield': 69.99,
            'Age of Empires IV': 59.99,
            'Call of Duty Modern Warfare': 69.99,
            'Minecraft': 29.99
        };
        
        const price = gamePrices[title] || 59.99;
        
        if (!addToCartBtn && cardInfo) {
            addToCartBtn = document.createElement('button');
            addToCartBtn.className = 'add-cart-btn';
            addToCartBtn.textContent = `Añadir - ${price.toFixed(2)}`;
            
            addToCartBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                addToCart(`xbox-available-${index}`, title, price, image);
            });
            
            cardInfo.appendChild(addToCartBtn);
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
            background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
            border: 1px solid #00ff41;
            border-radius: 8px;
            min-width: 220px;
            box-shadow: 0 8px 32px rgba(0, 255, 65, 0.2);
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
            color: #00ff41;
        }
        
        .dropdown-item:hover {
            background: rgba(0, 255, 65, 0.1);
        }
        
        .dropdown-item.logout-item {
            color: #ff4757;
        }
        
        .dropdown-item.logout-item i {
            color: #ff4757;
        }
        
        .dropdown-item.logout-item:hover {
            background: rgba(255, 71, 87, 0.1);
        }
        
        .dropdown-divider {
            height: 1px;
            background: #333;
            margin: 8px 0;
        }
    `;
    document.head.appendChild(style);
}

// ========================================
// SISTEMA DE NAVEGACIÓN POR SECCIONES
// ========================================

function initializeNavigation() {
    setTimeout(function() {
        const navLinks = document.querySelectorAll('.nav-link[data-section]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                const sectionId = this.getAttribute('data-section');
                showSection(sectionId);
                markActiveLink(this);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }, 100);
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
        document.getElementById('section-xbox').style.display = 'block';
    }
}

function markActiveLink(activeLink) {
    const allLinks = document.querySelectorAll('.nav-link');
    allLinks.forEach(link => {
        link.classList.remove('active');
        link.style.color = '#fff';
    });
    
    activeLink.classList.add('active');
    activeLink.style.color = '#00ff41';
}

function restoreSection() {
    const savedSection = sessionStorage.getItem('currentSection') || 'xbox';
    showSection(savedSection);
    
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    navLinks.forEach(link => {
        const linkSection = link.getAttribute('data-section');
        if (linkSection === savedSection) {
            markActiveLink(link);
        }
    });
}

// ========================================
// SISTEMA DE BÚSQUEDA
// ========================================

function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim().toLowerCase();
    
    if (!query) {
        hideSearchResults();
        return;
    }
    
    const results = xboxSearchDatabase.filter(item => 
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
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 10px;"></i>
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
                         onerror="this.src='https://via.placeholder.com/50x50/333333/ffffff?text=XBOX'">
                    <div class="search-result-info">
                        <div class="search-result-title">${highlightedTitle}</div>
                        <div style="display: flex; align-items: center;">
                            <span class="search-result-price">${item.price.toFixed(2)}</span>
                            <span class="search-result-type">${highlightedType}</span>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right" style="color: #00ff41; margin-left: 10px;"></i>
                </div>
            `;
        });
        
        resultsHTML = `
            <div style="padding: 10px 15px; border-bottom: 1px solid #333; color: #00ff41; font-size: 0.9rem; background: rgba(0, 255, 65, 0.1);">
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
    const product = xboxSearchDatabase.find(item => item.id === productId);
    
    if (product) {
        // Determinar a qué sección ir basándose en el producto
        let targetSection = product.category;
        
        // Si es un juego de la sección principal, ir a 'xbox'
        if (product.category === 'xbox') {
            targetSection = 'xbox';
        }
        
        // Navegar a la sección correcta
        showSection(targetSection);
        
        // Marcar el enlace correcto como activo
        const navLinks = document.querySelectorAll('.nav-link[data-section]');
        navLinks.forEach(link => {
            if (link.getAttribute('data-section') === targetSection) {
                markActiveLink(link);
            }
        });
        
        hideSearchResults();
        document.getElementById('searchInput').value = '';
        
        // Esperar a que la sección cargue y luego hacer scroll o resaltar
        setTimeout(() => {
            if (targetSection === 'xbox') {
                // Si es la página principal, hacer scroll al carrusel correcto
                scrollToProductInMainPage(productId, product);
            } else {
                // Para otras secciones, resaltar el producto si existe
                highlightProductInOtherSection(productId, product);
            }
            showNotification(`Producto encontrado: ${product.title}`, 'success');
        }, 500);
    }
}

function scrollToProductInMainPage(productId, product) {
    // Buscar el producto en TODOS los carruseles de la página principal
    let productElement = null;
    let carouselSection = null;
    
    // Buscar en el carrusel de Featured Games (Sección 3)
    const featuredCards = document.querySelectorAll('.featured-games .game-card');
    featuredCards.forEach(card => {
        const title = card.querySelector('h3');
        if (title && title.textContent.trim() === product.title) {
            productElement = card;
            carouselSection = 'featured';
        }
    });
    
    // Buscar en el carrusel de Xbox Available (Sección 4)
    const xboxCards = document.querySelectorAll('.xbox-available-section .xbox-available-card');
    xboxCards.forEach(card => {
        const title = card.querySelector('h3');
        if (title && title.textContent.trim() === product.title) {
            productElement = card;
            carouselSection = 'xbox-available';
        }
    });
    
    if (productElement && carouselSection) {
        if (carouselSection === 'featured') {
            scrollToFeaturedGameSection(productElement);
        } else if (carouselSection === 'xbox-available') {
            scrollToXboxAvailableSection(productElement);
        }
    } else {
        // Si no se encuentra, hacer scroll a Xbox Available por defecto
        scrollToDefaultXboxAvailable();
    }
}

function scrollToFeaturedGameSection(productElement) {
    const container = document.querySelector('.games-container');
    const cards = Array.from(document.querySelectorAll('.featured-games .game-card'));
    
    // Encontrar el índice de la tarjeta
    const cardIndex = cards.indexOf(productElement);
    
    if (cardIndex !== -1) {
        // Mover el carrusel a esa posición
        currentGameSlide = cardIndex;
        const cardWidth = 330;
        const translateX = -currentGameSlide * cardWidth;
        container.style.transform = `translateX(${translateX}px)`;
    }
    
    // Hacer scroll a la sección Featured Games
    const featuredSection = document.querySelector('.featured-games');
    if (featuredSection) {
        setTimeout(() => {
            const yOffset = -100; // Offset para dejar espacio arriba
            const y = featuredSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
            
            window.scrollTo({
                top: y,
                behavior: 'smooth'
            });
            
            // Resaltar el producto
            setTimeout(() => {
                highlightCard(productElement);
            }, 1000);
        }, 300);
    }
}

function scrollToXboxAvailableSection(productElement) {
    const container = document.querySelector('.xbox-available-container');
    const cards = Array.from(document.querySelectorAll('.xbox-available-section .xbox-available-card'));
    
    // Encontrar el índice de la tarjeta
    const cardIndex = cards.indexOf(productElement);
    
    if (cardIndex !== -1) {
        // Calcular la posición para centrar la tarjeta
        const targetSlide = Math.max(0, cardIndex - centerXboxIndex);
        const maxSlide = totalXboxCards - visibleXboxCards;
        currentXboxSlide = Math.min(targetSlide, maxSlide);
        
        // Actualizar el carrusel
        updateXboxCarousel();
        updateXboxDots();
    }
    
    // Hacer scroll a la sección Xbox Available (Sección 4)
    const xboxSection = document.querySelector('.xbox-available-section');
    if (xboxSection) {
        setTimeout(() => {
            const yOffset = -100; // Offset para dejar espacio arriba
            const y = xboxSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
            
            window.scrollTo({
                top: y,
                behavior: 'smooth'
            });
            
            // Resaltar el producto
            setTimeout(() => {
                highlightCard(productElement);
            }, 1000);
        }, 300);
    }
}

function scrollToDefaultXboxAvailable() {
    // Si no se encuentra el producto, hacer scroll a Xbox Available de todas formas
    const xboxSection = document.querySelector('.xbox-available-section');
    if (xboxSection) {
        setTimeout(() => {
            const yOffset = -100;
            const y = xboxSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
            
            window.scrollTo({
                top: y,
                behavior: 'smooth'
            });
        }, 300);
    }
}

function highlightCard(card) {
    // Guardar el estilo original
    const originalBoxShadow = card.style.boxShadow;
    const originalTransform = card.style.transform;
    const originalBorder = card.style.border;
    
    // Aplicar efecto de resaltado mejorado
    card.style.boxShadow = '0 0 0 4px #00ff41, 0 0 30px rgba(0, 255, 65, 0.8), 0 0 60px rgba(0, 255, 65, 0.4)';
    card.style.border = '2px solid #00ff41';
    card.style.transform = 'scale(1.05)';
    card.style.transition = 'all 0.3s ease';
    card.style.zIndex = '100';
    
    // Pulsar 3 veces
    let pulseCount = 0;
    const pulseInterval = setInterval(() => {
        if (pulseCount % 2 === 0) {
            card.style.boxShadow = '0 0 0 4px #00ff41, 0 0 30px rgba(0, 255, 65, 0.8), 0 0 60px rgba(0, 255, 65, 0.4)';
            card.style.transform = 'scale(1.05)';
        } else {
            card.style.boxShadow = '0 0 0 2px #00ff41, 0 0 15px rgba(0, 255, 65, 0.5)';
            card.style.transform = 'scale(1.02)';
        }
        pulseCount++;
        
        if (pulseCount >= 6) {
            clearInterval(pulseInterval);
            
            // Restaurar estilos originales después de 2 segundos
            setTimeout(() => {
                card.style.boxShadow = originalBoxShadow;
                card.style.transform = originalTransform;
                card.style.border = originalBorder;
                card.style.zIndex = '';
            }, 2000);
        }
    }, 400);
}

function highlightProductInSection(productId) {
    setTimeout(() => {
        const productElement = document.querySelector(`[onclick*="${productId}"]`);
        if (productElement) {
            highlightCard(productElement);
        }
    }, 1000);
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
            if (result.style.background.includes('0, 255, 65')) {
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
            results[currentIndex].style.background = 'rgba(0, 255, 65, 0.1)';
            results[currentIndex].style.borderLeft = '3px solid #00ff41';
        }
    });
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
        border: 1px solid #00ff41;
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
            border-color: #00ff41;
            background: rgba(0, 255, 65, 0.1);
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
        case 'order_confirmed': return 'linear-gradient(135deg, #00ff41, #00cc33)';
        case 'order_rejected': return 'linear-gradient(135deg, #f44336, #d32f2f)';
        case 'order_shipped': return 'linear-gradient(135deg, #00ff41, #00cc33)';
        case 'custom': return 'linear-gradient(135deg, #ff9800, #f57c00)';
        default: return 'linear-gradient(135deg, #666, #555)';
    }
}

function getNotificationAccentColor(type) {
    switch (type) {
        case 'order_confirmed': return '#00ff41';
        case 'order_rejected': return '#ef5350';
        case 'order_shipped': return '#00ff41';
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
        <div style="background: linear-gradient(135deg, #1e1e1e, #2a2a2a); border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow: hidden; border: 1px solid #00ff41;">
            <div style="padding: 1.5rem; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">
                <h2 style="color: #00ff41; margin: 0;">Centro de Notificaciones</h2>
                <button onclick="closeNotificationCenter()" style="background: none; border: none; color: #ccc; font-size: 1.5rem; cursor: pointer;">×</button>
            </div>
            <div id="notification-list" style="padding: 1rem; max-height: 400px; overflow-y: auto;">
                <div style="text-align: center; color: #666; padding: 2rem;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i><br>
                    Cargando notificaciones...
                </div>
            </div>
            <div style="padding: 1rem; border-top: 1px solid #333; text-align: center;">
                <button onclick="markAllNotificationsRead()" style="background: linear-gradient(135deg, #00ff41, #00cc33); color: #000; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600;">
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
                                background: ${notification.read ? '#2a2a2a' : 'rgba(0, 255, 65, 0.1)'}; 
                                ${!notification.read ? 'border-left: 4px solid #00ff41;' : ''}">
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
                            ${!notification.read ? '<div style="width: 8px; height: 8px; background: #00ff41; border-radius: 50%;"></div>' : ''}
                        </div>
                        <div style="color: ${notification.read ? '#999' : '#ccc'}; line-height: 1.4;">
                            ${notification.message}
                        </div>
                        ${notification.orderNumber ? 
                            `<div style="margin-top: 0.5rem; font-size: 0.8rem; color: #00ff41;">
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

// Responsive carousel handling
function handleResize() {
    currentGameSlide = 0;
    currentXboxSlide = 0;
    currentGamePassSlide = 0;
    
    const gamesContainer = document.querySelector('.games-container');
    const xboxContainer = document.querySelector('.xbox-available-container');
    const gamepassContainer = document.querySelector('.gamepass-container');
    
    if (gamesContainer) gamesContainer.style.transform = 'translateX(0px)';
    if (xboxContainer) {
        updateXboxCarousel();
        updateXboxDots();
    }
    if (gamepassContainer) gamepassContainer.style.transform = 'translateX(0px)';
}

window.addEventListener('resize', handleResize);


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


// ========================================
// SISTEMA DE SUSCRIPCIONES XBOX
// ========================================

async function loadXboxSubscription() {
    if (!currentUser) {
        currentUserSubscription = 'none';
        return;
    }
    
    try {
        const doc = await db.collection('users').doc(currentUser.uid).get();
        if (doc.exists) {
            const userData = doc.data();
            
            const xboxSub = SubscriptionManager.getUserSubscription(userData, 'xbox');
            currentUserSubscription = xboxSub.plan;
            
            const xboxRequest = SubscriptionManager.getSubscriptionRequest(userData, 'xbox');
            subscriptionRequestStatus = xboxRequest.requestStatus;
            subscriptionRequestedPlan = xboxRequest.requestedPlan;
            
            updateSubscriptionBadge();
            refreshAllPrices();
        }
    } catch (error) {
        console.error('Error cargando suscripción Xbox:', error);
        currentUserSubscription = 'none';
    }
}

function calculateDiscountedPrice(originalPrice, subscription = currentUserSubscription) {
    return SubscriptionManager.calculateDiscount('xbox', subscription, originalPrice);
}

function updateSubscriptionBadge() {
    const loginBtn = document.querySelector('.login-btn');
    if (!loginBtn) return;
    
    const existingBadge = document.getElementById('subscription-badge');
    if (existingBadge) existingBadge.remove();
    
    if (currentUserSubscription !== 'none') {
        const badge = document.createElement('span');
        badge.id = 'subscription-badge';
        badge.className = `subscription-badge ${currentUserSubscription.toLowerCase()}`;
        badge.textContent = currentUserSubscription;
        badge.style.background = SubscriptionManager.getPlatformColors('xbox').badge;
        loginBtn.parentElement.insertBefore(badge, loginBtn.nextSibling);
    }
}

function refreshAllPrices() {
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
}

function setupSubscriptionListener() {
    if (!currentUser) return;
    
    if (subscriptionListener) {
        subscriptionListener();
    }
    
    subscriptionListener = db.collection('users')
        .doc(currentUser.uid)
        .onSnapshot((doc) => {
            if (!doc.exists) return;
            
            const userData = doc.data();
            const xboxSub = SubscriptionManager.getUserSubscription(userData, 'xbox');
            const newSubscription = xboxSub.plan;
            
            if (currentUserSubscription !== newSubscription) {
                currentUserSubscription = newSubscription;
                updateSubscriptionBadge();
                refreshAllPrices();
                
                if (newSubscription !== 'none') {
                    const discount = SubscriptionManager.calculateDiscount('xbox', newSubscription, 100).discountPercentage;
                    showNotification(
                        `✨ ¡Tu suscripción ${newSubscription} está activa! Descuento del ${discount}% aplicado`,
                        'success'
                    );
                }
            }
        });
}


// ========================================
// SISTEMA DE SUSCRIPCIONES XBOX - COMPLETO
// AGREGAR AL FINAL DE xbox.js
// ========================================

/**
 * ✅ FUNCIÃ"N 1: Abrir modal de suscripción
 */
function openSubscriptionPaymentModal(plan) {
    console.log('Abriendo modal para plan Xbox:', plan);
    
    if (!isLoggedIn || !currentUser) {
        showNotification('Debes iniciar sesión para suscribirte', 'warning');
        setTimeout(() => {
            window.location.href = 'auth.html?redirect=xbox.html';
        }, 1500);
        return;
    }
    
    if (currentUserSubscription !== 'none') {
        if (currentUserSubscription === plan) {
            showNotification(`Ya tienes suscripción ${currentUserSubscription} activa`, 'info');
            return;
        } else {
            if (confirm(`¿Quieres cambiar de ${currentUserSubscription} a ${plan}?\n\nTu solicitud será revisada por un administrador.`)) {
                selectedSubscriptionPlan = plan;
                const planInfo = getSubscriptionPlanInfo(plan);
                displaySelectedPlanInfo(planInfo);
                displayPlanChangeNotice(currentUserSubscription, plan);
                resetSubscriptionForm();
                
                // ✅ CORRECCIÃ"N: Mostrar modal correctamente
                const modal = document.getElementById('subscriptionPaymentModal');
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                
                return;
            } else {
                return;
            }
        }
    }
    
    if (subscriptionRequestStatus === 'pending') {
        showNotification(`Ya tienes una solicitud de suscripción en revisión para el plan ${subscriptionRequestedPlan}`, 'info');
        return;
    }
    
    selectedSubscriptionPlan = plan;
    const planInfo = getSubscriptionPlanInfo(plan);
    displaySelectedPlanInfo(planInfo);
    resetSubscriptionForm();
    
    // ✅ CORRECCIÃ"N: Mostrar modal correctamente
    const modal = document.getElementById('subscriptionPaymentModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * ✅ FUNCIÃ"N 2: Obtener información del plan Xbox
 */
function getSubscriptionPlanInfo(plan) {
    const plans = {
        'Console': {
            name: 'Console',
            price: 9.99,
            discount: 5,
            color1: '#107c10',
            color2: '#0e5e0e',
            features: [
                'Juega en tu Xbox',
                'Descuentos del 5%',
                'Juegos mensuales gratis',
                'Multijugador online'
            ]
        },
        'PC': {
            name: 'PC',
            price: 9.99,
            discount: 10,
            color1: '#00cc33',
            color2: '#009900',
            features: [
                'Juega en tu PC',
                'Descuentos del 10%',
                '+100 juegos de PC',
                'EA Play incluido'
            ]
        },
        'Ultimate': {
            name: 'Ultimate',
            price: 14.99,
            discount: 20,
            color1: '#00ff41',
            color2: '#00cc33',
            features: [
                'Consola, PC y nube',
                'Descuentos del 20%',
                '+400 juegos',
                'Xbox Live Gold incluido'
            ]
        }
    };
    
    return plans[plan] || plans['Console'];
}

/**
 * ✅ FUNCIÃ"N 3: Mostrar información del plan en el modal
 */
function displaySelectedPlanInfo(planInfo) {
    const container = document.getElementById('planInfoDisplay');
    
    container.innerHTML = `
        <div class="plan-display-card" style="--plan-color-1: ${planInfo.color1}; --plan-color-2: ${planInfo.color2};">
            <h3>Xbox Game Pass ${planInfo.name}</h3>
            <div class="plan-discount">
                <i class="fas fa-tag"></i> ${planInfo.discount}% de descuento en juegos
            </div>
            <div class="plan-price">$${planInfo.price.toFixed(2)}<span style="font-size: 1rem;">/mes</span></div>
        </div>
    `;
    
    // Actualizar resumen
    document.getElementById('summaryPlan').textContent = `Xbox Game Pass ${planInfo.name}`;
    document.getElementById('summaryPrice').textContent = `$${planInfo.price.toFixed(2)}/mes`;
    document.getElementById('summaryDiscount').textContent = `${planInfo.discount}% en todos los juegos`;
    document.getElementById('summaryTotal').textContent = `$${planInfo.price.toFixed(2)}`;
}

/**
 * ✅ FUNCIÃ"N 4: Mostrar aviso de cambio de plan
 */
function displayPlanChangeNotice(currentPlan, newPlan) {
    const planInfoDisplay = document.getElementById('planInfoDisplay');
    
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
                <strong>${currentPlan}</strong> → <strong style="color: #00ff41;">${newPlan}</strong>
            </span>
            <p style="font-size: 0.85rem; margin-top: 8px; color: #999;">
                Tu suscripción actual se mantendrá hasta que un administrador apruebe el cambio.
            </p>
        </div>
    `;
    
    planInfoDisplay.insertBefore(changeNotice, planInfoDisplay.firstChild);
}

/**
 * ✅ FUNCIÃ"N 5: Formatear número de tarjeta
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
    
    const error = document.getElementById('subCardNumberError');
    if (value.length === 16) {
        input.style.borderColor = '#00ff41';
        error.style.display = 'none';
    } else if (value.length > 0) {
        input.style.borderColor = '#ff9800';
    } else {
        input.style.borderColor = '#444';
    }
}

/**
 * ✅ FUNCIÃ"N 6: Formatear fecha de expiración
 */
function formatSubCardExpiry(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    
    input.value = value;
    
    const error = document.getElementById('subCardExpiryError');
    if (value.length === 5) {
        const [month, year] = value.split('/');
        const monthNum = parseInt(month);
        
        if (monthNum >= 1 && monthNum <= 12) {
            input.style.borderColor = '#00ff41';
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
 * ✅ FUNCIÃ"N 7: Procesar pago de suscripción
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
        
        const isChangePlan = currentUserSubscription !== 'none';
        
        // Obtener datos de la tarjeta
        const cardData = {
            lastFour: document.getElementById('subCardNumber').value.replace(/\D/g, '').slice(-4),
            name: document.getElementById('subCardName').value
        };
        
        // Usar SubscriptionManager para crear solicitud
        const result = await SubscriptionManager.createSubscriptionRequest(
            currentUser.uid,
            userName,
            currentUser.email,
            'xbox', // Plataforma Xbox
            selectedSubscriptionPlan,
            cardData,
            isChangePlan ? 'change_plan' : 'new'
        );
        
        if (result.success) {
            // Actualizar variables locales
            subscriptionRequestedPlan = selectedSubscriptionPlan;
            subscriptionRequestStatus = 'pending';
            
            updateSubscriptionBadge();
            closeSubscriptionPaymentModal();
            
            const message = isChangePlan
                ? `¡Solicitud de cambio enviada! Tu solicitud para cambiar de ${currentUserSubscription} a ${selectedSubscriptionPlan} está en revisión.`
                : `¡Solicitud enviada! Tu solicitud para Xbox Game Pass ${selectedSubscriptionPlan} está en revisión.`;
            
            showNotification(message, 'success');
        } else {
            showNotification(`Error: ${result.error}`, 'error');
        }
        
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
 * ✅ FUNCIÃ"N 8: Validar formulario
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
 * ✅ FUNCIÃ"N 9: Resetear formulario
 */
function resetSubscriptionForm() {
    document.getElementById('subscriptionPaymentForm').reset();
    
    const inputs = document.querySelectorAll('#subscriptionPaymentForm input');
    inputs.forEach(input => {
        input.style.borderColor = '#444';
    });
    
    const errors = document.querySelectorAll('#subscriptionPaymentForm .field-error');
    errors.forEach(error => {
        error.style.display = 'none';
    });
}

/**
 * ✅ FUNCIÃ"N 10: Cerrar modal
 */
function closeSubscriptionPaymentModal() {
    const modal = document.getElementById('subscriptionPaymentModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // ✅ Restaurar scroll
    selectedSubscriptionPlan = null;
    resetSubscriptionForm();
}

/**
 * ✅ FUNCIÃ"N 11: Mostrar términos y condiciones
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
        <div style="background: #1a1a1a; padding: 30px; border-radius: 15px; max-width: 600px; max-height: 80vh; overflow-y: auto; border: 2px solid #00ff41;">
            <h2 style="color: #00ff41; margin-bottom: 20px;">Términos y Condiciones - Xbox Game Pass</h2>
            <div style="color: #ccc; line-height: 1.6;">
                <p><strong>1. Suscripción:</strong> Al solicitar una suscripción, aceptas que tu solicitud será revisada y aprobada por un administrador.</p>
                <p><strong>2. Pago:</strong> El cargo mensual se realizará automáticamente cada mes hasta que canceles la suscripción.</p>
                <p><strong>3. Descuentos:</strong> Los descuentos solo aplican una vez tu suscripción sea aprobada por un administrador.</p>
                <p><strong>4. Cancelación:</strong> Puedes cancelar tu suscripción en cualquier momento desde tu perfil.</p>
                <p><strong>5. Cambios:</strong> Nos reservamos el derecho de modificar precios y beneficios con aviso previo.</p>
            </div>
            <button onclick="this.closest('div').parentElement.remove()" 
                    style="background: linear-gradient(135deg, #00ff41, #00cc33); color: #000; border: none; padding: 12px 30px; border-radius: 25px; margin-top: 20px; cursor: pointer; width: 100%; font-weight: 600;">
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

console.log('✅ Sistema de suscripciones Xbox cargado correctamente');