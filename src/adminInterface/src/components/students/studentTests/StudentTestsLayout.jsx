import React, { useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CompletedTestsList from './components/CompletedTestsList';
import TestResultsView from './components/TestResultsView';
import { useStudentTest } from './hooks/useStudentTest';
import { axiosInstance } from '../../../services/axiosConfig';
import { useNotification } from '../../../context/NotificationContext';
import TestLinkDialog from './components/TestLinkDialog';
import ContentLayout from '../../common/ContentLayout';

const StudentTestsLayout = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const {
        loading,
        error,
        completedTests,
        selectedTest,
        handleTestSelect,
        formatDate,
        setCompletedTests,
        setSelectedTest,
        dialogOpen,
        setDialogOpen,
        testLink,
        setTestLink
    } = useStudentTest(studentId);

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
    }, [studentId, showNotification, setCompletedTests]);

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

    const actions = (
        <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/admin/students')}
        >
            Torna alla lista
        </Button>
    );

    const breadcrumbLinks = [
        {
            text: 'Studenti',
            onClick: () => navigate('/students')
        }
    ];

    return (
        <ContentLayout
            title="Gestione Test Studente"
            subtitle="Visualizza e gestisci i test dello studente"
            actions={actions}
            contentProps={{
                sx: { p: 0 } // Rimuove il padding predefinito per il contenuto principale
            }}
        >
            {/* Main Content */}
            <Box 
                sx={{ 
                    display: 'flex', 
                    gap: 3, 
                    height: 'calc(100vh - 180px)', // Adjust based on your header height
                    p: 3 
                }}
            >
                {/* Sidebar */}
                <Box 
                    sx={{ 
                        width: '300px',
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <CompletedTestsList 
                        tests={completedTests}
                        selectedTest={selectedTest}
                        onTestSelect={handleTestSelect}
                        onCreateTest={handleCreateTest}
                    />
                </Box>

                {/* Main Content Area */}
                <Box 
                    sx={{ 
                        flex: 1,
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        overflow: 'hidden'
                    }}
                >
                    <TestResultsView 
                        test={selectedTest}
                    />
                </Box>
            </Box>

            {/* Test Link Dialog */}
            <TestLinkDialog 
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                testLink={testLink}
            />
        </ContentLayout>
    );
};

export default StudentTestsLayout;