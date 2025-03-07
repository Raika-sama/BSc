/**
 * Questo script verifica che Jest sia correttamente installato e funzionante
 * Crea questo file come src/scripts/checkJest.js ed eseguilo con:
 * node src/scripts/checkJest.js
 */

const { spawn } = require('child_process');

// Funzione per eseguire un comando e restituire l'output
function runCommand(command, args = []) {
    return new Promise((resolve, reject) => {
        console.log(`Esecuzione comando: ${command} ${args.join(' ')}`);
        
        const isWindows = process.platform === 'win32';
        const proc = spawn(command, args, { 
            shell: isWindows 
        });
        
        let stdout = '';
        let stderr = '';
        
        proc.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        proc.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        proc.on('close', (code) => {
            console.log(`Comando completato con codice ${code}`);
            resolve({ code, stdout, stderr });
        });
        
        proc.on('error', (err) => {
            console.error(`Errore nell'esecuzione del comando:`, err);
            reject(err);
        });
    });
}

async function main() {
    try {
        console.log('=== VERIFICA INSTALLAZIONE JEST ===');
        
        // 1. Verifica installazione npm
        console.log('\n1. Verifica installazione npm:');
        const npmResult = await runCommand('npm', ['--version']);
        console.log(`npm versione: ${npmResult.stdout.trim()}`);
        
        // 2. Verifica installazione Jest locale
        console.log('\n2. Verifica installazione Jest locale:');
        const jestPackageResult = await runCommand('npm', ['list', 'jest']);
        console.log(jestPackageResult.stdout);
        
        // 3. Prova ad eseguire Jest con npx
        console.log('\n3. Prova ad eseguire Jest con npx:');
        
        const isWindows = process.platform === 'win32';
        const npxCommand = isWindows ? 'npx.cmd' : 'npx';
        
        try {
            const jestVersionResult = await runCommand(npxCommand, ['jest', '--version']);
            console.log(`Jest versione: ${jestVersionResult.stdout.trim()}`);
        } catch (err) {
            console.error('Errore nell\'esecuzione di Jest tramite npx:', err.message);
        }
        
        // 4. Verifica configurazione Jest
        console.log('\n4. Verifica configurazione Jest:');
        try {
            const fs = require('fs');
            const path = require('path');
            
            const jestConfigPath = path.join(process.cwd(), 'jest.config.js');
            if (fs.existsSync(jestConfigPath)) {
                console.log('File jest.config.js trovato');
                const jestConfig = require(jestConfigPath);
                console.log('Configurazione Jest:', jestConfig);
            } else {
                console.log('File jest.config.js non trovato');
                
                // Verifica package.json per configurazione Jest
                const packageJsonPath = path.join(process.cwd(), 'package.json');
                if (fs.existsSync(packageJsonPath)) {
                    const packageJson = require(packageJsonPath);
                    if (packageJson.jest) {
                        console.log('Configurazione Jest trovata in package.json:');
                        console.log(packageJson.jest);
                    } else {
                        console.log('Nessuna configurazione Jest trovata in package.json');
                    }
                }
            }
        } catch (err) {
            console.error('Errore durante la verifica della configurazione:', err.message);
        }
        
        // 5. Prova a eseguire un test semplice
        console.log('\n5. Prova a eseguire un test semplice:');
        
        // Crea un test temporaneo
        const fs = require('fs');
        const path = require('path');
        const tempDir = path.join(process.cwd(), 'temp-test');
        
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        
        const tempTestFile = path.join(tempDir, 'simple.test.js');
        fs.writeFileSync(tempTestFile, `
        test('simple test', () => {
            expect(1 + 1).toBe(2);
        });
        `);
        
        try {
            const simpleTestResult = await runCommand(npxCommand, ['jest', tempTestFile, '--no-cache']);
            console.log('Risultato del test semplice:');
            console.log(simpleTestResult.stdout);
        } catch (err) {
            console.error('Errore nell\'esecuzione del test semplice:', err.message);
        } finally {
            // Pulisci i file temporanei
            fs.unlinkSync(tempTestFile);
            fs.rmdirSync(tempDir);
        }
        
        console.log('\n=== VERIFICA COMPLETATA ===');
    } catch (error) {
        console.error('Errore durante la verifica:', error);
    }
}

main();