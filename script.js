document.addEventListener('DOMContentLoaded', function() {
    // Configuración de partículas
    particlesJS('particles-js', {
        particles: {
            number: {
                value: 80,
                density: {
                    enable: true,
                    value_area: 800
                }
            },
            color: {
                value: "#ffffff"
            },
            shape: {
                type: "circle",
                stroke: {
                    width: 0,
                    color: "#000000"
                }
            },
            opacity: {
                value: 0.5,
                random: true,
                anim: {
                    enable: true,
                    speed: 1,
                    opacity_min: 0.1,
                    sync: false
                }
            },
            size: {
                value: 3,
                random: true
            },
            line_linked: {
                enable: true,
                distance: 150,
                color: "#ffffff",
                opacity: 0.4,
                width: 1
            },
            move: {
                enable: true,
                speed: 2,
                direction: "none",
                random: true,
                straight: false,
                out_mode: "out",
                bounce: false
            }
        },
        interactivity: {
            detect_on: "canvas",
            events: {
                onhover: {
                    enable: true,
                    mode: "grab"
                },
                onclick: {
                    enable: true,
                    mode: "push"
                },
                resize: true
            },
            modes: {
                grab: {
                    distance: 140,
                    line_linked: {
                        opacity: 1
                    }
                },
                push: {
                    particles_nb: 4
                }
            }
        },
        retina_detect: true
    });

    // ✅ Añadir event listeners para las tarjetas
    setupPlatformCards();
});

// ✅ Variable global para controlar el estado de clics
let isRedirecting = false;

// ✅ Función para configurar las tarjetas de plataforma
function setupPlatformCards() {
    const cards = document.querySelectorAll('.platform-card');
    
    cards.forEach(card => {
        // Efecto hover mejorado
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.05)';
            this.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
        });
        
        // Efecto de clic con sonido único y redirección
        card.addEventListener('click', function() {
            // ✅ Prevenir múltiples clics
            if (isRedirecting) {
                return;
            }
            
            // Obtener el ID del sonido y la página de destino
            const soundId = this.getAttribute('data-sound');
            const targetPage = this.getAttribute('data-page');
            
            // Reproducir sonido único al hacer clic
            playClickSound(soundId, targetPage);
            
            // Efecto visual al hacer clic
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });
}

// ✅ Función para reproducir sonido de clic específico y luego redirigir
function playClickSound(soundId, targetPage) {
    // ✅ Marcar que ya estamos procesando un clic
    isRedirecting = true;
    
    const clickSound = document.getElementById(soundId);
    if (clickSound) {
        // Reiniciar el sonido y reproducirlo
        clickSound.currentTime = 0;
        
        // ✅ Limpiar cualquier evento onended anterior
        clickSound.onended = null;
        
        // Reproducir el sonido
        const playPromise = clickSound.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                // Esperar a que el sonido termine de reproducirse antes de redirigir
                clickSound.onended = function() {
                    redirectToPlatform(targetPage);
                };
            }).catch(error => {
                // Si hay error al reproducir el sonido, redirigir inmediatamente
                console.log("Error al reproducir sonido:", error);
                redirectToPlatform(targetPage);
            });
        } else {
            // Para navegadores más antiguos que no devuelven Promise
            clickSound.onended = function() {
                redirectToPlatform(targetPage);
            };
        }
    } else {
        // Si no hay sonido, redirigir inmediatamente
        redirectToPlatform(targetPage);
    }
}

// ✅ Función para redirigir a la página de la plataforma
function redirectToPlatform(page) {
    // ✅ Prevenir redirección múltiple
    if (isRedirecting) {
        // Efecto de transición antes de redirigir
        document.body.style.opacity = '0.7';
        document.body.style.transition = 'opacity 0.3s ease';
        
        setTimeout(() => {
            window.location.href = page;
        }, 300);
    }
}

// ✅ Opcional: Resetear el estado si el usuario permanece en la página
// (útil si hay errores en la redirección)
window.addEventListener('beforeunload', function() {
    isRedirecting = false;
});