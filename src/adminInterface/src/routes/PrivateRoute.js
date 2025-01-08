// src/routes/PrivateRoute.js:

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div>Loading...</div>; // Potresti usare un componente Loader più sofisticato
    }

    if (!user) {
        // Redirect to login page with the return url
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Se l'utente non è admin, reindirizza
    if (user.role !== 'admin') {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default PrivateRoute;