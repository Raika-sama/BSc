import { extendTheme } from '@chakra-ui/react';
import { predefinedThemes } from './predefinedThemes';

/**
 * Gestore centralizzato dei temi dell'applicazione
 */
const themeManager = {
  /**
   * Ottiene il tema attualmente attivo
   * @returns {Object} Tema attivo
   */
  getCurrentTheme: () => {
    // Controlla se c'è un tema salvato in localStorage
    const savedThemeId = localStorage.getItem('currentThemeId');
    
    if (savedThemeId) {
      // Cerca prima nei temi predefiniti
      const predefinedTheme = predefinedThemes.find(theme => theme.id === savedThemeId);
      if (predefinedTheme) return predefinedTheme;
      
      // Poi cerca nei temi personalizzati
      const savedCustomThemes = localStorage.getItem('customThemes');
      if (savedCustomThemes) {
        try {
          const customThemes = JSON.parse(savedCustomThemes);
          const customTheme = customThemes.find(theme => theme.id === savedThemeId);
          if (customTheme) return customTheme;
        } catch (e) {
          console.error('Errore nel parsing dei temi personalizzati:', e);
        }
      }
    }
    
    // Se non trova un tema salvato o valido, ritorna il tema predefinito
    return predefinedThemes[0]; // default-blue
  },
  
  /**
   * Applica un tema all'applicazione
   * @param {Object} theme - Tema da applicare
   * @returns {Object} Tema Chakra UI esteso
   */
  applyTheme: (theme) => {
    // Salva l'ID del tema corrente in localStorage
    localStorage.setItem('currentThemeId', theme.id);
    
    // Crea un tema Chakra UI esteso con le proprietà del tema selezionato
    const extendedTheme = extendTheme({
      colors: theme.colors,
      styles: {
        global: {
          // Applica le transizioni globali
          '*': {
            transition: `all ${theme.transition.duration} ${theme.transition.easing}`,
          },
        },
      },
      config: {
        initialColorMode: 'light',
        useSystemColorMode: true,
      },
    });
    
    return extendedTheme;
  },
  
  /**
   * Salva un tema personalizzato
   * @param {Object} theme - Tema da salvare
   */
  saveCustomTheme: (theme) => {
    // Recupera i temi personalizzati esistenti
    const savedCustomThemes = localStorage.getItem('customThemes');
    let customThemes = [];
    
    if (savedCustomThemes) {
      try {
        customThemes = JSON.parse(savedCustomThemes);
      } catch (e) {
        console.error('Errore nel parsing dei temi personalizzati:', e);
      }
    }
    
    // Controlla se esiste già un tema con lo stesso ID
    const existingIndex = customThemes.findIndex(t => t.id === theme.id);
    
    if (existingIndex !== -1) {
      // Aggiorna il tema esistente
      customThemes[existingIndex] = theme;
    } else {
      // Aggiungi il nuovo tema
      customThemes.push(theme);
    }
    
    // Salva i temi aggiornati
    localStorage.setItem('customThemes', JSON.stringify(customThemes));
    
    // Imposta come tema corrente
    localStorage.setItem('currentThemeId', theme.id);
    
    return theme;
  },
  
  /**
   * Elimina un tema personalizzato
   * @param {string} themeId - ID del tema da eliminare
   * @returns {boolean} Successo dell'operazione
   */
  deleteCustomTheme: (themeId) => {
    // Recupera i temi personalizzati esistenti
    const savedCustomThemes = localStorage.getItem('customThemes');
    if (!savedCustomThemes) return false;
    
    try {
      let customThemes = JSON.parse(savedCustomThemes);
      
      // Filtra il tema da eliminare
      customThemes = customThemes.filter(theme => theme.id !== themeId);
      
      // Salva i temi aggiornati
      localStorage.setItem('customThemes', JSON.stringify(customThemes));
      
      // Se il tema corrente è quello eliminato, imposta il tema predefinito
      const currentThemeId = localStorage.getItem('currentThemeId');
      if (currentThemeId === themeId) {
        localStorage.setItem('currentThemeId', predefinedThemes[0].id);
      }
      
      return true;
    } catch (e) {
      console.error('Errore nell\'eliminazione del tema:', e);
      return false;
    }
  },
  
  /**
   * Ottiene tutti i temi disponibili (predefiniti e personalizzati)
   * @returns {Array} Lista di tutti i temi
   */
  getAllThemes: () => {
    // Recupera i temi personalizzati
    const savedCustomThemes = localStorage.getItem('customThemes');
    let customThemes = [];
    
    if (savedCustomThemes) {
      try {
        customThemes = JSON.parse(savedCustomThemes);
      } catch (e) {
        console.error('Errore nel parsing dei temi personalizzati:', e);
      }
    }
    
    // Combina temi predefiniti e personalizzati
    return [...predefinedThemes, ...customThemes];
  },
  
  /**
   * Ottiene tutti i temi personalizzati
   * @returns {Array} Lista dei temi personalizzati
   */
  getCustomThemes: () => {
    const savedCustomThemes = localStorage.getItem('customThemes');
    if (!savedCustomThemes) return [];
    
    try {
      return JSON.parse(savedCustomThemes);
    } catch (e) {
      console.error('Errore nel parsing dei temi personalizzati:', e);
      return [];
    }
  },
  
  /**
   * Ottiene tutti i temi predefiniti
   * @returns {Array} Lista dei temi predefiniti
   */
  getPredefinedThemes: () => {
    return predefinedThemes;
  }
};

export default themeManager;