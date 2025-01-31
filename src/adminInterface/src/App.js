// src/App.js
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SchoolProvider } from './context/SchoolContext';
import { UserProvider } from './context/UserContext';
import { NotificationProvider } from './context/NotificationContext';
import { ClassProvider } from './context/ClassContext';
import { StudentProvider } from './context/StudentContext';
import setupAxiosInterceptors from './services/axiosConfig';
import MainLayout from './components/layout/MainLayout';
import Login from './components/home/Login';
import Unauthorized from './components/Unauthorized';
import PrivateRoute from './routes/PrivateRoute';
import { adminRoutes } from './routes/routes';
import PublicCSI from './components/engines/CSI/publicCSI';
import { CircularProgress, Box } from '@mui/material';
import HomePage from './components/home/HomePage';

import './styles.css';

// Loading fallback component
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

setupAxiosInterceptors();

function App() {
    return (
        <Router>
            <AuthProvider>
                <NotificationProvider>
                    <UserProvider>
                        <SchoolProvider>
                            <ClassProvider>
                                <StudentProvider>
                                    <Suspense fallback={<LoadingFallback />}>
                                        <Routes>
                                            {/* Public routes */}
                                            <Route path="/" element={<HomePage />} /> {/* Nuova root route */}
                                            {/* Public routes */}
                                            <Route path="/" element={<HomePage />} /> {/* Nuova root route */}
                                            <Route path="/unauthorized" element={<Unauthorized />} />
                                            <Route path="/test/csi/:token" element={<PublicCSI />} />
                                            <Route path="/unauthorized" element={<Unauthorized />} />
                                            <Route path="/test/csi/:token" element={<PublicCSI />} />
                                            {/* Protected admin routes */}
                                            <Route
                                                path="/admin/*"
                                                element={
                                                    <PrivateRoute>
                                                        <MainLayout>
                                                            <Suspense fallback={<LoadingFallback />}>
                                                                <Routes>
                                                                    {adminRoutes.map((route) => 
                                                                        route.element && (
                                                                            <Route
                                                                                key={route.path}
                                                                                path={route.path}
                                                                                element={
                                                                                    <Suspense fallback={<LoadingFallback />}>
                                                                                        <route.element />
                                                                                    </Suspense>
                                                                                }
                                                                            />
                                                                        )
                                                                    )}
                                                                </Routes>
                                                            </Suspense>
                                                        </MainLayout>
                                                    </PrivateRoute>
                                                }
                                            />

                                            {/* Catch all redirect */}
                                            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                                        </Routes>
                                    </Suspense>
                                </StudentProvider>
                            </ClassProvider>
                        </SchoolProvider>
                    </UserProvider>
                </NotificationProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;