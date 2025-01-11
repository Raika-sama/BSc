const mongoose = require('mongoose');
const { School } = require('../../../src/models');
const SchoolRepository = require('../../../src/repositories/SchoolRepository');
const { ErrorTypes } = require('../../../src/utils/errors/errorTypes');

describe('SchoolRepository', () => {
    let schoolRepository;
    let testSchool;
    let testManagerId;

    beforeEach(async () => {
        schoolRepository = new SchoolRepository();
        testManagerId = new mongoose.Types.ObjectId();
        
        testSchool = await School.create({
            name: 'Test School',
            schoolType: 'middle_school',
            region: 'Test Region',
            province: 'Test Province',
            address: 'Test Address',
            isActive: true,
            manager: testManagerId,
            users: [{ user: testManagerId, role: 'admin' }]
        });
    });

    describe('setupAcademicYear', () => {
        it('should setup academic year correctly', async () => {
            const yearData = {
                year: '2024/2025',
                startDate: new Date('2024-09-01'),
                endDate: new Date('2025-06-30'),
                createdBy: testManagerId
            };

            const updatedSchool = await schoolRepository.setupAcademicYear(testSchool._id, yearData);

            expect(updatedSchool).toBeDefined();
            expect(updatedSchool.academicYears).toHaveLength(1);
            expect(updatedSchool.academicYears[0].year).toBe('2024/2025');
            expect(updatedSchool.academicYears[0].status).toBe('planned');
        });

        it('should validate academic year format', async () => {
            const yearData = {
                year: '2024-2025', // formato non valido
                startDate: new Date('2024-09-01'),
                endDate: new Date('2025-06-30'),
                createdBy: testManagerId
            };

            await expect(
                schoolRepository.setupAcademicYear(testSchool._id, yearData)
            ).rejects.toThrow(ErrorTypes.VALIDATION.INVALID_INPUT.message);
        });
    });

    describe('configureSections', () => {
        it('should configure sections with academic year', async () => {
            const sectionsData = [
                { name: 'A', maxStudents: 25, academicYear: '2024/2025' },
                { name: 'B', maxStudents: 25, academicYear: '2024/2025' }
            ];

            const updatedSchool = await schoolRepository.configureSections(testSchool._id, sectionsData);

            expect(updatedSchool).toBeDefined();
            expect(updatedSchool.sections).toHaveLength(2);
            expect(updatedSchool.sections[0].name).toBe('A');
            expect(updatedSchool.sections[0].academicYears[0].maxStudents).toBe(25);
        });

        it('should validate section name format', async () => {
            const sectionsData = [
                { name: '1', maxStudents: 25 } // non valido, deve essere A-Z
            ];

            await expect(
                schoolRepository.configureSections(testSchool._id, sectionsData)
            ).rejects.toThrow(ErrorTypes.VALIDATION.INVALID_INPUT.message);
        });
    });

    describe('updateSectionStatus', () => {
        it('should update section status for academic year', async () => {
            // Prima configura una sezione
            await schoolRepository.configureSections(testSchool._id, [
                { name: 'A', maxStudents: 25, academicYear: '2024/2025' }
            ]);

            const yearData = {
                year: '2024/2025',
                status: 'active',
                maxStudents: 30
            };

            const updatedSchool = await schoolRepository.updateSectionStatus(
                testSchool._id,
                'A',
                yearData
            );

            expect(updatedSchool).toBeDefined();
            expect(updatedSchool.sections[0].academicYears).toHaveLength(2);
            expect(updatedSchool.sections[0].academicYears[1].status).toBe('active');
            expect(updatedSchool.sections[0].academicYears[1].maxStudents).toBe(30);
        });
    });
});