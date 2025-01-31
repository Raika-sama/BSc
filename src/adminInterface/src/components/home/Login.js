import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Login = ({ onSuccessfulLogin, isModal = false }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect se già autenticato
    useEffect(() => {
        if (isAuthenticated) {
            const from = location.state?.from?.pathname || '/admin/dashboard';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, location]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const success = await login({
                email: email.trim(),
                password: password
            });

            if (success) {
                setAttempts(0); // Reset tentativi dopo login riuscito
                
                if (onSuccessfulLogin) {
                    onSuccessfulLogin();
                } else {
                    const from = location.state?.from?.pathname || '/admin/dashboard';
                    navigate(from, { replace: true });
                }
            } else {
                handleFailedAttempt();
            }
        } catch (error) {
            handleFailedAttempt();
            
            // Gestione specifica degli errori
            if (error.response?.status === 429) {
                setError('Troppi tentativi. Account temporaneamente bloccato.');
            } else if (error.response?.status === 401) {
                setError('Email o password non validi.');
            } else {
                setError(error.response?.data?.error?.message || 'Errore durante il login');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleFailedAttempt = () => {
        setAttempts(prev => prev + 1);
        setPassword(''); // Pulisci la password dopo un tentativo fallito
    };

    const getWarningMessage = () => {
        if (attempts >= 3 && attempts < 5) {
            return "Attenzione: troppi tentativi falliti potrebbero bloccare l'account";
        } else if (attempts >= 5) {
            return "Attenzione: il prossimo tentativo fallito bloccherà l'account";
        }
        return null;
    };

    return (
        <Box sx={{ p: isModal ? 4 : 0 }}>
            <Box sx={{
                width: '100%',
                backgroundColor: 'background.paper',
                borderRadius: 2,
                boxShadow: isModal ? 0 : 3,
                p: 4,
            }}>
                <Typography 
                    variant="h4" 
                    component="h1" 
                    gutterBottom 
                    align="center"
                    sx={{ mb: 4 }}
                >
                    Admin Login
                </Typography>

                {getWarningMessage() && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        {getWarningMessage()}
                    </Alert>
                )}

                <form onSubmit={handleLogin} style={{ width: '100%' }}>
                    <TextField
                        label="Email"
                        type="email"
                        fullWidth
                        margin="normal"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        autoComplete="email"
                        error={!!error}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        label="Password"
                        type="password"
                        fullWidth
                        margin="normal"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        autoComplete="current-password"
                        error={!!error}
                        sx={{ mb: 2 }}
                    />

                    {error && (
                        <Alert 
                            severity="error" 
                            sx={{ mb: 2 }}
                        >
                            {error}
                        </Alert>
                    )}

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={isLoading || !email || !password}
                        sx={{ 
                            mt: 2,
                            height: 48,
                            position: 'relative'
                        }}
                    >
                        {isLoading ? (
                            <CircularProgress 
                                size={24}
                                sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    marginTop: '-12px',
                                    marginLeft: '-12px',
                                }}
                            />
                        ) : (
                            'Login'
                        )}
                    </Button>
                </form>
            </Box>
        </Box>
    );
};

export default Login;