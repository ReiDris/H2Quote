import { useState, useContext, createContext, useEffect } from 'react';
import { authAPI } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in and token is valid
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('h2quote_token');
      if (token) {
        try {
          const response = await authAPI.getCurrentUser();

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setUser(data.data.user);
            } else {
              localStorage.removeItem('h2quote_token');
              localStorage.removeItem('h2quote_user');
            }
          } else {
            localStorage.removeItem('h2quote_token');
            localStorage.removeItem('h2quote_user');
          }
        } catch (error) {
          console.error('Error checking auth status:', error);
          localStorage.removeItem('h2quote_token');
          localStorage.removeItem('h2quote_user');
        }
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (credentials) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(credentials);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      const { token, user: userData } = data.data;
      
      // Store token and user data
      localStorage.setItem('h2quote_token', token);
      localStorage.setItem('h2quote_user', JSON.stringify(userData));
      
      setUser(userData);
      return userData;
    } catch (error) {
      // Handle network errors (Failed to fetch)
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
      }
      // Re-throw other errors as-is
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (signupData) => {
    setIsLoading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('companyName', signupData.companyName);
      formData.append('customerName', signupData.customerName);
      formData.append('email', signupData.email);
      formData.append('contactNo', signupData.contactNo);
      formData.append('password', signupData.password);
      formData.append('confirmPassword', signupData.confirmPassword);
      
      // Add verification document - must match backend field name 'verificationFile'
      if (signupData.verificationDocument) {
        formData.append('verificationFile', signupData.verificationDocument);
      }

      const response = await authAPI.signup(formData);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Signup failed');
      }

      return data;
    } catch (error) {
      // Handle network errors (Failed to fetch)
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (credential) => {
    setIsLoading(true);
    try {
      const response = await authAPI.googleAuth(credential);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Google login failed');
      }

      const { token, user: userData } = data.data;
      
      // Store token and user data
      localStorage.setItem('h2quote_token', token);
      localStorage.setItem('h2quote_user', JSON.stringify(userData));
      
      setUser(userData);
      return userData;
    } catch (error) {
      // Handle network errors (Failed to fetch)
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('h2quote_token');
      if (token) {
        // Call backend logout endpoint
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      setUser(null);
      localStorage.removeItem('h2quote_token');
      localStorage.removeItem('h2quote_user');
    }
  };

  const value = {
    user,
    login,
    signup,
    googleLogin,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};