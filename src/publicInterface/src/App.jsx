import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import ImpostazioniPage from './pages/ImpostazioniPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider } from './hooks/useAuth';
import PrivateRoute from './components/PrivateRoute';

function App() {
  const [menuPosition, setMenuPosition] = useState(
    localStorage.getItem('menuPosition') || 'top'
  );
  
  const updateMenuPosition = useCallback((position) => {
    setMenuPosition(position);
    localStorage.setItem('menuPosition', position);
  }, []);
  
  return (
    <AuthProvider>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout menuPosition={menuPosition} />}>
            <Route path="/" element={<HomePage setMenuPosition={updateMenuPosition} />} />
            <Route path="/settings" element={<ImpostazioniPage setMenuPosition={updateMenuPosition} />} />
            <Route path="/impostazioni" element={<ImpostazioniPage setMenuPosition={updateMenuPosition} />} />
            <Route path="/dashboard" element={<div>Dashboard Page</div>} />
            <Route path="/analisi" element={<div>Analisi Page</div>} />
            <Route path="/test-assegnati" element={<div>Test Assegnati Page</div>} />
            <Route path="/profilo" element={<div>Profilo Page</div>} />
            <Route path="/supporto" element={<div>Supporto Page</div>} />
          </Route>
        </Route>
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;