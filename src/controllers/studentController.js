const BaseController = require('./baseController');
const { student: StudentRepository } = require('../repositories');
const logger = require('../utils/errors/logger/logger');

class StudentController extends BaseController {
    constructor() {
        super(StudentRepository, 'student');
        // Binding dei metodi
        this.getAll = this.getAll.bind(this);
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
        const { classId, section, year, reason } = req.body;

        // 1. Validazione input
        if (!classId && !section && !year) {
            return this.sendError(res, {
                statusCode: 400,
                message: 'È necessario specificare almeno classId, section o year',
                code: 'INVALID_ASSIGNMENT_PARAMS'
            });
        }

        // 2. Recupera studente e scuola
        const student = await this.repository.findById(studentId).populate('schoolId');
        if (!student) {
            return this.sendError(res, {
                statusCode: 404,
                message: 'Studente non trovato',
                code: 'STUDENT_NOT_FOUND'
            });
        }

        const school = student.schoolId;
        const maxYear = school.schoolType === 'middle_school' ? 3 : 5;

        // 3. Validazione anno scolastico
        if (year) {
            // Verifica che l'anno sia valido per il tipo di scuola
            if (year < 1 || year > maxYear) {
                return this.sendError(res, {
                    statusCode: 400,
                    message: `Anno non valido per ${school.schoolType === 'middle_school' ? 'scuola media' : 'scuola superiore'} (max: ${maxYear})`,
                    code: 'INVALID_YEAR'
                });
            }

            // Verifica che non si stia saltando più di un anno
            if (year > student.currentYear + 1) {
                return this.sendError(res, {
                    statusCode: 400,
                    message: 'Non è possibile saltare più di un anno scolastico',
                    code: 'INVALID_YEAR_ADVANCEMENT'
                });
            }
        }

        // 4. Validazione sezione
        if (section) {
            // Verifica che la sezione esista nella scuola
            if (!school.sections.includes(section)) {
                return this.sendError(res, {
                    statusCode: 400,
                    message: 'Sezione non valida per questa scuola',
                    code: 'INVALID_SECTION'
                });
            }
        }

        // 5. Se viene fornito un classId, verifica che la classe esista
        let targetClass;
        if (classId) {
            targetClass = await this.repository.findClass(classId);
            if (!targetClass) {
                return this.sendError(res, {
                    statusCode: 404,
                    message: 'Classe di destinazione non trovata',
                    code: 'CLASS_NOT_FOUND'
                });
            }

            // Verifica che la classe sia nella stessa scuola
            if (targetClass.schoolId.toString() !== student.schoolId._id.toString()) {
                return this.sendError(res, {
                    statusCode: 400,
                    message: 'Non è possibile assegnare uno studente a una classe di un\'altra scuola',
                    code: 'INVALID_SCHOOL_ASSIGNMENT'
                });
            }
        }

        // 6. Prepara i dati per l'aggiornamento
        const updateData = {
            classId: classId || student.classId,
            section: section || student.section,
            currentYear: year || student.currentYear,
            mainTeacher: targetClass ? targetClass.mainTeacher : student.mainTeacher,
            teachers: targetClass ? targetClass.teachers : student.teachers,
            lastClassChangeDate: new Date(),
            $push: {
                classChangeHistory: {
                    fromClass: student.classId,
                    toClass: classId || student.classId,
                    fromSection: student.section,
                    toSection: section || student.section,
                    fromYear: student.currentYear,
                    toYear: year || student.currentYear,
                    date: new Date(),
                    reason: reason || 'Cambio classe/sezione'
                }
            }
        };

        // 7. Esegui l'aggiornamento
        const updatedStudent = await this.repository.update(studentId, updateData);

        // 8. Log dell'operazione
        logger.info('Studente assegnato a nuova classe', {
            studentId,
            oldClass: student.classId,
            newClass: updateData.classId,
            oldSection: student.section,
            newSection: updateData.section,
            oldYear: student.currentYear,
            newYear: updateData.currentYear,
            schoolType: school.schoolType
        });

        // 9. Invia risposta
        this.sendResponse(res, { 
            student: updatedStudent,
            message: 'Studente assegnato con successo alla nuova classe'
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