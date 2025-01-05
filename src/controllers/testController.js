// src/controllers/testController.js

const BaseController = require('./baseController');
const { test: TestRepository } = require('../repositories');
const logger = require('../utils/logger/logger');

class TestController extends BaseController {
    constructor() {
        super(TestRepository, 'test');
    }

    /**
     * Avvia un nuovo test
     */
    async startTest(req, res) {
        try {
            const { studentId, testType } = req.body;
            
            if (!studentId || !testType) {
                return this.sendError(res, {
                    statusCode: 400,
                    message: 'Dati test incompleti',
                    code: 'VALIDATION_ERROR'
                });
            }

            const test = await this.repository.createTest(studentId, testType);
            logger.info('Nuovo test avviato', { 
                testId: test._id, 
                studentId, 
                testType 
            });

            this.sendResponse(res, { test }, 201);
        } catch (error) {
            this.sendError(res, error);
        }
    }

    /**
     * Sottomette i risultati di un test
     */
    async submitTest(req, res) {
        try {
            const { testId } = req.params;
            const { answers, duration } = req.body;

            const result = await this.repository.submitTest(testId, answers, duration);
            logger.info('Test completato', { testId, duration });

            this.sendResponse(res, { result });
        } catch (error) {
            this.sendError(res, error);
        }
    }

    /**
     * Ottiene le statistiche dei test
     */
    async getTestStats(req, res) {
        try {
            const { testId } = req.params;
            const stats = await this.repository.getTestStatistics(testId);
            this.sendResponse(res, { stats });
        } catch (error) {
            this.sendError(res, error);
        }
    }
}

module.exports = new TestController();