// src/components/engines/CSI/routes/csi.question.routes.js

const express = require('express');
const CSIQuestionController = require('../controllers/CSIQuestionController');
const { protect, restrictTo } = require('../../../../middleware/auth');

const router = express.Router();

// Protezione delle routes - solo admin
router.use(protect);
router.use(restrictTo('admin'));

router.route('/')
    .get(CSIQuestionController.getActiveQuestions)
    .post(CSIQuestionController.createQuestion);

router.route('/:id')
    .put(CSIQuestionController.updateQuestion)
    .delete(CSIQuestionController.deleteQuestion);

router.get('/versions/stats', CSIQuestionController.getVersionStats);

module.exports = router;