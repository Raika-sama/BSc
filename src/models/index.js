// src/models/index.js

const mongoose = require('mongoose');
const logger = require('../utils/errors/logger/logger');

// Funzione di utilità per verificare la registrazione di un modello
const verifyModel = (modelName, model) => {
    if (!model || !model.modelName) {
        logger.error(`Model ${modelName} non inizializzato correttamente`);
        throw new Error(`Model ${modelName} non inizializzato correttamente`);
    }
    logger.debug(`Model ${modelName} verificato con successo`);
    return model;
};

try {
    logger.info('Inizializzazione modelli in corso...');

    // 1. Prima tutti i modelli base TRANNE Result
    const School = verifyModel('School', require('./School'));
    const User = verifyModel('User', require('./User'));
    const Class = verifyModel('Class', require('./Class'));
    const Student = verifyModel('Student', require('./Student'));
    const Test = verifyModel('Test', require('./Test'));
    const UserAudit = verifyModel('UserAudit', require('./UserAudit'));
    const { CSIQuestion } = require('../engines/CSI/models/CSIQuestion');
    const CSIConfig = require('../engines/CSI/models/CSIConfig');

    // 2. Controllo modelli base
    logger.debug('Verifica modelli base:', {
        hasSchool: !!mongoose.models.School,
        hasTest: !!mongoose.models.Test,
        hasCSIQuestion: !!mongoose.models.CSIQuestion,
        currentModels: mongoose.modelNames()
    });

    // 3. Registrazione Result e CSIResult
    logger.debug('Inizializzazione Result e discriminator...');
    const { Result, CSIResult } = require('./Result');
    
    // 4. Registrazione esplicita del modello base Result
    let ResultModel;
    if (!mongoose.models.Result) {
        ResultModel = mongoose.model('Result', Result.schema);
        logger.debug('Modello Result registrato con successo');
    } else {
        ResultModel = mongoose.models.Result;
        logger.debug('Modello Result già registrato, utilizzo istanza esistente');
    }

    // 5. Registrazione esplicita del discriminator CSI
    let CSIResultModel;
    if (!ResultModel.discriminators?.CSI) {
        CSIResultModel = ResultModel.discriminator('CSI', CSIResult.schema);
        logger.debug('Discriminator CSI registrato con successo');
    } else {
        CSIResultModel = ResultModel.discriminators.CSI;
        logger.debug('Discriminator CSI già registrato, utilizzo istanza esistente');
    }

    // 6. Log dettagliato della registrazione Result
    logger.debug('Stato registrazione Result:', {
        resultModel: {
            name: ResultModel.modelName,
            hasSchema: !!ResultModel.schema,
            discriminatorKey: ResultModel.schema.discriminatorMapping?.key
        },
        csiModel: {
            name: CSIResultModel.modelName,
            hasSchema: !!CSIResultModel.schema,
            parentModel: CSIResultModel.baseModelName
        },
        discriminators: Object.keys(ResultModel.discriminators || {})
    });

    // 7. Preparazione oggetto modelli da esportare
    const models = {
        School,
        User,
        Class,
        Student,
        Test,
        Result: ResultModel,
        CSIResult: CSIResultModel,
        CSIQuestion,
        CSIConfig,
        UserAudit
    };

    // 8. Verifica finale di tutti i modelli
    Object.entries(models).forEach(([name, model]) => {
        if (!model || !model.modelName) {
            const error = new Error(`Model ${name} non inizializzato correttamente`);
            logger.error(error.message);
            throw error;
        }
        logger.debug(`Model ${name} caricato:`, {
            modelName: model.modelName,
            hasDiscriminator: !!model.discriminators,
            discriminatorKeys: model.discriminators ? Object.keys(model.discriminators) : [],
            baseModelName: model.baseModelName || 'N/A'
        });
    });

    // 9. Verifica finale dei modelli registrati
    logger.debug('Verifica finale registrazione:', {
        registeredModels: mongoose.modelNames(),
        hasResult: !!mongoose.models.Result,
        hasCSIDiscriminator: !!mongoose.models.Result.discriminators?.CSI,
        discriminatorKeys: Object.keys(mongoose.models.Result.discriminators || {})
    });

    logger.info('Tutti i modelli sono stati caricati con successo');

    // Esportazione dei modelli verificati
    module.exports = models;

} catch (error) {
    logger.error('Errore critico durante l\'inizializzazione dei modelli:', {
        error: error.message,
        stack: error.stack,
        currentModels: mongoose.modelNames()
    });
    throw error;
}