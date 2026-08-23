import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// [fix] Null-guard: if the container is missing (wrong HTML) throw a helpful error
// instead of an unreadable "Cannot read properties of null" crash.
const container = document.getElementById('root');
if (!container) {
  throw new Error(
    '[TaskFlow] Mount target #root not found. Check that index.html has <div id="root">.'
  );
}

ReactDOM.createRoot(container).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
