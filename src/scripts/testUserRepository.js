/**
 * Script per testare direttamente UserRepository.test.js
 * Eseguire con: node src/scripts/testUserRepository.js
 */

const { execSync } = require('child_process');
const path = require('path');

// Percorso al file di test
const testFilePath = path.join(
    process.cwd(), 
    'src',
    'systemTests',
    'unit',
    'repositories',
    'UserRepository.test.js'
);

console.log(`Esecuzione test: ${testFilePath}`);
console.log(`Directory corrente: ${process.cwd()}`);

try {
    // Esecuzione senza npx per vedere se c'è una differenza
    console.log('\n=== Esecuzione con node diretto ===');
    try {
        console.log('Tentativo di eseguire con node diretto...');
        const nodeOutput = execSync(`node "${testFilePath}"`, { 
            encoding: 'utf8',
            stdio: 'pipe'
        });
        console.log('Output:\n', nodeOutput);
    } catch (nodeError) {
        console.error('Errore con node diretto:', nodeError.message);
        if (nodeError.stdout) console.log('stdout:', nodeError.stdout);
        if (nodeError.stderr) console.log('stderr:', nodeError.stderr);
    }
    
    // Esecuzione con jest direttamente
    console.log('\n=== Esecuzione con Jest (npx jest) ===');
    try {
        console.log('Tentativo di eseguire con Jest...');
        const jestOutput = execSync(`npx jest "${testFilePath}" --no-cache`, { 
            encoding: 'utf8',
            stdio: 'pipe'
        });
        console.log('Output:\n', jestOutput);
    } catch (jestError) {
        console.error('Errore con Jest:', jestError.message);
        if (jestError.stdout) console.log('stdout:', jestError.stdout);
        if (jestError.stderr) console.log('stderr:', jestError.stderr);
    }
    
    // Esecuzione con jest in modalità verbose
    console.log('\n=== Esecuzione con Jest in modalità verbose ===');
    try {
        console.log('Tentativo di eseguire con Jest in modalità verbose...');
        const verboseOutput = execSync(`npx jest "${testFilePath}" --verbose --detectOpenHandles --no-cache`, { 
            encoding: 'utf8',
            stdio: 'pipe'
        });
        console.log('Output:\n', verboseOutput);
    } catch (verboseError) {
        console.error('Errore con Jest verbose:', verboseError.message);
        if (verboseError.stdout) console.log('stdout:', verboseError.stdout);
        if (verboseError.stderr) console.log('stderr:', verboseError.stderr);
    }
    
    // Esamina le dipendenze del test
    console.log('\n=== Analisi delle dipendenze ===');
    const fs = require('fs');
    const content = fs.readFileSync(testFilePath, 'utf8');
    
    // Trova tutte le importazioni
    const requireMatches = content.match(/require\(['"](.*?)['"]\)/g) || [];
    const importMatches = content.match(/import .* from ['"](.*?)['"]/g) || [];
    
    console.log('Dipendenze tramite require:');
    requireMatches.forEach(match => {
        const module = match.match(/require\(['"](.*?)['"]\)/)[1];
        console.log(`- ${module}`);
    });
    
    console.log('Dipendenze tramite import:');
    importMatches.forEach(match => {
        const importStatement = match.match(/import .* from ['"](.*?)['"]/)[1];
        console.log(`- ${importStatement}`);
    });
    
} catch (error) {
    console.error('Errore generale:', error);
}