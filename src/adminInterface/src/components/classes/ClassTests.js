// src/components/classes/ClassTests.js
import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Breadcrumbs,
    Link,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ClassTests = () => {
    const { classId } = useParams();
    const navigate = useNavigate();

    return (
        <Box p={3}>
            <Breadcrumbs sx={{ mb: 3 }}>
                <Link 
                    component="button"
                    variant="body1"
                    onClick={() => navigate('/classes')}
                    sx={{ cursor: 'pointer' }}
                >
                    Classi
                </Link>
                <Link
                    component="button"
                    variant="body1"
                    onClick={() => navigate(`/classes/${classId}`)}
                    sx={{ cursor: 'pointer' }}
                >
                    Dettagli Classe
                </Link>
                <Typography color="text.primary">Test</Typography>
            </Breadcrumbs>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" color="primary">
                    Gestione Test
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(`/admin/classes/${classId}`)}
                >
                    Torna ai dettagli
                </Button>
            </Box>

            <Paper sx={{ p: 3, mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Funzionalità in sviluppo
                </Typography>
                <Typography>
                    La gestione dei test sarà implementata nelle prossime versioni.
                </Typography>
            </Paper>
        </Box>
    );
};

export default ClassTests;