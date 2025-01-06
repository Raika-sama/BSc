const BaseController = require('./baseController');
const { student: StudentRepository } = require('../repositories');
const logger = require('../utils/errors/logger/logger');

class StudentController extends BaseController {
    constructor() {
        super(StudentRepository, 'student');
        // Binding dei metodi
        this.getAll = this.getAll.bind(this);
    }

    async create(req, res, next) {
        try {
            const { withClassAssignment, ...studentData } = req.body;
    
            if (withClassAssignment && req.body.classId) {
                // Creazione con assegnazione immediata
                const student = await this.repository.createWithClassAssignment(
                    studentData,
                    {
                        classId: req.body.classId,
                        section: req.body.section,
                        currentYear: req.body.currentYear,
                        mainTeacher: req.body.mainTeacher,
                        teachers: req.body.teachers
                    }
                );
                return this.sendResponse(res, { student });
            } else {
                // Creazione semplice
                const student = await this.repository.create({
                    ...studentData,
                    needsClassAssignment: true
                });
                return this.sendResponse(res, { student });
            }
        } catch (error) {
            next(error);
        }
    }

    
    async searchByName(req, res, next) {
        try {
            const { name, schoolId } = req.query;
            
            if (!name || !schoolId) {
                return res.status(400).json({
                    status: 'error',
                    error: {
                        message: 'Nome e ID scuola sono richiesti per la ricerca',
                        code: 'INVALID_SEARCH_PARAMS'
                    }
                });
            }

            logger.debug('Searching students by name', { name, schoolId });
            
            const students = await this.repository.searchByName(name, schoolId);
            
            res.status(200).json({
                status: 'success',
                results: students.length,
                data: { students }
            });
        } catch (error) {
            logger.error('Error searching students by name:', { error });
            next(error);
        }
    }
    
    
    /**
     * Override del metodo getAll per gestire i filtri
     */
        
    async getAll(req, res, next) {
        try {
            logger.debug('Getting students with filters:', req.query);
            let students;

            if (req.query.classId) {
                // Se c'è un classId, usa findByClass
                students = await this.repository.findByClass(req.query.classId);
            } else {
                // Altrimenti usa il metodo base find
                students = await this.repository.find(req.query);
            }

            res.status(200).json({
                status: 'success',
                results: students.length,
                data: { students }
            });
        } catch (error) {
            logger.error('Error getting students:', { error });
            next(error);
        }
    }

    /**
 * Assegna uno studente a una nuova classe
 * Gestisce cambio sezione e anno in base al tipo di scuola
 */
    async assignToClass(req, res, next) {
        try {
            const { id: studentId } = req.params;
            const { classId, section, currentYear, reason } = req.body;
    
            // Prima otteniamo lo studente
            const student = await this.repository.findById(studentId);
            if (!student) {
                return this.sendError(res, {
                    statusCode: 404,
                    message: 'Studente non trovato',
                    code: 'STUDENT_NOT_FOUND'
                });
            }
    
            // Poi otteniamo la classe
            const targetClass = await this.repository.findClass(classId);
            if (!targetClass) {
                return this.sendError(res, {
                    statusCode: 404,
                    message: 'Classe non trovata',
                    code: 'CLASS_NOT_FOUND'
                });
            }
    
            // Prepariamo i dati per l'aggiornamento
            const updateData = {
                classId: targetClass._id,
                section,
                currentYear,
                mainTeacher: targetClass.mainTeacher,
                teachers: targetClass.teachers,
                lastClassChangeDate: new Date(),
                fromClass: student.classId,
                fromSection: student.section,
                fromYear: student.currentYear,
                reason: reason || 'Assegnazione classe'
            };
    
            // Assegniamo lo studente alla classe
            const updatedStudent = await this.repository.assignToClass(studentId, updateData);
    
            this.sendResponse(res, { 
                student: updatedStudent,
                message: 'Studente assegnato con successo alla classe'
            });
    
        } catch (error) {
            logger.error('Errore nell\'assegnazione della classe:', error);
            next(error);
        }
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