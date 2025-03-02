// Script di test per verificare l'autenticazione studenti
const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';

// Funzione per testare il login
async function testLogin(username, password) {
  try {
    console.log(`\nTentativo di login con: ${username}`);
    const response = await axios.post(`${API_URL}/student-auth/login`, {
      username,
      password
    });
    
    console.log('Login riuscito!');
    console.log('Status:', response.status);
    console.log('Risposta:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Errore durante il login:');
    
    if (error.response) {
      // Il server ha risposto con un codice di stato diverso da 2xx
      console.error(`Status: ${error.response.status}`);
      console.error('Dati:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // La richiesta è stata inviata ma non è stata ricevuta alcuna risposta
      console.error('Nessuna risposta dal server');
    } else {
      // Si è verificato un errore durante l'impostazione della richiesta
      console.error('Errore:', error.message);
    }
    
    return null;
  }
}

// Esegui il test
(async () => {
  console.log('=== TEST AUTENTICAZIONE STUDENTI ===');
  
  // Credenziali di test (da modificare con credenziali reali)
  await testLogin('ciccio@pasticcio.it', 'password123');
  
  console.log('\nTest completato.');
})();