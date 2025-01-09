// tests/unit/repositories/SchoolRepository.test.js

const mongoose = require('mongoose');
const { School } = require('../../../src/models');
const SchoolRepository = require('../../../src/repositories/SchoolRepository');
const { ErrorTypes } = require('../../../src/utils/errors/errorTypes');

describe('SchoolRepository', () => {
   let repository;
   let mockSchool;

   beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: 'brainscanner_test'  // specifica il database di test
    });
    repository = new SchoolRepository();
    });

   beforeEach(async () => {
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
   });

   afterAll(async () => {
       await mongoose.connection.close();
   });

   describe('setupAcademicYear', () => {
       it('should setup academic year correctly', async () => {
           const yearData = {
               year: '2024/2025',
               startDate: new Date('2024-09-01'),
               endDate: new Date('2025-06-30'),
               createdBy: new mongoose.Types.ObjectId()
           };

           const result = await repository.setupAcademicYear(mockSchool._id, yearData);

           expect(result.academicYears).toHaveLength(1);
           expect(result.academicYears[0].year).toBe(yearData.year);
           expect(result.academicYears[0].status).toBe('planned');
       });

       it('should validate academic year format', async () => {
           const yearData = {
               year: '2024-2025', // Invalid format
               startDate: new Date()
           };

           await expect(repository.setupAcademicYear(mockSchool._id, yearData))
               .rejects.toThrow(ErrorTypes.VALIDATION.INVALID_INPUT.message);
       });
   });

   describe('configureSections', () => {
       it('should configure sections with academic year', async () => {
           const sectionsData = [{
               name: 'A',
               academicYear: '2024/2025',
               maxStudents: 25
           }];

           const result = await repository.configureSections(mockSchool._id, sectionsData);

           expect(result.sections).toHaveLength(1);
           expect(result.sections[0].name).toBe('A');
           expect(result.sections[0].academicYears[0].maxStudents).toBe(25);
       });

       it('should validate section name format', async () => {
           const sectionsData = [{
               name: 'AA', // Invalid format
               academicYear: '2024/2025'
           }];

           await expect(repository.configureSections(mockSchool._id, sectionsData))
               .rejects.toThrow(ErrorTypes.VALIDATION.INVALID_INPUT.message);
       });
   });

   describe('updateSectionStatus', () => {
       it('should update section status for academic year', async () => {
           // Setup initial section
           await repository.configureSections(mockSchool._id, [{
               name: 'A',
               academicYear: '2024/2025',
               maxStudents: 25
           }]);

           const yearData = {
               year: '2025/2026',
               status: 'planned',
               maxStudents: 30
           };

           const result = await repository.updateSectionStatus(mockSchool._id, 'A', yearData);

           expect(result.sections[0].academicYears).toHaveLength(2);
           expect(result.sections[0].academicYears[1].maxStudents).toBe(30);
           expect(result.sections[0].academicYears[1].status).toBe('planned');
       });
   });
});