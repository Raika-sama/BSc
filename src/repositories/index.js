// src/repositories/index.js

/**
 * @file index.js
 * @description File di esportazione centralizzata per tutti i repository del sistema Brain-Scanner.
 */

const SchoolRepository = require('./SchoolRepository');
const UserRepository = require('./UserRepository');
const ClassRepository = require('./ClassRepository');
const StudentRepository = require('./StudentRepository');
const TestRepository = require('./TestRepository');
const AuthRepository = require('./AuthRepository');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const StudentAuthRepository = require('./StudentAuthRepository');


// Importa tutti i modelli dal punto centralizzato
const models = require('../models');

logger.debug('Models imported in repositories/index.js:', {
    availableModels: Object.keys(models),
    modelsValidation: Object.entries(models).map(([name, model]) => ({
        name,
        hasModelName: !!model.modelName,
        modelName: model.modelName
    }))
});

// Creiamo le istanze dei repository usando i modelli dal models/index.js
const repositories = {
    auth: new AuthRepository(models.User),
    user: new UserRepository(models.User),
    class: new ClassRepository(models.Class),
    student: new StudentRepository(models.Student),
    studentAuth: new StudentAuthRepository(models.StudentAuth),
    test: new TestRepository(models.Test),
    // School repository richiede dipendenze aggiuntive
    school: new SchoolRepository(
        models.School,
        new ClassRepository(models.Class),
        new StudentRepository(models.Student)
    )
};

// Aggiungi alias più descrittivi
const namedRepositories = {
    authRepository: repositories.auth,
    userRepository: repositories.user,
    classRepository: repositories.class,
    studentRepository: repositories.student,
    studentAuthRepository: repositories.studentAuth,
    testRepository: repositories.test,
    schoolRepository: repositories.school
};

// Unisci i repository con nomi brevi e descrittivi
Object.assign(repositories, namedRepositories);

/**
 * Verifica l'inizializzazione corretta dei repository
 * @private
 */
const validateRepositories = () => {
    try {
        Object.entries(repositories).forEach(([name, repository]) => {
            if (!repository?.model) {
                throw createError(
                    ErrorTypes.SYSTEM.INTERNAL_ERROR,
                    `Repository ${name} non ha un modello associato`
                );
            }

            if (!repository.model.modelName) {
                logger.warn(`Warning: ModelName mancante nel repository`, {
                    repository: name,
                    modelType: repository.model.constructor.name
                });
            }

            logger.debug(`Repository ${name} validation:`, {
                hasModel: !!repository.model,
                modelName: repository.model.modelName || 'undefined',
                isMongooseModel: !!repository.model.base
            });
        });
    } catch (error) {
        logger.error('Errore durante la validazione dei repository', { 
            error: error.message,
            stack: error.stack 
        });
        throw error;
    }
};

// Esegue le verifiche di inizializzazione
validateRepositories();

// Congela l'oggetto repositories per prevenire modifiche accidentali
Object.freeze(repositories);

module.exports = repositories;