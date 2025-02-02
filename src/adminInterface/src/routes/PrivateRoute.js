import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

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
    const { user, loading, isAuthenticated, userStatus } = useAuth();
    const location = useLocation();

    console.log('🛡️ PrivateRoute Check:', {
        isAuthenticated,
        hasUser: !!user,
        userStatus,
        loading,
        currentPath: location.pathname
    });

    // Stato di caricamento
    if (loading) {
        return <LoadingFallback />;
    }

    // Verifica autenticazione
    if (!isAuthenticated || !user) {
        console.log('🚫 PrivateRoute: Utente non autenticato, reindirizzamento a login');
        return <Navigate 
            to="/login" 
            state={{ from: location, message: 'Effettua il login per continuare' }} 
            replace 
        />;
    }

    // Verifica stato utente
    if (userStatus !== 'active') {
        console.log('⚠️ PrivateRoute: Account utente non attivo');
        return <Navigate 
            to="/unauthorized" 
            state={{ 
                reason: 'account_status',
                message: 'Il tuo account non è attivo. Contatta l\'amministratore.' 
            }} 
            replace 
        />;
    }

    // Verifica ruolo admin
    if (user.role !== 'admin') {
        console.log('⛔ PrivateRoute: Utente non admin');
        return <Navigate 
            to="/unauthorized" 
            state={{ 
                reason: 'insufficient_permissions',
                message: 'Non hai i permessi necessari per accedere a questa sezione.' 
            }} 
            replace 
        />;
    }

    // Se tutte le verifiche passano, renderizza il contenuto
    console.log('✅ PrivateRoute: Accesso consentito');
    return children;
};

export default PrivateRoute;