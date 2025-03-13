import { createContext, useContext, useReducer, useState, useEffect, useCallback, useRef } from 'react';
import studentService from '../utils/studentService';

// Creazione del context
const TestContext = createContext();

// Stato iniziale
const initialState = {
  assignedTests: [],
  completedTests: [],
  selectedTest: null,
  loading: {
    assigned: false,
    completed: false,
    test: false
  },
  error: null
};

// Reducer per gestire le azioni
const testReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { 
        ...state, 
        loading: { 
          ...state.loading, 
          [action.payload.type]: action.payload.status 
        } 
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ASSIGNED_TESTS':
      return { ...state, assignedTests: action.payload, loading: { ...state.loading, assigned: false } };
    case 'SET_COMPLETED_TESTS':
      return { ...state, completedTests: action.payload, loading: { ...state.loading, completed: false } };
    case 'SET_SELECTED_TEST':
      return { ...state, selectedTest: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

// Provider component
export const TestProvider = ({ children }) => {
  const [state, dispatch] = useReducer(testReducer, initialState);
  // Utilizziamo un ref per tenere traccia della funzione di selezione senza causare loop
  const stateRef = useRef(state);
  
  // Aggiorniamo il ref quando lo stato cambia
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Ottiene i test assegnati
  const getAssignedTests = useCallback(async () => {
    // Verifichiamo se stiamo già caricando per evitare chiamate duplicate
    if (stateRef.current.loading.assigned) return [];
    
    dispatch({ type: 'SET_LOADING', payload: { type: 'assigned', status: true } });
    try {
      console.log('Recupero test assegnati...');
      const response = await studentService.getAssignedTests();
      // Trasforma i dati se necessario e li ordina per data di assegnazione
      const tests = response.data || [];
      const sortedTests = [...tests].sort((a, b) => {
        const dateA = a.assignedAt ? new Date(a.assignedAt) : new Date(0);
        const dateB = b.assignedAt ? new Date(b.assignedAt) : new Date(0);
        return dateB - dateA;
      });
      
      dispatch({ type: 'SET_ASSIGNED_TESTS', payload: sortedTests });
      
      // Se non c'è un test selezionato ma ci sono test disponibili, seleziona il primo
      const currentState = stateRef.current;
      if (!currentState.selectedTest && sortedTests.length > 0) {
        dispatch({ type: 'SET_SELECTED_TEST', payload: sortedTests[0] });
      }
      
      return sortedTests;
    } catch (error) {
      console.error('Errore nel recupero dei test assegnati:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.message || 'Errore nel caricamento dei test assegnati' 
      });
      return [];
    }
  }, []); // Rimuoviamo state.selectedTest dalle dipendenze

  // Seleziona un test specifico
  const selectTest = useCallback((test) => {
    dispatch({ type: 'SET_SELECTED_TEST', payload: test });
  }, []);

  // Inizia un test assegnato
  const startTest = useCallback(async (testId) => {
    dispatch({ type: 'SET_LOADING', payload: { type: 'test', status: true } });
    try {
      // Implementare la logica per iniziare un test assegnato
      // In futuro, questa funzione chiamerà l'API per iniziare il test
      
      // Per ora, simuliamo solo un ritardo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      dispatch({ type: 'SET_LOADING', payload: { type: 'test', status: false } });
      return { success: true, message: 'Test avviato con successo' };
    } catch (error) {
      console.error('Errore nell\'avvio del test:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.message || 'Errore nell\'avvio del test' 
      });
      dispatch({ type: 'SET_LOADING', payload: { type: 'test', status: false } });
      return { success: false, error: error.message || 'Errore nell\'avvio del test' };
    }
  }, []);

  // Formatta una data nel formato italiano
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.warn('Error formatting date:', e);
      return 'Data non valida';
    }
  }, []);

  // Cancella un errore
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Carica i test assegnati all'avvio solo una volta
  useEffect(() => {
    getAssignedTests();
    // Abbiamo rimosso getAssignedTests dalle dipendenze per evitare chiamate multiple
  }, []);

  const value = {
    ...state,
    getAssignedTests,
    selectTest,
    startTest,
    formatDate,
    clearError
  };

  return (
    <TestContext.Provider value={value}>
      {children}
    </TestContext.Provider>
  );
};

// Hook personalizzato per utilizzare il context
export const useTest = () => {
  const context = useContext(TestContext);
  if (!context) {
    throw new Error('useTest deve essere utilizzato all\'interno di un TestProvider');
  }
  return context;
};

export default TestContext;