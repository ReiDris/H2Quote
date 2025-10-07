import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../config/api';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const errorParam = params.get('error');

      if (errorParam) {
        setError('Google authentication failed: ' + errorParam);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (!code) {
        setError('No authorization code received');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        const redirectUri = `${window.location.origin}/auth/google/callback`;
        
        const result = await authAPI.googleAuth({
          code: code,
          redirect_uri: redirectUri
        });

        const data = await result.json();

        if (data.success) {
          localStorage.setItem('h2quote_token', data.data.token);
          localStorage.setItem('h2quote_user', JSON.stringify(data.data.user));
          
          // Redirect based on user role
          const userRole = data.data.user.role;
          switch (userRole) {
            case 'admin':
              navigate('/admin/service-tracker');
              break;
            case 'staff':
              navigate('/staff/service-tracker');
              break;
            case 'customer':
              navigate('/customer/service-tracker');
              break;
            default:
              navigate('/customer/service-tracker');
          }
        } else {
          setError(data.message || 'Google login failed');
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (error) {
        console.error('Google auth error:', error);
        setError('Google login failed. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <p className="text-red-600 mb-2">{error}</p>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing Google sign in...</p>
      </div>
    </div>
  );
};

export default GoogleCallback;