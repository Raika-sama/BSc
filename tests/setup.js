// tests/setup.js
require('dotenv').config({ path: '.env.test' });
const mongoose = require('mongoose');

mongoose.set('strictQuery', false);

// Setup globale prima di tutti i test
beforeAll(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB Test Database');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
});

// Cleanup dopo ogni test preservando l'admin
afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        if (key === 'users') {
            await collections[key].deleteMany({ 
                _id: { $ne: new mongoose.Types.ObjectId('6781b04838bdacd26c739bc9') }
            });
        } else {
            await collections[key].deleteMany();
        }
    }
});

afterAll(async () => {
    try {
        await mongoose.connection.close();
        console.log('Disconnected from MongoDB Test Database');
    } catch (error) {
        console.error('MongoDB disconnection error:', error);
    }
});

jest.spyOn(process, 'exit').mockImplementation(() => {});