import { createContext, useContext, useReducer, useState, useEffect, useCallback, useRef } from 'react';
import studentService from '../utils/studentService';

// Creazione del context
const TestContext = createContext();

// Stato iniziale
const initialState = {
  assignedTests: [],
  completedTests: [],
  selectedTest: null,
  activeTest: {
    token: null,
    testData: null,
    testType: null,
    questions: [],
    currentQuestion: 0,
    answers: {},
    timeSpent: 0,
    startTime: null,
    questionStartTime: null
  },
  loading: {
    assigned: false,
    completed: false,
    test: false,
    submitting: false
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
    case 'SET_ACTIVE_TEST':
      return { 
        ...state, 
        activeTest: {
          ...state.activeTest,
          ...action.payload
        },
        loading: {
          ...state.loading,
          test: false
        }
      };
    case 'SET_CURRENT_QUESTION':
      return {
        ...state,
        activeTest: {
          ...state.activeTest,
          currentQuestion: action.payload,
          questionStartTime: Date.now()
        }
      };
    case 'ADD_ANSWER':
      return {
        ...state,
        activeTest: {
          ...state.activeTest,
          answers: {
            ...state.activeTest.answers,
            [state.activeTest.currentQuestion]: action.payload
          }
        }
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'RESET_ACTIVE_TEST':
      return {
        ...state,
        activeTest: initialState.activeTest
      };
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
  }, []);

  // Seleziona un test specifico
  const selectTest = useCallback((test) => {
    dispatch({ type: 'SET_SELECTED_TEST', payload: test });
  }, []);
  
  // Verifica e carica i dati del test
  const verifyAndLoadTestData = useCallback(async (token, testType) => {
    try {
      // Debug #1 - Inizio verifica
      console.log('[DEBUG] Inizio verifyAndLoadTestData:', { 
        token, 
        testType,
        activeTest: state.activeTest,
        timestamp: new Date().toISOString()
      });

      // Verifica che token e testType siano validi
      if (!token || token === "undefined" || !testType) {
        console.error('[DEBUG] Token o tipo test non valido:', { 
          token, 
          testType,
          isTokenUndefined: token === "undefined",
          stack: new Error().stack 
        });
        throw new Error('Token non valido o tipo test mancante');
      }
      
      dispatch({ type: 'SET_LOADING', payload: { type: 'test', status: true } });
      
      // Debug #2 - Prima della chiamata API
      console.log('[DEBUG] Chiamo verifyTestToken:', {
        token,
        testType: testType.toLowerCase(),
        timestamp: new Date().toISOString()
      });

      // Verifica il token con il servizio studente
      const response = await studentService.verifyTestToken(token, testType);
      
      // Debug #3 - Dopo la chiamata API
      console.log('[DEBUG] Risposta verifyTestToken:', {
        success: response?.status === 'success',
        hasData: !!response?.data,
        data: response?.data,
        timestamp: new Date().toISOString()
      });
      
      if (!response?.data || !response.data.valid) {
        console.error('[DEBUG] Token non valido:', {
          response,
          stack: new Error().stack
        });
        throw new Error('Token non valido o test non trovato');
      }

      // Debug #4 - Prima di SET_ACTIVE_TEST
      console.log('[DEBUG] Imposto stato attivo:', {
        token,
        testType,
        questions: response.data.questions?.length || 0,
        testData: response.data.test,
        timestamp: new Date().toISOString()
      });

      // Imposta lo stato del test attivo con i dati verificati
      dispatch({ 
        type: 'SET_ACTIVE_TEST', 
        payload: {
          token,
          testType,
          questions: response.data.questions || [],
          testData: response.data.test,
          currentQuestion: 0,
          questionStartTime: null,
          startTime: null,
          answers: {}
        }
      });
      
      dispatch({ type: 'SET_LOADING', payload: { type: 'test', status: false } });
      return response.data;
    } catch (error) {
      // Debug - In caso di errore
      console.error('[DEBUG] Errore in verifyAndLoadTestData:', {
        error: error.message,
        originalError: error,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.error || error.message || 'Errore nella verifica del token' 
      });
      dispatch({ type: 'SET_LOADING', payload: { type: 'test', status: false } });
      throw error;
    }
  }, []);

  const verifyToken = async (testId) => {
    try {
      // Ensure we have a test ID
      if (!testId) {
        throw new Error('Test ID is required');
      }

      const test = state.activeTest;
      if (!test.token) {
        throw new Error('No active test token found');
      }

      const result = await studentService.verifyTestToken(test.token, test.testType);
      if (!result || !result.success) {
        console.error('Token verification failed:', result);
        throw new Error(result?.error || 'Token verification failed');
      }
      return result;
    } catch (error) {
      console.error('Error during token verification:', error);
      throw error;
    }
  };

  // Inizia un test assegnato
  const startTest = useCallback(async (testId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { type: 'test', status: true } });
      
      // Debug log per tracciare l'ID del test
      console.log('Avviando il test con ID:', testId);
      
      const response = await studentService.startAssignedTest(testId);
      
      // Debug log per la risposta del server
      console.log('Risposta dal server per startAssignedTest:', response);
      
      // Verifica che la risposta sia valida
      if (!response || response.status !== 'success') {
        throw new Error('Risposta non valida dal server');
      }
      
      // Correggiamo l'accesso ai dati - response.data può contenere un altro livello data
      const responseData = response.data.data || response.data;
      console.log('Dati estratti dalla risposta:', responseData);
      
      const { token, testType, url, expiresAt, config } = responseData;
      
      // Verifica che il token sia presente
      if (!token) {
        console.error('Token mancante nella risposta estratta:', responseData);
        throw new Error('Token non trovato nella risposta del server');
      }
      
      // Usa il testType dalla risposta o dal test selezionato come fallback
      const actualTestType = testType || state.selectedTest?.tipo || 'CSI';
      
      console.log(`Test di tipo ${actualTestType} avviato con token: ${token}`);
      
      // Salva i dati del test attivo
      dispatch({ 
        type: 'SET_ACTIVE_TEST', 
        payload: {
          token,
          testType: actualTestType,
          testData: {
            url,
            expiresAt,
            config
          }
        }
      });
      
      // Non carichiamo i dati qui - lasciamo che TestRunner lo faccia quando si naviga alla pagina
      
      dispatch({ type: 'SET_LOADING', payload: { type: 'test', status: false } });
      
      return {
        success: true,
        token,
        testType: actualTestType,
        url
      };
    } catch (error) {
      console.error('Errore nell\'avvio del test:', error);
      dispatch({ type: 'SET_ERROR', payload: error.error || error.message || 'Errore nell\'avvio del test' });
      dispatch({ type: 'SET_LOADING', payload: { type: 'test', status: false } });
      throw error;
    }
  }, [state.selectedTest?.tipo]);
  
  // Inizia il test effettivo
  const startActiveTest = useCallback(async () => {
    const { token, testType } = state.activeTest;
    
    if (!token || !testType) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Nessun test attivo da avviare' 
      });
      return { success: false };
    }
    
    try {
      await studentService.startTest(token, testType);
      return { success: true };
    } catch (error) {
      console.error('Errore nell\'avvio del test attivo:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.error || error.message || 'Errore nell\'avvio del test' 
      });
      return { success: false };
    }
  }, [state.activeTest]);
  
  // Invia una risposta
  const submitAnswer = useCallback(async (value) => {
    const { token, testType, currentQuestion, questions, questionStartTime } = state.activeTest;
    
    if (!token || !questions[currentQuestion]) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Impossibile inviare la risposta: dati mancanti' 
      });
      return { success: false };
    }
    
    dispatch({ type: 'SET_LOADING', payload: { type: 'submitting', status: true } });
    
    try {
      const question = questions[currentQuestion];
      
      const answerData = {
        questionId: question.id || currentQuestion,
        value,
        timeSpent: Date.now() - questionStartTime,
        categoria: question.categoria || 'default',
        timestamp: new Date().toISOString()
      };
      
      // Salva localmente la risposta
      dispatch({ type: 'ADD_ANSWER', payload: answerData });
      
      // Invia la risposta al server
      await studentService.submitTestAnswer(token, testType, answerData);
      
      // Se non è l'ultima domanda, passa alla successiva
      if (currentQuestion < questions.length - 1) {
        dispatch({ type: 'SET_CURRENT_QUESTION', payload: currentQuestion + 1 });
      }
      
      dispatch({ type: 'SET_LOADING', payload: { type: 'submitting', status: false } });
      return { success: true, isLastQuestion: currentQuestion === questions.length - 1 };
    } catch (error) {
      console.error('Errore nell\'invio della risposta:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.error || error.message || 'Errore nell\'invio della risposta' 
      });
      dispatch({ type: 'SET_LOADING', payload: { type: 'submitting', status: false } });
      return { success: false };
    }
  }, [state.activeTest]);
  
  // Completa il test
  const completeTest = useCallback(async () => {
    const { token, testType } = state.activeTest;
    
    if (!token || !testType) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Nessun test attivo da completare' 
      });
      return { success: false };
    }
    
    dispatch({ type: 'SET_LOADING', payload: { type: 'test', status: true } });
    
    try {
      const response = await studentService.completeTest(token, testType);
      
      // Reset dello stato del test attivo
      dispatch({ type: 'RESET_ACTIVE_TEST' });
      
      // Aggiorna la lista dei test
      getAssignedTests(true);
      
      dispatch({ type: 'SET_LOADING', payload: { type: 'test', status: false } });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Errore nel completamento del test:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.error || error.message || 'Errore nel completamento del test' 
      });
      dispatch({ type: 'SET_LOADING', payload: { type: 'test', status: false } });
      return { success: false };
    }
  }, [state.activeTest, getAssignedTests]);

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
    startActiveTest,
    submitAnswer,
    completeTest,
    verifyAndLoadTestData,
    formatDate,
    clearError,
    verifyToken,
    dispatch  // Add dispatch to the exposed context value
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