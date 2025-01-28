import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../../../context/NotificationContext';
import { axiosInstance } from '../../../../services/axiosConfig';

export const useStudentTest = (studentId) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [completedTests, setCompletedTests] = useState([]);
    const [selectedTest, setSelectedTest] = useState(null);
    const { showNotification } = useNotification();
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
            const response = await axiosInstance.get(`/tests/csi/results/student/${studentId}`);
            if (response.data && response.data.data) {
                setCompletedTests(response.data.data);
                // Se c'è un test selezionato, aggiorna i suoi dati
                if (selectedTest) {
                    const updatedTest = response.data.data.find(
                        test => test._id === selectedTest._id
                    );
                    if (updatedTest) {
                        setSelectedTest(updatedTest);
                    }
                }
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            setError(errorMessage);
            showNotification(
                'Errore nel caricamento dei test completati: ' + errorMessage,
                'error'
            );
        } finally {
            setLoading(false);
        }
    }, [studentId, selectedTest, showNotification]);

    // Carica i test all'avvio e quando cambia lo studentId
    useEffect(() => {
        fetchCompletedTests();
    }, [fetchCompletedTests]);

    // Seleziona un test
    const handleTestSelect = useCallback((test) => {
        setSelectedTest(test);
    }, []);

    // Formatta una data nel formato italiano
    const formatDate = useCallback((dateString) => {
        return new Date(dateString).toLocaleString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }, []);

    return {
        loading,
        error,
        completedTests,
        selectedTest,
        handleTestSelect,
        formatDate,
        refreshTests: fetchCompletedTests
    };
};

export default useStudentTest;