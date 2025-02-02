import React from 'react';
import { Container, Typography, Button, Box, Alert } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    ErrorOutline as ErrorIcon,
    LockOutlined as LockIcon,
    AccountCircleOutlined as AccountIcon 
} from '@mui/icons-material';

const Unauthorized = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { reason, message } = location.state || {};

    // Determina il contenuto in base al motivo del redirect
    const getContent = () => {
        switch (reason) {
            case 'account_status':
                return {
                    icon: <AccountIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
                    title: 'Account Non Attivo',
                    message: message || 'Il tuo account non è attualmente attivo.',
                    severity: 'warning'
                };
            case 'insufficient_permissions':
                return {
                    icon: <LockIcon sx={{ fontSize: 60, color: 'error.main' }} />,
                    title: 'Accesso Negato',
                    message: message || 'Non hai i permessi necessari per accedere a questa sezione.',
                    severity: 'error'
                };
            default:
                return {
                    icon: <ErrorIcon sx={{ fontSize: 60, color: 'error.main' }} />,
                    title: 'Accesso Non Autorizzato',
                    message: message || 'Non hai accesso a questa sezione.',
                    severity: 'error'
                };
        }
    };

    const content = getContent();

    return (
        <Container maxWidth="sm">
            <Box sx={{ 
                mt: 8, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                textAlign: 'center'
            }}>
                {content.icon}
                
                <Typography 
                    variant="h4" 
                    component="h1" 
                    gutterBottom 
                    sx={{ mt: 2 }}
                >
                    {content.title}
                </Typography>

                <Alert 
                    severity={content.severity}
                    sx={{ 
                        mt: 2, 
                        mb: 4,
                        width: '100%'
                    }}
                >
                    {content.message}
                </Alert>

                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={() => navigate(-1)}
                        sx={{ minWidth: 120 }}
                    >
                        Indietro
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/login')}
                        sx={{ minWidth: 120 }}
                    >
                        Login
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};

export default Unauthorized;