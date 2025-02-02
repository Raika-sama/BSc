import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';

const Login = ({ onSuccessfulLogin, isModal = false }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const { login, isAuthenticated, loading, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Se l'utente è già autenticato, reindirizza
        if (isAuthenticated && user && !loading) {
            const from = location.state?.from?.pathname || '/admin/dashboard';
            console.log('🔄 Reindirizzamento automatico a:', from);
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, user, loading, navigate, location]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        console.log('⌛ Iniziando processo di login...');

        try {
            const success = await login({
                email: email.trim(),
                password: password
            });
            
            console.log('✅ Risultato login:', success);
            
            if (!success) {
                throw new Error('Login fallito');
            }

        } catch (error) {
            console.error('❌ Errore durante il login:', error);
            handleFailedAttempt();
            
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
        setPassword('');
    };

    const getWarningMessage = () => {
        if (attempts >= 3 && attempts < 5) {
            return "Attenzione: troppi tentativi falliti potrebbero bloccare l'account";
        } else if (attempts >= 5) {
            return "Attenzione: il prossimo tentativo fallito bloccherà l'account";
        }
        return null;
    };

    // Non mostrare nulla durante il caricamento iniziale
    if (loading) {
        return null;
    }

    // Se l'utente è già autenticato e non siamo in modalità modale, reindirizza
    if (isAuthenticated && user && !isModal) {
        return <Navigate to="/admin/dashboard" replace />;
    }

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