import React from "react";
import Navbar from "./Navbar";

const Hero = ({ 
  title, 
  subtitle, 
  showButton = false, 
  buttonText = "Learn More", 
  onButtonClick,
  sectionId = "home",
  titleWeight = "font-extralight",
  subtitleWeight = "font-bold",
  titleSize = "text-4xl xl:text-6xl",
  subtitleSize = "text-4xl lg:text-5xl xl:text-7xl"
}) => {
  return (
    <section id={sectionId} className="relative h-screen flex flex-col text-white">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="/images/logos/login bg.jpg"
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>
      {/* Blue tint overlay */}
      <div className="absolute inset-0 bg-[#002052] opacity-80"></div>

      {/* Navigation Component */}
      <Navbar />

      {/* Hero Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center text-center">
        <div>
          <h1 className={`${titleSize} mb-4 ${titleWeight}`}>
            {title}
          </h1>
          {subtitle && (
            <h2 className={`${subtitleSize} mb-8 ${subtitleWeight}`}>
              {subtitle}
            </h2>
          )}
          {showButton && (
            <button
              onClick={onButtonClick}
              className="bg-white hover:bg-gray-200 text-[#011D35] px-9 lg:px-9 xl:px-11 py-2 lg:py-2 xl:py-3 rounded-2xl lg:text-lg xl:text-2xl transition-colors cursor-pointer"
            >
              {buttonText}
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;