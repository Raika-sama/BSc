import React from 'react';
import { Box, Paper, Typography, Breadcrumbs, Link, Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CompletedTestsList from './components/CompletedTestsList';
import TestResultsView from './components/TestResultsView';
import { useStudentTest } from './hooks/useStudentTest';

const StudentTestsLayout = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const {
        loading,
        error,
        completedTests,
        selectedTest,
        handleTestSelect,
        formatDate
    } = useStudentTest(studentId);

    // Monitoring effect for component mount and studentId validation
    useEffect(() => {
        if (!studentId || studentId === 'undefined') {
            showNotification('ID studente non valido', 'error');
            navigate('/admin/students');
            return;
        }
    }, [studentId, navigate, showNotification]);

    // Fetch completed tests effect
    useEffect(() => {
        const fetchTests = async () => {
            try {
                const response = await axiosInstance.get(`/tests/csi/results/student/${studentId}`);
                if (response.data && response.data.data) {
                    setCompletedTests(response.data.data);
                }
            } catch (error) {
                showNotification(
                    'Errore nel caricamento dei test completati: ' + 
                    (error.response?.data?.message || error.message),
                    'error'
                );
            }
        };

        if (studentId && studentId !== 'undefined') {
            fetchTests();
        }
    }, [studentId, showNotification]);

    // Handle test creation
    const handleCreateTest = async () => {
        try {
            if (!studentId || studentId === 'undefined') {
                showNotification('ID studente mancante o non valido', 'error');
                return;
            }

            const response = await axiosInstance.post('/tests/csi/generate-link', {
                studentId,
                testType: 'CSI',
            });

            if (response.data && response.data.data?.token) {
                const testUrl = `${window.location.origin}/test/csi/${response.data.data.token}`;
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

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                        <Breadcrumbs>
                            <Link 
                                component="button"
                                variant="body2"
                                onClick={() => navigate('/students')}
                                sx={{ cursor: 'pointer' }}
                            >
                                Studenti
                            </Link>
                            <Typography variant="body2" color="text.primary">
                                Gestione Test
                            </Typography>
                        </Breadcrumbs>
                        <Typography variant="h5" color="primary">
                            Gestione Test Studente
                        </Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/admin/students')}
                    >
                        Torna alla lista
                    </Button>
                </Box>
            </Box>

            {/* Main Content */}
            <Box sx={{ display: 'flex', gap: 3, flex: 1, minHeight: 0 }}>
                {/* Sidebar */}
                <Paper sx={{ width: '300px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <CompletedTestsList 
                        tests={completedTests}
                        selectedTest={selectedTest}
                        onTestSelect={setSelectedTest}
                        onCreateTest={handleCreateTest}
                    />
                </Paper>

                {/* Main Content Area */}
                <Paper sx={{ flex: 1, overflow: 'hidden' }}>
                    <TestResultsView 
                        test={selectedTest}
                    />
                </Paper>
            </Box>

            {/* Test Link Dialog */}
            <TestLinkDialog 
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                testLink={testLink}
            />
        </Box>
    );
};

export default StudentTestsLayout;