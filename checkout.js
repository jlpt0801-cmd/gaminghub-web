// Variables globales
let cart = [];
let currentUser = null;
let isLoggedIn = false;
let selectedPaymentMethod = 'card';
let originPage = 'ps5.html'; // Variable para almacenar la página de origen

// ========================================
// SISTEMA DE DESCUENTOS POR SUSCRIPCIÓN
// ========================================

let userSubscription = 'Essential';
let subscriptionDiscount = 0;

/**
 * Carga la suscripción del usuario y calcula descuentos
 */
async function loadSubscriptionInfo() {
    if (!currentUser) {
        userSubscription = 'Essential';
        subscriptionDiscount = 0;
        return;
    }
    
    try {
        const doc = await db.collection('users').doc(currentUser.uid).get();
        if (doc.exists) {
            userSubscription = doc.data().subscription || 'Essential';
            
            // Calcular descuento
            const discounts = {
                'Essential': 0.05,
                'Extra': 0.15,
                'Premium': 0.25
            };
            
            subscriptionDiscount = discounts[userSubscription] || 0;
            displaySubscriptionInfo();
        }
    } catch (error) {
        console.error('Error cargando suscripción:', error);
    }
}

/**
 * Muestra información de la suscripción en el checkout
 */
function displaySubscriptionInfo() {
    const orderSummary = document.querySelector('.order-summary');
    if (!orderSummary) return;
    
    // Buscar o crear contenedor de suscripción
    let subInfo = document.getElementById('subscription-info');
    if (!subInfo) {
        subInfo = document.createElement('div');
        subInfo.id = 'subscription-info';
        orderSummary.insertBefore(subInfo, orderSummary.firstChild);
    }
    
    const discountPercentage = Math.round(subscriptionDiscount * 100);
    
    subInfo.innerHTML = `
        <div class="subscription-checkout-card">
            <div class="subscription-checkout-header">
                <i class="fas fa-crown"></i>
                <span>PlayStation Plus ${userSubscription}</span>
            </div>
            <div class="subscription-checkout-discount">
                <i class="fas fa-tag"></i>
                Descuento aplicado: <strong>${discountPercentage}%</strong>
            </div>
        </div>
    `;
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

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    initializeCheckout();
});

// Función principal de inicialización
async function initializeCheckout() {
    detectOriginPage();
    updateBackToStoreLink();
    checkAuth();
    await loadSubscriptionInfo(); // ✅ NUEVO: Cargar suscripción
    loadCartFromStorage();
    setupEventListeners();
    updateOrderSummary();
    setupPaymentTabs();
}

// Función para actualizar el enlace "Volver a la Tienda"
function updateBackToStoreLink() {
    const backLink = document.getElementById('backToStoreLink');
    if (backLink) {
        backLink.href = originPage;
        backLink.textContent = `Volver a ${getStoreName()}`;
    }
}

// NUEVA FUNCIÓN: Detectar la página de origen
function detectOriginPage() {
    // Primero intentar obtener de localStorage
    const savedOrigin = localStorage.getItem('checkoutOrigin');
    if (savedOrigin) {
        originPage = savedOrigin;
        return;
    }
    
    // Si no hay en localStorage, intentar detectar desde el referrer
    const referrer = document.referrer;
    if (referrer) {
        if (referrer.includes('xbox.html')) {
            originPage = 'xbox.html';
        } else if (referrer.includes('nintendo.html')) {
            originPage = 'nintendo.html';
        } else if (referrer.includes('ps5.html')) {
            originPage = 'ps5.html';
        }
    }
    
    // También verificar parámetros URL como respaldo
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = urlParams.get('from');
    if (fromParam && ['ps5', 'xbox', 'nintendo'].includes(fromParam)) {
        originPage = fromParam + '.html';
    }
}

// NUEVA FUNCIÓN: Obtener el nombre de la tienda según la página de origen
function getStoreName() {
    switch(originPage) {
        case 'xbox.html':
            return 'Xbox Store';
        case 'nintendo.html':
            return 'Nintendo Store';
        case 'ps5.html':
        default:
            return 'PlayStation Store';
    }
}

// Función para verificar autenticación - VERSIÓN MEJORADA
function checkAuth() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Verificar si el usuario está bloqueado ANTES de continuar
            db.collection('users').doc(user.uid).get()
                .then(doc => {
                    if (doc.exists && doc.data().blocked === true) {
                        // Usuario bloqueado - redirigir a la página de origen
                        alert('Tu cuenta está bloqueada. No puedes realizar compras.');
                        auth.signOut();
                        window.location.href = originPage;
                        return;
                    }
                    
                    // Usuario no bloqueado - continuar
                    currentUser = user;
                    isLoggedIn = true;
                    updateLoginButton();
                    loadCartFromFirestore();
                    
                    // Prellenar el email si el usuario está autenticado
                    document.getElementById('email').value = user.email;
                })
                .catch(error => {
                    console.error('Error verificando usuario:', error);
                });
        } else {
            currentUser = null;
            isLoggedIn = false;
            updateLoginButton();
            
            // Si no hay usuario, redirigir a login con información de origen
            showNotification('Debes iniciar sesión para completar la compra', 'warning');
            setTimeout(() => {
                // Guardar la página de origen antes de ir al login
                localStorage.setItem('checkoutOrigin', originPage);
                window.location.href = 'auth.html?redirect=checkout&from=' + originPage.replace('.html', '');
            }, 2000);
        }
    });
}

// Función para actualizar el botón de login - CORREGIDA
function updateLoginButton() {
    const loginBtn = document.getElementById('loginBtn');
    if (isLoggedIn && currentUser) {
        loginBtn.innerHTML = '<i class="fas fa-user-circle"></i> Mi Cuenta';
        loginBtn.onclick = function() {
            window.location.href = originPage; // Usar página de origen en lugar de hardcodear ps5.html
        };
    } else {
        loginBtn.innerHTML = 'Iniciar sesión';
        loginBtn.onclick = function() {
            localStorage.setItem('checkoutOrigin', originPage);
            window.location.href = 'auth.html?redirect=checkout&from=' + originPage.replace('.html', '');
        };
    }
}

// Cargar carrito desde localStorage
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('guestCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// Cargar carrito desde Firestore
function loadCartFromFirestore() {
    if (!currentUser) return;
    
    db.collection('users').doc(currentUser.uid).get()
        .then((doc) => {
            if (doc.exists && doc.data().cart) {
                cart = doc.data().cart;
                updateOrderSummary();
            }
        })
        .catch((error) => {
            console.error('Error cargando carrito:', error);
        });
}

// Guardar carrito en Firestore - VERSIÓN MEJORADA
async function saveCartToFirestore() {
    if (!currentUser) return;
    
    try {
        await db.collection('users').doc(currentUser.uid).update({
            cart: cart,
            cartUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // También limpiar localStorage por si acaso
        localStorage.removeItem('guestCart');
        
    } catch (error) {
        console.error('Error guardando carrito:', error);
        throw error;
    }
}

// Configurar event listeners - CORREGIDOS
function setupEventListeners() {
    // Form submission
    document.getElementById('payButton').addEventListener('click', processPayment);
    
    // Modal buttons - CORREGIDOS para usar página de origen
    document.getElementById('continueShopping').addEventListener('click', function() {
        window.location.href = originPage; // Cambio aquí
    });
    
    document.getElementById('viewOrder').addEventListener('click', function() {
        // En una implementación real, redirigiría a la página de detalles del pedido
        showNotification('Funcionalidad de detalles de pedido en desarrollo', 'info');
    });
    
    // Cerrar modal
    document.querySelector('.close').addEventListener('click', function() {
        document.getElementById('confirmationModal').style.display = 'none';
    });
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('confirmationModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Formatear número de tarjeta
    document.getElementById('cardNumber').addEventListener('input', formatCardNumber);
    
    // Validar formulario en tiempo real
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
    });
}

// Configurar pestañas de pago
function setupPaymentTabs() {
    const tabs = document.querySelectorAll('.payment-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remover clase active de todas las pestañas
            tabs.forEach(t => t.classList.remove('active'));
            
            // Añadir clase active a la pestaña clickeada
            this.classList.add('active');
            
            // Ocultar todos los métodos de pago
            document.querySelectorAll('.payment-method').forEach(method => {
                method.classList.remove('active');
            });
            
            // Mostrar el método de pago seleccionado
            const method = this.getAttribute('data-method');
            selectedPaymentMethod = method;
            document.getElementById(`${method}-payment`).classList.add('active');
        });
    });
}

// Formatear número de tarjeta
function formatCardNumber(e) {
    let input = e.target;
    let value = input.value.replace(/\D/g, '');
    
    // Limitar a 16 dígitos
    if (value.length > 16) {
        value = value.substring(0, 16);
    }
    
    // Agregar espacios cada 4 dígitos
    let formattedValue = '';
    for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) {
            formattedValue += ' ';
        }
        formattedValue += value[i];
    }
    
    input.value = formattedValue;
}

// Validar campo individual
function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    if (field.hasAttribute('required') && !value) {
        field.style.borderColor = '#f44336';
        return false;
    }
    
    // Validaciones específicas por tipo de campo
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            field.style.borderColor = '#f44336';
            return false;
        }
    }
    
    if (field.id === 'cardNumber' && value) {
        const cardNumber = value.replace(/\s/g, '');
        if (cardNumber.length < 16 || !luhnCheck(cardNumber)) {
            field.style.borderColor = '#f44336';
            return false;
        }
    }
    
    if (field.id === 'cardCvv' && value) {
        if (value.length < 3 || value.length > 4) {
            field.style.borderColor = '#f44336';
            return false;
        }
    }
    
    field.style.borderColor = '#444';
    return true;
}

// Algoritmo de Luhn para validar tarjeta de crédito
function luhnCheck(cardNumber) {
    let sum = 0;
    let isEven = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber.charAt(i), 10);
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    return sum % 10 === 0;
}

// Actualizar resumen del pedido
function updateOrderSummary() {
    const orderItemsContainer = document.getElementById('orderItems');
    const subtotalElement = document.getElementById('subtotal');
    const taxesElement = document.getElementById('taxes');
    const totalElement = document.getElementById('total');
    
    if (cart.length === 0) {
        orderItemsContainer.innerHTML = '<p class="empty-cart">No hay productos en el carrito</p>';
        subtotalElement.textContent = '$0.00';
        taxesElement.textContent = '$0.00';
        totalElement.textContent = '$0.00';
        return;
    }
    
    let itemsHTML = '';
    let subtotal = 0;
    let totalDiscount = 0; // ✅ NUEVO
    
    cart.forEach(item => {
        // ✅ NUEVO: Aplicar descuento de suscripción si no está aplicado
        let finalPrice = item.price;
        let originalPrice = item.originalPrice || item.price;
        let itemDiscount = 0;
        
        if (subscriptionDiscount > 0 && (!item.subscription || item.subscription !== userSubscription)) {
            itemDiscount = originalPrice * subscriptionDiscount;
            finalPrice = originalPrice - itemDiscount;
        }
        
        const itemTotal = finalPrice * item.quantity;
        const itemDiscountTotal = itemDiscount * item.quantity;
        
        subtotal += itemTotal;
        totalDiscount += itemDiscountTotal;
        
        // ✅ NUEVO: Mostrar precio original y descuento
        const priceDisplay = itemDiscount > 0 
            ? `
                <div class="order-item-price">
                    <span style="text-decoration: line-through; opacity: 0.6; margin-right: 8px;">$${originalPrice.toFixed(2)}</span>
                    <span style="color: #0070f3; font-weight: bold;">$${finalPrice.toFixed(2)}</span>
                </div>
                <div style="color: #4caf50; font-size: 0.85rem; margin-top: 4px;">
                    <i class="fas fa-tag"></i> -${Math.round(subscriptionDiscount * 100)}% ahorro
                </div>
              `
            : `<div class="order-item-price">$${finalPrice.toFixed(2)}</div>`;
        
        itemsHTML += `
            <div class="order-item">
                <img src="${item.image}" alt="${item.name}" class="order-item-img">
                <div class="order-item-details">
                    <div class="order-item-name">${item.name}</div>
                    ${priceDisplay}
                    <div class="order-item-quantity">Cantidad: ${item.quantity}</div>
                </div>
            </div>
        `;
    });
    
    orderItemsContainer.innerHTML = itemsHTML;
    
    const taxes = subtotal * 0.18;
    const total = subtotal + taxes;
    
    // ✅ NUEVO: Mostrar descuento total si existe
    const summaryHTML = `
        ${totalDiscount > 0 ? `
            <div class="summary-line" style="color: #4caf50;">
                <span>Descuento ${userSubscription}:</span>
                <span>-$${totalDiscount.toFixed(2)}</span>
            </div>
        ` : ''}
    `;
    
    // Insertar antes del total
    const totalContainer = totalElement.parentElement.parentElement;
    let discountLine = totalContainer.querySelector('.summary-line');
    if (!discountLine && totalDiscount > 0) {
        totalContainer.insertAdjacentHTML('beforebegin', summaryHTML);
    }
    
    subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    taxesElement.textContent = `$${taxes.toFixed(2)}`;
    totalElement.textContent = `$${total.toFixed(2)}`;
    
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElement = document.getElementById('headerCartCount');
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
    }
}

// Validar formulario completo
function validateForm() {
    let isValid = true;
    
    // Validar información de contacto
    if (!validateField({target: document.getElementById('email')})) isValid = false;
    if (!validateField({target: document.getElementById('phone')})) isValid = false;
    
    // Validar información de envío
    if (!validateField({target: document.getElementById('firstName')})) isValid = false;
    if (!validateField({target: document.getElementById('lastName')})) isValid = false;
    if (!validateField({target: document.getElementById('address')})) isValid = false;
    if (!validateField({target: document.getElementById('city')})) isValid = false;
    if (!validateField({target: document.getElementById('postalCode')})) isValid = false;
    if (!validateField({target: document.getElementById('country')})) isValid = false;
    
    // Validar términos y condiciones
    if (!document.getElementById('terms').checked) {
        showNotification('Debes aceptar los términos y condiciones', 'error');
        isValid = false;
    }
    
    // Validar método de pago según el seleccionado
    if (selectedPaymentMethod === 'card') {
        if (!validateField({target: document.getElementById('cardNumber')})) isValid = false;
        if (!validateField({target: document.getElementById('cardName')})) isValid = false;
        if (!validateField({target: document.getElementById('cardCvv')})) isValid = false;
        if (!validateField({target: document.getElementById('cardExpMonth')})) isValid = false;
        if (!validateField({target: document.getElementById('cardExpYear')})) isValid = false;
        if (!validateField({target: document.getElementById('cardType')})) isValid = false;
    } else if (selectedPaymentMethod === 'yape') {
        if (!validateField({target: document.getElementById('yapePhone')})) isValid = false;
    } else if (selectedPaymentMethod === 'plin') {
        if (!validateField({target: document.getElementById('plinPhone')})) isValid = false;
    }
    
    return isValid;
}

// Procesar pago - VERSIÓN MEJORADA CON ORIGEN CORRECTO
async function processPayment() {
    if (!validateForm()) {
        showNotification('Por favor, completa todos los campos requeridos correctamente', 'error');
        return;
    }
    
    // Verificar si el usuario está autenticado
    if (!isLoggedIn || !currentUser) {
        showNotification('Debes iniciar sesión para completar la compra', 'error');
        setTimeout(() => {
            localStorage.setItem('checkoutOrigin', originPage);
            window.location.href = 'auth.html?redirect=checkout&from=' + originPage.replace('.html', '');
        }, 2000);
        return;
    }
    
    // Verificar NUEVAMENTE el estado de bloqueo antes de procesar
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        
        if (userDoc.exists && userDoc.data().blocked === true) {
            alert('Tu cuenta está bloqueada. No puedes realizar esta compra.');
            auth.signOut();
            window.location.href = originPage; // Cambio aquí
            return;
        }
        
        // Si no está bloqueado, continuar con el proceso
        // Mostrar loading
        document.getElementById('loadingOverlay').style.display = 'flex';
        
        // Calcular total
        // ✅ NUEVO: Calcular subtotal con descuentos aplicados
let subtotal = 0;
let totalSavings = 0;

cart.forEach(item => {
    let finalPrice = item.price;
    let originalPrice = item.originalPrice || item.price;
    
    if (subscriptionDiscount > 0) {
        const discount = originalPrice * subscriptionDiscount;
        finalPrice = originalPrice - discount;
        totalSavings += discount * item.quantity;
    }
    
    subtotal += finalPrice * item.quantity;
});

const taxes = subtotal * 0.18;
const total = subtotal + taxes;
        
        // Generar número de orden
        const orderNumber = 'PS-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        
        // Guardar orden en Firestore
        const orderId = await saveOrderToFirestore(orderNumber, total);
        
        // Vaciar carrito
        cart = [];
        await saveCartToFirestore();
        updateOrderSummary();
        
        // Limpiar información de origen del localStorage ya que se completó la compra
        localStorage.removeItem('checkoutOrigin');
        
        // Mostrar confirmación
        showConfirmationModal(orderNumber, total);
        
    } catch (error) {
        console.error('Error verificando usuario:', error);
        showNotification('Error al verificar tu cuenta. Por favor, intenta nuevamente.', 'error');
    } finally {
        // Ocultar loading
        document.getElementById('loadingOverlay').style.display = 'none';
    }
}

// Mostrar modal de confirmación - VERSIÓN MEJORADA CON ORIGEN CORRECTO
function showConfirmationModal(orderNumber, total) {
    const modal = document.getElementById('confirmationModal');
    
    // Actualizar contenido
    document.getElementById('orderNumber').textContent = orderNumber;
    document.getElementById('paidAmount').textContent = `$${total.toFixed(2)}`;
    document.getElementById('orderDate').textContent = new Date().toLocaleDateString('es-ES');
    
    // Método de pago formateado
    const paymentMethod = selectedPaymentMethod === 'card' ? 'Tarjeta de Crédito/Débito' : 
                         selectedPaymentMethod === 'yape' ? 'Yape' : 'Plin';
    document.getElementById('paymentMethod').textContent = paymentMethod;
    
    // Dirección de envío formateada
    const address = `
        ${document.getElementById('firstName').value} ${document.getElementById('lastName').value},
        ${document.getElementById('address').value},
        ${document.getElementById('city').value},
        ${document.getElementById('postalCode').value},
        ${document.getElementById('country').options[document.getElementById('country').selectedIndex].text}
    `;
    document.getElementById('shippingAddress').textContent = address;
    
    // Configurar event listeners - CORREGIDOS
    document.getElementById('viewOrder').onclick = function() {
        modal.style.display = 'none';
        showOrderDetails(orderNumber);
    };
    
    document.getElementById('printReceipt').onclick = function() {
        printReceipt(orderNumber);
    };
    
    document.getElementById('continueShopping').onclick = function() {
        modal.style.display = 'none';
        window.location.href = originPage; // Cambio aquí
    };
    
    // Cerrar modal al hacer clic en la X
    document.querySelector('.close').onclick = function() {
        modal.style.display = 'none';
    };
    
    // Mostrar modal
    modal.style.display = 'block';
    
    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';
}

// Función para cerrar modal
function closeModal() {
    const modal = document.getElementById('confirmationModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modal = document.getElementById('confirmationModal');
    if (event.target === modal) {
        closeModal();
    }
};

// En setupEventListeners(), añade:
document.getElementById('printReceipt').addEventListener('click', function() {
    const orderNumber = document.getElementById('orderNumber').textContent;
    printReceipt(orderNumber);
});

// Actualizar el event listener para el botón de ver detalles
document.getElementById('viewOrder').addEventListener('click', function() {
    const orderNumber = document.getElementById('orderNumber').textContent;
    document.getElementById('confirmationModal').style.display = 'none';
    document.body.style.overflow = 'auto'; // Restaurar scroll
    showOrderDetails(orderNumber);
});

// Guardar orden en Firestore - VERSIÓN CORREGIDA CON INFORMACIÓN DE ORIGEN
// Guardar orden en Firestore - VERSIÓN CORREGIDA
async function saveOrderToFirestore(orderNumber, total) {
    try {
        // ✅ CALCULAR totalSavings AQUÍ
        let subtotal = 0;
        let totalSavings = 0;
        
        cart.forEach(item => {
            let finalPrice = item.price;
            let originalPrice = item.originalPrice || item.price;
            
            if (subscriptionDiscount > 0) {
                const discount = originalPrice * subscriptionDiscount;
                finalPrice = originalPrice - discount;
                totalSavings += discount * item.quantity;
            }
            
            subtotal += finalPrice * item.quantity;
        });
        
        // Crear el objeto de orden con TODOS los datos necesarios
        const orderData = {
            orderNumber: orderNumber,
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                originalPrice: item.originalPrice || item.price,
                discount: item.discount || 0,
                quantity: item.quantity,
                image: item.image
            })),
            total: total,
            subtotal: subtotal,
            totalSavings: totalSavings, // ✅ AHORA SÍ ESTÁ DEFINIDA
            status: 'pending',
            paymentMethod: selectedPaymentMethod,
            platform: originPage.replace('.html', ''),
            storeName: getStoreName(),
            subscription: userSubscription,
            subscriptionDiscount: subscriptionDiscount,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            customer: {
                uid: currentUser.uid,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                subscription: userSubscription
            },
            shipping: {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                postalCode: document.getElementById('postalCode').value,
                country: document.getElementById('country').value
            }
        };
        
        // Guardar en Firestore
        const docRef = await db.collection('orders').add(orderData);
        console.log('✅ Orden guardada correctamente con ID:', docRef.id);
        
        return docRef.id;
        
    } catch (error) {
        console.error('❌ Error guardando orden:', error);
        throw error;
    }
}

// Función para crear notificación para administradores
function createAdminNotification(orderNumber) {
    const notificationData = {
        type: 'new_order',
        title: 'Nuevo Pedido Recibido',
        message: `Se ha recibido un nuevo pedido #${orderNumber} de ${getStoreName()} que requiere confirmación.`,
        orderNumber: orderNumber,
        platform: originPage.replace('.html', ''),
        storeName: getStoreName(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        read: false,
        priority: 'high'
    };
    
    // Guardar en una colección de notificaciones para admin
    db.collection('adminNotifications').add(notificationData)
        .then(() => {
            console.log('Notificación para admin creada');
        })
        .catch((error) => {
            console.error('Error creando notificación para admin:', error);
        });
}

// Sistema de notificaciones
function showNotification(message, type = 'info') {
    // Eliminar notificaciones existentes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
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

// Toggle cart modal (para consistencia con la página principal)
function toggleCart() {
    showNotification('El carrito se muestra en la página de checkout', 'info');
}

// Función para mostrar detalles completos del pedido - CORREGIDA
function showOrderDetails(orderNumber) {
    // Crear overlay para la página de detalles
    const detailsOverlay = document.createElement('div');
    detailsOverlay.className = 'order-details-overlay';
    detailsOverlay.id = 'orderDetailsOverlay';
    
    // Obtener datos del pedido recién creado
    const orderData = getRecentOrderData(orderNumber);
    
    detailsOverlay.innerHTML = `
        <div class="order-details-page">
            <div class="order-details-header">
                <div class="header-content">
                    <button onclick="closeOrderDetails()" class="back-btn" id="backButton">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <div class="header-info">
                        <h1>Detalles del Pedido</h1>
                        <p class="order-number">#${orderNumber}</p>
                        <p class="store-name">${getStoreName()}</p>
                    </div>
                    <button onclick="printOrderDetails('${orderNumber}')" class="print-btn">
                        <i class="fas fa-print"></i>
                    </button>
                </div>
            </div>
            
            <div class="order-details-content">
                <!-- Estado del pedido -->
                <div class="order-status-section">
                    <div class="status-card">
                        <div class="status-header">
                            <div class="status-icon pending">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="status-info">
                                <h3>Estado: Pendiente de Confirmación</h3>
                                <p>Tu pedido está siendo revisado por nuestro equipo</p>
                            </div>
                        </div>
                        <div class="estimated-time">
                            <i class="fas fa-calendar-alt"></i>
                            <span>Tiempo estimado de confirmación: 2-4 horas</span>
                        </div>
                    </div>
                </div>
                
                <!-- Timeline del pedido -->
                <div class="order-timeline-section">
                    <h3><i class="fas fa-route"></i> Seguimiento del Pedido</h3>
                    <div class="timeline">
                        <div class="timeline-item active">
                            <div class="timeline-marker completed">
                                <i class="fas fa-check"></i>
                            </div>
                            <div class="timeline-content">
                                <h4>Pedido Recibido</h4>
                                <p>Tu pedido ha sido recibido y registrado en nuestro sistema</p>
                                <span class="timeline-date">${new Date().toLocaleString('es-ES')}</span>
                            </div>
                        </div>
                        
                        <div class="timeline-item current">
                            <div class="timeline-marker pending">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="timeline-content">
                                <h4>Confirmación</h4>
                                <p>Nuestro equipo está revisando tu pedido</p>
                                <span class="timeline-date">En proceso</span>
                            </div>
                        </div>
                        
                        <div class="timeline-item">
                            <div class="timeline-marker">
                                <i class="fas fa-box"></i>
                            </div>
                            <div class="timeline-content">
                                <h4>Preparación</h4>
                                <p>Tu pedido será preparado para el envío</p>
                                <span class="timeline-date">Próximamente</span>
                            </div>
                        </div>
                        
                        <div class="timeline-item">
                            <div class="timeline-marker">
                                <i class="fas fa-truck"></i>
                            </div>
                            <div class="timeline-content">
                                <h4>Enviado</h4>
                                <p>Tu pedido está en camino</p>
                                <span class="timeline-date">3-5 días hábiles</span>
                            </div>
                        </div>
                        
                        <div class="timeline-item">
                            <div class="timeline-marker">
                                <i class="fas fa-home"></i>
                            </div>
                            <div class="timeline-content">
                                <h4>Entregado</h4>
                                <p>¡Disfruta tu compra!</p>
                                <span class="timeline-date">Fecha estimada</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Información del pedido -->
                <div class="order-info-grid">
                    <div class="info-card">
                        <h3><i class="fas fa-shopping-bag"></i> Productos</h3>
                        <div class="products-list" id="detailsProductsList">
                            ${generateProductsList(orderData.items)}
                        </div>
                        <div class="order-totals">
                            <div class="total-line">
                                <span>Subtotal:</span>
                                <span>${orderData.subtotal.toFixed(2)}</span>
                            </div>
                            <div class="total-line">
                                <span>Impuestos (18%):</span>
                                <span>${orderData.taxes.toFixed(2)}</span>
                            </div>
                            <div class="total-line total">
                                <span>Total:</span>
                                <span>${orderData.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="info-card">
                        <h3><i class="fas fa-truck"></i> Información de Envío</h3>
                        <div class="shipping-details">
                            <div class="shipping-address">
                                <h4>Dirección de entrega</h4>
                                <p>
                                    ${orderData.shipping.name}<br>
                                    ${orderData.shipping.address}<br>
                                    ${orderData.shipping.city}, ${orderData.shipping.postalCode}<br>
                                    ${orderData.shipping.country}
                                </p>
                            </div>
                            <div class="shipping-method">
                                <h4>Método de envío</h4>
                                <p><i class="fas fa-truck"></i> Envío estándar (3-5 días hábiles)</p>
                                <p class="delivery-estimate">
                                    <strong>Entrega estimada:</strong> ${getEstimatedDeliveryDate()}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="info-card">
                        <h3><i class="fas fa-credit-card"></i> Información de Pago</h3>
                        <div class="payment-details">
                            <div class="payment-method">
                                <h4>Método de pago</h4>
                                <p><i class="fas fa-${getPaymentIcon(orderData.paymentMethod)}"></i> ${formatPaymentMethod(orderData.paymentMethod)}</p>
                                ${orderData.paymentMethod === 'card' ? 
                                    `<p class="card-info">**** **** **** ${orderData.cardLast4 || '****'}</p>` : 
                                    `<p class="digital-wallet-info">Pago procesado de forma segura</p>`
                                }
                            </div>
                            <div class="payment-status">
                                <h4>Estado del pago</h4>
                                <span class="payment-status-badge processing">
                                    <i class="fas fa-clock"></i> Procesando
                                </span>
                                <p class="payment-note">Tu pago será procesado una vez que se confirme el pedido</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="info-card">
                        <h3><i class="fas fa-user"></i> Información de Contacto</h3>
                        <div class="contact-details">
                            <p><i class="fas fa-envelope"></i> ${orderData.customer.email}</p>
                            <p><i class="fas fa-phone"></i> ${orderData.customer.phone}</p>
                        </div>
                        <div class="support-info">
                            <h4>¿Necesitas ayuda?</h4>
                            <div class="support-options">
                                <button onclick="openSupportChat()" class="support-btn">
                                    <i class="fas fa-comments"></i> Chat en vivo
                                </button>
                                <button onclick="sendSupportEmail('${orderNumber}')" class="support-btn">
                                    <i class="fas fa-envelope"></i> Enviar email
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Acciones del pedido -->
                <div class="order-actions">
                    <button onclick="downloadOrderReceipt('${orderNumber}')" class="action-btn primary">
                        <i class="fas fa-download"></i> Descargar Recibo
                    </button>
                    <button onclick="shareOrder('${orderNumber}')" class="action-btn secondary">
                        <i class="fas fa-share-alt"></i> Compartir
                    </button>
                    <button onclick="cancelOrder('${orderNumber}')" class="action-btn danger">
                        <i class="fas fa-times"></i> Cancelar Pedido
                    </button>
                </div>
                
                <!-- Información adicional -->
                <div class="additional-info">
                    <div class="info-section">
                        <h4><i class="fas fa-shield-alt"></i> Garantía y Devoluciones</h4>
                        <p>Todos nuestros productos cuentan con garantía. Tienes 30 días para solicitar devoluciones.</p>
                        <a href="#" onclick="showReturnPolicy()">Ver política de devoluciones</a>
                    </div>
                    
                    <div class="info-section">
                        <h4><i class="fas fa-bell"></i> Notificaciones</h4>
                        <p>Te notificaremos por email y SMS sobre el progreso de tu pedido.</p>
                        <label class="checkbox-label">
                            <input type="checkbox" checked> Recibir notificaciones por email
                            <span class="checkmark"></span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Añadir estilos CSS para la página de detalles
    addOrderDetailsStyles();
    
    // Mostrar la página de detalles
    document.body.appendChild(detailsOverlay);
    document.body.style.overflow = 'hidden';
    
    // Animar entrada
    setTimeout(() => {
        detailsOverlay.classList.add('active');
    }, 10);
    
    // Asegurar que los event listeners funcionen
    setTimeout(() => {
        const backBtn = document.getElementById('backButton');
        if (backBtn) {
            backBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                closeOrderDetails();
            });
        }
        
        // También manejar el click en el overlay para cerrar
        detailsOverlay.addEventListener('click', function(e) {
            if (e.target === detailsOverlay) {
                closeOrderDetails();
            }
        });
    }, 50);
}

// Función para obtener datos del pedido recién creado
function getRecentOrderData(orderNumber) {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const taxes = subtotal * 0.18;
    const total = subtotal + taxes;
    
    // Obtener el texto del país seleccionado de forma segura
    const countrySelect = document.getElementById('country');
    const countryText = countrySelect ? 
        (countrySelect.selectedIndex >= 0 ? countrySelect.options[countrySelect.selectedIndex].text : 'N/A') 
        : 'N/A';
    
    return {
        orderNumber: orderNumber,
        items: [...cart], // Crear una copia del array
        subtotal: subtotal,
        taxes: taxes,
        total: total,
        paymentMethod: selectedPaymentMethod,
        cardLast4: document.getElementById('cardNumber') ? 
            document.getElementById('cardNumber').value.replace(/\s/g, '').slice(-4) : null,
        customer: {
            email: document.getElementById('email')?.value || 'N/A',
            phone: document.getElementById('phone')?.value || 'N/A'
        },
        shipping: {
            name: `${document.getElementById('firstName')?.value || ''} ${document.getElementById('lastName')?.value || ''}`.trim(),
            address: document.getElementById('address')?.value || 'N/A',
            city: document.getElementById('city')?.value || 'N/A',
            postalCode: document.getElementById('postalCode')?.value || 'N/A',
            country: countryText
        }
    };
}

// Función para generar la lista de productos
function generateProductsList(items) {
    return items.map(item => `
        <div class="product-item">
            <div class="product-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="product-info">
                <h4>${item.name}</h4>
                <div class="product-details">
                    <span class="price">${item.price.toFixed(2)}</span>
                    <span class="quantity">x${item.quantity}</span>
                    <span class="total">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Función para obtener fecha estimada de entrega
function getEstimatedDeliveryDate() {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 5); // 5 días hábiles
    
    return deliveryDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Función para obtener icono del método de pago
function getPaymentIcon(paymentMethod) {
    switch(paymentMethod) {
        case 'card': return 'credit-card';
        case 'yape': return 'mobile-alt';
        case 'plin': return 'mobile-alt';
        default: return 'credit-card';
    }
}

// Función para formatear el método de pago
function formatPaymentMethod(paymentMethod) {
    switch(paymentMethod) {
        case 'card': return 'Tarjeta de Crédito/Débito';
        case 'yape': return 'Yape';
        case 'plin': return 'Plin';
        default: return paymentMethod;
    }
}

// Las demás funciones permanecen igual, pero actualizo closeOrderDetails para regresar al origen correcto
function closeOrderDetails() {
    const detailsOverlay = document.getElementById('orderDetailsOverlay');
    if (detailsOverlay) {
        detailsOverlay.remove();
        document.body.style.overflow = 'auto';
    }
}

// Función para abrir chat de soporte
function openSupportChat() {
    createChatModal();
}

function createChatModal() {
    // Remover modal existente si existe
    const existingModal = document.getElementById('chatModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const chatModal = document.createElement('div');
    chatModal.id = 'chatModal';
    chatModal.innerHTML = `
        <div class="chat-modal-overlay" onclick="closeChatModal()">
            <div class="chat-modal-content" onclick="event.stopPropagation()">
                <div class="chat-header">
                    <h3><i class="fas fa-comments"></i> Chat de Soporte - ${getStoreName()}</h3>
                    <button onclick="closeChatModal()" class="chat-close-btn">&times;</button>
                </div>
                <div class="chat-messages" id="chatMessages">
                    <div class="message bot-message">
                        <div class="message-avatar">
                            <i class="fas fa-robot"></i>
                        </div>
                        <div class="message-content">
                            <p>¡Hola! Soy el asistente virtual de ${getStoreName()}. ¿En qué puedo ayudarte con tu pedido?</p>
                            <span class="message-time">${new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                    </div>
                </div>
                <div class="chat-suggestions">
                    <button onclick="selectChatOption('estado')" class="suggestion-btn">¿Cuál es el estado de mi pedido?</button>
                    <button onclick="selectChatOption('cancelar')" class="suggestion-btn">¿Puedo cancelar mi pedido?</button>
                    <button onclick="selectChatOption('cambio')" class="suggestion-btn">¿Puedo cambiar la dirección?</button>
                    <button onclick="selectChatOption('tiempo')" class="suggestion-btn">¿Cuánto tarda en llegar?</button>
                </div>
                <div class="chat-input-container">
                    <input type="text" id="chatInput" placeholder="Escribe tu mensaje..." onkeypress="handleChatEnter(event)">
                    <button onclick="sendChatMessage()" class="send-btn">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Añadir estilos para el chat (código de estilos permanece igual)
    const chatStyles = `
        #chatModal .chat-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }
        
        #chatModal .chat-modal-content {
            background: var(--secondary-color, #2a2a2a);
            border-radius: 12px;
            width: 100%;
            max-width: 500px;
            max-height: 600px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        #chatModal .chat-header {
            padding: 1rem;
            border-bottom: 1px solid #333;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--primary-color, #0070f3);
            color: white;
        }
        
        #chatModal .chat-close-btn {
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
        }
        
        #chatModal .chat-messages {
            flex: 1;
            padding: 1rem;
            overflow-y: auto;
            min-height: 200px;
            max-height: 300px;
        }
        
        #chatModal .message {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1rem;
            align-items: flex-start;
        }
        
        #chatModal .message-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            flex-shrink: 0;
        }
        
        #chatModal .bot-message .message-avatar {
            background: var(--primary-color, #0070f3);
            color: white;
        }
        
        #chatModal .user-message .message-avatar {
            background: #4caf50;
            color: white;
        }
        
        #chatModal .message-content {
            background: #333;
            padding: 0.75rem;
            border-radius: 12px;
            flex: 1;
        }
        
        #chatModal .user-message .message-content {
            background: var(--primary-color, #0070f3);
        }
        
        #chatModal .message-content p {
            margin: 0 0 0.25rem 0;
        }
        
        #chatModal .message-time {
            font-size: 0.7rem;
            color: #ccc;
        }
        
        #chatModal .chat-suggestions {
            padding: 1rem;
            border-top: 1px solid #333;
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        
        #chatModal .suggestion-btn {
            background: #444;
            border: 1px solid #666;
            color: white;
            padding: 0.5rem 0.75rem;
            border-radius: 20px;
            cursor: pointer;
            font-size: 0.8rem;
            transition: background 0.3s;
        }
        
        #chatModal .suggestion-btn:hover {
            background: var(--primary-color, #0070f3);
        }
        
        #chatModal .chat-input-container {
            padding: 1rem;
            border-top: 1px solid #333;
            display: flex;
            gap: 0.5rem;
        }
        
        #chatModal .chat-input-container input {
            flex: 1;
            background: #333;
            border: 1px solid #555;
            color: white;
            padding: 0.75rem;
            border-radius: 6px;
        }
        
        #chatModal .send-btn {
            background: var(--primary-color, #0070f3);
            border: none;
            color: white;
            padding: 0.75rem 1rem;
            border-radius: 6px;
            cursor: pointer;
        }
    `;
    
    // Añadir estilos si no existen
    if (!document.getElementById('chatModalStyles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'chatModalStyles';
        styleSheet.textContent = chatStyles;
        document.head.appendChild(styleSheet);
    }
    
    document.body.appendChild(chatModal);
    
    // Enfocar en el input
    setTimeout(() => {
        document.getElementById('chatInput').focus();
    }, 100);
}

// Resto de funciones del chat y otras funciones permanecen iguales...
function closeChatModal() {
    const modal = document.getElementById('chatModal');
    if (modal) {
        modal.remove();
    }
}

function handleChatEnter(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (message) {
        addChatMessage(message, 'user');
        input.value = '';
        
        // Simular respuesta del bot
        setTimeout(() => {
            const botResponse = generateBotResponse(message);
            addChatMessage(botResponse, 'bot');
        }, 1000);
    }
}

function selectChatOption(option) {
    const responses = {
        'estado': 'Tu pedido está actualmente en estado "Pendiente de Confirmación". Será revisado por nuestro equipo en las próximas 2-4 horas.',
        'cancelar': 'Sí, puedes cancelar tu pedido mientras esté en estado "Pendiente". Una vez confirmado, las cancelaciones están sujetas a nuestra política de devoluciones.',
        'cambio': 'Los cambios de dirección solo son posibles antes de que el pedido sea enviado. Te ayudo a contactar con el equipo de logística.',
        'tiempo': 'El tiempo estimado de entrega es de 3-5 días hábiles después de la confirmación del pedido.'
    };
    
    addChatMessage(getQuestionText(option), 'user');
    
    setTimeout(() => {
        addChatMessage(responses[option], 'bot');
    }, 1000);
}

function getQuestionText(option) {
    const questions = {
        'estado': '¿Cuál es el estado de mi pedido?',
        'cancelar': '¿Puedo cancelar mi pedido?',
        'cambio': '¿Puedo cambiar la dirección?',
        'tiempo': '¿Cuánto tarda en llegar?'
    };
    return questions[option];
}

function addChatMessage(message, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const avatar = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
    const time = new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'});
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <p>${message}</p>
            <span class="message-time">${time}</span>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function generateBotResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('estado') || lowerMessage.includes('pedido')) {
        return 'Tu pedido está siendo procesado. Recibirás una notificación cuando sea confirmado.';
    } else if (lowerMessage.includes('cancelar')) {
        return 'Para cancelar tu pedido, puedes usar el botón "Cancelar Pedido" en los detalles o contactar con soporte.';
    } else if (lowerMessage.includes('tiempo') || lowerMessage.includes('cuanto')) {
        return 'El tiempo de entrega estimado es de 3-5 días hábiles después de la confirmación.';
    } else if (lowerMessage.includes('direccion') || lowerMessage.includes('envio')) {
        return 'Los cambios de dirección deben realizarse antes del envío. ¿Necesitas cambiar algún dato?';
    } else {
        return 'Entiendo tu consulta. Un agente especializado se comunicará contigo por email en las próximas 24 horas para brindarte asistencia personalizada.';
    }
}

function sendSupportEmail(orderNumber) {
    const subject = encodeURIComponent(`Consulta sobre pedido ${orderNumber} - ${getStoreName()}`);
    const body = encodeURIComponent(`Hola,\n\nTengo una consulta sobre mi pedido #${orderNumber} de ${getStoreName()}.\n\n[Describe tu consulta aquí]\n\nGracias.`);
    const mailtoLink = `mailto:soporte@${originPage.replace('.html', '')}.com?subject=${subject}&body=${body}`;
    
    // Intentar abrir el cliente de email
    try {
        window.location.href = mailtoLink;
        showNotification('Abriendo cliente de email...', 'info');
    } catch (error) {
        // Fallback: mostrar información de contacto
        showNotification(`Email de soporte: soporte@${originPage.replace('.html', '')}.com`, 'info');
    }
}

function downloadOrderReceipt(orderNumber) {
    showNotification('Generando recibo...', 'info');
    setTimeout(() => {
        printReceipt(orderNumber);
    }, 1000);
}

function shareOrder(orderNumber) {
    if (navigator.share && navigator.share.canShare) {
        navigator.share({
            title: `Mi pedido de ${getStoreName()}`,
            text: `¡Acabo de realizar un pedido en ${getStoreName()}! #${orderNumber}`,
            url: window.location.href
        }).catch(console.error);
    } else {
        // Fallback: copiar al clipboard
        const shareText = `¡Acabo de realizar un pedido en ${getStoreName()}! #${orderNumber} - ${window.location.href}`;
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareText)
                .then(() => showNotification('Información del pedido copiada al portapapeles', 'success'))
                .catch(() => fallbackCopyToClipboard(shareText));
        } else {
            fallbackCopyToClipboard(shareText);
        }
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showNotification('Información copiada al portapapeles', 'success');
    } catch (err) {
        showNotification('No se pudo copiar automáticamente', 'error');
    }
    
    document.body.removeChild(textArea);
}

function cancelOrder(orderNumber) {
    // Crear modal de confirmación personalizado
    createCancelOrderModal(orderNumber);
}

function createCancelOrderModal(orderNumber) {
    const cancelModal = document.createElement('div');
    cancelModal.id = 'cancelOrderModal';
    cancelModal.innerHTML = `
        <div class="cancel-modal-overlay" onclick="closeCancelModal()">
            <div class="cancel-modal-content" onclick="event.stopPropagation()">
                <div class="cancel-modal-header">
                    <h3><i class="fas fa-exclamation-triangle"></i> Cancelar Pedido</h3>
                    <button onclick="closeCancelModal()" class="cancel-close-btn">&times;</button>
                </div>
                <div class="cancel-modal-body">
                    <p><strong>¿Estás seguro de que deseas cancelar el pedido #${orderNumber}?</strong></p>
                    <p>Esta acción no se puede deshacer y se procesará inmediatamente.</p>
                    
                    <div class="cancel-reason-section">
                        <label for="cancelReason">Razón de la cancelación (opcional):</label>
                        <select id="cancelReason">
                            <option value="">Seleccionar razón...</option>
                            <option value="changed_mind">Cambié de opinión</option>
                            <option value="wrong_product">Producto incorrecto</option>
                            <option value="found_better_price">Encontré mejor precio</option>
                            <option value="delivery_time">Tiempo de entrega muy largo</option>
                            <option value="payment_issues">Problemas con el pago</option>
                            <option value="other">Otro</option>
                        </select>
                    </div>
                    
                    <div class="cancel-info">
                        <div class="info-item">
                            <i class="fas fa-money-bill-wave"></i>
                            <span>El reembolso será procesado en 3-5 días hábiles</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-envelope"></i>
                            <span>Recibirás un email de confirmación</span>
                        </div>
                    </div>
                </div>
                <div class="cancel-modal-footer">
                    <button onclick="closeCancelModal()" class="cancel-btn-secondary">
                        <i class="fas fa-times"></i> Mantener Pedido
                    </button>
                    <button onclick="confirmCancelOrder('${orderNumber}')" class="cancel-btn-danger">
                        <i class="fas fa-trash"></i> Confirmar Cancelación
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Añadir estilos para el modal de cancelación (código permanece igual)
    const cancelStyles = `
        #cancelOrderModal .cancel-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }
        
        #cancelOrderModal .cancel-modal-content {
            background: var(--secondary-color, #2a2a2a);
            border-radius: 12px;
            width: 100%;
            max-width: 500px;
            overflow: hidden;
        }
        
        #cancelOrderModal .cancel-modal-header {
            padding: 1rem;
            background: #f44336;
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        #cancelOrderModal .cancel-close-btn {
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
        }
        
        #cancelOrderModal .cancel-modal-body {
            padding: 1.5rem;
        }
        
        #cancelOrderModal .cancel-reason-section {
            margin: 1rem 0;
        }
        
        #cancelOrderModal .cancel-reason-section label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: bold;
        }
        
        #cancelOrderModal .cancel-reason-section select {
            width: 100%;
            padding: 0.75rem;
            background: #333;
            border: 1px solid #555;
            color: white;
            border-radius: 6px;
        }
        
        #cancelOrderModal .cancel-info {
            margin-top: 1rem;
            padding: 1rem;
            background: #333;
            border-radius: 6px;
        }
        
        #cancelOrderModal .info-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
        }
        
        #cancelOrderModal .cancel-modal-footer {
            padding: 1rem;
            border-top: 1px solid #333;
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
        }
        
        #cancelOrderModal .cancel-btn-secondary {
            background: #666;
            border: none;
            color: white;
            padding: 0.75rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        #cancelOrderModal .cancel-btn-danger {
            background: #f44336;
            border: none;
            color: white;
            padding: 0.75rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        #cancelOrderModal .cancel-btn-secondary:hover {
            background: #777;
        }
        
        #cancelOrderModal .cancel-btn-danger:hover {
            background: #d32f2f;
        }
    `;
    
    // Añadir estilos si no existen
    if (!document.getElementById('cancelModalStyles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'cancelModalStyles';
        styleSheet.textContent = cancelStyles;
        document.head.appendChild(styleSheet);
    }
    
    document.body.appendChild(cancelModal);
}

function closeCancelModal() {
    const modal = document.getElementById('cancelOrderModal');
    if (modal) {
        modal.remove();
    }
}

function confirmCancelOrder(orderNumber) {
    const modal = document.getElementById('cancelOrderModal');
    if (!modal) return;
    
    const reasonSelect = document.getElementById('cancelReason');
    const reason = reasonSelect ? reasonSelect.value : '';
    
    // Cerrar el modal de cancelación primero
    modal.remove();
    
    // Mostrar loading
    showLoading(true);
    
    // Simular proceso de cancelación
    setTimeout(() => {
        showLoading(false);
        showNotification('Pedido cancelado exitosamente. Recibirás un email de confirmación.', 'success');
        
        // Cerrar detalles del pedido después de un momento
        setTimeout(() => {
            closeOrderDetails();
            // CORREGIDO: Redirigir a la página de origen en lugar de hardcodear ps5.html
            window.location.href = originPage;
        }, 1500);
        
        // Simular envío de email de cancelación
        setTimeout(() => {
            showNotification('Email de confirmación enviado', 'info');
        }, 3000);
        
    }, 2000);
}

function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

function showReturnPolicy() {
    alert(`Política de Devoluciones - ${getStoreName()}:\n\n` +
          '• 30 días para devoluciones\n' +
          '• Productos en estado original\n' +
          '• Reembolso completo garantizado\n' +
          '• Envío de devolución gratuito\n\n' +
          'Para más información, contacta con soporte.');
}

function printOrderDetails(orderNumber) {
    window.print();
}

// Función para añadir estilos CSS
function addOrderDetailsStyles() {
    if (document.getElementById('orderDetailsStyles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'orderDetailsStyles';
    styles.textContent = `
        .order-details-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            z-index: 9999;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            overflow-y: auto;
        }
        
        .order-details-overlay.active {
            opacity: 1;
            visibility: visible;
        }
        
        .order-details-page {
            background: var(--bg-color, #1a1a1a);
            min-height: 100vh;
            color: var(--text-color, #ffffff);
        }
        
        .order-details-header {
            background: var(--secondary-color, #2a2a2a);
            border-bottom: 1px solid #333;
            padding: 1rem 0;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        .header-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .back-btn, .print-btn {
            background: var(--primary-color, #0070f3);
            border: none;
            color: white;
            padding: 0.75rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1rem;
            transition: background 0.3s;
        }
        
        .back-btn:hover, .print-btn:hover {
            background: #0056b3;
        }
        
        .header-info h1 {
            margin: 0;
            font-size: 1.5rem;
        }
        
        .order-number {
            margin: 0.25rem 0 0 0;
            color: var(--primary-color, #0070f3);
            font-weight: bold;
        }
        
        .store-name {
            margin: 0.25rem 0 0 0;
            color: #ccc;
            font-size: 0.9rem;
        }
        
        .order-details-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .order-status-section {
            margin-bottom: 2rem;
        }
        
        .status-card {
            background: var(--secondary-color, #2a2a2a);
            border-radius: 12px;
            padding: 1.5rem;
            border-left: 4px solid #ff9800;
        }
        
        .status-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
        }
        
        .status-icon {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
        }
        
        .status-icon.pending {
            background: rgba(255, 152, 0, 0.2);
            color: #ff9800;
        }
        
        .estimated-time {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #ccc;
            font-size: 0.9rem;
        }
        
        .order-timeline-section {
            margin: 2rem 0;
        }
        
        .timeline {
            position: relative;
            padding-left: 2rem;
        }
        
        .timeline::before {
            content: '';
            position: absolute;
            left: 1rem;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #333;
        }
        
        .timeline-item {
            position: relative;
            margin-bottom: 2rem;
            padding-left: 2rem;
        }
        
        .timeline-marker {
            position: absolute;
            left: -2rem;
            top: 0.5rem;
            width: 2rem;
            height: 2rem;
            border-radius: 50%;
            background: #333;
            border: 3px solid #333;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
        }
        
        .timeline-marker.completed {
            background: #4caf50;
            border-color: #4caf50;
            color: white;
        }
        
        .timeline-marker.pending {
            background: #ff9800;
            border-color: #ff9800;
            color: white;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
        }
        
        .timeline-content h4 {
            margin: 0 0 0.5rem 0;
            color: white;
        }
        
        .timeline-content p {
            margin: 0 0 0.5rem 0;
            color: #ccc;
            font-size: 0.9rem;
        }
        
        .timeline-date {
            font-size: 0.8rem;
            color: #888;
        }
        
        .order-info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }
        
        .info-card {
            background: var(--secondary-color, #2a2a2a);
            border-radius: 12px;
            padding: 1.5rem;
            border: 1px solid #333;
        }
        
        .info-card h3 {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin: 0 0 1rem 0;
            color: var(--primary-color, #0070f3);
        }
        
        .products-list {
            margin-bottom: 1rem;
        }
        
        .product-item {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #333;
        }
        
        .product-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        
        .product-image img {
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 6px;
        }
        
        .product-info h4 {
            margin: 0 0 0.5rem 0;
            font-size: 0.9rem;
        }
        
        .product-details {
            display: flex;
            gap: 1rem;
            font-size: 0.8rem;
            color: #ccc;
        }
        
        .order-totals {
            border-top: 1px solid #333;
            padding-top: 1rem;
        }
        
        .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
        }
        
        .total-line.total {
            font-weight: bold;
            font-size: 1.1rem;
            border-top: 1px solid #333;
            padding-top: 0.5rem;
            margin-top: 0.5rem;
        }
        
        .order-actions {
            display: flex;
            gap: 1rem;
            margin: 2rem 0;
            flex-wrap: wrap;
        }
        
        .action-btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .action-btn.primary {
            background: var(--primary-color, #0070f3);
            color: white;
        }
        
        .action-btn.secondary {
            background: #666;
            color: white;
        }
        
        .action-btn.danger {
            background: #f44336;
            color: white;
        }
        
        .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .additional-info {
            border-top: 1px solid #333;
            padding-top: 2rem;
            margin-top: 2rem;
        }
        
        .info-section {
            margin-bottom: 1.5rem;
        }
        
        .info-section h4 {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
        }
        
        .checkbox-label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            margin-top: 0.5rem;
        }
        
        .support-options {
            display: flex;
            gap: 0.5rem;
            margin-top: 0.5rem;
        }
        
        .support-btn {
            background: var(--secondary-color, #2a2a2a);
            border: 1px solid #444;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.8rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .support-btn:hover {
            background: #444;
        }
        
        .payment-status-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
        }
        
        .payment-status-badge.processing {
            background: rgba(255, 152, 0, 0.2);
            color: #ff9800;
        }
        
        @media (max-width: 768px) {
            .order-details-content {
                padding: 1rem;
            }
            
            .header-content {
                padding: 0 1rem;
            }
            
            .order-info-grid {
                grid-template-columns: 1fr;
            }
            
            .order-actions {
                flex-direction: column;
            }
        }
        
        /* Loading Overlay Styles */
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10002;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
        }
        
        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #333;
            border-top: 4px solid var(--primary-color, #0070f3);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    
    document.head.appendChild(styles);
}

// Función para imprimir recibo - CORREGIDA para incluir información de la tienda
function printReceipt(orderNumber) {
    showNotification('Generando recibo...', 'info');
    
    // Simular generación de PDF
    setTimeout(() => {
        const printContent = `
            <div style="padding: 20px; font-family: Arial, sans-serif;">
                <h2 style="text-align: center; color: #2c3e50;">${getStoreName()}</h2>
                <h3 style="text-align: center;">Recibo de Compra</h3>
                <hr>
                <p><strong>Número de Pedido:</strong> ${orderNumber}</p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
                <p><strong>Estado:</strong> Pendiente</p>
                <p><strong>Plataforma:</strong> ${originPage.replace('.html', '').toUpperCase()}</p>
                <hr>
                <h4>Productos:</h4>
                ${cart.map(item => `
                    <p>${item.name} - ${item.price.toFixed(2)} x ${item.quantity} = ${(item.price * item.quantity).toFixed(2)}</p>
                `).join('')}
                <hr>
                <p><strong>Total: ${cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}</strong></p>
                <hr>
                <p style="text-align: center; color: #666;">¡Gracias por tu compra en ${getStoreName()}!</p>
            </div>
        `;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
        
    }, 1000);
}


const checkoutSubscriptionStyles = `
    <style>
        .subscription-checkout-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 15px 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            color: white;
        }
        
        .subscription-checkout-header {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 700;
            font-size: 1.1rem;
            margin-bottom: 8px;
        }
        
        .subscription-checkout-discount {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.95rem;
            opacity: 0.95;
        }
        
        .summary-line {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #333;
        }
    </style>
`;

document.head.insertAdjacentHTML('beforeend', checkoutSubscriptionStyles);