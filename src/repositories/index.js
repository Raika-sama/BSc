// src/repositories/index.js

/**
 * @file index.js
 * @description File di esportazione centralizzata per tutti i repository del sistema Brain-Scanner.
 * Implementa il pattern Singleton per garantire una singola istanza di ogni repository.
 * 
 * @author Raika-sama
 * @date 2025-01-05
 * @project Brain-Scanner (BSc)
 */

const SchoolRepository = require('./SchoolRepository');
const UserRepository = require('./UserRepository');
const ClassRepository = require('./ClassRepository');
const StudentRepository = require('./StudentRepository');
const TestRepository = require('./TestRepository');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const models = require('../models');

// Creiamo le istanze dei repository passando i models corrispondenti
const classRepository = new ClassRepository(models.Class);
const studentRepository = new StudentRepository(models.Student);
const userRepository = new UserRepository(models.User);
const testRepository = new TestRepository(models.Test);

// Creiamo il repository della scuola iniettando le dipendenze
const schoolRepository = new SchoolRepository(
    models.School,
    classRepository, 
    studentRepository
);

const repositories = {
    school: schoolRepository,
    class: classRepository,
    student: studentRepository,
    user: userRepository,
    test: testRepository
};
// Dopo l'inizializzazione dei repository
logger.debug('Repository initialization check:', {
    hasSchoolRepo: !!repositories.school,
    schoolRepoHasClassRepo: !!repositories.school.classRepository,
    schoolRepoHasStudentRepo: !!repositories.school.studentRepository
});

/**
 * Verifica l'inizializzazione corretta dei repository
 * @private
 */
const validateRepositories = () => {
    try {
        Object.entries(repositories).forEach(([name, repository]) => {
            if (!repository.model) {
                logger.error(`Repository non inizializzato correttamente`, {
                    repository: name,
                    error: 'Model non inizializzato'
                });
                throw createError(
                    ErrorTypes.SYSTEM.INTERNAL_ERROR,
                    `Repository ${name} non inizializzato correttamente`
                );
            }

            if (!repository.modelName) {
                logger.warn(`Warning: ModelName mancante nel repository`, {
                    repository: name
                });
            }
        });
    } catch (error) {
        if (error.code) throw error;
        logger.error('Errore durante la validazione dei repository', { error });
        throw createError(
            ErrorTypes.SYSTEM.INTERNAL_ERROR,
            'Errore durante l\'inizializzazione dei repository',
            { originalError: error.message }
        );
    }
};


/**
 * Log dei repository caricati
 * @private
 */
const logLoadedRepositories = () => {
    try {
        logger.info('Repository caricati con successo', {
            repositories: Object.keys(repositories),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Errore durante il logging dei repository', { error });
        // Non lanciamo l'errore qui perché il logging è non critico
    }
};

// Esegue le verifiche di inizializzazione
validateRepositories();
logLoadedRepositories();

// Congela l'oggetto repositories per prevenire modifiche accidentali
Object.freeze(repositories);

module.exports = repositories;

/**
 * @example
 * // Importazione e utilizzo dei repository
 * const { school, user, class: classRepo } = require('../repositories');
 * 
 * // Esempi di utilizzo:
 * await school.findWithUsers(schoolId);
 * await user.findByEmail(email);
 * await classRepo.findWithDetails(classId);
 * 
 * @note Il repository 'class' viene rinominato in 'classRepo' 
 * nell'importazione per evitare conflitti con la keyword 'class'
 */