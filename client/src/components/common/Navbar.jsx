import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();

  const handleNavigation = (section) => {
    if (location.pathname === "/") {
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      window.location.href = `/#${section}`;
    }
  };

  return (
    <nav className="relative z-10">
      <div className="px-15 lg:px-25 py-10">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/">
              <img
                src="/images/logos/TRISHKAYE LOGO SVG.svg"
                alt="TRISHKAYE Logo"
                className="w-50 lg:w-60 xl:w-65"
              />
            </Link>
          </div>

          {/* Navigation - Always visible */}
          <div className="flex items-center space-x-10 lg:space-x-10 xl:space-x-30">
            <Link
              to="/"
              className={`hover:text-amber-300 cursor-pointer transition-colors text-sm lg:text-lg xl:text-xl ${
                location.pathname === "/" ? "text-amber-300 font-semibold" : "text-white"
              }`}
            >
              Home
            </Link>
            <Link
              to="/about"
              className={`hover:text-amber-300 cursor-pointer transition-colors text-sm lg:text-lg xl:text-xl ${
                location.pathname === "/about" ? "text-amber-300 font-semibold" : "text-white"
              }`}
            >
              About Us
            </Link>
            <Link
              to="/services"
              className={`hover:text-amber-300 cursor-pointer transition-colors text-sm lg:text-lg xl:text-xl ${
                location.pathname === "/services" ? "text-amber-300 font-semibold" : "text-white"
              }`}
            >
              Services
            </Link>
            <Link
              to="/login"
              className={`hover:text-amber-300 cursor-pointer transition-colors text-sm lg:text-lg xl:text-xl ${
                location.pathname === "/login" || location.pathname === "/signup" ? "text-amber-300 font-semibold" : "text-white"
              }`}
            >
              Log In | Sign Up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;