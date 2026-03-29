import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import './index.css';

const AppProviders = ({ children }) => (
  <ThemeProvider>
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>{children}</BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  </ThemeProvider>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  import.meta.env.DEV ? (
    <AppProviders>
      <App />
    </AppProviders>
  ) : (
    <React.StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </React.StrictMode>
  ),
);
