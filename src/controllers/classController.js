// src/controllers/classController.js

const BaseController = require('./baseController');
const { class: ClassRepository } = require('../repositories');
const logger = require('../utils/errors/logger/logger');

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


    /**
     * Ottiene tutte le classi della scuola dell'utente corrente
     */
    async getAll(req, res) {
        try {
            // Ottiene le classi solo della scuola dell'utente corrente
            const classes = await this.repository.findBySchool(req.user.schoolId);
            this.sendResponse(res, { classes });
        } catch (error) {
            this.sendError(res, error);
        }
    }

    /**
     * Crea una nuova classe nella scuola dell'utente corrente
     */
    async create(req, res) {
        try {
            // Assicura che la classe venga creata nella scuola dell'utente
            const classData = {
                ...req.body,
                schoolId: req.user.schoolId
            };

            // Verifica che non esista già una classe con stessi parametri
            const exists = await this.repository.exists({
                schoolId: req.user.schoolId,
                year: classData.year,
                section: classData.section,
                academicYear: classData.academicYear
            });

            if (exists) {
                return this.sendError(res, {
                    statusCode: 400,
                    message: 'Classe già esistente per questo anno e sezione',
                    code: 'CLASS_ALREADY_EXISTS'
                });
            }

            const newClass = await this.repository.create(classData);
            this.sendResponse(res, { class: newClass });
        } catch (error) {
            this.sendError(res, error);
        }
    }

    /**
     * Elimina tutte le classi della scuola dell'utente corrente
     */
    async deleteAll(req, res) {
        try {
            const result = await this.repository.deleteMany({ 
                schoolId: req.user.schoolId 
            });
            
            this.sendResponse(res, { 
                message: `Tutte le classi della scuola sono state eliminate`,
                count: result.deletedCount 
            });
        } catch (error) {
            this.sendError(res, error);
        }
    }



}

module.exports = new ClassController();