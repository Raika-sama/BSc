// src/engines/CSI/config/setupDependencies.js

const TestRepository = require('../../../repositories/TestRepository');
const CSIRepository = require('../CSIRepository');
const StudentRepository = require('../../../repositories/StudentRepository');
const UserService = require('../../../services/UserService');

const setupCSIDependencies = () => {
    // Inizializza repositories
    const testRepository = new TestRepository();
    const csiRepository = new CSIRepository();
    const studentRepository = new StudentRepository();
    
    // Inizializza services
    const userService = new UserService();

    return {
        testRepository,
        csiRepository,
        studentRepository,
        userService
    };
};

module.exports = setupCSIDependencies;