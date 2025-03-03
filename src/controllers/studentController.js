// src/controllers/studentController.js

const BaseController = require('./baseController');
const logger = require('../utils/errors/logger/logger');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const mongoose = require('mongoose'); // Aggiungi questa riga all'inizio del file
const Student = require('../models/Student'); // Aggiungi questa riga all'inizio del file

class StudentController extends BaseController {
    constructor(studentRepository) {
        super(studentRepository);
        this.repository = studentRepository;
        this.model = Student;

        // Binding dei metodi
        this.getStudentsByClass = this.getStudentsByClass.bind(this);
        this.getMyStudents = this.getMyStudents.bind(this);
        this.assignToClass = this.assignToClass.bind(this);
        this.removeFromClass = this.removeFromClass.bind(this);
        this.searchStudents = this.searchStudents.bind(this);
        this.getUnassignedStudents = this.getUnassignedStudents.bind(this);
        this.batchAssignToClass = this.batchAssignToClass.bind(this);
        this.batchAssignToSchool = this.batchAssignToSchool.bind(this);
        this.getUnassignedToSchoolStudents = this.getUnassignedToSchoolStudents.bind(this);
        this.createStudentWithClass = this.createStudentWithClass.bind(this);
        this.countByClasses = this.countByClasses.bind(this);
    }

    /**
     * Recupera tutti gli studenti con filtri
     * @override
     */
    async getAll(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const skip = (page - 1) * limit;
    
            // Costruzione filtri base
            const filters = {};
            
            // Aggiungi filtri specifici
            if (req.query.specialNeeds !== undefined) {
                filters.specialNeeds = req.query.specialNeeds === 'true';
            }
            if (req.query.schoolId) {
                filters.schoolId = req.query.schoolId;
            }
            if (req.query.status) {
                filters.status = req.query.status;
            }
            if (req.query.search) {
                filters.$or = [
                    { firstName: { $regex: req.query.search, $options: 'i' } },
                    { lastName: { $regex: req.query.search, $options: 'i' } },
                    { email: { $regex: req.query.search, $options: 'i' } }
                ];
            }
    
            // Log dei filtri per debug
            logger.debug('Filtri applicati:', filters);
    
            try {
                const [total, students] = await Promise.all([
                    this.model.countDocuments(filters),
                    this.repository.findWithDetails(filters, {
                        skip,
                        limit,
                        sort: { createdAt: -1 }
                    })
                ]);
    
                logger.debug('Query results:', {
                    totalCount: total,
                    retrievedCount: students.length,
                    page,
                    limit
                });
    
                this.sendResponse(res, {
                    students,
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit)
                    }
                });
            } catch (error) {
                logger.error('Database operation error:', {
                    error: error.message,
                    stack: error.stack
                });
                throw error;
            }
        } catch (error) {
            logger.error('Error in getAll students:', error);
            next(error);
        }
    }

        // In StudentController, aggiungi questo metodo
    _buildFilters(query) {
        const filters = {};

        // Filtri base
        if (query.search) {
            filters.$or = [
                { firstName: { $regex: query.search, $options: 'i' } },
                { lastName: { $regex: query.search, $options: 'i' } },
                { email: { $regex: query.search, $options: 'i' } }
            ];
        }

        // Filtro per scuola
        if (query.schoolId) {
            filters.schoolId = new mongoose.Types.ObjectId(query.schoolId);
        }

        // Filtro per stato
        if (query.status) {
            filters.status = query.status;
        }

        // Filtro per bisogni speciali
        if (query.specialNeeds !== undefined) {
            filters.specialNeeds = query.specialNeeds === 'true';
        }

        // Filtro per classe (year e section)
        if (query.year && query.section) {
            filters['classId.year'] = parseInt(query.year);
            filters['classId.section'] = query.section;
        }

        return filters;
    }

    // In StudentController.js
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            
            const student = await Student.findById(id)
                .populate({
                    path: 'schoolId',
                    select: 'name schoolType institutionType region province'
                })
                .populate({
                    path: 'classId',
                    select: 'year section academicYear'
                });

            if (!student) {
                throw createError(
                    ErrorTypes.VALIDATION.NOT_FOUND,
                    'Studente non trovato'
                );
            }

            this.sendResponse(res, { student });
        } catch (error) {
            next(error);
        }
    }


    /**
     * Crea un nuovo studente - modificata dopo refactoring account studente
     * @override
     */
    async create(req, res) {
        try {
            // Log dell'inizio operazione
            logger.debug('Starting student creation:', { 
                requestBody: { ...req.body, email: '***' }
            });
    
            // Prepariamo i dati dello studente
            const studentData = {
                ...req.body,
                hasCredentials: false,
                credentialsSentAt: null,
                status: 'pending'
            };
    
            // Usiamo il repository invece del service
            const student = await this.repository.create(studentData);
            
            logger.info('Student created successfully:', { 
                studentId: student._id,
                email: '***'
            });
    
            // Usiamo direttamente la response invece di sendResponse
            return res.status(201).json({
                status: 'success',
                data: {
                    student // Il modello mongoose già "sanitizza" i dati sensibili
                }
            });
    
        } catch (error) {
            logger.error('Error creating student:', {
                error: error.message,
                stack: error.stack
            });
    
            // Gestiamo l'errore direttamente
            const statusCode = error.status || 500;
            const errorMessage = error.message || 'Internal Server Error';
            
            return res.status(statusCode).json({
                status: 'error',
                error: {
                    message: errorMessage
                }
            });
        }
    }

    /**
     * Crea uno studente e lo assegna direttamente a una classe
     */
    async createStudentWithClass(req, res, next) {
        try {
            const studentData = req.body;
            
            logger.debug('Creating student with class:', { 
                studentData: {...studentData, email: '***' }, // Nascondi l'email nei log
                user: req.user?.id
            });
    
            // Verifica permessi
            if (req.user.role !== 'admin') {
                throw createError(
                    ErrorTypes.AUTH.FORBIDDEN,
                    'Non autorizzato a creare studenti'
                );
            }
    
            // Usa il repository modificato che ora genera anche le credenziali
            const student = await this.repository.createWithClass(studentData);
            
            logger.info('Student created with class successfully:', {
                studentId: student._id,
                school: student.schoolId,
                class: student.classId,
                hasCredentials: student.hasCredentials
            });
    
            // Risposta per il frontend
            this.sendResponse(res, { 
                student,
                message: 'Studente creato e assegnato con successo'
            }, 201);
        } catch (error) {
            logger.error('Error in createStudentWithClass:', error);
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
            
            logger.debug('Getting unassigned students:', { 
                schoolId, 
                user: req.user?.id
            });
    
            const students = await this.repository.findUnassignedStudents(schoolId);
    
            logger.debug(`Found ${students?.length || 0} unassigned students`);
    
            // Struttura la risposta in modo consistente
            this.sendResponse(res, {
                status: 'success',
                data: {
                    students: students,
                    count: students.length
                }
            });
        } catch (error) {
            logger.error('Error getting unassigned students:', error);
            next(error);
        }
    }

    async getUnassignedToSchoolStudents(req, res, next) {
        try {
            logger.debug('Getting students without school:', { 
                user: req.user?.id
            });
    
            // Verifica permessi
            if (req.user.role !== 'admin') {
                throw createError(
                    ErrorTypes.AUTH.FORBIDDEN,
                    'Non autorizzato ad accedere a questa risorsa'
                );
            }
    
            const students = await this.repository.findUnassignedToSchoolStudents();
            
            this.sendResponse(res, { 
                students,
                count: students.length
            });
        } catch (error) {
            logger.error('Error getting unassigned to school students:', error);
            next(error);
        }
    }
    
// In studentController.js
async batchAssignToClass(req, res, next) {
    try {
        const { studentIds, classId, academicYear } = req.body;

        // 1. Validazione input
        if (!studentIds?.length || !classId || !academicYear) {
            throw createError(
                ErrorTypes.VALIDATION.BAD_REQUEST,
                'Dati mancanti per l\'assegnazione'
            );
        }

        logger.debug('Starting batch assignment:', {
            studentCount: studentIds.length,
            classId,
            academicYear,
            user: req.user?.id
        });

        // 2. Verifica permessi
        if (req.user.role !== 'admin') {
            throw createError(
                ErrorTypes.AUTH.FORBIDDEN,
                'Non autorizzato ad assegnare studenti'
            );
        }

        // 3. Chiama il repository con il formato corretto
        const result = await this.repository.batchAssignToClass(
            studentIds,
            {
                classId,
                academicYear
            }
        );

        // 4. Log del successo
        logger.info('Batch assignment completed:', {
            modifiedCount: result.modifiedCount,
            className: result.className,
            user: req.user?.id
        });

        // 5. Invia risposta
        this.sendResponse(res, {
            status: 'success',
            message: `${result.modifiedCount} studenti assegnati alla classe ${result.className}`,
            data: result
        });

    } catch (error) {
        logger.error('Error in batch assigning students:', {
            error,
            user: req.user?.id
        });

        next(createError(
            error.code || ErrorTypes.SYSTEM.OPERATION_FAILED,
            error.message || 'Errore nell\'assegnazione degli studenti',
            { originalError: error.message }
        ));
    }
}

    // Aggiungi questo metodo alla classe StudentController

async batchAssignToSchool(req, res, next) {
    try {
        const { studentIds, schoolId } = req.body;
console.log('Attempting to assign students:', {
            studentIds,
            schoolId,
            user: req.user?.id
        });
        // 1. Validazione input
        if (!studentIds?.length || !schoolId) {
            throw createError(
                ErrorTypes.VALIDATION.BAD_REQUEST,
                'Dati mancanti per l\'assegnazione'
            );
        }

        logger.debug('Starting batch school assignment:', {
            studentCount: studentIds.length,
            schoolId,
            user: req.user?.id
        });

        // 2. Verifica permessi
        if (req.user.role !== 'admin') {
            throw createError(
                ErrorTypes.AUTH.FORBIDDEN,
                'Non autorizzato ad assegnare studenti'
            );
        }

        // 3. Chiama il repository per l'assegnazione
        const result = await this.repository.batchAssignToSchool(
            studentIds,
            schoolId
        );

        // 4. Log del successo
        logger.info('Batch school assignment completed:', {
            modifiedCount: result.modifiedCount,
            schoolName: result.schoolName,
            user: req.user?.id
        });

        // 5. Invia risposta
        this.sendResponse(res, {
            status: 'success',
            message: `${result.modifiedCount} studenti assegnati alla scuola ${result.schoolName}`,
            data: {
                modifiedCount: result.modifiedCount,
                schoolName: result.schoolName
            }
        });

    } catch (error) {
        logger.error('Error in batch assigning students to school:', {
            error,
            user: req.user?.id
        });

        next(createError(
            error.code || ErrorTypes.SYSTEM.OPERATION_FAILED,
            error.message || 'Errore nell\'assegnazione degli studenti alla scuola',
            { originalError: error.message }
        ));
    }
}


/**
 * Conta gli studenti nelle classi specificate
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Next middleware function
 */
async countByClasses(req, res, next) {
    try {
        // Estrai e valida i parametri di input
        let { classIds } = req.query;
        
        // Converti il parametro in array se è una stringa
        if (typeof classIds === 'string') {
            classIds = classIds.split(',').filter(id => id.trim());
        }
        
        // Verifica che classIds sia un array valido
        if (!Array.isArray(classIds) || classIds.length === 0) {
            return this.sendResponse(res, { count: 0 });
        }
        
        logger.debug('Richiesta conteggio studenti per classi:', { 
            classIds,
            user: req.user?.id
        });
        
        // Esegui il conteggio usando il repository
        const count = await this.repository.countByClasses(classIds);
        
        // Invia la risposta
        this.sendResponse(res, { count });
    } catch (error) {
        logger.error('Errore nel conteggio studenti:', {
            error: error.message,
            stack: error.stack
        });
        next(error);
    }
}

}

module.exports = StudentController;




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