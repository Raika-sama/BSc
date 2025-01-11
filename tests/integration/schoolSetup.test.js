// tests/integration/schoolSetup.test.js
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../src/app');
const { School, Class, User } = require('../../src/models');

const ADMIN_CREDENTIALS = {
    email: 'admin.sama@brainscanner.com',
    password: '123456789'
};

describe('School Setup Integration', () => {
    let authToken;
    let adminUser;

    beforeAll(async () => {
        try {
            // Ottieni l'admin esistente
            adminUser = await User.findOne({ email: ADMIN_CREDENTIALS.email });
            if (!adminUser) {
                throw new Error('Admin user not found in database');
            }

            // Login con le credenziali esistenti
            const loginResponse = await request(app)
                .post('/api/v1/auth/login')
                .send(ADMIN_CREDENTIALS);

            if (!loginResponse.body.token) {
                console.error('Login failed:', loginResponse.body);
                throw new Error('Login failed: ' + JSON.stringify(loginResponse.body));
            }
            
            authToken = loginResponse.body.token;
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
            console.log('=== Setting up Year Transition Test ===');
            
            try {
                // Crea una nuova scuola per il test
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
                console.log('Created test school:', { schoolId: schoolId.toString() });
    
                // Crea le classi iniziali
                const classesData = [
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
                ];
    
                const createdClasses = await Class.create(classesData);
                console.log('Created initial classes:', {
                    count: createdClasses.length,
                    classes: createdClasses.map(c => ({
                        id: c._id.toString(),
                        year: c.year,
                        section: c.section
                    }))
                });
    
            } catch (error) {
                console.error('Setup failed:', {
                    error: error.message,
                    stack: error.stack
                });
                throw error;
            }
        });
    
        afterEach(async () => {
            // Pulisci i dati dopo ogni test
            await Promise.all([
                School.deleteOne({ _id: schoolId }),
                Class.deleteMany({ schoolId })
            ]);
            console.log('Cleanup completed');
        });
    
        it('should handle academic year transition', async () => {
            try {
                console.log('Starting transition test with:', {
                    schoolId: schoolId.toString(),
                    adminUser: adminUser._id.toString()
                });
    
                // Verifica classi iniziali
                const initialClasses = await Class.find({ schoolId });
                console.log('Initial classes:', {
                    count: initialClasses.length,
                    classes: initialClasses.map(c => ({
                        year: c.year,
                        section: c.section,
                        status: c.status
                    }))
                });
    
                const payload = {
                    schoolId: schoolId.toString(),
                    fromYear: '2024/2025',
                    toYear: '2025/2026',
                    sections: [{
                        name: 'A',
                        maxStudents: 25,
                        mainTeacherId: adminUser._id.toString()
                    }]
                };
    
                console.log('Making transition request with payload:', payload);
    
                // Fai la chiamata
                const response = await makeAuthorizedRequest(
                    request(app)
                        .post('/api/v1/classes/transition')
                ).send(payload);
    
                console.log('Transition response:', {
                    status: response.status,
                    body: response.body,
                    error: response.body.error
                });
    
                // Se c'è un errore 500, logga più dettagli
                if (response.status === 500) {
                    console.error('Server error details:', {
                        error: response.body.error,
                        message: response.body.message,
                        stack: response.body.stack
                    });
                }
    
                expect(response.status).toBe(200);
    
                // resto del test...
            } catch (error) {
                console.error('Test failed:', {
                    message: error.message,
                    response: error.response?.body,
                    stack: error.stack
                });
                throw error;
            }
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