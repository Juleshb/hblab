import { apiOrigin } from '../../apiOrigin';
// context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Set base URL for API calls - using proxy in development
axios.defaults.baseURL = apiOrigin;

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
          const response = await axios.get(`${apiOrigin}/api/auth/me`);
          setUser(response.data);
          setToken(storedToken);
        } catch (error) {
          console.error('Token validation failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password, rememberMe) => {
    try {
      const response = await axios.post(`${apiOrigin}/api/auth/login`, { email, password });
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
        navigate('/admin');
      } else {
        try {
          const access = await axios.get(`${apiOrigin}/api/hbms/access/me`);
          if (access.data.data?.allowed) {
            navigate('/admin/hbms');
            return;
          }
        } catch {
          // A student or applicant without an HBMS role continues to their usual page.
        }
        if (user.role === 'STUDENT') navigate('/student/dashboard');
        else navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email, password, name, role) => {
    try {
      const response = await axios.post(`${apiOrigin}/api/auth/register`, { email, password, name, role });
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      setToken(token);
      
      // Redirect based on role
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else if (user.role === 'STUDENT') {
        navigate('/student/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
    navigate('/');
  };

  const hasRole = (requiredRole) => {
    return user?.role === requiredRole;
  };

  const hasAnyRole = (requiredRoles) => {
    return requiredRoles.includes(user?.role);
  };

  const updateUser = (next) => {
    setUser((current) => (current ? { ...current, ...next } : current));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      register, 
      logout, 
      updateUser,
      hasRole, 
      hasAnyRole 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
export const useAuth = () => React.useContext(AuthContext) || {}; 