// tests/integration/schoolSetup.test.js
// tests/integration/schoolSetup.test.js

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../src/app');
const { School, Class, User } = require('../../src/models');

describe('School Setup Integration', () => {
    let authToken;
    let adminUser;

    beforeAll(async () => {
        try {
            await mongoose.connect(process.env.MONGODB_URI);
    
           
    
            // Crea l'utente admin con tutti i campi necessari
            const adminData = {
                email: 'admin@test.com',
                password: 'password123',
                firstName: 'Admin',
                lastName: 'Test',
                role: 'admin',
                isActive: true // Aggiungi questo
            };
    
            // Crea il nuovo admin
            adminUser = await User.create(adminData);
            console.log('Admin user created successfully:', adminUser._id);
    
            // Login con gestione errori dettagliata
            const loginResponse = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: adminData.email,
                    password: adminData.password
                });
    
            if (!loginResponse.body.token) {
                console.error('Login failed:', loginResponse.body);
                throw new Error('Login failed: ' + JSON.stringify(loginResponse.body));
            }
            console.log('Login response:', loginResponse.body);

            authToken = loginResponse.body.token;
            if (!authToken) {
                throw new Error('Token non ottenuto dal login');
            }
            // Verifica il token immediatamente
            const verifyResponse = await request(app)
                .get('/api/v1/auth/verify')
                .set('Authorization', `Bearer ${authToken}`);
    
            if (verifyResponse.status !== 200) {
                throw new Error('Token verification failed');
            }
    
        } catch (error) {
            console.error('Setup failed:', error);
            throw error;
        }
    });
    
    // Modifica la funzione helper per l'autenticazione
    const makeAuthorizedRequest = (request) => {
        console.log('Token being used:', authToken);
        console.log('Headers being sent:', {
            'Authorization': `Bearer ${authToken}`
        });
            if (!authToken) {
            throw new Error('Auth token not available');
        }
        return request.set('Authorization', `Bearer ${authToken}`);
    };
    

    // Test per la creazione della scuola
    describe('Complete School Setup Flow', () => {
        it('should handle full school setup process', async () => {
            // Step 1: Create School
            const schoolData = {
                name: 'Integration Test School',
                schoolType: 'middle_school',
                region: 'Test Region',
                province: 'Test Province',
                address: 'Test Address'
            };

            const schoolResponse = await makeAuthorizedRequest(
                request(app)
                    .post('/api/v1/schools')
            ).send(schoolData);

            expect(schoolResponse.status).toBe(201);
            const schoolId = schoolResponse.body.data.school._id;

            // Step 2: Setup Initial Configuration
            const setupData = {
                academicYear: '2024/2025',
                startDate: '2024-09-01',
                endDate: '2025-06-30',
                sections: [
                    { name: 'A', maxStudents: 25 },
                    { name: 'B', maxStudents: 25 }
                ]
            };

            const setupResponse = await makeAuthorizedRequest(
                request(app)
                    .post(`/api/v1/schools/${schoolId}/setup`)
            ).send(setupData);

            expect(setupResponse.status).toBe(200);
            expect(setupResponse.body.data).toBeDefined();
            expect(Array.isArray(setupResponse.body.data.sections)).toBe(true);
            expect(setupResponse.body.data.sections.length).toBe(2);

            // Verifica delle classi create
            const classesResponse = await makeAuthorizedRequest(
                request(app)
                  .get(`/api/v1/classes/school/${schoolId}/year/${encodeURIComponent('2024/2025')}`)
            );

            expect(classesResponse.status).toBe(200);
            const classes = classesResponse.body.data.classes;
            expect(classes).toHaveLength(6); // 3 anni * 2 sezioni
        });
    });



    describe('Year Transition Flow', () => {
        let schoolId;

        beforeEach(async () => {
            const school = await School.create({
                name: 'Year Transition Test School',
                schoolType: 'middle_school',
                region: 'Test Region',
                province: 'Test Province',
                address: 'Test Address',
                manager: adminUser._id,
                isActive: true
            });
            schoolId = school._id;

            await Class.create([
                {
                    schoolId,
                    year: 1,
                    section: 'A',
                    academicYear: '2024/2025',
                    status: 'active',
                    capacity: 25,
                    mainTeacher: adminUser._id
                },
                {
                    schoolId,
                    year: 2,
                    section: 'A',
                    academicYear: '2024/2025',
                    status: 'active',
                    capacity: 25,
                    mainTeacher: adminUser._id
                }
            ]);
        });

        it('should handle academic year transition', async () => {
            const response = await makeAuthorizedRequest(
                request(app)
                    .post('/api/v1/classes/transition')
            ).send({
                schoolId,
                fromYear: '2024/2025',
                toYear: '2025/2026',
                sections: [{ name: 'A', maxStudents: 25 }]
            });

            expect(response.status).toBe(200);

            const newClasses = await Class.find({
                schoolId,
                academicYear: '2025/2026'
            });

            expect(newClasses).toHaveLength(3);

            const oldClasses = await Class.find({
                schoolId,
                academicYear: '2024/2025'
            });

            oldClasses.forEach(cls => {
                expect(cls.status).toBe('archived');
            });

            const promotedClasses = newClasses.filter(c => c.year > 1);
            expect(promotedClasses).toHaveLength(2);
            expect(promotedClasses.some(c => c.year === 2)).toBe(true);
            expect(promotedClasses.some(c => c.year === 3)).toBe(true);

            const newFirstYearClass = newClasses.find(c => c.year === 1);
            expect(newFirstYearClass).toBeDefined();
            expect(newFirstYearClass.section).toBe('A');
            expect(newFirstYearClass.capacity).toBe(25);
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid school creation', async () => {
            const response = await makeAuthorizedRequest(
                request(app)
                    .post('/api/v1/schools')
            ).send({
                name: 'Test School' // Dati incompleti
            });

            expect(response.status).toBe(400);
            expect(response.body.error).toBeDefined();
        });

        it('should handle invalid setup configuration', async () => {
            const school = await School.create({
                name: 'Error Test School',
                schoolType: 'middle_school',
                region: 'Test Region',
                province: 'Test Province',
                address: 'Test Address',
                manager: adminUser._id,
                isActive: true
            });

            const response = await makeAuthorizedRequest(
                request(app)
                    .post(`/api/v1/schools/${school._id}/setup`)
            ).send({
                academicYear: '2024/2025' // Dati incompleti
            });

            expect(response.status).toBe(400);
            expect(response.body.error).toBeDefined();
        });
    });
});