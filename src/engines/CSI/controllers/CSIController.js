// src/engines/CSI/controllers/CSIController.js

const BaseController = require('../../../controllers/baseController');
const CSIEngine = require('../engine/CSIEngine');
const { createError, ErrorTypes } = require('../../../utils/errors/errorTypes');
const logger = require('../../../utils/errors/logger/logger');
const crypto = require('crypto');
const { student: studentRepository } = require('../../../repositories');

class CSIController {
    constructor() {
        this.engine = new CSIEngine();
    }


    // src/engines/CSI/controllers/CSIController.js

/**
 * Verifica validità del token test
 */
verifyTestToken = async (req, res) => {
    try {
        const { token } = req.params;
        logger.debug('Verifying test token:', { token });

        // Verifica token tramite engine
        const test = await this.engine.verifyToken(token);
        
        // Se il token è valido, restituisci info di base sul test (no dati sensibili)
        res.json({
            status: 'success',
            data: {
                valid: true,
                testType: test.tipo,
                expiresAt: test.expiresAt
            }
        });
    } catch (error) {
        logger.error('Error verifying test token:', { error, token: req.params.token });
        // Non esporre dettagli errore al client
        res.status(400).json({
            status: 'error',
            error: {
                message: 'Token non valido o scaduto'
            }
        });
    }
};

/**
 * Inizia il test con token
 */
startTestWithToken = async (req, res) => {
    try {
        const { token } = req.params;
        logger.debug('Starting test with token:', { token });

        // 1. Verifica e recupera info test
        const test = await this.engine.verifyToken(token);
        
        // 2. Verifica che il test non sia già stato usato
        if (test.used) {
            throw createError(
                ErrorTypes.VALIDATION.INVALID_TOKEN,
                'Questo test è già stato completato'
            );
        }

        // 3. Marca il token come utilizzato
        await this.engine.markTokenAsUsed(token);

        // 4. Inizializza il test e restituisci le domande
        const initializedTest = await this.engine.initializeTest({
            testId: test._id,
            studentId: test.studentId,
            tipo: test.tipo
        });

        // 5. Log dell'evento
        logger.info('Test started successfully with token', {
            testId: test._id,
            studentId: test.studentId,
            token: token.substring(0, 10) + '...' // log solo parte del token
        });

        // 6. Restituisci i dati del test (solo quelli necessari per lo studente)
        res.json({
            status: 'success',
            data: {
                testId: initializedTest._id,
                questions: initializedTest.domande,
                timeLimit: initializedTest.configurazione.tempoLimite,
                instructions: initializedTest.configurazione.istruzioni
            }
        });

    } catch (error) {
        logger.error('Error starting test with token:', {
            error,
            token: req.params.token
        });
        
        this._handleError(res, error);
    }
};

/**
 * Modifica submitAnswer per supportare token
 */
submitAnswer = async (req, res) => {
    try {
        const { token } = req.params;
        const { questionIndex, value, timeSpent } = req.body;

        // 1. Verifica token e recupera test
        const test = await this.engine.verifyToken(token);

        // 2. Processa la risposta
        const result = await this.engine.processAnswer(test._id, {
            questionIndex,
            value,
            timeSpent
        });

        res.json({
            status: 'success',
            data: { result }
        });
    } catch (error) {
        logger.error('Error submitting answer:', { error });
        this._handleError(res, error);
    }
};

/**
 * Modifica completeTest per supportare token
 */
completeTest = async (req, res) => {
    try {
        const { token } = req.params;

        // 1. Verifica token e recupera test
        const test = await this.engine.verifyToken(token);

        // 2. Completa il test
        const result = await this.engine.completeTest(test._id);

        res.json({
            status: 'success',
            data: {
                testCompleted: true,
                message: 'Test completato con successo',
                testId: result._id
            }
        });
    } catch (error) {
        logger.error('Error completing test:', { error });
        this._handleError(res, error);
    }
};


 /**
     * Genera un link univoco per il test
     */
 generateTestLink = async (req, res) => {
    try {
        console.log('Generating test link - Request body:', req.body);
        
        const { studentId, testType } = req.body;

        // Validazione input
        if (!studentId || !testType) {
            throw createError(
                ErrorTypes.VALIDATION.INVALID_INPUT,
                'studentId e testType sono richiesti'
            );
        }

        // Verifica che lo studente esista usando il repository
        const student = await studentRepository.findById(studentId);
        if (!student) {
            throw createError(
                ErrorTypes.VALIDATION.NOT_FOUND,
                'Studente non trovato'
            );
        }

        // Genera token sicuro con dati incorporati
        const tokenData = {
            studentId,
            testType,
            timestamp: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 ore
        };

        // Cripta il token
        const token = crypto
            .createHmac('sha256', process.env.SECRET_KEY || 'your-secret-key')
            .update(JSON.stringify(tokenData))
            .digest('hex');

        // Salva il token usando il metodo esistente nel engine
        await this.engine.saveTestToken({
            token,
            studentId,
            testType,
            expiresAt: new Date(tokenData.expiresAt)
        });

        // Log del successo
        logger.info('Test link generated successfully', { 
            studentId,
            testType,
            token: token.substring(0, 10) + '...' // Log solo parte del token per sicurezza
        });

        res.json({
            status: 'success',
            data: { 
                token,
                url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/test/${testType.toLowerCase()}/${token}`
            }
        });
    } catch (error) {
        logger.error('Error generating test link', { 
            error,
            studentId: req.body.studentId,
            testType: req.body.testType
        });
        this._handleError(res, error);
    }
};


    /**
     * Inizializza un nuovo test CSI
     */
    async initTest(req, res) {
        try {
            const { studentId, classId } = req.body;
            
            if (!studentId || !classId) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_INPUT,
                    'studentId e classId sono richiesti'
                );
            }

            // Determina il tipo di scuola dalla classe
            const classDoc = await req.app.locals.db.Class.findById(classId)
                .populate('schoolId');
            
            if (!classDoc) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Classe non trovata'
                );
            }

            const test = await this.engine.createTest({
                studentId,
                classId,
                schoolType: classDoc.schoolId.schoolType
            });

            logger.info('CSI test initialized', { 
                testId: test._id, 
                studentId, 
                classId 
            });

            res.status(201).json({
                status: 'success',
                data: { test }
            });
        } catch (error) {
            logger.error('Error initializing CSI test', { error });
            this._handleError(res, error);
        }
    }

    /**
     * Invia una risposta per una domanda
     */
    async submitAnswer(req, res) {
        try {
            const { testId } = req.params;
            const { questionIndex, value, timeSpent } = req.body;

            if (!questionIndex || !value) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_INPUT,
                    'questionIndex e value sono richiesti'
                );
            }

            const result = await this.engine.processAnswer(testId, {
                questionIndex,
                value,
                timeSpent
            });

            res.json({
                status: 'success',
                data: { result }
            });
        } catch (error) {
            logger.error('Error submitting answer', { error });
            this._handleError(res, error);
        }
    }

    /**
     * Completa il test e calcola i risultati
     */
    async completeTest(req, res) {
        try {
            const { testId } = req.params;
            const result = await this.engine.completeTest(testId);

            res.json({
                status: 'success',
                data: { result }
            });
        } catch (error) {
            logger.error('Error completing test', { error });
            this._handleError(res, error);
        }
    }

    /**
     * Ottiene il risultato dettagliato con profilo
     */
    async getResult(req, res) {
        try {
            const { testId } = req.params;
            const report = await this.engine.generateReport(testId);

            res.json({
                status: 'success',
                data: { report }
            });
        } catch (error) {
            logger.error('Error getting result', { error });
            this._handleError(res, error);
        }
    }

    /**
     * Ottiene statistiche per una classe
     */
    async getClassStats(req, res) {
        try {
            const { classId } = req.params;
            const results = await this.engine.resultModel
                .find({ 
                    classe: classId,
                    completato: true 
                })
                .populate('utente', 'firstName lastName');

            const stats = this._generateClassStats(results);

            res.json({
                status: 'success',
                data: { stats }
            });
        } catch (error) {
            logger.error('Error getting class stats', { error });
            this._handleError(res, error);
        }
    }

    /**
     * Ottiene statistiche per una scuola
     */
    async getSchoolStats(req, res) {
        try {
            const { schoolId } = req.params;
            
            // Verifica permessi admin
            if (req.user.role !== 'admin') {
                throw createError(
                    ErrorTypes.AUTH.UNAUTHORIZED,
                    'Solo gli admin possono vedere le statistiche della scuola'
                );
            }

            const classes = await req.app.locals.db.Class.find({ schoolId });
            const classIds = classes.map(c => c._id);

            const results = await this.engine.resultModel
                .find({ 
                    classe: { $in: classIds },
                    completato: true 
                })
                .populate('classe');

            const stats = this._generateSchoolStats(results);

            res.json({
                status: 'success',
                data: { stats }
            });
        } catch (error) {
            logger.error('Error getting school stats', { error });
            this._handleError(res, error);
        }
    }

    /**
     * Verifica se uno studente può fare il test
     */
    async validateTestAvailability(req, res) {
        try {
            const { studentId } = req.params;
            const availability = await this.engine.verifyTestAvailability(studentId);

            res.json({
                status: 'success',
                data: { availability }
            });
        } catch (error) {
            logger.error('Error validating test availability', { error });
            this._handleError(res, error);
        }
    }

    /**
     * Genera report PDF dettagliato
     */
    async generatePDFReport(req, res) {
        try {
            const { testId } = req.params;
            const result = await this.engine.resultModel
                .findById(testId)
                .populate('utente')
                .populate('classe');

            if (!result) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Risultato non trovato'
                );
            }

            const pdfBuffer = await this._generatePDF(result);

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=CSI_Report_${testId}.pdf`
            });

            res.send(pdfBuffer);
        } catch (error) {
            logger.error('Error generating PDF report', { error });
            this._handleError(res, error);
        }
    }

    /**
     * Genera statistiche per una classe
     * @private
     */
    _generateClassStats(results) {
        const stats = {
            totalStudents: results.length,
            averageCompletionTime: 0,
            styleDistribution: {
                analytic: 0,
                systematic: 0,
                verbal: 0,
                impulsive: 0,
                dependent: 0
            },
            studentProfiles: []
        };

        results.forEach(result => {
            // Calcola tempo medio completamento
            stats.averageCompletionTime += result.analytics.tempoTotale;

            // Calcola distribuzione stili
            Object.entries(result.punteggi).forEach(([style, score]) => {
                stats.styleDistribution[style] += score;
            });

            // Aggiungi profilo studente
            stats.studentProfiles.push({
                studentName: `${result.utente.firstName} ${result.utente.lastName}`,
                dominantStyle: result.analytics.metadata.profile.dominantStyle,
                scores: result.punteggi
            });
        });

        // Normalizza medie
        stats.averageCompletionTime /= results.length;
        Object.keys(stats.styleDistribution).forEach(style => {
            stats.styleDistribution[style] /= results.length;
        });

        return stats;
    }

    /**
     * Gestisce gli errori in modo consistente
     * @private
     */
    _handleError(res, error) {
        const statusCode = error.status || 500;
        res.status(statusCode).json({
            status: 'error',
            message: error.message,
            code: error.code
        });
    }
}

const controller = new CSIController();
module.exports = controller;