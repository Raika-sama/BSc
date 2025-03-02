import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import ImpostazioniPage from './pages/ImpostazioniPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider } from './hooks/useAuth';
import PrivateRoute from './components/PrivateRoute';

function App() {
  const [menuPosition, setMenuPosition] = useState('top'); // 'top' o 'bottom'
  
  return (
    <AuthProvider>
      <Routes>
        {/* Rotta pubblica per il login */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Rotte protette che richiedono autenticazione */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout menuPosition={menuPosition} />}>
            <Route path="/" element={<HomePage setMenuPosition={setMenuPosition} />} />
            <Route path="/impostazioni" element={<ImpostazioniPage setMenuPosition={setMenuPosition} />} />
            {/* Altre rotte protette qui */}
          </Route>
        </Route>
        
        {/* Reindirizza qualsiasi altra rotta a login o home page */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;