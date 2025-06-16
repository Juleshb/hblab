// context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (storedToken) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          const response = await axios.get('/api/auth/me');
          setUser(response.data.user);
          setToken(storedToken);
        } catch (error) {
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password, rememberMe) => {
    const response = await axios.post('/api/auth/login', { email, password });
    const { user, token } = response.data;
    
    if (rememberMe) {
      localStorage.setItem('token', token);
    } else {
      sessionStorage.setItem('token', token);
    }
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    setToken(token);
    
    // Redirect based on role
    if (user.role === 'ADMIN') {
      navigate('/admin/dashboard');
    } else if (user.role === 'STUDENT') {
      navigate('/student/dashboard');
    } else {
      navigate('/applicant/dashboard');
    }
  };

  const register = async (email, password, name, role) => {
    const response = await axios.post('/api/auth/register', { email, password, name, role });
    const { user, token } = response.data;
    
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    setToken(token);
    
    // Redirect based on role
    if (user.role === 'ADMIN') {
      navigate('/admin/dashboard');
    } else if (user.role === 'STUDENT') {
      navigate('/student/dashboard');
    } else {
      navigate('/applicant/dashboard');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
    navigate('/login');
  };

  const hasRole = (requiredRole) => {
    return user?.role === requiredRole;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, hasRole }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);