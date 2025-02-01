import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
    const { user, loading, isAuthenticated } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div>Loading...</div>;
    }

    // Se non autenticato, reindirizza al login
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Verifica il ruolo
    if (user.role !== 'admin') {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default PrivateRoute;