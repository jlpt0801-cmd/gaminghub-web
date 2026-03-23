// ===============================================
// NINTENDO STORE - JAVASCRIPT COMPLETO
// Basado en ps5.js con adaptaciones para Nintendo
// ===============================================

// Variables globales
let currentHeroSlide = 0;
let currentGameSlide = 0;
let currentNintendoSlide = 0;
let isLoggedIn = false;
let cart = [];

// Configuración de Firebase (la misma que en ps5.js)
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

// Variables para el sistema de notificaciones
let notificationListener = null;
let notificationContainer = null;

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
    initializeNintendoCarousel();
    
    // Inicializar botones de carrito
    addCartButtonsToGames();
    addCartButtonsToNintendoGames();
    
    // Inicializar sistema de navegación
    initializeNavigation();
    initializeSearch();
    
    // Restaurar sección al cargar
    setTimeout(() => {
        restoreSection();
    }, 200);
    
    addUserMenuStyles();
    initializeNotificationSystem();
    updateModalStructure();
}

// Función para restructurar el modal del carrito con scroll
function updateModalStructure() {
    const modal = document.getElementById('cartModal');
    if (!modal) return;
    
    const modalContent = modal.querySelector('.modal-content');
    if (!modalContent) return;
    
    // Restructurar el contenido del modal
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
function checkAuth() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            isLoggedIn = true;
            updateLoginButton();
            
            // Cargar carrito desde Firestore si existe
            loadCartFromFirestore();
            
            // Iniciar verificación de bloqueo
            startBlockedCheck();
        } else {
            currentUser = null;
            isLoggedIn = false;
            updateLoginButton();
            cart = []; // Vaciar carrito si no hay usuario
            updateCartDisplay();
            
            // Limpiar verificación de bloqueo
            if (blockCheckInterval) {
                clearInterval(blockCheckInterval);
            }
        }
    });
}

// Función para redirigir a la página de autenticación
function redirectToAuth() {
    if (isLoggedIn) {
        toggleUserDropdown();
    } else {
        window.location.href = 'auth.html?redirect=nintendo.html';
    }
}

// Función para actualizar el botón de login
function updateLoginButton() {
    const loginBtn = document.querySelector('.login-btn');
    if (isLoggedIn && currentUser) {
        // Obtener el nombre del usuario desde Firestore
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
    
    // Cerrar menú al hacer clic fuera de él
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
            
            // Ocultar dropdown
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
        // Obtener información del usuario
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

// =========================================================================
// === INICIO DEL CÓDIGO NUEVO INTEGRADO ===================================
// =========================================================================

// --- 1. FUNCIONES DEL CARRUSEL DE NINTENDO (REEMPLAZADAS) ---

// Variables del carousel Nintendo
const totalCards = 9; // Número total de tarjetas
const visibleCards = 5; // Número de tarjetas visibles
const centerIndex = Math.floor(visibleCards / 2); // Índice central (2)

// Nintendo Available Games Carousel - CORREGIDO PARA CENTRAR
function moveNintendoCarousel(direction) {
    const maxSlide = totalCards - visibleCards;
    
    currentNintendoSlide += direction;
    
    // Loop infinito
    if (currentNintendoSlide < 0) {
        currentNintendoSlide = maxSlide;
    } else if (currentNintendoSlide > maxSlide) {
        currentNintendoSlide = 0;
    }
    
    updateNintendoCarousel();
    updateNintendoDots();
}

function goToNintendoSlide(slideIndex) {
    const maxSlide = totalCards - visibleCards;
    
    if (slideIndex < 0) slideIndex = 0;
    if (slideIndex > maxSlide) slideIndex = maxSlide;
    
    currentNintendoSlide = slideIndex;
    updateNintendoCarousel();
    updateNintendoDots();
}

function updateNintendoCarousel() {
    const container = document.querySelector('.nintendo-available-container');
    if (!container) return;
    
    const cards = document.querySelectorAll('.nintendo-available-card');
    const cardWidth = 320; // Ancho de cada tarjeta + gap
    
    // Calcular el desplazamiento para centrar la tarjeta principal
    const offset = centerIndex * cardWidth;
    const translateX = -currentNintendoSlide * cardWidth + offset;
    
    container.style.transform = `translateX(${translateX}px)`;
    
    // Actualizar clases de las tarjetas
    cards.forEach((card, index) => {
        card.classList.remove('featured-card', 'side-card');
        
        const cardPosition = index - currentNintendoSlide;
        
        if (cardPosition === centerIndex) {
            // Tarjeta central (principal)
            card.classList.add('featured-card');
        } else if (Math.abs(cardPosition - centerIndex) === 1) {
            // Tarjetas laterales inmediatas
            card.classList.add('side-card');
        }
    });
}

function updateNintendoDots() {
    const dots = document.querySelectorAll('.dot');
    const maxSlide = totalCards - visibleCards;
    
    dots.forEach((dot, index) => {
        if (index <= maxSlide) {
            dot.style.display = 'inline-block';
            dot.classList.toggle('active', index === currentNintendoSlide);
        } else {
            dot.style.display = 'none';
        }
    });
}

function createNintendoDots() {
    const dotsContainer = document.getElementById('carouselDots');
    if (!dotsContainer) return;
    
    const maxSlide = totalCards - visibleCards;
    
    dotsContainer.innerHTML = '';
    for (let i = 0; i <= maxSlide; i++) {
        const dot = document.createElement('span');
        dot.className = 'dot';
        if (i === 0) dot.classList.add('active');
        dot.onclick = () => goToNintendoSlide(i);
        dotsContainer.appendChild(dot);
    }
}

function initializeNintendoCarousel() {
    createNintendoDots();
    updateNintendoCarousel();
    
    // Auto-slide cada 6 segundos
    setInterval(() => {
        moveNintendoCarousel(1);
    }, 6000);
}

// --- 2. NAVEGACIÓN CON TECLADO Y GESTOS (AÑADIDO) ---

// Navegación con teclado
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        moveNintendoCarousel(-1);
    } else if (e.key === 'ArrowRight') {
        moveNintendoCarousel(1);
    }
});

// Soporte para gestos touch en móviles
let startX = 0;
let endX = 0;
let touchStarted = false;

document.addEventListener('touchstart', (e) => {
    startX = e.changedTouches[0].screenX;
    touchStarted = true;
});

document.addEventListener('touchend', (e) => {
    if (!touchStarted) return;
    
    endX = e.changedTouches[0].screenX;
    handleSwipe();
    touchStarted = false;
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diffX = startX - endX;
    
    if (Math.abs(diffX) > swipeThreshold) {
        if (diffX > 0) {
            moveNintendoCarousel(1); // Swipe left
        } else {
            moveNintendoCarousel(-1); // Swipe right
        }
    }
}

// --- 3. FUNCIÓN addToCart MEJORADA Y CORREGIDA (REEMPLAZADA) ---

// **NOTA:** Modifiqué la función para aceptar el 'button' como quinto parámetro
// para que el feedback visual funcione correctamente.
function addToCart(gameId, gameName, price, image, button) {
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
            platform: 'nintendo'
        });
    }
    
    updateCartDisplay();
    saveCartToFirestore();
    showNotification(`${gameName} añadido al carrito`, 'success');
    
    // Feedback visual mejorado para el botón
    if (button) {
        const originalText = button.textContent;
        button.textContent = '¡Añadido!';
        button.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = 'linear-gradient(135deg, #0066cc, #0052a3)';
        }, 2000);
    }
}

// --- 4. MANEJO DE REDIMENSIONAMIENTO DE VENTANA (AÑADIDO) ---

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        updateNintendoCarousel();
    }, 250);
});

// =========================================================================
// === FIN DEL CÓDIGO NUEVO INTEGRADO ======================================
// =========================================================================

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
    
    if (totalSlides === 0) return;
    setInterval(() => {
        slides[currentHeroSlide].classList.remove('active');
        currentHeroSlide = (currentHeroSlide + 1) % totalSlides;
        slides[currentHeroSlide].classList.add('active');
    }, 5000);
}

// Featured Games Carousel
function moveCarousel(direction) {
    const container = document.querySelector('.games-container');
    if (!container) return;
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

// Nintendo Switch Online Carousel
let currentNintendoOnlineSlide = 0; // Variable declarada aquí para esta función
function moveNintendoOnlineCarousel(direction) {
    const container = document.querySelector('.nintendo-online-container');
    if (!container) return;
    const cards = document.querySelectorAll('.nintendo-online-card');
    const cardWidth = 410;
    const totalCards = cards.length;
    const visibleCards = Math.floor(window.innerWidth / cardWidth);
    const maxSlide = Math.max(0, totalCards - visibleCards);
    
    currentNintendoOnlineSlide += direction;
    
    if (currentNintendoOnlineSlide < 0) {
        currentNintendoOnlineSlide = 0;
    } else if (currentNintendoOnlineSlide > maxSlide) {
        currentNintendoOnlineSlide = maxSlide;
    }
    
    const translateX = -currentNintendoOnlineSlide * cardWidth;
    container.style.transform = `translateX(${translateX}px)`;
}

// Modal functions
function toggleCart() {
    const modal = document.getElementById('cartModal');
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
    
    // Cuando se abre el modal, mostrar los items del carrito
    if (modal.style.display === 'block') {
        displayCartItems();
    }
}

// Actualizar display del carrito
function updateCartDisplay() {
    const cartCount = document.querySelector('.cart-count');
    if(!cartCount) return;
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.disabled = cart.length === 0;
        checkoutBtn.onclick = proceedToCheckout;
    }
}

// Mostrar items del carrito
// Función displayCartItems actualizada
function displayCartItems() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');
    
    if (!cartItemsContainer || !cartTotalElement) return;

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
                    <div class="price">$${item.price.toFixed(2)}</div>
                    <div class="platform">Nintendo</div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', -1)">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', 1)">+</button>
                        <button class="remove-btn" onclick="removeFromCart('${item.id}')">Eliminar</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    cartItemsContainer.innerHTML = cartHTML;
    cartTotalElement.textContent = total.toFixed(2);
    
    // Configurar el botón de checkout
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.disabled = false;
        checkoutBtn.onclick = proceedToCheckout;
    }
}

// Proceder al checkout con plataforma Nintendo
function proceedToCheckout() {
    if (cart.length === 0) {
        showNotification('El carrito está vacío', 'warning');
        return;
    }
    
    // Guardar carrito en localStorage
    localStorage.setItem('guestCart', JSON.stringify(cart));
    
    // AGREGAR ESTAS LÍNEAS:
    const currentPlatformFile = window.location.pathname.split('/').pop();
    localStorage.setItem('checkoutOrigin', currentPlatformFile);
    
    // Guardar en Firestore si está logueado
    if (isLoggedIn && currentUser) {
        saveCartToFirestore();
    }
    
    // Redirigir a checkout
    window.location.href = 'checkout.html';
}

// Navigation functions
function goToGameDetail(gameId) {
    showNotification(`Navegando a detalles de ${gameId}`, 'info');
    
    setTimeout(() => {
        // Aquí puedes crear páginas específicas de Nintendo o usar una genérica
        window.location.href = `game-detail.html?id=${gameId}&platform=nintendo`;
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
    
    // Colores específicos para Nintendo
    switch(type) {
        case 'success':
            notification.style.background = 'linear-gradient(135deg, #0066cc, #0052a3)';
            notification.style.color = '#fff';
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
    
    // Evento para búsqueda con Enter
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    showNotification(`Buscando: "${query}"`, 'info');
                    performSearch();
                }
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

        // Precios para juegos de Nintendo
        const gamePricesSection1 = {
            'Super Mario Odyssey': 59.99,
            'The Legend of Zelda: Breath of the Wild': 59.99,
            'Pokémon Legends: Arceus': 59.99,
            'Animal Crossing: New Horizons': 59.99,
            'Super Smash Bros. Ultimate': 59.99,
            'Mario Kart 8 Deluxe': 59.99,
            'Splatoon 3': 59.99,
            'Metroid Dread': 59.99,
            'Kirby and the Forgotten Land': 59.99
        };

        const price = gamePricesSection1[title] || 59.99;
        
        if (!addToCartBtn && gameInfo) {
            addToCartBtn = document.createElement('button');
            addToCartBtn.className = 'add-to-cart-btn';
            addToCartBtn.style.cssText = `
                background: linear-gradient(135deg, #0066cc, #0052a3);
                color: #fff;
                border: none;
                margin-top: 10px;
                padding: 10px 20px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                transition: all 0.3s;
                width: 100%;
                box-shadow: 0 3px 10px rgba(0, 102, 204, 0.3);
            `;
            
            addToCartBtn.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 5px 15px rgba(0, 102, 204, 0.4)';
            });
            
            addToCartBtn.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 3px 10px rgba(0, 102, 204, 0.3)';
            });
            
            // **CORRECCIÓN:** Pasamos 'this' (el botón) como último argumento a addToCart
            addToCartBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                addToCart(`nintendo-game-${index}`, title, price, image, this);
            });
            
            gameInfo.appendChild(addToCartBtn);
        }
        
        if (addToCartBtn) {
            addToCartBtn.textContent = `Añadir - $${price.toFixed(2)}`;
        }
    });
}

// Función para añadir botones a las tarjetas Nintendo
function addCartButtonsToNintendoGames() {
    const nintendoCards = document.querySelectorAll('.nintendo-available-card');
    
    nintendoCards.forEach((card, index) => {
        let addToCartBtn = card.querySelector('.add-to-cart-btn');
        
        const cardInfo = card.querySelector('.card-info');
        const title = card.querySelector('h3').textContent;
        const image = card.querySelector('img').src;
        
        // Precios para juegos de Nintendo disponibles
        const gamePrices = {
            'Super Mario Odyssey': 59.99,
            'The Legend of Zelda: Breath of the Wild': 59.99,
            'Pokémon Legends: Arceus': 59.99,
            'Animal Crossing: New Horizons': 59.99,
            'Super Smash Bros. Ultimate': 59.99,
            'Mario Kart 8 Deluxe': 59.99,
            'Splatoon 3': 69.99,
            'Metroid Dread': 59.99,
            'Kirby and the Forgotten Land': 59.99
        };
        
        // Obtener el precio específico para este juego
        const price = gamePrices[title] || 59.99; // Precio por defecto
        
        if (!addToCartBtn && cardInfo) {
            addToCartBtn = document.createElement('button');
            addToCartBtn.className = 'add-to-cart-btn';
            addToCartBtn.style.cssText = `
                background: linear-gradient(135deg, #0066cc, #0052a3);
                color: #fff;
                border: none;
                margin-top: 10px;
                padding: 10px 20px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                transition: all 0.3s;
                width: 100%;
                box-shadow: 0 3px 10px rgba(0, 102, 204, 0.3);
            `;
            
            addToCartBtn.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 5px 15px rgba(0, 102, 204, 0.4)';
            });
            
            addToCartBtn.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 3px 10px rgba(0, 102, 204, 0.3)';
            });
            
            // **CORRECCIÓN:** Pasamos 'this' (el botón) como último argumento a addToCart
            addToCartBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                addToCart(`nintendo-available-${index}`, title, price, image, this);
            });

            cardInfo.appendChild(addToCartBtn);
        }

        if (addToCartBtn) {
            addToCartBtn.textContent = `Añadir - $${price.toFixed(2)}`;
        }
    });
}

// Funciones dummy y estilos que faltaban para que no den error
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
            border: 1px solid #0066cc;
            border-radius: 8px;
            min-width: 220px;
            box-shadow: 0 8px 32px rgba(0, 102, 204, 0.2);
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
            color: #0066cc;
        }
        
        .dropdown-item:hover {
            background: rgba(0, 102, 204, 0.1);
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

function handleSearch(query) { 
    if (query.trim()) {
        showNotification(`Buscando: "${query}"`, 'info');
    }
}

// ========================================
// SISTEMA DE NOTIFICACIONES EN TIEMPO REAL
// ========================================

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
        border: 1px solid #0066cc;
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
            border-color: #0066cc;
            background: rgba(0, 102, 204, 0.1);
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
        case 'order_confirmed': return 'linear-gradient(135deg, #0066cc, #0052a3)';
        case 'order_rejected': return 'linear-gradient(135deg, #f44336, #d32f2f)';
        case 'order_shipped': return 'linear-gradient(135deg, #0066cc, #0052a3)';
        case 'custom': return 'linear-gradient(135deg, #ff9800, #f57c00)';
        default: return 'linear-gradient(135deg, #666, #555)';
    }
}

function getNotificationAccentColor(type) {
    switch (type) {
        case 'order_confirmed': return '#0066cc';
        case 'order_rejected': return '#ef5350';
        case 'order_shipped': return '#0066cc';
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
        <div style="background: linear-gradient(135deg, #1e1e1e, #2a2a2a); border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow: hidden; border: 1px solid #0066cc;">
            <div style="padding: 1.5rem; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">
                <h2 style="color: #0066cc; margin: 0;">Centro de Notificaciones</h2>
                <button onclick="closeNotificationCenter()" style="background: none; border: none; color: #ccc; font-size: 1.5rem; cursor: pointer;">×</button>
            </div>
            <div id="notification-list" style="padding: 1rem; max-height: 400px; overflow-y: auto;">
                <div style="text-align: center; color: #666; padding: 2rem;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i><br>
                    Cargando notificaciones...
                </div>
            </div>
            <div style="padding: 1rem; border-top: 1px solid #333; text-align: center;">
                <button onclick="markAllNotificationsRead()" style="background: linear-gradient(135deg, #0066cc, #0052a3); color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600;">
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
                                background: ${notification.read ? '#2a2a2a' : 'rgba(0, 102, 204, 0.1)'}; 
                                ${!notification.read ? 'border-left: 4px solid #0066cc;' : ''}">
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
                            ${!notification.read ? '<div style="width: 8px; height: 8px; background: #0066cc; border-radius: 50%;"></div>' : ''}
                        </div>
                        <div style="color: ${notification.read ? '#999' : '#ccc'}; line-height: 1.4;">
                            ${notification.message}
                        </div>
                        ${notification.orderNumber ? 
                            `<div style="margin-top: 0.5rem; font-size: 0.8rem; color: #0066cc;">
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
            const notificationList = document.getElementById('notification-list');
            if (notificationList) {
                notificationList.innerHTML = `
                    <div style="text-align: center; color: #f44336; padding: 2rem;">
                        Error cargando notificaciones
                    </div>
                `;
            }
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

// Verificación periódica del estado de bloqueo
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
            window.location.href = 'nintendo.html';
        });
    }, 3000);
}

// Limpiar interval cuando se cierre la página
window.addEventListener('beforeunload', () => {
    if (blockCheckInterval) {
        clearInterval(blockCheckInterval);
    }
});

// Función para testing
function testNotification() {
    if (!currentUser) {
        showNotification('Debes estar autenticado para probar notificaciones', 'warning');
        return;
    }
    
    const testNotification = {
        id: 'test-' + Date.now(),
        type: 'order_confirmed',
        title: '¡Pedido de Nintendo Confirmado!',
        message: 'Esta es una notificación de prueba para verificar que el sistema funciona correctamente en Nintendo.',
        orderNumber: 'NINTENDO-123456',
        createdAt: { toDate: () => new Date() },
        read: false
    };
    
    showRealTimeNotification(testNotification);
}

// Exponer función de testing globalmente
window.testNotification = testNotification;


// ========================================
// SISTEMA DE NAVEGACIÓN POR SECCIONES
// ========================================

function initializeNavigation() {
    console.log('Inicializando navegación Nintendo...');
    
    setTimeout(function() {
        const navLinks = document.querySelectorAll('.nav-link');
        console.log('Enlaces Nintendo encontrados:', navLinks.length);
        
        if (navLinks.length === 0) {
            console.error('No se encontraron enlaces de navegación Nintendo');
            return;
        }
        
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Click Nintendo en:', this.textContent);
                
                const sectionName = this.textContent.trim().toLowerCase();
                const sectionId = normalizeSectionName(sectionName);
                
                console.log('Navegando a sección Nintendo:', sectionId);
                
                showSection(sectionId);
                markActiveLink(this);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }, 100);
}

function normalizeSectionName(name) {
    // Remover íconos y limpiar el texto
    const cleanName = name.replace(/[^a-záéíóúñ0-9\s]/gi, '').trim();
    
    // Mapeo de nombres específicos para Nintendo
    const nameMap = {
        'inicio': 'principal',
        'nintendo switch': 'nintendoswitch',
        'nintendo 3ds': 'nintendo3ds',
        'nintendo online': 'nintendoonline',
        'accesorios': 'accesorios',
        'noticias': 'noticias',
        'tienda': 'tienda',
        'asistencia': 'asistencia'
    };
    
    return nameMap[cleanName] || 'principal'; // Por defecto mostrar juegos
}

function showSection(sectionId) {
    // Ocultar todas las secciones
    const allSections = document.querySelectorAll('.content-section');
    allSections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Mostrar la sección seleccionada
    const targetSection = document.getElementById(`section-${sectionId}`);
    if (targetSection) {
        targetSection.style.display = 'block';
        
        // Guardar la sección actual en sessionStorage
        sessionStorage.setItem('currentSection', sectionId);
    } else {
        console.warn(`Sección Nintendo no encontrada: section-${sectionId}`);
        // Si no existe, mostrar juegos por defecto
        const defaultSection = document.getElementById('section-juegos');
        if (defaultSection) {
            defaultSection.style.display = 'block';
        }
    }
}

function markActiveLink(activeLink) {
    // Remover clase active de todos los enlaces
    const allLinks = document.querySelectorAll('.nav-link');
    allLinks.forEach(link => {
        link.classList.remove('active');
        link.style.color = '#fff';
    });
    
    // Marcar el enlace activo
    activeLink.classList.add('active');
    activeLink.style.color = '#0066cc';
}

// Restaurar sección al recargar página
function restoreSection() {
    const savedSection = sessionStorage.getItem('currentSection') || 'principal';
    showSection(savedSection);
    
    // Marcar el enlace correspondiente
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const linkSection = normalizeSectionName(link.textContent.trim().toLowerCase());
        if (linkSection === savedSection) {
            markActiveLink(link);
        }
    });
}

// ========================================
// SISTEMA DE BÚSQUEDA PARA NINTENDO
// ========================================

// Base de datos de productos Nintendo para búsqueda
const nintendoSearchDatabase = [
    // Juegos Nintendo Switch
    {
        id: 'super-mario-odyssey',
        title: 'Super Mario Odyssey',
        price: 59.99,
        image: 'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_1240/b_white/f_auto/q_auto/ncom/software/switch/70010000001130/c42553b4fd0312c31e70ec7468c6c9bccd739f340152925b9600631f2d29f8b5',
        type: 'Juego Nintendo Switch',
        category: 'nintendoswitch',
        section: 'section-principal'
    },
    {
        id: 'zelda-breath-wild',
        title: 'The Legend of Zelda: Breath of the Wild',
        price: 59.99,
        image: 'https://www.nintendo.com/eu/media/images/10_share_images/games_15/wiiu_14/SI_WiiU_TheLegendOfZeldaBreathOfTheWild_image1600w.jpg',
        type: 'Juego Nintendo Switch',
        category: 'nintendoswitch',
        section: 'section-principal'
    },
    {
        id: 'pokemon-arceus',
        title: 'Pokémon Legends: Arceus',
        price: 59.99,
        image: 'https://assets.nintendo.com/image/upload/c_fill,w_1200/q_auto:best/f_auto/dpr_2.0/ncom/software/switch/70010000039945/dcb496d7cf954c7eb51ab2e5d0c27918fb7f055e50f4e902135bd4a70a44b491',
        type: 'Juego Nintendo Switch',
        category: 'nintendoswitch',
        section: 'section-principal'
    },
    {
        id: 'animal-crossing',
        title: 'Animal Crossing: New Horizons',
        price: 59.99,
        image: 'https://assets.nintendo.com/image/upload/c_fill,w_1200/q_auto:best/f_auto/dpr_2.0/ncom/software/switch/70010000027619/9989957eae3a6b545194c42fec2071675c34aadacd65e6b33fdfe7b3b6a86c3a',
        type: 'Juego Nintendo Switch',
        category: 'nintendoswitch',
        section: 'section-principal'
    },
    {
        id: 'smash-bros',
        title: 'Super Smash Bros. Ultimate',
        price: 59.99,
        image: 'https://assets.nintendo.com/image/upload/q_auto/f_auto/ncom/software/switch/70010000012332/ac4d1fc9824876ce756406f0525d50c57ded4b2a666f6dfe40a6ac5c3563fad9',
        type: 'Juego Nintendo Switch',
        category: 'nintendoswitch',
        section: 'section-principal'
    },
    {
        id: 'mario-kart-8',
        title: 'Mario Kart 8 Deluxe',
        price: 59.99,
        image: 'https://assets.nintendo.com/image/upload/q_auto/f_auto/ncom/software/switch/70010000000153/de697f487a36d802dd9a5ff0341f717c8486221f2f1219b675af37aca63bc453',
        type: 'Juego Nintendo Switch',
        category: 'nintendoswitch',
        section: 'section-principal'
    },
    {
        id: 'splatoon-3',
        title: 'Splatoon 3',
        price: 59.99,
        image: 'https://assets.nintendo.com/image/upload/q_auto:best/f_auto/dpr_2.0/ncom/software/switch/70010000046395/4555efa9f2061f7d1e1646ab3d3af790a7491270b1b3e32e730273e9ac096827',
        type: 'Juego Nintendo Switch',
        category: 'nintendoswitch',
        section: 'section-principal'
    },
    {
        id: 'metroid-dread',
        title: 'Metroid Dread',
        price: 59.99,
        image: 'https://www.nintendolink.com/wp-content/uploads/2021/10/share-fb.jpg',
        type: 'Juego Nintendo Switch',
        category: 'nintendoswitch',
        section: 'section-principal'
    },
    {
        id: 'kirby-forgotten',
        title: 'Kirby and the Forgotten Land',
        price: 59.99,
        image: 'https://m.media-amazon.com/images/I/91vd7WQ1acL.jpg',
        type: 'Juego Nintendo Switch',
        category: 'nintendoswitch',
        section: 'section-principal'
    },

    // Accesorios Nintendo
    {
        id: 'joy-con',
        title: 'Joy-Con (L/R)',
        price: 79.99,
        image: 'https://oechsle.vteximg.com.br/arquivos/ids/20133115-1000-1000/2772792.jpg?v=638690468985400000',
        type: 'Accesorio',
        category: 'accesorios',
        section: 'section-accesorios'
    },
    {
        id: 'pro-controller',
        title: 'Nintendo Switch Pro Controller',
        price: 69.99,
        image: 'https://lamarinamx.vtexassets.com/arquivos/ids/1348511-800-800?v=638870696418770000&width=800&height=800&aspect=true',
        type: 'Accesorio',
        category: 'accesorios',
        section: 'section-accesorios'
    },

    // Consolas Nintendo
    {
        id: 'switch-oled',
        title: 'Nintendo Switch OLED',
        price: 349.99,
        image: 'https://home.ripley.com.pe/Attachment/WOP_5/2031281180240/2031281180240_2.jpg',
        type: 'Consola',
        category: 'nintendoswitch',
        section: 'section-nintendoswitch'
    },
    {
        id: 'switch-standard',
        title: 'Nintendo Switch',
        price: 299.99,
        image: 'https://i5.walmartimages.com/seo/Nintendo-Switch-with-Neon-Blue-and-Neon-Red-Joy-Con-Game-console-Full-HD-black-neon-red-neon-blue-Mario-Kart-8-Deluxe_090018d8-417b-47e8-92ce-bdbcf63f9a0b.e997ebb06bf3a68147a32d7dcba5b4d7.jpeg',
        type: 'Consola',
        category: 'nintendoswitch',
        section: 'section-nintendoswitch'
    },
    {
        id: 'switch-lite',
        title: 'Nintendo Switch Lite',
        price: 199.99,
        image: 'https://http2.mlstatic.com/D_Q_NP_827500-MLA40176358181_122019-O.webp',
        type: 'Consola',
        category: 'nintendoswitch',
        section: 'section-nintendoswitch'
    }
];

// Función para realizar la búsqueda en Nintendo
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim().toLowerCase();
    
    if (!query) {
        hideSearchResults();
        return;
    }
    
    const results = nintendoSearchDatabase.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
    
    displaySearchResults(results, query);
}

// Función para mostrar resultados de búsqueda
function displaySearchResults(results, query) {
    let searchResultsContainer = document.getElementById('searchResults');
    
    // Crear contenedor si no existe
    if (!searchResultsContainer) {
        searchResultsContainer = document.createElement('div');
        searchResultsContainer.id = 'searchResults';
        searchResultsContainer.className = 'search-results';
        
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) {
            searchContainer.style.position = 'relative';
            searchContainer.appendChild(searchResultsContainer);
        }
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
                    <img src="${item.image}" alt="${item.title}" class="search-result-image">
                    <div class="search-result-info">
                        <div class="search-result-title">${highlightedTitle}</div>
                        <div class="search-result-price">$${item.price.toFixed(2)}</div>
                    </div>
                    <span class="search-result-type">${highlightedType}</span>
                </div>
            `;
        });
        
        searchResultsContainer.innerHTML = resultsHTML;
    }
    
    searchResultsContainer.style.display = 'block';
}

// Función para resaltar texto en resultados
function highlightText(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

// Función para seleccionar un resultado de búsqueda
function selectSearchResult(itemId, sectionId) {
    const item = nintendoSearchDatabase.find(i => i.id === itemId);
    
    if (item) {
        // Navegar a la sección correspondiente
        const sectionName = sectionId.replace('section-', '');
        showSection(sectionName);
        
        // Marcar el enlace activo
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const linkSection = normalizeSectionName(link.textContent.trim().toLowerCase());
            if (linkSection === sectionName) {
                markActiveLink(link);
            }
        });
        
        // Ocultar resultados de búsqueda
        hideSearchResults();
        
        // Limpiar campo de búsqueda
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Si es un juego (va a la sección principal), hacer scroll a la sección 4
        if (sectionId === 'section-principal') {
            setTimeout(() => {
                const section4 = document.querySelector('.nintendo-available-section');
                if (section4) {
                    section4.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }, 500); // Pequeño delay para que cargue la sección
        }
        
        showNotification(`Navegando a ${item.title}`, 'info');
    }
}

// Función para ocultar resultados de búsqueda
function hideSearchResults() {
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
        searchResults.style.display = 'none';
    }
}

// Inicializar eventos de búsqueda
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    
    if (searchInput) {
        searchInput.addEventListener('input', performSearch);
        searchInput.addEventListener('focus', function() {
            if (this.value.trim()) {
                performSearch();
            }
        });
        
        // Ocultar resultados al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.search-container')) {
                hideSearchResults();
            }
        });
    }
}

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