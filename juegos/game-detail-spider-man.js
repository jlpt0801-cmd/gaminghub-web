// Variables globales
let cart = [];
let isLoggedIn = false;
let currentUser = null;

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

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Función principal de inicialización
function initializeApp() {
    checkAuth();
    updateCartDisplay();
    initializeEventListeners();
}

// ========================================
// SISTEMA DE AUTENTICACIÓN
// ========================================

// Función para verificar autenticación
function checkAuth() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            isLoggedIn = true;
            updateLoginButton();
            loadCartFromFirestore();
        } else {
            currentUser = null;
            isLoggedIn = false;
            updateLoginButton();
            cart = [];
            updateCartDisplay();
        }
    });
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
                } else {
                    loginBtn.innerHTML = `<i class="fas fa-user-circle"></i> Mi Cuenta`;
                }
            })
            .catch(() => {
                loginBtn.innerHTML = `<i class="fas fa-user-circle"></i> Mi Cuenta`;
            });
    } else {
        loginBtn.innerHTML = 'Iniciar sesión';
        loginBtn.onclick = redirectToAuth;
    }
}

// Función para redirigir a la página de autenticación
function redirectToAuth() {
    if (isLoggedIn) {
        // Aquí podrías mostrar un menú desplegable de usuario
        showNotification('Ya estás autenticado', 'info');
    } else {
        window.location.href = '../auth.html?redirect=game-detail-spider-man.html';
    }
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
function addToCart() {
    const gameId = 'spider-man-miles-morales';
    const gameName = 'Marvel\'s Spider-Man: Miles Morales';
    const price = 49.99;
    const image = 'https://cdn2.steamgriddb.com/logo_thumb/49ac4dcbd03f3f39085f257edefb5d0d.png';
    
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
            quantity: 1
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
                <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px;">
                <div class="cart-item-info" style="flex: 1; margin-left: 15px;">
                    <h4 style="margin-bottom: 5px;">${item.name}</h4>
                    <p style="color: #0070f3; font-weight: bold;">$${item.price.toFixed(2)}</p>
                </div>
                <div class="cart-item-controls" style="display: flex; align-items: center; gap: 10px;">
                    <button onclick="updateCartQuantity('${item.id}', -1)" style="width: 30px; height: 30px; border: none; background: #333; color: white; border-radius: 3px; cursor: pointer;">-</button>
                    <span style="min-width: 20px; text-align: center;">${item.quantity}</span>
                    <button onclick="updateCartQuantity('${item.id}', 1)" style="width: 30px; height: 30px; border: none; background: #333; color: white; border-radius: 3px; cursor: pointer;">+</button>
                    <button onclick="removeFromCart('${item.id}')" style="margin-left: 10px; padding: 5px 10px; background: #d32f2f; color: white; border: none; border-radius: 3px; cursor: pointer;">Eliminar</button>
                </div>
            </div>
            <hr style="margin: 15px 0; border: none; border-top: 1px solid #333;">
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
    localStorage.setItem('checkoutOrigin', 'game-detail-spider-man.html');
    
    if (isLoggedIn && currentUser) {
        saveCartToFirestore();
    }
    
    window.location.href = '../checkout.html';
}

// Modal functions
function toggleCart() {
    const modal = document.getElementById('cartModal');
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
    
    if (modal.style.display === 'block') {
        displayCartItems();
    }
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modal = document.getElementById('cartModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// ========================================
// NOTIFICACIONES
// ========================================

function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // Estilos para la notificación
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 350px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    const content = notification.querySelector('.notification-content');
    content.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        margin-left: 15px;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-eliminar después de 4 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 4000);
}

// ========================================
// ANIMACIONES Y EFECTOS
// ========================================

function initializeEventListeners() {
    // Efecto de scroll suave para enlaces internos
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
    
    // Efecto parallax en sección de descripción
    window.addEventListener('scroll', function() {
        const descriptionSection = document.querySelector('.description-section');
        if (descriptionSection) {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            descriptionSection.style.backgroundPosition = `center ${rate}px`;
        }
    });
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================

document.addEventListener('keydown', function(e) {
    // Ctrl + K para buscar (cuando implementemos búsqueda)
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        // Aquí podríamos abrir un modal de búsqueda
        showNotification('Función de búsqueda en desarrollo', 'info');
    }
    
    // Escape para cerrar modales
    if (e.key === 'Escape') {
        const modal = document.getElementById('cartModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
});

// ========================================
// PERFORMANCE OPTIMIZATIONS
// ========================================

// Lazy loading para imágenes
document.addEventListener('DOMContentLoaded', function() {
    const lazyImages = [].slice.call(document.querySelectorAll('img[data-src]'));
    
    if ('IntersectionObserver' in window) {
        const lazyImageObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const lazyImage = entry.target;
                    lazyImage.src = lazyImage.dataset.src;
                    lazyImage.classList.remove('lazy');
                    lazyImageObserver.unobserve(lazyImage);
                }
            });
        });
        
        lazyImages.forEach(function(lazyImage) {
            lazyImageObserver.observe(lazyImage);
        });
    }
});

// ========================================
// CSS ANIMATIONS
// ========================================

// Añadir estilos para animaciones
const style = document.createElement('style');
style.textContent = `
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
    
    .cart-item {
        display: flex;
        align-items: center;
        padding: 10px 0;
    }
    
    .notification {
        transition: all 0.3s ease;
    }
`;
document.head.appendChild(style);