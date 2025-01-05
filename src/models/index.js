// src/models/index.js

/**
 * File di esportazione centralizzata per tutti i modelli MongoDB
 * Permette di importare i modelli in modo più pulito:
 * const { School, User, Class } = require('../models');
 * invece di:
 * const School = require('../models/School');
 * const User = require('../models/User');
 * etc.
 */

const School = require('./School');
const User = require('./User');
const Class = require('./Class');
const Student = require('./Student');
const { Test, Result } = require('./Test');

// Esporta tutti i modelli come oggetto
module.exports = {
    School,    // Modello per la gestione delle scuole
    User,      // Modello per la gestione degli utenti
    Class,     // Modello per la gestione delle classi
    Student,   // Modello per la gestione degli studenti
    Test,      // Modello per la struttura dei test
    Result     // Modello per i risultati dei test
};

// Verifica che tutti i modelli siano stati caricati correttamente
const models = {
    School,
    User,
    Class,
    Student,
    Test,
    Result
};

// Log dei modelli disponibili
console.log('Models loaded:', Object.keys(models));

// Verifica che ogni modello sia un modello Mongoose valido
Object.entries(models).forEach(([name, model]) => {
    if (!model.modelName) {
        console.error(`Warning: ${name} potrebbe non essere un modello Mongoose valido`);
    }
});