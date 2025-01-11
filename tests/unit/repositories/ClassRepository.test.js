const mongoose = require('mongoose');
const { School, Class } = require('../../../src/models');
const ClassRepository = require('../../../src/repositories/ClassRepository');

describe('ClassRepository', () => {
    let classRepository;
    let testSchool;
    let testManagerId;

    beforeEach(async () => {
        classRepository = new ClassRepository();
        testManagerId = new mongoose.Types.ObjectId();
        
        // Crea una scuola di test con manager
        testSchool = await School.create({
            name: 'Test School',
            schoolType: 'middle_school', // Default scuola media
            region: 'Test Region',
            province: 'Test Province',
            address: 'Test Address',
            isActive: true,
            manager: testManagerId,
            users: [{ user: testManagerId, role: 'admin' }]
        });
    });

    describe('createInitialClasses', () => {
        it('should create classes for all years and sections', async () => {
            const sections = [
                { name: 'A', maxStudents: 25 },
                { name: 'B', maxStudents: 25 }
            ];

            const classes = await classRepository.createInitialClasses(
                testSchool._id,
                '2024/2025',
                sections
            );

            expect(classes).toHaveLength(6); // 3 anni x 2 sezioni = 6 classi
            expect(classes[0].year).toBe(1);
            expect(classes[0].section).toBe('A');
            expect(classes[0].status).toBe('planned');
            expect(classes[0].capacity).toBe(25);
        });

        it('should respect school type for number of years', async () => {
            // Modifica la scuola in superiore
            await School.findByIdAndUpdate(testSchool._id, { 
                schoolType: 'high_school' 
            });

            const sections = [{ name: 'A', maxStudents: 25 }];

            const classes = await classRepository.createInitialClasses(
                testSchool._id,
                '2024/2025',
                sections
            );

            expect(classes).toHaveLength(5); // 5 anni per le superiori
            expect(classes[classes.length - 1].year).toBe(5);
        });
    });

    describe('promoteStudents', () => {
        it('should promote students to next year', async () => {
            // Setup classi iniziali
            await Class.create([
                {
                    schoolId: testSchool._id,
                    year: 1,
                    section: 'A',
                    academicYear: '2024/2025',
                    status: 'active',
                    capacity: 25,
                    mainTeacher: testManagerId,
                    students: [
                        {
                            studentId: new mongoose.Types.ObjectId(),
                            status: 'active'
                        }
                    ]
                },
                {
                    schoolId: testSchool._id,
                    year: 2,
                    section: 'A',
                    academicYear: '2024/2025',
                    status: 'active',
                    capacity: 25,
                    mainTeacher: testManagerId,
                    students: [
                        {
                            studentId: new mongoose.Types.ObjectId(),
                            status: 'active'
                        }
                    ]
                }
            ]);

            await classRepository.promoteStudents('2024/2025', '2025/2026');

            const updatedClasses = await Class.find({ 
                schoolId: testSchool._id
            }).sort({ year: 1 });

            // Verifica vecchie classi
            const oldClasses = updatedClasses.filter(c => 
                c.academicYear === '2024/2025'
            );
            expect(oldClasses[0].status).toBe('archived');
            expect(oldClasses[0].students[0].status).toBe('transferred');

            // Verifica nuove classi
            const newClasses = updatedClasses.filter(c => 
                c.academicYear === '2025/2026'
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
                academicYear: '2024/2025',
                status: 'active',
                capacity: 25,
                mainTeacher: testManagerId,
                students: [
                    {
                        studentId: new mongoose.Types.ObjectId(),
                        status: 'active'
                    }
                ]
            });

            await classRepository.promoteStudents('2024/2025', '2025/2026');

            const newClasses = await Class.find({
                schoolId: testSchool._id,
                academicYear: '2025/2026'
            });

            expect(newClasses).toHaveLength(0); // Non dovrebbero esserci nuove classi
            
            // Verifica che la classe originale sia stata archiviata
            const oldClass = await Class.findOne({
                schoolId: testSchool._id,
                year: 3,
                academicYear: '2024/2025'
            });
            expect(oldClass.status).toBe('archived');
            expect(oldClass.students[0].status).toBe('transferred');
        });
    });

    describe('error handling', () => {
        it('should handle database errors in createInitialClasses', async () => {
            // Simula un errore del database durante insertMany
            const mockError = new Error('Database connection failed');
            jest.spyOn(Class, 'insertMany').mockRejectedValueOnce(mockError);

            const sections = [{ name: 'A', maxStudents: 25 }];

            await expect(classRepository.createInitialClasses(
                testSchool._id,
                '2024/2025',
                sections
            )).rejects.toThrow('Errore nella creazione classi iniziali');

            // Ripristina il mock
            jest.restoreAllMocks();
        });

        it('should handle school not found in createInitialClasses', async () => {
            const nonExistentSchoolId = new mongoose.Types.ObjectId();
            const sections = [{ name: 'A', maxStudents: 25 }];

            await expect(classRepository.createInitialClasses(
                nonExistentSchoolId,
                '2024/2025',
                sections
            )).rejects.toThrow('Scuola non trovata');
        });

        it('should handle database errors in promoteStudents', async () => {
            // Setup classe iniziale
            await Class.create({
                schoolId: testSchool._id,
                year: 1,
                section: 'A',
                academicYear: '2024/2025',
                status: 'active',
                capacity: 25
            });

            // Simula un errore del database durante bulkWrite
            jest.spyOn(Class, 'bulkWrite').mockRejectedValueOnce(
                new Error('Bulk operation failed')
            );

            await expect(classRepository.promoteStudents(
                '2024/2025',
                '2025/2026'
            )).rejects.toThrow('Errore nella promozione studenti');

            jest.restoreAllMocks();
        });

        it('should handle transaction errors', async () => {
            // Simula un errore durante l'avvio della transazione
            jest.spyOn(mongoose, 'startSession').mockImplementationOnce(() => {
                throw new Error('Session start failed');
            });

            const sections = [{ name: 'A', maxStudents: 25 }];

            await expect(classRepository.createInitialClasses(
                testSchool._id,
                '2024/2025',
                sections
            )).rejects.toThrow('Errore nella creazione classi iniziali');

            jest.restoreAllMocks();
        });
    });

    describe('input validation', () => {
        it('should validate section format', async () => {
            const invalidSections = [
                { name: '1', maxStudents: 25 },  // Numero invece di lettera
                { name: 'AA', maxStudents: 25 }, // Due lettere
                { name: 'a', maxStudents: 25 }   // Lettera minuscola
            ];

            for (const section of invalidSections) {
                await expect(classRepository.createInitialClasses(
                    testSchool._id,
                    '2024/2025',
                    [section]
                )).rejects.toThrow();
            }
        });

        it('should validate academic year format', async () => {
            const sections = [{ name: 'A', maxStudents: 25 }];
            const invalidYears = [
                '2024-2025',    // Formato errato
                '2024',         // Anno singolo
                'invalid/year'  // Formato non numerico
            ];

            for (const year of invalidYears) {
                await expect(classRepository.createInitialClasses(
                    testSchool._id,
                    year,
                    sections
                )).rejects.toThrow();
            }
        });

        it('should validate maxStudents value', async () => {
            const invalidSections = [
                { name: 'A', maxStudents: 0 },    // Zero studenti
                { name: 'A', maxStudents: -1 },   // Valore negativo
                { name: 'A', maxStudents: 51 }    // Valore troppo alto
            ];

            for (const section of invalidSections) {
                await expect(classRepository.createInitialClasses(
                    testSchool._id,
                    '2024/2025',
                    [section]
                )).rejects.toThrow();
            }
        });
    });


    afterEach(async () => {
        await School.deleteMany({});
        await Class.deleteMany({});
    });
});