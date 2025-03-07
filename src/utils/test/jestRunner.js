/**
 * @file jestRunner.js
 * @description Utility per eseguire i test con Jest indipendentemente dall'ambiente
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Esegue Jest con i parametri specificati
 * @param {Array<string>} args - Argomenti da passare a Jest
 * @param {string} cwd - Directory di lavoro per l'esecuzione (opzionale)
 * @returns {Promise<Object>} - Promise che risolve con i risultati del test
 */
function runJest(args = [], cwd = null) {
    return new Promise((resolve, reject) => {
        try {
            // Se non è specificata una directory, usa la root del progetto
            const workingDir = cwd || path.resolve(__dirname, '../../../');
            
            // Determina il comando da eseguire in base al sistema operativo
            const isWindows = process.platform === 'win32';
            
            console.log(`[JestRunner] Avvio dell'esecuzione dei test...`);
            console.log(`[JestRunner] Directory di lavoro: ${workingDir}`);
            console.log(`[JestRunner] Sistema operativo: ${isWindows ? 'Windows' : 'Unix/Linux'}`);
            
            // Verifica che Jest sia installato
            try {
                const jestVersionOutput = execSync('npx jest --version', {
                    encoding: 'utf8'
                });
                console.log(`[JestRunner] Versione di Jest: ${jestVersionOutput.trim()}`);
            } catch (error) {
                console.error(`[JestRunner] Errore nella verifica della versione di Jest:`, error.message);
            }
            
            // Controllo del file jest.config.js
            const jestConfigPath = path.join(process.cwd(), 'jest.config.js');
            if (fs.existsSync(jestConfigPath)) {
                console.log(`[JestRunner] File jest.config.js trovato`);
            } else {
                console.log(`[JestRunner] File jest.config.js non trovato`);
            }
            
            // Aggiungi parametri di base
            const baseArgs = ['jest', '--detectOpenHandles', '--forceExit', '--no-cache'];
            const allArgs = [...baseArgs, ...args];
            
            // Se è un test specifico, aggiungi --runInBand per evitare problemi di concorrenza
            if (args.some(arg => arg.includes('--testPathPattern='))) {
                allArgs.push('--runInBand');
            }
            
            console.log(`[JestRunner] Comando completo: npx ${allArgs.join(' ')}`);
            
            // Per debug, prova anche con execSync
            try {
                console.log(`[JestRunner] Tentativo di esecuzione con execSync per debug...`);
                const syncOutput = execSync(`npx jest ${args.join(' ')} --no-cache --detectOpenHandles`, {
                    cwd: workingDir,
                    encoding: 'utf8',
                    stdio: 'pipe',
                    timeout: 60000 // 1 minuto di timeout
                });
                console.log(`[JestRunner] Esecuzione sincrona completata con successo`);
                console.log(`[JestRunner] Output: ${syncOutput}`);
            } catch (syncError) {
                console.error(`[JestRunner] Errore nell'esecuzione sincrona:`, syncError.message);
                if (syncError.stdout) console.log(`[JestRunner] stdout: ${syncError.stdout}`);
                if (syncError.stderr) console.log(`[JestRunner] stderr: ${syncError.stderr}`);
            }
            
            // Esegui Jest tramite npx (asincrono)
            const npxCommand = isWindows ? 'npx.cmd' : 'npx';
            console.log(`[JestRunner] Avvio processo asincrono con: ${npxCommand}`);
            
            const jestProcess = spawn(npxCommand, allArgs, { 
                cwd: workingDir,
                shell: isWindows
            });
            
            let stdoutData = '';
            let stderrData = '';
            
            jestProcess.stdout.on('data', (data) => {
                const output = data.toString();
                stdoutData += output;
                console.log(`[JestRunner] stdout: ${output}`);
            });
            
            jestProcess.stderr.on('data', (data) => {
                const output = data.toString();
                stderrData += output;
                console.error(`[JestRunner] stderr: ${output}`);
            });
            
            jestProcess.on('close', (code) => {
                console.log(`[JestRunner] Jest process exited with code ${code}`);
                
                try {
                    let results;
                    // Cerca di estrarre solo la parte JSON dall'output
                    const jsonMatch = stdoutData.match(/({[\s\S]*})/);
                    
                    if (jsonMatch && jsonMatch[0]) {
                        try {
                            results = JSON.parse(jsonMatch[0]);
                        } catch (parseError) {
                            console.error(`[JestRunner] Errore nel parsing del JSON:`, parseError);
                            console.log(`[JestRunner] JSON non valido: ${jsonMatch[0]}`);
                            
                            // Se il JSON non è valido, crea un oggetto risultato fittizio
                            results = {
                                success: code === 0,
                                numPassedTests: 0,
                                numFailedTests: code === 0 ? 0 : 1,
                                numTotalTests: 1,
                                testResults: [{
                                    name: args.join(' '),
                                    status: code === 0 ? 'passed' : 'failed',
                                    message: `Exit code: ${code}`
                                }]
                            };
                        }
                    } else {
                        console.log(`[JestRunner] Nessun JSON trovato nell'output`);
                        // Crea un oggetto risultato basato sul codice di uscita
                        results = {
                            success: code === 0,
                            numPassedTests: code === 0 ? 1 : 0,
                            numFailedTests: code === 0 ? 0 : 1,
                            numTotalTests: 1,
                            testResults: [{
                                name: args.join(' '),
                                status: code === 0 ? 'passed' : 'failed',
                                message: stdoutData || stderrData
                            }]
                        };
                    }
                    
                    resolve({
                        results,
                        rawOutput: stdoutData,
                        code
                    });
                } catch (error) {
                    console.error('[JestRunner] Error processing test results:', error);
                    reject(new Error(`Failed to process test results: ${error.message}`));
                }
            });
            
            jestProcess.on('error', (error) => {
                console.error('[JestRunner] Error spawning Jest process:', error);
                reject(new Error(`Failed to spawn Jest process: ${error.message}`));
            });
        } catch (generalError) {
            console.error('[JestRunner] Errore generale:', generalError);
            reject(new Error(`General error in Jest runner: ${generalError.message}`));
        }
    });
}

module.exports = {
    runJest
};