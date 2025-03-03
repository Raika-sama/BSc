import { useState, useEffect, useCallback } from 'react';
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

    // Carica i test assegnati allo studente
    const fetchAssignedTests = useCallback(async () => {
        if (!studentId) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const response = await axiosInstance.get(`/tests/assigned/student/${studentId}`);
            if (response.data && response.data.data) {
                // Filtra solo i test non completati
                const assignedNotCompleted = response.data.data.filter(
                    test => test.status !== 'completed'
                );
                
                setAssignedTests(assignedNotCompleted);
                
                // Seleziona il primo test se esiste e nessuno è già selezionato
                if (assignedNotCompleted.length > 0 && !selectedTest) {
                    setSelectedTest(assignedNotCompleted[0]);
                }
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
    }, [studentId, selectedTest, showNotification]);

    // Carica i test all'avvio o quando cambia lo studentId
    useEffect(() => {
        if (studentId) {
            fetchAssignedTests();
        }
    }, [fetchAssignedTests, studentId]);

    // Assegna un nuovo test
    const assignTest = async (testType, config = {}) => {
        if (!studentId) {
            showNotification('ID studente mancante o non valido', 'error');
            return null;
        }

        setLoading(true);
        try {
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
                fetchAssignedTests();
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

    // Revoca un test assegnato
    const revokeTest = async (testId) => {
        if (!testId) return false;
        
        setLoading(true);
        try {
            const response = await axiosInstance.post(`/tests/${testId}/revoke`);
            if (response.data && response.data.status === 'success') {
                showNotification('Test revocato con successo', 'success');
                
                // Aggiorna la lista dei test
                fetchAssignedTests();
                
                // Reimposta il test selezionato se è stato revocato
                if (selectedTest && selectedTest._id === testId) {
                    setSelectedTest(null);
                }
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('Errore nella revoca del test:', error);
            showNotification(
                'Errore nella revoca del test: ' + 
                (error.response?.data?.message || error.message),
                'error'
            );
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Seleziona un test
    const handleTestSelect = (test) => {
        setSelectedTest(test);
    };

    // Formatta una data nel formato italiano
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return {
        loading,
        error,
        assignedTests,
        selectedTest,
        handleTestSelect,
        assignTest,
        revokeTest,
        refreshTests: fetchAssignedTests,
        formatDate
    };
};

export default useAssignedTests;