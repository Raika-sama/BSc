const path = require('path');
const fs = require('fs').promises;
const BaseController = require('./baseController');
const mongoose = require('mongoose');
const TestResult = require('../models/testResult');
const { execSync } = require('child_process');

class TestSystemController extends BaseController {
    constructor() {
        // Poiché il TestSystemController non ha un repository associato,
        // passiamo null come repository e 'TestSystem' come modelName
        super(null, 'TestSystem');
        
        // Binding dei metodi pubblici al contesto dell'istanza
        this.runUnitTests = this.runUnitTests.bind(this);
        this.getUnitTests = this.getUnitTests.bind(this);
        this.runIntegrationTests = this.runIntegrationTests.bind(this);
        this.getIntegrationTests = this.getIntegrationTests.bind(this);
        this.runAllTests = this.runAllTests.bind(this);
        this.getTestHistory = this.getTestHistory.bind(this);
        
        // Binding dei metodi privati al contesto dell'istanza
        this._getTestsInfo = this._getTestsInfo.bind(this);
        this._scanTestFiles = this._scanTestFiles.bind(this);
        this._saveTestResults = this._saveTestResults.bind(this);
        this._parseTestResults = this._parseTestResults.bind(this);
        this._extractJestSummary = this._extractJestSummary.bind(this);
        this._parseJestJsonOutput = this._parseJestJsonOutput.bind(this);
    }

/**
 * Esegue i test unitari e restituisce i risultati
 * @param {Object} req - Request
 * @param {Object} res - Response
 */
async runUnitTests(req, res) {
    try {
        console.log("[TestSystemController] runUnitTests chiamato");
        const { testFile } = req.body || {};
        
        // Costruisci gli argomenti per Jest
        let testPath, commandArgs;
        
        if (testFile) {
            // Normalizza i separatori di percorso (trasforma \ in /)
            const normalizedTestFile = testFile.replace(/\\/g, '/');
            console.log(`[TestSystemController] File di test richiesto: ${normalizedTestFile}`);
            
            // Per tutti i file, usa il pattern standard
            if (!normalizedTestFile.includes('src/systemTests/')) {
                // Se il percorso non contiene già src/systemTests, aggiungilo
                testPath = `src/systemTests/unit/${normalizedTestFile}`;
            } else {
                // Altrimenti usa il percorso così com'è
                testPath = normalizedTestFile;
            }
            
            commandArgs = [`--testPathPattern=${testPath}`];
        } else {
            // Se non è specificato un file, esegui tutti i test unitari
            testPath = 'src/systemTests/unit';
            commandArgs = [`--testPathPattern=${testPath}`];
        }
        
        console.log(`[TestSystemController] Esecuzione test con pattern: ${testPath}`);
        console.log(`[TestSystemController] Directory di lavoro: ${process.cwd()}`);
        
        // Configurazione per output più dettagliato
        commandArgs.push('--verbose'); // Output dettagliato
        commandArgs.push('--colors'); // Colora l'output
        commandArgs.push('--json'); // Output in formato JSON per parsing preciso
        commandArgs.push('--testNamePattern=".+"'); // Forza l'inclusione dei nomi dei test nell'output
        
        // Aggiungi --runInBand per eseguire i test in serie (evita problemi con MongoDB)
        commandArgs.push('--runInBand');
        
        // Aggiungi --testTimeout=30000 per aumentare il timeout
        commandArgs.push('--testTimeout=30000');
        
        // Costruisci il comando
        const command = `npx jest --config=jest.config.js ${commandArgs.join(' ')} --no-cache`;
        console.log(`[TestSystemController] Comando completo: ${command}`);
        
        const startTime = new Date();
        
        try {
            console.log(`[TestSystemController] Avvio esecuzione di Jest...`);
            const output = execSync(command, { 
                stdio: 'pipe',
                encoding: 'utf8',
                timeout: 60000, // 1 minuto di timeout
                shell: true,
                maxBuffer: 10 * 1024 * 1024 // Aumenta il buffer massimo a 10MB
            });
            
            console.log(`[TestSystemController] Esecuzione Jest completata!`);
            console.log(`[TestSystemController] Output di Jest (primi 200 caratteri): ${output.substring(0, 200)}...`);
            
            const endTime = new Date();
            const executionTime = (endTime - startTime) / 1000; // in secondi
            
            // Prova a estrarre i risultati dal formato JSON
            try {
                // Estrai l'oggetto JSON completo dall'output
                const jsonResults = this._parseJestJsonOutput(output);
                
                if (jsonResults) {
                    console.log("[TestSystemController] Risultati JSON analizzati correttamente");
                    // Crea l'oggetto risultati finale usando il parser JSON migliorato
                    const results = {
                        success: jsonResults.success,
                        testResults: jsonResults.testResults || [],
                        rawOutput: output.length > 65000 ? output.substring(0, 65000) : output,
                        passedTests: jsonResults.numPassedTests,
                        failedTests: jsonResults.numFailedTests,
                        totalTests: jsonResults.numTotalTests,
                        duration: jsonResults.testResults?.[0]?.perfStats?.runtime / 1000 || executionTime
                    };
                    
                    console.log(`[TestSystemController] Risultati finali da JSON:`, {
                        success: results.success,
                        passedTests: results.passedTests,
                        failedTests: results.failedTests,
                        totalTests: results.totalTests,
                        detailedResultsCount: results.testResults.length
                    });
                    
                    // Salva i risultati nel database
                    await this._saveTestResults('unit', results, testFile || testPath);
                    
                    console.log(`[TestSystemController] Invio risposta al client...`);
                    
                    return this.sendResponse(res, results);
                } else {
                    console.log("[TestSystemController] Analisi JSON fallita, utilizzando il parser standard");
                    throw new Error("JSON non valido nell'output");
                }
            } catch (jsonError) {
                console.error(`[TestSystemController] Errore nell'analisi del JSON:`, jsonError.message);
                
                // Estrai direttamente il riepilogo dei risultati dal formato standard di Jest
                const jestSummary = this._extractJestSummary(output);

                // Usa i risultati estratti da Jest o estrai manualmente dall'output in caso di fallimento
                const parsedResults = jestSummary || this._parseTestResults(output, testPath);

                // Crea l'oggetto risultati finale
                const results = {
                    success: parsedResults.success,
                    testResults: parsedResults.detailedResults,
                    rawOutput: output.length > 65000 ? output.substring(0, 65000) : output,
                    passedTests: parsedResults.passedTests,
                    failedTests: parsedResults.failedTests,
                    totalTests: parsedResults.totalTests,
                    duration: parsedResults.duration || executionTime
                };
                
                console.log(`[TestSystemController] Risultati finali (fallback):`, {
                    success: results.success,
                    passedTests: results.passedTests,
                    failedTests: results.failedTests,
                    totalTests: results.totalTests,
                    detailedResultsCount: results.testResults.length
                });
                
                // Salva i risultati nel database
                await this._saveTestResults('unit', results, testFile || testPath);
                
                console.log(`[TestSystemController] Invio risposta al client...`);
                
                return this.sendResponse(res, results);
            }
        } catch (execError) {
            console.error(`[TestSystemController] Errore nell'esecuzione di Jest:`);
            console.error(execError.message);
            if (execError.stdout) console.error(`[TestSystemController] stdout (primi 200 caratteri): ${execError.stdout.substring(0, 200)}...`);
            if (execError.stderr) console.error(`[TestSystemController] stderr (primi 200 caratteri): ${execError.stderr.substring(0, 200)}...`);
            
            const endTime = new Date();
            const executionTime = (endTime - startTime) / 1000; // in secondi
            
            // Anche in caso di errore, proviamo a estrarre il riepilogo dei test
            const output = execError.stdout || execError.stderr || 'No output';
            
            // Verifica se abbiamo un output JSON anche nell'errore
            try {
                const jsonResults = this._parseJestJsonOutput(output);
                if (jsonResults) {
                    console.log("[TestSystemController] Risultati JSON trovati nell'errore");
                    // Crea l'oggetto risultati finale
                    const errorResults = {
                        success: false, // In caso di errore di esecuzione, consideriamo il test fallito
                        testResults: jsonResults.testResults || [],
                        rawOutput: output.length > 65000 ? output.substring(0, 65000) : output,
                        passedTests: jsonResults.numPassedTests || 0,
                        failedTests: jsonResults.numFailedTests || 0,
                        totalTests: jsonResults.numTotalTests || 0,
                        duration: jsonResults.testResults?.[0]?.perfStats?.runtime / 1000 || executionTime
                    };
                    
                    console.log(`[TestSystemController] Risultati falliti finali (da JSON):`, {
                        success: errorResults.success,
                        passedTests: errorResults.passedTests,
                        failedTests: errorResults.failedTests,
                        totalTests: errorResults.totalTests,
                        detailedResultsCount: errorResults.testResults.length
                    });
                    
                    // Salva anche i risultati falliti nel database
                    await this._saveTestResults('unit', errorResults, testFile || testPath);
                    
                    return this.sendResponse(res, errorResults);
                }
            } catch (jsonError) {
                console.log("[TestSystemController] Nessun JSON valido nell'output di errore, utilizzo metodo fallback");
            }
            
            const jestSummary = this._extractJestSummary(output);
            const parsedResults = jestSummary || this._parseTestResults(output, testPath);
            
            // Crea un risultato di errore per la risposta
            const errorResults = {
                success: false, // In caso di errore di esecuzione, consideriamo il test fallito
                testResults: parsedResults.detailedResults,
                rawOutput: output.length > 65000 ? output.substring(0, 65000) : output,
                passedTests: parsedResults.passedTests,
                failedTests: parsedResults.failedTests,
                totalTests: parsedResults.totalTests,
                duration: parsedResults.duration || executionTime
            };
            
            console.log(`[TestSystemController] Risultati falliti finali:`, {
                success: errorResults.success,
                passedTests: errorResults.passedTests,
                failedTests: errorResults.failedTests,
                totalTests: errorResults.totalTests,
                detailedResultsCount: errorResults.testResults.length
            });
            
            // Salva anche i risultati falliti nel database
            await this._saveTestResults('unit', errorResults, testFile || testPath);
            
            return this.sendResponse(res, errorResults);
        }
    } catch (error) {
        console.error('[TestSystemController] Error running unit tests:', error);
        return this.sendError(res, error);
    }
}

    /**
     * Recupera la lista di tutti i test unitari disponibili
     * @param {Object} req - Request
     * @param {Object} res - Response
     */
    async getUnitTests(req, res) {
        try {
            console.log("[TestSystemController] getUnitTests chiamato");
            const testsInfo = await this._getTestsInfo('unit');
            return this.sendResponse(res, testsInfo);
        } catch (error) {
            console.error('Error getting unit tests:', error);
            return this.sendError(res, error);
        }
    }

    /**
     * Esegue i test di integrazione e restituisce i risultati
     * @param {Object} req - Request
     * @param {Object} res - Response
     */
    async runIntegrationTests(req, res) {
        try {
            console.log("[TestSystemController] runIntegrationTests chiamato");
            
            // Costruisci gli argomenti per Jest
            let testPath = 'src/systemTests/integration';
            if (testFile) {
                testPath = testFile;
            }
            
            // Costruisci il comando
            const command = `npx jest --config=jest.config.js --testPathPattern="${testPath}" --no-cache`;
            
            const startTime = new Date();
            try {
                const output = execSync(command, { 
                    stdio: 'pipe',
                    encoding: 'utf8',
                    timeout: 60000
                });
                
                const endTime = new Date();
                const executionTime = (endTime - startTime) / 1000; // in secondi
                
                // Analizza i risultati dal testo completo
                const parsedResults = this._parseTestResults(output, testPath);
                
                const results = {
                    success: true,
                    testResults: parsedResults.detailedResults,
                    rawOutput: output,
                    passedTests: parsedResults.passedTests,
                    failedTests: parsedResults.failedTests,
                    totalTests: parsedResults.totalTests,
                    duration: parsedResults.duration || executionTime
                };
                
                // Salva i risultati nel database
                await this._saveTestResults('integration', results, testFile || testPath);
                
                return this.sendResponse(res, results);
            } catch (execError) {
                const endTime = new Date();
                const executionTime = (endTime - startTime) / 1000; // in secondi
                
                // Analizza anche i risultati falliti
                const output = execError.stdout || execError.stderr || 'No output';
                const parsedResults = this._parseTestResults(output, testPath);
                
                const errorResults = {
                    success: false,
                    testResults: parsedResults.detailedResults.length > 0 ? 
                        parsedResults.detailedResults : 
                        [{
                            name: testPath,
                            status: 'failed',
                            message: execError.message
                        }],
                    rawOutput: output,
                    passedTests: parsedResults.passedTests,
                    failedTests: parsedResults.failedTests,
                    totalTests: parsedResults.totalTests,
                    duration: parsedResults.duration || executionTime
                };
                
                // Salva anche i risultati falliti nel database
                await this._saveTestResults('integration', errorResults, testFile || testPath);
                
                return this.sendResponse(res, errorResults);
            }
        } catch (error) {
            console.error('Error running integration tests:', error);
            return this.sendError(res, error);
        }
    }

    /**
     * Recupera la lista di tutti i test di integrazione disponibili
     * @param {Object} req - Request
     * @param {Object} res - Response
     */
    async getIntegrationTests(req, res) {
        try {
            console.log("[TestSystemController] getIntegrationTests chiamato");
            const testsInfo = await this._getTestsInfo('integration');
            return this.sendResponse(res, testsInfo);
        } catch (error) {
            console.error('Error getting integration tests:', error);
            return this.sendError(res, error);
        }
    }

    /**
     * Esegue tutti i test (unitari e di integrazione) e restituisce i risultati
     * @param {Object} req - Request
     * @param {Object} res - Response
     */
    async runAllTests(req, res) {
        try {
            console.log("[TestSystemController] runAllTests chiamato");
            
            // Costruisci il comando
            const command = `npx jest --config=jest.config.js --no-cache`;
            
            const startTime = new Date();
            try {
                const output = execSync(command, { 
                    stdio: 'pipe',
                    encoding: 'utf8',
                    timeout: 120000 // 2 minuti di timeout
                });
                
                const endTime = new Date();
                const executionTime = (endTime - startTime) / 1000; // in secondi
                
                // Analizza i risultati dal testo completo
                const parsedResults = this._parseTestResults(output, 'all');
                
                const results = {
                    success: true,
                    testResults: parsedResults.detailedResults,
                    rawOutput: output,
                    passedTests: parsedResults.passedTests,
                    failedTests: parsedResults.failedTests,
                    totalTests: parsedResults.totalTests,
                    duration: parsedResults.duration || executionTime
                };
                
                // Salva i risultati nel database
                await this._saveTestResults('all', results, 'all');
                
                return this.sendResponse(res, results);
            } catch (execError) {
                const endTime = new Date();
                const executionTime = (endTime - startTime) / 1000; // in secondi
                
                // Analizza anche i risultati falliti
                const output = execError.stdout || execError.stderr || 'No output';
                const parsedResults = this._parseTestResults(output, 'all');
                
                const errorResults = {
                    success: false,
                    testResults: parsedResults.detailedResults.length > 0 ? 
                        parsedResults.detailedResults : 
                        [{
                            name: 'all',
                            status: 'failed',
                            message: execError.message
                        }],
                    rawOutput: output,
                    passedTests: parsedResults.passedTests,
                    failedTests: parsedResults.failedTests,
                    totalTests: parsedResults.totalTests,
                    duration: parsedResults.duration || executionTime
                };
                
                // Salva anche i risultati falliti nel database
                await this._saveTestResults('all', errorResults, 'all');
                
                return this.sendResponse(res, errorResults);
            }
        } catch (error) {
            console.error('Error running all tests:', error);
            return this.sendError(res, error);
        }
    }

    /**
     * Recupera lo storico dei risultati dei test
     * @param {Object} req - Request
     * @param {Object} res - Response
     */
    async getTestHistory(req, res) {
        try {
            const { testType, limit = 20 } = req.query;
            
            let query = {};
            if (testType) {
                query.testType = testType;
            }
            
            const history = await TestResult.find(query)
                .sort({ executedAt: -1 })
                .limit(parseInt(limit))
                .lean();
                
            return this.sendResponse(res, history);
        } catch (error) {
            console.error('Error getting test history:', error);
            return this.sendError(res, error);
        }
    }

    /**
     * Utility privata per ottenere informazioni sui test disponibili
     * @param {String} testType - Tipo di test ('unit' o 'integration')
     * @returns {Array} - Informazioni sui test
     * @private
     */
    async _getTestsInfo(testType) {
        try {
            const rootDir = path.resolve(__dirname, '../../');
            // Aggiorniamo il percorso per puntare a src/systemTests invece di tests
            const testsDir = path.join(rootDir, 'src', 'systemTests', testType);
            
            // Verifica che la directory dei test esista
            try {
                await fs.access(testsDir);
            } catch (err) {
                console.warn(`Tests directory ${testsDir} does not exist or is not accessible`);
                return []; // Restituisci un array vuoto se la directory non esiste
            }
            
            const testFiles = await this._scanTestFiles(testsDir);
            
            // Ottieni la cronologia dei risultati dei test per ogni file
            const testFilesWithHistory = await Promise.all(testFiles.map(async (test) => {
                const latestResult = await TestResult.findOne({
                    'testPath': { $regex: new RegExp(test.file.replace(/\\/g, '\\\\')) }
                })
                .sort({ executedAt: -1 })
                .lean();
                
                if (latestResult) {
                    // Se abbiamo un risultato completo, usiamo i dati del database
                    return {
                        ...test,
                        status: latestResult.success ? 'passed' : 'failed',
                        duration: latestResult.duration * 1000 || null, // Converti in millisecondi
                        lastExecuted: latestResult.executedAt,
                        passedTests: latestResult.passedTests || 0,
                        failedTests: latestResult.failedTests || 0,
                        totalTests: latestResult.totalTests || 0,
                        output: latestResult.rawOutput
                    };
                }
                
                return {
                    ...test,
                    status: 'pending',
                    duration: null,
                    lastExecuted: null,
                    passedTests: 0,
                    failedTests: 0,
                    totalTests: 0
                };
            }));
            
            return testFilesWithHistory;
        } catch (error) {
            console.error(`Failed to get tests info: ${error.message}`, error.stack);
            throw new Error(`Failed to get tests info: ${error.message}`);
        }
    }

    /**
     * Utility privata per scansionare ricorsivamente i file di test
     * @param {String} dir - Directory da scansionare
     * @param {String} baseDir - Directory base per calcolare i percorsi relativi
     * @returns {Array} - Lista dei file di test trovati
     * @private
     */
    async _scanTestFiles(dir, baseDir = null) {
        if (!baseDir) baseDir = dir;
        
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            let files = [];
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.relative(baseDir, fullPath);
                
                if (entry.isDirectory()) {
                    files = [
                        ...files,
                        ...(await this._scanTestFiles(fullPath, baseDir))
                    ];
                } else if (entry.name.endsWith('.test.js') || entry.name.endsWith('.spec.js')) {
                    // Estrai il nome del modulo dal percorso del file
                    const pathParts = relativePath.split(path.sep);
                    let moduleName = pathParts[0]; // Prima directory dopo tests/unit o tests/integration
                    
                    // Se il modulo è in una sottodirectory, usalo come nome
                    if (pathParts.length > 1) {
                        moduleName = pathParts[0];
                    }
                    
                    files.push({
                        id: `test-${relativePath.replace(/[\\/\\.]/g, '-')}`,
                        name: entry.name.replace(/\.test\.js$|\.spec\.js$/i, ''),
                        description: `Test for ${entry.name.replace(/\.test\.js$|\.spec\.js$/i, '')}`,
                        file: relativePath,
                        fullPath: fullPath,
                        module: moduleName
                    });
                }
            }
            
            return files;
        } catch (error) {
            console.error(`Error scanning test files in ${dir}:`, error);
            return []; // In caso di errore, restituisci un array vuoto
        }
    }

/**
 * Analizza l'output JSON di Jest per estrarre i risultati dettagliati
 * @param {String} output - Output grezzo del test
 * @returns {Object|null} - Risultati analizzati o null se non è stato possibile analizzare
 * @private
 */
_parseJestJsonOutput(output) {
    if (!output) return null;
    
    try {
        console.log(`[TestSystemController] Tentativo di parsing JSON dell'output Jest`);
        
        // 1. Cerca l'inizio del JSON nell'output
        let jsonStart = output.indexOf('{');
        if (jsonStart === -1) return null;
        
        // 2. Estrai la stringa JSON completa
        // Dobbiamo assicurarci di includere le parentesi graffe bilanciate
        let depth = 0;
        let jsonEnd = jsonStart;
        let inString = false;
        let escape = false;
        
        for (let i = jsonStart; i < output.length; i++) {
            const char = output[i];
            
            if (escape) {
                escape = false;
                continue;
            }
            
            if (char === '\\' && inString) {
                escape = true;
                continue;
            }
            
            if (char === '"' && !escape) {
                inString = !inString;
                continue;
            }
            
            if (!inString) {
                if (char === '{') {
                    depth++;
                } else if (char === '}') {
                    depth--;
                    if (depth === 0) {
                        jsonEnd = i + 1;
                        break;
                    }
                }
            }
        }
        
        if (depth !== 0) {
            console.log(`[TestSystemController] JSON non bilanciato nell'output`);
            return null;
        }
        
        // 3. Estrai la stringa JSON e analizzala
        const jsonString = output.substring(jsonStart, jsonEnd);
        const jsonData = JSON.parse(jsonString);
        
        // 4. Estrai i dettagli dei test
        const detailedResults = [];
        
        if (jsonData.testResults && Array.isArray(jsonData.testResults)) {
            for (const testResult of jsonData.testResults) {
                const testFilePath = testResult.name || '';
                const testFileName = testFilePath.split('/').pop() || testFilePath;
                
                if (testResult.assertionResults && Array.isArray(testResult.assertionResults)) {
                    for (const assertion of testResult.assertionResults) {
                        // Crea un risultato dettagliato per ogni test
                        detailedResults.push({
                            name: assertion.fullName || assertion.title || 'Test senza nome',
                            status: assertion.status === 'passed' ? 'passed' : 'failed',
                            duration: assertion.duration || null,
                            message: assertion.failureMessages ? assertion.failureMessages.join('\n') : null,
                            suite: testFileName || 'Test Suite',
                            group: assertion.ancestorTitles?.join(' › ') || '',
                            description: assertion.title || ''
                        });
                    }
                }
            }
        }
        
        console.log(`[TestSystemController] Estratti ${detailedResults.length} risultati dettagliati dal JSON`);
        
        // 5. Restituisci i risultati completi, includendo i dettagli estratti
        return {
            ...jsonData,
            testResults: detailedResults
        };
    } catch (error) {
        console.error(`[TestSystemController] Errore nel parsing JSON:`, error);
        return null;
    }
}

/**
 * Estrae il riepilogo dei test direttamente dall'output di Jest
 * @param {String} output - Output grezzo del test
 * @returns {Object|null} - Riepilogo estratto o null se non trovato
 * @private
 */
_extractJestSummary(output) {
    if (!output) return null;
    
    try {
        // Prima estrai i dettagli dei test individuali, perché sono la fonte più attendibile
        const detailedResults = this._extractDetailedResults(output);
        
        // 1. Cerca il pattern standard del riepilogo di Jest
        const summaryMatch = output.match(/Test Suites:[ \t]*(\d+)[ \t]*failed,[ \t]*(\d+)[ \t]*passed,[ \t]*(\d+)[ \t]*total\s+Tests:[ \t]*(\d+)[ \t]*failed,[ \t]*(\d+)[ \t]*passed,[ \t]*(\d+)[ \t]*total/i);
        if (summaryMatch) {
            const failedSuites = parseInt(summaryMatch[1], 10);
            const passedSuites = parseInt(summaryMatch[2], 10);
            const totalSuites = parseInt(summaryMatch[3], 10);
            const failedTests = parseInt(summaryMatch[4], 10);
            const passedTests = parseInt(summaryMatch[5], 10);
            const totalTests = parseInt(summaryMatch[6], 10);
            
            console.log(`[TestSystemController] Estratto riepilogo Jest: ${passedTests} passati, ${failedTests} falliti, ${totalTests} totali`);
            
            return {
                success: failedTests === 0,
                passedTests,
                failedTests,
                totalTests,
                failedSuites,
                passedSuites,
                totalSuites,
                detailedResults,
                duration: this._extractDuration(output)
            };
        }
        
        // 2. Pattern alternativo per il riepilogo dei test (solo i conteggi dei test, senza suites)
        const altSummaryMatch = output.match(/Tests:[ \t]*(\d+)[ \t]*failed,[ \t]*(\d+)[ \t]*passed,[ \t]*(\d+)[ \t]*total/i);
        if (altSummaryMatch) {
            const failedTests = parseInt(altSummaryMatch[1], 10);
            const passedTests = parseInt(altSummaryMatch[2], 10);
            const totalTests = parseInt(altSummaryMatch[3], 10);
            
            console.log(`[TestSystemController] Estratto riepilogo alternativo: ${passedTests} passati, ${failedTests} falliti, ${totalTests} totali`);
            
            return {
                success: failedTests === 0,
                passedTests,
                failedTests,
                totalTests,
                detailedResults,
                duration: this._extractDuration(output)
            };
        }
        
        // 3. Se abbiamo trovato risultati dettagliati, ma nessun riepilogo, usa quelli per i conteggi
        if (detailedResults.length > 0) {
            const passedTests = detailedResults.filter(r => r.status === 'passed').length;
            const failedTests = detailedResults.filter(r => r.status === 'failed').length;
            const totalTests = detailedResults.length;
            
            console.log(`[TestSystemController] Conteggio dai risultati dettagliati: ${passedTests} passati, ${failedTests} falliti, totale: ${totalTests}`);
            
            return {
                success: failedTests === 0,
                passedTests,
                failedTests,
                totalTests,
                detailedResults,
                duration: this._extractDuration(output)
            };
        }
        
        // 4. Se non troviamo nessun pattern di riepilogo, proviamo con i conteggi dei simboli
        const passedCount = (output.match(/✓/g) || []).length;
        const failedCount = (output.match(/✕/g) || []).length;
        
        if (passedCount > 0 || failedCount > 0) {
            const totalCount = passedCount + failedCount;
            
            console.log(`[TestSystemController] Conteggio dai simboli: ${passedCount} passati (✓), ${failedCount} falliti (✕), totale: ${totalCount}`);
            
            return {
                success: failedCount === 0,
                passedTests: passedCount,
                failedTests: failedCount,
                totalTests: totalCount,
                detailedResults,
                duration: this._extractDuration(output)
            };
        }
        
        // 5. Come ultima risorsa, cerca i messaggi di successo/errore
        if (output.toLowerCase().includes('pass')) {
            return {
                success: true,
                passedTests: 1,
                failedTests: 0,
                totalTests: 1,
                detailedResults,
                duration: this._extractDuration(output)
            };
        } else if (output.toLowerCase().includes('fail')) {
            return {
                success: false,
                passedTests: 0,
                failedTests: 1,
                totalTests: 1,
                detailedResults,
                duration: this._extractDuration(output)
            };
        }
        
        return null;
    } catch (error) {
        console.error('[TestSystemController] Errore nell\'estrazione del riepilogo Jest:', error);
        return null;
    }
}

/**
 * Estrae i dettagli dei risultati dei test individuali dall'output
 * @param {String} output - Output grezzo del test
 * @returns {Array} - Lista di risultati dettagliati
 * @private
 */
_extractDetailedResults(output) {
    if (!output) return [];
    
    const results = [];
    const lines = output.split('\n');
    
    console.log(`[TestSystemController] Analisi dell'output per estrazione dettagli (${lines.length} linee)`);
    
    // Primo miglioramento: estrazione più accurata dei test con gruppi
    // Cerca pattern come "UserRepository › findById › should find a user by ID"
    const testNamePattern = /([^ ]+) › ([^ ]+) › ([^(]+)/;
    
    // 1. Prima cerca i risultati dei test in formato PASS/FAIL con nome completo
    const passFailRegex = /^(PASS|FAIL)\s+(.*?)(?:\s+\((\d+)\s*ms\))?$/i;
    const testLineRegex = /^\s*(✓|✕)\s+(.*?)(?:\s+\((\d+)\s*ms\))?$/i;
    
    // Monitoriamo l'ultimo gruppo di test trovato
    let currentSuite = '';
    let currentDescribe = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Identifica il blocco della suite di test
        if (line.startsWith('UserRepository') || line.startsWith('SchoolRepository')) {
            currentSuite = line.split(' ')[0];
            continue;
        }
        
        // Identifica i blocchi describe (gruppi di test)
        if (line.startsWith('findById') || line.startsWith('findByEmail') || 
            line.startsWith('create') || line.startsWith('update') || 
            line.startsWith('findWithFilters') || line.startsWith('findOne') ||
            line.startsWith('addUser') || line.startsWith('removeUser') ||
            line.startsWith('deactivateSection') || line.startsWith('setupAcademicYear')) {
            currentDescribe = line.split(' ')[0];
            continue;
        }
        
        // Cerca risultati in formato "PASS UserRepository › findById › should find a user by ID"
        const passFailMatch = line.match(passFailRegex);
        if (passFailMatch) {
            const status = passFailMatch[1].toUpperCase() === 'PASS' ? 'passed' : 'failed';
            const fullName = passFailMatch[2].trim();
            const duration = passFailMatch[3] ? parseInt(passFailMatch[3], 10) : null;
            
            // Verifica se il nome contiene informazioni strutturate (suite › group › test)
            const patternMatch = fullName.match(testNamePattern);
            if (patternMatch) {
                results.push({
                    name: fullName,
                    suite: patternMatch[1],
                    group: patternMatch[2],
                    description: patternMatch[3],
                    status,
                    duration
                });
                continue;
            }
            
            // Se non ha la struttura completa, aggiungi comunque il risultato
            results.push({
                name: fullName,
                status,
                duration
            });
            continue;
        }
        
        // Cerca risultati in formato "  ✓ should find a user by ID (125 ms)"
        const testLineMatch = line.match(testLineRegex);
        if (testLineMatch) {
            const status = testLineMatch[1] === '✓' ? 'passed' : 'failed';
            const testName = testLineMatch[2].trim();
            const duration = testLineMatch[3] ? parseInt(testLineMatch[3], 10) : null;
            
            // Se abbiamo informazioni sul contesto attuale, costruisci un nome completo
            const fullName = currentSuite && currentDescribe 
                ? `${currentSuite} › ${currentDescribe} › ${testName}`
                : testName;
            
            results.push({
                name: fullName,
                suite: currentSuite || undefined,
                group: currentDescribe || undefined,
                description: testName,
                status,
                duration
            });
            
            // Se il test è fallito, cerca il messaggio di errore nelle righe successive
            if (status === 'failed') {
                let j = i + 1;
                let errorMessage = '';
                while (j < lines.length && j < i + 15) { // Cerca fino a 15 righe dopo
                    const errorLine = lines[j];
                    if (errorLine.includes('Error:')) {
                        errorMessage = errorLine.trim();
                        break;
                    }
                    j++;
                }
                
                if (errorMessage) {
                    results[results.length - 1].message = errorMessage;
                }
            }
        }
    }
    
    console.log(`[TestSystemController] Estratti ${results.length} risultati dettagliati`);
    
    // Se non abbiamo trovato risultati dettagliati, cerchiamo altre informazioni nell'output
    if (results.length === 0) {
        // Verifica se ci sono pattern di risultati commentati
        for (const line of lines) {
            if (line.includes('should find a user by ID') || 
                line.includes('should throw error for invalid ID') ||
                line.includes('should return null for non-existent email') ||
                line.includes('should create a new user') ||
                line.includes('should add a user to the school') ||
                line.includes('should update an existing user')) {
                
                const isPassed = !line.includes('✕') && !line.includes('FAIL');
                
                results.push({
                    name: line.trim().replace(/^[^a-zA-Z]+/, ''), // Rimuovi caratteri non alfanumerici all'inizio
                    status: isPassed ? 'passed' : 'failed',
                    suite: line.includes('UserRepository') ? 'UserRepository' : 
                           line.includes('SchoolRepository') ? 'SchoolRepository' : 'unknown',
                    group: line.includes('findById') ? 'findById' :
                           line.includes('findByEmail') ? 'findByEmail' :
                           line.includes('create') ? 'create' :
                           line.includes('addUser') ? 'addUser' :
                           line.includes('update') ? 'update' : 'unknown'
                });
            }
        }
    }
    
    return results;
}

/**
 * Estrae la durata dell'esecuzione del test dall'output
 * @param {String} output - Output grezzo del test
 * @returns {Number} - Durata in secondi
 * @private
 */
_extractDuration(output) {
    if (!output) return 0;
    
    const timeMatch = output.match(/Time:[ \t]*([0-9.]+)[ \t]*s/i);
    return timeMatch ? parseFloat(timeMatch[1]) : 0;
}

/**
 * Analizza l'output di Jest come fallback quando il riepilogo standard non è disponibile
 * @param {String} output - Output grezzo del test
 * @param {String} testPath - Percorso del test eseguito
 * @returns {Object} - Informazioni analizzate dai risultati del test
 * @private
 */
_parseTestResults(output, testPath) {
    try {
        console.log(`[TestSystemController] Analisi fallback dei risultati per: ${testPath}`);
        
        // Prima prova a usare il metodo avanzato di estrazione del riepilogo
        const jestSummary = this._extractJestSummary(output);
        if (jestSummary) {
            console.log(`[TestSystemController] Usato estrattore avanzato: ${jestSummary.passedTests} passati, ${jestSummary.failedTests} falliti`);
            return jestSummary;
        }
        
        const results = {
            passedTests: 0,
            failedTests: 0,
            totalTests: 0,
            duration: 0,
            detailedResults: [],
            success: false
        };
        
        if (!output) {
            console.log(`[TestSystemController] Nessun output da analizzare`);
            return results;
        }
        
        const lines = output.split('\n');
        
        // 1. Cerca il numero di test passati/falliti simboli ✓ e ✕
        const passedTestLines = lines.filter(line => line.includes(' ✓ '));
        const failedTestLines = lines.filter(line => line.includes(' ✕ '));
        
        if (passedTestLines.length > 0 || failedTestLines.length > 0) {
            results.passedTests = passedTestLines.length;
            results.failedTests = failedTestLines.length;
            results.totalTests = passedTestLines.length + failedTestLines.length;
            results.success = failedTestLines.length === 0;
            console.log(`[TestSystemController] Test da simboli: ${results.passedTests} ✓, ${results.failedTests} ✕`);
            
            // Estrai i dettagli dei test dai simboli
            results.detailedResults = this._extractTestsFromSymbols(output);
        }
        
        // 2. Cerca blocchi PASS/FAIL per file se non abbiamo già test dettagliati
        if (results.detailedResults.length === 0) {
            const passLines = lines.filter(line => line.trim().startsWith('PASS'));
            const failLines = lines.filter(line => line.trim().startsWith('FAIL'));
            
            if ((passLines.length > 0 || failLines.length > 0) && results.totalTests === 0) {
                results.passedTests = passLines.length;
                results.failedTests = failLines.length;
                results.totalTests = passLines.length + failLines.length;
                results.success = failLines.length === 0;
                console.log(`[TestSystemController] Test da PASS/FAIL: ${results.passedTests} passati, ${results.failedTests} falliti`);
                
                // Aggiungi dettagli dai file
                for (const line of passLines) {
                    const match = line.match(/PASS[ \t]+(.+?)$/);
                    if (match) {
                        results.detailedResults.push({
                            name: match[1].trim(),
                            status: 'passed',
                            isTestFile: true
                        });
                    }
                }
                
                for (const line of failLines) {
                    const match = line.match(/FAIL[ \t]+(.+?)$/);
                    if (match) {
                        results.detailedResults.push({
                            name: match[1].trim(),
                            status: 'failed',
                            isTestFile: true
                        });
                    }
                }
            }
        }
        
        // 3. Estrai la durata del test
        results.duration = this._extractDuration(output);
        
        // 4. Se ancora non abbiamo dettagli ma sappiamo che ci sono test, estrai dai pattern describe/it
        if (results.detailedResults.length === 0 && results.totalTests === 0) {
            results.detailedResults = this._extractDetailedResults(output);
            
            // Aggiorna i conteggi basati sui dettagli trovati
            if (results.detailedResults.length > 0) {
                results.passedTests = results.detailedResults.filter(t => t.status === 'passed').length;
                results.failedTests = results.detailedResults.filter(t => t.status === 'failed').length;
                results.totalTests = results.detailedResults.length;
                results.success = results.failedTests === 0;
            }
        }
        
        // 5. Se non abbiamo trovato dettagli ma abbiamo un conteggio, crea un risultato generico
        if (results.detailedResults.length === 0 && results.totalTests > 0) {
            results.detailedResults.push({
                name: testPath,
                status: results.success ? 'passed' : 'failed',
                message: `${results.passedTests} passati, ${results.failedTests} falliti su ${results.totalTests} totali`
            });
        }
        
        // 6. Se ancora non abbiamo nulla, prova a determinare lo stato dai messaggi generali
        if (results.totalTests === 0 && results.detailedResults.length === 0) {
            if (output.toLowerCase().includes('pass') && !output.toLowerCase().includes('fail')) {
                results.passedTests = 1;
                results.totalTests = 1;
                results.success = true;
                results.detailedResults.push({
                    name: testPath,
                    status: 'passed',
                    message: 'Test completato con successo'
                });
            } else if (output.toLowerCase().includes('fail') || output.toLowerCase().includes('error')) {
                results.failedTests = 1;
                results.totalTests = 1;
                results.success = false;
                results.detailedResults.push({
                    name: testPath,
                    status: 'failed',
                    message: 'Test fallito con errori'
                });
            } else {
                console.log(`[TestSystemController] Nessun risultato di test trovato nell'output`);
                // Lascia i risultati vuoti
            }
        }
        
        return results;
    } catch (error) {
        console.error('[TestSystemController] Errore durante il parsing dei risultati:', error);
        
        return {
            passedTests: 0,
            failedTests: 0,
            totalTests: 0,
            duration: 0,
            success: false,
            detailedResults: []
        };
    }
}

    /**
     * Salva i risultati dei test nel database
     * @param {String} testType - Tipo di test ('unit', 'integration', o 'all')
     * @param {Object} results - Risultati del test
     * @param {String} testPath - Percorso del test eseguito
     * @private
     */
    async _saveTestResults(testType, results, testPath) {
        try {
            console.log(`[TestSystemController] Salvando risultati del test ${testType}: ${testPath}`);
            
            // Crea un nuovo documento per salvare i risultati del test
            const testResult = new TestResult({
                testType,
                testPath,
                executedAt: new Date(),
                success: results.success,
                results: results.testResults || [],
                passedTests: results.passedTests || 0,
                failedTests: results.failedTests || 0,
                totalTests: results.totalTests || 0,
                duration: results.duration || 0,
                rawOutput: results.rawOutput ? results.rawOutput.substring(0, 65000) : '' // Limita la dimensione dell'output raw
            });
            
            // Salva il risultato nel database
            await testResult.save();
            console.log(`[TestSystemController] Risultato del test salvato con ID: ${testResult._id}`);
            
            return testResult;
        } catch (error) {
            console.error('[TestSystemController] Errore nel salvare i risultati del test:', error);
            // Non lanciare un'eccezione per evitare di bloccare l'esecuzione
            // ma registrare l'errore
        }
    }
}

module.exports = new TestSystemController();