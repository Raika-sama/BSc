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
           manager: new mongoose.Types.ObjectId(),
           defaultMaxStudentsPerClass: 25
       });
   });

   afterEach(async () => {
       await Class.deleteMany({});
       await School.deleteMany({});
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
       let oldClass;

       beforeEach(async () => {
           oldClass = await Class.create({
               schoolId: mockSchool._id,
               year: 1,
               section: 'A',
               academicYear: '2024/2025',
               status: 'active',
               capacity: 25,
               students: [
                   {
                       studentId: new mongoose.Types.ObjectId(),
                       status: 'active'
                   }
               ]
           });
       });

       it('should promote students to next year', async () => {
           await repository.promoteStudents('2024/2025', '2025/2026');

           const newClass = await Class.findOne({
               schoolId: mockSchool._id,
               year: 2,
               section: 'A',
               academicYear: '2025/2026'
           });

           expect(newClass).toBeTruthy();
           
           const oldClassUpdated = await Class.findById(oldClass._id);
           expect(oldClassUpdated.students[0].status).toBe('transferred');
           expect(oldClassUpdated.students[0].leftAt).toBeTruthy();
       });

       it('should not promote final year students', async () => {
           oldClass.year = 3; // Final year for middle school
           await oldClass.save();

           await repository.promoteStudents('2024/2025', '2025/2026');

           const newClass = await Class.findOne({
               schoolId: mockSchool._id,
               academicYear: '2025/2026'
           });

           expect(newClass).toBeFalsy();
       });
   });

   describe('getByAcademicYear', () => {
       it('should return classes for specific academic year', async () => {
           await Class.create([
               {
                   schoolId: mockSchool._id,
                   year: 1,
                   section: 'A',
                   academicYear: '2024/2025',
                   capacity: 25
               },
               {
                   schoolId: mockSchool._id,
                   year: 1,
                   section: 'A',
                   academicYear: '2025/2026',
                   capacity: 25
               }
           ]);

           const classes = await repository.getByAcademicYear(mockSchool._id, '2024/2025');
           expect(classes).toHaveLength(1);
           expect(classes[0].academicYear).toBe('2024/2025');
       });
   });
});