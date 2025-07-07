import React from 'react';
import { Link } from 'react-router-dom';
import { COMPANY_INFO } from '../utils/constants';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold mb-4">{COMPANY_INFO.name}</h1>
          <p className="text-xl mb-2">{COMPANY_INFO.subtitle}</p>
          <p className="text-lg mb-8 opacity-90">{COMPANY_INFO.tagline}</p>
          
          <div className="space-x-4">
            <Link 
              to="/login"
              className="bg-white text-blue-600 px-8 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors duration-200"
            >
              Login
            </Link>
            <Link 
              to="/signup"
              className="border-2 border-white text-white px-8 py-3 rounded-xl font-medium hover:bg-white hover:text-blue-600 transition-colors duration-200"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;