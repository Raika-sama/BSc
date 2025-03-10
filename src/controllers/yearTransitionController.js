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
      
      // 4. Trova le classi dell'anno di destinazione (già esistenti)
      const existingNewClasses = await Class.find({
        schoolId,
        academicYear: toYear,
        isActive: true
      }).populate('mainTeacher', 'firstName lastName email')
      .lean();
      
      logger.debug('Found existing classes in target year', {
        count: existingNewClasses.length,
        schoolId,
        academicYear: toYear
      });
      
      // 5. Analizza quali classi devono esistere nel nuovo anno
      // Raccogli tutte le sezioni esistenti
      const sections = new Set();
      currentClasses.forEach(cls => {
        sections.add(cls.section);
      });
      
      // Aggiungi anche le sezioni che potrebbero già esistere nel nuovo anno
      existingNewClasses.forEach(cls => {
        sections.add(cls.section);
      });
      
      // Determina quali classi devono essere create nel nuovo anno
      const requiredNewClasses = [];
      const existingClassesMap = {};
      
      // Crea una mappa delle classi che già esistono nel nuovo anno (per lookup veloce)
      existingNewClasses.forEach(cls => {
        const key = `${cls.year}-${cls.section}`;
        existingClassesMap[key] = cls;
      });
      
      // Calcola il massimo livello in base al tipo di scuola
      const maxYear = school.schoolType === 'middle_school' ? 3 : 5;
      
      // Per ogni sezione e anno, prevedi le classi da creare
      sections.forEach(section => {
        // Per il primo anno, crea sempre una classe (le nuove matricole)
        const firstYearKey = `1-${section}`;
        if (!existingClassesMap[firstYearKey]) {
          requiredNewClasses.push({
            id: new mongoose.Types.ObjectId().toString(), // Corretto: uso del new operator
            year: 1,
            section: section,
            isNew: true,
            studentCount: 0, // Sarà determinato dalle iscrizioni
            status: 'pending',
            type: 'new_enrollment'
          });
        }
        
        // Per gli altri anni, prevedi le promozioni dalle classi attuali
        currentClasses.forEach(currentClass => {
          if (currentClass.section === section && currentClass.year < maxYear) {
            const nextYear = currentClass.year + 1;
            const newClassKey = `${nextYear}-${section}`;
            
            // Verifica se la classe nel nuovo anno esiste già
            if (!existingClassesMap[newClassKey]) {
              requiredNewClasses.push({
                id: new mongoose.Types.ObjectId().toString(), // Corretto: uso del new operator
                year: nextYear,
                section: section,
                isNew: true,
                studentCount: 0, // Sarà calcolato in base agli studenti promossi
                mainTeacher: currentClass.mainTeacher ? {
                  id: currentClass.mainTeacher._id,
                  name: `${currentClass.mainTeacher.firstName || ''} ${currentClass.mainTeacher.lastName || ''}`,
                  email: currentClass.mainTeacher.email
                } : null,
                status: 'pending',
                type: 'promotion',
                sourceClassId: currentClass._id.toString()
              });
            }
          }
        });
      });
      
      // 6. Unisci le classi esistenti e quelle da creare per avere un quadro completo
      const allNewClasses = [
        ...existingNewClasses.map(cls => ({
          id: cls._id.toString(),
          year: cls.year,
          section: cls.section,
          isNew: false,
          studentCount: cls.students?.length || 0,
          mainTeacher: cls.mainTeacher ? {
            id: cls.mainTeacher._id.toString(),
            name: `${cls.mainTeacher.firstName || ''} ${cls.mainTeacher.lastName || ''}`,
            email: cls.mainTeacher.email
          } : null,
          status: cls.status
        })),
        ...requiredNewClasses
      ];
      
      // 7. Formatta le classi correnti per il frontend
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
      
      // 8. Trova tutti gli studenti attivi nell'anno corrente
      const students = await Student.find({
        schoolId,
        classId: { $in: currentClasses.map(c => c._id) },
        status: 'active'
      }).lean();
      
      logger.debug('Found students', {
        count: students.length,
        schoolId
      });
      
      // 9. Determina la promozione standard degli studenti
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
      allNewClasses.forEach(cls => {
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
              details: `Classe destinazione ${newYear}-${newSection} non trovata`,
              studentId: student._id.toString()
            });
            return;
          }
          
          // Incrementa il conteggio degli studenti nella classe di destinazione
          destinationClass.studentCount = (destinationClass.studentCount || 0) + 1;
          
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
      
      // 10. Prepara i dati di anteprima
      const previewData = {
        currentClasses: formattedCurrentClasses,
        newClasses: allNewClasses,
        promotedStudents,
        graduatingStudents,
        warnings
      };
      
      // 11. Invia la risposta
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
      const { 
        fromYear, 
        toYear, 
        exceptions = [], 
        teacherAssignments = {},
        newClasses = [] // array di classi da creare
      } = req.body;
      
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
      
      // 3. Crea le nuove classi necessarie per il nuovo anno
      const createdClassesIds = {};
      const classCreationOperations = [];
      
      for (const newClass of newClasses) {
        if (newClass.isNew) { // Solo se è una nuova classe da creare
          const classData = {
            year: newClass.year,
            section: newClass.section,
            academicYear: toYear,
            schoolId,
            mainTeacher: newClass.mainTeacherId || null,
            status: 'pending', // Le classi sono in pending fino all'attivazione dell'anno
            isActive: true,
            students: [] // Gli studenti verranno aggiunti successivamente
          };
          
          classCreationOperations.push(
            Class.create([classData], { session })
              .then(result => {
                const createdClass = result[0];
                createdClassesIds[`${newClass.year}-${newClass.section}`] = createdClass._id;
                return createdClass;
              })
          );
        }
      }
      
      // Crea tutte le nuove classi
      const createdClasses = await Promise.all(classCreationOperations);
      
      logger.debug('Created new classes', {
        count: createdClasses.length,
        classIds: createdClasses.map(c => c._id.toString())
      });
      
      // 4. Trova tutte le classi esistenti nel nuovo anno
      const existingNewClasses = await Class.find({
        schoolId,
        academicYear: toYear,
        isActive: true
      }).session(session);
      
      // 5. Crea una mappa di tutte le classi nel nuovo anno (esistenti + appena create)
      const allNewClassesMap = {};
      
      // Aggiungi le classi esistenti alla mappa
      existingNewClasses.forEach(cls => {
        const key = `${cls.year}-${cls.section}`;
        allNewClassesMap[key] = cls;
      });
      
      // Aggiungi le classi appena create alla mappa
      createdClasses.forEach(cls => {
        const key = `${cls.year}-${cls.section}`;
        allNewClassesMap[key] = cls;
      });
      
      // 6. Aggiorna gli stati degli anni accademici se necessario
      if (fromYearData.status === 'active') {
        fromYearData.status = 'archived';
      }
      
      await school.save({ session });
      
      // 7. Trova le classi dell'anno corrente
      const currentClasses = await Class.find({
        schoolId,
        academicYear: fromYear,
        isActive: true
      }).session(session);
      
      // 8. Crea mappa delle eccezioni per lookup veloce
      const exceptionsMap = {};
      exceptions.forEach(exception => {
        exceptionsMap[exception.studentId] = exception;
      });
      
      // 9. Trova tutti gli studenti attivi nell'anno corrente
      const students = await Student.find({
        schoolId,
        classId: { $in: currentClasses.map(c => c._id) },
        status: 'active'
      }).session(session);
      
      // 10. Crea mappe per lookup veloce
      // Mappa delle classi correnti per ID
      const currentClassesMap = {};
      currentClasses.forEach(cls => {
        currentClassesMap[cls._id.toString()] = cls;
      });
      
      // 11. Gestisci ogni studente in base alle regole di promozione o eccezioni
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
              const retainedClass = allNewClassesMap[retainedClassKey];
              
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
              const sectionChangeClass = allNewClassesMap[sectionChangeClassKey];
              
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
              const customClass = allNewClassesMap[customClassKey];
              
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
          const newClass = allNewClassesMap[newClassKey];
          
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
      
      // 12. Salva tutti gli studenti aggiornati
      await Promise.all(studentOperations);
      
      // 13. Aggiorna le classi con le assegnazioni docenti
      const classTeacherUpdates = [];
      
      // Itera sulle assegnazioni docenti
      Object.entries(teacherAssignments).forEach(([classId, teacherId]) => {
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
      });
      
      // Esegui gli aggiornamenti docenti
      await Promise.all(classTeacherUpdates);
      
      // 14. Aggiorna le classi con gli studenti
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
      
      // 15. Archivia le classi dell'anno vecchio ma mantienile per lo storico
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
      
      // 16. Commit della transazione
      await session.commitTransaction();
      
      // 17. Invia la risposta
      res.status(200).json({
        status: 'success',
        message: 'Transizione anno completata con successo',
        data: {
          fromYear,
          toYear,
          studentsProcessed: students.length,
          exceptionsApplied: exceptions.length,
          newClassesCreated: createdClasses.length
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
