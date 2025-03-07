#!/usr/bin/env node
/**
 * @file runTests.js
 * @description Script CLI per eseguire i test del sistema
 * 
 * Uso:
 *   node runTests.js [--unit|--integration|--all] [--file=percorso/al/file.test.js]
 * 
 * Esempi:
 *   node runTests.js --unit
 *   node runTests.js --integration
 *   node runTests.js --all
 *   node runTests.js --unit --file=src/systemTests/unit/repositories/UserRepository.test.js
 */

const { runJest } = require('../utils/test/jestRunner');

async function main() {
    try {
        const args = process.argv.slice(2);
        let jestArgs = [];
        let testType = '';
        
        // Analizza gli argomenti
        if (args.includes('--unit')) {
            jestArgs.push('--testPathPattern=src/systemTests/unit');
            testType = 'unit';
        } else if (args.includes('--integration')) {
            jestArgs.push('--testPathPattern=src/systemTests/integration');
            testType = 'integration';
        } else if (args.includes('--all') || args.length === 0) {
            // Se non viene specificato nessun tipo di test, esegui tutti i test
            testType = 'all';
        }
        
        // Controlla se è specificato un file specifico
        const fileArg = args.find(arg => arg.startsWith('--file='));
        if (fileArg) {
            const filePath = fileArg.split('=')[1];
            jestArgs = [`--testPathPattern=${filePath}`];
        }
        
        console.log(`Esecuzione dei test ${testType}...`);
        const { results, code } = await runJest(jestArgs);
        
        // Stampa un resoconto dei risultati
        console.log('\n=============== RISULTATI DEI TEST ===============');
        console.log(`Test passati: ${results.numPassedTests || 0}/${results.numTotalTests || 0}`);
        console.log(`Test falliti: ${results.numFailedTests || 0}/${results.numTotalTests || 0}`);
        
        // Elenca i test falliti, se presenti
        if (results.numFailedTests > 0 && results.testResults) {
            console.log('\nDettaglio dei test falliti:');
            results.testResults.forEach(testResult => {
                if (testResult.status === 'failed') {
                    console.log(`- ${testResult.name}`);
                    testResult.assertionResults.forEach(assertion => {
                        if (assertion.status === 'failed') {
                            console.log(`  * ${assertion.title}`);
                        }
                    });
                }
            });
        }
        
        console.log('===============================================\n');
        
        // Termina con il codice appropriato
        process.exit(code);
    } catch (error) {
        console.error('Errore durante l\'esecuzione dei test:', error.message);
        process.exit(1);
    }
}

main();