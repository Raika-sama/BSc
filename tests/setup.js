// tests/setup.js
require('dotenv').config({ path: '.env.test' });
const mongoose = require('mongoose');
const { User } = require('../src/models');

// Configurazione mongoose
mongoose.set('strictQuery', false);





// Funzione per connettere al database
async function connectDB() {
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
}

// Funzione per disconnettere dal database
async function disconnectDB() {
    try {
        await mongoose.connection.close();
        console.log('Disconnected from MongoDB Test Database');
    } catch (error) {
        console.error('MongoDB disconnection error:', error);
    }
}

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

// Cleanup dopo tutti i test
afterAll(async () => {
    try {
        await mongoose.connection.close();
        console.log('Disconnected from MongoDB Test Database');
    } catch (error) {
        console.error('MongoDB disconnection error:', error);
    }
});

// Cleanup dopo ogni test
afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        
            await collections[key].deleteMany();
        
    
}});


// Mock per evitare process.exit nei test
jest.spyOn(process, 'exit').mockImplementation(() => {});