// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const controllers = require('../controllers');
const { protect } = require('../middleware/authMiddleware');

// Verifica che il controller sia definito
console.log('Controllers:', controllers);
console.log('User Controller:', controllers.user);

// Rotte pubbliche
router.post('/login', controllers.user.login.bind(controllers.user));
router.post('/register', controllers.user.register.bind(controllers.user));
router.post('/forgot-password', controllers.user.forgotPassword.bind(controllers.user));

// Rotte protette
router.use(protect);
router.get('/me', controllers.user.getById.bind(controllers.user));
router.put('/me', controllers.user.update.bind(controllers.user));
router.put('/update-password', controllers.user.forgotPassword.bind(controllers.user));

module.exports = router;