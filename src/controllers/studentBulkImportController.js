// src/controllers/studentBulkImportController.js

const BaseController = require('./baseController');
const studentBulkImportRepository = require('../repositories/StudentBulkImportRepository');
const bulkImportValidation = require('../middleware/bulkImportValidation');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const XLSX = require('xlsx');

class StudentBulkImportController extends BaseController {
    constructor(studentBulkImportRepository) {
        super(studentBulkImportRepository);
        if (!studentBulkImportRepository) throw new Error('StudentBulkImportRepository is required');
        this.repository = studentBulkImportRepository;
    }

    /**
     * Legge e parsa il file Excel
     * @private
     * @param {Buffer} buffer - Buffer del file Excel
     * @returns {Array} - Array di oggetti JSON dal file Excel
     */
    _parseExcelFile(buffer) {
        try {
            // Leggi il file Excel con tutte le opzioni
            const workbook = XLSX.read(buffer, {
                type: 'buffer',
                cellDates: true,
                dateNF: 'DD/MM/YYYY'
            });

            // Prendi il primo foglio
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            
            // Converti in JSON
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
                raw: false,
                dateNF: 'DD/MM/YYYY'
            });

            return jsonData;
        } catch (error) {
            logger.error('Error parsing Excel file:', error);
            throw createError(
                ErrorTypes.VALIDATION.BAD_REQUEST,
                'Errore nella lettura del file Excel'
            );
        }
    }

    /**
     * Gestisce l'import massivo degli studenti dal file Excel
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async bulkImport(req, res, next) {
        try {
            logger.debug('Starting bulk import process');

            // Verifica presenza file e schoolId
            if (!req.file) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'File Excel richiesto'
                );
            }

            const { schoolId } = req.body;
            if (!schoolId) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'ID scuola richiesto'
                );
            }

            // Parsa il file Excel
            const studentsData = this._parseExcelFile(req.file.buffer);
            logger.debug('Excel file parsed', { 
                rowCount: studentsData.length 
            });

            // Valida i dati
            await bulkImportValidation.validateImportData(studentsData, schoolId);

            // Esegui l'import
            const result = await this.repository.bulkImport(studentsData, schoolId);

            // Invia la risposta
            this.sendResponse(res, {
                message: 'Import completato con successo',
                data: {
                    imported: result.imported,
                    failed: result.failed,
                    errors: result.errors
                }
            });

        } catch (error) {
            logger.error('Error in bulk import controller:', {
                error: error.message,
                stack: error.stack
            });

            // Se è un errore di validazione, mantieni i dettagli
            if (error.code === ErrorTypes.VALIDATION.BAD_REQUEST.code) {
                this.sendError(res, {
                    statusCode: 400,
                    message: error.message,
                    details: error.metadata?.details
                });
                return;
            }

            next(error);
        }
    }

    /**
     * Gestisce l'import massivo degli studenti con assegnazione classe
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async bulkImportWithClass(req, res, next) {
        try {
            logger.debug('Starting bulk import with class process');

            // Verifica presenza dei dati necessari
            const { students, schoolId } = req.body;
            
            if (!Array.isArray(students) || students.length === 0) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Lista studenti richiesta'
                );
            }

            if (!schoolId) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'ID scuola richiesto'
                );
            }

            logger.debug('Students data received', { 
                count: students.length,
                withClassIds: students.filter(s => s.classId).length
            });

            // Valida i dati (senza validazione pesante come per il file Excel)
            // Questa validazione leggera è possibile perché i dati sono già stati validati nel frontend
            const invalidStudents = students.filter(s => !s.firstName || !s.lastName || !s.email);
            if (invalidStudents.length > 0) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Alcuni studenti non hanno i campi obbligatori',
                    { 
                        details: invalidStudents.map(s => `${s.firstName || ''} ${s.lastName || ''} - dati incompleti`) 
                    }
                );
            }

            // Esegui l'import con assegnazione classe
            const result = await this.repository.bulkImportWithClass(students, schoolId);

            // Invia la risposta
            this.sendResponse(res, {
                message: 'Import completato con successo',
                data: {
                    imported: result.imported,
                    failed: result.failed,
                    errors: result.errors
                }
            });

        } catch (error) {
            logger.error('Error in bulk import with class controller:', {
                error: error.message,
                stack: error.stack
            });

            // Se è un errore di validazione, mantieni i dettagli
            if (error.code === ErrorTypes.VALIDATION.BAD_REQUEST.code) {
                this.sendError(res, {
                    statusCode: 400,
                    message: error.message,
                    details: error.metadata?.details
                });
                return;
            }

            next(error);
        }
    }

    /**
     * Genera il template Excel per l'import
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    generateTemplate(req, res) {
        try {
            logger.debug('Generating Excel template');
            // Crea il workbook
            const wb = XLSX.utils.book_new();
            
            // Prepara i dati del template (versione aggiornata con anno e sezione)
            const templateData = [{
                firstName: 'Mario',
                lastName: 'Rossi',
                gender: 'M',
                dateOfBirth: '01/01/1990',
                email: 'mario.rossi@email.com',
                fiscalCode: 'RSSMRA90A01H501A',
                parentEmail: 'genitore@email.com',
                specialNeeds: 'NO',
                year: '1',             // Anno scolastico (opzionale)
                section: 'A'           // Sezione (opzionale)
            }];

            // Crea il worksheet
            const ws = XLSX.utils.json_to_sheet(templateData);

            // Aggiungi il foglio al workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Template');

            // Invia il file
            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=template_studenti.xlsx');
            res.send(buffer);

        } catch (error) {
            logger.error('Error generating template:', error);
            this.sendError(res, {
                statusCode: 500,
                message: 'Errore nella generazione del template'
            });
        }
    }
}

module.exports = StudentBulkImportController;