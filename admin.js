// Variables globales
let currentUser = null;
let currentOrderId = null;
let currentUserId = null;
let allOrders = [];
let allUsers = [];
let allSubscriptionRequests = [];
let currentSubscriptionRequestId = null;
let charts = {};
let currentPlatformFilter = 'all';


// Configuración de Firebase (misma que tu aplicación principal)
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

// Lista de administradores (emails)
const adminEmails = [
    'admin@playstation.com', 
    'admin@gmail.com', // Cambia esto por tu email
    'administrador@gmail.com' // Agrega más emails de admin aquí
];

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
});

// Función principal de inicialización
function initializeAdmin() {
    checkAdminAuth();
    setupEventListeners();
    showLoading(false);
}

// Verificar autenticación de administrador
function checkAdminAuth() {
    showLoading(true);
    
    auth.onAuthStateChanged((user) => {
        if (user && adminEmails.includes(user.email)) {
            currentUser = user;
            document.getElementById('adminName').textContent = user.email;
            initializeDashboard();
        } else {
            // Redirigir a página de login de admin
            showNotification('Acceso denegado. No tienes permisos de administrador.', 'error');
            setTimeout(() => {
                window.location.href = 'admin-login.html'; // Crear esta página más tarde
            }, 2000);
        }
        showLoading(false);
    });
}

// Inicializar dashboard
function initializeDashboard() {
    loadDashboardData();
    loadOrders();
    loadUsers();
    loadSubscriptionRequests();
    setupRealTimeListeners();
    initializeCharts();
}

// Configurar event listeners
function setupEventListeners() {
    // Cerrar modales al hacer clic fuera
    window.onclick = function(event) {
        const orderModal = document.getElementById('orderModal');
        const userModal = document.getElementById('userModal');
        
        if (event.target === orderModal) {
            closeOrderModal();
        }
        if (event.target === userModal) {
            closeUserModal();
        }
    };
}

// Configurar listeners en tiempo real
function setupRealTimeListeners() {
    // Escuchar nuevos pedidos
    db.collection('orders').where('status', '==', 'pending')
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    playNotificationSound();
                    showNotification('Nuevo pedido pendiente recibido!', 'info');
                    updatePendingOrdersCount();
                }
            });
        });

    // Escuchar nuevos usuarios
    db.collection('users')
        .onSnapshot((snapshot) => {
            updateDashboardStats();
        });

    // Escuchar nuevas solicitudes de suscripción
    db.collection('subscriptionRequests').where('status', '==', 'pending')
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    playNotificationSound();
                    showNotification('Nueva solicitud de suscripción recibida!', 'info');
                    updatePendingSubscriptionsCount();
                }
            });
        });
}

// Función para mostrar pestañas
function showTab(tabName) {
    // Ocultar todas las pestañas
    const tabContents = document.querySelectorAll('.tab-content');
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabContents.forEach(tab => tab.classList.remove('active'));
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Mostrar la pestaña seleccionada
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Cargar datos específicos según la pestaña
    switch(tabName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'users':
            loadUsers();
            break;
        case 'subscriptions':
            loadSubscriptionRequests();
            break;
        case 'stats':
            updateCharts();
            break;
    }
}

// Cargar datos del dashboard
function loadDashboardData() {
    showLoading(true);
    
    Promise.all([
        loadDashboardStats(),
        loadRecentActivity()
    ]).then(() => {
        showLoading(false);
    }).catch(error => {
        console.error('Error loading dashboard:', error);
        showNotification('Error cargando dashboard', 'error');
        showLoading(false);
    });
}

// Cargar estadísticas del dashboard
function loadDashboardStats() {
    return Promise.all([
        // Contar pedidos
        db.collection('orders').get(),
        // Contar usuarios
        db.collection('users').get(),
        // Contar pedidos pendientes
        db.collection('orders').where('status', '==', 'pending').get()
    ]).then(([ordersSnapshot, usersSnapshot, pendingSnapshot]) => {
        const totalOrders = ordersSnapshot.size;
        const totalUsers = usersSnapshot.size;
        const pendingOrders = pendingSnapshot.size;
        
        // Calcular ingresos totales
        let totalRevenue = 0;
        ordersSnapshot.forEach(doc => {
            const order = doc.data();
            if (order.status === 'completed' || order.status === 'confirmed') {
                totalRevenue += order.total || 0;
            }
        });
        
        // Actualizar UI
        document.getElementById('totalOrders').textContent = totalOrders;
        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('pendingOrders').textContent = pendingOrders;
        document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
        document.getElementById('pendingOrdersCount').textContent = pendingOrders;
    });
}

// Cargar actividad reciente
function loadRecentActivity() {
    const activityContainer = document.getElementById('recentActivity');
    
    return Promise.all([
        db.collection('orders').orderBy('createdAt', 'desc').limit(5).get(),
        db.collection('users').orderBy('createdAt', 'desc').limit(3).get()
    ]).then(([ordersSnapshot, usersSnapshot]) => {
        let activityHTML = '';
        
        // Agregar pedidos recientes
        ordersSnapshot.forEach(doc => {
            const order = doc.data();
            const date = order.createdAt ? order.createdAt.toDate().toLocaleString('es-ES') : 'Fecha no disponible';
            
            activityHTML += `
                <div class="activity-item">
                    <div class="activity-icon order">
                        <i class="fas fa-shopping-bag"></i>
                    </div>
                    <div class="activity-content">
                        <div class="text">Nuevo pedido #${order.orderNumber} por $${order.total?.toFixed(2) || '0.00'}</div>
                        <div class="time">${date}</div>
                    </div>
                </div>
            `;
        });
        
        // Agregar usuarios recientes
        usersSnapshot.forEach(doc => {
            const user = doc.data();
            const date = user.createdAt ? user.createdAt.toDate().toLocaleString('es-ES') : 'Fecha no disponible';
            
            activityHTML += `
                <div class="activity-item">
                    <div class="activity-icon user">
                        <i class="fas fa-user-plus"></i>
                    </div>
                    <div class="activity-content">
                        <div class="text">Nuevo usuario registrado: ${user.name}</div>
                        <div class="time">${date}</div>
                    </div>
                </div>
            `;
        });
        
        if (activityHTML === '') {
            activityHTML = '<p style="color: #666; text-align: center;">No hay actividad reciente</p>';
        }
        
        activityContainer.innerHTML = activityHTML;
    });
}

// Cargar pedidos
function loadOrders() {
    showLoading(true);
    
    db.collection('orders').orderBy('createdAt', 'desc').get()
        .then(snapshot => {
            allOrders = [];
            snapshot.forEach(doc => {
                allOrders.push({ id: doc.id, ...doc.data() });
            });
            displayOrders(allOrders);
            showLoading(false);
        })
        .catch(error => {
            console.error('Error loading orders:', error);
            showNotification('Error cargando pedidos', 'error');
            showLoading(false);
        });
}

// Mostrar pedidos en la tabla
function displayOrders(orders) {
    const tableBody = document.getElementById('ordersTableBody');
    
    if (orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No hay pedidos disponibles</td></tr>';
        return;
    }
    
    let html = '';
    orders.forEach(order => {
        const date = order.createdAt ? order.createdAt.toDate().toLocaleDateString('es-ES') : 'N/A';
        const customerName = order.shipping ? `${order.shipping.firstName} ${order.shipping.lastName}` : 'N/A';
        const customerEmail = order.customer ? order.customer.email : 'N/A';
        
        html += `
            <tr>
                <td>${order.orderNumber}</td>
                <td>${customerName}</td>
                <td>${customerEmail}</td>
                <td>$${order.total?.toFixed(2) || '0.00'}</td>
                <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                <td>${date}</td>
                <td>
                    <button class="action-btn" onclick="viewOrderDetails('${order.id}')">Ver</button>
                    ${order.status === 'pending' ? 
                        `<button class="action-btn" onclick="confirmOrder('${order.id}')">Confirmar</button>
                         <button class="action-btn danger" onclick="rejectOrder('${order.id}')">Rechazar</button>` : ''}
                    ${order.status === 'confirmed' ? 
                        `<button class="action-btn" onclick="completeOrder('${order.id}')">Completar</button>` : ''}
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

// Filtrar pedidos
function filterOrders() {
    const filter = document.getElementById('orderFilter').value;
    let filteredOrders = allOrders;
    
    if (filter !== 'all') {
        filteredOrders = allOrders.filter(order => order.status === filter);
    }
    
    displayOrders(filteredOrders);
}

// Ver detalles del pedido
function viewOrderDetails(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    currentOrderId = orderId;
    
    const customerInfo = order.customer || {};
    const shippingInfo = order.shipping || {};
    const items = order.items || [];
    
    let itemsHTML = '';
    items.forEach(item => {
        itemsHTML += `
            <div class="order-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="order-item-details">
                    <div class="order-item-name">${item.name}</div>
                    <div class="order-item-price">$${item.price?.toFixed(2)}</div>
                    <div class="order-item-quantity">Cantidad: ${item.quantity}</div>
                </div>
            </div>
        `;
    });
    
    const detailsHTML = `
        <div class="order-info-grid">
            <div class="info-group">
                <h4>Información del Cliente</h4>
                <p><strong>Email:</strong> ${customerInfo.email || 'N/A'}</p>
                <p><strong>Teléfono:</strong> ${customerInfo.phone || 'N/A'}</p>
            </div>
            
            <div class="info-group">
                <h4>Información de Envío</h4>
                <p><strong>Nombre:</strong> ${shippingInfo.firstName || ''} ${shippingInfo.lastName || ''}</p>
                <p><strong>Dirección:</strong> ${shippingInfo.address || 'N/A'}</p>
                <p><strong>Ciudad:</strong> ${shippingInfo.city || 'N/A'}</p>
                <p><strong>Código Postal:</strong> ${shippingInfo.postalCode || 'N/A'}</p>
                <p><strong>País:</strong> ${shippingInfo.country || 'N/A'}</p>
            </div>
            
            <div class="info-group">
                <h4>Información del Pedido</h4>
                <p><strong>Número:</strong> ${order.orderNumber}</p>
                <p><strong>Estado:</strong> <span class="status-badge status-${order.status}">${order.status}</span></p>
                <p><strong>Método de Pago:</strong> ${order.paymentMethod || 'N/A'}</p>
                <p><strong>Total:</strong> $${order.total?.toFixed(2) || '0.00'}</p>
                <p><strong>Fecha:</strong> ${order.createdAt ? order.createdAt.toDate().toLocaleString('es-ES') : 'N/A'}</p>
            </div>
        </div>
        
        <div class="order-items">
            <h4>Productos:</h4>
            ${itemsHTML}
        </div>
    `;
    
    document.getElementById('orderDetails').innerHTML = detailsHTML;
    
    // Mostrar/ocultar botones según el estado
    const confirmBtn = document.querySelector('.confirm-btn');
    const rejectBtn = document.querySelector('.reject-btn');
    const completeBtn = document.querySelector('.complete-btn');
    
    if (order.status === 'pending') {
        confirmBtn.style.display = 'flex';
        rejectBtn.style.display = 'flex';
        completeBtn.style.display = 'none';
    } else if (order.status === 'confirmed') {
        confirmBtn.style.display = 'none';
        rejectBtn.style.display = 'none';
        completeBtn.style.display = 'flex';
    } else {
        confirmBtn.style.display = 'none';
        rejectBtn.style.display = 'none';
        completeBtn.style.display = 'none';
    }
    
    document.getElementById('orderModal').style.display = 'block';
}

// Confirmar pedido
function confirmOrder(orderId = null) {
    const targetOrderId = orderId || currentOrderId;
    if (!targetOrderId) return;
    
    if (confirm('¿Estás seguro de que quieres confirmar este pedido?')) {
        showLoading(true);
        
        const order = allOrders.find(o => o.id === targetOrderId);
        
        db.collection('orders').doc(targetOrderId).update({
            status: 'confirmed',
            confirmedAt: firebase.firestore.FieldValue.serverTimestamp(),
            confirmedBy: currentUser.email
        }).then(() => {
            // Crear notificación para el usuario
            if (order && order.customer && order.customer.uid) {
                createUserNotification(order.customer.uid, {
                    type: 'order_confirmed',
                    title: '¡Pedido Confirmado!',
                    message: `Tu pedido #${order.orderNumber} ha sido confirmado y está en proceso. Recibirás tu compra en 3-5 días hábiles.`,
                    orderId: targetOrderId,
                    orderNumber: order.orderNumber,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    read: false
                });
            }
            
            showNotification('Pedido confirmado exitosamente', 'success');
            loadOrders();
            updateDashboardStats();
            if (currentOrderId) {
                closeOrderModal();
            }
            
            sendOrderConfirmationEmail(targetOrderId);
        }).catch(error => {
            console.error('Error confirming order:', error);
            showNotification('Error confirmando pedido', 'error');
        }).finally(() => {
            showLoading(false);
        });
    }
}

// Rechazar pedido
function rejectOrder(orderId = null) {
    const targetOrderId = orderId || currentOrderId;
    if (!targetOrderId) return;
    
    const reason = prompt('Razón del rechazo (opcional):');
    
    if (confirm('¿Estás seguro de que quieres rechazar este pedido?')) {
        showLoading(true);
        
        const order = allOrders.find(o => o.id === targetOrderId);
        
        db.collection('orders').doc(targetOrderId).update({
            status: 'rejected',
            rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
            rejectedBy: currentUser.email,
            rejectionReason: reason || 'Sin razón especificada'
        }).then(() => {
            // Crear notificación para el usuario
            if (order && order.customer && order.customer.uid) {
                createUserNotification(order.customer.uid, {
                    type: 'order_rejected',
                    title: 'Pedido Rechazado',
                    message: `Lamentamos informarte que tu pedido #${order.orderNumber} ha sido rechazado. ${reason ? 'Razón: ' + reason : ''} Contacta con soporte para más información.`,
                    orderId: targetOrderId,
                    orderNumber: order.orderNumber,
                    rejectionReason: reason,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    read: false
                });
            }
            
            showNotification('Pedido rechazado', 'warning');
            loadOrders();
            updateDashboardStats();
            if (currentOrderId) {
                closeOrderModal();
            }
            
            sendOrderRejectionEmail(targetOrderId, reason);
        }).catch(error => {
            console.error('Error rejecting order:', error);
            showNotification('Error rechazando pedido', 'error');
        }).finally(() => {
            showLoading(false);
        });
    }
}

// Completar pedido
function completeOrder(orderId = null) {
    const targetOrderId = orderId || currentOrderId;
    if (!targetOrderId) return;
    
    if (confirm('¿Marcar este pedido como completado/enviado?')) {
        showLoading(true);
        
        const order = allOrders.find(o => o.id === targetOrderId);
        
        db.collection('orders').doc(targetOrderId).update({
            status: 'completed',
            completedAt: firebase.firestore.FieldValue.serverTimestamp(),
            completedBy: currentUser.email
        }).then(() => {
            // Crear notificación para el usuario
            if (order && order.customer && order.customer.uid) {
                createUserNotification(order.customer.uid, {
                    type: 'order_shipped',
                    title: '¡Pedido Enviado!',
                    message: `¡Excelente noticia! Tu pedido #${order.orderNumber} ha sido enviado y está en camino. Recibirás un código de seguimiento por email.`,
                    orderId: targetOrderId,
                    orderNumber: order.orderNumber,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    read: false
                });
            }
            
            showNotification('Pedido marcado como completado', 'success');
            loadOrders();
            updateDashboardStats();
            if (currentOrderId) {
                closeOrderModal();
            }
            
            sendOrderCompletionEmail(targetOrderId);
        }).catch(error => {
            console.error('Error completing order:', error);
            showNotification('Error completando pedido', 'error');
        }).finally(() => {
            showLoading(false);
        });
    }
}

// Función para crear notificaciones de usuario
function createUserNotification(userId, notificationData) {
    db.collection('notifications').add({
        userId: userId,
        ...notificationData
    }).then(() => {
        console.log('Notification created for user:', userId);
    }).catch(error => {
        console.error('Error creating notification:', error);
    });
}

// Función para enviar notificación personalizada a un usuario
function sendCustomNotification(userId, title, message, type = 'info') {
    if (!userId || !title || !message) return;
    
    createUserNotification(userId, {
        type: 'custom',
        title: title,
        message: message,
        notificationType: type,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        read: false
    });
    
    showNotification('Notificación enviada al usuario', 'success');
}

// Enviar notificación personalizada desde el modal de pedido
function sendCustomOrderNotification() {
    if (!currentOrderId) return;
    
    const order = allOrders.find(o => o.id === currentOrderId);
    if (!order || !order.customer || !order.customer.uid) {
        showNotification('No se puede enviar notificación: datos de usuario no disponibles', 'error');
        return;
    }
    
    const title = prompt('Título de la notificación:');
    if (!title) return;
    
    const message = prompt('Mensaje de la notificación:');
    if (!message) return;
    
    const notificationType = prompt('Tipo de notificación (success, info, warning, error):', 'info');
    
    createUserNotification(order.customer.uid, {
        type: 'custom',
        title: title,
        message: message,
        orderId: currentOrderId,
        orderNumber: order.orderNumber,
        notificationType: notificationType || 'info',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        read: false
    });
    
    showNotification('Notificación personalizada enviada', 'success');
}

// Enviar notificación masiva a todos los usuarios
function sendBulkNotification() {
    const title = prompt('Título del anuncio:');
    if (!title) return;
    
    const message = prompt('Mensaje del anuncio:');
    if (!message) return;
    
    if (!confirm('¿Enviar esta notificación a TODOS los usuarios registrados?')) return;
    
    showLoading(true);
    
    // Obtener todos los usuarios
    db.collection('users').get()
        .then(snapshot => {
            const batch = db.batch();
            let count = 0;
            
            snapshot.forEach(doc => {
                const notificationRef = db.collection('notifications').doc();
                batch.set(notificationRef, {
                    userId: doc.id,
                    type: 'announcement',
                    title: title,
                    message: message,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    read: false
                });
                count++;
            });
            
            return batch.commit().then(() => count);
        })
        .then(count => {
            showNotification(`Notificación enviada a ${count} usuarios`, 'success');
        })
        .catch(error => {
            console.error('Error sending bulk notification:', error);
            showNotification('Error enviando notificación masiva', 'error');
        })
        .finally(() => {
            showLoading(false);
        });
}

// Cargar usuarios
function loadUsers() {
    showLoading(true);
    
    db.collection('users').orderBy('createdAt', 'desc').get()
        .then(snapshot => {
            allUsers = [];
            const orderPromises = [];
            
            snapshot.forEach(doc => {
                const userData = doc.data();
                const user = { 
                    id: doc.id, 
                    name: userData.name || 'Sin nombre',
                    email: userData.email || 'Sin email',
                    createdAt: userData.createdAt || null,
                    lastLogin: userData.lastLogin || null,
                    blocked: userData.blocked || false,
                    ...userData
                };
                allUsers.push(user);
                
                // Cargar conteo de pedidos para cada usuario
                orderPromises.push(
                    db.collection('orders')
                        .where('customer.uid', '==', doc.id)
                        .get()
                        .then(orderSnapshot => ({
                            userId: doc.id,
                            count: orderSnapshot.size
                        }))
                        .catch(() => ({ userId: doc.id, count: 0 }))
                );
            });
            
            return Promise.all(orderPromises);
        })
        .then(orderCounts => {
            // Agregar conteo de pedidos a cada usuario
            const orderCountMap = {};
            orderCounts.forEach(oc => {
                orderCountMap[oc.userId] = oc.count;
            });
            
            allUsers.forEach(user => {
                user.orderCount = orderCountMap[user.id] || 0;
            });
            
            displayUsers(allUsers);
            showLoading(false);
        })
        .catch(error => {
            console.error('Error loading users:', error);
            showNotification('Error cargando usuarios: ' + error.message, 'error');
            showLoading(false);
        });
}

// Mostrar usuarios en la tabla
/**
 * ✅ FUNCIÓN MEJORADA - Actualiza estado del usuario en tiempo real
 */
function displayUsers(users) {
    const tableBody = document.getElementById('usersTableBody');
    
    if (!tableBody) {
        console.error('Users table body not found');
        return;
    }
    
    if (users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No hay usuarios registrados</td></tr>';
        return;
    }
    
    let html = '';
    users.forEach(user => {
        const createdDate = user.createdAt ? 
            (user.createdAt.toDate ? user.createdAt.toDate().toLocaleDateString('es-ES') : 'N/A') 
            : 'N/A';
        
        const lastLogin = user.lastLogin ? 
            (user.lastLogin.toDate ? user.lastLogin.toDate().toLocaleDateString('es-ES') : 'N/A')
            : 'Nunca';
        
        const userOrdersCount = user.orderCount || 0;
        
        // ✅ CORREGIDO: Verificar estado online mejorado
        const isOnline = checkUserOnlineStatus(user.lastLogin, user.lastActivity);
        
        // Estado: Bloqueado > Online > Inactivo
        let statusClass, statusText;
        if (user.blocked) {
            statusClass = 'status-rejected';
            statusText = 'Bloqueado';
        } else if (isOnline) {
            statusClass = 'status-confirmed';
            statusText = 'Conectado';
        } else {
            statusClass = 'status-pending';
            statusText = 'Inactivo';
        }
        
        // 🆕 COMPATIBILIDAD CON AMBAS ESTRUCTURAS
let subscription = 'none';
if (user.subscriptions && user.subscriptions.ps5) {
    subscription = user.subscriptions.ps5.plan || 'none';
} else if (user.subscription) {
    subscription = user.subscription || 'none';
}
const subClass = subscription === 'none' ? 'none' : subscription.toLowerCase();

        html += `
            <tr>
                <td>${user.name || 'N/A'}</td>
                <td>${user.email}</td>
                <td>${createdDate}</td>
                <td>
                    ${lastLogin}
                    ${isOnline ? '<br><small style="color: #4caf50;"><i class="fas fa-circle" style="font-size: 0.5rem;"></i> Ahora</small>' : ''}
                </td>
                <td>${userOrdersCount}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${isOnline ? '<i class="fas fa-circle" style="font-size: 0.6rem; margin-right: 4px;"></i>' : ''}
                        ${statusText}
                    </span>
                </td>
                <td>
                    ${subscription !== 'none' ? `
                        <span class="subscription-badge-admin ${subClass}" 
                              title="Descuento: ${subscription === 'Essential' ? '5' : subscription === 'Extra' ? '15' : '25'}%">
                            ${subscription}
                        </span>
                    ` : '<span style="color: #666;">Sin suscripción</span>'}
                </td>
                <td>
                    <div class="action-buttons-container">
                        <button class="action-btn compact" onclick="viewUserDetails('${user.id}')" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn compact" onclick="changeUserSubscription('${user.id}')" title="Cambiar suscripción">
                            <i class="fas fa-crown"></i>
                        </button>
                        ${subscription !== 'none' ? 
                            `<button class="action-btn compact danger" 
                                     onclick="cancelUserSubscription('${user.id}')" 
                                     title="Cancelar suscripción">
                                <i class="fas fa-ban"></i>
                            </button>` : ''
                        }
                        <button class="action-btn compact ${user.blocked ? 'success' : 'danger'}" 
                                onclick="toggleUserBlock('${user.id}', ${user.blocked})"
                                title="${user.blocked ? 'Desbloquear usuario' : 'Bloquear usuario'}">
                            <i class="fas fa-${user.blocked ? 'unlock' : 'lock'}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}


/**
 * ✅ FUNCIÓN MEJORADA - Verifica si el usuario está online
 * Ahora considera múltiples factores para mayor precisión
 */
function checkUserOnlineStatus(lastLogin, lastActivity) {
    // Si no hay información de login, está offline
    if (!lastLogin) return false;
    
    // Convertir a fecha
    let lastLoginDate;
    if (lastLogin.toDate) {
        lastLoginDate = lastLogin.toDate();
    } else if (lastLogin.seconds) {
        lastLoginDate = new Date(lastLogin.seconds * 1000);
    } else if (lastLogin instanceof Date) {
        lastLoginDate = lastLogin;
    } else {
        return false;
    }
    
    const now = new Date();
    const minutesDiff = (now - lastLoginDate) / (1000 * 60);
    
    // ✅ AJUSTADO: Considerar online si se conectó en los últimos 5 minutos
    // (antes era 30, lo cual era demasiado)
    return minutesDiff <= 5;
}


/**
 * ✅ NUEVA FUNCIÓN - Actualiza lastActivity del usuario al hacer acciones
 * Llamar esta función en ps5.js cuando el usuario hace algo
 */
function updateUserActivity() {
    if (!currentUser) return;
    
    db.collection('users').doc(currentUser.uid).update({
        lastActivity: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(error => {
        console.log('Error actualizando actividad:', error);
    });
}


/**
 * ✅ NUEVA FUNCIÓN - Auto-refresh de la tabla de usuarios cada 30 segundos
 * Agregar al final de initializeDashboard() en admin.js
 */
function startUsersAutoRefresh() {
    // Refrescar cada 30 segundos
    setInterval(() => {
        const currentTab = document.querySelector('.tab-content.active');
        if (currentTab && currentTab.id === 'users') {
            loadUsers(); // Recargar silenciosamente
        }
    }, 30000); // 30 segundos
}


// Buscar usuarios
function searchUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    let filteredUsers = allUsers;
    
    if (searchTerm) {
        filteredUsers = allUsers.filter(user => 
            user.email.toLowerCase().includes(searchTerm) ||
            (user.name && user.name.toLowerCase().includes(searchTerm))
        );
    }
    
    displayUsers(filteredUsers);
}


// Ver detalles del usuario
// Ver detalles del usuario
function viewUserDetails(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        showNotification('Usuario no encontrado', 'error');
        return;
    }
    
    currentUserId = userId;
    
    // Cargar pedidos del usuario
    db.collection('orders')
        .where('customer.uid', '==', userId)
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            const userOrders = [];
            snapshot.forEach(doc => {
                userOrders.push({ id: doc.id, ...doc.data() });
            });
            
            let ordersHTML = '';
            let totalSpent = 0;
            
            userOrders.forEach(order => {
                const orderDate = order.createdAt ? 
                    (order.createdAt.toDate ? order.createdAt.toDate().toLocaleDateString('es-ES') : 'N/A')
                    : 'N/A';
                
                const orderTotal = order.total || 0;
                if (order.status === 'completed' || order.status === 'confirmed') {
                    totalSpent += orderTotal;
                }
                
                ordersHTML += `
                    <div style="background: var(--secondary-color); padding: 1rem; margin: 0.5rem 0; border-radius: 6px;">
                        <strong>Pedido #${order.orderNumber}</strong><br>
                        Estado: <span class="status-badge status-${order.status}">${order.status}</span><br>
                        Total: $${orderTotal.toFixed(2)}<br>
                        Fecha: ${orderDate}
                    </div>
                `;
            });
            
            if (ordersHTML === '') {
                ordersHTML = '<p style="color: #666;">No hay pedidos de este usuario</p>';
            }
            
            const createdDate = user.createdAt ? 
                (user.createdAt.toDate ? user.createdAt.toDate().toLocaleDateString('es-ES') : 'N/A')
                : 'N/A';
            const lastLogin = user.lastLogin ? 
                (user.lastLogin.toDate ? user.lastLogin.toDate().toLocaleDateString('es-ES') : 'N/A')
                : 'Nunca';
            
            let detailsHTML = `
                <div class="order-info-grid">
                    <div class="info-group">
                        <h4>Información Personal</h4>
                        <p><strong>Nombre:</strong> ${user.name || 'N/A'}</p>
                        <p><strong>Email:</strong> ${user.email}</p>
                        <p><strong>Estado:</strong> 
                            <span class="status-badge ${user.blocked ? 'status-rejected' : 'status-confirmed'}">
                                ${user.blocked ? 'Bloqueado' : 'Activo'}
                            </span>
                        </p>
                        ${user.blocked ? `
                            <p><strong>Bloqueado por:</strong> ${user.blockedBy || 'N/A'}</p>
                            <p><strong>Fecha de bloqueo:</strong> ${user.blockedAt ? 
                                (user.blockedAt.toDate ? user.blockedAt.toDate().toLocaleDateString('es-ES') : 'N/A')
                                : 'N/A'}</p>
                        ` : ''}
                    </div>
                    
                    <div class="info-group">
                        <h4>Estadísticas</h4>
                        <p><strong>Fecha de registro:</strong> ${createdDate}</p>
                        <p><strong>Última conexión:</strong> ${lastLogin}</p>
                        <p><strong>Total de pedidos:</strong> ${userOrders.length}</p>
                        <p><strong>Total gastado:</strong> $${totalSpent.toFixed(2)}</p>
                    </div>
                </div>
                
                <div class="order-items">
                    <h4>Historial de Pedidos:</h4>
                    ${ordersHTML}
                </div>
            `;
            
            // Agregar sección de cancelación de suscripción si existe
            if (user.subscription && user.subscription !== 'none') {
                detailsHTML += `
                    <div style="margin-top: 25px; padding: 20px; background: rgba(220, 53, 69, 0.1); 
                                border-radius: 12px; border: 2px solid #dc3545;">
                        <h3 style="color: #dc3545; margin-bottom: 15px;">
                            <i class="fas fa-ban"></i> Cancelar Suscripción
                        </h3>
                        <p style="color: #ccc; margin-bottom: 15px;">
                            Cancelará <strong style="color: #0070f3;">${user.subscription}</strong>
                        </p>
                        <button onclick="cancelUserSubscription('${user.id}'); closeUserModal();"
                            style="background: #dc3545; color: white; border: none; padding: 12px 24px; 
                                   border-radius: 8px; cursor: pointer; font-weight: 600; width: 100%;">
                            <i class="fas fa-ban"></i> Cancelar ${user.subscription}
                        </button>
                    </div>
                `;
            }
            
            document.getElementById('userDetails').innerHTML = detailsHTML;
            
            // Actualizar botón de bloqueo en el modal
            const blockBtn = document.querySelector('#userModal .danger-btn');
            if (blockBtn) {
                blockBtn.innerHTML = user.blocked ? 
                    '<i class="fas fa-unlock"></i> Desbloquear Usuario' :
                    '<i class="fas fa-ban"></i> Bloquear Usuario';
                blockBtn.onclick = () => {
                    toggleUserBlock(userId, user.blocked);
                    closeUserModal();
                };
            }
            
            document.getElementById('userModal').style.display = 'block';
        })
        .catch(error => {
            console.error('Error loading user orders:', error);
            showNotification('Error cargando detalles del usuario', 'error');
        });
}


/**
 * Cambia la suscripción de un usuario desde el panel admin
 */
function changeUserSubscription(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        showNotification('Usuario no encontrado', 'error');
        return;
    }
    
    // Crear modal de selección
    const modal = document.createElement('div');
    modal.className = 'subscription-admin-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()">
            <div class="modal-content-subscription" onclick="event.stopPropagation()">
                <h3><i class="fas fa-crown"></i> Cambiar Suscripción</h3>
                <p>Usuario: <strong>${user.name}</strong></p>
                <p>Suscripción actual: <strong>${user.subscription || 'Essential'}</strong></p>
                
                <div class="subscription-options">
                    <label class="subscription-radio">
                        <input type="radio" name="subscription" value="Essential" 
                               ${(user.subscription || 'Essential') === 'Essential' ? 'checked' : ''}>
                        <span class="radio-label">
                            <strong>Essential</strong>
                            <small>5% descuento</small>
                        </span>
                    </label>
                    
                    <label class="subscription-radio">
                        <input type="radio" name="subscription" value="Extra"
                               ${user.subscription === 'Extra' ? 'checked' : ''}>
                        <span class="radio-label">
                            <strong>Extra</strong>
                            <small>15% descuento</small>
                        </span>
                    </label>
                    
                    <label class="subscription-radio">
                        <input type="radio" name="subscription" value="Premium"
                               ${user.subscription === 'Premium' ? 'checked' : ''}>
                        <span class="radio-label">
                            <strong>Premium</strong>
                            <small>25% descuento</small>
                        </span>
                    </label>
                </div>
                
                <div class="modal-buttons">
                    <button onclick="this.closest('.subscription-admin-modal').remove()" 
                            class="cancel-btn">
                        Cancelar
                    </button>
                    <button onclick="confirmSubscriptionChange('${userId}')" 
                            class="confirm-btn">
                        <i class="fas fa-check"></i> Confirmar Cambio
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Confirma y guarda el cambio de suscripción
 */
function confirmSubscriptionChange(userId) {
    const selectedSub = document.querySelector('input[name="subscription"]:checked');
    if (!selectedSub) {
        showNotification('Selecciona una suscripción', 'warning');
        return;
    }
    
    const newSubscription = selectedSub.value;
    
    showLoading(true);
    
    db.collection('users').doc(userId).update({
        subscription: newSubscription,
        subscriptionUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        subscriptionUpdatedBy: currentUser.email
    })
    .then(() => {
        // Crear notificación para el usuario
        return db.collection('notifications').add({
            userId: userId,
            type: 'subscription_updated',
            title: '¡Suscripción Actualizada!',
            message: `Tu suscripción ha sido actualizada a PlayStation Plus ${newSubscription}. Ahora disfrutas de ${newSubscription === 'Essential' ? '5' : newSubscription === 'Extra' ? '15' : '25'}% de descuento en todos los juegos.`,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            read: false
        });
    })
    .then(() => {
        showNotification('Suscripción actualizada correctamente', 'success');
        loadUsers(); // Recargar lista de usuarios
        
        // Cerrar modal
        const modal = document.querySelector('.subscription-admin-modal');
        if (modal) modal.remove();
    })
    .catch(error => {
        console.error('Error actualizando suscripción:', error);
        showNotification('Error al actualizar suscripción', 'error');
    })
    .finally(() => {
        showLoading(false);
    });
}

// Bloquear/desbloquear usuario
function toggleUserBlock(userId, currentlyBlocked = false) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        showNotification('Usuario no encontrado', 'error');
        return;
    }
    
    const action = currentlyBlocked ? 'desbloquear' : 'bloquear';
    const confirmMessage = currentlyBlocked ? 
        `¿Estás seguro de que quieres desbloquear a ${user.email}? El usuario podrá acceder nuevamente a su cuenta.` :
        `¿Estás seguro de que quieres bloquear a ${user.email}? El usuario no podrá acceder a su cuenta.`;
    
    if (confirm(confirmMessage)) {
        showLoading(true);
        
        const updateData = {
            blocked: !currentlyBlocked,
            blockedAt: !currentlyBlocked ? firebase.firestore.FieldValue.serverTimestamp() : null,
            blockedBy: !currentlyBlocked ? currentUser.email : null,
            unblockedAt: currentlyBlocked ? firebase.firestore.FieldValue.serverTimestamp() : null,
            unblockedBy: currentlyBlocked ? currentUser.email : null
        };
        
        db.collection('users').doc(userId).update(updateData)
            .then(() => {
                // Crear notificación para el usuario
                const notificationData = {
                    userId: userId,
                    type: currentlyBlocked ? 'account_unblocked' : 'account_blocked',
                    title: currentlyBlocked ? 'Cuenta Desbloqueada' : 'Cuenta Bloqueada',
                    message: currentlyBlocked ? 
                        'Tu cuenta ha sido desbloqueada. Ya puedes acceder nuevamente.' :
                        'Tu cuenta ha sido bloqueada temporalmente. Contacta con soporte para más información.',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    read: false
                };
                
                return db.collection('notifications').add(notificationData);
            })
            .then(() => {
                // Si el usuario está siendo bloqueado, cerrar sus sesiones activas
                if (!currentlyBlocked) {
                    // Marcar todas las sesiones del usuario como inválidas
                    return db.collection('sessions')
                        .where('userId', '==', userId)
                        .where('active', '==', true)
                        .get()
                        .then(snapshot => {
                            const batch = db.batch();
                            snapshot.forEach(doc => {
                                batch.update(doc.ref, { 
                                    active: false, 
                                    endedAt: firebase.firestore.FieldValue.serverTimestamp(),
                                    endReason: 'account_blocked'
                                });
                            });
                            return batch.commit();
                        });
                }
            })
            .then(() => {
                showNotification(
                    `Usuario ${action}ado exitosamente`, 
                    currentlyBlocked ? 'success' : 'warning'
                );
                
                // Actualizar la lista local
                const userIndex = allUsers.findIndex(u => u.id === userId);
                if (userIndex !== -1) {
                    allUsers[userIndex].blocked = !currentlyBlocked;
                }
                
                // Volver a mostrar la tabla
                displayUsers(allUsers);
            })
            .catch(error => {
                console.error('Error updating user:', error);
                showNotification(`Error al ${action} usuario: ${error.message}`, 'error');
            })
            .finally(() => {
                showLoading(false);
            });
    }
}

// Bloquear usuario desde el modal
function blockUser() {
    if (currentUserId) {
        const user = allUsers.find(u => u.id === currentUserId);
        if (user) {
            toggleUserBlock(currentUserId, user.blocked);
            closeUserModal();
        }
    }
}

// Enviar email al usuario
function sendEmailToUser() {
    const user = allUsers.find(u => u.id === currentUserId);
    if (!user) return;
    
    const subject = prompt('Asunto del email:');
    const message = prompt('Mensaje:');
    
    if (subject && message) {
        // Aquí implementarías la lógica para enviar email
        // Podrías usar un servicio como EmailJS o funciones de Firebase
        showNotification('Funcionalidad de email en desarrollo', 'info');
    }
}

// Funciones de notificaciones por email (implementar según tus necesidades)
function sendOrderConfirmationEmail(orderId) {
    // Implementar lógica de envío de email
    console.log('Sending confirmation email for order:', orderId);
}

function sendOrderRejectionEmail(orderId, reason) {
    // Implementar lógica de envío de email
    console.log('Sending rejection email for order:', orderId, 'Reason:', reason);
}

function sendOrderCompletionEmail(orderId) {
    // Implementar lógica de envío de email
    console.log('Sending completion email for order:', orderId);
}

// Inicializar gráficos
function initializeCharts() {
    // Configuración base para Chart.js
    Chart.defaults.color = '#cccccc';
    Chart.defaults.borderColor = '#333333';
    Chart.defaults.backgroundColor = 'rgba(0, 112, 243, 0.1)';
    
    // Inicializar cada gráfico
    initOrdersChart();
    initRevenueChart();
    initStatusChart();
    initUsersChart();
}

// Gráfico de pedidos por mes
function initOrdersChart() {
    const ctx = document.getElementById('ordersChart');
    if (!ctx) return;
    
    charts.orders = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
            datasets: [{
                label: 'Pedidos',
                data: [12, 19, 3, 5, 2, 3],
                borderColor: '#0070f3',
                backgroundColor: 'rgba(0, 112, 243, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#333333'
                    }
                },
                x: {
                    grid: {
                        color: '#333333'
                    }
                }
            }
        }
    });
}

// Gráfico de ingresos por mes
function initRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    charts.revenue = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
            datasets: [{
                label: 'Ingresos ($)',
                data: [1200, 1900, 300, 500, 200, 300],
                backgroundColor: '#4caf50',
                borderColor: '#45a049',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#333333'
                    }
                },
                x: {
                    grid: {
                        color: '#333333'
                    }
                }
            }
        }
    });
}

// Gráfico de estados de pedidos
function initStatusChart() {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;
    
    charts.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pendientes', 'Confirmados', 'Completados', 'Rechazados'],
            datasets: [{
                data: [5, 10, 15, 2],
                backgroundColor: ['#ff9800', '#4caf50', '#0070f3', '#f44336']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Gráfico de registro de usuarios
function initUsersChart() {
    const ctx = document.getElementById('usersChart');
    if (!ctx) return;
    
    charts.users = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
            datasets: [{
                label: 'Nuevos Usuarios',
                data: [5, 8, 12, 15, 10, 18],
                borderColor: '#ff9800',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#333333'
                    }
                },
                x: {
                    grid: {
                        color: '#333333'
                    }
                }
            }
        }
    });
}

// Actualizar gráficos con datos reales
function updateCharts() {
    if (allOrders.length === 0 || allUsers.length === 0) {
        loadOrders().then(() => loadUsers()).then(() => updateChartsWithRealData());
        return;
    }
    updateChartsWithRealData();
}

function updateChartsWithRealData() {
    // Actualizar gráfico de estados
    const statusCounts = {
        pending: 0,
        confirmed: 0,
        completed: 0,
        rejected: 0
    };
    
    allOrders.forEach(order => {
        if (statusCounts.hasOwnProperty(order.status)) {
            statusCounts[order.status]++;
        }
    });
    
    if (charts.status) {
        charts.status.data.datasets[0].data = [
            statusCounts.pending,
            statusCounts.confirmed,
            statusCounts.completed,
            statusCounts.rejected
        ];
        charts.status.update();
    }
    
    // Actualizar otros gráficos con datos reales...
    // (aquí podrías agregar lógica para procesar fechas y generar datos mensuales)
}

// Funciones de configuración
function saveNotificationSettings() {
    const emailNotifications = document.getElementById('emailNotifications').checked;
    const orderNotifications = document.getElementById('orderNotifications').checked;
    
    // Guardar configuración en Firestore
    db.collection('adminSettings').doc('notifications').set({
        emailNotifications,
        orderNotifications,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedBy: currentUser.email
    }).then(() => {
        showNotification('Configuración guardada', 'success');
    }).catch(error => {
        console.error('Error saving settings:', error);
        showNotification('Error guardando configuración', 'error');
    });
}

function exportData() {
    if (!confirm('¿Exportar todos los datos a Excel?')) return;

    showLoading(true);

    // BOM para que Excel lea UTF-8 correctamente
    let csvContent = "\uFEFF";

    // Encabezados (usar ; para Excel en español)
    csvContent += 
        "Número Pedido;Cliente;Email;Total;Estado;Fecha\n";

    allOrders.forEach(order => {
        const customerName = order.shipping
            ? `${order.shipping.firstName} ${order.shipping.lastName}`
            : 'N/A';

        const customerEmail = order.customer
            ? order.customer.email
            : 'N/A';

        const date = order.createdAt
            ? order.createdAt.toDate().toLocaleDateString('es-ES')
            : 'N/A';

        csvContent += 
            `"${order.orderNumber}";` +
            `"${customerName}";` +
            `"${customerEmail}";` +
            `"${(order.total || 0).toFixed(2)}";` +
            `"${order.status}";` +
            `"${date}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `orders_export_${new Date().toISOString().split('T')[0]}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showLoading(false);
    showNotification('Datos exportados correctamente a Excel', 'success');
}


function confirmDataCleanup() {
    if (confirm('¿ADVERTENCIA: Esto eliminará datos antiguos. ¿Continuar?')) {
        if (confirm('Esta acción no se puede deshacer. ¿Estás completamente seguro?')) {
            showLoading(true);
            
            // Eliminar pedidos completados de más de 6 meses
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            
            db.collection('orders')
                .where('status', '==', 'completed')
                .where('createdAt', '<', firebase.firestore.Timestamp.fromDate(sixMonthsAgo))
                .get()
                .then(snapshot => {
                    const batch = db.batch();
                    snapshot.docs.forEach(doc => {
                        batch.delete(doc.ref);
                    });
                    return batch.commit();
                })
                .then(() => {
                    showNotification(`${snapshot.size} registros antiguos eliminados`, 'success');
                    loadOrders();
                    updateDashboardStats();
                })
                .catch(error => {
                    console.error('Error cleaning data:', error);
                    showNotification('Error limpiando datos', 'error');
                })
                .finally(() => {
                    showLoading(false);
                });
        }
    }
}

function changeAdminPassword() {
    const newPassword = document.getElementById('adminPassword').value;
    
    if (newPassword.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    if (confirm('¿Cambiar contraseña de administrador?')) {
        currentUser.updatePassword(newPassword).then(() => {
            showNotification('Contraseña actualizada exitosamente', 'success');
            document.getElementById('adminPassword').value = '';
        }).catch(error => {
            console.error('Error updating password:', error);
            showNotification('Error actualizando contraseña', 'error');
        });
    }
}

// Funciones de utilidad
function updatePendingOrdersCount() {
    db.collection('orders').where('status', '==', 'pending').get()
        .then(snapshot => {
            document.getElementById('pendingOrdersCount').textContent = snapshot.size;
        });
}

function updateDashboardStats() {
    loadDashboardStats();
}

function playNotificationSound() {
    // Crear y reproducir sonido de notificación
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBzl+2O/HdyYELYPR9OmNNwcbbMDp556GFw1LpNfsp2EeClKt5fCYhgwMU6rm8ZlhHg1LqNPvpWA');
    audio.volume = 0.3;
    audio.play().catch(() => {}); // Ignorar errores de audio
}

// Funciones de modal
function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
    currentOrderId = null;
}

function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
    currentUserId = null;
}

// Sistema de notificaciones
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    container.appendChild(notification);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Loading overlay
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = show ? 'flex' : 'none';
}

// Cerrar sesión
function logout() {
    if (confirm('¿Cerrar sesión de administrador?')) {
        auth.signOut().then(() => {
            window.location.href = 'admin-login.html';
        }).catch(error => {
            showNotification('Error cerrando sesión', 'error');
        });
    }
}

// Funciones de exportación adicionales
function exportUserData() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nombre,Email,Fecha_Registro,Ultima_Conexion,Total_Pedidos,Estado\n";
    
    allUsers.forEach(user => {
        const createdDate = user.createdAt ? user.createdAt.toDate().toLocaleDateString('es-ES') : 'N/A';
        const lastLogin = user.lastLogin ? user.lastLogin.toDate().toLocaleDateString('es-ES') : 'N/A';
        const userOrdersCount = allOrders.filter(order => 
            order.customer && order.customer.uid === user.id
        ).length;
        const status = user.blocked ? 'Bloqueado' : 'Activo';
        
        csvContent += `${user.name || 'N/A'},${user.email},${createdDate},${lastLogin},${userOrdersCount},${status}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Datos de usuarios exportados', 'success');
}

// Inicializar cuando se carga la página
window.onload = function() {
    // Verificar si el usuario ya está autenticado
    auth.onAuthStateChanged((user) => {
        if (!user) {
            // Si no hay usuario, redirigir a login
            window.location.href = 'admin-login.html';
        }
    });
};

// Función opcional: Mostrar tiempo desde última conexión
function getTimeSinceLastLogin(lastLogin) {
    if (!lastLogin) return 'Nunca conectado';
    
    const lastLoginDate = lastLogin.toDate ? lastLogin.toDate() : new Date(lastLogin);
    const now = new Date();
    const diffMs = now - lastLoginDate;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 30) return `Hace ${diffDays} días`;
    return `Hace ${Math.floor(diffDays / 30)} meses`;
}



// ========================================
// GESTIÓN DE SOLICITUDES DE SUSCRIPCIÓN
// ========================================

/**
 * Carga todas las solicitudes de suscripción
 */
function loadSubscriptionRequests() {
    showLoading(true);
    
    db.collection('subscriptionRequests')
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            allSubscriptionRequests = [];
            snapshot.forEach(doc => {
                allSubscriptionRequests.push({ id: doc.id, ...doc.data() });
            });
            
            displaySubscriptionRequests(allSubscriptionRequests);
            updatePendingSubscriptionsCount();
            showLoading(false);
        })
        .catch(error => {
            console.error('Error loading subscription requests:', error);
            showNotification('Error cargando solicitudes de suscripción', 'error');
            showLoading(false);
        });
}

/**
 * Muestra las solicitudes en la tabla
 */
function displaySubscriptionRequests(requests) {
    const tableBody = document.getElementById('subscriptionsTableBody');
    
    if (!tableBody) {
        console.error('subscriptionsTableBody not found');
        return;
    }
    
    if (requests.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No hay solicitudes de suscripción</td></tr>';
        return;
    }
    
    let html = '';
    requests.forEach(request => {
        const date = request.createdAt ? request.createdAt.toDate().toLocaleDateString('es-ES') : 'N/A';
        const platform = request.platform || 'ps5'; // Default PS5 para compatibilidad
        const statusClass = `status-${request.status}`;
        const statusText = request.status === 'pending' ? 'Pendiente' : 
                          request.status === 'approved' ? 'Aprobada' : 'Rechazada';
        
        // Obtener info del plan usando SubscriptionManager
        const planInfo = SubscriptionManager.getPlanInfo(platform, request.requestedPlan);
        const planColor = planInfo ? planInfo.color : '#666';
        
        html += `
            <tr>
                <td>
                    <span class="platform-badge ${platform}">
                        ${platform === 'ps5' ? '🎮 PlayStation' : '🎮 Xbox'}
                    </span>
                </td>
                <td>${request.userName || 'N/A'}</td>
                <td>${request.userEmail}</td>
                <td>
                    <span style="background: ${planColor}; color: white; padding: 4px 12px; border-radius: 12px; font-weight: 600;">
                        ${request.requestedPlan}
                    </span>
                </td>
                <td>$${request.planPrice ? request.planPrice.toFixed(2) : '0.00'}/mes</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${date}</td>
                <td>**** ${request.cardLastFour || '****'}</td>
                <td>
                    <button class="action-btn ${platform}" onclick="viewSubscriptionRequestDetails('${request.id}')">
                        Ver
                    </button>
                    ${request.status === 'pending' ? `
                        <button class="action-btn ${platform}" onclick="approveSubscriptionRequestQuick('${request.id}')">
                            Aprobar
                        </button>
                        <button class="action-btn danger" onclick="rejectSubscriptionRequestQuick('${request.id}')">
                            Rechazar
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

/**
 * ✅ NUEVA VERSIÃ"N - Filtra por plataforma
 */
function filterSubscriptionsByPlatform() {
    currentPlatformFilter = document.getElementById('platformFilter').value;
    filterSubscriptionRequests();
}

/**
 * Filtra las solicitudes por estado
 */
function filterSubscriptionRequests() {
    const statusFilter = document.getElementById('subscriptionStatusFilter').value;
    let filteredRequests = allSubscriptionRequests;
    
    // Filtrar por plataforma
    if (currentPlatformFilter !== 'all') {
        filteredRequests = filteredRequests.filter(req => {
            const platform = req.platform || 'ps5';
            return platform === currentPlatformFilter;
        });
    }
    
    // Filtrar por estado
    if (statusFilter !== 'all') {
        filteredRequests = filteredRequests.filter(req => req.status === statusFilter);
    }
    
    displaySubscriptionRequests(filteredRequests);
}

/**
 * Ver detalles de una solicitud
 */
function viewSubscriptionRequestDetails(requestId) {
    const request = allSubscriptionRequests.find(r => r.id === requestId);
    if (!request) return;
    
    currentSubscriptionRequestId = requestId;
    
    const platform = request.platform || 'ps5';
    const platformName = platform === 'ps5' ? 'PlayStation' : 'Xbox';
    const platformColors = SubscriptionManager.getPlatformColors(platform);
    
    const date = request.createdAt ? request.createdAt.toDate().toLocaleString('es-ES') : 'N/A';
    const processedDate = request.processedAt ? request.processedAt.toDate().toLocaleString('es-ES') : 'N/A';
    
    const planInfo = SubscriptionManager.getPlanInfo(platform, request.requestedPlan);
    
    const detailsHTML = `
        <div style="background: ${platformColors.badge}; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <h3 style="color: white; margin: 0; font-size: 1.5rem;">
                ${platform === 'ps5' ? '🎮' : '🎮'} ${platformName}
            </h3>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 0.9rem;">
                ${planInfo ? planInfo.displayName : request.requestedPlan}
            </p>
        </div>
        
        <div class="order-info-grid">
            <div class="info-group">
                <h4>Información del Usuario</h4>
                <p><strong>Nombre:</strong> ${request.userName || 'N/A'}</p>
                <p><strong>Email:</strong> ${request.userEmail}</p>
                <p><strong>ID Usuario:</strong> ${request.userId}</p>
            </div>
            
            <div class="info-group">
                <h4>Información de la Suscripción</h4>
                <p><strong>Plataforma:</strong> ${platformName}</p>
                <p><strong>Plan:</strong> ${request.requestedPlan}</p>
                <p><strong>Precio:</strong> $${request.planPrice ? request.planPrice.toFixed(2) : '0.00'}/mes</p>
                ${planInfo ? `<p><strong>Descuento:</strong> ${Math.round(planInfo.discount * 100)}%</p>` : ''}
            </div>
            
            <div class="info-group">
                <h4>Información de Pago</h4>
                <p><strong>Tarjeta (últimos 4):</strong> **** ${request.cardLastFour || '****'}</p>
                <p><strong>Nombre en tarjeta:</strong> ${request.cardName || 'N/A'}</p>
            </div>
            
            <div class="info-group">
                <h4>Estado de la Solicitud</h4>
                <p><strong>Estado:</strong> <span class="status-badge status-${request.status}">${request.status}</span></p>
                <p><strong>Fecha de solicitud:</strong> ${date}</p>
                ${request.status !== 'pending' ? `
                    <p><strong>Procesada por:</strong> ${request.processedBy || 'N/A'}</p>
                    <p><strong>Fecha de proceso:</strong> ${processedDate}</p>
                ` : ''}
                ${request.status === 'rejected' && request.rejectionReason ? `
                    <p><strong>Razón del rechazo:</strong> ${request.rejectionReason}</p>
                ` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('subscriptionRequestDetails').innerHTML = detailsHTML;
    
    // Actualizar colores de botones según plataforma
    const modal = document.getElementById('subscriptionRequestModal');
    const approveBtn = modal.querySelector('.confirm-btn');
    const rejectBtn = modal.querySelector('.reject-btn');
    
    if (request.status === 'pending') {
        approveBtn.style.display = 'flex';
        rejectBtn.style.display = 'flex';
        
        // Aplicar colores de plataforma al botón aprobar
        approveBtn.style.background = platformColors.primary;
    } else {
        approveBtn.style.display = 'none';
        rejectBtn.style.display = 'none';
    }
    
    modal.style.display = 'block';
}

/**
 * Aprobar solicitud (versión rápida desde tabla)
 */
function approveSubscriptionRequestQuick(requestId) {
    currentSubscriptionRequestId = requestId;
    approveSubscriptionRequest();
}

/**
 * ✅ VERSIÓN ULTRA-SIMPLIFICADA - Aprobar solicitud SIN SubscriptionManager
 */
async function approveSubscriptionRequest() {
    const requestId = currentSubscriptionRequestId;
    if (!requestId) {
        console.error('❌ No hay requestId');
        return;
    }
    
    if (!confirm('¿Estás seguro de que quieres aprobar esta solicitud de suscripción?')) {
        return;
    }
    
    showLoading(true);
    console.log('🔄 Aprobando solicitud:', requestId);
    
    try {
        // 🔥 PASO 1: Obtener datos de la solicitud
        const requestDoc = await db.collection('subscriptionRequests').doc(requestId).get();
        
        if (!requestDoc.exists) {
            throw new Error('Solicitud no encontrada');
        }
        
        const request = requestDoc.data();
        console.log('📦 Datos de solicitud:', request);
        
        const userId = request.userId;
        const requestedPlan = request.requestedPlan;
        
        // ✅ FORZAR platform = 'ps5' si no existe
        const platform = request.platform || 'ps5';
        console.log('🎮 Platform:', platform);
        console.log('👤 UserId:', userId);
        console.log('📋 Plan:', requestedPlan);
        
        // 🔥 PASO 2: Actualizar el documento del usuario (SIMPLIFICADO)
        console.log('💾 Actualizando usuario en Firestore...');
        
        const subscriptionData = {
            plan: requestedPlan,
            status: 'active',
            startDate: firebase.firestore.FieldValue.serverTimestamp(),
            approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
            approvedBy: currentUser.email
        };
        
        const requestData = {
            requestedPlan: requestedPlan,
            requestStatus: 'approved',
            processedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // ✅ Usar set con merge para garantizar que se cree la estructura
        await db.collection('users').doc(userId).set({
            subscriptions: {
                ps5: subscriptionData
            },
            subscriptionRequests: {
                ps5: requestData
            }
        }, { merge: true });
        
        console.log('✅ Usuario actualizado en Firestore');
        
        // 🔥 PASO 3: Actualizar estado de la solicitud
        await db.collection('subscriptionRequests').doc(requestId).update({
            status: 'approved',
            processedAt: firebase.firestore.FieldValue.serverTimestamp(),
            processedBy: currentUser.email
        });
        
        console.log('✅ Solicitud marcada como aprobada');
        
        // 🔥 PASO 4: Crear notificación simple
        const discountMap = {
            'Essential': 5,
            'Extra': 15,
            'Premium': 25
        };
        const discount = discountMap[requestedPlan] || 0;
        
        await db.collection('notifications').add({
            userId: userId,
            type: 'subscription_approved',
            platform: 'ps5',
            title: '¡Suscripción PS5 Aprobada!',
            message: `Tu PlayStation Plus ${requestedPlan} está activa. ¡Disfruta tu descuento del ${discount}%!`,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            read: false
        });
        
        console.log('✅ Notificación creada');
        
        // 🔥 PASO 5: Actualizar interfaz del admin
        showNotification('✅ Solicitud aprobada exitosamente', 'success');
        loadSubscriptionRequests();
        updatePendingSubscriptionsCount();
        
        if (currentSubscriptionRequestId) {
            closeSubscriptionRequestModal();
        }
        
        console.log('🎉 PROCESO COMPLETO');
        console.log('Verifica en Firebase Console:');
        console.log(`users/${userId}/subscriptions/ps5`);
        
    } catch (error) {
        console.error('❌ ERROR COMPLETO:', error);
        console.error('Stack:', error.stack);
        showNotification(`Error: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Rechazar solicitud (versión rápida desde tabla)
 */
function rejectSubscriptionRequestQuick(requestId) {
    currentSubscriptionRequestId = requestId;
    rejectSubscriptionRequest();
}

async function rejectSubscriptionRequest() {
    const requestId = currentSubscriptionRequestId;
    if (!requestId) return;
    
    const reason = prompt('Razón del rechazo (opcional):');
    
    if (!confirm('¿Estás seguro de que quieres rechazar esta solicitud?')) {
        return;
    }
    
    showLoading(true);
    
    try {
        // Usar SubscriptionManager para rechazar
        const result = await SubscriptionManager.rejectSubscriptionRequest(
            requestId,
            currentUser.email,
            reason
        );
        
        if (result.success) {
            showNotification('Solicitud rechazada', 'warning');
            loadSubscriptionRequests();
            updatePendingSubscriptionsCount();
            
            if (currentSubscriptionRequestId) {
                closeSubscriptionRequestModal();
            }
        } else {
            showNotification(`Error: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Error rejecting subscription:', error);
        showNotification('Error rechazando solicitud', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Enviar notificación personalizada sobre suscripción
 */
function sendCustomSubscriptionNotification() {
    if (!currentSubscriptionRequestId) return;
    
    const request = allSubscriptionRequests.find(r => r.id === currentSubscriptionRequestId);
    if (!request) {
        showNotification('No se puede enviar notificación: datos no disponibles', 'error');
        return;
    }
    
    const title = prompt('Título de la notificación:');
    if (!title) return;
    
    const message = prompt('Mensaje de la notificación:');
    if (!message) return;
    
    db.collection('notifications').add({
        userId: request.userId,
        type: 'custom',
        title: title,
        message: message,
        requestedPlan: request.requestedPlan,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        read: false
    })
    .then(() => {
        showNotification('Notificación enviada', 'success');
    })
    .catch(error => {
        console.error('Error sending notification:', error);
        showNotification('Error enviando notificación', 'error');
    });
}

/**
 * Actualizar contador de solicitudes pendientes
 */
function updatePendingSubscriptionsCount() {
    db.collection('subscriptionRequests')
        .where('status', '==', 'pending')
        .get()
        .then(snapshot => {
            const count = snapshot.size;
            const badge = document.getElementById('pendingSubscriptionsCount');
            if (badge) {
                badge.textContent = count;
            }
        });
}

/**
 * Cerrar modal de detalles de solicitud
 */
function closeSubscriptionRequestModal() {
    document.getElementById('subscriptionRequestModal').style.display = 'none';
    currentSubscriptionRequestId = null;
}

// ==========================================
// FIN DE NUEVAS FUNCIONES
// ==========================================




async function cancelUserSubscription(userId, platform = 'ps5') {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        showNotification('Usuario no encontrado', 'error');
        return;
    }
    
    // Verificar si tiene suscripción activa en esa plataforma
    const hasSub = SubscriptionManager.hasActiveSubscription(user, platform);
    
    if (!hasSub) {
        showNotification(`Este usuario no tiene suscripción ${platform.toUpperCase()} activa`, 'warning');
        return;
    }
    
    const userSub = SubscriptionManager.getUserSubscription(user, platform);
    const platformName = platform === 'ps5' ? 'PlayStation' : 'Xbox';
    
    // Modal de confirmación
    const modal = document.createElement('div');
    modal.className = 'cancel-subscription-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.9); z-index: 9999;
        display: flex; align-items: center; justify-content: center;
    `;
    
    modal.innerHTML = `
        <div style="background: #1a1a1a; padding: 30px; border-radius: 15px; max-width: 500px; width: 90%; border: 2px solid #dc3545;">
            <h2 style="color: #dc3545; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-exclamation-triangle"></i> Cancelar Suscripción ${platformName}
            </h2>
            
            <div style="background: rgba(220, 53, 69, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc3545;">
                <p style="color: #ccc; margin: 0;">
                    <strong style="color: #fff;">Usuario:</strong> ${user.name}<br>
                    <strong style="color: #fff;">Email:</strong> ${user.email}<br>
                    <strong style="color: #fff;">Suscripción:</strong> 
                    <span style="color: #0070f3; font-weight: 600;">${userSub.plan}</span>
                </p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="color: #ccc; display: block; margin-bottom: 8px; font-weight: 600;">
                    <i class="fas fa-comment-alt"></i> Motivo (opcional)
                </label>
                <textarea id="cancellationReason" placeholder="Ej: Solicitud del usuario..."
                    style="width: 100%; padding: 12px; background: #2a2a2a; border: 1px solid #444; 
                           border-radius: 8px; color: white; min-height: 100px; font-family: inherit;">
                </textarea>
            </div>
            
            <div style="display: flex; gap: 15px;">
                <button onclick="this.closest('.cancel-subscription-modal').remove()"
                    style="flex: 1; padding: 12px; background: #666; color: white; border: none; 
                           border-radius: 8px; cursor: pointer; font-weight: 600;">
                    <i class="fas fa-times"></i> Cancelar
                </button>
                <button onclick="confirmCancelSubscription('${userId}', '${platform}')"
                    style="flex: 1; padding: 12px; background: #dc3545; color: white; border: none; 
                           border-radius: 8px; cursor: pointer; font-weight: 600;">
                    <i class="fas fa-ban"></i> Confirmar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}



async function confirmCancelSubscription(userId, platform) {
    const reason = document.getElementById('cancellationReason').value.trim() || 'Sin motivo';
    
    const modal = document.querySelector('.cancel-subscription-modal');
    if (modal) modal.remove();
    
    showLoading(true);
    
    try {
        // Usar SubscriptionManager para cancelar
        const result = await SubscriptionManager.cancelSubscription(
            userId,
            platform,
            currentUser.email,
            reason
        );
        
        if (result.success) {
            showNotification(`Suscripción ${platform.toUpperCase()} cancelada`, 'success');
            loadUsers(); // Recargar lista de usuarios
        } else {
            showNotification(`Error: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cancelar: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}