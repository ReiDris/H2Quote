import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../config/api';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const hasProcessed = useRef(false); // ✅ Prevent double execution

  useEffect(() => {
    // ✅ Guard against double execution
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const errorParam = params.get('error');

      console.log('🔍 Callback params:', { code: code?.substring(0, 20) + '...', errorParam });

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
        
        console.log('🔐 Exchanging code for token (single call)');
        console.log('📍 Redirect URI:', redirectUri);
        
        const result = await authAPI.googleAuth({
          code: code,
          redirect_uri: redirectUri
        });

        console.log('📊 Response status:', result.status);
        
        const data = await result.json();
        
        console.log('📦 Response data:', data);

        if (data.success) {
          console.log('✅ Login successful, storing token and user');
          localStorage.setItem('h2quote_token', data.data.token);
          localStorage.setItem('h2quote_user', JSON.stringify(data.data.user));
          
          console.log('👤 User role:', data.data.user.role);
          
          // Redirect based on user role
          const userRole = data.data.user.role;
          let redirectPath;
          
          switch (userRole) {
            case 'admin':
              redirectPath = '/admin/service-tracker';
              break;
            case 'staff':
              redirectPath = '/staff/service-tracker';
              break;
            case 'customer':
              redirectPath = '/customer/service-tracker';
              break;
            default:
              redirectPath = '/customer/service-tracker';
          }
          
          console.log('🚀 Redirecting to:', redirectPath);
          navigate(redirectPath, { replace: true });
        } else {
          console.error('❌ Login failed:', data.message);
          setError(data.message || 'Google login failed');
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (error) {
        console.error('💥 Google auth error:', error);
        setError('Google login failed. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, []);

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