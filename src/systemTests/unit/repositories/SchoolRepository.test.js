const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const SchoolRepository = require('@/repositories/SchoolRepository');
const { School, User } = require('@/models');
const { v4: uuidv4 } = require('uuid');

let mongoServer;

// Funzione helper per creare una scuola di test con dati essenziali
const createTestSchool = async (schoolData) => {
    return await School.create({
        ...schoolData
        describe('removeManagerFromSchool', () => {
        it('should remove the manager from a school', async () => {
            // Verifica che la scuola abbia un manager
            expect(testSchool.manager).toBeDefined();
            
            // Mock per le operazioni su Class e Student
            const ClassModel = mongoose.model('Class') || { updateMany: jest.fn() };
            const StudentModel = mongoose.model('Student') || { updateMany: jest.fn() };
            
            const originalClassUpdateMany = ClassModel.updateMany;
            const originalStudentUpdateMany = StudentModel.updateMany;
            
            ClassModel.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 2 });
            StudentModel.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 3 });
            
            // Rimuovi il manager
            const result = await schoolRepository.removeManagerFromSchool(testSchool._id);
            
            // Verifica che il manager sia stato rimosso
            expect(result.school).toBeDefined();
            expect(result.school.manager).toBeNull();
            expect(result.oldManagerId).toEqual(testSchool.manager);
            
            // Verifica che le classi e gli studenti siano stati aggiornati
            expect(ClassModel.updateMany).toHaveBeenCalled();
            expect(StudentModel.updateMany).toHaveBeenCalled();
            
            // Verifica che assignedSchoolIds dell'utente sia stato aggiornato
            const updatedUser = await User.findById(testManager._id);
            const hasSchool = updatedUser.assignedSchoolIds ? 
                updatedUser.assignedSchoolIds.includes(testSchool._id) : false;
            expect(hasSchool).toBe(false);
            
            // Ripristina i metodi originali
            if (originalClassUpdateMany) ClassModel.updateMany = originalClassUpdateMany;
            if (originalStudentUpdateMany) StudentModel.updateMany = originalStudentUpdateMany;
        });
        
        it('should throw error when school has no manager', async () => {
            // Prima rimuovi il manager
            await schoolRepository.removeManagerFromSchool(testSchool._id);
            
            // Poi prova a rimuoverlo di nuovo
            try {
                await schoolRepository.removeManagerFromSchool(testSchool._id);
                fail('Expected exception was not thrown');
            } catch (error) {
                expect(error).toBeDefined();
                expect(error.message).toContain('La scuola non ha un manager da rimuovere');
            }
        });
        
        // Test transazionale per verificare il rollback in caso di errore
        it('should rollback all changes if an error occurs during manager removal', async () => {
            // Mock per simulare un errore durante l'aggiornamento degli studenti
            const StudentModel = mongoose.model('Student') || { updateMany: jest.fn() };
            const originalStudentUpdateMany = StudentModel.updateMany;
            
            StudentModel.updateMany = jest.fn().mockRejectedValue(new Error('Test error'));
            
            // Salva lo stato iniziale
            const initialSchool = await School.findById(testSchool._id);
            const initialManagerId = initialSchool.manager;
            
            // Prova a rimuovere il manager, dovrebbe fallire
            try {
                await schoolRepository.removeManagerFromSchool(testSchool._id);
                fail('Expected exception was not thrown');
            } catch (error) {
                expect(error).toBeDefined();
                
                // Verifica che la scuola non sia stata modificata (rollback)
                const finalSchool = await School.findById(testSchool._id);
                expect(finalSchool.manager.toString()).toBe(initialManagerId.toString());
                
                // Verifica che l'utente non sia stato modificato
                const manager = await User.findById(testManager._id);
                const hasSchool = manager.assignedSchoolIds ? 
                    manager.assignedSchoolIds.some(id => id.toString() === testSchool._id.toString()) : 
                    false;
                // Questo test dipende dall'implementazione iniziale - se all'inizio assignedSchoolIds include la scuola
                // Potrebbe essere necessario adattarlo
            }
            
            // Ripristina il metodo originale
            if (originalStudentUpdateMany) StudentModel.updateMany = originalStudentUpdateMany;
        });
    });
    
    describe('addManagerToSchool', () => {
        it('should add a manager to a school without manager', async () => {
            // Prima rimuovi il manager esistente
            await schoolRepository.removeManagerFromSchool(testSchool._id);
            
            // Poi aggiungi un nuovo manager
            const result = await schoolRepository.addManagerToSchool(testSchool._id, testTeacher._id);
            
            // Verifica che il manager sia stato assegnato
            expect(result.school).toBeDefined();
            expect(result.school.manager.toString()).toBe(testTeacher._id.toString());
            expect(result.newManagerId.toString()).toBe(testTeacher._id.toString());
            
            // Verifica che assignedSchoolIds dell'utente sia stato aggiornato
            const updatedUser = await User.findById(testTeacher._id);
            const hasSchool = updatedUser.assignedSchoolIds ? 
                updatedUser.assignedSchoolIds.some(id => id.toString() === testSchool._id.toString()) : 
                false;
            expect(hasSchool).toBe(true);
        });
        
        it('should throw error when school already has a manager', async () => {
            // Prova ad aggiungere un manager a una scuola che ne ha già uno
            try {
                await schoolRepository.addManagerToSchool(testSchool._id, testTeacher._id);
                fail('Expected exception was not thrown');
            } catch (error) {
                expect(error).toBeDefined();
                expect(error.message).toContain('La scuola ha già un manager');
            }
        });
        
        // Test transazionale per verificare il rollback in caso di errore
        it('should rollback all changes if an error occurs during manager addition', async () => {
            // Prima rimuovi il manager esistente
            await schoolRepository.removeManagerFromSchool(testSchool._id);
            
            // Mock per simulare un errore durante l'aggiornamento dell'utente
            const UserModel = mongoose.model('User');
            const originalFindByIdAndUpdate = UserModel.findByIdAndUpdate;
            
            UserModel.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Test error'));
            
            // Prova ad aggiungere un manager, dovrebbe fallire
            try {
                await schoolRepository.addManagerToSchool(testSchool._id, testTeacher._id);
                fail('Expected exception was not thrown');
            } catch (error) {
                expect(error).toBeDefined();
                
                // Verifica che la scuola non abbia un manager (rollback)
                const finalSchool = await School.findById(testSchool._id);
                expect(finalSchool.manager).toBeNull();
            }
            
            // Ripristina il metodo originale
            UserModel.findByIdAndUpdate = originalFindByIdAndUpdate;
        });
    });
    
    describe('getSectionStudents', () => {
        it('should get students for a section', async () => {
            // Mock per Student.find
            const mockStudents = [
                { _id: 'student1', firstName: 'Student', lastName: 'One' },
                { _id: 'student2', firstName: 'Student', lastName: 'Two' }
            ];
            
            // Mock per Class.find
            const ClassModel = mongoose.model('Class') || { find: jest.fn() };
            const StudentModel = mongoose.model('Student') || { find: jest.fn() };
            
            const originalClassFind = ClassModel.find;
            const originalStudentFind = StudentModel.find;
            
            ClassModel.find = jest.fn().mockResolvedValue([
                { _id: 'class1' },
                { _id: 'class2' }
            ]);
            
            StudentModel.find = jest.fn().mockResolvedValue(mockStudents);
            
            // Chiamata al metodo
            const students = await schoolRepository.getStudentsBySection(testSchool._id, 'A');
            
            // Verifica che gli studenti siano stati restituiti
            expect(students).toEqual(mockStudents);
            
            // Verifica che i metodi siano stati chiamati con i parametri corretti
            expect(ClassModel.find).toHaveBeenCalledWith({
                schoolId: testSchool._id,
                section: 'A',
                isActive: true
            });
            
            expect(StudentModel.find).toHaveBeenCalled();
            
            // Ripristina i metodi originali
            if (originalClassFind) ClassModel.find = originalClassFind;
            if (originalStudentFind) StudentModel.find = originalStudentFind;
        });
    });
    
    describe('reactivateAcademicYear', () => {
        it('should reactivate an archived academic year', async () => {
            // Prima archivia l'anno attivo
            const activeYearId = testSchool.academicYears.find(y => y.status === 'active')._id;
            await schoolRepository.archiveAcademicYear(testSchool._id, activeYearId);
            
            // Poi riattivalo
            const result = await schoolRepository.reactivateAcademicYear(testSchool._id, activeYearId);
            
            // Verifica che l'anno sia stato riattivato a 'planned'
            const reactivatedYear = result.academicYears.find(y => y._id.toString() === activeYearId.toString());
            expect(reactivatedYear.status).toBe('planned');
        });
        
        it('should throw error when trying to reactivate a non-archived year', async () => {
            // Crea un nuovo anno in stato 'planned'
            const updatedSchool = await schoolRepository.setupAcademicYear(
                testSchool._id,
                {
                    year: '2024/2025',
                    status: 'planned',
                    startDate: new Date('2024-09-01'),
                    endDate: new Date('2025-06-15'),
                    createdBy: testSchool.manager
                },
                false
            );
            
            // Prendi l'ID del nuovo anno
            const newYearId = updatedSchool.academicYears.find(y => y.year === '2024/2025')._id;
            
            // Tenta di riattivare un anno che non è archiviato
            try {
                await schoolRepository.reactivateAcademicYear(testSchool._id, newYearId);
                fail('Expected exception was not thrown');
            } catch (error) {
                expect(error).toBeDefined();
                expect(error.message).toContain('Solo gli anni accademici archiviati possono essere riattivati');
            }
        });
        
        // Test transazionale per verificare il rollback in caso di errore
        it('should rollback all changes if an error occurs during year reactivation', async () => {
            // Prima archivia l'anno attivo
            const activeYearId = testSchool.academicYears.find(y => y.status === 'active')._id;
            await schoolRepository.archiveAcademicYear(testSchool._id, activeYearId);
            
            // Mock per simulare un errore durante l'aggiornamento delle classi
            const ClassModel = mongoose.model('Class') || { find: jest.fn() };
            const originalClassFind = ClassModel.find;
            
            ClassModel.find = jest.fn().mockRejectedValue(new Error('Test error'));
            
            // Tenta di riattivare l'anno, dovrebbe fallire
            try {
                await schoolRepository.reactivateAcademicYear(testSchool._id, activeYearId);
                fail('Expected exception was not thrown');
            } catch (error) {
                expect(error).toBeDefined();
                
                // Verifica che l'anno sia ancora archiviato (rollback)
                const school = await School.findById(testSchool._id);
                const year = school.academicYears.find(y => y._id.toString() === activeYearId.toString());
                expect(year.status).toBe('archived');
            }
            
            // Ripristina il metodo originale
            if (originalClassFind) ClassModel.find = originalClassFind;
        });
    });
    
    describe('updateAcademicYear', () => {
        it('should update an academic year', async () => {
            // Prendi l'ID dell'anno attivo
            const activeYearId = testSchool.academicYears.find(y => y.status === 'active')._id;
            
            // Dati per l'aggiornamento
            const updateData = {
                startDate: new Date('2023-09-15'),
                endDate: new Date('2024-06-30'),
                description: 'Updated year description'
            };
            
            // Aggiorna l'anno
            const result = await schoolRepository.updateAcademicYear(
                testSchool._id, 
                activeYearId, 
                updateData
            );
            
            // Verifica che l'anno sia stato aggiornato
            const updatedYear = result.academicYears.id(activeYearId);
            expect(updatedYear.startDate).toEqual(updateData.startDate);
            expect(updatedYear.endDate).toEqual(updateData.endDate);
            expect(updatedYear.description).toBe(updateData.description);
        });
        
        it('should update academic year with sections', async () => {
            // Prendi l'ID dell'anno attivo
            const activeYearId = testSchool.academicYears.find(y => y.status === 'active')._id;
            
            // Dati per l'aggiornamento
            const updateData = {
                description: 'Year with updated sections'
            };
            
            // Sezioni selezionate
            const sections = ['A'];
            
            // Mock per Class.findOne e Class.save
            const ClassModel = mongoose.model('Class') || { findOne: jest.fn() };
            const originalFindOne = ClassModel.findOne;
            
            ClassModel.findOne = jest.fn().mockResolvedValue(null);
            
            // Aggiorna l'anno con le sezioni
            const result = await schoolRepository.updateAcademicYear(
                testSchool._id, 
                activeYearId, 
                updateData,
                sections
            );
            
            // Ripristina il metodo originale
            if (originalFindOne) ClassModel.findOne = originalFindOne;
        });
        
        it('should throw error for invalid dates', async () => {
            // Prendi l'ID dell'anno attivo
            const activeYearId = testSchool.academicYears.find(y => y.status === 'active')._id;
            
            // Dati per l'aggiornamento con date invalide (fine prima dell'inizio)
            const invalidUpdateData = {
                startDate: new Date('2024-01-01'),
                endDate: new Date('2023-12-31')
            };
            
            // Prova ad aggiornare l'anno con date invalide
            try {
                await schoolRepository.updateAcademicYear(
                    testSchool._id, 
                    activeYearId, 
                    invalidUpdateData
                );
                fail('Expected exception was not thrown');
            } catch (error) {
                expect(error).toBeDefined();
                // Il messaggio dipende dall'implementazione specifica
            }
        });
    });
    
    describe('deleteWithClasses', () => {
        it('should delete a school and all its classes', async () => {
            // Mock per Class.deleteMany
            const ClassModel = mongoose.model('Class') || { deleteMany: jest.fn() };
            const originalDeleteMany = ClassModel.deleteMany;
            
            ClassModel.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 5 });
            
            // Elimina la scuola
            const result = await schoolRepository.deleteWithClasses(testSchool._id);
            
            // Verifica che la scuola sia stata eliminata e le classi siano state eliminate
            expect(result.school).toBeDefined();
            expect(result.deletedClassesCount).toBe(5);
            
            // Verifica che la scuola sia stata effettivamente eliminata
            const school = await School.findById(testSchool._id);
            expect(school).toBeNull();
            
            // Ripristina il metodo originale
            if (originalDeleteMany) ClassModel.deleteMany = originalDeleteMany;
        });
        
        // Test transazionale per verificare il rollback in caso di errore
        it('should rollback if an error occurs during school deletion', async () => {
            // Mock per simulare un errore durante l'eliminazione delle classi
            const ClassModel = mongoose.model('Class') || { deleteMany: jest.fn() };
            const originalDeleteMany = ClassModel.deleteMany;
            
            ClassModel.deleteMany = jest.fn().mockRejectedValue(new Error('Test error'));
            
            // Tenta di eliminare la scuola, dovrebbe fallire
            try {
                await schoolRepository.deleteWithClasses(testSchool._id);
                fail('Expected exception was not thrown');
            } catch (error) {
                expect(error).toBeDefined();
                
                // Verifica che la scuola non sia stata eliminata (rollback)
                const school = await School.findById(testSchool._id);
                expect(school).not.toBeNull();
            }
            
            // Ripristina il metodo originale
            if (originalDeleteMany) ClassModel.deleteMany = originalDeleteMany;
        });
    });
    
    describe('findAll', () => {
        it('should find all schools with populated managers', async () => {
            // Crea un'altra scuola
            await createTestSchool({
                name: 'Another Test School',
                schoolType: 'middle_school',
                institutionType: 'none',
                region: 'Lazio',
                province: 'Roma',
                address: 'Via Roma 456',
                manager: testTeacher._id,
                defaultMaxStudentsPerClass: 20
            });
            
            // Trova tutte le scuole
            const schools = await schoolRepository.findAll();
            
            // Verifica che tutte le scuole siano state trovate
            expect(schools).toHaveLength(2);
            
            // Verifica che i manager siano popolati
            expect(schools[0].manager).toBeDefined();
            expect(schools[1].manager).toBeDefined();
        });
    });
    
    describe('syncAssignedSchoolIds', () => {
        it('should synchronize assignedSchoolIds for all users', async () => {
            // Crea alcuni utenti e scuole per il test
            const user1 = await User.create({
                firstName: 'User',
                lastName: 'One',
                email: 'user1@example.com',
                password: 'password123',
                role: 'teacher',
                assignedSchoolId: testSchool._id // vecchio formato singolo
            });
            
            const user2 = await User.create({
                firstName: 'User',
                lastName: 'Two',
                email: 'user2@example.com',
                password: 'password123',
                role: 'teacher'
                // senza scuola assegnata
            });
            
            // Crea un'altra scuola e assegna user2 come manager
            const anotherSchool = await createTestSchool({
                name: 'School For Sync Test',
                schoolType: 'middle_school',
                institutionType: 'none',
                region: 'Veneto',
                province: 'Venezia',
                address: 'Via Venezia 789',
                manager: user2._id,
                defaultMaxStudentsPerClass: 22
            });
            
            // Esegui la sincronizzazione
            const result = await schoolRepository.syncAssignedSchoolIds();
            
            // Verifica che il conteggio sia corretto
            expect(result.totalUpdated).toBeGreaterThan(0);
            
            // Verifica che gli utenti siano stati aggiornati
            const updatedUser1 = await User.findById(user1._id);
            const updatedUser2 = await User.findById(user2._id);
            
            // user1 dovrebbe avere testSchool in assignedSchoolIds
            expect(updatedUser1.assignedSchoolIds).toBeDefined();
            const hasTestSchool = updatedUser1.assignedSchoolIds.some(
                id => id.toString() === testSchool._id.toString()
            );
            expect(hasTestSchool).toBe(true);
            
            // user2 dovrebbe avere anotherSchool in assignedSchoolIds
            expect(updatedUser2.assignedSchoolIds).toBeDefined();
            const hasAnotherSchool = updatedUser2.assignedSchoolIds.some(
                id => id.toString() === anotherSchool._id.toString()
            );
            expect(hasAnotherSchool).toBe(true);
            
            // assignedSchoolId dovrebbe essere rimosso
            expect(updatedUser1.assignedSchoolId).toBeUndefined();
        });
    });
});
};

describe('SchoolRepository', () => {
    let schoolRepository;
    let testSchool;
    let mockClassRepository;
    let mockStudentRepository;
    let testManager;
    let testTeacher;

    beforeAll(async () => {
        // Configura un database MongoDB in memoria per i test
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        // Chiudi le connessioni dopo i test
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        // Pulisci il database prima di ogni test
        await School.deleteMany({});
        await User.deleteMany({});
        
        // Per test completi avremmo bisogno di altri modelli
        if (mongoose.modelNames().includes('Class')) {
            await mongoose.model('Class').deleteMany({});
        }
        
        if (mongoose.modelNames().includes('Student')) {
            await mongoose.model('Student').deleteMany({});
        }

        // Crea un manager e un teacher per la scuola
        testManager = await User.create({
            firstName: 'Manager',
            lastName: 'Test',
            email: 'manager@example.com',
            password: 'password123',
            role: 'admin',
            status: 'active'
        });
        
        testTeacher = await User.create({
            firstName: 'Teacher',
            lastName: 'Test',
            email: 'teacher@example.com',
            password: 'password123',
            role: 'teacher',
            status: 'active'
        });

        // Crea mock per i repository dipendenti
        mockClassRepository = {
            deactivateClassesBySection: jest.fn().mockResolvedValue(true),
            createInitialClasses: jest.fn().mockResolvedValue([]),
            find: jest.fn().mockResolvedValue([]),
            findBySchool: jest.fn().mockResolvedValue([]),
            updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 })
        };

        mockStudentRepository = {
            updateStudentsForDeactivatedSection: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
            find: jest.fn().mockResolvedValue([]),
            findByClass: jest.fn().mockResolvedValue([]),
            updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
            countByClasses: jest.fn().mockResolvedValue(0)
        };

        // Inizializza il repository
        schoolRepository = new SchoolRepository(School, mockClassRepository, mockStudentRepository);

        // Crea una scuola di test
        testSchool = await createTestSchool({
            name: 'Test School',
            schoolType: 'high_school',
            institutionType: 'scientific',
            region: 'Lombardia',
            province: 'Milano',
            address: 'Via Test 123',
            manager: testManager._id,
            defaultMaxStudentsPerClass: 25,
            sections: [
                {
                    name: 'A',
                    isActive: true,
                    maxStudents: 25,
                    academicYears: []
                },
                {
                    name: 'B',
                    isActive: true,
                    maxStudents: 25,
                    academicYears: []
                }
            ],
            academicYears: [
                {
                    year: '2023/2024',
                    status: 'active',
                    startDate: new Date('2023-09-01'),
                    endDate: new Date('2024-06-15'),
                    createdBy: testManager._id
                }
            ],
            users: [
                {
                    user: testManager._id,
                    role: 'admin'
                }
            ]
        });
    });

    describe('findOne', () => {
        it('should find a school by criteria', async () => {
            // Test findOne
            const school = await schoolRepository.findOne({ name: 'Test School' });
            expect(school).not.toBeNull();
            expect(school.name).toBe('Test School');
        });

        it('should return null for non-existent criteria', async () => {
            // Test findOne con criteri inesistenti
            const school = await schoolRepository.findOne({ name: 'Non-existent School' });
            expect(school).toBeNull();
        });

        it('should populate specified fields', async () => {
            // Test findOne con populate
            const school = await schoolRepository.findOne(
                { _id: testSchool._id }, 
                { populate: 'manager' }
            );
            expect(school).not.toBeNull();
            expect(school.manager).not.toBeNull();
            expect(school.manager.email).toBe('manager@example.com');
        });
    });

    describe('findById', () => {
        it('should find a school by ID', async () => {
            // Test findById
            const school = await schoolRepository.findById(testSchool._id);
            expect(school).not.toBeNull();
            expect(school._id.toString()).toBe(testSchool._id.toString());
        });

        it('should throw error for invalid ID', async () => {
            // Test findById con ID invalido
            try {
                await schoolRepository.findById('invalidid');
                // Se arriviamo qui, il test fallisce perché non è stata lanciata un'eccezione
                fail('Expected exception was not thrown');
            } catch (error) {
                // Verifichiamo che l'errore sia definito
                expect(error).toBeDefined();
                // Possiamo anche verificare proprietà specifiche dell'errore
                expect(error.message).toBeDefined();
            }
        });

        it('should throw error for non-existent ID', async () => {
            // Test findById con ID non esistente
            const nonExistentId = new mongoose.Types.ObjectId();
            try {
                await schoolRepository.findById(nonExistentId);
                // Se arriviamo qui, il test fallisce perché non è stata lanciata un'eccezione
                fail('Expected exception was not thrown');
            } catch (error) {
                // Verifichiamo che l'errore sia definito
                expect(error).toBeDefined();
                // Possiamo anche verificare proprietà specifiche dell'errore
                expect(error.message).toBeDefined();
            }
        });
    });

    describe('create', () => {
        it('should create a new school', async () => {
            // Test create con nome unico
            const manager = await User.findOne({ email: 'manager@example.com' });
            
            const newSchoolData = {
                name: 'New Test School',
                schoolType: 'middle_school',
                institutionType: 'none',
                region: 'Lazio',
                province: 'Roma',
                address: 'Via Roma 456',
                manager: manager._id,
                defaultMaxStudentsPerClass: 20
            };

            const newSchool = await schoolRepository.create(newSchoolData);
            expect(newSchool).not.toBeNull();
            expect(newSchool.name).toBe('New Test School');
            expect(newSchool.schoolType).toBe('middle_school');

            // Verifica che la scuola sia stata salvata nel database
            const savedSchool = await School.findOne({ name: 'New Test School' });
            expect(savedSchool).not.toBeNull();
            expect(savedSchool.region).toBe('Lazio');
        });

        it('should throw error for duplicate name', async () => {
            // Test create con nome duplicato
            const manager = await User.findOne({ email: 'manager@example.com' });
            
            const duplicateSchoolData = {
                name: 'Test School', // Nome già esistente
                schoolType: 'high_school',
                institutionType: 'scientific',
                region: 'Veneto',
                province: 'Venezia',
                address: 'Via Venezia 789',
                manager: manager._id,
                defaultMaxStudentsPerClass: 22
            };

            try {
                await schoolRepository.create(duplicateSchoolData);
                // Se arriviamo qui, il test fallisce perché non è stata lanciata un'eccezione
                fail('Expected exception was not thrown');
            } catch (error) {
                // Verifichiamo che l'errore sia definito
                expect(error).toBeDefined();
                // L'errore dovrebbe essere relativo al duplicato
                expect(error.code).toBe(11000); // MongoDB duplicate key error code
            }
        });
    });

    describe('update', () => {
        it('should update an existing school', async () => {
            // Test update
            const updateData = {
                name: 'Updated School Name',
                address: 'Updated Address 123',
                defaultMaxStudentsPerClass: 30
            };

            const updatedSchool = await schoolRepository.update(testSchool._id, updateData);
            expect(updatedSchool).not.toBeNull();
            expect(updatedSchool.name).toBe('Updated School Name');
            expect(updatedSchool.address).toBe('Updated Address 123');
            expect(updatedSchool.defaultMaxStudentsPerClass).toBe(30);

            // Verifica che la scuola sia stata aggiornata nel database
            const savedSchool = await School.findById(testSchool._id);
            expect(savedSchool.name).toBe('Updated School Name');
        });

        it('should throw error for invalid ID', async () => {
            // Test update con ID invalido
            const updateData = { name: 'Updated Name' };
            try {
                await schoolRepository.update('invalidid', updateData);
                // Se arriviamo qui, il test fallisce perché non è stata lanciata un'eccezione
                fail('Expected exception was not thrown');
            } catch (error) {
                // Verifichiamo che l'errore sia definito
                expect(error).toBeDefined();
                // Possiamo anche verificare proprietà specifiche dell'errore
                expect(error.message).toBeDefined();
            }
        });

        it('should throw error for non-existent ID', async () => {
            // Test update con ID non esistente
            const nonExistentId = new mongoose.Types.ObjectId();
            const updateData = { name: 'Updated Name' };
            try {
                await schoolRepository.update(nonExistentId, updateData);
                // Se arriviamo qui, il test fallisce perché non è stata lanciata un'eccezione
                fail('Expected exception was not thrown');
            } catch (error) {
                // Verifichiamo che l'errore sia definito
                expect(error).toBeDefined();
                // Possiamo anche verificare proprietà specifiche dell'errore
                expect(error.message).toBeDefined();
            }
        });
    });

    describe('addUser', () => {
        it('should add a user to the school', async () => {
            // Crea un nuovo utente
            const newUser = await User.create({
                firstName: 'New',
                lastName: 'User',
                email: 'newuser@example.com',
                password: 'password123',
                role: 'teacher',
                status: 'active'
            });

            // Aggiungi l'utente alla scuola
            const updatedSchool = await schoolRepository.addUser(
                testSchool._id,
                newUser._id,
                'teacher'
            );

            // Verifica che l'utente sia stato aggiunto
            expect(updatedSchool.users).toHaveLength(2); // Il manager più il nuovo utente
            const addedUser = updatedSchool.users.find(
                u => u.user.toString() === newUser._id.toString()
            );
            expect(addedUser).toBeDefined();
            expect(addedUser.role).toBe('teacher');

            // Verifica che l'utente sia stato aggiornato con la scuola
            const updatedUser = await User.findById(newUser._id);
            expect(updatedUser.assignedSchoolIds).toContainEqual(testSchool._id);
        });

        it('should throw error for already added user', async () => {
            // Ottieni il manager esistente
            const manager = await User.findOne({ email: 'manager@example.com' });

            // Tenta di aggiungere lo stesso utente di nuovo
            try {
                await schoolRepository.addUser(
                    testSchool._id,
                    manager._id,
                    'teacher'
                );
                fail('Expected exception was not thrown');
            } catch (error) {
                expect(error).toBeDefined();
                expect(error.message).toContain('Utente già associato alla scuola');
            }
        });
    });

    describe('findByRegion', () => {
        it('should find schools by region', async () => {
            // Crea un'altra scuola nella stessa regione
            await createTestSchool({
                name: 'Another School in Lombardia',
                schoolType: 'middle_school',
                institutionType: 'none',
                region: 'Lombardia',
                province: 'Brescia',
                address: 'Via Brescia 456',
                manager: testSchool.manager, // Usa lo stesso manager
                defaultMaxStudentsPerClass: 20
            });

            // Cerca scuole per regione
            const schools = await schoolRepository.findByRegion('Lombardia');
            expect(schools).toHaveLength(2);
            expect(schools[0].region).toBe('Lombardia');
            expect(schools[1].region).toBe('Lombardia');
        });

        it('should return empty array for non-existent region', async () => {
            // Cerca scuole in una regione inesistente
            const schools = await schoolRepository.findByRegion('Sicilia');
            expect(schools).toHaveLength(0);
        });
    });

    describe('setupAcademicYear', () => {
        it('should setup a new academic year', async () => {
            // Prepara i dati per il nuovo anno accademico
            const yearData = {
                year: '2024/2025',
                status: 'planned',
                startDate: new Date('2024-09-01'),
                endDate: new Date('2025-06-15'),
                createdBy: testSchool.manager
            };

            // Configura il nuovo anno accademico
            const updatedSchool = await schoolRepository.setupAcademicYear(
                testSchool._id,
                yearData,
                true // createClasses = true
            );

            // Verifica che l'anno sia stato aggiunto
            expect(updatedSchool.academicYears).toHaveLength(2);
            const addedYear = updatedSchool.academicYears.find(
                y => y.year === '2024/2025'
            );
            expect(addedYear).toBeDefined();
            expect(addedYear.status).toBe('planned');
            expect(addedYear.startDate).toEqual(yearData.startDate);
            expect(addedYear.endDate).toEqual(yearData.endDate);
        });

        it('should throw error for duplicate academic year', async () => {
            // Tenta di aggiungere un anno già esistente
            const duplicateYearData = {
                year: '2023/2024', // Anno già esistente
                status: 'planned',
                startDate: new Date('2023-09-01'),
                endDate: new Date('2024-06-15'),
                createdBy: testSchool.manager
            };

            try {
                await schoolRepository.setupAcademicYear(
                    testSchool._id,
                    duplicateYearData,
                    false
                );
                fail('Expected exception was not thrown');
            } catch (error) {
                expect(error).toBeDefined();
                expect(error.message).toContain('Anno accademico già presente');
            }
        });

        it('should validate year format', async () => {
            // Tenta di aggiungere un anno con formato non valido
            const invalidYearData = {
                year: '2024-2025', // Formato non valido (dovrebbe essere 2024/2025)
                status: 'planned',
                startDate: new Date('2024-09-01'),
                endDate: new Date('2025-06-15'),
                createdBy: testSchool.manager
            };

            try {
                await schoolRepository.setupAcademicYear(
                    testSchool._id,
                    invalidYearData,
                    false
                );
                fail('Expected exception was not thrown');
            } catch (error) {
                expect(error).toBeDefined();
                expect(error.message).toContain('Anno accademico deve essere nel formato YYYY/YYYY');
            }
        });
    });
    
    describe('removeUser', () => {
        it('should remove a user from the school', async () => {
            // Aggiungi un utente alla scuola prima di rimuoverlo
            await schoolRepository.addUser(
                testSchool._id,
                testTeacher._id,
                'teacher'
            );
            
            // Test per la rimozione dell'utente
            const result = await schoolRepository.removeUser(testSchool._id, testTeacher._id);
            
            expect(result.school).toBeDefined();
            expect(result.classesUpdated).toBeDefined();
            expect(result.studentsUpdated).toBeDefined();
            
            // Verifica che l'utente sia stato rimosso dall'array users della scuola
            const updatedSchool = await School.findById(testSchool._id);
            const userFound = updatedSchool.users.some(u => u.user.toString() === testTeacher._id.toString());
            expect(userFound).toBe(false);
            
            // Verifica che schoolId sia stato rimosso dall'utente
            const updatedUser = await User.findById(testTeacher._id);
            const schoolFound = updatedUser.assignedSchoolIds ? 
                updatedUser.assignedSchoolIds.some(id => id.toString() === testSchool._id.toString()) : 
                false;
            expect(schoolFound).toBe(false);
        });
        
        it('should throw error when trying to remove the last admin', async () => {
            // Test per la rimozione dell'ultimo admin (manager)
            try {
                await schoolRepository.removeUser(testSchool._id, testManager._id);
                fail('Expected exception was not thrown');
            } catch (error) {
                expect(error).toBeDefined();
                expect(error.message).toContain('Impossibile rimuovere l\'ultimo admin della scuola');
            }
        });
        
        it('should throw error when trying to remove the manager', async () => {
            // Test per la rimozione del manager
            try {
                await schoolRepository.removeUser(testSchool._id, testSchool.manager);
                fail('Expected exception was not thrown');
            } catch (error) {
                expect(error).toBeDefined();
                expect(error.message).toContain('Non è possibile rimuovere il manager della scuola');
            }
        });
    });
    
    describe('deactivateSection', () => {
        it('should deactivate a section', async () => {
            // Test per la disattivazione di una sezione
            const result = await schoolRepository.deactivateSection(testSchool._id, 'A');
            
            // Verifica che la sezione sia stata disattivata
            expect(result.school).toBeDefined();
            expect(result.studentsUpdated).toBeDefined();
            
            // Verifica che il repository ClassRepository sia stato chiamato
            expect(mockClassRepository.deactivateClassesBySection).toHaveBeenCalledWith(
                testSchool._id, 'A', expect.anything()
            );
            
            // Verifica che il repository StudentRepository sia stato chiamato
            expect(mockStudentRepository.updateStudentsForDeactivatedSection).toHaveBeenCalledWith(
                testSchool._id, 'A'
            );
            
            // Verifica che la sezione sia effettivamente disattivata nel db
            const updatedSchool = await School.findById(testSchool._id);
            const section = updatedSchool.sections.find(s => s.name === 'A');
            expect(section.isActive).toBe(false);
            expect(section.deactivatedAt).toBeDefined();
        });
        
        it('should throw error for non-existent section', async () => {
            // Test per la disattivazione di una sezione inesistente
            try {
                await schoolRepository.deactivateSection(testSchool._id, 'Z');
                fail('Expected exception was not thrown');
            } catch (error) {
                expect(error).toBeDefined();
                // Il messaggio dipende dall'implementazione specifica
            }
        });
    });
    
    describe('reactivateSection', () => {
        it('should reactivate a previously deactivated section', async () => {
            // Prima disattiva la sezione
            await schoolRepository.deactivateSection(testSchool._id, 'A');
            
            // Poi riattivala
            const result = await schoolRepository.reactivateSection(testSchool._id, 'A');
            
            // Verifica che la sezione sia stata riattivata
            expect(result.school).toBeDefined();
            expect(result.classesReactivated).toBeDefined();
            
            // Verifica che la sezione sia effettivamente riattivata nel db
            const updatedSchool = await School.findById(testSchool._id);
            const section = updatedSchool.sections.find(s => s.name === 'A');
            expect(section.isActive).toBe(true);
            expect(section.deactivatedAt).toBeUndefined();
        });
    });
    
    describe('findWithUsers', () => {
        it('should find a school with populated users', async () => {
            // Aggiungi un utente alla scuola
            await schoolRepository.addUser(
                testSchool._id,
                testTeacher._id,
                'teacher'
            );
            
            // Trova la scuola con gli utenti
            const school = await schoolRepository.findWithUsers(testSchool._id);
            
            // Verifica che gli utenti siano popolati
            expect(school).toBeDefined();
            expect(school.users).toHaveLength(2); // Manager + Teacher
            
            // Verifica che il manager sia popolato
            expect(school.manager).toBeDefined();
            // Questo dipende dall'implementazione di findWithUsers e da come popola i dati
        });
    });
    
    describe('getSectionsWithStudentCount', () => {
        it('should get sections with student count', async () => {
            // Mock per Class.aggregate
            const originalAggregate = mongoose.Model.prototype.aggregate;
            mongoose.Model.prototype.aggregate = jest.fn().mockResolvedValue([
                { _id: 'A', studentCount: 25 },
                { _id: 'B', studentCount: 15 }
            ]);
            
            // Chiamata al metodo
            const sections = await schoolRepository.getSectionsWithStudentCount(testSchool._id);
            
            // Verifica che le sezioni abbiano il conteggio studenti
            expect(sections).toHaveLength(2);
            
            // Pulizia
            mongoose.Model.prototype.aggregate = originalAggregate;
        });
    });
    
    describe('activateAcademicYear', () => {
        it('should activate an academic year and archive the current active one', async () => {
            // Crea un nuovo anno accademico pianificato
            const updatedSchool = await schoolRepository.setupAcademicYear(
                testSchool._id,
                {
                    year: '2024/2025',
                    status: 'planned',
                    startDate: new Date('2024-09-01'),
                    endDate: new Date('2025-06-15'),
                    createdBy: testSchool.manager
                },
                false
            );
            
            // Prendi l'ID del nuovo anno
            const newYearId = updatedSchool.academicYears.find(y => y.year === '2024/2025')._id;
            
            // Attiva il nuovo anno
            const result = await schoolRepository.activateAcademicYear(testSchool._id, newYearId);
            
            // Verifica che il nuovo anno sia attivo
            const activeYear = result.academicYears.find(y => y.status === 'active');
            expect(activeYear.year).toBe('2024/2025');
            
            // Verifica che il vecchio anno attivo sia stato archiviato
            const oldActiveYear = result.academicYears.find(y => y.year === '2023/2024');
            expect(oldActiveYear.status).toBe('archived');
        });
    });
    
    describe('archiveAcademicYear', () => {
        it('should archive an academic year', async () => {
            // Prendi l'ID dell'anno attivo
            const activeYearId = testSchool.academicYears.find(y => y.status === 'active')._id;
            
            // Archivia l'anno
            const result = await schoolRepository.archiveAcademicYear(testSchool._id, activeYearId);
            
            // Verifica che l'anno sia stato archiviato
            const archivedYear = result.academicYears.find(y => y._id.toString() === activeYearId.toString());
            expect(archivedYear.status).toBe('archived');
        });
    });
    
    describe('getClassesByAcademicYear', () => {
        it('should get classes for a specific academic year', async () => {
            // Mock per Class.find
            const mockClasses = [
                { year: 1, section: 'A', academicYear: '2023/2024' },
                { year: 1, section: 'B', academicYear: '2023/2024' }
            ];
            mockClassRepository.find.mockResolvedValue(mockClasses);
            
            // Chiamata al metodo
            const classes = await schoolRepository.getClassesByAcademicYear(testSchool._id, '2023/2024');
            
            // Verifica che le classi siano state restituite
            expect(classes).toEqual(mockClasses);
        });
    });
    
    describe('changeSchoolType', () => {
        it('should change school type from high school to middle school', async () => {
            // Mock per la chiamata a Class.updateMany
            const Class = mongoose.model('Class') || { updateMany: jest.fn(), find: jest.fn() };
            const originalUpdateMany = Class.updateMany;
            const originalFind = Class.find;
            
            Class.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 2 });
            Class.find = jest.fn().mockResolvedValue([
                { _id: 'class1', year: 4, section: 'A' },
                { _id: 'class2', year: 5, section: 'A' }
            ]);
            
            // Chiamata al metodo
            const result = await schoolRepository.changeSchoolType(testSchool._id, {
                schoolType: 'middle_school',
                institutionType: 'none'
            });
            
            // Verifica che il tipo scuola sia stato cambiato
            expect(result.schoolType).toBe('middle_school');
            expect(result.institutionType).toBe('none');
            
            // Pulizia
            if (originalUpdateMany) Class.updateMany = originalUpdateMany;
            if (originalFind) Class.find = originalFind;
        });
        
        it('should throw error when changing to middle school with invalid institution type', async () => {
            try {
                await schoolRepository.changeSchoolType(testSchool._id, {
                    schoolType: 'middle_school',
                    institutionType: 'scientific' // Dovrebbe essere 'none' per le scuole medie
                });
                fail('Expected exception was not thrown');
            } catch (error) {
                expect(error).toBeDefined();
                expect(error.message).toContain('Le scuole medie devono avere tipo istituto impostato come "nessuno"');
            }
        });
    });
});