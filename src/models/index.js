const mongoose = require('mongoose');
const logger = require('../utils/errors/logger/logger');

// Funzione di utilità per verificare la registrazione di un modello
const verifyModel = (modelName, schema) => {
    try {
        // Verifica se il modello esiste già
        if (mongoose.models[modelName]) {
            logger.debug(`Model ${modelName} già registrato, utilizzo istanza esistente`);
            return mongoose.models[modelName];
        }

        // Registra il nuovo modello
        const model = mongoose.model(modelName, schema);
        logger.debug(`Model ${modelName} registrato con successo`);
        return model;
    } catch (error) {
        logger.error(`Errore nella registrazione del model ${modelName}:`, {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};

const initializeModels = () => {
    try {
        logger.info('Inizializzazione modelli in corso...');

        // 1. Registrazione modelli di base nell'ordine corretto
        const modelsToRegister = [
            { name: 'School', schema: require('./School').schema },
            { name: 'Class', schema: require('./Class').schema },
            { name: 'Student', schema: require('./Student').schema },
            { name: 'User', schema: require('./User').schema },
            { name: 'UserAudit', schema: require('./UserAudit').schema }
        ];

        const registeredModels = {};
        modelsToRegister.forEach(({ name, schema }) => {
            registeredModels[name] = verifyModel(name, schema);
        });

        // 2. Registrazione modelli CSI
        logger.debug('Registrazione modelli CSI...');
        const CSIConfig = verifyModel('CSIConfig', require('../engines/CSI/models/CSIConfig').schema);
        const CSIQuestion = verifyModel('CSIQuestion', require('../engines/CSI/models/CSIQuestion').CSIQuestion.schema);

        // 3. Registrazione Test (dipende da CSIConfig)
        logger.debug('Registrazione modello Test...');
        const Test = verifyModel('Test', require('./Test').schema);

        // 4. Registrazione Result e CSIResult
        logger.debug('Registrazione Result e discriminator CSI...');
        const { Result: ResultSchema, CSIResult: CSIResultSchema } = require('./Result');

        // Registra prima il modello base Result
        const Result = verifyModel('Result', ResultSchema.schema);

        // Registra il discriminator CSI solo se non esiste già
        let CSIResult;
        if (!Result.discriminators?.CSI) {
            CSIResult = Result.discriminator('CSI', CSIResultSchema.schema);
            logger.debug('Discriminator CSI registrato con successo');
        } else {
            CSIResult = Result.discriminators.CSI;
            logger.debug('Discriminator CSI già registrato, utilizzo istanza esistente');
        }

        // 5. Verifica finale
        const models = {
            ...registeredModels,
            Test,
            Result,
            CSIResult,
            CSIConfig,
            CSIQuestion
        };

        // Log dello stato finale dei modelli
        logger.debug('Stato finale modelli:', {
            registeredModels: mongoose.modelNames(),
            resultDiscriminators: Object.keys(Result.discriminators || {}),
            hasCSIDiscriminator: !!Result.discriminators?.CSI
        });

        // 6. Verifica collegamenti tra modelli
        logger.debug('Verifica collegamenti tra modelli:', {
            testHasCSIConfig: !!Test.schema.paths.csiConfig,
            resultHasTest: !!CSIResult.schema.paths.testRef,
            resultHasConfig: !!CSIResult.schema.paths.config
        });

        return models;

    } catch (error) {
        logger.error('Errore critico durante l\'inizializzazione dei modelli:', {
            error: error.message,
            stack: error.stack,
            currentModels: mongoose.modelNames()
        });
        throw error;
    }
};

// Esegui l'inizializzazione una sola volta
let models;
try {
    models = initializeModels();
    logger.info('Tutti i modelli sono stati caricati con successo');
} catch (error) {
    logger.error('Errore fatale durante l\'inizializzazione dei modelli');
    throw error;
}

module.exports = models;