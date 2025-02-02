import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

// Definisci LoadingFallback localmente
const LoadingFallback = () => (
    <Box 
        sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh' 
        }}
    >
        <CircularProgress />
    </Box>
);

const PrivateRoute = ({ children }) => {
    const { user, loading, isAuthenticated } = useAuth();
    const location = useLocation();

    console.log('🛡️ PrivateRoute:', {
        isAuthenticated,
        hasUser: !!user,
        loading,
        currentPath: location.pathname
    });

    // Se stiamo caricando, mostra il loader
    if (loading) {
        return <LoadingFallback />;
    }

    // Se non siamo autenticati, redirect al login
    if (!isAuthenticated || !user) {
        // Previeni redirect loop controllando se siamo già sulla pagina di login
        if (location.pathname !== '/login') {
            return <Navigate to="/login" state={{ from: location }} replace />;
        }
        return null;
    }

    if (user.role !== 'admin') {
        console.log('⛔ PrivateRoute: Utente non admin');
        return <Navigate to="/unauthorized" replace />;
    }

    console.log('✅ PrivateRoute: Accesso consentito');
    return children;
};

export default PrivateRoute;