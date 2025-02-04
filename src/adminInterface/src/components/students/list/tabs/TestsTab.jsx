import React, { useState } from 'react';
import { Box, Paper, Button } from '@mui/material';
import CompletedTestsList from '../../studentTests/components/CompletedTestsList';
import TestResultsView from '../../studentTests/components/TestResultsView';
import { useStudentTest } from '../../studentTests/hooks/useStudentTest';
import TestLinkDialog from '../../studentTests/components/TestLinkDialog';
import { useNotification } from '../../../../context/NotificationContext';
import { axiosInstance } from '../../../../services/axiosConfig'; // Nota: import nominale

const TestsTab = ({ student }) => {
    const {
        completedTests,
        selectedTest,
        handleTestSelect,
        dialogOpen,
        setDialogOpen,
        testLink,
        setTestLink
    } = useStudentTest(student._id);
    
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(false);

    const handleCreateTest = async () => {
        if (!student || !student._id) {
            showNotification('ID studente non valido', 'error');
            return;
        }
    
        try {
            setLoading(true);
            console.log('Creating CSI test for student:', student._id);
            
            // Usa l'endpoint corretto
            const response = await axiosInstance.post('/tests/csi/generate-link', {
                studentId: student._id,
                testType: 'CSI'
            });
    
            console.log('Test creation response:', response.data);
    
            if (response.data && response.data.data && response.data.data.token) {
                // Costruisci l'URL usando il token ricevuto
                const testUrl = `${window.location.origin}/test/csi/${response.data.data.token}`;
                console.log('Generated test URL:', testUrl);
                
                setTestLink(testUrl);
                setDialogOpen(true);
                showNotification('Test CSI creato con successo', 'success');
            } else {
                throw new Error('Risposta del server non valida');
            }
        } catch (error) {
            console.error('Error details:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    baseURL: error.config?.baseURL,
                    headers: error.config?.headers
                }
            });
            showNotification(
                'Errore nella creazione del test: ' + 
                (error.response?.data?.message || error.message),
                'error'
            );
        } finally {
            setLoading(false);
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
                    width: '250px',
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
                    loading={loading}
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