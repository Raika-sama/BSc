// src/components/students/StudentTestManagement.js
import React, { useState } from 'react'; // Aggiunto useState
import {
    Box,
    Typography,
    Paper,
    Button,
    Breadcrumbs,
    Link,
    Grid,
    Divider
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext'; // Aggiunto useNotification
import TestLinkDialog from './TestLinkDialog'; // Aggiunto TestLinkDialog
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import QuizIcon from '@mui/icons-material/Quiz';
import { axiosInstance } from '../../services/axiosConfig'; // Aggiungi questo import

const StudentTestManagement = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const [testLink, setTestLink] = useState('');
    const { showNotification } = useNotification();
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleCreateTest = async (testType) => {
        try {
            // Verifica che studentId sia presente
            if (!studentId) {
                showNotification('ID studente mancante', 'error');
                return;
            }
    
            console.log('Iniziando la creazione del test:', {
                studentId,
                testType,
                targetGrade
            });
    
            const response = await axiosInstance.post('/tests/csi/generate-link', {
                studentId: studentId,  // Esplicito
                testType,
                targetGrade,  // Aggiungi targetGrade
                stato: 'published'  // Aggiungi stato
            });
    
            console.log('Risposta dal server:', response.data);
    
            if (response.data && response.data.data?.token) {
                const testUrl = `${window.location.origin}/test/csi/${response.data.data.token}`;
                setTestLink(testUrl);
                setDialogOpen(true);
                showNotification('Link del test generato con successo', 'success');
            } else {
                throw new Error('Token non ricevuto dal server');
            }
        } catch (error) {
            console.error('Dettagli completi dell\'errore:', {
                message: error.message,
                code: error.code,
                response: error.response?.data,
                status: error.response?.status
            });
    
            showNotification(
                `Errore nella generazione del link del test: ${
                    error.response?.data?.message || error.message
                }`,
                'error'
            );
        }
    };

    return (
        <Box p={3}>
            {/* Breadcrumb Navigation */}
            <Breadcrumbs sx={{ mb: 3 }}>
                <Link 
                    component="button"
                    variant="body1"
                    onClick={() => navigate('/students')}
                    sx={{ cursor: 'pointer' }}
                >
                    Studenti
                </Link>
                <Typography color="text.primary">Gestione Test</Typography>
            </Breadcrumbs>

            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" color="primary">
                    Gestione Test Studente
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/students')}
                >
                    Torna alla lista
                </Button>
            </Box>

            {/* Test disponibili */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Test Disponibili
                </Typography>
                <Divider sx={{ mb: 2 }}/>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Paper elevation={2} sx={{ p: 2 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="h6">
                                        Test CSI
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Test Stili Cognitivi di Apprendimento
                                    </Typography>
                                </Box>
                                <Button
                                    variant="contained"
                                    startIcon={<QuizIcon />}
                                    onClick={() => handleCreateTest('CSI')}
                                >
                                    Somministra
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Paper>
            <TestLinkDialog 
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                testLink={testLink}
            />
            {/* Storico test */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Storico Test
                </Typography>
                <Divider sx={{ mb: 2 }}/>
                <Typography variant="body1" color="text.secondary" align="center">
                    Nessun test completato
                </Typography>
            </Paper>
        </Box>
        
    );
};

export default StudentTestManagement;
