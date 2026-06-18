import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Chat from './pages/Chat.jsx';
import Eligibility from './pages/Eligibility.jsx';
import Compare from './pages/Compare.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('English');

  useEffect(() => {
    // Check for existing user session
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Keep gemini_api_key in localStorage so the user doesn't have to re-enter it
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Protected route wrapper
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar 
          user={user} 
          onLogout={handleLogout} 
          language={language} 
          setLanguage={setLanguage} 
        />
        
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard language={language} />
              </ProtectedRoute>
            } />
            
            <Route path="/chat" element={
              <ProtectedRoute>
                <Chat language={language} />
              </ProtectedRoute>
            } />
            
            <Route path="/eligibility" element={
              <ProtectedRoute>
                <Eligibility language={language} />
              </ProtectedRoute>
            } />
            
            <Route path="/compare" element={
              <ProtectedRoute>
                <Compare language={language} />
              </ProtectedRoute>
            } />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
