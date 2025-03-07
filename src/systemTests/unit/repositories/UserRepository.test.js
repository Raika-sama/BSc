const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const UserRepository = require('@/repositories/UserRepository');
const User = require('@/models/User');
const SessionService = require('@/services/SessionService');
const { v4: uuidv4 } = require('uuid');

let mongoServer;

// Funzione helper per generare un token di sessione unico
const generateUniqueSessionToken = (email) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return {
        token: `${uuidv4()}-${email.split('@')[0]}`, // Token unico basato su UUID + parte dell'email
        createdAt: new Date(),
        lastUsedAt: new Date(),
        userAgent: 'Test Browser',
        ipAddress: '127.0.0.1',
        expiresAt: tomorrow
    };
};

// Funzione helper per creare un utente con token di sessione unico
const createUserWithUniqueSession = async (userData) => {
    // Crea il token di sessione unico
    const sessionToken = generateUniqueSessionToken(userData.email);
    
    // Crea l'utente con il token di sessione
    return await User.create({
        ...userData,
        sessionTokens: [sessionToken]
    });
};

describe('UserRepository', () => {
    let userRepository;
    let testUser;
    let sessionServiceMock;

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
        await User.deleteMany({});

        // Crea un mock per il SessionService
        sessionServiceMock = {
            removeAllSessions: jest.fn().mockResolvedValue(true)
        };

        // Inizializza il repository
        userRepository = new UserRepository(User, sessionServiceMock);

        // Crea un utente di test con un token di sessione unico
        testUser = await createUserWithUniqueSession({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'password123',
            role: 'teacher',
            status: 'active'
        });
    });

    describe('findByEmail', () => {
        it('should find a user by email', async () => {
            // Test findByEmail
            const user = await userRepository.findByEmail('test@example.com');
            expect(user).not.toBeNull();
            expect(user.email).toBe('test@example.com');
        });

        it('should return null for non-existent email', async () => {
            // Test findByEmail with non-existent email
            const user = await userRepository.findByEmail('nonexistent@example.com');
            expect(user).toBeNull();
        });

        it('should include password when specified', async () => {
            // Test findByEmail con password
            const user = await userRepository.findByEmail('test@example.com', true);
            expect(user).not.toBeNull();
            expect(user.email).toBe('test@example.com');
            expect(user.password).toBeDefined();
        });
    });

    describe('findById', () => {
        it('should find a user by ID', async () => {
            // Test findById
            const user = await userRepository.findById(testUser._id);
            expect(user).not.toBeNull();
            expect(user._id.toString()).toBe(testUser._id.toString());
        });

        it('should throw error for invalid ID', async () => {
            // Test findById with invalid ID
            try {
                await userRepository.findById('invalidid');
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
            // Test findById with non-existent ID
            const nonExistentId = new mongoose.Types.ObjectId();
            try {
                await userRepository.findById(nonExistentId);
                // Se arriviamo qui, il test fallisce perché non è stata lanciata un'eccezione
                fail('Expected exception was not thrown');
            } catch (error) {
                // Verifichiamo che l'errore sia definito
                expect(error).toBeDefined();
                // Possiamo anche verificare proprietà specifiche dell'errore se necessario
                expect(error.message).toBeDefined();
            }
        });
    });

    describe('create', () => {
        it('should create a new user', async () => {
            // Test create con email unica
            const newUserData = {
                firstName: 'New',
                lastName: 'User',
                email: 'new@example.com', // Email univoca
                password: 'newpassword123',
                role: 'admin',
                status: 'active',
                // Token unico generato durante la creazione dell'utente
                sessionTokens: [generateUniqueSessionToken('new@example.com')]
            };

            const newUser = await userRepository.create(newUserData);
            expect(newUser).not.toBeNull();
            expect(newUser.email).toBe('new@example.com');
            expect(newUser.role).toBe('admin');

            // Verifica che l'utente sia stato salvato nel database
            const savedUser = await User.findOne({ email: 'new@example.com' });
            expect(savedUser).not.toBeNull();
            expect(savedUser.firstName).toBe('New');
        });

        it('should throw error for duplicate email', async () => {
            // Test create with duplicate email
            const duplicateUserData = {
                firstName: 'Duplicate',
                lastName: 'User',
                email: 'test@example.com', // Email già esistente
                password: 'password123',
                role: 'teacher',
                status: 'active',
                // Anche se il token è diverso, l'email è duplicata
                sessionTokens: [generateUniqueSessionToken('duplicate@example.com')]
            };

            try {
                await userRepository.create(duplicateUserData);
                // Se arriviamo qui, il test fallisce perché non è stata lanciata un'eccezione
                fail('Expected exception was not thrown');
            } catch (error) {
                // Verifichiamo che l'errore sia definito
                expect(error).toBeDefined();
                // Possiamo anche verificare proprietà specifiche dell'errore
                expect(error.message).toContain('Email già registrata');
            }
        });
    });

    describe('update', () => {
        it('should update an existing user', async () => {
            // Test update
            const updateData = {
                firstName: 'Updated',
                lastName: 'Name',
                testAccessLevel: 2 // Usa un numero invece di una stringa
            };

            const updatedUser = await userRepository.update(testUser._id, updateData);
            expect(updatedUser).not.toBeNull();
            expect(updatedUser.firstName).toBe('Updated');
            expect(updatedUser.lastName).toBe('Name');
            expect(updatedUser.testAccessLevel).toBe(2);

            // Verifica che l'utente sia stato aggiornato nel database
            const savedUser = await User.findById(testUser._id);
            expect(savedUser.firstName).toBe('Updated');
        });

        it('should throw error for invalid ID', async () => {
            // Test update with invalid ID
            const updateData = { firstName: 'Updated' };
            try {
                await userRepository.update('invalidid', updateData);
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
            // Test update with non-existent ID
            const nonExistentId = new mongoose.Types.ObjectId();
            const updateData = { firstName: 'Updated' };
            try {
                await userRepository.update(nonExistentId, updateData);
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

    describe('findWithFilters', () => {
        beforeEach(async () => {
            // Elimina tutti gli utenti prima di crearne di nuovi
            await User.deleteMany({});
            
            // Crea più utenti per testare i filtri - ciascuno con un token di sessione unico
            await Promise.all([
                createUserWithUniqueSession({
                    firstName: 'Test',
                    lastName: 'User',
                    email: 'test@example.com',
                    password: 'password123',
                    role: 'teacher',
                    status: 'active'
                }),
                createUserWithUniqueSession({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    password: 'password123',
                    role: 'admin',
                    status: 'active'
                }),
                createUserWithUniqueSession({
                    firstName: 'Jane',
                    lastName: 'Doe',
                    email: 'jane@example.com',
                    password: 'password123',
                    role: 'teacher',
                    status: 'inactive'
                }),
                createUserWithUniqueSession({
                    firstName: 'Bob',
                    lastName: 'Smith',
                    email: 'bob@example.com',
                    password: 'password123',
                    role: 'student',
                    status: 'active'
                })
            ]);
        });
        
        it('should find users with search filter', async () => {
            // Test findWithFilters con filtro di ricerca
            const result = await userRepository.findWithFilters({ search: 'Doe' });
            expect(result.users.length).toBe(2); // John Doe e Jane Doe
        });

        it('should find users with role filter', async () => {
            // Test findWithFilters con filtro di ruolo
            const result = await userRepository.findWithFilters({ role: 'teacher' });
            expect(result.users.length).toBe(2); // Test User e Jane Doe
        });

        it('should find users with status filter', async () => {
            // Test findWithFilters con filtro di stato
            const result = await userRepository.findWithFilters({ status: 'inactive' });
            expect(result.users.length).toBe(1); // Jane Doe
        });

        it('should find users with combined filters', async () => {
            // Test findWithFilters con filtri combinati
            const result = await userRepository.findWithFilters({ 
                search: 'Doe', 
                role: 'admin' 
            });
            expect(result.users.length).toBe(1); // John Doe
        });

        it('should support pagination', async () => {
            // Test findWithFilters con paginazione
            const result = await userRepository.findWithFilters({}, { page: 1, limit: 2 });
            expect(result.users.length).toBe(2);
            expect(result.total).toBe(4); // Totale 4 utenti creati in beforeEach
            expect(result.page).toBe(1);
            expect(result.limit).toBe(2);
        });
    });
});