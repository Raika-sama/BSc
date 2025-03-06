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
            
            // Converti in JSON con opzioni specifiche per mantenere i valori originali
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
                raw: false,
                dateNF: 'DD/MM/YYYY',
                defval: null // Usa null per celle vuote invece di undefined
            });

            // Processa ogni riga per assicurarsi che i campi critici siano formattati correttamente
            const processedData = jsonData.map(row => ({
                ...row,
                // Standardizza i nomi dei campi (permette colonne in italiano o inglese)
                firstName: row.firstName || row.nome || row.Nome || null,
                lastName: row.lastName || row.cognome || row.Cognome || null,
                email: row.email || row.Email || null,
                gender: row.gender || row.genere || row.Genere || null,
                dateOfBirth: row.dateOfBirth || row['data di nascita'] || row['Data di Nascita'] || null,
                parentEmail: row.parentEmail || row['email genitore'] || row['Email Genitore'] || null,
                fiscalCode: row.fiscalCode || row['codice fiscale'] || row['Codice Fiscale'] || null,
                
                // Formatta correttamente i campi
                firstName: row.firstName ? String(row.firstName).trim() : null,
                lastName: row.lastName ? String(row.lastName).trim() : null,
                email: row.email ? String(row.email).trim().toLowerCase() : null,
                parentEmail: row.parentEmail ? String(row.parentEmail).trim().toLowerCase() : null,
                fiscalCode: row.fiscalCode ? String(row.fiscalCode).trim().toUpperCase() : null,
                
                // Gestisci correttamente i campi per la classe
                year: row.year || row.anno || row.Anno || null,
                section: row.section || row.sezione || row.Sezione || null,
                classId: row.classId ? String(row.classId).trim() : null,

                // Normalizza i valori booleani
                specialNeeds: row.specialNeeds === true || 
                             row.specialNeeds === 'true' || 
                             row.specialNeeds === '1' || 
                             row.specialNeeds === 'SI' || 
                             row.specialNeeds === 'SÌ' || 
                             row.specialNeeds === 'YES',
            }));

            logger.debug('Excel data parsed:', {
                rowCount: processedData.length,
                sampleRow: processedData[0],
                hasClassIds: processedData.some(row => row.classId),
                hasYearSection: processedData.some(row => row.year && row.section)
            });

            return processedData;
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
                withClassIds: students.filter(s => s.classId).length,
                withYearSection: students.filter(s => s.year && s.section).length
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

            try {
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
                // Gestisci errori specifici dal repository 
                if (error.code && error.code === ErrorTypes.VALIDATION.BAD_REQUEST.code) {
                    // Errore di validazione con dettagli
                    logger.warn('Validation error in bulk import:', {
                        message: error.message,
                        details: error.metadata?.details || []
                    });

                    this.sendError(res, {
                        statusCode: 400,
                        message: error.message,
                        details: error.metadata?.details || []
                    });
                    return;
                }
                
                if (error.code && error.code === ErrorTypes.VALIDATION.ALREADY_EXISTS.code) {
                    // Errore per email duplicata
                    logger.warn('Duplicate email error in bulk import:', {
                        message: error.message,
                        details: error.metadata?.duplicateKey
                    });

                    this.sendError(res, {
                        statusCode: 400,
                        message: error.message,
                        details: error.metadata?.details || ['Email già presente nel sistema']
                    });
                    return;
                }
                
                // Rilancia altri errori per essere gestiti dal gestore globale
                throw error;
            }

        } catch (error) {
            logger.error('Error in bulk import with class controller:', {
                error: error.message,
                stack: error.stack
            });

            // Gestisci errori non gestiti sopra
            const statusCode = error.code ? (error.code >= 400 && error.code < 600 ? error.code : 500) : 500;
            const message = error.message || 'Errore durante l\'import degli studenti';
            
            this.sendError(res, {
                statusCode,
                message,
                details: error.metadata?.details || []
            });
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