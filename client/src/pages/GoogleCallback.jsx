import React, { useEffect } from 'react';

const GoogleCallback = () => {
  useEffect(() => {
    // Get the authorization code from URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (window.opener) {
      if (error) {
        // Send error to parent window
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: error
        }, window.location.origin);
      } else if (code) {
        // Send success with code to parent window
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_SUCCESS',
          code: code
        }, window.location.origin);
      }
      
      // Close this popup window
      window.close();
    } else {
      // If opened in same window (shouldn't happen), redirect to login
      window.location.href = '/login';
    }
  }, []);

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