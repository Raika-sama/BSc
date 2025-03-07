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
                
                // Se il file è UserRepository.test.js, usa un pattern più specifico
                if (normalizedTestFile.includes('UserRepository.test.js')) {
                    testPath = 'src/systemTests/unit/repositories/UserRepository.test.js';
                    
                    // Usa il parametro --testPathPattern con il percorso esatto
                    commandArgs = [`--testPathPattern=${testPath}`];
                    console.log(`[TestSystemController] Pattern specificato per UserRepository: ${testPath}`);
                } else {
                    // Per altri file, usa il pattern standard
                    if (!normalizedTestFile.includes('src/systemTests/')) {
                        testPath = `src/systemTests/unit/${normalizedTestFile}`;
                    } else {
                        testPath = normalizedTestFile;
                    }
                    
                    commandArgs = [`--testPathPattern=${testPath}`];
                }
            } else {
                // Se non è specificato un file, esegui tutti i test unitari
                testPath = 'src/systemTests/unit';
                commandArgs = [`--testPathPattern=${testPath}`];
            }
            
            console.log(`[TestSystemController] Esecuzione test con pattern: ${testPath}`);
            console.log(`[TestSystemController] Directory di lavoro: ${process.cwd()}`);
            
            // Aggiungi --runInBand per eseguire i test in serie (evita problemi con MongoDB)
            commandArgs.push('--runInBand');
            
            // Aggiungi --testTimeout=30000 per aumentare il timeout
            commandArgs.push('--testTimeout=30000');
            
            // Costruisci il comando
            const command = `npx jest --config=jest.config.js ${commandArgs.join(' ')} --no-cache`;
            console.log(`[TestSystemController] Comando: ${command}`);
            
            // Esegui Jest in modo sincrono per debug
            try {
                const output = execSync(command, { 
                    stdio: 'pipe',
                    encoding: 'utf8',
                    timeout: 60000, // 1 minuto di timeout
                    shell: true // Importante per gestire correttamente le virgolette e i caratteri speciali
                });
                
                console.log(`[TestSystemController] Output Jest:\n${output}`);
                
                // Crea un risultato fittizio per la risposta
                const results = {
                    success: true,
                    testResults: [{
                        name: testPath,
                        status: 'passed',
                        message: 'Test eseguito con successo'
                    }],
                    rawOutput: output
                };
                
                // Salva i risultati nel database
                await this._saveTestResults('unit', results, testFile || testPath);
                
                return this.sendResponse(res, results);
            } catch (execError) {
                console.error(`[TestSystemController] Errore nell'esecuzione di Jest:`);
                console.error(execError.message);
                if (execError.stdout) console.log(`[TestSystemController] stdout: ${execError.stdout}`);
                if (execError.stderr) console.log(`[TestSystemController] stderr: ${execError.stderr}`);
                
                // Crea un risultato di errore per la risposta
                const errorResults = {
                    success: false,
                    testResults: [{
                        name: testPath,
                        status: 'failed',
                        message: execError.message
                    }],
                    rawOutput: execError.stdout || execError.stderr || 'No output'
                };
                
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
            const { testFile } = req.query;
            
            // Costruisci gli argomenti per Jest
            let testPath = 'src/systemTests/integration';
            if (testFile) {
                testPath = testFile;
            }
            
            // Costruisci il comando
            const command = `npx jest --config=jest.config.js --testPathPattern="${testPath}" --no-cache`;
            
            try {
                const output = execSync(command, { 
                    stdio: 'pipe',
                    encoding: 'utf8',
                    timeout: 60000
                });
                
                const results = {
                    success: true,
                    testResults: [{
                        name: testPath,
                        status: 'passed',
                        message: 'Test eseguito con successo'
                    }],
                    rawOutput: output
                };
                
                // Salva i risultati nel database
                await this._saveTestResults('integration', results, testFile || testPath);
                
                return this.sendResponse(res, results);
            } catch (execError) {
                const errorResults = {
                    success: false,
                    testResults: [{
                        name: testPath,
                        status: 'failed',
                        message: execError.message
                    }],
                    rawOutput: execError.stdout || execError.stderr || 'No output'
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
            
            try {
                const output = execSync(command, { 
                    stdio: 'pipe',
                    encoding: 'utf8',
                    timeout: 120000 // 2 minuti di timeout
                });
                
                const results = {
                    success: true,
                    testResults: [{
                        name: 'all',
                        status: 'passed',
                        message: 'Tutti i test eseguiti con successo'
                    }],
                    rawOutput: output
                };
                
                // Salva i risultati nel database
                await this._saveTestResults('all', results, 'all');
                
                return this.sendResponse(res, results);
            } catch (execError) {
                const errorResults = {
                    success: false,
                    testResults: [{
                        name: 'all',
                        status: 'failed',
                        message: execError.message
                    }],
                    rawOutput: execError.stdout || execError.stderr || 'No output'
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
                    'results.name': { $regex: new RegExp(test.file.replace(/\\/g, '\\\\')) }
                }).sort({ executedAt: -1 }).lean();
                
                // Trova l'esecuzione specifica per questo file di test
                let fileResult = null;
                if (latestResult) {
                    const testFileResult = latestResult.results.find(r => r.name.includes(test.file));
                    if (testFileResult) {
                        fileResult = {
                            status: testFileResult.status,
                            duration: testFileResult.duration,
                            lastExecuted: latestResult.executedAt
                        };
                    }
                }
                
                return {
                    ...test,
                    status: fileResult ? fileResult.status : 'pending',
                    duration: fileResult ? fileResult.duration : null,
                    lastExecuted: fileResult ? fileResult.lastExecuted : null
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
     * Salva i risultati dei test nel database
     * @param {String} testType - Tipo di test ('unit', 'integration', o 'all')
     * @param {Object} results - Risultati del test
     * @param {String} testPath - Percorso del test eseguito
     * @private
     */
    async _saveTestResults(testType, results, testPath) {
        try {
            console.log(`[TestSystemController] Salvando risultati del test ${testType}: ${testPath}`);
            
            // Estrai informazioni importanti dall'output raw
            const outputLines = results.rawOutput.split('\n');
            
            // Cerca il numero di test passati/falliti nell'output
            let passedTests = 0;
            let failedTests = 0;
            let totalTests = 0;
            let duration = 0;
            
            for (const line of outputLines) {
                // Estrai il numero di test e la durata dall'output di Jest
                const testSummaryMatch = line.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+failed,\s+(\d+)\s+total/i);
                if (testSummaryMatch) {
                    passedTests = parseInt(testSummaryMatch[1]);
                    failedTests = parseInt(testSummaryMatch[2]);
                    totalTests = parseInt(testSummaryMatch[3]);
                }
                
                // Estrai la durata totale dall'output
                const timeMatch = line.match(/Time:\s+([0-9.]+)s/i);
                if (timeMatch) {
                    duration = parseFloat(timeMatch[1]);
                }
            }
            
            // Crea un nuovo documento per salvare i risultati del test
            const testResult = new TestResult({
                testType,
                testPath,
                executedAt: new Date(),
                success: results.success,
                results: results.testResults,
                passedTests,
                failedTests,
                totalTests,
                duration,
                rawOutput: results.rawOutput.substring(0, 65000) // Limita la dimensione dell'output raw
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