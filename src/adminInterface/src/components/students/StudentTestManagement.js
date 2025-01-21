// src/components/students/StudentTestManagement.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Breadcrumbs,
    Link,
    Grid,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    Chip
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import TestLinkDialog from './TestLinkDialog';
import TestDetailsView from './TestDetailsView';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import QuizIcon from '@mui/icons-material/Quiz';
import { axiosInstance } from '../../services/axiosConfig';
const StudentTestManagement = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const [testLink, setTestLink] = useState('');
    const { showNotification } = useNotification();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedTest, setSelectedTest] = useState(null);
    const [completedTests, setCompletedTests] = useState([]);

    // Carica i test completati
    useEffect(() => {
        const fetchCompletedTests = async () => {
            try {
                // Usa l'endpoint corretto del modulo CSI
                const response = await axiosInstance.get(`/tests/csi/results/student/${studentId}`);
                if (response.data && response.data.data) {
                    setCompletedTests(response.data.data);
                }
            } catch (error) {
                console.error('Errore nel caricamento dei test:', error);
                showNotification(
                    'Errore nel caricamento dei test completati: ' + 
                    (error.response?.data?.message || error.message),
                    'error'
                );
            }
        };
    
        if (studentId) {
            fetchCompletedTests();
        }
    }, [studentId, showNotification]);

    const handleCreateTest = async (testType) => {
        try {
            if (!studentId) {
                showNotification('ID studente mancante', 'error');
                return;
            }
    
            const response = await axiosInstance.post('/tests/csi/generate-link', {
                studentId: studentId,
                testType,
            });
    
            if (response.data && response.data.data?.token) {
                const testUrl = `${window.location.origin}/test/csi/${response.data.data.token}`;
                setTestLink(testUrl);
                setDialogOpen(true);
                showNotification('Link del test generato con successo', 'success');
            } else {
                throw new Error('Token non ricevuto dal server');
            }
        } catch (error) {
            console.error('Errore nella generazione del link:', error);
            showNotification(
                `Errore nella generazione del link del test: ${
                    error.response?.data?.message || error.message
                }`,
                'error'
            );
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Box p={2}>
            {/* Header compatto */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                    <Breadcrumbs sx={{ mb: 1 }}>
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
                    size="small"
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/students')}
                >
                    Torna alla lista
                </Button>
            </Box>

            {/* Pulsanti test disponibili */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <Typography variant="subtitle1">
                            Test Disponibili
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Box display="flex" gap={2}>
                            <Button
                                size="small"
                                variant="contained"
                                startIcon={<QuizIcon />}
                                onClick={() => handleCreateTest('CSI')}
                            >
                                Somministra CSI
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Layout principale */}
            <Grid container spacing={2}>
                {/* Lista test completati */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ height: 'calc(100vh - 250px)', overflow: 'auto' }}>
                        <List sx={{ p: 0 }}>
                            <ListItem sx={{ backgroundColor: 'grey.100' }}>
                                <ListItemText 
                                    primary={<Typography variant="subtitle2">Test Completati</Typography>}
                                />
                            </ListItem>
                            <Divider />
                            {completedTests.length > 0 ? (
                                completedTests.map((test) => (
                                    <ListItemButton
                                        key={test._id}
                                        selected={selectedTest?._id === test._id}
                                        onClick={() => setSelectedTest(test)}
                                    >
                                        <ListItemText
                                            primary={
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="body2">Test {test.tipo}</Typography>
                                                    <Chip 
                                                        label="Completato"
                                                        size="small"
                                                        color="success"
                                                        sx={{ height: 20 }}
                                                    />
                                                </Box>
                                            }
                                            secondary={formatDate(test.dataCompletamento)}
                                        />
                                    </ListItemButton>
                                ))
                            ) : (
                                <ListItem>
                                    <ListItemText 
                                        secondary="Nessun test completato"
                                        sx={{ textAlign: 'center' }}
                                    />
                                </ListItem>
                            )}
                        </List>
                    </Paper>
                </Grid>

                {/* Area dettagli test */}
                <Grid item xs={12} md={8}>
                    <TestDetailsView 
                        test={selectedTest}
                        formatDate={formatDate}
                    />
                </Grid>
            </Grid>

            <TestLinkDialog 
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                testLink={testLink}
            />
        </Box>
    );
};

export default StudentTestManagement;