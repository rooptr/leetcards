import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import PwaControl from './components/PwaControl.jsx';
import { registerPwa } from './pwa.js';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <PwaControl />
  </React.StrictMode>,
);

registerPwa();
