// src/controllers/studentController.js

const BaseController = require('./baseController');
const { student: StudentRepository } = require('../repositories');
const logger = require('../utils/logger/logger');

class StudentController extends BaseController {
    constructor() {
        super(StudentRepository, 'student');
    }

    /**
     * Ottiene i test di uno studente
     */
    async getStudentTests(req, res) {
        try {
            const { studentId } = req.params;
            const tests = await this.repository.getStudentTests(studentId);
            this.sendResponse(res, { tests });
        } catch (error) {
            this.sendError(res, error);
        }
    }

    /**
     * Ottiene i risultati dei test di uno studente
     */
    async getTestResults(req, res) {
        try {
            const { studentId } = req.params;
            const results = await this.repository.getTestResults(studentId);
            this.sendResponse(res, { results });
        } catch (error) {
            this.sendError(res, error);
        }
    }
}

module.exports = new StudentController();