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
  // IMPORTANTE: Definiamo questa funzione prima di startTest per evitare problemi di inizializzazione
  const verifyAndLoadTestData = useCallback(async (token, testType) => {
    try {
      // Verifica che token e testType non siano undefined o null
      if (!token) {
        throw new Error('Token mancante per la verifica del test');
      }
      
      if (!testType) {
        throw new Error('Tipo di test mancante per la verifica');
      }
      
      console.log(`Verifica del test: type=${testType}, token=${token}`);
      
      const response = await studentService.verifyTestToken(token, testType);
      
      if (!response.data || !response.data.valid) {
        throw new Error('Token non valido o test non trovato');
      }
      
      dispatch({ 
        type: 'SET_ACTIVE_TEST', 
        payload: {
          questions: response.data.questions || [],
          testData: response.data.test,
          currentQuestion: 0,
          questionStartTime: Date.now(),
          startTime: Date.now(),
          answers: {}
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Errore nella verifica del token:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.error || error.message || 'Errore nella verifica del token' 
      });
      throw error;
    }
  }, []);

  const verifyToken = async (testId) => {
    try {
      const result = await verifyTestToken(testId);
      if (!result || !result.success) {
        console.error('Verifica token fallita:', result);
        throw new Error(result?.error || 'Verifica token fallita');
      }
      return result;
    } catch (error) {
      console.error('Errore durante la verifica:', error);
      throw error;
    }
  };

  // Inizia un test assegnato
  const startTest = useCallback(async (testId) => {
    dispatch({ type: 'SET_LOADING', payload: { type: 'test', status: true } });
    try {
      // Chiamata API per avviare il test assegnato
      console.log('Avvio test con ID:', testId);
      const response = await studentService.startAssignedTest(testId);
      console.log('Risposta completa dal server:', response);

      if (!response || response.status !== 'success') {
        throw new Error('Nessuna risposta valida dal server');
      }

      // Estrai i dati del test dalla risposta
      // Il token e altri dati potrebbero essere in response.data o in response.data.data
      const responseData = response.data || {};
      console.log('Dati della risposta:', responseData);
      
      // Gestione automatica della struttura nidificata
      let extractedData = responseData;
      
      // Se i dati sono annidati in un campo data, estraiamoli
      if (responseData.data && typeof responseData.data === 'object') {
        extractedData = responseData.data;
        console.log('Dati estratti dal livello annidato:', extractedData);
      }
      
      const { token, url, expiresAt, config, testType } = extractedData;
      
      console.log('Token estratto:', token);
      
      if (!token) {
        console.error('Token mancante nella risposta:', response);
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
      
      // Recupera i dati del test specifici per il tipo
      try {
        if (token && actualTestType) {
          await verifyAndLoadTestData(token, actualTestType);
        } else {
          console.warn(`Non è possibile verificare il test: token=${token}, testType=${actualTestType}`);
        }
      } catch (testDataError) {
        console.error('Errore nel caricamento dei dati specifici del test:', testDataError);
        // Anche se c'è un errore qui, proseguiamo perché il test è già stato avviato
      }
      
      // Aggiorna la lista dei test assegnati
      getAssignedTests(true);
      
      return { success: true, token, testType: actualTestType };
    } catch (error) {
      console.error('Errore nell\'avvio del test:', error);
      
      // Miglioriamo il messaggio di errore
      let errorMessage = error.error || error.message || 'Errore nell\'avvio del test';
      let errorDetails = error.details || {};
      
      // Formattazione per messaggi specifici basati sul codice di errore
      if (errorDetails.nextAvailableDate) {
        const nextDate = new Date(errorDetails.nextAvailableDate);
        errorMessage += ` - Disponibile dal ${formatDate(nextDate)}`;
      }
      
      if (errorDetails.reason) {
          switch (errorDetails.reason) {
            case 'ACTIVE_TEST_EXISTS':
              // Verifica se abbiamo l'ID del test attivo
              if (errorDetails.activeTest) {
                // Cerca il test attivo nell'elenco dei test assegnati
                const activeTest = state.assignedTests.find(test => test._id === errorDetails.activeTest);
                if (activeTest) {
                  errorMessage = `Hai già il test "${activeTest.nome}" in corso. Completa quello prima di avviarne un altro.`;
                } else {
                  errorMessage = `Hai già un test CSI in corso (ID: ${errorDetails.activeTest}). Completa quello prima di avviarne un altro.`;
                }
              } else {
                errorMessage = 'Hai già un test attivo dello stesso tipo. Completa quello prima di avviarne un altro.';
              }
              break;
          case 'COOLDOWN_PERIOD':
            errorMessage = `Periodo di attesa richiesto tra i test`;
            if (errorDetails.nextAvailableDate) {
              errorMessage += ` - Potrai riprovare dal ${formatDate(new Date(errorDetails.nextAvailableDate))}`;
            }
            break;
          case 'MAX_ATTEMPTS_REACHED':
            errorMessage = 'Hai raggiunto il numero massimo di tentativi per questo test';
            break;
        }
      }
      
      dispatch({ 
        type: 'SET_ERROR', 
        payload: errorMessage
      });
      dispatch({ type: 'SET_LOADING', payload: { type: 'test', status: false } });
      return { success: false, error: errorMessage, details: errorDetails };
    }
  }, [state.selectedTest, formatDate, getAssignedTests, verifyAndLoadTestData]);
  
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
    verifyToken
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