import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ThemeContextProvider } from './context/ThemeContext.jsx';
import { AuthContextProvider } from './context/AuthContext.jsx';
import { WalletContextProvider } from './context/WalletContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeContextProvider>
        <AuthContextProvider>
          <WalletContextProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </WalletContextProvider>
        </AuthContextProvider>
      </ThemeContextProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
