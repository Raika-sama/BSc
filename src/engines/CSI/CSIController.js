// src/engines/CSI/controllers/CSIController.js

const { createError, ErrorTypes } = require('../../utils/errors/errorTypes');
const logger = require('../../utils/errors/logger/logger');
const { CSIResult } = require('../../models/Result');

class CSIController {
    constructor(dependencies) {
        const { 
            testRepository,
            studentRepository,
            userService,
            csiQuestionService, // Ora questo avrà già il suo repository
            csiRepository
        } = dependencies;

        if (!testRepository || !studentRepository || !csiQuestionService) {
            throw new Error('Required dependencies missing');
        }

        this.testRepository = testRepository;
        this.studentRepository = studentRepository;
        this.userService = userService;
        this.csiQuestionService = csiQuestionService;
        this.csiRepository = csiRepository;

    }

    /**
     * Verifica token test CSI
     */
    // verifyTestToken rimane quasi uguale, ma aggiorniamo la risposta
    verifyTestToken = async (req, res) => {
        const { token } = req.params;
        
        try {
            logger.debug('Verifying CSI token:', { 
                token: token ? token.substring(0, 10) + '...' : 'undefined'
            });
    
            // Usa CSIResult invece di Result
            const result = await this.CSIResult.findOne({
                token,
                used: false,
                expiresAt: { $gt: new Date() }
            }).lean();
    
            if (!result) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_TOKEN,
                    'Token non valido o scaduto'
                );
            }
    
            if (!result.test || !result.test.domande) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_TEST_DATA,
                    'Dati del test non validi'
                );
            }
    
            // Restituisci le informazioni necessarie
            return {
                status: 'success',
                data: {
                    valid: true,
                    questions: result.test.domande,
                    expiresAt: result.expiresAt,
                    testId: result._id
                }
            };
    
        } catch (error) {
            logger.error('Error verifying CSI token:', {
                error: error.message,
                token: token ? token.substring(0, 10) + '...' : 'undefined'
            });
            throw error;
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

            const result = await CSIResult.findOne({ token, used: false });
            if (!result) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_TOKEN,
                    'Token non valido o già utilizzato'
                );
            }
            
            const config = await this.csiRepository.getTestConfiguration();

            // Aggiorna il documento con la data di inizio
            result.dataInizio = new Date();
            await result.save();

            logger.debug('CSI test initialized:', {
                studentId: result.studentId,
                questionsCount: result.test.domande.length
            });

            res.json({
                status: 'success',
                data: {
                    questions: result.test.domande,
                    config,
                    testId: result._id
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
        const { questionId, value, timeSpent } = req.body;

        try {
            const result = await CSIResult.findOne({ token, used: false });
            if (!result) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_TOKEN,
                    'Token non valido o test già completato'
                );
            }

            // Aggiorna le risposte
            result.risposte.push({
                domanda: {
                    id: questionId,
                    categoria: result.test.domande.find(d => d.id === questionId)?.categoria
                },
                valore: value,
                tempoRisposta: timeSpent
            });

            // Aggiorna analytics
            result.analytics.tempoTotale = (result.analytics.tempoTotale || 0) + timeSpent;
            
            await result.save();

            res.json({
                status: 'success',
                data: {
                    answered: result.risposte.length,
                    remaining: result.test.domande.length - result.risposte.length
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
            const result = await CSIResult.findOne({ token, used: false });
            if (!result) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_TOKEN,
                    'Token non valido o test già completato'
                );
            }
            
            // Calcola punteggi
            const scores = await this.csiRepository.calculateScores(result.risposte);
            
            // Aggiorna il risultato con i punteggi e marca come completato
            result.punteggiDimensioni = scores;
            result.completato = true;
            result.used = true;
            result.dataCompletamento = new Date();
            
            // Calcola metadati CSI
            result.metadataCSI = {
                versioneAlgoritmo: '1.0.0',
                calcolatoIl: new Date(),
                pattern: this.csiRepository._analyzePattern(result.risposte),
                profiloCognitivo: this.csiRepository._determineProfile(scores)
            };

            await result.save();

            // Notifica completamento se necessario
            if (this.userService) {
                await this.userService.notifyTestComplete(result.studentId, 'CSI');
            }
    
            res.json({
                status: 'success',
                data: {
                    testCompleted: true,
                    resultId: result._id
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
    
            // 1. Verifica disponibilità
            const availability = await this.testRepository.checkTestAvailability(studentId, 'CSI');
            if (!availability.available) {
                throw createError(
                    ErrorTypes.VALIDATION.TEST_NOT_AVAILABLE,
                    'Test non disponibile',
                    { nextAvailable: availability.nextAvailableDate }
                );
            }
    
            // 2. Recupera le domande
            const questions = await this.csiQuestionService.getTestQuestions();
            
            // 3. Crea nuovo risultato CSI
            const result = await CSIResult.create({
                studentId,
                tipo: 'CSI',
                test: {
                    tipo: 'CSI',
                    domande: questions.map(q => ({
                        id: q.id,
                        testo: q.testo,
                        categoria: q.categoria,
                        metadata: q.metadata,
                        version: q.version
                    })),
                    version: questions[0]?.version || '1.0.0'
                },
                token: this.testRepository.generateToken(), // assicurati che questo metodo esista
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 ore
                analytics: { tempoTotale: 0, domandePerse: 0, pattern: [] }
            });
    
            const testUrl = `${process.env.FRONTEND_URL}/test/csi/${result.token}`;
    
            res.json({
                status: 'success',
                data: {
                    token: result.token,
                    url: testUrl,
                    expiresAt: result.expiresAt
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