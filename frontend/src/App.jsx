import { useState, useEffect } from 'react'
import SplashScreen from './components/SplashScreen'
import LandingPage from './components/LandingPage'
import Login from './components/Login'
import Register from './components/Register'
import ForgotPassword from './components/ForgotPassword'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('splash');
  const [user, setUser] = useState(null);

  // Load session from sessionStorage if user was logged in
  useEffect(() => {
    const savedUser = sessionStorage.getItem('rentify_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    sessionStorage.setItem('rentify_user', JSON.stringify(userData));
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('rentify_user');
    setCurrentPage('landing');
  };

  const handleSplashFinish = () => {
    // If user is already loaded from session, go straight to dashboard. Else, landing.
    const savedUser = sessionStorage.getItem('rentify_user');
    if (savedUser) {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('landing');
    }
  };

  // Render component dynamically based on route state
  switch (currentPage) {
    case 'splash':
      return <SplashScreen onFinish={handleSplashFinish} />;
    
    case 'landing':
      return <LandingPage onNavigate={setCurrentPage} />;
    
    case 'login':
      return (
        <Login 
          onNavigate={setCurrentPage} 
          onLogin={handleLogin} 
        />
      );
    
    case 'register':
      return (
        <Register 
          onNavigate={setCurrentPage} 
          onLogin={handleLogin} 
        />
      );
    
    case 'forgot-password':
      return <ForgotPassword onNavigate={setCurrentPage} />;
    
    case 'dashboard':
      // If user is not logged in, redirect to login
      if (!user) {
        setCurrentPage('login');
        return null;
      }
      return (
        <Dashboard 
          user={user} 
          onLogout={handleLogout} 
        />
      );
    
    default:
      return <LandingPage onNavigate={setCurrentPage} />;
  }
}

export default App
