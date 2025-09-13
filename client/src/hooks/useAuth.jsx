import { useState, useContext, createContext, useEffect } from 'react';

const AuthContext = createContext();

// Mock user database
const MOCK_USERS = [
  {
    id: 1,
    email: 'admin@trishkaye.com',
    password: 'admin123',
    role: 'admin',
    name: 'Admin User',
    position: 'System Administrator'
  },
  {
    id: 2,
    email: 'staff@trishkaye.com',
    password: 'staff123',
    role: 'staff',
    name: 'Staff Member',
    position: 'Service Technician'
  },
  {
    id: 3,
    email: 'customer@example.com',
    password: 'customer123',
    role: 'customer',
    name: 'John Doe',
    company: 'Sample Company Inc.'
  },
  {
    id: 4,
    email: 'client@jmaterials.com',
    password: 'client123',
    role: 'customer',
    name: 'Jane Smith',
    company: 'JMATERIALS CORPORATION'
  }
];

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
    // Check if user is logged in (from localStorage or API)
    const storedUser = localStorage.getItem('h2quote_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('h2quote_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials) => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find user in mock database
      const foundUser = MOCK_USERS.find(
        user => user.email === credentials.email && user.password === credentials.password
      );
      
      if (!foundUser) {
        throw new Error('Invalid email or password');
      }
      
      // Remove password from user object before storing
      const { password, ...userWithoutPassword } = foundUser;
      
      setUser(userWithoutPassword);
      localStorage.setItem('h2quote_user', JSON.stringify(userWithoutPassword));
      return userWithoutPassword;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('h2quote_user');
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user,
    mockUsers: MOCK_USERS.map(({ password, ...user }) => user) // For demo purposes
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};