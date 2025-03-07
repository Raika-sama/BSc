import React from 'react';
import { createRoot } from 'react-dom/client';
import AppRoot from './AppRoot';

// Recupera il container radice
const container = document.getElementById('root');
const root = createRoot(container);

// Renderizza l'AppRoot che gestisce tutti i provider
root.render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>
);