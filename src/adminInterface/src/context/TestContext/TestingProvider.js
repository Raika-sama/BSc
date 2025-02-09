// In TestingProvider.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import { TestProvider } from '../TestContext';
import { CSITestProvider } from './CSITestContext';

const TestingRouter = ({ children }) => {
    const location = useLocation();
    
    // Semplifichiamo la logica per includere esplicitamente il percorso pubblico
    if (location.pathname.includes('/test/csi') || 
        location.pathname.includes('/admin/engines/csi') ||
        location.pathname.includes('/admin/students/')) {
        console.log('CSITestProvider active for:', location.pathname);
        return <CSITestProvider>{children}</CSITestProvider>;
    }
    return children;
};

export const TestingProvider = ({ children }) => {
    return (
        <TestProvider>
            <TestingRouter>{children}</TestingRouter>
        </TestProvider>
    );
};

export default TestingProvider;