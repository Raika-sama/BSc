const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const UserRepository = require('@/repositories/UserRepository');
const User = require('@/models/User');
const SessionService = require('@/services/SessionService');
const { v4: uuidv4 } = require('uuid');
const { ErrorTypes } = require('@/utils/errors/errorTypes');

let mongoServer;
let userRepository;
let testUser;
let sessionServiceMock;

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

// Inizializzazione globale per tutti i test
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

// Struttura i test per renderli coerenti con altri repository
// Non più nidificati in describe, ma utilizza un formato "Metodo: descrizione"
describe('UserRepository', () => {
    
    // Test per findByEmail
    test('findByEmail: should find a user by email', async () => {
        const user = await userRepository.findByEmail('test@example.com');
        expect(user).not.toBeNull();
        expect(user.email).toBe('test@example.com');
    });

    test('findByEmail: should return null for non-existent email', async () => {
        const user = await userRepository.findByEmail('nonexistent@example.com');
        expect(user).toBeNull();
    });

    test('findByEmail: should include password when specified', async () => {
        const user = await userRepository.findByEmail('test@example.com', true);
        expect(user).not.toBeNull();
        expect(user.email).toBe('test@example.com');
        expect(user.password).toBeDefined();
    });

    test('findById: should find a user by ID', async () => {
        // Crea un nuovo utente di test specifico per questo test
        const specificTestUser = await createUserWithUniqueSession({
            firstName: 'FindById',
            lastName: 'TestUser',
            email: 'findbyid@example.com',
            password: 'password123',
            role: 'teacher',
            status: 'active'
        });
        
        const user = await userRepository.findById(specificTestUser._id);
        expect(user).not.toBeNull();
        expect(user._id.toString()).toBe(specificTestUser._id.toString());
    });

    test('findById: should throw error for invalid ID', async () => {
        try {
            await userRepository.findById('invalidid');
            fail('Expected exception was not thrown');
        } catch (error) {
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.status).toBeDefined();
            expect(error.code).toContain('VAL_');
        }
    });

    test('findById: should throw error for non-existent ID', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        try {
            await userRepository.findById(nonExistentId);
            fail('Expected exception was not thrown');
        } catch (error) {
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.status).toBeDefined();
            expect(error.code).toBe(ErrorTypes.RESOURCE.NOT_FOUND.code);
            expect(error.status).toBe(404);
        }
    });

    // Test per create
    test('create: should create a new user', async () => {
        const newUserData = {
            firstName: 'New',
            lastName: 'User',
            email: 'new@example.com',
            password: 'newpassword123',
            role: 'admin',
            status: 'active',
            sessionTokens: [generateUniqueSessionToken('new@example.com')]
        };

        const newUser = await userRepository.create(newUserData);
        expect(newUser).not.toBeNull();
        expect(newUser.email).toBe('new@example.com');
        expect(newUser.role).toBe('admin');

        const savedUser = await User.findOne({ email: 'new@example.com' });
        expect(savedUser).not.toBeNull();
        expect(savedUser.firstName).toBe('New');
    });

    test('create: should throw error for duplicate email', async () => {
        const duplicateUserData = {
            firstName: 'Duplicate',
            lastName: 'User',
            email: 'test@example.com',
            password: 'password123',
            role: 'teacher',
            status: 'active',
            sessionTokens: [generateUniqueSessionToken('duplicate@example.com')]
        };

        try {
            await userRepository.create(duplicateUserData);
            fail('Expected exception was not thrown');
        } catch (error) {
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.status).toBeDefined();
            expect(error.code).toBe(ErrorTypes.RESOURCE.ALREADY_EXISTS.code);
            expect(error.status).toBe(409);
        }
    });

    test('update: should update an existing user', async () => {
        // Crea un nuovo utente di test specifico per questo test
        const specificTestUser = await createUserWithUniqueSession({
            firstName: 'UpdateTest',
            lastName: 'UserTest',
            email: 'updatetest@example.com',
            password: 'password123',
            role: 'teacher',
            status: 'active'
        });
        
        const updateData = {
            firstName: 'Updated',
            lastName: 'Name',
            testAccessLevel: 2
        };
    
        const updatedUser = await userRepository.update(specificTestUser._id, updateData);
        expect(updatedUser).not.toBeNull();
        expect(updatedUser.firstName).toBe('Updated');
        expect(updatedUser.lastName).toBe('Name');
        expect(updatedUser.testAccessLevel).toBe(2);
    
        const savedUser = await User.findById(specificTestUser._id);
        expect(savedUser.firstName).toBe('Updated');
    });

    test('update: should throw error for invalid ID', async () => {
        const updateData = { firstName: 'Updated' };
        try {
            await userRepository.update('invalidid', updateData);
            fail('Expected exception was not thrown');
        } catch (error) {
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.status).toBeDefined();
            expect(error.code).toContain('VAL_');
        }
    });

    test('update: should throw error for non-existent ID', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const updateData = { firstName: 'Updated' };
        try {
            await userRepository.update(nonExistentId, updateData);
            fail('Expected exception was not thrown');
        } catch (error) {
            expect(error).toBeDefined();
            expect(error.code).toBeDefined();
            expect(error.status).toBeDefined();
            expect(error.code).toBe(ErrorTypes.RESOURCE.NOT_FOUND.code);
            expect(error.status).toBe(404);
        }
    });

    // Preparazione dati per i test di findWithFilters
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
    
    // Test per findWithFilters
    test('findWithFilters: should find users with search filter', async () => {
        const result = await userRepository.findWithFilters({ search: 'Doe' });
        expect(result.users.length).toBe(2); // John Doe e Jane Doe
    });

    test('findWithFilters: should find users with role filter', async () => {
        const result = await userRepository.findWithFilters({ role: 'teacher' });
        expect(result.users.length).toBe(2); // Test User e Jane Doe
    });

    test('findWithFilters: should find users with status filter', async () => {
        const result = await userRepository.findWithFilters({ status: 'inactive' });
        expect(result.users.length).toBe(1); // Jane Doe
    });

    test('findWithFilters: should find users with combined filters', async () => {
        const result = await userRepository.findWithFilters({ 
            search: 'Doe', 
            role: 'admin' 
        });
        expect(result.users.length).toBe(1); // John Doe
    });

    test('findWithFilters: should support pagination', async () => {
        const result = await userRepository.findWithFilters({}, { page: 1, limit: 2 });
        expect(result.users.length).toBe(2);
        expect(result.total).toBe(4);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(2);
    });
});