// src/context/TestContext/TestingProvider.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import { TestProvider } from '../TestContext';
import { CSITestProvider } from './CSITestContext';

// Router interno che renderizza i provider solo quando servono
const TestingRouter = ({ children }) => {
    const location = useLocation();
    
    // Rendi il provider CSI solo nelle route che lo necessitano
    if (location.pathname.includes('/test/csi') || 
        location.pathname.includes('/admin/engines/csi')) {
        return <CSITestProvider>{children}</CSITestProvider>;
    }

    return children;
};

export const TestingProvider = ({ children }) => {
    return (
        <TestProvider>
            <TestingRouter>
                {children}
            </TestingRouter>
        </TestProvider>
    );
};

// Esporta sia come default che come named export
export default TestingProvider;