import React from 'react';
import ReactDOM from 'react-dom/client';
import '@midnight-ntwrk/dapp-connector-api';
import { App } from './App';
import './styles.css';
import './production.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
