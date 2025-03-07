/**
 * @file testSystemRoutes.js
 * @description Rotte per il sistema di test
 */

const express = require('express');

/**
 * Crea e configura il router per i test di sistema
 * @param {Object} options - Opzioni di configurazione
 * @param {Object} options.authMiddleware - Middleware di autenticazione
 * @param {Object} options.testSystemController - Controller per la gestione dei test di sistema
 * @returns {express.Router} Router configurato
 */
const createTestSystemRouter = ({ authMiddleware, testSystemController }) => {
    if (!authMiddleware) throw new Error('AuthMiddleware is required');
    if (!testSystemController) throw new Error('TestSystemController is required');
    
    const router = express.Router();
    
    // Estrai i middleware di autenticazione necessari
    const { protect, restrictTo } = authMiddleware;
    
    // Middleware per verificare che l'utente abbia i ruoli necessari
    // Modifica: utilizziamo ruoli validi (admin, developer) invece di permessi
    const checkSystemPermissions = [
        protect,
        restrictTo('admin', 'developer') // Solo admin e developer possono visualizzare
    ];

    const checkSystemWritePermissions = [
        protect,
        restrictTo('admin', 'developer') // Solo admin e developer possono eseguire
    ];

    // Rotte per i test unitari
    router.get('/unit', checkSystemPermissions, testSystemController.getUnitTests);
    router.post('/unit/run', checkSystemWritePermissions, testSystemController.runUnitTests);

    // Rotte per i test di integrazione
    router.get('/integration', checkSystemPermissions, testSystemController.getIntegrationTests);
    router.post('/integration/run', checkSystemWritePermissions, testSystemController.runIntegrationTests);

    // Rotta per eseguire tutti i test
    router.post('/run-all', checkSystemWritePermissions, testSystemController.runAllTests);

    // Rotta per ottenere lo storico dei test
    router.get('/history', checkSystemPermissions, testSystemController.getTestHistory);

    return router;
};

module.exports = createTestSystemRouter;