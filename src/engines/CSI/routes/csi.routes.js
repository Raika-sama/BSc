// src/engines/CSI/routes/csi.routes.js
const express = require('express');
const { protect } = require('../../../middleware/authMiddleware');
const CSIController = require('../controllers/CSIController');

// Router per le route pubbliche (accesso via token)
const publicRouter = express.Router();

// Router per le route protette (accesso admin/insegnanti)
const protectedRouter = express.Router();

// Middleware di protezione per tutte le route protette
protectedRouter.use(protect);

// PUBLIC ROUTES (accesso via token)
if (CSIController.verifyTestToken) {
    publicRouter.get('/verify/:token', CSIController.verifyTestToken);
}

if (CSIController.startTestWithToken) {
    publicRouter.post('/start/:token', CSIController.startTestWithToken);
}

if (CSIController.submitAnswer) {
    publicRouter.post('/:token/answer', CSIController.submitAnswer);
}

if (CSIController.completeTest) {
    publicRouter.post('/:token/complete', CSIController.completeTest);
}

// PROTECTED ROUTES (richiede autenticazione)
if (CSIController.getAll) {
    protectedRouter.get('/', CSIController.getAll);
}

if (CSIController.initTest) {
    protectedRouter.post('/init', CSIController.initTest);
}

if (CSIController.getById) {
    protectedRouter.get('/:testId', CSIController.getById);
}

if (CSIController.getResult) {
    protectedRouter.get('/:testId/result', CSIController.getResult);
}

if (CSIController.getClassStats) {
    protectedRouter.get('/stats/class/:classId', CSIController.getClassStats);
}

if (CSIController.getSchoolStats) {
    protectedRouter.get('/stats/school/:schoolId', CSIController.getSchoolStats);
}

if (CSIController.validateTestAvailability) {
    protectedRouter.get('/validate/:testId', CSIController.validateTestAvailability);
}

if (CSIController.generatePDFReport) {
    protectedRouter.post('/:testId/report', CSIController.generatePDFReport);
}

if (CSIController.generateTestLink) {
    protectedRouter.post('/generate-link', CSIController.generateTestLink);
}

module.exports = {
    publicRoutes: publicRouter,
    protectedRoutes: protectedRouter
};