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
    const { generateCSITestLink } = useCSITest(); // Aggiungiamo questo
    const csiContext = useCSITest();
    const navigate = useNavigate();

    // Verifica validità studentId
    useEffect(() => {
        if (!studentId || studentId === 'undefined') {
            showNotification('ID studente non valido', 'error');
            navigate('/admin/students');
            return;
        }
    }, [studentId, navigate, showNotification]);

    const handleCreateTest = async () => {
        try {
            if (!studentId || studentId === 'undefined') {
                showNotification('ID studente mancante o non valido', 'error');
                return;
            }

            const result = await generateCSITestLink(studentId);
            if (result) {
                const testUrl = `${window.location.origin}/test/csi/${result.token}`;
                setTestLink(testUrl);
                setDialogOpen(true);
                showNotification('Link del test generato con successo', 'success');
            }
        } catch (error) {
            showNotification(
                `Errore nella generazione del link del test: ${
                    error.response?.data?.message || error.message
                }`,
                'error'
            );
        }
    };


    // Carica i test completati
    const fetchCompletedTests = useCallback(async () => {
        if (!studentId || studentId === 'undefined') return;

        setLoading(true);
        setError(null);

        try {
            const response = await axiosInstance.get(`/tests/student/${studentId}/completed`);
            if (response.data?.data?.tests && Array.isArray(response.data.data.tests)) {
                setCompletedTests(response.data.data.tests);
                // Se c'è un test selezionato, aggiorna i suoi dati
                if (selectedTest) {
                    const updatedTest = response.data.data.tests.find(
                        test => test._id === selectedTest._id
                    );
                    if (updatedTest) {
                        setSelectedTest(updatedTest);
                    }
                }
            } else {
                // Se non ci sono dati o non è un array, inizializza con array vuoto
                setCompletedTests([]);
                setSelectedTest(null);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message;
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
        handleCreateTest,
        formatDate,
        refreshTests: fetchCompletedTests,
        // Aggiungi questi
        setCompletedTests,
        setSelectedTest,
        dialogOpen,
        setDialogOpen,
        testLink,
        setTestLink
    };
};

export default useStudentTest;