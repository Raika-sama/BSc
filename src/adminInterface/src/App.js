// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SchoolProvider } from './context/SchoolContext';
import { UserProvider } from './context/UserContext';
import { NotificationProvider } from './context/NotificationContext';
import setupAxiosInterceptors from './services/axiosConfig';
import MainLayout from './components/layout/MainLayout';
import Login from './components/Login';
import Unauthorized from './components/Unauthorized';
import PrivateRoute from './routes/PrivateRoute';
import { adminRoutes } from './routes/routes';

setupAxiosInterceptors();

function App() {
    return (
        <Router>
            <AuthProvider>
                <NotificationProvider>
                    <SchoolProvider>
                        <UserProvider>
                            <Routes>
                                <Route path="/login" element={<Login />} />
                                <Route path="/unauthorized" element={<Unauthorized />} />
                                <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                                <Route
                                    path="/admin/*"
                                    element={
                                        <PrivateRoute>
                                            <MainLayout>
                                                <Routes>
                                                    {adminRoutes.map((route) => (
                                                        route.element && (
                                                            <Route
                                                                key={route.path}
                                                                path={route.path}
                                                                element={<route.element />}
                                                            />
                                                        )
                                                    ))}
                                                </Routes>
                                            </MainLayout>
                                        </PrivateRoute>
                                    }
                                />
                            </Routes>
                        </UserProvider>
                    </SchoolProvider>
                </NotificationProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;