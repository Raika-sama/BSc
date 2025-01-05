// src/controllers/classController.js

const BaseController = require('./baseController');
const { class: ClassRepository } = require('../repositories');
const logger = require('../utils/logger/logger');

class ClassController extends BaseController {
    constructor() {
        super(ClassRepository, 'class');
    }

    /**
     * Ottiene le classi per scuola
     */
    async getBySchool(req, res) {
        try {
            const { schoolId } = req.params;
            const classes = await this.repository.findBySchool(schoolId);
            this.sendResponse(res, { classes });
        } catch (error) {
            this.sendError(res, error);
        }
    }

    /**
     * Aggiunge studenti alla classe
     */
    async addStudents(req, res) {
        try {
            const { classId } = req.params;
            const { studentIds } = req.body;

            const updatedClass = await this.repository.addStudents(classId, studentIds);
            logger.info('Studenti aggiunti alla classe', { 
                classId, 
                studentCount: studentIds.length 
            });

            this.sendResponse(res, { class: updatedClass });
        } catch (error) {
            this.sendError(res, error);
        }
    }
}

module.exports = new ClassController();