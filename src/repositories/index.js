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
const logger = require('../utils/errors/logger/logger');

/**
 * Oggetto che contiene le istanze singleton dei repository
 * @type {Object}
 */
const repositories = {
    /**
     * Repository per la gestione delle scuole
     * @type {SchoolRepository}
     */
    school: new SchoolRepository(),

    /**
     * Repository per la gestione degli utenti
     * @type {UserRepository}
     */
    user: new UserRepository(),

    /**
     * Repository per la gestione delle classi
     * @type {ClassRepository}
     */
    class: new ClassRepository(),

    /**
     * Repository per la gestione degli studenti
     * @type {StudentRepository}
     */
    student: new StudentRepository(),

    /**
     * Repository per la gestione dei test
     * @type {TestRepository}
     */
    test: new TestRepository()
};

/**
 * Verifica l'inizializzazione corretta dei repository
 * @private
 */
const validateRepositories = () => {
    Object.entries(repositories).forEach(([name, repository]) => {
        if (!repository.model) {
            logger.error(`Errore di inizializzazione repository: ${name}`, {
                repository: name,
                error: 'Model non inizializzato'
            });
            throw new Error(`Repository ${name} non inizializzato correttamente`);
        }

        if (!repository.modelName) {
            logger.warn(`Warning: ${name} repository potrebbe mancare il modelName`, {
                repository: name
            });
        }
    });
};

/**
 * Log dei repository caricati
 * @private
 */
const logLoadedRepositories = () => {
    logger.info('Repository caricati con successo', {
        repositories: Object.keys(repositories),
        timestamp: new Date().toISOString()
    });
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