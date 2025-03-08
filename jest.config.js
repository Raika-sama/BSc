/**
 * Configurazione Jest per il progetto
 * @type {import('@jest/types').Config.InitialOptions}
 */
module.exports = {
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    // Imposta la directory root al progetto principale, non a src
    rootDir: './',
    
    // Pattern per trovare i file di test
    testMatch: [
        '**/src/systemTests/**/*.test.js',
        '**/src/systemTests/**/*.spec.js'
    ],
    
    // Escludi node_modules
    testPathIgnorePatterns: ['/node_modules/'],
    
    // Ambiente di test (node o jsdom)
    testEnvironment: 'node',
    
    // Timeout per i test (in millisecondi)
    testTimeout: 30000,
    
    // Mostra un resoconto dettagliato
    verbose: true,
    
    // Non usare transform di default
    transform: {},
    
    // Per MongoMemoryServer e altre dipendenze che usano ESM
    transformIgnorePatterns: [
        "node_modules/(?!(mongodb-memory-server|other-esm-package)/)"
    ],
    
    // Configurazione aggiuntiva per migliorare l'output dei risultati
    reporters: ['default'],
    
    // Abilita la raccolta di informazioni di copertura
    collectCoverage: false,
    
    // Mostra i risultati in modo più dettagliato
    displayName: {
        name: 'BrainScanner Tests',
        color: 'blue',
    },
    
    // Utilità per debug avanzato
    bail: false,
    
    // Output formattato
    prettierPath: null,
    
    // Aggiungi un timestamp all'output
    testLocationInResults: true
};