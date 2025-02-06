// src/context/TestContext/TestingProvider.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import { TestProvider } from '../TestContext';
import { CSITestProvider } from './CSITestContext';

// Router interno che renderizza i provider solo quando servono
const TestingRouter = ({ children }) => {
    const location = useLocation();
    
    // Rendi il provider CSI solo nelle route che lo necessitano
    // Aggiungiamo il path per la gestione dei test degli studenti
    if (location.pathname.includes('/test/csi') || 
        location.pathname.includes('/admin/engines/csi') ||
        location.pathname.includes('/admin/students') && location.pathname.includes('/tests')) {
            console.log('Rendering CSITestProvider');

            return <CSITestProvider>{children}</CSITestProvider>;
    }
    return children;
};

export const TestingProvider = ({ children }) => {
    return (
        <TestProvider>
            <CSITestProvider>{children}</CSITestProvider>
        </TestProvider>
    );
};

// Esporta sia come default che come named export
export default TestingProvider;