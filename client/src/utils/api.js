import { useState, useContext, createContext, useEffect } from 'react';

const AuthContext = createContext();

// You'll need to set this to your backend URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

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
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

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

      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        body: formData, // Don't set Content-Type header for FormData
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Signup failed');
      }

      return data;
    } catch (error) {
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
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
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