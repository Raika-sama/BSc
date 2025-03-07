/**
 * Questo script aiuta a verificare il percorso corretto del file di test
 * Crea questo file come src/scripts/verifyTestPath.js ed eseguilo con:
 * node src/scripts/verifyTestPath.js
 */

const fs = require('fs');
const path = require('path');

// Percorso che stiamo cercando di verificare
const testPath = path.join(process.cwd(), 'src', 'systemTests', 'unit', 'repositories', 'UserRepository.test.js');

console.log(`Verifica dell'esistenza del file: ${testPath}`);

if (fs.existsSync(testPath)) {
    console.log(`✅ Il file esiste!`);
    console.log(`Contenuto della directory 'src/systemTests/unit/repositories':`);
    
    const dirPath = path.dirname(testPath);
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
        console.log(`- ${file}`);
    });
} else {
    console.log(`❌ Il file NON esiste!`);
    
    // Verifichiamo la struttura delle directory
    const baseDir = path.join(process.cwd(), 'src');
    console.log(`\nContenuto della directory 'src':`);
    if (fs.existsSync(baseDir)) {
        fs.readdirSync(baseDir).forEach(file => {
            console.log(`- ${file}`);
        });
    } else {
        console.log('La directory src non esiste!');
    }
    
    // Vediamo se esiste la directory systemTests
    const systemTestsDir = path.join(baseDir, 'systemTests');
    if (fs.existsSync(systemTestsDir)) {
        console.log(`\nContenuto della directory 'src/systemTests':`);
        fs.readdirSync(systemTestsDir).forEach(file => {
            console.log(`- ${file}`);
        });
        
        // Verifichiamo la directory unit
        const unitDir = path.join(systemTestsDir, 'unit');
        if (fs.existsSync(unitDir)) {
            console.log(`\nContenuto della directory 'src/systemTests/unit':`);
            fs.readdirSync(unitDir).forEach(file => {
                console.log(`- ${file}`);
            });
        } else {
            console.log('La directory src/systemTests/unit non esiste!');
        }
    } else {
        console.log('La directory src/systemTests non esiste!');
    }
}

// Verifichiamo anche dove si trova effettivamente il file UserRepository.test.js
console.log(`\nRicerca di UserRepository.test.js nell'intero progetto:`);

function findFile(dir, filename, results = []) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            findFile(fullPath, filename, results);
        } else if (file === filename) {
            results.push(fullPath);
        }
    }
    
    return results;
}

try {
    const foundFiles = findFile(process.cwd(), 'UserRepository.test.js');
    
    if (foundFiles.length > 0) {
        console.log(`File trovati (${foundFiles.length}):`);
        foundFiles.forEach(file => {
            console.log(`- ${file}`);
        });
    } else {
        console.log('File non trovato in nessuna directory!');
    }
} catch (error) {
    console.error('Errore durante la ricerca del file:', error.message);
}