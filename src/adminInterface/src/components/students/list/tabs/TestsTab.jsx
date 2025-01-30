import React from 'react';
import { Box, Paper } from '@mui/material';
import CompletedTestsList from '../../studentTests/components/CompletedTestsList';
import TestResultsView from '../../studentTests/components/TestResultsView';
import { useStudentTest } from '../../studentTests/hooks/useStudentTest';
import TestLinkDialog from '../../TestLinkDialog';

const TestsTab = ({ student }) => {
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
    } = useStudentTest(student._id);

    const handleCreateTest = async () => {
        try {
            const response = await axiosInstance.post('/tests/csi/generate-link', {
                studentId: student._id,
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
        <Box 
            sx={{ 
                display: 'flex', 
                gap: 3, 
                height: '100%',
                overflow: 'hidden'
            }}
        >
            {/* Lista Test (Sidebar) */}
            <Paper 
                sx={{ 
                    width: '300px',
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
            </Paper>

            {/* Area Risultati */}
            <Paper 
                sx={{ 
                    flex: 1,
                    overflow: 'hidden'
                }}
            >
                <TestResultsView 
                    test={selectedTest}
                />
            </Paper>

            {/* Dialog per il Link del Test */}
            <TestLinkDialog 
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                testLink={testLink}
            />
        </Box>
    );
};

export default TestsTab;