// ============================================
// SUBSCRIPTION MANAGER - MULTI-PLATAFORMA
// Archivo: subscription-manager.js
// ============================================

const SubscriptionManager = (function() {
  'use strict';
  
  // ==========================================
  // CONFIGURACIÓN DE PLATAFORMAS
  // ==========================================
  
  const PLATFORMS = {
    ps5: {
      name: "PlayStation",
      plans: {
        Essential: { 
          price: 9.99, 
          discount: 0.05, 
          displayName: "PS Plus Essential",
          description: "Juegos mensuales y multijugador online"
        },
        Extra: { 
          price: 14.99, 
          discount: 0.15, 
          displayName: "PS Plus Extra",
          description: "+400 juegos del catálogo"
        },
        Premium: { 
          price: 17.99, 
          discount: 0.25, 
          displayName: "PS Plus Premium",
          description: "+740 juegos y clásicos"
        }
      },
      colors: {
        primary: "#0070f3",
        secondary: "#0056b3",
        badge: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        essential: "#667eea",
        extra: "#f5576c",
        premium: "#00f2fe"
      }
    },
    xbox: {
      name: "Xbox",
      plans: {
        Console: { 
          price: 9.99, 
          discount: 0.05, 
          displayName: "Game Pass Console",
          description: "Juega en tu Xbox"
        },
        PC: { 
          price: 9.99, 
          discount: 0.10, 
          displayName: "Game Pass PC",
          description: "Juega en tu computadora"
        },
        Ultimate: { 
          price: 14.99, 
          discount: 0.20, 
          displayName: "Game Pass Ultimate",
          description: "Consola, PC y nube"
        }
      },
      colors: {
        primary: "#00ff41",
        secondary: "#00cc33",
        badge: "linear-gradient(135deg, #107c10 0%, #0e5e0e 100%)",
        console: "#107c10",
        pc: "#00cc33",
        ultimate: "#00ff41"
      }
    }
  };
  
  // ==========================================
  // MÉTODOS PÚBLICOS
  // ==========================================
  
  /**
   * Obtiene la suscripción activa de un usuario para una plataforma
   */
  function getUserSubscription(userData, platform) {
    if (!userData || !userData.subscriptions || !userData.subscriptions[platform]) {
      return { 
        plan: "none", 
        status: "inactive",
        startDate: null 
      };
    }
    return userData.subscriptions[platform];
  }
  
  /**
   * Obtiene el estado de solicitud de suscripción
   */
  function getSubscriptionRequest(userData, platform) {
    if (!userData || !userData.subscriptionRequests || !userData.subscriptionRequests[platform]) {
      return { 
        requestedPlan: null, 
        requestStatus: null,
        requestType: null 
      };
    }
    return userData.subscriptionRequests[platform];
  }
  
  /**
   * Calcula el descuento para una plataforma y plan
   */
  function calculateDiscount(platform, plan, originalPrice) {
    const platformData = PLATFORMS[platform];
    if (!platformData || !platformData.plans[plan]) {
      return {
        original: originalPrice,
        discount: 0,
        final: originalPrice,
        discountPercentage: 0
      };
    }
    
    const discountRate = platformData.plans[plan].discount;
    const discountAmount = originalPrice * discountRate;
    const finalPrice = originalPrice - discountAmount;
    
    return {
      original: originalPrice,
      discount: discountAmount,
      final: finalPrice,
      discountPercentage: Math.round(discountRate * 100),
      plan: plan,
      planName: platformData.plans[plan].displayName
    };
  }
  
  /**
   * Verifica si un usuario tiene suscripción activa en una plataforma
   */
  function hasActiveSubscription(userData, platform) {
    const subscription = getUserSubscription(userData, platform);
    return subscription.status === "active" && subscription.plan !== "none";
  }
  
  /**
   * Obtiene información de un plan específico
   */
  function getPlanInfo(platform, planName) {
    const platformData = PLATFORMS[platform];
    if (!platformData || !platformData.plans[planName]) {
      return null;
    }
    
    return {
      ...platformData.plans[planName],
      name: planName,
      platform: platform,
      platformName: platformData.name,
      color: platformData.colors[planName.toLowerCase()] || platformData.colors.primary
    };
  }
  
  /**
   * Obtiene todos los planes disponibles de una plataforma
   */
  function getAllPlans(platform) {
    const platformData = PLATFORMS[platform];
    if (!platformData) return [];
    
    return Object.keys(platformData.plans).map(planName => 
      getPlanInfo(platform, planName)
    );
  }
  
  /**
   * Obtiene los colores de una plataforma
   */
  function getPlatformColors(platform) {
    return PLATFORMS[platform]?.colors || {
      primary: "#666",
      secondary: "#444",
      badge: "linear-gradient(135deg, #666 0%, #333 100%)"
    };
  }
  
  /**
   * Crea una solicitud de suscripción en Firestore
   */
  async function createSubscriptionRequest(userId, userName, userEmail, platform, requestedPlan, cardData, type = "new") {
    try {
      const planInfo = getPlanInfo(platform, requestedPlan);
      if (!planInfo) {
        throw new Error("Plan no válido");
      }
      
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      const currentSub = getUserSubscription(userData, platform);
      
      // Crear solicitud en colección global
      const requestData = {
        userId: userId,
        userName: userName,
        userEmail: userEmail,
        platform: platform,
        requestedPlan: requestedPlan,
        currentPlan: currentSub.plan,
        planPrice: planInfo.price,
        type: type,
        status: "pending",
        cardLastFour: cardData.lastFour,
        cardName: cardData.name,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        processedAt: null,
        processedBy: null
      };
      
      await db.collection('subscriptionRequests').add(requestData);
      
      // Actualizar estado en usuario
      const updatePath = `subscriptionRequests.${platform}`;
      await db.collection('users').doc(userId).update({
        [updatePath]: {
          requestedPlan: requestedPlan,
          requestStatus: "pending",
          requestDate: firebase.firestore.FieldValue.serverTimestamp(),
          requestType: type
        }
      });
      
      return { success: true };
      
    } catch (error) {
      console.error('Error creating subscription request:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Aprueba una solicitud de suscripción (ADMIN)
   */
  async function approveSubscriptionRequest(requestId, adminEmail) {
    try {
      const requestDoc = await db.collection('subscriptionRequests').doc(requestId).get();
      if (!requestDoc.exists) {
        throw new Error("Solicitud no encontrada");
      }
      
      const request = requestDoc.data();
      
      // Actualizar solicitud
      await db.collection('subscriptionRequests').doc(requestId).update({
        status: "approved",
        processedAt: firebase.firestore.FieldValue.serverTimestamp(),
        processedBy: adminEmail
      });
      
      // Activar suscripción en usuario
      const updatePath = `subscriptions.${request.platform}`;
      await db.collection('users').doc(request.userId).update({
        [updatePath]: {
          plan: request.requestedPlan,
          status: "active",
          startDate: firebase.firestore.FieldValue.serverTimestamp(),
          cancelledAt: null,
          cancelledBy: null,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedBy: adminEmail
        },
        [`subscriptionRequests.${request.platform}.requestStatus`]: "approved"
      });
      
      // Crear notificación
      await db.collection('notifications').add({
        userId: request.userId,
        type: "subscription_approved",
        platform: request.platform,
        title: `¡Suscripción ${request.platform.toUpperCase()} Aprobada!`,
        message: `Tu ${getPlanInfo(request.platform, request.requestedPlan).displayName} está activa. ¡Disfruta tu descuento!`,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        read: false
      });
      
      return { success: true };
      
    } catch (error) {
      console.error('Error approving subscription:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Rechaza una solicitud de suscripción (ADMIN)
   */
  async function rejectSubscriptionRequest(requestId, adminEmail, reason) {
    try {
      const requestDoc = await db.collection('subscriptionRequests').doc(requestId).get();
      if (!requestDoc.exists) {
        throw new Error("Solicitud no encontrada");
      }
      
      const request = requestDoc.data();
      
      // Actualizar solicitud
      await db.collection('subscriptionRequests').doc(requestId).update({
        status: "rejected",
        processedAt: firebase.firestore.FieldValue.serverTimestamp(),
        processedBy: adminEmail,
        rejectionReason: reason || "Sin razón especificada"
      });
      
      // Actualizar estado en usuario
      await db.collection('users').doc(request.userId).update({
        [`subscriptionRequests.${request.platform}.requestStatus`]: "rejected"
      });
      
      // Crear notificación
      await db.collection('notifications').add({
        userId: request.userId,
        type: "subscription_rejected",
        platform: request.platform,
        title: `Solicitud ${request.platform.toUpperCase()} Rechazada`,
        message: `Tu solicitud de ${getPlanInfo(request.platform, request.requestedPlan).displayName} fue rechazada. ${reason || 'Contacta con soporte.'}`,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        read: false
      });
      
      return { success: true };
      
    } catch (error) {
      console.error('Error rejecting subscription:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Cancela una suscripción activa (ADMIN)
   */
  async function cancelSubscription(userId, platform, adminEmail, reason) {
    try {
      const updatePath = `subscriptions.${platform}`;
      
      await db.collection('users').doc(userId).update({
        [`${updatePath}.status`]: "cancelled",
        [`${updatePath}.plan`]: "none",
        [`${updatePath}.cancelledAt`]: firebase.firestore.FieldValue.serverTimestamp(),
        [`${updatePath}.cancelledBy`]: adminEmail,
        [`${updatePath}.cancellationReason`]: reason
      });
      
      // Crear notificación
      await db.collection('notifications').add({
        userId: userId,
        type: "subscription_cancelled",
        platform: platform,
        title: `Suscripción ${platform.toUpperCase()} Cancelada`,
        message: `Tu suscripción ${platform.toUpperCase()} ha sido cancelada. ${reason || ''}`,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        read: false
      });
      
      return { success: true };
      
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ==========================================
  // API PÚBLICA
  // ==========================================
  
  return {
    // Getters
    getUserSubscription,
    getSubscriptionRequest,
    hasActiveSubscription,
    getPlanInfo,
    getAllPlans,
    getPlatformColors,
    
    // Cálculos
    calculateDiscount,
    
    // Operaciones de usuario
    createSubscriptionRequest,
    
    // Operaciones de admin
    approveSubscriptionRequest,
    rejectSubscriptionRequest,
    cancelSubscription,
    
    // Constantes
    PLATFORMS
  };
  
})();

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SubscriptionManager;
}