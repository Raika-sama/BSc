// src/engines/CSI/controllers/CSIController.js

const { createError, ErrorTypes } = require('../../utils/errors/errorTypes');
const logger = require('../../utils/errors/logger/logger');
const CSIRepository = require('./CSIRepository');

class CSIController {
    constructor(dependencies) {
        const { 
            testRepository,
            studentRepository,
            classRepository,
            schoolRepository,
            userService 
        } = dependencies;

        if (!testRepository || !studentRepository) {
            throw new Error('Required dependencies missing');
        }

        this.testRepository = testRepository;
        this.studentRepository = studentRepository;
        this.classRepository = classRepository;
        this.schoolRepository = schoolRepository;
        this.userService = userService;
        
        // Inizializza CSIRepository
        this.csiRepository = new CSIRepository();
    }

    /**
     * Verifica token test CSI
     */
    verifyTestToken = async (req, res) => {
        const { token } = req.params;
        
        try {
            logger.debug('Verifying CSI test token:', { 
                token: token ? token.substring(0, 10) + '...' : 'undefined'
            });

            // Usa testRepository per verifica base token
            const result = await this.testRepository.verifyToken(token);

            // Verifica che sia un test CSI
            if (result.test.tipo !== 'CSI') {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_TOKEN,
                    'Token non valido per test CSI'
                );
            }

            res.json({
                status: 'success',
                data: {
                    valid: true,
                    testType: 'CSI',
                    expiresAt: result.expiresAt
                }
            });
        } catch (error) {
            logger.error('Error verifying CSI token:', {
                error: error.message,
                token: token ? token.substring(0, 10) + '...' : 'undefined'
            });

            res.status(400).json({
                status: 'error',
                error: {
                    message: 'Token non valido o scaduto',
                    code: error.code || 'INVALID_TOKEN'
                }
            });
        }
    };

    /**
     * Inizia test CSI con token
     */
    startTestWithToken = async (req, res) => {
        const { token } = req.params;
        
        try {
            logger.debug('Starting CSI test with token:', { 
                token: token ? token.substring(0, 10) + '...' : 'undefined'
            });

            // Verifica token
            const result = await this.testRepository.verifyToken(token);
            
            // Recupera domande dal repository CSI
            const questions = await this.csiRepository.getQuestions();
            
            // Recupera configurazione test
            const config = await this.csiRepository.getTestConfiguration();

            logger.debug('CSI test initialized:', {
                studentId: result.studentId,
                questionsCount: questions.length
            });

            res.json({
                status: 'success',
                data: {
                    questions,
                    config,
                    testId: result.test._id
                }
            });
        } catch (error) {
            logger.error('Error starting CSI test:', {
                error: error.message,
                token: token ? token.substring(0, 10) + '...' : 'undefined'
            });

            res.status(400).json({
                status: 'error',
                error: {
                    message: error.message,
                    code: error.code || 'START_TEST_ERROR'
                }
            });
        }
    };

    /**
     * Processa risposta test CSI
     */
    submitAnswer = async (req, res) => {
        const { token } = req.params;
        const { questionIndex, value, timeSpent } = req.body;

        try {
            // Verifica token
            const result = await this.testRepository.verifyToken(token);
            
            // Salva risposta
            const updatedResult = await this.csiRepository.saveAnswer(result._id, {
                questionIndex,
                value: parseInt(value),
                timeSpent
            });

            res.json({
                status: 'success',
                data: {
                    answered: updatedResult.risposte.length,
                    remaining: result.test.domande.length - updatedResult.risposte.length
                }
            });
        } catch (error) {
            logger.error('Error submitting CSI answer:', {
                error: error.message,
                token: token ? token.substring(0, 10) + '...' : 'undefined'
            });

            res.status(400).json({
                status: 'error',
                error: {
                    message: error.message,
                    code: error.code || 'SUBMIT_ANSWER_ERROR'
                }
            });
        }
    };

    /**
     * Completa test CSI
     */
    completeTest = async (req, res) => {
        const { token } = req.params;
    
        try {
            // Verifica token
            const result = await this.testRepository.verifyToken(token);
            
            // Calcola punteggi
            const scores = await this.csiRepository.calculateScores(result.risposte);
            
            // Salva risultati finali
            const completedResult = await this.csiRepository.saveResults({
                ...result,
                scores,
                completedAt: new Date()
            });

            // Marca token come usato
            await this.testRepository.markTokenAsUsed(token);

            // Notifica completamento se necessario
            if (this.userService) {
                await this.userService.notifyTestComplete(result.studentId, 'CSI');
            }
    
            res.json({
                status: 'success',
                data: {
                    testCompleted: true,
                    resultId: completedResult._id
                }
            });
        } catch (error) {
            logger.error('Error completing CSI test:', {
                error: error.message,
                token: token ? token.substring(0, 10) + '...' : 'undefined'
            });
    
            res.status(400).json({
                status: 'error',
                error: {
                    message: error.message,
                    code: error.code || 'COMPLETE_TEST_ERROR'
                }
            });
        }
    };

    /**
     * Genera link per test CSI
     */
    generateTestLink = async (req, res) => {
        try {
            const { studentId } = req.body;

            // Verifica disponibilità
            const availability = await this.testRepository.checkTestAvailability(studentId, 'CSI');
            if (!availability.available) {
                throw createError(
                    ErrorTypes.VALIDATION.TEST_NOT_AVAILABLE,
                    'Test non disponibile',
                    { nextAvailable: availability.nextAvailableDate }
                );
            }

            // Genera token
            const token = await this.testRepository.saveTestToken({
                studentId,
                testType: 'CSI'
            });

            // Costruisci URL
            const testUrl = `${process.env.FRONTEND_URL}/test/csi/${token.token}`;

            res.json({
                status: 'success',
                data: {
                    token: token.token,
                    url: testUrl,
                    expiresAt: token.expiresAt
                }
            });
        } catch (error) {
            logger.error('Error generating CSI test link:', {
                error: error.message,
                studentId: req.body.studentId
            });

            res.status(400).json({
                status: 'error',
                error: {
                    message: error.message,
                    code: error.code || 'GENERATE_LINK_ERROR'
                }
            });
        }
    };
}

module.exports = CSIController;