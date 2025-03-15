import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../../../context/NotificationContext';
import { axiosInstance } from '../../../../services/axiosConfig';
import { useCSITest } from '../../../../context/TestContext/CSITestContext';

export const useStudentTest = (studentId) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [completedTests, setCompletedTests] = useState([]);
    const [selectedTest, setSelectedTest] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [testLink, setTestLink] = useState('');
    const { showNotification } = useNotification();
    const { generateCSITestLink } = useCSITest();
    const navigate = useNavigate();

    // Verifica validità studentId
    useEffect(() => {
        if (!studentId || studentId === 'undefined') {
            showNotification('ID studente non valido', 'error');
            navigate('/admin/students');
            return;
        }
    }, [studentId, navigate, showNotification]);

    // Carica i test completati
    const fetchCompletedTests = useCallback(async () => {
        if (!studentId || studentId === 'undefined') return;

        setLoading(true);
        setError(null);

        try {
            console.debug('Fetching completed tests for student:', studentId);
            const response = await axiosInstance.get(`/tests/student/${studentId}/completed`);
            
            console.debug('Completed tests response:', response.data);
            
            if (response.data?.data?.tests && Array.isArray(response.data.data.tests)) {
                const tests = response.data.data.tests;
                console.debug('Test results structure:', tests[0]);
                
                // Carichiamo i dettagli completi del test selezionato
                if (tests.length > 0) {
                    // Per ogni test, carichiamo anche i risultati associati
                    const testsWithResults = await Promise.all(tests.map(async (test) => {
                        try {
                            // Carichiamo i risultati dettagliati del test
                            const resultResponse = await axiosInstance.get(`/tests/${test._id}/results`);
                                if (resultResponse.data?.data?.result) {
                                    const result = resultResponse.data.data.result;
                                    console.debug(`Found result for test ${test._id}:`, result);
                                    // Fondiamo i dati del test con i dati del risultato
                                    return {
                                        ...test,
                                        punteggiDimensioni: result.punteggiDimensioni || {},
                                        punteggi: result.punteggi || {},
                                        risposte: result.risposte || [],
                                        metadataCSI: result.metadataCSI || {},
                                        analytics: result.analytics || {},
                                        dataInizio: result.dataInizio || test.createdAt,
                                        dataCompletamento: result.dataCompletamento || test.updatedAt
                                    };
                                }
                            return test;
                        } catch (error) {
                            console.error(`Error loading results for test ${test._id}:`, error);
                            return test;
                        }
                    }));
                    
                    setCompletedTests(testsWithResults);
                    
                    // Se c'è un test selezionato, aggiorna i suoi dati
                    if (selectedTest) {
                        const updatedTest = testsWithResults.find(
                            test => test._id === selectedTest._id
                        );
                        if (updatedTest) {
                            // Aggiorniamo il test selezionato senza causare un nuovo ciclo
                            setSelectedTest(prev => {
                                if (!prev || prev._id !== updatedTest._id) return updatedTest;
                                return { ...prev, ...updatedTest };
                            });
                        }
                    } else if (testsWithResults.length > 0) {
                        // Se non c'è un test selezionato ma abbiamo test, selezioniamo il primo
                        setSelectedTest(testsWithResults[0]);
                    }
                } else {
                    setCompletedTests([]);
                    setSelectedTest(null);
                }
            } else {
                // Se non ci sono dati o non è un array, inizializza con array vuoto
                setCompletedTests([]);
                setSelectedTest(null);
            }
        } catch (error) {
            console.error('Error fetching completed tests:', error);
            const errorMessage = error.response?.data?.error?.message || error.message;
            setError(errorMessage);
            showNotification(
                'Errore nel caricamento dei test completati: ' + errorMessage,
                'error'
            );
        } finally {
            setLoading(false);
        }
    }, [studentId, showNotification]); // Rimosso selectedTest dalle dipendenze

    // Carica i test all'avvio e quando cambia lo studentId
    useEffect(() => {
        fetchCompletedTests();
    }, [fetchCompletedTests]);

    // Seleziona un test - migliorato per evitare cicli
    const handleTestSelect = useCallback((test) => {
        if (!test || (selectedTest && test._id === selectedTest._id)) return;
        console.debug('Selecting test:', test._id);
        setSelectedTest(test);
    }, [selectedTest]);

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
        completedTests,
        selectedTest,
        handleTestSelect,
        formatDate,
        refreshTests: fetchCompletedTests,
        setCompletedTests,
        setSelectedTest,
        dialogOpen,
        setDialogOpen,
        testLink,
        setTestLink
    };
};

export default useStudentTest;