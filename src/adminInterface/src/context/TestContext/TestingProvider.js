// TestingProvider.jsx migliorato
import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { TestProvider } from '../TestContext';
import { CSITestProvider } from './CSITestContext';

const TestingRouter = ({ children }) => {
    const location = useLocation();
    
    // Utilizziamo useMemo per evitare ricreazioni inutili
    const needsCSIProvider = useMemo(() => {
        return location.pathname.includes('/test/csi') || 
               location.pathname.includes('/admin/engines/csi') ||
               location.pathname.includes('/admin/students/');
    }, [location.pathname]);
    
    // Utilizziamo log solo in modalità di sviluppo e solo quando cambia realmente
    React.useEffect(() => {
        if (needsCSIProvider) {
            console.log('CSITestProvider active for:', location.pathname);
        }
    }, [needsCSIProvider, location.pathname]);
    
    // Rendiamo una volta sola
    if (needsCSIProvider) {
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