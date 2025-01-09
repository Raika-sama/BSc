// tests/unit/repositories/ClassRepository.test.js
const mongoose = require('mongoose');
const { Class, School } = require('../../../src/models');
const ClassRepository = require('../../../src/repositories/ClassRepository');

describe('ClassRepository', () => {
    let repository;
    let mockSchool;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: 'brainscanner_test'
        });
        repository = new ClassRepository();  // Usa ClassRepository invece di SchoolRepository
    });

    beforeEach(async () => {
        // Crea una scuola mock per i test
        mockSchool = await School.create({
            name: 'Test School',
            schoolType: 'middle_school',
            region: 'Test Region',
            province: 'Test Province',
            address: 'Test Address',
            manager: new mongoose.Types.ObjectId()
        });
    });

    afterEach(async () => {
        await School.deleteMany({});
        await Class.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    describe('createInitialClasses', () => {
        it('should create classes for all years and sections', async () => {
            const sections = [
                { name: 'A', maxStudents: 25 },
                { name: 'B', maxStudents: 25 }
            ];

            const classes = await repository.createInitialClasses(
                mockSchool._id,
                '2024/2025',
                sections
            );

            expect(classes).toHaveLength(6); // 3 years * 2 sections
            expect(classes[0].year).toBe(1);
            expect(classes[0].section).toBe('A');
        });

        it('should respect school type for number of years', async () => {
            // Modifica il tipo di scuola a high_school
            mockSchool.schoolType = 'high_school';
            await mockSchool.save();

            const sections = [{ name: 'A', maxStudents: 25 }];
            const classes = await repository.createInitialClasses(
                mockSchool._id,
                '2024/2025',
                sections
            );

            expect(classes).toHaveLength(5); // 5 years * 1 section
        });
    });

    describe('promoteStudents', () => {
        beforeEach(async () => {
            // Crea alcune classi per i test
            await Class.create([
                {
                    schoolId: mockSchool._id,
                    year: 1,
                    section: 'A',
                    academicYear: '2024/2025',
                    status: 'active',
                    capacity: 25
                },
                {
                    schoolId: mockSchool._id,
                    year: 2,
                    section: 'A',
                    academicYear: '2024/2025',
                    status: 'active',
                    capacity: 25
                }
            ]);
        });

        it('should promote students to next year', async () => {
            await repository.promoteStudents('2024/2025', '2025/2026');

            const newClasses = await Class.find({
                schoolId: mockSchool._id,
                academicYear: '2025/2026'
            });

            expect(newClasses).toHaveLength(2); // 2 classi promosse
        });

        it('should not promote final year students', async () => {
            // Crea una classe dell'ultimo anno
            await Class.create({
                schoolId: mockSchool._id,
                year: 3, // Ultimo anno per middle school
                section: 'A',
                academicYear: '2024/2025',
                status: 'active',
                capacity: 25
            });

            await repository.promoteStudents('2024/2025', '2025/2026');

            const newFinalYearClass = await Class.findOne({
                schoolId: mockSchool._id,
                academicYear: '2025/2026',
                year: 4 // Non dovrebbe esistere
            });

            expect(newFinalYearClass).toBeNull();
        });
    });
});