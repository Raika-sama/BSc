// src/routes/yearTransitionRoutes.js
const express = require('express');
const yearTransitionController = require('../controllers/yearTransitionController');
const logger = require('../utils/errors/logger/logger');

/**
 * Crea il router per la transizione tra anni accademici
 * @param {Object} options - Opzioni di configurazione
 * @param {Object} options.authMiddleware - Middleware di autenticazione
 * @returns {Router} Express router configurato
 */
const createYearTransitionRouter = ({ authMiddleware }) => {
  if (!authMiddleware) throw new Error('AuthMiddleware is required');

  const router = express.Router({ mergeParams: true }); // mergeParams per accedere ai parametri del router principale
  const { protect, restrictTo } = authMiddleware;

  /**
   * Utility per gestire le funzioni asincrone e catturare errori
   * @param {Function} fn - Funzione asincrona da gestire
   * @returns {Function} Middleware Express che gestisce gli errori delle Promise
   */
  const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      logger.error('Year Transition Route Error:', {
        error: error.message,
        path: req.path,
        method: req.method,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });
      next(error);
    });
  };

  // Middleware di logging per tutte le richieste
  router.use((req, res, next) => {
    logger.debug('Year Transition Route Called:', {
      method: req.method,
      path: req.path,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });
    next();
  });

  // Protezione globale - richiede autenticazione
  router.use(protect);

  /**
   * @route GET /api/schools/:schoolId/transition-preview
   * @desc Ottiene l'anteprima della transizione tra anni accademici
   * @access Private - Admin e manager della scuola
   */
  router.get(
    '/transition-preview',
    restrictTo('admin', 'manager'),
    asyncHandler(yearTransitionController.getTransitionPreview)
  );

  /**
   * @route POST /api/schools/:schoolId/year-transition
   * @desc Esegue la transizione tra anni accademici
   * @access Private - Solo admin e manager della scuola
   */
  router.post(
    '/year-transition',
    restrictTo('admin', 'manager'),
    asyncHandler(yearTransitionController.executeYearTransition)
  );

  return router;
};

module.exports = createYearTransitionRouter;