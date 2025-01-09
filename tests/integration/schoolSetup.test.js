// tests/integration/schoolSetup.test.js

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../src/app');
const { School, Class } = require('../../src/models');

describe('School Setup Integration', () => {
   let authToken;
   let adminUser;

   beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);       // Setup admin user and get token
       const loginResponse = await request(app)
           .post('/api/v1/auth/login')
           .send({ email: 'admin@test.com', password: 'password123' });
       authToken = loginResponse.body.token;
       adminUser = loginResponse.body.user;
   });

   afterAll(async () => {
       await mongoose.connection.close();
   });

   afterEach(async () => {
       await School.deleteMany({});
       await Class.deleteMany({});
   });

   describe('Complete School Setup Flow', () => {
       it('should handle full school setup process', async () => {
           // Step 1: Create School
           const schoolResponse = await request(app)
               .post('/api/v1/schools')
               .set('Authorization', `Bearer ${authToken}`)
               .send({
                   name: 'Integration Test School',
                   schoolType: 'middle_school',
                   region: 'Test Region',
                   province: 'Test Province',
                   address: 'Test Address'
               });

           expect(schoolResponse.status).toBe(201);
           const schoolId = schoolResponse.body.data.school._id;

           // Step 2: Setup Initial Configuration
           const setupResponse = await request(app)
               .post(`/api/v1/schools/${schoolId}/setup`)
               .set('Authorization', `Bearer ${authToken}`)
               .send({
                   academicYear: '2024/2025',
                   startDate: '2024-09-01',
                   endDate: '2025-06-30',
                   sections: [
                       { name: 'A', maxStudents: 25 },
                       { name: 'B', maxStudents: 25 }
                   ]
               });

           expect(setupResponse.status).toBe(200);
           expect(setupResponse.body.data.sections).toHaveLength(2);

           // Step 3: Verify Created Classes
           const classesResponse = await request(app)
               .get(`/api/v1/classes/school/${schoolId}/year/2024/2025`)
               .set('Authorization', `Bearer ${authToken}`);

           expect(classesResponse.status).toBe(200);
           expect(classesResponse.body.data.classes).toHaveLength(6); // 3 years * 2 sections
       });
   });

   describe('Year Transition Flow', () => {
       let schoolId;

       beforeEach(async () => {
           // Setup initial school and classes
           const school = await School.create({
               name: 'Year Transition Test School',
               schoolType: 'middle_school',
               region: 'Test Region',
               province: 'Test Province',
               address: 'Test Address',
               manager: adminUser._id
           });
           schoolId = school._id;

           await Class.create([
               {
                   schoolId,
                   year: 1,
                   section: 'A',
                   academicYear: '2024/2025',
                   status: 'active',
                   capacity: 25
               },
               {
                   schoolId,
                   year: 2,
                   section: 'A',
                   academicYear: '2024/2025',
                   status: 'active',
                   capacity: 25
               }
           ]);
       });

       it('should handle academic year transition', async () => {
           const response = await request(app)
               .post('/api/v1/classes/transition')
               .set('Authorization', `Bearer ${authToken}`)
               .send({
                   schoolId,
                   fromYear: '2024/2025',
                   toYear: '2025/2026',
                   sections: [{ name: 'A', maxStudents: 25 }]
               });

           expect(response.status).toBe(200);

           // Verify new classes
           const newClasses = await Class.find({
               schoolId,
               academicYear: '2025/2026'
           });

           expect(newClasses).toHaveLength(3); // 2 promoted + 1 new first year
           
           // Verify old classes status
           const oldClasses = await Class.find({
               schoolId,
               academicYear: '2024/2025'
           });

           oldClasses.forEach(cls => {
               expect(cls.status).toBe('archived');
           });
       });
   });
});