import React from 'react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';

const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header at Top */}
      <Header />
      
      {/* Fixed Sidebar - starts below header */}
      <Sidebar userRole="admin" />
      
      {/* Main Content Area - account for both header and sidebar */}
      <div className="pt-20 ml-16 lg:ml-20 xl:ml-50 2xl:ml-60">
        {/* Page Content */}
        <main className="p-5">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;