import React, { createContext, useContext, useState } from 'react';

// Crea il contesto
const ImpostazioniContext = createContext();

/**
 * Provider per gestire lo stato globale del modal impostazioni
 */
export const ImpostazioniProvider = ({ children, setMenuPosition }) => {
  const [isImpostazioniOpen, setIsImpostazioniOpen] = useState(false);
  
  // Funzioni per aprire e chiudere il modal
  const openImpostazioni = () => setIsImpostazioniOpen(true);
  const closeImpostazioni = () => setIsImpostazioniOpen(false);
  
  // Valori esposti dal contesto
  const value = {
    isImpostazioniOpen,
    openImpostazioni,
    closeImpostazioni,
    setMenuPosition
  };
  
  return (
    <ImpostazioniContext.Provider value={value}>
      {children}
    </ImpostazioniContext.Provider>
  );
};

/**
 * Hook per utilizzare il contesto delle impostazioni
 */
export const useImpostazioni = () => {
  const context = useContext(ImpostazioniContext);
  if (!context) {
    throw new Error('useImpostazioni deve essere utilizzato all\'interno di ImpostazioniProvider');
  }
  return context;
};

export default ImpostazioniContext;