// src/engines/CSI/config/setupDependencies.js

const TestRepository = require('../../../repositories/TestRepository');
const CSIRepository = require('../CSIRepository');
const StudentRepository = require('../../../repositories/StudentRepository');
const UserService = require('../../../services/UserService');
const CSIQuestionService = require('../CSIQuestionService');
const CSIQuestionRepository = require('../CSIQuestionRepository');

const setupCSIDependencies = () => {
    // Inizializza repositories
    const testRepository = new TestRepository();
    const csiRepository = new CSIRepository();
    const studentRepository = new StudentRepository();
    const csiQuestionRepository = new CSIQuestionRepository(); // Aggiungi questo
    
    // Inizializza services
    const userService = new UserService();
    // Passa il repository al service
    const csiQuestionService = new CSIQuestionService(csiQuestionRepository);

    return {
        testRepository,
        csiRepository,
        studentRepository,
        userService,
        csiQuestionService,
        // Opzionale: restituisci anche il repository delle domande se serve altrove
        csiQuestionRepository
    };
};

module.exports = setupCSIDependencies;