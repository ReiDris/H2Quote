import React from 'react';
import { Bell } from 'lucide-react';

const Header = () => {
  return (
    <div className="bg-[#004785] text-white px-6 pt-3 pb-3 flex justify-between items-center fixed top-0 left-0 right-0 z-50">
      {/* Left side - Logo */}
      <div className="flex items-center">
        <img
          src="/images/logos/TRISHKAYE LOGO SVG.svg"
          alt="TRISHKAYE Logo"
          className="h-13 w-auto"
        />
      </div>
      
      {/* Right side - Notifications */}
      <div className="flex items-center">
        <button className="relative p-2 hover:bg-blue-700 rounded-lg transition-colors duration-200">
          <Bell size={20} />
          {/* Notification badge */}
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            3
          </div>
        </button>
      </div>
    </div>
  );
};

export default Header;