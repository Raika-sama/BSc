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
import { TestingProvider } from './context/TestContext/TestingProvider';


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
            <NotificationProvider>
                <AuthProvider>
                    <Suspense fallback={<LoadingFallback />}>
                        <Routes>
                            {/* Public routes che non richiedono autenticazione */}
                            <Route path="/" element={<HomePage />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/unauthorized" element={<Unauthorized />} />
                            <Route path="/test/csi/:token" element={<PublicCSI />} />

                            {/* Protected admin routes con tutti i provider necessari */}
                            <Route
                                path="/admin/*"
                                element={
                                    <PrivateRoute>
                                        <UserProvider>
                                            <SchoolProvider>
                                                <ClassProvider>
                                                    <StudentProvider>
                                                        <TestingProvider>
                                                            <MainLayout>
                                                                <Routes>
                                                                    {adminRoutes.map((route) => 
                                                                        route.element && (
                                                                            <Route
                                                                                key={route.path}
                                                                                path={route.path}
                                                                                element={<route.element />}
                                                                            />
                                                                        )
                                                                    )}
                                                                </Routes>
                                                            </MainLayout>
                                                        </TestingProvider>
                                                    </StudentProvider>
                                                </ClassProvider>
                                            </SchoolProvider>
                                        </UserProvider>
                                    </PrivateRoute>
                                }
                            />

                            {/* Redirect solo se autenticati */}
                            <Route 
                                path="*" 
                                element={
                                    <PrivateRoute>
                                        <Navigate to="/admin/dashboard" replace />
                                    </PrivateRoute>
                                } 
                            />
                        </Routes>
                    </Suspense>
                </AuthProvider>
            </NotificationProvider>
        </Router>
    );
}

export default App;