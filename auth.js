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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Variables globales
let currentUser = null;
let isProcessing = false;
let redirectUrl = 'ps5.html'; // URL por defecto

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    initializeAuthApp();
});

function initializeAuthApp() {
    setupTabNavigation();
    setupAuthForms();
    setupPasswordValidation();
    checkAuthState();
    addAuthStyles();
    detectRedirectUrl(); // Nueva función para detectar la URL de redirección
}

// NUEVA FUNCIÓN: Detectar la URL de redirección basada en el referrer
function detectRedirectUrl() {
    // Obtener la URL de referencia (desde donde vino el usuario)
    const referrer = document.referrer;
    
    // Si hay un parámetro 'redirect' en la URL, usarlo
    const urlParams = new URLSearchParams(window.location.search);
    const redirectParam = urlParams.get('redirect');
    
    if (redirectParam) {
        redirectUrl = redirectParam;
        console.log('Redirección desde parámetro URL:', redirectUrl);
    } else if (referrer) {
        // Extraer el nombre del archivo desde el referrer
        const referrerFileName = referrer.split('/').pop().split('?')[0];
        
        // Mapear archivos conocidos
        const platformPages = ['ps5.html', 'xbox.html', 'nintendo.html'];
        
        if (platformPages.includes(referrerFileName)) {
            redirectUrl = referrerFileName;
            console.log('Redirección detectada desde referrer:', redirectUrl);
        } else {
            // Si viene de index.html o cualquier otra página, ir a PS5 por defecto
            redirectUrl = 'ps5.html';
            console.log('Redirección por defecto:', redirectUrl);
        }
    } else {
        // Si no hay referrer, usar localStorage como backup
        const savedPlatform = localStorage.getItem('lastPlatform');
        if (savedPlatform && ['ps5.html', 'xbox.html', 'nintendo.html'].includes(savedPlatform)) {
            redirectUrl = savedPlatform;
            console.log('Redirección desde localStorage:', redirectUrl);
        }
    }
    
    // Mostrar información de debug en la interfaz (opcional)
    updateRedirectInfo();
}

// NUEVA FUNCIÓN: Mostrar información de redirección (opcional para debug)
function updateRedirectInfo() {
    // Solo mostrar si hay un elemento debug en el HTML
    const debugElement = document.getElementById('redirectInfo');
    if (debugElement) {
        const platformName = redirectUrl.replace('.html', '').toUpperCase();
        debugElement.innerHTML = `
            <small style="color: #666;">
                <i class="fas fa-info-circle"></i> 
                Serás redirigido a ${platformName} después del login
            </small>
        `;
    }
}

// NUEVA FUNCIÓN: Guardar la plataforma en localStorage para uso futuro
function savePlatformPreference(platform) {
    localStorage.setItem('lastPlatform', platform);
}

// Navegación entre pestañas
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const authForms = document.querySelectorAll('.auth-form');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (isProcessing) return; // Prevenir cambios durante procesamiento
            
            const tab = this.getAttribute('data-tab');
            
            // Actualizar botones activos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Mostrar formulario activo
            authForms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${tab}Form`) {
                    form.classList.add('active');
                }
            });
            
            // Limpiar mensajes de error
            clearFormErrors();
            hideMessage();
        });
    });
}

// Configurar formularios de autenticación
function setupAuthForms() {
    // Formulario de inicio de sesión
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (isProcessing) return;
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        if (validateLoginForm(email, password)) {
            loginUser(email, password);
        }
    });
    
    // Formulario de registro
    const registerForm = document.getElementById('registerForm');
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (isProcessing) return;
        
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const acceptTerms = document.getElementById('acceptTerms').checked;
        
        if (validateRegisterForm(name, email, password, confirmPassword, acceptTerms)) {
            registerUser(name, email, password);
        }
    });
    
    // Olvidé mi contraseña
    const forgotPassword = document.getElementById('forgotPassword');
    forgotPassword.addEventListener('click', function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        
        if (!email) {
            showFieldError('loginEmailError', 'Ingresa tu correo electrónico primero');
            document.getElementById('loginEmail').focus();
            return;
        }
        
        if (!validateEmail(email)) {
            showFieldError('loginEmailError', 'Correo electrónico no válido');
            return;
        }
        
        resetPassword(email);
    });
}

// Configurar validación de contraseña en tiempo real
function setupPasswordValidation() {
    const passwordInput = document.getElementById('registerPassword');
    const confirmInput = document.getElementById('confirmPassword');
    
    passwordInput.addEventListener('input', function() {
        checkPasswordStrength(this.value);
        if (confirmInput.value) {
            validatePasswordMatch();
        }
    });
    
    confirmInput.addEventListener('input', validatePasswordMatch);
}

// Validación de formulario de login
function validateLoginForm(email, password) {
    let isValid = true;
    clearFormErrors();
    
    if (!email) {
        showFieldError('loginEmailError', 'El correo electrónico es requerido');
        isValid = false;
    } else if (!validateEmail(email)) {
        showFieldError('loginEmailError', 'Formato de correo electrónico inválido');
        isValid = false;
    }
    
    if (!password) {
        showFieldError('loginPasswordError', 'La contraseña es requerida');
        isValid = false;
    }
    
    return isValid;
}

// Validación de formulario de registro
function validateRegisterForm(name, email, password, confirmPassword, acceptTerms) {
    let isValid = true;
    clearFormErrors();
    
    if (!name || name.length < 2) {
        showFieldError('registerNameError', 'El nombre debe tener al menos 2 caracteres');
        isValid = false;
    }
    
    if (!email) {
        showFieldError('registerEmailError', 'El correo electrónico es requerido');
        isValid = false;
    } else if (!validateEmail(email)) {
        showFieldError('registerEmailError', 'Formato de correo electrónico inválido');
        isValid = false;
    }
    
    if (!password) {
        showFieldError('registerPasswordError', 'La contraseña es requerida');
        isValid = false;
    } else if (password.length < 6) {
        showFieldError('registerPasswordError', 'La contraseña debe tener al menos 6 caracteres');
        isValid = false;
    }
    
    if (password !== confirmPassword) {
        showFieldError('confirmPasswordError', 'Las contraseñas no coinciden');
        isValid = false;
    }
    
    if (!acceptTerms) {
        showMessage('Debes aceptar los términos y condiciones', 'error');
        isValid = false;
    }
    
    return isValid;
}

// Validar formato de email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Verificar fortaleza de contraseña
function checkPasswordStrength(password) {
    const strengthBar = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    if (!password) {
        strengthBar.style.width = '0%';
        strengthBar.className = 'strength-fill';
        strengthText.textContent = 'Escribe una contraseña';
        return;
    }
    
    let strength = 0;
    let feedback = [];
    
    // Longitud
    if (password.length >= 6) strength += 20;
    if (password.length >= 8) strength += 10;
    
    // Mayúsculas
    if (/[A-Z]/.test(password)) {
        strength += 20;
    } else {
        feedback.push('mayúsculas');
    }
    
    // Minúsculas
    if (/[a-z]/.test(password)) {
        strength += 20;
    } else {
        feedback.push('minúsculas');
    }
    
    // Números
    if (/\d/.test(password)) {
        strength += 15;
    } else {
        feedback.push('números');
    }
    
    // Símbolos
    if (/[^A-Za-z0-9]/.test(password)) {
        strength += 15;
    } else {
        feedback.push('símbolos');
    }
    
    // Actualizar barra visual
    strengthBar.style.width = strength + '%';
    
    if (strength < 40) {
        strengthBar.className = 'strength-fill weak';
        strengthText.textContent = 'Débil - Añade ' + feedback.slice(0, 2).join(', ');
    } else if (strength < 70) {
        strengthBar.className = 'strength-fill medium';
        strengthText.textContent = 'Media - Añade ' + feedback.slice(0, 1).join(', ');
    } else {
        strengthBar.className = 'strength-fill strong';
        strengthText.textContent = 'Fuerte - ¡Excelente!';
    }
}

// Validar coincidencia de contraseñas
function validatePasswordMatch() {
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (confirmPassword && password !== confirmPassword) {
        showFieldError('confirmPasswordError', 'Las contraseñas no coinciden');
        return false;
    } else {
        clearFieldError('confirmPasswordError');
        return true;
    }
}

// Función para mostrar/ocultar contraseña
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggleBtn = input.nextElementSibling;
    const icon = toggleBtn.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Función para iniciar sesión - MODIFICADA CON REDIRECCIÓN INTELIGENTE
function loginUser(email, password) {
    setProcessingState(true);
    showMessage('Iniciando sesión...', 'info');
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // VERIFICAR SI EL USUARIO ESTÁ BLOQUEADO
            return db.collection('users').doc(user.uid).get()
                .then(doc => {
                    if (doc.exists && doc.data().blocked === true) {
                        // Usuario bloqueado
                        auth.signOut();
                        throw new Error('BLOCKED_ACCOUNT');
                    }
                    
                    // Usuario no bloqueado, actualizar información en Firestore
                    return db.collection('users').doc(user.uid).update({
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });
        })
        .then(() => {
            // Guardar preferencia de plataforma
            savePlatformPreference(redirectUrl);
            
            const platformName = redirectUrl.replace('.html', '').toUpperCase();
            showMessage(`¡Sesión iniciada correctamente! Redirigiendo a ${platformName}...`, 'success');
            
            // Redirigir a la URL detectada
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1500);
        })
        .catch((error) => {
            if (error.message === 'BLOCKED_ACCOUNT') {
                showBlockedMessage();
            } else {
                handleAuthError(error, 'login');
            }
        })
        .finally(() => {
            setProcessingState(false);
        });
}

// Función para registrar usuario - MODIFICADA CON REDIRECCIÓN INTELIGENTE
function registerUser(name, email, password) {
    setProcessingState(true);
    showMessage('Creando cuenta...', 'info');
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Guardar información adicional del usuario en Firestore
            return db.collection('users').doc(user.uid).set({
    uid: user.uid,
    name: name,
    email: email,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
    cart: [],
    wishlist: [],
    blocked: false,
    
    // ✅ CAMBIOS PARA SISTEMA DE SUSCRIPCIONES
    subscription: 'none',                      // ANTES: 'Essential' - AHORA: 'none'
    subscriptionStartDate: null,               // ANTES: serverTimestamp() - AHORA: null
    subscriptionRequestStatus: null,           // NUEVO: estado de solicitud
    subscriptionRequestedPlan: null,           // NUEVO: plan solicitado
    subscriptionRequestDate: null,             // NUEVO: fecha de solicitud
    
    preferences: {
        newsletter: true,
        notifications: true
    }
});
        })
.then(() => {
    // ENVIAR CORREO DE BIENVENIDA CON EMAILJS
    emailjs.send("service_qoef42n", "template_mvcp32c", {
        name: name,
        email: email
    })
    .then(() => {
        console.log("Correo de bienvenida enviado correctamente ✔");
    })
    .catch((error) => {
        console.error("Error al enviar correo con EmailJS:", error);
    });

    // Enviar verificación de email de Firebase
    return auth.currentUser.sendEmailVerification();
})

        .then(() => {
            // Guardar preferencia de plataforma
            savePlatformPreference(redirectUrl);
            
            const platformName = redirectUrl.replace('.html', '').toUpperCase();
            showMessage(`¡Cuenta creada correctamente! Se ha enviado un email de verificación. Redirigiendo a ${platformName}...`, 'success');
            
            // Redirigir a la URL detectada
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1500);
        })
        .catch((error) => {
            handleAuthError(error, 'register');
            
            // Si hay error, eliminar el usuario de Authentication
            if (auth.currentUser) {
                auth.currentUser.delete().catch(deleteError => {
                    console.error('Error deleting user:', deleteError);
                });
            }
        })
        .finally(() => {
            setProcessingState(false);
        });
}

// Función para verificar si un usuario ya existe en Firestore
async function checkUserExists(uid) {
    try {
        const doc = await db.collection('users').doc(uid).get();
        return doc.exists;
    } catch (error) {
        console.error('Error checking user existence:', error);
        return false;
    }
}

// Función para restablecer contraseña
function resetPassword(email) {
    showMessage('Enviando correo de recuperación...', 'info');
    
    auth.sendPasswordResetEmail(email)
        .then(() => {
            showMessage('Se ha enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.', 'success');
        })
        .catch((error) => {
            if (error.code === 'auth/user-not-found') {
                showFieldError('loginEmailError', 'No existe una cuenta con este correo electrónico');
            } else {
                showMessage('Error al enviar el correo de restablecimiento', 'error');
            }
        });
}

// Manejo de errores de autenticación - VERSIÓN MEJORADA
function handleAuthError(error, context) {
    console.error('Auth error:', error);
    
    const errorMessages = {
        'auth/user-not-found': 'No existe una cuenta con este correo electrónico',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/invalid-email': 'Correo electrónico no válido',
        'auth/email-already-in-use': 'Este correo electrónico ya está en uso',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
        'auth/too-many-requests': 'Demasiados intentos. Inténtalo más tarde',
        'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
        'auth/operation-not-allowed': 'Operación no permitida. Contacta al administrador'
    };
    
    const message = errorMessages[error.code] || `Error: ${error.message}`;
    
    if (context === 'login') {
        if (error.code === 'auth/user-not-found') {
            showFieldError('loginEmailError', message);
        } else if (error.code === 'auth/wrong-password') {
            showFieldError('loginPasswordError', message);
        } else {
            showMessage(message, 'error');
        }
    } else {
        if (error.code === 'auth/email-already-in-use') {
            showFieldError('registerEmailError', message);
        } else if (error.code === 'auth/weak-password') {
            showFieldError('registerPasswordError', message);
        } else {
            showMessage(message, 'error');
        }
    }
}

// Función para sincronizar Authentication con Firestore
async function syncUserWithFirestore(user) {
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            // Si no existe en Firestore, crearlo
            await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    email: user.email,
    name: user.displayName || user.email.split('@')[0],
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
    cart: [],
    wishlist: [],
    blocked: false,
    subscription: 'none', // Usuario nuevo sin suscripción
    subscriptionStartDate: null, // No hay fecha porque no tiene suscripción // ✅ NUEVO
    preferences: {
        newsletter: true,
        notifications: true
    }
});
        } else {
            // Actualizar última conexión
            await db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error syncing user with Firestore:', error);
    }
}

// Autenticación con redes sociales (simulado)
function signInWithGoogle() {
    showMessage('Autenticación con Google en desarrollo', 'info');
}

function signInWithFacebook() {
    showMessage('Autenticación con Facebook en desarrollo', 'info');
}

// Verificar estado de autenticación - MODIFICADA CON REDIRECCIÓN INTELIGENTE
function checkAuthState() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // VERIFICAR SI EL USUARIO ESTÁ BLOQUEADO
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                
                if (userDoc.exists && userDoc.data().blocked === true) {
                    // Usuario bloqueado - cerrar sesión inmediatamente
                    await auth.signOut();
                    showBlockedMessage();
                    return;
                }
                
                // Usuario no bloqueado, continuar con el flujo normal
                currentUser = user;
                
                // Sincronizar usuario con Firestore
                await syncUserWithFirestore(user);
                
                // Si ya está logueado y está en auth.html, redirigir usando la URL detectada
                if (window.location.pathname.includes('auth.html')) {
                    // Usar la URL de redirección detectada o la preferencia guardada
                    const savedPlatform = localStorage.getItem('lastPlatform');
                    if (savedPlatform && ['ps5.html', 'xbox.html', 'nintendo.html'].includes(savedPlatform)) {
                        redirectUrl = savedPlatform;
                    }
                    
                    setTimeout(() => {
                        window.location.href = redirectUrl;
                    }, 1000);
                }
            } catch (error) {
                console.error('Error verificando estado del usuario:', error);
                // En caso de error, permitir acceso pero registrar el error
                currentUser = user;
            }
        } else {
            currentUser = null;
        }
    });
}

// Función para mostrar mensaje de cuenta bloqueada
function showBlockedMessage() {
    // Crear overlay de bloqueo
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const message = document.createElement('div');
    message.style.cssText = `
        background: #1a1a1a;
        padding: 40px;
        border-radius: 10px;
        text-align: center;
        max-width: 400px;
        border: 2px solid #dc3545;
    `;
    
    message.innerHTML = `
        <div style="color: #dc3545; font-size: 48px; margin-bottom: 20px;">
            <i class="fas fa-ban"></i>
        </div>
        <h2 style="color: #fff; margin-bottom: 15px;">Cuenta Bloqueada</h2>
        <p style="color: #ccc; margin-bottom: 20px;">
            Tu cuenta ha sido bloqueada temporalmente. 
            Por favor, contacta con soporte para más información.
        </p>
        <p style="color: #888; font-size: 14px;">
            Email de soporte: soporte@playstation.com
        </p>
        <div style="margin-top: 20px;">
            <button onclick="window.location.href='${redirectUrl}'" 
                    style="background: #dc3545; color: white; border: none; 
                           padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                Volver al inicio
            </button>
        </div>
    `;
    
    overlay.appendChild(message);
    document.body.appendChild(overlay);
}

// Estado de procesamiento
function setProcessingState(processing) {
    isProcessing = processing;
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    if (processing) {
        loginBtn.disabled = true;
        registerBtn.disabled = true;
        loginBtn.querySelector('.btn-loader').style.display = 'inline-block';
        registerBtn.querySelector('.btn-loader').style.display = 'inline-block';
        loginBtn.querySelector('span').style.display = 'none';
        registerBtn.querySelector('span').style.display = 'none';
        loadingOverlay.style.display = 'flex';
    } else {
        loginBtn.disabled = false;
        registerBtn.disabled = false;
        loginBtn.querySelector('.btn-loader').style.display = 'none';
        registerBtn.querySelector('.btn-loader').style.display = 'none';
        loginBtn.querySelector('span').style.display = 'inline';
        registerBtn.querySelector('span').style.display = 'inline';
        loadingOverlay.style.display = 'none';
    }
}

// Mostrar mensajes de estado
function showMessage(message, type) {
    const messageElement = document.getElementById('authMessage');
    messageElement.textContent = message;
    messageElement.className = `auth-message ${type} show`;
    
    // Auto-ocultar mensaje después de 5 segundos para mensajes de info
    if (type === 'info') {
        setTimeout(() => {
            hideMessage();
        }, 5000);
    }
}

function hideMessage() {
    const messageElement = document.getElementById('authMessage');
    messageElement.classList.remove('show');
}

// Mostrar errores en campos específicos
function showFieldError(fieldErrorId, message) {
    const errorElement = document.getElementById(fieldErrorId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function clearFieldError(fieldErrorId) {
    const errorElement = document.getElementById(fieldErrorId);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}

function clearFormErrors() {
    const errorElements = document.querySelectorAll('.form-error');
    errorElements.forEach(element => {
        element.textContent = '';
        element.style.display = 'none';
    });
}

// Añadir estilos CSS
function addAuthStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .form-error {
            color: #ff4757;
            font-size: 12px;
            margin-top: 5px;
            display: none;
        }
        
        .password-input {
            position: relative;
            display: flex;
            align-items: center;
        }
        
        .password-toggle {
            position: absolute;
            right: 12px;
            background: none;
            border: none;
            color: #666;
            cursor: pointer;
            padding: 5px;
            transition: color 0.3s;
        }
        
        .password-toggle:hover {
            color: #0070f3;
        }
        
        .password-strength {
            margin-top: 8px;
        }
        
        .strength-bar {
            height: 4px;
            background: #333;
            border-radius: 2px;
            overflow: hidden;
            margin-bottom: 5px;
        }
        
        .strength-fill {
            height: 100%;
            transition: width 0.3s, background 0.3s;
            border-radius: 2px;
        }
        
        .strength-fill.weak { background: #ff4757; }
        .strength-fill.medium { background: #ffa502; }
        .strength-fill.strong { background: #2ed573; }
        
        .strength-text {
            font-size: 12px;
            color: #666;
        }
        
        .checkbox-label {
            display: flex;
            align-items: center;
            cursor: pointer;
            font-size: 14px;
        }
        
        .checkbox-label input[type="checkbox"] {
            margin-right: 8px;
        }
        
        .social-auth {
            display: flex;
            gap: 15px;
            margin: 20px 0;
        }
        
        .social-btn {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.3s;
        }
        
        .google-btn {
            background: #db4437;
            color: white;
        }
        
        .google-btn:hover {
            background: #c23321;
            transform: translateY(-2px);
        }
        
        .facebook-btn {
            background: #3b5998;
            color: white;
        }
        
        .facebook-btn:hover {
            background: #2d4373;
            transform: translateY(-2px);
        }
        
        .auth-divider {
            text-align: center;
            margin: 25px 0;
            position: relative;
            color: #666;
        }
        
        .auth-divider::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 1px;
            background: #333;
        }
        
        .auth-divider span {
            background: #1a1a1a;
            padding: 0 15px;
            font-size: 14px;
        }
        
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }
        
        .loading-spinner {
            text-align: center;
            color: white;
        }
        
        .loading-spinner i {
            font-size: 24px;
            margin-bottom: 10px;
        }
        
        .btn-loader {
            margin-left: 8px;
        }
        
        .auth-message.show {
            display: block;
            opacity: 1;
            transform: translateY(0);
        }
        
        .back-to-store {
            margin-top: 15px;
            text-align: center;
        }
        
        .back-link {
            color: #0070f3;
            text-decoration: none;
            font-size: 14px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: color 0.3s;
        }
        
        .back-link:hover {
            color: #0056b3;
        }
        
        .terms-link {
            color: #0070f3;
            text-decoration: none;
        }
        
        .terms-link:hover {
            text-decoration: underline;
        }
        
        .help-link {
            color: #0070f3;
            text-decoration: none;
        }
        
        .help-link:hover {
            text-decoration: underline;
        }
        
        /* Nuevo estilo para información de redirección */
        .redirect-info {
            background: rgba(0, 112, 243, 0.1);
            border: 1px solid rgba(0, 112, 243, 0.3);
            border-radius: 8px;
            padding: 12px;
            margin: 15px 0;
            text-align: center;
        }
        
        .redirect-info i {
            color: #0070f3;
            margin-right: 8px;
        }
    `;
    document.head.appendChild(style);
}

// FUNCIONES ADICIONALES PARA MEJORAR LA EXPERIENCIA DE USUARIO

// Función para obtener el nombre de la plataforma de forma legible
function getPlatformDisplayName(platform) {
    const platformNames = {
        'ps5.html': 'PlayStation 5',
        'xbox.html': 'Xbox',
        'nintendo.html': 'Nintendo Switch'
    };
    
    return platformNames[platform] || 'PlayStation 5';
}

// Función para actualizar todos los elementos que muestran la plataforma de destino
function updatePlatformReferences() {
    const platformName = getPlatformDisplayName(redirectUrl);
    
    // Actualizar mensaje de bienvenida si existe
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
        welcomeMessage.innerHTML = `¡Bienvenido a la tienda de ${platformName}!`;
    }
    
    // Actualizar título de la página si es necesario
    if (document.title.includes('Autenticación')) {
        document.title = `Iniciar Sesión - ${platformName} Store`;
    }
}

// Función para crear un enlace de regreso dinámico
function createBackLink() {
    const backLinkContainer = document.getElementById('backToStore');
    if (backLinkContainer) {
        const platformName = getPlatformDisplayName(redirectUrl);
        backLinkContainer.innerHTML = `
            <a href="${redirectUrl}" class="back-link">
                <i class="fas fa-arrow-left"></i>
                Volver a ${platformName}
            </a>
        `;
    }
}

// Función mejorada para la detección de URL con múltiples métodos
function detectRedirectUrl() {
    console.log('=== DETECTANDO URL DE REDIRECCIÓN ===');
    
    // Método 1: Parámetro URL directo
    const urlParams = new URLSearchParams(window.location.search);
    const redirectParam = urlParams.get('redirect');
    
    if (redirectParam && ['ps5.html', 'xbox.html', 'nintendo.html'].includes(redirectParam)) {
        redirectUrl = redirectParam;
        console.log('✅ Método 1 - Parámetro URL:', redirectUrl);
        updatePlatformReferences();
        createBackLink();
        updateRedirectInfo();
        return;
    }
    
    // Método 2: Referrer HTTP
    const referrer = document.referrer;
    if (referrer) {
        const referrerFileName = referrer.split('/').pop().split('?')[0];
        console.log('🔍 Referrer detectado:', referrerFileName);
        
        if (['ps5.html', 'xbox.html', 'nintendo.html'].includes(referrerFileName)) {
            redirectUrl = referrerFileName;
            console.log('✅ Método 2 - Referrer:', redirectUrl);
            updatePlatformReferences();
            createBackLink();
            updateRedirectInfo();
            return;
        }
    }
    
    // Método 3: LocalStorage (preferencia guardada)
    const savedPlatform = localStorage.getItem('lastPlatform');
    if (savedPlatform && ['ps5.html', 'xbox.html', 'nintendo.html'].includes(savedPlatform)) {
        redirectUrl = savedPlatform;
        console.log('✅ Método 3 - LocalStorage:', redirectUrl);
        updatePlatformReferences();
        createBackLink();
        updateRedirectInfo();
        return;
    }
    
    // Método 4: Detección por SessionStorage (si las páginas de plataforma lo establecen)
    const sessionPlatform = sessionStorage.getItem('currentPlatform');
    if (sessionPlatform && ['ps5.html', 'xbox.html', 'nintendo.html'].includes(sessionPlatform)) {
        redirectUrl = sessionPlatform;
        console.log('✅ Método 4 - SessionStorage:', redirectUrl);
        updatePlatformReferences();
        createBackLink();
        updateRedirectInfo();
        return;
    }
    
    // Por defecto: PS5
    redirectUrl = 'ps5.html';
    console.log('⚠️ Usando valor por defecto:', redirectUrl);
    updatePlatformReferences();
    createBackLink();
    updateRedirectInfo();
}