import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Отключаем предупреждения React Router (опционально)
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0] && args[0].includes && 
      (args[0].includes('React Router Future Flag') || 
       args[0].includes('v7_startTransition') ||
       args[0].includes('v7_relativeSplatPath'))) {
    return;
  }
  originalWarn.apply(console, args);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);