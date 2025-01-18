// src/controllers/studentController.js

const BaseController = require('./baseController');
const { student: StudentRepository } = require('../repositories');
const logger = require('../utils/errors/logger/logger');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');

class StudentController extends BaseController {
    constructor() {
        super(StudentRepository, 'student');
        
        // Binding dei metodi
        this.getStudentsByClass = this.getStudentsByClass.bind(this);
        this.getMyStudents = this.getMyStudents.bind(this);
        this.assignToClass = this.assignToClass.bind(this);
        this.removeFromClass = this.removeFromClass.bind(this);
        this.searchStudents = this.searchStudents.bind(this);
    }

    /**
     * Recupera tutti gli studenti con filtri
     * @override
     */
    async getAll(req, res, next) {
        try {
            logger.debug('Getting all students with filters:', { 
                query: req.query,
                user: req.user?.id
            });

            const filters = {};
            
            // Se l'utente è un teacher, mostra solo i suoi studenti
            if (req.user.role === 'teacher') {
                filters.$or = [
                    { mainTeacher: req.user.id },
                    { teachers: req.user.id }
                ];
            }

            // Applica filtri aggiuntivi dalla query
            if (req.query.schoolId) filters.schoolId = req.query.schoolId;
            if (req.query.classId) filters.classId = req.query.classId;
            if (req.query.status) filters.status = req.query.status;

            const students = await this.repository.findWithDetails(filters, {
                sort: { lastName: 1, firstName: 1 }
            });

            this.sendResponse(res, { 
                students,
                count: students.length
            });
        } catch (error) {
            logger.error('Error in getAll students:', error);
            next(error);
        }
    }

    /**
     * Crea un nuovo studente
     * @override
     */
    async create(req, res, next) {
        try {
            logger.debug('Creating new student:', { 
                body: req.body,
                user: req.user?.id
            });

            // Verifica permessi
            if (req.user.role !== 'admin') {
                throw createError(
                    ErrorTypes.AUTH.FORBIDDEN,
                    'Non autorizzato a creare studenti'
                );
            }

            const student = await this.repository.create(req.body);
            
            logger.info('Student created successfully:', {
                studentId: student._id,
                school: student.schoolId
            });

            this.sendResponse(res, { student }, 201);
        } catch (error) {
            logger.error('Error creating student:', error);
            next(error);
        }
    }

    /**
     * Recupera studenti di una specifica classe
     */
    async getStudentsByClass(req, res, next) {
        try {
            const { classId } = req.params;
            logger.debug('Getting students by class:', { 
                classId,
                user: req.user?.id
            });

            // Passa teacherId solo se l'utente è un teacher
            const teacherId = req.user.role === 'teacher' ? req.user.id : null;
            
            const students = await this.repository.findByClass(classId, teacherId);
            
            this.sendResponse(res, { 
                students,
                count: students.length
            });
        } catch (error) {
            logger.error('Error getting students by class:', error);
            next(error);
        }
    }

    /**
     * Recupera studenti associati al docente loggato
     */
    async getMyStudents(req, res, next) {
        try {
            if (req.user.role !== 'teacher') {
                throw createError(
                    ErrorTypes.AUTH.FORBIDDEN,
                    'Solo i docenti possono accedere a questa risorsa'
                );
            }

            logger.debug('Getting teacher students:', { 
                teacherId: req.user.id
            });

            const students = await this.repository.findByTeacher(req.user.id);
            
            this.sendResponse(res, { 
                students,
                count: students.length
            });
        } catch (error) {
            logger.error('Error getting teacher students:', error);
            next(error);
        }
    }

    /**
     * Assegna uno studente a una classe
     */
    async assignToClass(req, res, next) {
        try {
            const { studentId } = req.params;
            const { classId } = req.body;

            logger.debug('Assigning student to class:', { 
                studentId,
                classId,
                user: req.user?.id
            });

            // Verifica permessi
            if (req.user.role !== 'admin') {
                throw createError(
                    ErrorTypes.AUTH.FORBIDDEN,
                    'Non autorizzato ad assegnare studenti'
                );
            }

            const student = await this.repository.assignToClass(studentId, classId);
            
            this.sendResponse(res, { 
                student,
                message: 'Studente assegnato con successo'
            });
        } catch (error) {
            logger.error('Error assigning student to class:', error);
            next(error);
        }
    }

    /**
     * Rimuove uno studente da una classe
     */
    async removeFromClass(req, res, next) {
        try {
            const { studentId } = req.params;
            const { reason } = req.body;

            logger.debug('Removing student from class:', { 
                studentId,
                reason,
                user: req.user?.id
            });

            // Verifica permessi
            if (req.user.role !== 'admin') {
                throw createError(
                    ErrorTypes.AUTH.FORBIDDEN,
                    'Non autorizzato a rimuovere studenti'
                );
            }

            const student = await this.repository.removeFromClass(studentId, reason);
            
            this.sendResponse(res, { 
                student,
                message: 'Studente rimosso dalla classe con successo'
            });
        } catch (error) {
            logger.error('Error removing student from class:', error);
            next(error);
        }
    }

    /**
     * Ricerca studenti per nome/cognome
     */
    async searchStudents(req, res, next) {
        try {
            const { query, schoolId } = req.query;

            if (!query) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Parametro di ricerca mancante'
                );
            }

            logger.debug('Searching students:', { 
                query,
                schoolId,
                user: req.user?.id
            });

            const students = await this.repository.searchByName(query, schoolId);
            
            this.sendResponse(res, { 
                students,
                count: students.length
            });
        } catch (error) {
            logger.error('Error searching students:', error);
            next(error);
        }
    }

    /**
     * Aggiorna uno studente
     * @override
     */
    async update(req, res, next) {
        try {
            const { id } = req.params;
            console.log('Updating student with data:', { 
                id,
                updates: req.body 
            });
            logger.debug('Updating student:', { 
                studentId: id,
                updates: req.body,
                user: req.user?.id
            });

            // Verifica permessi
            if (req.user.role !== 'admin') {
                throw createError(
                    ErrorTypes.AUTH.FORBIDDEN,
                    'Non autorizzato a modificare studenti'
                );
            }

            const student = await this.repository.update(id, req.body);
            
            this.sendResponse(res, { student });
        } catch (error) {
            logger.error('Error updating student:', error);
            next(error);
        }
    }

    /**
     * Elimina uno studente
     * @override
     */
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            
            logger.debug('Deleting student:', { 
                studentId: id,
                user: req.user?.id
            });

            // Verifica permessi
            if (req.user.role !== 'admin') {
                throw createError(
                    ErrorTypes.AUTH.FORBIDDEN,
                    'Non autorizzato a eliminare studenti'
                );
            }

            await this.repository.delete(id);
            
            this.sendResponse(res, { 
                message: 'Studente eliminato con successo'
            });
        } catch (error) {
            logger.error('Error deleting student:', error);
            next(error);
        }
    }

    async getUnassignedStudents(req, res, next) {
        try {
            const { schoolId } = req.params;
            const { search } = req.query;
    
            logger.debug('Getting unassigned students:', { 
                schoolId, 
                search,
                user: req.user?.id
            });
    
            const students = await this.repository.findUnassignedStudents(
                schoolId,
                { name: search }
            );
    
            this.sendResponse(res, { 
                students,
                count: students.length
            });
        } catch (error) {
            logger.error('Error getting unassigned students:', error);
            next(error);
        }
    }
    
    async batchAssignToClass(req, res, next) {
        try {
            const { studentIds, classId, academicYear } = req.body;
    
            if (!studentIds?.length || !classId || !academicYear) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Dati mancanti per l\'assegnazione'
                );
            }
    
            logger.debug('Batch assigning students to class:', {
                studentIds,
                classId,
                academicYear,
                user: req.user?.id
            });
    
            const result = await this.repository.batchAssignToClass(
                studentIds,
                { classId, academicYear }
            );
    
            this.sendResponse(res, {
                message: 'Studenti assegnati con successo',
                modifiedCount: result.modifiedCount
            });
        } catch (error) {
            logger.error('Error in batch assigning students:', error);
            next(error);
        }
    }
}

module.exports = new StudentController();




// Operazioni CRUD Base con:

// Gestione permessi (admin/teacher)
// Validazioni input
// Logging dettagliato
// Gestione errori


// Funzionalità Specifiche:

// getStudentsByClass: studenti di una classe specifica
// getMyStudents: studenti associati al docente
// searchStudents: ricerca studenti per nome
// assignToClass/removeFromClass: gestione assegnazioni


// Sicurezza:

// Controllo ruoli utente
// Filtri dati basati sui permessi
// Validazione input


// Logging:

// Tracciamento operazioni
// Log errori dettagliati
// Debug info