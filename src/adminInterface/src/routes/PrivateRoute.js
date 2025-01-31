// src/routes/PrivateRoute.js
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();
    const [isVerified, setIsVerified] = useState(false);
    const [verifying, setVerifying] = useState(true);

    useEffect(() => {
        const verifyAuth = async () => {
            if (user) {
                const isValid = await authService.verifyToken();
                setIsVerified(isValid);
            }
            setVerifying(false);
        };

        verifyAuth();
    }, [user]);

    if (loading || verifying) {
        return <div>Loading...</div>;
    }

    if (!user || !isVerified) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (user.role !== 'admin') {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default PrivateRoute;