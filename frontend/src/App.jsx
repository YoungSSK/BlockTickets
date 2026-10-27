import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeContextProvider } from './context/ThemeContext';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <ThemeContextProvider>
      <BrowserRouter>
        <Routes>
          {/* Wildcard route dẫn tới NotFoundPage */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeContextProvider>
  );
}
