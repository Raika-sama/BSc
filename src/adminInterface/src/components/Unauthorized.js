// src/components/Unauthorized.js
import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <Container>
            <Box sx={{ mt: 8, textAlign: 'center' }}>
                <Typography variant="h4" gutterBottom>
                    Accesso non autorizzato
                </Typography>
                <Typography variant="body1" gutterBottom>
                    Non hai i permessi necessari per accedere a questa sezione.
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/login')}
                    sx={{ mt: 2 }}
                >
                    Torna al Login
                </Button>
            </Box>
        </Container>
    );
};

export default Unauthorized;