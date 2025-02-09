const mongoose = require('mongoose');
const logger = require('../utils/errors/logger/logger');

const initializeModels = () => {
    try {
        logger.info('Inizializzazione modelli in corso...');

        // Prima registriamo i modelli base
        // Nota come importiamo direttamente gli schemi
        const School = mongoose.models.School || mongoose.model('School', require('./School').schema);
        const Class = mongoose.models.Class || mongoose.model('Class', require('./Class').schema);
        const Student = mongoose.models.Student || mongoose.model('Student', require('./Student').schema);
        const User = mongoose.models.User || mongoose.model('User', require('./User').schema);
        const UserAudit = mongoose.models.UserAudit || mongoose.model('UserAudit', require('./UserAudit').schema);

        // Registrazione modelli CSI
        logger.debug('Registrazione modelli CSI...');
        // Per CSIConfig, importiamo lo schema direttamente
        const CSIConfig = mongoose.models.CSIConfig || 
            mongoose.model('CSIConfig', require('../engines/CSI/models/CSIConfig').schema);
        
        // Per CSIQuestion, usiamo lo schema dalla struttura corretta
        const CSIQuestion = mongoose.models.CSIQuestion || 
            mongoose.model('CSIQuestion', require('../engines/CSI/models/CSIQuestion').CSIQuestion.schema);

        // Registrazione Test
        logger.debug('Registrazione modello Test...');
        const Test = mongoose.models.Test || mongoose.model('Test', require('./Test').schema);

        // Registrazione Result e CSIResult
        logger.debug('Registrazione Result e discriminator CSI...');
        const { baseResultSchema, csiResultSchema } = require('./Result');

        // Registra il modello Result base se non esiste
        const Result = mongoose.models.Result || mongoose.model('Result', baseResultSchema);

        // Gestione del discriminatore CSI
        let CSIResult;
        if (Result.discriminators?.CSI) {
            CSIResult = Result.discriminators.CSI;
            logger.debug('Usando discriminatore CSI esistente');
        } else {
            CSIResult = Result.discriminator('CSI', csiResultSchema);
            logger.debug('Creato nuovo discriminatore CSI');
        }

        // Log per verifica
        logger.debug('Stato modelli dopo inizializzazione:', {
            modelsRegistered: mongoose.modelNames(),
            hasCSIDiscriminator: !!Result.discriminators?.CSI,
            resultCollection: Result.collection.name,
            csiResultCollection: CSIResult.collection.name
        });

        // Restituisci tutti i modelli
        return {
            School,
            Class,
            Student,
            User,
            UserAudit,
            Test,
            Result,
            CSIResult,
            CSIConfig,
            CSIQuestion
        };

    } catch (error) {
        logger.error('Errore durante l\'inizializzazione dei modelli:', {
            error: error.message,
            stack: error.stack,
            currentModels: mongoose.modelNames()
        });
        throw error;
    }
};

// Inizializzazione una tantum con gestione errori
let models;
try {
    models = initializeModels();
    logger.info('Tutti i modelli sono stati caricati con successo');
} catch (error) {
    logger.error('Errore fatale durante l\'inizializzazione dei modelli');
    throw error;
}

module.exports = models;