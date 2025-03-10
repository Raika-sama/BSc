import { useState, useEffect, useCallback, useRef } from 'react';
import { useNotification } from '../../../../context/NotificationContext';
import { axiosInstance } from '../../../../services/axiosConfig';

/**
 * Hook personalizzato per gestire i test assegnati a uno studente
 * @param {string} studentId - ID dello studente
 * @returns {Object} Stato e funzioni per gestire i test assegnati
 */
export const useAssignedTests = (studentId) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [assignedTests, setAssignedTests] = useState([]);
    const [selectedTest, setSelectedTest] = useState(null);
    const { showNotification } = useNotification();
    
    // Usa un ref per tenere traccia dell'ultimo ID selezionato e evitare loop
    const selectedTestIdRef = useRef(selectedTest?._id);

// Funzione per estrarre i test dalla risposta API - migliorata
const extractTestsFromResponse = (response) => {
    // Inizia con un array vuoto
    let tests = [];
    
    if (!response || !response.data) {
        console.warn('Risposta API vuota o senza dati');
        return tests;
    }
    
    // Caso 1: response.data.data è un array
    if (response.data.data && Array.isArray(response.data.data)) {
        tests = response.data.data;
    } 
    // Caso 2: response.data.data è un oggetto con proprietà data (nidificato)
    else if (response.data.data && response.data.data.data && Array.isArray(response.data.data.data)) {
        tests = response.data.data.data;
    }
    // Caso 3: response.data.data è un singolo oggetto (non un array)
    else if (response.data.data && typeof response.data.data === 'object') {
        tests = [response.data.data];
    }
    // Caso 4: response.data è direttamente un array
    else if (Array.isArray(response.data)) {
        tests = response.data;
    }
    
    // Assicurati che ogni test abbia uno status e un ID
    return tests.map(test => {
        // Assicurati che ogni test abbia uno status
        const testWithStatus = {
            ...test,
            status: test.status || 'pending'
        };
        
        // Se il test ha una proprietà data che contiene un array,
        // probabilmente è un wrapper che dovremmo spacchettare
        if (test.data && Array.isArray(test.data) && test.data.length > 0) {
            console.debug('Unwrapping test data:', test);
            return {
                ...test.data[0],
                status: test.data[0].status || 'pending'
            };
        }
        
        return testWithStatus;
    });
};

// Carica i test assegnati allo studente - migliorata
const fetchAssignedTests = useCallback(async () => {
    if (!studentId) return;
    
    setLoading(true);
    setError(null);
    
    try {
        console.debug('Fetching assigned tests for student:', {
            studentId
        });
        
        // Aggiungiamo il parametro include per ottenere dati aggiuntivi
        const response = await axiosInstance.get(`/tests/assigned/student/${studentId}`);
        
        console.debug('Server response:', {
            status: response.status,
            statusText: response.statusText,
            hasData: !!response.data,
            dataType: response.data ? typeof response.data : 'N/A'
        });
        
        // Estrai i test dalla risposta
        const testsArray = extractTestsFromResponse(response);
        
        console.debug('Processed tests array:', {
            length: testsArray.length,
            firstTest: testsArray.length > 0 ? {
                id: testsArray[0]._id,
                type: testsArray[0].tipo,
                status: testsArray[0].status
            } : 'No tests'
        });
        
        // Ordina i test per data più recente
        const sortedTests = [...testsArray].sort((a, b) => {
            const dateA = a.assignedAt || a.createdAt ? new Date(a.assignedAt || a.createdAt) : new Date(0);
            const dateB = b.assignedAt || b.createdAt ? new Date(b.assignedAt || b.createdAt) : new Date(0);
            return dateB - dateA;
        });
        
        // Filtra solo i test che non sono completati
        const activeSortedTests = sortedTests.filter(test => test.active && test.status !== 'completed');
        
        console.debug('Active sorted tests:', {
            total: sortedTests.length,
            active: activeSortedTests.length,
            firstActiveTest: activeSortedTests.length > 0 ? activeSortedTests[0]._id : 'None'
        });
        
        // Salva i test nello stato
        setAssignedTests(activeSortedTests);
        
        // Gestisci il test selezionato - usando la ref per evitare loop
        const currentSelectedId = selectedTestIdRef.current;
        
        if (activeSortedTests.length > 0) {
            if (currentSelectedId) {
                // Se c'è un ID selezionato, cerca di mantenerlo
                const existingTest = activeSortedTests.find(test => test._id === currentSelectedId);
                if (existingTest) {
                    setSelectedTest(existingTest);
                } else {
                    // Se il test selezionato non esiste più, seleziona il primo
                    setSelectedTest(activeSortedTests[0]);
                    selectedTestIdRef.current = activeSortedTests[0]._id;
                }
            } else {
                // Se non c'è un test selezionato, seleziona il primo
                setSelectedTest(activeSortedTests[0]);
                selectedTestIdRef.current = activeSortedTests[0]._id;
            }
        } else if (currentSelectedId) {
            // Se non ci sono test ma c'è un test selezionato, rimuovilo
            setSelectedTest(null);
            selectedTestIdRef.current = null;
        }
    } catch (error) {
        console.error('Errore nel caricamento dei test assegnati:', error);
        setError('Impossibile caricare i test assegnati.');
        showNotification(
            'Errore nel caricamento dei test assegnati: ' + 
            (error.response?.data?.message || error.message),
            'error'
        );
    } finally {
        setLoading(false);
    }
}, [studentId, showNotification]);

    // Aggiorna la ref quando cambia selectedTest
    useEffect(() => {
        selectedTestIdRef.current = selectedTest?._id;
    }, [selectedTest]);

    // Carica i test all'avvio o quando cambia lo studentId
    useEffect(() => {
        if (studentId) {
            fetchAssignedTests();
        } else {
            // Reset dello stato se non c'è studentId
            setAssignedTests([]);
            setSelectedTest(null);
            selectedTestIdRef.current = null;
        }
    }, [studentId, fetchAssignedTests]);

    // Assegna un nuovo test
    const assignTest = async (testType, config = {}) => {
        if (!studentId) {
            showNotification('ID studente mancante o non valido', 'error');
            return null;
        }
    
        setLoading(true);
        try {
            console.debug('Assigning new test:', {
                testType,
                studentId,
                config
            });
            
            const response = await axiosInstance.post('/tests/assign', {
                testType,
                studentId,
                config: {
                    tempoLimite: config.tempoLimite || 30,
                    tentativiMax: config.tentativiMax || 1,
                    randomizzaDomande: config.randomizzaDomande !== undefined ? config.randomizzaDomande : true,
                    mostraRisultatiImmediati: config.mostraRisultatiImmediati || false
                }
            });
    
            if (response.data && response.data.status === 'success') {
                showNotification('Test assegnato con successo', 'success');
                // Ricarica i test per includere quello appena assegnato
                await fetchAssignedTests();
                return response.data.data.test;
            }
            return null;
        } catch (error) {
            console.error('Errore nell\'assegnazione del test:', error);
            showNotification(
                'Errore nell\'assegnazione del test: ' + 
                (error.response?.data?.message || error.message),
                'error'
            );
            return null;
        } finally {
            setLoading(false);
        }
    };
    
    // Funzione per revocare un test - migliorata
    const revokeTest = async (testId) => {
        if (!testId) {
            showNotification('ID test mancante o non valido', 'error');
            return false;
        }
        
        setLoading(true);
        try {
            console.debug('Revoking test:', {
                testId,
                endpoint: `/tests/${testId}/revoke`
            });
            
            // Utilizziamo l'endpoint POST corretto
            const response = await axiosInstance.post(`/tests/${testId}/revoke`);
            
            console.debug('Revoke response received:', {
                status: response.status,
                statusText: response.statusText,
                hasData: !!response.data,
                success: response.data?.status === 'success'
            });
            
            if (response.data && response.data.status === 'success') {
                showNotification('Test revocato con successo', 'success');
                
                // Aggiorna la lista dei test
                await fetchAssignedTests();
                
                return true;
            } else {
                console.error('Risposta inattesa dalla revoca del test:', response.data);
                showNotification(
                    'Errore nella revoca del test: risposta dal server non valida', 
                    'error'
                );
                return false;
            }
        } catch (error) {
            console.error('Errore nella revoca del test:', error);
            
            // Log dettagliato dell'errore per il debug
            if (error.response) {
                console.error('Error response details:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                    headers: error.response.headers
                });
            } else if (error.request) {
                console.error('Error request details:', {
                    request: error.request
                });
            }
            
            showNotification(
                'Errore nella revoca del test: ' + 
                (error.response?.data?.error?.message || error.message),
                'error'
            );
            return false;
        } finally {
            setLoading(false);
        }
    };
    
    // Seleziona un test
    const handleTestSelect = useCallback((test) => {
        if (!test || !test._id) {
            console.error('Tentativo di selezionare un test senza ID:', test);
            return;
        }
        
        console.debug('Selecting test:', {
            testId: test._id,
            testType: test.tipo
        });
        setSelectedTest(test);
        selectedTestIdRef.current = test._id;
    }, []);

    // Formatta una data nel formato italiano
    const formatDate = useCallback((dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString('it-IT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            console.warn('Error formatting date:', e);
            return 'Data non valida';
        }
    }, []);

    return {
        loading,
        error,
        assignedTests,
        selectedTest,
        handleTestSelect,
        assignTest,
        revokeTest,
        refreshTests: fetchAssignedTests,
        formatDate,
        // Metodo di utilità per verificare se ci sono test
        hasTests: assignedTests.length > 0
    };
};

export default useAssignedTests;