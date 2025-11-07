import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../config/api';
import { useAuth } from '../hooks/useAuth';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const { googleLogin } = useAuth();
  const [error, setError] = useState(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

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
        
        const userData = await googleLogin({
          code: code,
          redirect_uri: redirectUri
        });

        const userRole = userData.role;
        switch (userRole) {
          case 'admin':
            navigate('/admin/service-tracker', { replace: true });
            break;
          case 'staff':
            navigate('/staff/service-tracker', { replace: true });
            break;
          case 'customer':
            navigate('/customer/service-tracker', { replace: true });
            break;
          default:
            navigate('/customer/service-tracker', { replace: true });
        }
      } catch (error) {
        console.error('Google auth error:', error);
        setError(error.message || 'Google login failed. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [navigate, googleLogin]);

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