// src/models/index.js

/**
 * File di esportazione centralizzata per tutti i modelli MongoDB
 */
const mongoose = require('mongoose');
const logger = require('../utils/errors/logger/logger');

// 1. Prima carichiamo i modelli base
const School = require('./School');
const User = require('./User');
const Class = require('./Class');
const Student = require('./Student');
const Test = require('./Test');
const UserAudit = require('./UserAudit');

// 2. Poi carichiamo Result (il modello base per i discriminator)
const { Result } = require('./Result');

// 3. Poi carichiamo i modelli CSI
const { CSIQuestion } = require('../engines/CSI/models/CSIQuestion');
const CSIConfig = require('../engines/CSI/models/CSIConfig');

// 4. Infine carichiamo il discriminator CSI
const { CSIResult } = require('./Result');

// Verifica e registrazione esplicita dei modelli
const registerModels = () => {
    // Registra prima il modello base Result se non esiste
    if (!mongoose.models.Result) {
        mongoose.model('Result', Result.schema);
    }

    // Registra il discriminator CSI
    const ResultModel = mongoose.model('Result');
    if (!ResultModel.discriminators || !ResultModel.discriminators['CSI']) {
        ResultModel.discriminator('CSI', CSIResult.schema);
    }

    logger.debug('Models registration check:', {
        registeredModels: mongoose.modelNames(),
        hasResult: !!mongoose.models.Result,
        hasCSIDiscriminator: !!mongoose.models.Result.discriminators?.CSI
    });
};

// Esegui la registrazione
registerModels();

// Definisci l'oggetto dei modelli
const models = {
    School,
    User,
    Class,
    Student,
    Test,
    Result,
    CSIResult,
    CSIQuestion,
    CSIConfig,
    UserAudit
};

// Verifica finale
Object.entries(models).forEach(([name, model]) => {
    if (!model || !model.modelName) {
        logger.error(`Model ${name} non inizializzato correttamente`);
        throw new Error(`Model ${name} non inizializzato correttamente`);
    }
    logger.debug(`Model ${name} loaded:`, {
        modelName: model.modelName,
        hasDiscriminator: !!model.discriminators,
        discriminatorKeys: model.discriminators ? Object.keys(model.discriminators) : []
    });
});

// Esporta i modelli
module.exports = {
    School,
    User,
    Class,
    Student,
    Test,
    Result,
    CSIResult,
    CSIQuestion,
    CSIConfig,
    UserAudit
};

logger.info('All models loaded successfully');