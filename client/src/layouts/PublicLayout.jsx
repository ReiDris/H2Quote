import React from 'react';

const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
};

export default PublicLayout;