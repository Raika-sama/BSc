// src/controllers/yearTransitionController.js
const mongoose = require('mongoose');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const { School, Class, Student } = require('../models');

/**
 * Controller specializzato per gestire la transizione tra anni accademici
 */
class YearTransitionController {
  /**
   * Gestisce la preview della transizione tra anni accademici
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getTransitionPreview(req, res, next) {
    try {
      logger.debug('Starting year transition preview', {
        userId: req.user.id,
        schoolId: req.params.schoolId,
        fromYear: req.query.fromYear,
        toYear: req.query.toYear
      });
      
      const { schoolId } = req.params;
      const { fromYear, toYear } = req.query;
      
      // Validazione input
      if (!schoolId || !fromYear || !toYear) {
        throw createError(
          ErrorTypes.VALIDATION.BAD_REQUEST,
          'Mancano parametri richiesti: schoolId, fromYear, toYear'
        );
      }
      
      // Verifica formato anni accademici
      const yearFormat = /^\d{4}\/\d{4}$/;
      if (!yearFormat.test(fromYear) || !yearFormat.test(toYear)) {
        throw createError(
          ErrorTypes.VALIDATION.BAD_REQUEST,
          'Formato anno non valido. Deve essere YYYY/YYYY'
        );
      }
      
      // 1. Trova la scuola
      const school = await School.findById(schoolId);
      if (!school) {
        throw createError(
          ErrorTypes.RESOURCE.NOT_FOUND,
          'Scuola non trovata'
        );
      }
      
      // 2. Verifica che gli anni siano validi
      const fromYearExists = school.academicYears.some(y => y.year === fromYear);
      const toYearExists = school.academicYears.some(y => y.year === toYear);
      
      if (!fromYearExists || !toYearExists) {
        throw createError(
          ErrorTypes.VALIDATION.BAD_REQUEST,
          'Uno o entrambi gli anni accademici non esistono per questa scuola'
        );
      }
      
      // 3. Trova le classi dell'anno di partenza
      const currentClasses = await Class.find({
        schoolId,
        academicYear: fromYear,
        isActive: true
      }).populate('mainTeacher', 'firstName lastName email')
      .lean();
      
      logger.debug('Found current classes', {
        count: currentClasses.length,
        schoolId,
        academicYear: fromYear
      });
      
      // 4. Trova le classi dell'anno di destinazione (già create in precedenza)
      const newClasses = await Class.find({
        schoolId,
        academicYear: toYear,
        isActive: true
      }).populate('mainTeacher', 'firstName lastName email')
      .lean();
      
      logger.debug('Found new classes', {
        count: newClasses.length,
        schoolId,
        academicYear: toYear
      });
      
      // 5. Formatta le classi per il frontend
      const formattedCurrentClasses = currentClasses.map(cls => ({
        id: cls._id.toString(),
        year: cls.year,
        section: cls.section,
        students: cls.students || [],
        mainTeacher: cls.mainTeacher?._id?.toString(),
        mainTeacherName: cls.mainTeacher ? `${cls.mainTeacher.firstName || ''} ${cls.mainTeacher.lastName || ''}` : null,
        mainTeacherEmail: cls.mainTeacher?.email,
        status: cls.status
      }));
      
      const formattedNewClasses = newClasses.map(cls => ({
        id: cls._id.toString(),
        year: cls.year,
        section: cls.section,
        studentCount: 0, // Sarà calcolato in base agli studenti promossi
        mainTeacher: cls.mainTeacher?._id?.toString(),
        mainTeacherName: cls.mainTeacher ? `${cls.mainTeacher.firstName || ''} ${cls.mainTeacher.lastName || ''}` : null,
        mainTeacherEmail: cls.mainTeacher?.email,
        status: cls.status
      }));
      
      // 6. Trova tutti gli studenti attivi nell'anno corrente
      const students = await Student.find({
        schoolId,
        classId: { $in: currentClasses.map(c => c._id) },
        status: 'active'
      }).lean();
      
      logger.debug('Found students', {
        count: students.length,
        schoolId
      });
      
      // 7. Determina la promozione standard degli studenti
      const promotedStudents = [];
      const graduatingStudents = [];
      const warnings = [];
      
      // Crea una mappa delle classi correnti per lookup veloce
      const currentClassesMap = {};
      formattedCurrentClasses.forEach(cls => {
        currentClassesMap[cls.id] = cls;
      });
      
      // Crea una mappa delle nuove classi per lookup veloce
      const newClassesMap = {};
      formattedNewClasses.forEach(cls => {
        // Crea la chiave nel formato "year-section"
        const key = `${cls.year}-${cls.section}`;
        newClassesMap[key] = cls;
      });
      
      students.forEach(student => {
        const currentClass = currentClassesMap[student.classId.toString()];
        if (!currentClass) {
          warnings.push({
            message: `Lo studente ${student.firstName} ${student.lastName} non ha una classe valida`,
            details: `ID classe non trovato: ${student.classId}`,
            studentId: student._id.toString()
          });
          return;
        }
        
        const currentYear = currentClass.year;
        const currentSection = currentClass.section;
        
        // Determina se lo studente si diploma (ultimo anno)
        const maxYear = school.schoolType === 'middle_school' ? 3 : 5;
        
        if (currentYear >= maxYear) {
          // Lo studente si diploma o esce dal sistema
          graduatingStudents.push({
            id: student._id.toString(),
            firstName: student.firstName,
            lastName: student.lastName,
            currentYear,
            currentSection,
            status: 'graduated',
            classId: student.classId.toString()
          });
        } else {
          // Lo studente viene promosso all'anno successivo
          const newYear = currentYear + 1;
          const newSection = currentSection; // Mantiene la stessa sezione di default
          
          // Verifica che la classe di destinazione esista
          const newClassKey = `${newYear}-${newSection}`;
          const destinationClass = newClassesMap[newClassKey];
          
          if (!destinationClass) {
            warnings.push({
              message: `Impossibile promuovere lo studente ${student.firstName} ${student.lastName}`,
              details: `Classe destinazione ${newYear}${newSection} non trovata`,
              studentId: student._id.toString()
            });
            return;
          }
          
          // Incrementa il conteggio degli studenti nella classe di destinazione
          destinationClass.studentCount++;
          
          promotedStudents.push({
            id: student._id.toString(),
            firstName: student.firstName,
            lastName: student.lastName,
            currentYear,
            currentSection,
            newYear,
            newSection,
            classId: student.classId.toString(),
            newClassId: destinationClass.id
          });
        }
      });
      
      // 8. Prepara i dati di anteprima
      const previewData = {
        currentClasses: formattedCurrentClasses,
        newClasses: formattedNewClasses,
        promotedStudents,
        graduatingStudents,
        warnings
      };
      
      // 9. Invia la risposta
      res.status(200).json({
        status: 'success',
        data: previewData
      });
      
    } catch (error) {
      logger.error('Error in year transition preview', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * Esegue la transizione tra anni accademici
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async executeYearTransition(req, res, next) {
    // Avvia una sessione di transazione per garantire l'atomicità delle operazioni
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      logger.debug('Starting year transition execution', {
        userId: req.user.id,
        schoolId: req.params.schoolId,
        body: req.body
      });
      
      const { schoolId } = req.params;
      const { fromYear, toYear, exceptions = [], teacherAssignments = {} } = req.body;
      
      // Validazione input
      if (!schoolId || !fromYear || !toYear) {
        throw createError(
          ErrorTypes.VALIDATION.BAD_REQUEST,
          'Mancano parametri richiesti: schoolId, fromYear, toYear'
        );
      }
      
      // Verifica formato anni accademici
      const yearFormat = /^\d{4}\/\d{4}$/;
      if (!yearFormat.test(fromYear) || !yearFormat.test(toYear)) {
        throw createError(
          ErrorTypes.VALIDATION.BAD_REQUEST,
          'Formato anno non valido. Deve essere YYYY/YYYY'
        );
      }
      
      // 1. Trova la scuola
      const school = await School.findById(schoolId).session(session);
      if (!school) {
        throw createError(
          ErrorTypes.RESOURCE.NOT_FOUND,
          'Scuola non trovata'
        );
      }
      
      // 2. Verifica che gli anni siano validi
      const fromYearData = school.academicYears.find(y => y.year === fromYear);
      const toYearData = school.academicYears.find(y => y.year === toYear);
      
      if (!fromYearData || !toYearData) {
        throw createError(
          ErrorTypes.VALIDATION.BAD_REQUEST,
          'Uno o entrambi gli anni accademici non esistono per questa scuola'
        );
      }
      
      // 3. Aggiorna gli stati degli anni accademici
      if (fromYearData.status === 'active') {
        fromYearData.status = 'archived';
      }
      
      toYearData.status = 'active';
      
      await school.save({ session });
      
      // 4. Trova le classi dell'anno corrente
      const currentClasses = await Class.find({
        schoolId,
        academicYear: fromYear,
        isActive: true
      }).session(session);
      
      // 5. Trova le classi del nuovo anno
      const newClasses = await Class.find({
        schoolId,
        academicYear: toYear,
        isActive: true
      }).session(session);
      
      // 6. Crea mappa delle eccezioni per lookup veloce
      const exceptionsMap = {};
      exceptions.forEach(exception => {
        exceptionsMap[exception.studentId] = exception;
      });
      
      // 7. Trova tutti gli studenti attivi nell'anno corrente
      const students = await Student.find({
        schoolId,
        classId: { $in: currentClasses.map(c => c._id) },
        status: 'active'
      }).session(session);
      
      // 8. Crea mappe per lookup veloce
      // Mappa delle classi correnti per ID
      const currentClassesMap = {};
      currentClasses.forEach(cls => {
        currentClassesMap[cls._id.toString()] = cls;
      });
      
      // Mappa delle nuove classi per anno e sezione
      const newClassesMap = {};
      newClasses.forEach(cls => {
        const key = `${cls.year}-${cls.section}`;
        newClassesMap[key] = cls;
      });
      
      // Mappa delle nuove classi per ID
      const newClassesById = {};
      newClasses.forEach(cls => {
        newClassesById[cls._id.toString()] = cls;
      });
      
      // 9. Gestisci ogni studente in base alle regole di promozione o eccezioni
      const maxYear = school.schoolType === 'middle_school' ? 3 : 5;
      const studentOperations = [];
      const classStudentUpdates = {};
      
      students.forEach(student => {
        const studentId = student._id.toString();
        const currentClass = currentClassesMap[student.classId.toString()];
        
        if (!currentClass) {
          logger.warn('Student has invalid class', {
            studentId,
            classId: student.classId
          });
          return;
        }
        
        const currentYear = currentClass.year;
        const currentSection = currentClass.section;
        
        // Controlla se lo studente ha un'eccezione
        if (exceptionsMap[studentId]) {
          const exception = exceptionsMap[studentId];
          
          switch (exception.type) {
            case 'retained': // Bocciato (rimane nello stesso anno/sezione)
              // Cerca la classe corrispondente nel nuovo anno accademico
              const retainedClassKey = `${currentYear}-${currentSection}`;
              const retainedClass = newClassesMap[retainedClassKey];
              
              if (retainedClass) {
                // Aggiorna lo studente
                student.classId = retainedClass._id;
                student.lastClassChangeDate = new Date();
                
                // Aggiungi al classChangeHistory
                student.classChangeHistory.push({
                  fromClass: currentClass._id,
                  toClass: retainedClass._id,
                  fromYear: currentYear,
                  toYear: currentYear, // Stesso anno (bocciato)
                  fromSection: currentSection,
                  toSection: currentSection,
                  date: new Date(),
                  reason: exception.reason || 'Bocciatura',
                  academicYear: toYear
                });
                
                // Aggiungi alla mappa degli aggiornamenti della classe
                if (!classStudentUpdates[retainedClass._id]) {
                  classStudentUpdates[retainedClass._id] = [];
                }
                
                classStudentUpdates[retainedClass._id].push({
                  studentId: student._id,
                  joinedAt: new Date(),
                  status: 'active'
                });
              } else {
                logger.error('Retained class not found', {
                  studentId,
                  year: currentYear,
                  section: currentSection
                });
              }
              break;
              
            case 'section_change': // Cambio sezione (stesso anno ma sezione diversa)
              const sectionChangeClassKey = `${currentYear}-${exception.destinationSection}`;
              const sectionChangeClass = newClassesMap[sectionChangeClassKey];
              
              if (sectionChangeClass) {
                // Aggiorna lo studente
                student.classId = sectionChangeClass._id;
                student.section = exception.destinationSection;
                student.lastClassChangeDate = new Date();
                
                // Aggiungi al classChangeHistory
                student.classChangeHistory.push({
                  fromClass: currentClass._id,
                  toClass: sectionChangeClass._id,
                  fromYear: currentYear,
                  toYear: currentYear, // Stesso anno (cambio sezione)
                  fromSection: currentSection,
                  toSection: exception.destinationSection,
                  date: new Date(),
                  reason: exception.reason || 'Cambio sezione',
                  academicYear: toYear
                });
                
                // Aggiungi alla mappa degli aggiornamenti della classe
                if (!classStudentUpdates[sectionChangeClass._id]) {
                  classStudentUpdates[sectionChangeClass._id] = [];
                }
                
                classStudentUpdates[sectionChangeClass._id].push({
                  studentId: student._id,
                  joinedAt: new Date(),
                  status: 'active'
                });
              } else {
                logger.error('Section change class not found', {
                  studentId,
                  year: currentYear,
                  section: exception.destinationSection
                });
              }
              break;
              
            case 'custom': // Destinazione personalizzata
              const customClassKey = `${exception.destinationYear}-${exception.destinationSection}`;
              const customClass = newClassesMap[customClassKey];
              
              if (customClass) {
                // Aggiorna lo studente
                student.classId = customClass._id;
                student.section = exception.destinationSection;
                student.lastClassChangeDate = new Date();
                
                // Aggiungi al classChangeHistory
                student.classChangeHistory.push({
                  fromClass: currentClass._id,
                  toClass: customClass._id,
                  fromYear: currentYear,
                  toYear: exception.destinationYear,
                  fromSection: currentSection,
                  toSection: exception.destinationSection,
                  date: new Date(),
                  reason: exception.reason || 'Destinazione personalizzata',
                  academicYear: toYear
                });
                
                // Aggiungi alla mappa degli aggiornamenti della classe
                if (!classStudentUpdates[customClass._id]) {
                  classStudentUpdates[customClass._id] = [];
                }
                
                classStudentUpdates[customClass._id].push({
                  studentId: student._id,
                  joinedAt: new Date(),
                  status: 'active'
                });
              } else {
                logger.error('Custom destination class not found', {
                  studentId,
                  year: exception.destinationYear,
                  section: exception.destinationSection
                });
              }
              break;
              
            case 'transferred': // Trasferito (esce dalla scuola)
              // Aggiorna lo studente
              student.classId = null;
              student.section = null;
              student.status = 'transferred';
              student.lastClassChangeDate = new Date();
              
              // Aggiungi al classChangeHistory
              student.classChangeHistory.push({
                fromClass: currentClass._id,
                toClass: null,
                fromYear: currentYear,
                toYear: null,
                fromSection: currentSection,
                toSection: null,
                date: new Date(),
                reason: exception.reason || 'Trasferito',
                academicYear: fromYear // Usa l'anno corrente perché il trasferimento avviene prima del nuovo anno
              });
              break;
          }
        } else if (currentYear >= maxYear) {
          // Studente all'ultimo anno senza eccezioni: diploma automatico
          student.classId = null;
          student.section = null;
          student.status = 'graduated';
          student.lastClassChangeDate = new Date();
          
          // Aggiungi al classChangeHistory
          student.classChangeHistory.push({
            fromClass: currentClass._id,
            toClass: null,
            fromYear: currentYear,
            toYear: null,
            fromSection: currentSection,
            toSection: null,
            date: new Date(),
            reason: 'Diplomato',
            academicYear: fromYear
          });
        } else {
          // Promozione standard: passa all'anno successivo, stessa sezione
          const newYear = currentYear + 1;
          const newSection = currentSection;
          const newClassKey = `${newYear}-${newSection}`;
          const newClass = newClassesMap[newClassKey];
          
          if (newClass) {
            // Aggiorna lo studente
            student.classId = newClass._id;
            student.lastClassChangeDate = new Date();
            
            // Aggiungi al classChangeHistory
            student.classChangeHistory.push({
              fromClass: currentClass._id,
              toClass: newClass._id,
              fromYear: currentYear,
              toYear: newYear,
              fromSection: currentSection,
              toSection: newSection,
              date: new Date(),
              reason: 'Promozione standard',
              academicYear: toYear
            });
            
            // Aggiungi alla mappa degli aggiornamenti della classe
            if (!classStudentUpdates[newClass._id]) {
              classStudentUpdates[newClass._id] = [];
            }
            
            classStudentUpdates[newClass._id].push({
              studentId: student._id,
              joinedAt: new Date(),
              status: 'active'
            });
          } else {
            logger.error('Promotion class not found', {
              studentId,
              year: newYear,
              section: newSection
            });
          }
        }
        
        // Aggiungi lo studente alla lista di operazioni da salvare
        studentOperations.push(student.save({ session }));
      });
      
      // 10. Salva tutti gli studenti aggiornati
      await Promise.all(studentOperations);
      
      // 11. Aggiorna le classi con le assegnazioni docenti
      const classTeacherUpdates = [];
      
      // Itera sulle assegnazioni docenti
      Object.entries(teacherAssignments).forEach(([classId, teacherId]) => {
        if (newClassesById[classId]) {
          classTeacherUpdates.push(
            Class.findByIdAndUpdate(
              classId,
              { 
                $set: { 
                  mainTeacher: teacherId,
                  mainTeacherIsTemporary: false
                }
              },
              { session }
            )
          );
        }
      });
      
      // Esegui gli aggiornamenti docenti
      await Promise.all(classTeacherUpdates);
      
      // 12. Aggiorna le classi con gli studenti
      const classStudentOps = [];
      
      Object.entries(classStudentUpdates).forEach(([classId, students]) => {
        classStudentOps.push(
          Class.findByIdAndUpdate(
            classId,
            { $set: { students: students } },
            { session }
          )
        );
      });
      
      await Promise.all(classStudentOps);
      
      // 13. Archivia le classi dell'anno vecchio
      await Class.updateMany(
        {
          schoolId,
          academicYear: fromYear,
          isActive: true
        },
        {
          $set: {
            status: 'archived',
            'students.$[].status': 'transferred'
          }
        },
        { session }
      );
      
      // 14. Commit della transazione
      await session.commitTransaction();
      
      // 15. Invia la risposta
      res.status(200).json({
        status: 'success',
        message: 'Transizione anno completata con successo',
        data: {
          fromYear,
          toYear,
          studentsProcessed: students.length,
          exceptionsApplied: exceptions.length
        }
      });
      
    } catch (error) {
      // Rollback in caso di errore
      await session.abortTransaction();
      
      logger.error('Error in year transition execution', {
        error: error.message,
        stack: error.stack
      });
      
      next(error);
    } finally {
      // Chiudi la sessione
      session.endSession();
    }
  }
}

module.exports = YearTransitionController;
