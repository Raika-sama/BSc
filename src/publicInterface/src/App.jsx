import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import PrivateRoute from './components/PrivateRoute';
import { ImpostazioniProvider, useImpostazioni } from './hooks/ImpostazioniContext';
import ImpostazioniModal from './components/ImpostazioniModal';

// Componente separato che gestisce il modal globale delle impostazioni
// Importante: definito FUORI dal componente App
const ImpostazioniModalContainer = ({ setMenuPosition }) => {
  const { isImpostazioniOpen, closeImpostazioni } = useImpostazioni();
  
  return (
    <ImpostazioniModal 
      isOpen={isImpostazioniOpen} 
      onClose={closeImpostazioni}
      setMenuPosition={setMenuPosition} 
    />
  );
};

function App() {
  const [menuPosition, setMenuPosition] = useState(
    localStorage.getItem('menuPosition') || 'top'
  );
  
  const updateMenuPosition = useCallback((position) => {
    setMenuPosition(position);
    localStorage.setItem('menuPosition', position);
  }, []);
  
  return (
    // AuthProvider è stato spostato nel file index.js
    <ImpostazioniProvider setMenuPosition={updateMenuPosition}>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout menuPosition={menuPosition} />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<div>Dashboard Page</div>} />
            <Route path="/analisi" element={<div>Analisi Page</div>} />
            <Route path="/test-assegnati" element={<div>Test Assegnati Page</div>} />
            <Route path="/profilo" element={<ProfilePage />} />
            <Route path="/supporto" element={<div>Supporto Page</div>} />
          </Route>
        </Route>
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Modal delle impostazioni globale */}
      <ImpostazioniModalContainer setMenuPosition={updateMenuPosition} />
    </ImpostazioniProvider>
  );
}

export default App;