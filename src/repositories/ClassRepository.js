// src/repositories/ClassRepository.js
const mongoose = require('mongoose');
const BaseRepository = require('./base/BaseRepository');
const { Class, User, School } = require('../models');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const handleRepositoryError = require('../utils/errors/repositoryErrorHandler');

class ClassRepository extends BaseRepository {
    constructor() {
        super(Class);
        this.repositoryName = 'ClassRepository';
    }

    /**
     * Ottiene i dati aggregati dei test per una classe
     * @param {string} classId - ID della classe
     * @param {string} testType - Tipo di test (es. 'CSI')
     * @returns {Promise<Object>} Dati aggregati dei test
     */
    async getClassTestsAggregation(classId, testType = 'CSI') {
        try {
            logger.debug('Getting aggregated test data for class', { 
                classId, 
                testType 
            });

            // Ottieni gli studenti della classe
            const classData = await this.model.findById(classId)
                .populate({
                    path: 'students.studentId',
                    select: '_id firstName lastName'
                })
                .lean();

            if (!classData || !classData.students) {
                return null;
            }

            // Estrai gli ID degli studenti
            const studentIds = classData.students
                .filter(s => s && s.studentId)
                .map(s => s.studentId._id || s.studentId);

            if (!studentIds.length) {
                logger.debug('No students found in class', { classId });
                return {
                    totalStudents: 0,
                    totalCompletedTests: 0,
                    message: 'Nessuno studente trovato in questa classe',
                    classId
                };
            }

            logger.debug('Found students in class', { 
                classId, 
                studentCount: studentIds.length 
            });

            // Ottieni i test completati per questi studenti
            const testModel = mongoose.model('Test');
            const completedTests = await testModel.find({
                studentId: { $in: studentIds },
                type: testType,
                status: 'completed'
            })
            .select('results studentId type')
            .lean();

            logger.debug('Completed tests found', { 
                count: completedTests.length,
                testType
            });

            if (!completedTests.length) {
                return {
                    totalStudents: studentIds.length,
                    totalCompletedTests: 0,
                    message: 'Nessun test completato per questa classe',
                    classId
                };
            }

            // Aggrega i dati dei test
            return this._aggregateTestData(completedTests, studentIds.length);

        } catch (error) {
            throw handleRepositoryError(
                error,
                'getClassTestsAggregation',
                { classId, testType },
                this.repositoryName
            );
        }
    }

    /**
     * Aggrega i dati dai test completati degli studenti di una classe
     * @private
     * @param {Array} completedTests - Array di test completati
     * @param {Number} totalStudents - Numero totale di studenti nella classe
     * @returns {Object} Dati aggregati dei test
     */
    _aggregateTestData(completedTests, totalStudents) {
        const dimensions = ['elaborazione', 'creativita', 'preferenzaVisiva', 'decisione', 'autonomia'];
        
        // Inizializza oggetti per l'aggregazione
        const scores = {};
        const dimensionDistribution = {};
        const dominantStylesDistribution = {};
        
        dimensions.forEach(dim => {
            scores[dim] = [];
            dimensionDistribution[dim] = { basso: 0, medio: 0, alto: 0 };
            dominantStylesDistribution[dim] = 0;
        });

        // Raccogli dati dai test
        completedTests.forEach(test => {
            if (!test.results) return;

            // Per ogni dimensione, raccogli i punteggi e le categorie
            dimensions.forEach(dimension => {
                const score = test.results[dimension]?.score;
                const level = test.results[dimension]?.level;
                
                if (typeof score === 'number') {
                    scores[dimension].push(score);
                }
                
                if (level) {
                    dimensionDistribution[dimension][level.toLowerCase()]++;
                }
            });

            // Determina lo stile dominante per questo test (maggior punteggio)
            let dominantStyle = null;
            let maxScore = -1;

            dimensions.forEach(dimension => {
                const score = test.results[dimension]?.score;
                if (typeof score === 'number' && score > maxScore) {
                    maxScore = score;
                    dominantStyle = dimension;
                }
            });

            if (dominantStyle) {
                dominantStylesDistribution[dominantStyle] = (dominantStylesDistribution[dominantStyle] || 0) + 1;
            }
        });

        // Calcola medie e deviazioni standard
        const averageScores = {};
        const standardDeviations = {};

        dimensions.forEach(dim => {
            if (scores[dim].length > 0) {
                // Calcola la media
                const sum = scores[dim].reduce((acc, val) => acc + val, 0);
                const avg = sum / scores[dim].length;
                averageScores[dim] = avg;

                // Calcola la deviazione standard
                const squaredDifferencesSum = scores[dim].reduce((acc, val) => {
                    const diff = val - avg;
                    return acc + (diff * diff);
                }, 0);
                standardDeviations[dim] = Math.sqrt(squaredDifferencesSum / scores[dim].length);
            } else {
                averageScores[dim] = 0;
                standardDeviations[dim] = 0;
            }
        });

        // Trova lo stile dominante nella classe
        let mostCommonStyle = null;
        let maxCount = -1;

        Object.entries(dominantStylesDistribution).forEach(([style, count]) => {
            if (count > maxCount) {
                maxCount = count;
                mostCommonStyle = style;
            }
        });

        // Calcola indice di diversità (Shannon Entropy normalizzato)
        let diversityIndex = 0;
        const totalTests = completedTests.length;

        if (totalTests > 0) {
            let entropy = 0;
            
            Object.values(dominantStylesDistribution).forEach(count => {
                if (count > 0) {
                    const p = count / totalTests;
                    entropy -= p * Math.log(p);
                }
            });
            
            // Normalizza l'entropia (dividi per il valore massimo possibile)
            const maxEntropy = Math.log(dimensions.length);
            diversityIndex = entropy / maxEntropy;
        }

        // Genera raccomandazioni in base ai risultati
        const recommendations = this._generateRecommendations(averageScores, dominantStylesDistribution, totalTests);
        
        // Interpreta il profilo della classe
        const classInterpretation = this._generateClassInterpretation(averageScores, diversityIndex, mostCommonStyle);

        return {
            totalStudents,
            totalCompletedTests: completedTests.length,
            mostCommonStyle,
            diversityIndex,
            averageScores,
            standardDeviations,
            dimensionDistribution,
            dominantStylesDistribution,
            classInterpretation,
            recommendations
        };
    }
    
    /**
     * Genera raccomandazioni didattiche in base ai dati aggregati
     * @private
     * @param {Object} averageScores - Punteggi medi per dimensione
     * @param {Object} dominantStylesCount - Conteggio degli stili dominanti
     * @param {Number} totalTests - Numero totale di test completati
     * @returns {Array} Raccomandazioni didattiche
     */
    _generateRecommendations(averageScores, dominantStylesCount, totalTests) {
        const recommendations = [];

        // Raccomandazione in base agli stili dominanti
        if (dominantStylesCount.elaborazione > totalTests * 0.33) {
            recommendations.push("Alternare metodologie di insegnamento per coinvolgere sia studenti analitici che globali");
        }

        if (dominantStylesCount.creativita > totalTests * 0.33) {
            recommendations.push("Proporre attività che bilancino approcci sistematici e intuitivi alla risoluzione dei problemi");
        }

        if (dominantStylesCount.preferenzaVisiva > totalTests * 0.4) {
            recommendations.push("Utilizzare supporti visivi per migliorare la comprensione dei concetti");
        }

        if (dominantStylesCount.decisione > totalTests * 0.3) {
            recommendations.push("Fornire materiali di studio strutturati per supportare gli studenti con stile riflessivo");
        }

        if (dominantStylesCount.autonomia > totalTests * 0.3) {
            recommendations.push("Incoraggiare lavori di gruppo che favoriscano l'interdipendenza positiva");
        }

        // Raccomandazioni generali
        recommendations.push("Variare gli approcci didattici per coinvolgere studenti con diversi stili cognitivi");
        recommendations.push("Incoraggiare attività di gruppo che favoriscano la discussione tra studenti con stili cognitivi diversi");

        // Raccomandazioni in base ai punteggi medi
        if (averageScores.elaborazione > 65) {
            recommendations.push("Privilegiare l'apprendimento per scoperta e le esperienze di apprendimento olistiche");
        } else if (averageScores.elaborazione < 35) {
            recommendations.push("Strutturare le lezioni in modo sequenziale e organizzato, con chiare suddivisioni degli argomenti");
        }

        if (averageScores.preferenzaVisiva > 70) {
            recommendations.push("Utilizzare diagrammi, mappe concettuali e rappresentazioni visive per supportare l'apprendimento");
        } else if (averageScores.preferenzaVisiva < 30) {
            recommendations.push("Supportare l'apprendimento con spiegazioni verbali dettagliate e discussioni guidate");
        }

        return recommendations.slice(0, 5); // Limita a 5 raccomandazioni
    }

    /**
     * Genera un'interpretazione del profilo cognitivo della classe
     * @private
     * @param {Object} averageScores - Punteggi medi per dimensione
     * @param {Number} diversityIndex - Indice di diversità 
     * @param {String} mostCommonStyle - Stile dominante più comune
     * @returns {String} Interpretazione del profilo di classe
     */
    _generateClassInterpretation(averageScores, diversityIndex, mostCommonStyle) {
        let interpretation = "Il profilo cognitivo di questa classe ";

        // Interpretazione basata sulla diversità
        if (diversityIndex > 0.8) {
            interpretation += "mostra una significativa varietà di stili cognitivi, suggerendo un gruppo eterogeneo. ";
        } else if (diversityIndex < 0.4) {
            interpretation += "evidenzia una certa omogeneità negli stili cognitivi, con una minore variabilità tra gli studenti. ";
        } else {
            interpretation += "presenta un buon equilibrio tra omogeneità e diversità di stili cognitivi. ";
        }

        // Interpretazione basata sullo stile dominante
        if (mostCommonStyle) {
            const styleDescriptions = {
                elaborazione: "La classe tende a preferire un approccio globale all'apprendimento, considerando il quadro generale prima dei dettagli.",
                creativita: "Gli studenti mostrano una preferenza per l'approccio intuitivo nella risoluzione dei problemi.",
                preferenzaVisiva: "Si nota una forte preferenza per l'apprendimento visivo e l'uso di supporti grafici.",
                decisione: "Emerge un approccio riflessivo nella presa di decisioni, con tendenza all'analisi approfondita.",
                autonomia: "Gli studenti mostrano una inclinazione verso l'autonomia nell'apprendimento."
            };

            interpretation += styleDescriptions[mostCommonStyle] || "";
        }

        // Aggiungi raccomandazione finale
        interpretation += " L'analisi dettagliata aiuta a personalizzare le strategie didattiche per ottimizzare l'esperienza di apprendimento per tutti gli studenti.";

        return interpretation;
    }

    async exists(criteria) {
        try {
            logger.debug('Verifica esistenza classe con criteri:', criteria);
            
            // Verifica che l'ID della scuola sia valido
            if (!mongoose.Types.ObjectId.isValid(criteria.schoolId)) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'ID scuola non valido'
                );
            }

            // Usa il modello Class direttamente
            const existingClass = await Class.findOne({
                schoolId: criteria.schoolId,
                year: criteria.year,
                section: criteria.section,
                academicYear: criteria.academicYear
            }).exec(); // Aggiungi .exec() per assicurarti che la promise sia risolta

            logger.debug('Risultato verifica esistenza:', { 
                exists: !!existingClass,
                searchCriteria: criteria 
            });

            return !!existingClass;
        } catch (error) {
            if (error.code) throw error;
            throw handleRepositoryError(
                error,
                'exists',
                { criteria },
                this.repositoryName
            );
        }
    }


    async create(data) {
        try {
            // Verifica stato connessione database
            if (mongoose.connection.readyState !== 1) {
                throw createError(
                    ErrorTypes.DATABASE.CONNECTION_ERROR,
                    'Database non connesso'
                );
            }

            // Verifica che i dati siano validi
            if (!data || !data.schoolId || !data.mainTeacher) {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Dati classe incompleti'
                );
            }

            // Crea un nuovo documento usando il modello direttamente
            const classDoc = new Class(data);
            
            // Valida il documento
            await classDoc.validate();

            // Salva il documento
            const savedClass = await classDoc.save();

            logger.info('Classe creata con successo:', {
                classId: savedClass._id,
                schoolId: savedClass.schoolId
            });

            return savedClass;

        } catch (error) {
            if (error.code) throw error;
            
            // Gestione specifica per errori di validazione
            if (error.name === 'ValidationError') {
                throw createError(
                    ErrorTypes.VALIDATION.BAD_REQUEST,
                    'Errore di validazione: ' + error.message,
                    { validationErrors: error.errors }
                );
            }
            
            throw handleRepositoryError(
                error,
                'create',
                { data },
                this.repositoryName
            );
        }
    }

    async findUserWithSchool(userId) {
        try {
            return await User.findById(userId).populate('schoolId');
        } catch (error) {
            throw handleRepositoryError(
                error,
                'findUserWithSchool',
                { userId },
                this.repositoryName
            );
        }
    }

    async findWithDetails(id) {
        try {
            const classData = await this.model.findById(id)
                .populate({
                    path: 'schoolId',
                    select: 'name schoolType'
                })
                .populate({
                    path: 'mainTeacher',
                    select: 'firstName lastName email'
                })
                .populate({
                    path: 'teachers',
                    select: 'firstName lastName email'
                })
                .populate({
                    path: 'students.studentId',
                    select: 'firstName lastName email'
                })
                .lean();

            return classData;
        } catch (error) {
            throw handleRepositoryError(
                error,
                'findWithDetails',
                { id },
                this.repositoryName
            );
        }
    }

    async findBySchool(schoolId, academicYear) {
        try {
            logger.debug('Finding classes by school:', { schoolId, academicYear });
    
            const query = { 
                schoolId,
                isActive: true 
            };
    
            // Se c'è un anno accademico specifico, aggiungiamolo alla query
            if (academicYear) {
                query.academicYear = academicYear;
            }
    
            const classes = await this.model
                .find(query)
                .populate('mainTeacher', 'firstName lastName')
                .populate('teachers', 'firstName lastName')
                .sort({ year: 1, section: 1 });
    
            logger.debug('Found classes:', { 
                count: classes.length,
                schoolId: schoolId
            });
    
            return classes;
    
        } catch (error) {
            throw handleRepositoryError(
                error,
                'findBySchool',
                { schoolId, academicYear },
                this.repositoryName
            );
        }
    }

    async addStudent(classId, studentId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Trova la classe con i suoi docenti
            const classDoc = await this.model.findById(classId).session(session);
            if (!classDoc) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Classe non trovata'
                );
            }

            // Verifica se lo studente è già presente
            if (classDoc.students.some(s => s.studentId.toString() === studentId.toString())) {
                logger.warn('Tentativo di aggiungere uno studente già presente', { classId, studentId });
                throw createError(
                    ErrorTypes.RESOURCE.ALREADY_EXISTS,
                    'Studente già presente nella classe'
                );
            }

            // Raccogli tutti gli ID degli insegnanti (principale + co-docenti)
            const teacherIds = [];
            if (classDoc.mainTeacher) {
                teacherIds.push(classDoc.mainTeacher);
            }
            if (classDoc.teachers && classDoc.teachers.length > 0) {
                teacherIds.push(...classDoc.teachers);
            }

            // Aggiungi lo studente alla classe
            classDoc.students.push({ studentId });
            await classDoc.save({ session });

            // Aggiorna gli assignedStudentIds per tutti gli insegnanti
            if (teacherIds.length > 0) {
                await mongoose.model('User').updateMany(
                    { _id: { $in: teacherIds } },
                    {
                        $addToSet: {
                            assignedStudentIds: studentId
                        }
                    },
                    { session }
                );
            }

            await session.commitTransaction();
            return classDoc;
        } catch (error) {
            await session.abortTransaction();
            if (error.code) throw error;
            throw handleRepositoryError(
                error,
                'addStudent',
                { classId, studentId },
                this.repositoryName
            );
        } finally {
            session.endSession();
        }
    }

    async removeStudent(classId, studentId) {
        try {
            const classData = await this.findById(classId);
            
            classData.students = classData.students.filter(
                id => id.toString() !== studentId
            );

            await classData.save();
            return classData;
        } catch (error) {
            throw handleRepositoryError(
                error,
                'removeStudent',
                { classId, studentId },
                this.repositoryName
            );
        }
    }

    async findByTeacher(teacherId, academicYear) {
        try {
            const filter = {
                $or: [
                    { mainTeacher: teacherId },
                    { teachers: teacherId }
                ],
                isActive: true
            };

            if (academicYear) {
                filter.academicYear = academicYear;
            }

            return await this.find(filter, {
                sort: { year: 1, section: 1 },
                populate: {
                    path: 'schoolId',
                    select: 'name'
                }
            });
        } catch (error) {
            throw handleRepositoryError(
                error,
                'findByTeacher',
                { teacherId, academicYear },
                this.repositoryName
            );
        }
    }

    async createInitialClasses(schoolId, academicYear, sections) {
        const session = await mongoose.startSession();
        session.startTransaction();
            
        if (!schoolId || !academicYear || !sections || !Array.isArray(sections)) {
            throw createError(
                ErrorTypes.VALIDATION.BAD_REQUEST,
                'Parametri mancanti o non validi'
            );
        }

        try {
            logger.debug('Starting createInitialClasses', {
                schoolId,
                academicYear,
                sections
            });
    
            // Verifica se esistono già classi per quell'anno
            const existingClasses = await this.model.find({
                schoolId,
                academicYear
            }).session(session);
    
            logger.debug('Found existing classes:', {
                count: existingClasses.length
            });
    
            if (existingClasses.length > 0) {
                logger.debug('Classes already exist for this year');
                await session.commitTransaction();
                return existingClasses;
            }
    
            const school = await School.findById(schoolId).session(session);
            if (!school) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Scuola non trovata'
                );
            }
    
            // Prepara i dati per le classi
            const classesData = [];
            const maxYear = school.schoolType === 'middle_school' ? 3 : 5;
    
            for (let year = 1; year <= maxYear; year++) {
                for (const section of sections) {
                    logger.debug('Creating class with data:', {
                        year,
                        section,
                        mainTeacherId: section.mainTeacherId
                    });
    
                    classesData.push({
                        schoolId,
                        year,
                        section: section.name,
                        academicYear,
                        status: 'planned',
                        capacity: section.maxStudents,
                        mainTeacher: section.mainTeacherId,
                        teachers: [],
                        isActive: true,
                        students: []
                    });
                }
            }
    
            logger.debug('Creating classes with data:', {
                count: classesData.length,
                firstClass: classesData[0]
            });
    
            const newClasses = await this.model.create(classesData, { session });
            
            logger.debug('Classes created successfully', {
                count: newClasses.length
            });
    
            await session.commitTransaction();
            return newClasses;
    
        } catch (error) {
            await session.abortTransaction();
            if (error.code) throw error;
            throw handleRepositoryError(
                error,
                'createInitialClasses',
                { schoolId, academicYear, sections },
                this.repositoryName
            );
        } finally {
            session.endSession();
        }
    }

    async promoteStudents(fromYear, toYear) {
        const session = await mongoose.startSession();
        session.startTransaction();
    
        try {
            logger.debug('Starting promoteStudents transaction', { fromYear, toYear });
    
            // 1. Prima trova tutte le classi attive dell'anno precedente
            const oldClasses = await this.model.find({ 
                academicYear: fromYear,
                status: 'active'
            }).populate('schoolId').session(session);
    
            logger.debug('Found old classes', { 
                count: oldClasses.length,
                classes: oldClasses.map(c => ({
                    id: c._id,
                    year: c.year,
                    section: c.section,
                    academicYear: c.academicYear
                }))
            });
    
            // 2. Archivia le vecchie classi
            const archiveResult = await this.model.updateMany(
                { academicYear: fromYear, status: 'active' },
                { 
                    $set: { 
                        status: 'archived',
                        'students.$[].status': 'transferred',
                        'students.$[].leftAt': new Date()
                    }
                },
                { session }
            );
    
            logger.debug('Archive result', { archiveResult });
    
            // 3. Prepara le nuove classi
            const newClassesData = oldClasses
                .filter(oldClass => {
                    const maxYear = oldClass.schoolId.schoolType === 'middle_school' ? 3 : 5;
                    return oldClass.year < maxYear;
                })
                .map(oldClass => ({

                    schoolId: oldClass.schoolId._id,
                    year: oldClass.year + 1,
                    section: oldClass.section,
                    academicYear: toYear,
                    status: 'active',
                    capacity: oldClass.capacity,
                    mainTeacher: oldClass.mainTeacher,
                    teachers: oldClass.teachers,
                    isActive: true
                }));
    
            logger.debug('Prepared new classes', { 
                count: newClassesData.length,
                classes: newClassesData
            });
    
            // 4. Inserisci le nuove classi
            const insertResult = await this.model.insertMany(newClassesData, { session });
            logger.debug('Insert result', { insertResult });
    
            await session.commitTransaction();
            return true;
    
        } catch (error) {
            await session.abortTransaction();
            throw handleRepositoryError(
                error,
                'promoteStudents',
                { fromYear, toYear },
                this.repositoryName
            );
        } finally {
            session.endSession();
        }
    }

    async getMyClasses(userId) {
        try {
            logger.debug('Getting classes for user:', { userId });

            // Prima otteniamo l'utente con i suoi dettagli
            const user = await mongoose.model('User').findById(userId)
                .select('role schoolId')
                .lean();

            logger.debug('ClassRepository: Utente trovato', { 
                role: user?.role, 
                schoolId: user?.schoolId 
            });

            if (!user) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Utente non trovato'
                );
            }

            logger.debug('User details:', { 
                role: user.role, 
                schoolId: user.schoolId 
            });

            let pipeline = [];

            // Pipeline diversa in base al ruolo
            switch (user.role) {
                case 'admin':
                    // Admin vede tutte le classi
                    pipeline = [
                        {
                            $lookup: {
                                from: 'schools',
                                localField: 'schoolId',
                                foreignField: '_id',
                                as: 'school'
                            }
                        },
                        {
                            $unwind: '$school'
                        },
                        {
                            $match: {
                                isActive: true
                            }
                        },
                        {
                            $project: {
                                schoolId: 1,
                                schoolName: '$school.name',
                                classId: '$_id',
                                year: 1,
                                section: 1,
                                academicYear: 1,
                                students: 1,
                                mainTeacher: 1,
                                teachers: 1
                            }
                        },
                        {
                            $sort: { 
                                'school.name': 1, 
                                year: 1, 
                                section: 1 
                            }
                        }
                    ];
                    break;

                case 'manager':
                    // Manager vede solo le classi della sua scuola
                    pipeline = [
                        {
                            $match: {
                                schoolId: user.schoolId,
                                isActive: true
                            }
                        },
                        {
                            $lookup: {
                                from: 'schools',
                                localField: 'schoolId',
                                foreignField: '_id',
                                as: 'school'
                            }
                        },
                        {
                            $unwind: '$school'
                        },
                        {
                            $project: {
                                schoolId: 1,
                                schoolName: '$school.name',
                                classId: '$_id',
                                year: 1,
                                section: 1,
                                academicYear: 1,
                                students: 1,
                                mainTeacher: 1,
                                teachers: 1
                            }
                        },
                        {
                            $sort: { 
                                year: 1, 
                                section: 1 
                            }
                        }
                    ];
                    break;

                case 'teacher':
                    // Teacher vede le classi dove è mainTeacher o nell'array teachers
                    pipeline = [
                        {
                            $match: {
                                isActive: true,
                                $or: [
                                    { mainTeacher: new mongoose.Types.ObjectId(userId) },
                                    { teachers: new mongoose.Types.ObjectId(userId) }
                                ]
                            }
                        },
                        {
                            $lookup: {
                                from: 'schools',
                                localField: 'schoolId',
                                foreignField: '_id',
                                as: 'school'
                            }
                        },
                        {
                            $unwind: '$school'
                        },
                        {
                            $project: {
                                schoolId: 1,
                                schoolName: '$school.name',
                                classId: '$_id',
                                year: 1,
                                section: 1,
                                academicYear: 1,
                                students: 1,
                                mainTeacher: 1,
                                teachers: 1,
                                isMainTeacher: {
                                    $eq: ['$mainTeacher', new mongoose.Types.ObjectId(userId)]
                                }
                            }
                        },
                        {
                            $sort: { 
                                isMainTeacher: -1,
                                year: 1, 
                                section: 1 
                            }
                        },
                        {
                            $facet: {
                                mainTeacherClasses: [
                                    {
                                        $match: {
                                            isMainTeacher: true
                                        }
                                    }
                                ],
                                coTeacherClasses: [
                                    {
                                        $match: {
                                            isMainTeacher: false
                                        }
                                    }
                                ]
                            }
                        }
                    ];
                    break;

                default:
                    throw createError(
                        ErrorTypes.AUTH.INVALID_ROLE,
                        'Ruolo utente non valido'
                    );
            }

            const result = await this.model.aggregate(pipeline);
            logger.debug('ClassRepository: Query completata', {
                resultLength: result.length
            });
            // Per admin e manager, formatta il risultato nello stesso formato usato per i teacher
            if (user.role === 'admin' || user.role === 'manager') {
                return {
                    mainTeacherClasses: result,
                    coTeacherClasses: []
                };
            }

            // Per teacher, il risultato è già nel formato corretto dalla facet
            return result[0];

        } catch (error) {
            if (error.code) throw error;
            throw handleRepositoryError(
                error,
                'getMyClasses',
                { userId },
                this.repositoryName
            );
        }
    }

    async deactivateClassesBySection(schoolId, sectionName, session) {
        try {
            logger.debug('Inizio deactivateClassesBySection', {
                schoolId,
                sectionName,
                session: !!session
            });
    
            // 1. Trova tutte le classi della sezione
            const classes = await this.model.find({
                schoolId,
                section: sectionName,
                isActive: true
            }).session(session);
    
            logger.debug('Classi trovate da disattivare:', {
                count: classes.length,
                classi: classes.map(c => ({
                    id: c._id,
                    section: c.section,
                    isActive: c.isActive
                }))
            });
    
            // 2. Aggiorna lo stato delle classi
            for (const classDoc of classes) {
                classDoc.previousMainTeacher = classDoc.mainTeacher;
                // Resetta tutti i campi
                classDoc.isActive = false;
                classDoc.status = 'archived';
                classDoc.deactivatedAt = new Date();
                classDoc.mainTeacher = null;
                classDoc.teachers = [];
                classDoc.students = [];
                classDoc.updatedAt = new Date();
                
                await classDoc.save({ session });
            }
    
            return classes;
        } catch (error) {
            throw handleRepositoryError(
                error,
                'deactivateClassesBySection',
                { schoolId, sectionName },
                this.repositoryName
            );
        }
    }

    async removeStudentsFromClass(classId, studentIds) {
        const session = await mongoose.startSession();
        session.startTransaction();
    
        try {
            // Trova la classe per ottenere i riferimenti agli insegnanti
            const classDoc = await this.model.findById(classId).session(session);
            if (!classDoc) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Classe non trovata'
                );
            }

            // Raccogli tutti gli ID degli insegnanti (principale + co-docenti)
            const teacherIds = [];
            if (classDoc.mainTeacher) {
                teacherIds.push(classDoc.mainTeacher);
            }
            if (classDoc.teachers && classDoc.teachers.length > 0) {
                teacherIds.push(...classDoc.teachers);
            }

            // Aggiorna la classe rimuovendo gli studenti
            const updatedClass = await this.model.findByIdAndUpdate(
                classId,
                {
                    $pull: {
                        students: {
                            studentId: { $in: studentIds }
                        }
                    }
                },
                { session, new: true }
            );
    
            // Aggiorna gli studenti
            await mongoose.model('Student').updateMany(
                { _id: { $in: studentIds } },
                {
                    $set: {
                        classId: null,
                        section: null,
                        status: 'inactive',
                        mainTeacher: null,
                        teachers: [],
                        needsClassAssignment: true
                    }
                },
                { session }
            );

            // Aggiorna il campo assignedStudentIds per gli insegnanti
            if (teacherIds.length > 0) {
                await mongoose.model('User').updateMany(
                    { _id: { $in: teacherIds } },
                    {
                        $pull: {
                            assignedStudentIds: { $in: studentIds }
                        }
                    },
                    { session }
                );
            }
    
            await session.commitTransaction();
            return updatedClass;
        } catch (error) {
            await session.abortTransaction();
            throw handleRepositoryError(
                error,
                'removeStudentsFromClass',
                { classId, studentIds },
                this.repositoryName
            );
        } finally {
            session.endSession();
        }
    }

    async updateMainTeacher(classId, teacherId) {
        const session = await mongoose.startSession();
        session.startTransaction();
    
        try {
            // 1. Trova la classe
            const classDoc = await this.model.findById(classId).session(session);
            if (!classDoc) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Classe non trovata'
                );
            }
    
            // Salva il vecchio mainTeacher se presente
            const oldMainTeacher = classDoc.mainTeacher;
            
            // 2. Aggiorna la classe
            classDoc.mainTeacher = teacherId;
            classDoc.mainTeacherIsTemporary = false;
            classDoc.previousMainTeacher = undefined;
            await classDoc.save({ session });
    
            // 3. Aggiorna gli studenti della classe
            await mongoose.model('Student').updateMany(
                { classId: classId },
                { 
                    $set: { mainTeacher: teacherId },
                    $addToSet: { teachers: teacherId } 
                },
                { session }
            );
    
            // 4. Aggiorna l'utente docente (aggiungi la classe e gli studenti)
            const students = await mongoose.model('Student').find(
                { classId: classId },
                { _id: 1 }
            ).session(session);
            
            const studentIds = students.map(s => s._id);
            
            await mongoose.model('User').findByIdAndUpdate(
                teacherId,
                { 
                    $addToSet: { 
                        assignedClassIds: classId,
                        assignedStudentIds: { $each: studentIds }
                    } 
                },
                { session }
            );
    
            // 5. Se c'era un docente principale precedente, rimuovi i riferimenti
            if (oldMainTeacher && oldMainTeacher.toString() !== teacherId.toString()) {
                // Rimuovi la classe e gli studenti dal vecchio mainTeacher
                await mongoose.model('User').findByIdAndUpdate(
                    oldMainTeacher,
                    { 
                        $pull: { 
                            assignedClassIds: classId,
                            assignedStudentIds: { $in: studentIds }
                        } 
                    },
                    { session }
                );
            }
    
            await session.commitTransaction();
            return classDoc;
    
        } catch (error) {
            await session.abortTransaction();
            if (error.code) throw error;
            throw handleRepositoryError(
                error,
                'updateMainTeacher',
                { classId, teacherId },
                this.repositoryName
            );
        } finally {
            session.endSession();
        }
    }

    async removeMainTeacher(classId) {
        const session = await mongoose.startSession();
        session.startTransaction();
    
        try {
            // 1. Trova la classe e verifica che esista
            const classDoc = await this.model.findById(classId).session(session);
            if (!classDoc) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Classe non trovata'
                );
            }
    
            // 2. Verifica che ci sia un mainTeacher da rimuovere
            if (!classDoc.mainTeacher) {
                throw createError(
                    ErrorTypes.BUSINESS.INVALID_OPERATION,
                    'Nessun docente principale assegnato'
                );
            }
    
            const previousTeacherId = classDoc.mainTeacher;
    
            // 3. Aggiorna la classe
            classDoc.previousMainTeacher = previousTeacherId;
            classDoc.mainTeacher = null;
            classDoc.mainTeacherIsTemporary = true;
            await classDoc.save({ session });
    
            // 4. Aggiorna gli studenti
            await mongoose.model('Student').updateMany(
                { 
                    classId: classId,
                    mainTeacher: previousTeacherId
                },
                { 
                    $set: { mainTeacher: null },
                    $pull: { teachers: previousTeacherId }
                },
                { session }
            );
    
            // 5. Aggiorna l'utente docente (rimuovi la classe e gli studenti)
            const students = await mongoose.model('Student').find(
                { classId: classId },
                { _id: 1 }
            ).session(session);
            
            const studentIds = students.map(s => s._id);
            
            await mongoose.model('User').findByIdAndUpdate(
                previousTeacherId,
                { 
                    $pull: { 
                        assignedClassIds: classId,
                        assignedStudentIds: { $in: studentIds }
                    } 
                },
                { session }
            );
    
            await session.commitTransaction();
            
            return classDoc;
    
        } catch (error) {
            await session.abortTransaction();
            if (error.code) throw error;
            throw handleRepositoryError(
                error,
                'removeMainTeacher',
                { classId },
                this.repositoryName
            );
        } finally {
            session.endSession();
        }
    }

    async addTeacher(classId, teacherId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Trova la classe
            const classDoc = await this.model.findById(classId).session(session);
            if (!classDoc) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Classe non trovata'
                );
            }

            // 2. Verifica che il docente non sia già presente
            if (classDoc.teachers.includes(teacherId)) {
                throw createError(
                    ErrorTypes.RESOURCE.ALREADY_EXISTS,
                    'Docente già assegnato alla classe'
                );
            }

            // 3. Aggiorna la classe
            classDoc.teachers.push(teacherId);
            await classDoc.save({ session });

            // 4. Aggiorna gli studenti della classe
            await mongoose.model('Student').updateMany(
                { classId: classId },
                { 
                    $addToSet: { teachers: teacherId } 
                },
                { session }
            );

            // 5. Aggiorna l'utente docente (aggiungi la classe e gli studenti)
            const students = await mongoose.model('Student').find(
                { classId: classId },
                { _id: 1 }
            ).session(session);
            
            const studentIds = students.map(s => s._id);
            
            await mongoose.model('User').findByIdAndUpdate(
                teacherId,
                { 
                    $addToSet: { 
                        assignedClassIds: classId,
                        assignedStudentIds: { $each: studentIds }
                    } 
                },
                { session }
            );

            await session.commitTransaction();
            return classDoc;

        } catch (error) {
            await session.abortTransaction();
            if (error.code) throw error;
            throw handleRepositoryError(
                error,
                'addTeacher',
                { classId, teacherId },
                this.repositoryName
            );
        } finally {
            session.endSession();
        }
    }

    async removeTeacher(classId, teacherId) {
        const session = await mongoose.startSession();
        session.startTransaction();
    
        try {
            // 1. Trova la classe
            const classDoc = await this.model.findById(classId).session(session);
            if (!classDoc) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Classe non trovata'
                );
            }
    
            // 2. Verifica che il docente non sia mainTeacher
            if (classDoc.mainTeacher && classDoc.mainTeacher.toString() === teacherId.toString()) {
                throw createError(
                    ErrorTypes.BUSINESS.INVALID_OPERATION,
                    'Non è possibile rimuovere il docente principale. Usare removeMainTeacher invece.'
                );
            }
    
            // 3. Verifica che il docente sia presente nell'array
            if (!classDoc.teachers.some(t => t.toString() === teacherId.toString())) {
                throw createError(
                    ErrorTypes.RESOURCE.NOT_FOUND,
                    'Docente non trovato nella classe'
                );
            }
    
            // 4. Aggiorna la classe
            classDoc.teachers = classDoc.teachers.filter(
                t => t.toString() !== teacherId.toString()
            );
            await classDoc.save({ session });
    
            // 5. Aggiorna gli studenti della classe
            await mongoose.model('Student').updateMany(
                { classId: classId },
                { 
                    $pull: { teachers: teacherId } 
                },
                { session }
            );
    
            // 6. Aggiorna l'utente docente (rimuovi la classe e gli studenti)
            const students = await mongoose.model('Student').find(
                { classId: classId },
                { _id: 1 }
            ).session(session);
            
            const studentIds = students.map(s => s._id);
            
            await mongoose.model('User').findByIdAndUpdate(
                teacherId,
                { 
                    $pull: { 
                        assignedClassIds: classId,
                        assignedStudentIds: { $in: studentIds }
                    } 
                },
                { session }
            );
    
            await session.commitTransaction();
            return classDoc;
    
        } catch (error) {
            await session.abortTransaction();
            if (error.code) throw error;
            throw handleRepositoryError(
                error,
                'removeTeacher',
                { classId, teacherId },
                this.repositoryName
            );
        } finally {
            session.endSession();
        }
    }
}

module.exports = ClassRepository;