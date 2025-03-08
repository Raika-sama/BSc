const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const ClassRepository = require('@/repositories/ClassRepository');
const { School, Class, User } = require('@/models');

describe('ClassRepository', () => {
    let classRepository;
    let testSchool;
    let testTeacher;
    let mongoServer;

    beforeAll(async () => {
        // Configura un database MongoDB in memoria per i test con supporto per le transazioni
        mongoServer = await MongoMemoryServer.create({
            instance: {
                storageEngine: 'wiredTiger' // Necessario per le transazioni
            }
        });
        const uri = mongoServer.getUri();
        await mongoose.connect(uri, {
            directConnection: true // Necessario per le transazioni
        });
    });

    afterAll(async () => {
        // Chiudi le connessioni dopo i test
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        // Pulisci il database prima di ogni test
        await School.deleteMany({});
        await Class.deleteMany({});
        await User.deleteMany({});
        
        // Crea un insegnante di test
        testTeacher = await User.create({
            firstName: 'Teacher',
            lastName: 'Test',
            email: 'teacher@example.com',
            password: 'password123',
            role: 'teacher',
            status: 'active',
            sessionTokens: [{
                token: `test-token-teacher-${Date.now()}`,
                createdAt: new Date(),
                lastUsedAt: new Date(),
                expiresAt: new Date(Date.now() + 86400000), // 24 ore
                ipAddress: '127.0.0.1',
                userAgent: 'Mozilla/5.0 (Test)'
            }]
        });
        
        // Crea una scuola di test
        testSchool = await School.create({
            name: 'Test School',
            schoolType: 'middle_school', // Default scuola media
            institutionType: 'none',
            region: 'Test Region',
            province: 'Test Province',
            address: 'Test Address',
            isActive: true,
            manager: testTeacher._id,
            users: [{ user: testTeacher._id, role: 'admin' }]
        });
        
        // Inizializza il repository
        classRepository = new ClassRepository();
    });

    // Test per le operazioni CRUD di base
    describe('CRUD Operations', () => {
        describe('create', () => {
            it('should create a new class', async () => {
                const classData = {
                    schoolId: testSchool._id,
                    year: 1,
                    section: 'A',
                    academicYear: '2023/2024',
                    status: 'active',
                    capacity: 25,
                    mainTeacher: testTeacher._id,
                    isActive: true
                };

                const newClass = await classRepository.create(classData);
                
                // Verifico che la classe sia stata creata
                expect(newClass).not.toBeNull();
                expect(newClass.schoolId.toString()).toBe(testSchool._id.toString());
                expect(newClass.year).toBe(1);
                expect(newClass.section).toBe('A');
                expect(newClass.academicYear).toBe('2023/2024');
                
                // Verifico che sia stata salvata nel database
                const savedClass = await Class.findById(newClass._id);
                expect(savedClass).not.toBeNull();
                expect(savedClass.mainTeacher.toString()).toBe(testTeacher._id.toString());
            });

            it('should throw error for missing required fields', async () => {
                // Test per dati incompleti - manca schoolId
                const incompleteData = {
                    year: 1,
                    section: 'A',
                    academicYear: '2023/2024'
                    // mancano schoolId e mainTeacher, che sono obbligatori
                };

                await expect(classRepository.create(incompleteData))
                    .rejects
                    .toThrow('Dati classe incompleti');
            });

            it('should throw error for validation errors', async () => {
                // Test con dati che violano la validazione Mongoose
                const invalidData = {
                    schoolId: testSchool._id,
                    year: -1, // anno negativo, non valido
                    section: 'A',
                    academicYear: '2023/2024',
                    status: 'invalid_status', // stato non valido
                    capacity: 25,
                    mainTeacher: testTeacher._id,
                    isActive: true
                };

                await expect(classRepository.create(invalidData))
                    .rejects
                    .toThrow('Errore di validazione');
            });
        });

        describe('findById', () => {
            let testClass;
            
            beforeEach(async () => {
                // Crea una classe di test per i test di ricerca
                testClass = await Class.create({
                    schoolId: testSchool._id,
                    year: 1,
                    section: 'A',
                    academicYear: '2023/2024',
                    status: 'active',
                    capacity: 25,
                    mainTeacher: testTeacher._id,
                    isActive: true
                });
            });

            it('should find a class by ID', async () => {
                const foundClass = await classRepository.findById(testClass._id);
                
                expect(foundClass).not.toBeNull();
                expect(foundClass._id.toString()).toBe(testClass._id.toString());
                expect(foundClass.section).toBe('A');
            });

            it('should throw error for non-existent ID', async () => {
                const nonExistentId = new mongoose.Types.ObjectId();
                
                await expect(classRepository.findById(nonExistentId))
                    .rejects
                    .toThrow('non trovato');
            });
            
            it('should throw error for invalid ID format', async () => {
                await expect(classRepository.findById('invalid-id-format'))
                    .rejects
                    .toThrow();
            });
        });

        describe('update', () => {
            let testClass;
            
            beforeEach(async () => {
                // Crea una classe di test per i test di aggiornamento
                testClass = await Class.create({
                    schoolId: testSchool._id,
                    year: 1,
                    section: 'A',
                    academicYear: '2023/2024',
                    status: 'active',
                    capacity: 25,
                    mainTeacher: testTeacher._id,
                    isActive: true
                });
            });

            it('should update an existing class', async () => {
                const updateData = {
                    capacity: 30,
                    status: 'planned'
                };

                const updatedClass = await classRepository.update(testClass._id, updateData);
                
                expect(updatedClass).not.toBeNull();
                expect(updatedClass.capacity).toBe(30);
                expect(updatedClass.status).toBe('planned');
                
                // Verifica che sia stato aggiornato nel database
                const savedClass = await Class.findById(testClass._id);
                expect(savedClass.capacity).toBe(30);
            });

            it('should throw error for non-existent ID', async () => {
                const nonExistentId = new mongoose.Types.ObjectId();
                const updateData = { capacity: 30 };
                
                await expect(classRepository.update(nonExistentId, updateData))
                    .rejects
                    .toThrow('non trovato');
            });
        });

        describe('delete', () => {
            let testClass;
            
            beforeEach(async () => {
                // Crea una classe di test per i test di eliminazione
                testClass = await Class.create({
                    schoolId: testSchool._id,
                    year: 1,
                    section: 'A',
                    academicYear: '2023/2024',
                    status: 'active',
                    capacity: 25,
                    mainTeacher: testTeacher._id,
                    isActive: true
                });
            });

            it('should delete a class', async () => {
                const result = await classRepository.delete(testClass._id);
                expect(result).not.toBeNull();
                
                // Verifica che sia stato eliminato dal database
                const deletedClass = await Class.findById(testClass._id);
                expect(deletedClass).toBeNull();
            });

            it('should throw error for non-existent ID', async () => {
                const nonExistentId = new mongoose.Types.ObjectId();
                
                await expect(classRepository.delete(nonExistentId))
                    .rejects
                    .toThrow('non trovato');
            });
        });

        describe('find', () => {
            beforeEach(async () => {
                // Crea più classi di test per i test di ricerca
                await Class.create([
                    {
                        schoolId: testSchool._id,
                        year: 1,
                        section: 'A',
                        academicYear: '2023/2024',
                        status: 'active',
                        capacity: 25,
                        mainTeacher: testTeacher._id,
                        isActive: true
                    },
                    {
                        schoolId: testSchool._id,
                        year: 2,
                        section: 'A',
                        academicYear: '2023/2024',
                        status: 'active',
                        capacity: 28,
                        mainTeacher: testTeacher._id,
                        isActive: true
                    },
                    {
                        schoolId: testSchool._id,
                        year: 1,
                        section: 'B',
                        academicYear: '2023/2024',
                        status: 'planned',
                        capacity: 25,
                        mainTeacher: testTeacher._id,
                        isActive: true
                    }
                ]);
            });

            it('should find classes with filters', async () => {
                // Test con filtri semplici
                const activeClasses = await classRepository.find({ status: 'active' });
                expect(activeClasses).toHaveLength(2);
                
                const classesYear1 = await classRepository.find({ year: 1 });
                expect(classesYear1).toHaveLength(2);
                
                const classesA = await classRepository.find({ section: 'A' });
                expect(classesA).toHaveLength(2);
            });

            it('should find classes with complex filters', async () => {
                // Test con filtri combinati
                const activeYear1Classes = await classRepository.find({
                    status: 'active',
                    year: 1
                });
                expect(activeYear1Classes).toHaveLength(1);
            });

            it('should return empty array when no classes match filters', async () => {
                // Test con filtri che non trovano nessun risultato
                const noClasses = await classRepository.find({ year: 10 });
                expect(noClasses).toHaveLength(0);
            });
        });
    });

    // Test per metodi specifici personalizzati
    describe('Specialized Methods', () => {
        describe('exists', () => {
            beforeEach(async () => {
                // Crea una classe di test
                await Class.create({
                    schoolId: testSchool._id,
                    year: 1,
                    section: 'A',
                    academicYear: '2023/2024',
                    status: 'active',
                    capacity: 25,
                    mainTeacher: testTeacher._id,
                    isActive: true
                });
            });

            it('should return true for existing class criteria', async () => {
                const criteria = {
                    schoolId: testSchool._id,
                    year: 1,
                    section: 'A',
                    academicYear: '2023/2024'
                };
                
                const exists = await classRepository.exists(criteria);
                expect(exists).toBe(true);
            });

            it('should return false for non-existing class criteria', async () => {
                const criteria = {
                    schoolId: testSchool._id,
                    year: 2, // non esiste ancora una classe per l'anno 2
                    section: 'A',
                    academicYear: '2023/2024'
                };
                
                const exists = await classRepository.exists(criteria);
                expect(exists).toBe(false);
            });
            
            it('should throw error for invalid school ID', async () => {
                const criteria = {
                    schoolId: 'invalid-id',
                    year: 1,
                    section: 'A',
                    academicYear: '2023/2024'
                };
                
                await expect(classRepository.exists(criteria))
                    .rejects
                    .toThrow('ID scuola non valido');
            });
        });

        describe('findBySchool', () => {
            beforeEach(async () => {
                // Crea più classi di test per i test di ricerca per scuola
                await Class.create([
                    {
                        schoolId: testSchool._id,
                        year: 1,
                        section: 'A',
                        academicYear: '2023/2024',
                        status: 'active',
                        capacity: 25,
                        mainTeacher: testTeacher._id,
                        isActive: true
                    },
                    {
                        schoolId: testSchool._id,
                        year: 2,
                        section: 'A',
                        academicYear: '2023/2024',
                        status: 'active',
                        capacity: 28,
                        mainTeacher: testTeacher._id,
                        isActive: true
                    },
                    {
                        schoolId: testSchool._id,
                        year: 1,
                        section: 'B',
                        academicYear: '2022/2023', // Anno accademico diverso
                        status: 'archived',
                        capacity: 25,
                        mainTeacher: testTeacher._id,
                        isActive: true
                    }
                ]);
            });

            it('should find all active classes for a school', async () => {
                const classes = await classRepository.findBySchool(testSchool._id);
                expect(classes).toHaveLength(3); // Tutte le classi sono active
            });

            it('should find classes for a specific academic year', async () => {
                const classes = await classRepository.findBySchool(testSchool._id, '2023/2024');
                expect(classes).toHaveLength(2); // Solo le classi del 2023/2024
            });

            it('should return empty array for non-existent school', async () => {
                const nonExistentId = new mongoose.Types.ObjectId();
                const classes = await classRepository.findBySchool(nonExistentId);
                expect(classes).toHaveLength(0);
            });
        });

        describe('findWithDetails', () => {
            let testClass;
            
            beforeEach(async () => {
                // Crea una classe di test con riferimenti
                testClass = await Class.create({
                    schoolId: testSchool._id,
                    year: 1,
                    section: 'A',
                    academicYear: '2023/2024',
                    status: 'active',
                    capacity: 25,
                    mainTeacher: testTeacher._id,
                    teachers: [testTeacher._id],
                    isActive: true
                });
            });

            it('should find a class with populated fields', async () => {
                const classWithDetails = await classRepository.findWithDetails(testClass._id);
                
                expect(classWithDetails).not.toBeNull();
                expect(classWithDetails.schoolId).not.toBeNull();
                expect(classWithDetails.schoolId.name).toBe('Test School');
                expect(classWithDetails.mainTeacher).not.toBeNull();
                expect(classWithDetails.mainTeacher.firstName).toBe('Teacher');
                expect(classWithDetails.teachers).toHaveLength(1);
                expect(classWithDetails.teachers[0].firstName).toBe('Teacher');
            });
        });
    });

    // Test per metodi che usano transazioni
    describe('Transaction Methods', () => {
        describe('createInitialClasses', () => {
            it('should create initial classes for sections with middle school', async () => {
                const sections = [
                    { name: 'A', maxStudents: 25 },
                    { name: 'B', maxStudents: 25 }
                ];

                const classes = await classRepository.createInitialClasses(
                    testSchool._id,
                    '2023/2024',
                    sections
                );

                expect(classes).toHaveLength(6); // 3 anni x 2 sezioni = 6 classi
                expect(classes[0].year).toBe(1);
                expect(classes[0].section).toBe('A');
                expect(classes[0].status).toBe('planned');
                expect(classes[0].capacity).toBe(25);
                
                // Verifica che le classi siano state create con i dati corretti
                const dbClasses = await Class.find({ schoolId: testSchool._id });
                expect(dbClasses).toHaveLength(6);
            });

            it('should respect school type for number of years', async () => {
                // Modifica la scuola in superiore
                await School.findByIdAndUpdate(testSchool._id, { 
                    schoolType: 'high_school' 
                });

                const sections = [{ name: 'A', maxStudents: 25 }];

                const classes = await classRepository.createInitialClasses(
                    testSchool._id,
                    '2023/2024',
                    sections
                );

                expect(classes).toHaveLength(5); // 5 anni per le superiori
                expect(classes[classes.length - 1].year).toBe(5);
            });

            it('should not create duplicate classes if they already exist', async () => {
                // Prima creiamo alcune classi iniziali
                const sections = [{ name: 'A', maxStudents: 25 }];
                
                await classRepository.createInitialClasses(
                    testSchool._id,
                    '2023/2024',
                    sections
                );
                
                // Ora proviamo a crearle di nuovo
                const classesAgain = await classRepository.createInitialClasses(
                    testSchool._id,
                    '2023/2024',
                    sections
                );
                
                // Dovrebbe restituire le classi esistenti senza crearne di nuove
                expect(classesAgain).toHaveLength(3);
                
                // Verifichiamo che non ci siano duplicati nel database
                const dbClasses = await Class.find({ schoolId: testSchool._id });
                expect(dbClasses).toHaveLength(3);
            });

            it('should throw error if school is not found', async () => {
                const nonExistentId = new mongoose.Types.ObjectId();
                const sections = [{ name: 'A', maxStudents: 25 }];
                
                await expect(classRepository.createInitialClasses(
                    nonExistentId,
                    '2023/2024',
                    sections
                )).rejects.toThrow('Scuola non trovata');
            });

            it('should throw error for missing parameters', async () => {
                await expect(classRepository.createInitialClasses())
                    .rejects.toThrow('Parametri mancanti o non validi');
            });
        });

        describe('promoteStudents', () => {
            beforeEach(async () => {
                // Setup classi iniziali
                await Class.create([
                    {
                        schoolId: testSchool._id,
                        year: 1,
                        section: 'A',
                        academicYear: '2023/2024',
                        status: 'active',
                        capacity: 25,
                        mainTeacher: testTeacher._id,
                        students: [
                            {
                                studentId: new mongoose.Types.ObjectId(),
                                status: 'active'
                            }
                        ],
                        isActive: true
                    },
                    {
                        schoolId: testSchool._id,
                        year: 2,
                        section: 'A',
                        academicYear: '2023/2024',
                        status: 'active',
                        capacity: 25,
                        mainTeacher: testTeacher._id,
                        students: [
                            {
                                studentId: new mongoose.Types.ObjectId(),
                                status: 'active'
                            }
                        ],
                        isActive: true
                    }
                ]);
            });

            it('should promote students to next year', async () => {
                await classRepository.promoteStudents('2023/2024', '2024/2025');

                const updatedClasses = await Class.find({ 
                    schoolId: testSchool._id
                }).sort({ year: 1 });

                // Verifica vecchie classi
                const oldClasses = updatedClasses.filter(c => 
                    c.academicYear === '2023/2024'
                );
                expect(oldClasses[0].status).toBe('archived');
                expect(oldClasses[0].students[0].status).toBe('transferred');

                // Verifica nuove classi
                const newClasses = updatedClasses.filter(c => 
                    c.academicYear === '2024/2025'
                );
                expect(newClasses).toHaveLength(2);
                expect(newClasses[0].year).toBe(2);
                expect(newClasses[1].year).toBe(3);
            });

            it('should not promote final year students', async () => {
                // Crea una classe dell'ultimo anno
                await Class.create({
                    schoolId: testSchool._id,
                    year: 3, // Ultimo anno medie
                    section: 'A',
                    academicYear: '2023/2024',
                    status: 'active',
                    capacity: 25,
                    mainTeacher: testTeacher._id,
                    students: [
                        {
                            studentId: new mongoose.Types.ObjectId(),
                            status: 'active'
                        }
                    ],
                    isActive: true
                });

                await classRepository.promoteStudents('2023/2024', '2024/2025');

                const newClasses = await Class.find({
                    schoolId: testSchool._id,
                    academicYear: '2024/2025',
                    year: 4 // Non dovrebbe esistere una classe per l'anno 4 (dopo il 3° anno delle medie)
                });

                expect(newClasses).toHaveLength(0); // Non dovrebbero esserci classi per l'anno 4

                // Verifica che la classe originale sia stata archiviata
                const oldClass = await Class.findOne({
                    schoolId: testSchool._id,
                    year: 3,
                    academicYear: '2023/2024'
                });

                expect(oldClass.status).toBe('archived');
                expect(oldClass.students[0].status).toBe('transferred');
            });
        });
    });

    afterEach(async () => {
        await School.deleteMany({});
        await Class.deleteMany({});
        await User.deleteMany({});
    });
});