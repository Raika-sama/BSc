// src/models/index.js

/**
 * File di esportazione centralizzata per tutti i modelli MongoDB
 * Permette di importare i modelli in modo più pulito:
 * const { School, User, Class, Result, CSIResult } = require('../models');
 */

const School = require('./School');
const User = require('./User');
const Class = require('./Class');
const Student = require('./Student');
const Test = require('./Test');
const { Result, CSIResult } = require('./Result');  // Importa entrambi i modelli
const UserAudit = require('./UserAudit');

// Verifica che tutti i modelli siano stati caricati correttamente
const models = {
    School,
    User,
    Class,
    Student,
    Test,
    Result,
    CSIResult,  // Aggiungi CSIResult
    UserAudit
};

// Verifica che tutti i modelli siano stati caricati correttamente
Object.entries(models).forEach(([name, model]) => {
    if (!model || !model.modelName) {
        throw new Error(`Model ${name} non inizializzato correttamente`);
    }
});

console.log('Models loaded:', Object.keys(models));

// Esporta tutti i modelli come oggetto
module.exports = {
    School,    // Modello per la gestione delle scuole
    User,      // Modello per la gestione degli utenti
    Class,     // Modello per la gestione delle classi
    Student,   // Modello per la gestione degli studenti
    Test,      // Modello per la struttura dei test
    Result,    // Modello base per i risultati dei test
    CSIResult, // Modello specifico per i risultati CSI
    UserAudit  // Modello per Audit Utenti
};

// Log dei modelli disponibili
console.log('Models loaded:', Object.keys(models));

// Verifica che ogni modello sia un modello Mongoose valido
Object.entries(models).forEach(([name, model]) => {
    if (!model.modelName) {
        console.error(`Warning: ${name} potrebbe non essere un modello Mongoose valido`);
    } else {
        console.log(`Model ${name} loaded with discriminator:`, model.discriminators ? 'Yes' : 'No');
    }
});