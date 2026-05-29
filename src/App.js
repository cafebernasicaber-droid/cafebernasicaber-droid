import React, { useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { AuthProvider } from './shared/contexts/AuthContext';
import AppRoutes from './routes';
import './shared/styles/global.css';

const ScrollManager = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    const isPublic = pathname === '/' || pathname === '/login';
    document.documentElement.style.overflow = isPublic ? 'auto' : 'hidden';
    document.documentElement.style.height = isPublic ? 'auto' : '100%';
    document.body.style.overflow = isPublic ? 'auto' : 'hidden';
    document.body.style.height = isPublic ? 'auto' : '100%';
  }, [pathname]);
  return null;
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <ScrollManager />
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
