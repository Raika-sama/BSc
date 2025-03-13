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
        this._extractDetailedResults = this._extractDetailedResults.bind(this);
    }

/**
 * Esegue i test unitari e restituisce i risultati
 * @param {Object} req - Request
 * @param {Object} res - Response
 */
async runUnitTests(req, res) {
    try {
        console.log("[TestSystemController] runUnitTests chiamato");
        const { testFile, methodName, testNamePattern, repository } = req.body || {};
        
        // Costruisci gli argomenti per Jest
        let testPath, commandArgs = [];
        
        // Ottimizzazione per i repository
        if (repository) {
            console.log(`[TestSystemController] Esecuzione test per repository specifico: ${repository}`);
            // Cerca test relativi a questo repository specifico
            testPath = `src/systemTests/unit/*${repository}*.test.js`;
            commandArgs.push(`--testPathPattern=${testPath}`);
        } else if (testFile) {
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
            
            commandArgs.push(`--testPathPattern=${testPath}`);
        } else {
            // Se non è specificato un file, esegui tutti i test unitari
            testPath = 'src/systemTests/unit';
            commandArgs.push(`--testPathPattern=${testPath}`);
        }
        
        // NOTA IMPORTANTE: testNamePattern ha precedenza su methodName
        // (per compatibilità con diverse implementazioni frontend)
        let testNameFilter = testNamePattern || methodName;
        
        // Se è specificato un filtro per nome test, aggiungilo
        if (testNameFilter) {
            // Verifica che tipo di filtro è stato specificato
            if (testNameFilter.includes(' › ')) {
                // È già un pattern completo, usalo così com'è
                console.log(`[TestSystemController] Filtro completo per test: "${testNameFilter}"`);
                commandArgs.push(`--testNamePattern="${testNameFilter}"`);
            } else if (repository && testNameFilter) {
                // È un repository specifico + metodo, costruisci un pattern completo
                console.log(`[TestSystemController] Filtro per repository e metodo: ${repository} › ${testNameFilter}`);
                commandArgs.push(`--testNamePattern="${repository}.*${testNameFilter}"`);
            } else {
                // È solo un nome di metodo, aggiungi pattern generico
                console.log(`[TestSystemController] Filtro generico per metodo: ${testNameFilter}`);
                // Pattern migliorato che funziona sia con descrive che con test diretti
                commandArgs.push(`--testNamePattern="(${testNameFilter}|[a-zA-Z]+Repository.+${testNameFilter})"`);
            }
        } else {
            // Se non c'è filtro specifico, usa un pattern che cattura tutti i test
            commandArgs.push('--testNamePattern=".+"'); 
        }
        
        console.log(`[TestSystemController] Esecuzione test con pattern: ${testPath}`);
        console.log(`[TestSystemController] Directory di lavoro: ${process.cwd()}`);
        
        // Configurazione per output più dettagliato
        commandArgs.push('--verbose'); // Output dettagliato
        commandArgs.push('--colors'); // Colora l'output
        commandArgs.push('--json'); // Output in formato JSON per parsing preciso
        
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
                timeout: 90000, // 1.5 minuti di timeout - aumentato per test più complessi
                shell: true,
                maxBuffer: 20 * 1024 * 1024 // Aumenta il buffer massimo a 20MB
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
                    await this._saveTestResults('unit', results, testFile || methodName || testPath);
                    
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
                await this._saveTestResults('unit', results, testFile || methodName || testPath);
                
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
                    await this._saveTestResults('unit', errorResults, testFile || methodName || testPath);
                    
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
            await this._saveTestResults('unit', errorResults, testFile || methodName || testPath);
            
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
 * @param {String} repository - Repository specifico per filtrare i test (opzionale)
 * @returns {Array} - Informazioni sui test
 * @private
 */
async _getTestsInfo(testType, repository = null) {
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
        
        // Scansiona i file di test
        let testFiles = await this._scanTestFiles(testsDir);
        
        // Filtra per repository se specificato
        if (repository) {
            console.log(`[TestSystemController] Filtraggio test per repository: ${repository}`);
            testFiles = testFiles.filter(test => 
                test.name.includes(repository) || 
                test.file.includes(repository) || 
                test.description.includes(repository)
            );
        }
        
        // Raggruppa i test per file e estrai i metodi testati
        // Questo permetterà di visualizzare i metodi disponibili per ogni repository
        const testFilesWithMethods = [];
        const testFilesMap = new Map();
        
        // Primo passaggio: raggruppa i test per file
        for (const test of testFiles) {
            if (!testFilesMap.has(test.file)) {
                testFilesMap.set(test.file, {
                    ...test,
                    methods: []
                });
            }
        }
        
        // Secondo passaggio: analizza ogni file per estrarre i metodi
        for (const [filePath, fileInfo] of testFilesMap.entries()) {
            try {
                // Leggi il contenuto del file per estrarre i metodi
                const fullPath = path.join(rootDir, 'src', 'systemTests', testType, filePath);
                const fileContent = await fs.readFile(fullPath, 'utf8');
                
                // Pattern per trovare i metodi testati
                const methodsFound = new Set();
                
                // Trova i blocchi describe
                const describeMatches = fileContent.matchAll(/describe\(['"]([^'"]+)['"]/g);
                for (const match of describeMatches) {
                    if (match[1] && !match[1].includes('Repository')) {
                        methodsFound.add(match[1]);
                    }
                }
                
                // Trova i test diretti senza describe
                const testMatches = fileContent.matchAll(/test\(['"]([^:]+): ([^'"]+)['"]/g);
                for (const match of testMatches) {
                    if (match[1]) {
                        methodsFound.add(match[1]);
                    }
                }
                
                // Aggiungi i metodi trovati
                fileInfo.methods = Array.from(methodsFound).map(method => ({
                    id: `${fileInfo.id}-${method}`,
                    name: method,
                    description: `Test del metodo ${method}`,
                    file: fileInfo.file,
                    repository: fileInfo.name,
                    isMethodTest: true
                }));
                
                testFilesWithMethods.push(fileInfo);
            } catch (error) {
                console.error(`Failed to extract methods from ${filePath}:`, error);
                // Aggiungi comunque il file anche se non siamo riusciti a estrarre i metodi
                testFilesWithMethods.push(fileInfo);
            }
        }
        
        // Ottieni la cronologia dei risultati dei test per ogni file
        const testFilesWithHistory = await Promise.all(testFilesWithMethods.map(async (test) => {
            let latestResult;
            try {
                latestResult = await TestResult.findOne({
                    'testPath': { $regex: new RegExp(test.file.replace(/\\/g, '\\\\')) }
                })
                .sort({ executedAt: -1 })
                .lean();
            } catch (error) {
                console.error(`Failed to get test history for ${test.file}:`, error);
                latestResult = null;
            }
            
            if (latestResult) {
                // Se abbiamo un risultato completo, usiamo i dati del database
                const fileResult = {
                    ...test,
                    status: latestResult.success ? 'passed' : 'failed',
                    duration: latestResult.duration * 1000 || null, // Converti in millisecondi
                    lastExecuted: latestResult.executedAt,
                    passedTests: latestResult.passedTests || 0,
                    failedTests: latestResult.failedTests || 0,
                    totalTests: latestResult.totalTests || 0,
                    output: latestResult.rawOutput
                };
                
                // Aggiorna anche lo status dei metodi se ci sono risultati dettagliati
                if (latestResult.results && latestResult.results.length > 0 && fileResult.methods) {
                    for (const method of fileResult.methods) {
                        // Cerca i risultati relativi a questo metodo specifico
                        const methodResults = latestResult.results.filter(r => 
                            (r.group === method.name) || 
                            (r.name && r.name.includes(` › ${method.name} › `))
                        );
                        
                        if (methodResults.length > 0) {
                            const passedMethods = methodResults.filter(r => r.status === 'passed').length;
                            const failedMethods = methodResults.filter(r => r.status === 'failed').length;
                            
                            method.status = failedMethods > 0 ? 'failed' : 'passed';
                            method.lastExecuted = latestResult.executedAt;
                            method.passedTests = passedMethods;
                            method.failedTests = failedMethods;
                            method.totalTests = methodResults.length;
                        }
                    }
                }
                
                return fileResult;
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
        
        // Log dei risultati per debug
        console.log(`[TestSystemController] Trovati ${testFilesWithHistory.length} file di test con ${testFilesWithHistory.reduce((total, file) => total + (file.methods?.length || 0), 0)} metodi`);
        
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
    
    // Pattern completo per estrarre i test con gruppi nidificati
    // Adesso cerca pattern come:
    // - "UserRepository › findById › should find a user by ID"
    // - "SchoolRepository › findOne › should find a school by criteria"
    // - "ClassRepository › create › should create a new class"
    const testNamePattern = /([A-Za-z]+Repository) › ([a-zA-Z]+) › ([^(]+)/;
    
    // Supporto per i test senza struttura nidificata
    const simpleTestPattern = /([A-Za-z]+Repository): ([^(]+)/;
    
    // Pattern alternativo per i test che usano "describe"
    const describePattern = /describe\(['"](findById|findByEmail|findOne|create|update|deleteWithClasses|findWithFilters|addUser|removeUser|reactivateSection|deactivateSection|setupAcademicYear|findWithUsers|getSectionsWithStudentCount|activateAcademicYear|archiveAcademicYear|getClassesByAcademicYear|changeSchoolType|findByRegion|findAll|exists|findBySchool|findWithDetails|createInitialClasses|promoteStudents)/;
    
    // Regex per individuare le righe di risultato dei test
    const passFailRegex = /^(PASS|FAIL)\s+(.*?)(?:\s+\((\d+)\s*ms\))?$/i;
    const testLineRegex = /^\s*(✓|✕)\s+(.*?)(?:\s+\((\d+)\s*ms\))?$/i;
    
    // Monitoriamo l'ultimo gruppo di test trovato
    let currentSuite = '';
    let currentDescribe = '';
    
    // Lista di tutti i repository supportati
    const repositories = ['UserRepository', 'SchoolRepository', 'ClassRepository', 'StudentRepository'];
    
    // Lista completa dei metodi noti per ogni repository
    const knownMethods = [
        // UserRepository methods
        'findById', 'findByEmail', 'create', 'update', 'findWithFilters',
        // SchoolRepository methods
        'findOne', 'findById', 'create', 'update', 'addUser', 'findByRegion', 
        'setupAcademicYear', 'removeUser', 'deactivateSection', 'reactivateSection',
        'findWithUsers', 'getSectionsWithStudentCount', 'activateAcademicYear',
        'archiveAcademicYear', 'getClassesByAcademicYear', 'changeSchoolType',
        'removeManagerFromSchool', 'addManagerToSchool', 'getStudentsBySection',
        'reactivateAcademicYear', 'updateAcademicYear', 'deleteWithClasses', 'findAll',
        'syncAssignedSchoolIds',
        // ClassRepository methods 
        'create', 'findById', 'update', 'delete', 'find', 'exists', 
        'findBySchool', 'findWithDetails', 'createInitialClasses', 'promoteStudents'
    ];
    
    let inDescribeBlock = false;
    let describeMethod = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Identificare il blocco describe per supportare test con formati diversi
        const describeMatch = line.match(describePattern);
        if (describeMatch) {
            describeMethod = describeMatch[1];
            inDescribeBlock = true;
            // Se troviamo un describe, aggiorniamo il metodo corrente
            currentDescribe = describeMethod;
            console.log(`[TestSystemController] Trovato blocco describe per metodo: ${describeMethod}`);
            continue;
        }
        
        // Riconosci la fine di un blocco describe
        if (inDescribeBlock && line === '});') {
            inDescribeBlock = false;
            describeMethod = '';
            continue;
        }
        
        // Identifica il blocco della suite di test (Repository)
        let foundRepository = false;
        for (const repo of repositories) {
            if (line.startsWith(repo) || line.includes(`'${repo}'`) || line.includes(`"${repo}"`)) {
                currentSuite = repo;
                foundRepository = true;
                console.log(`[TestSystemController] Identificato repository: ${repo}`);
                break;
            }
        }
        if (foundRepository) continue;
        
        // Identifica i blocchi describe (gruppi di test per metodo)
        for (const method of knownMethods) {
            if (line.startsWith(method) || 
                line.includes(`describe('${method}`) || 
                line.includes(`describe("${method}`) ||
                line.includes(`${method}:`)) {
                currentDescribe = method;
                console.log(`[TestSystemController] Identificato metodo: ${method}`);
                break;
            }
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
            
            // Prova con il pattern semplificato "UserRepository: should find a user by ID"
            const simpleMatch = fullName.match(simpleTestPattern);
            if (simpleMatch) {
                results.push({
                    name: fullName,
                    suite: simpleMatch[1],
                    group: currentDescribe || 'unknown', // Usa il describe corrente se disponibile
                    description: simpleMatch[2],
                    status,
                    duration
                });
                continue;
            }
            
            // Se non ha la struttura completa, aggiungi comunque il risultato
            results.push({
                name: fullName,
                suite: currentSuite || fullName.split(' ')[0] || 'unknown',
                group: currentDescribe || 'unknown',
                description: fullName,
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
            let fullName;
            let suite = currentSuite || 'unknown';
            let group = currentDescribe || 'unknown';
            
            // Verifica se il nome del test contiene già informazioni sulla suite/group
            if (testName.includes(':')) {
                const parts = testName.split(':');
                if (parts.length >= 2) {
                    // Il formato è "SomeRepository: should do something"
                    if (repositories.includes(parts[0].trim())) {
                        suite = parts[0].trim();
                        fullName = testName;
                    } else if (knownMethods.includes(parts[0].trim())) {
                        group = parts[0].trim();
                        fullName = `${suite} › ${group} › ${parts.slice(1).join(':').trim()}`;
                    } else {
                        fullName = `${suite} › ${group} › ${testName}`;
                    }
                }
            } else {
                fullName = `${suite} › ${group} › ${testName}`;
            }
            
            results.push({
                name: fullName,
                suite: suite,
                group: group,
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
    
    // Post-processing per migliorare i risultati
    return results.map(result => {
        // Se il gruppo è sconosciuto ma il nome del test contiene indicazioni sul metodo
        if (result.group === 'unknown') {
            for (const method of knownMethods) {
                if (result.description.toLowerCase().includes(method.toLowerCase())) {
                    result.group = method;
                    break;
                }
            }
        }
        
        // Se abbiamo una suite ma non nel formato Repository, correggi
        if (result.suite && !result.suite.endsWith('Repository')) {
            for (const repo of repositories) {
                if (result.name.includes(repo)) {
                    result.suite = repo;
                    break;
                }
            }
        }
        
        return result;
    });
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
 * Estrae l'errore dall'output di Jest e fornisce dettagli aggiuntivi per il debug
 * @param {String} output - Output grezzo del test
 * @returns {String} - Messaggio di errore dettagliato
 * @private
 */
_extractErrorDetails(output) {
    if (!output) return 'Nessun dettaglio errore disponibile';
    
    try {
        // Cerca pattern di errori comuni
        const errorPatterns = [
            // Errore Mongoose per ID non trovato
            /Utente non trovato/,
            // Errore generico Jest
            /Error: (.*?)(\n|$)/,
            // Errori di asserzione
            /expect\((.*?)\)\..*? (.*?)(\n|$)/,
            // Errori di timeout
            /Test timeout - Async callback was not invoked within.*?(\n|$)/,
            // Errori di sintassi
            /SyntaxError: (.*?)(\n|$)/,
            // Errori di validazione Mongoose
            /ValidationError: (.*?)(\n|$)/
        ];
        
        let errorMessage = '';
        
        // Cerca ogni pattern nell'output
        for (const pattern of errorPatterns) {
            const match = output.match(pattern);
            if (match) {
                errorMessage += match[0] + '\n';
            }
        }
        
        // Se non abbiamo trovato dettagli specifici, estrai il contesto dell'errore
        if (!errorMessage) {
            // Cerca il contesto dell'errore (15 righe prima e dopo la parola 'Error')
            const errorIndex = output.indexOf('Error');
            if (errorIndex !== -1) {
                const start = Math.max(0, errorIndex - 300);
                const end = Math.min(output.length, errorIndex + 300);
                errorMessage = '... ' + output.substring(start, end) + ' ...';
            }
        }
        
        // Aggiungi suggerimenti per debug basati sul tipo di errore
        if (errorMessage.includes('Utente non trovato')) {
            errorMessage += '\nSuggerimento: Verifica che l\'utente esista nel database. ' +
                'I test potrebbero eliminare gli utenti prima dei test o usare un ID sbagliato.';
        } else if (errorMessage.includes('Scuola non trovata')) {
            errorMessage += '\nSuggerimento: Verifica che la scuola esista nel database. ' +
                'I test potrebbero eliminare le scuole prima dei test o usare un ID sbagliato.';
        } else if (errorMessage.includes('Classe non trovata')) {
            errorMessage += '\nSuggerimento: Verifica che la classe esista nel database. ' +
                'I test potrebbero eliminare le classi prima dei test o usare un ID sbagliato.';
        } else if (errorMessage.includes('timeout')) {
            errorMessage += '\nSuggerimento: Il test ha impiegato troppo tempo. ' +
                'Verifica eventuali operazioni asincrone bloccate o operazioni troppo pesanti.';
        }
        
        return errorMessage || 'Dettagli errore non disponibili';
    } catch (error) {
        console.error('[TestSystemController] Errore nell\'estrazione dei dettagli dell\'errore:', error);
        return 'Errore nell\'analisi dei dettagli dell\'errore';
    }
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