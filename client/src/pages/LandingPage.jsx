import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Beaker,
  Droplets,
  Settings,
  Search,
  Palette,
  Wind,
  Microscope,
  Wrench,
  TestTube,
  Sparkles,
  Brush,
} from "lucide-react";
import { COMPANY_INFO } from "../utils/constants";
import { MapPinIcon, PhoneIcon, EnvelopeIcon } from "@heroicons/react/24/solid";

const LandingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Placeholder images for slideshow
  const slideImages = [
    "/images/site/carousel1.jpg",
    "/images/site/carousel2.jpg",
    "/images/site/carousel3.jpg",
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slideImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + slideImages.length) % slideImages.length
    );
  };

  const handleNavigation = (section) => {
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const services = [
    {
      id: 1,
      title: "Water Treatment Chemicals",
      IconComponent: Beaker, // or use a component/image
    },
    {
      id: 2,
      title: "Potable Water Treatment",
      IconComponent: Droplets,
    },
    {
      id: 3,
      title: "Waste Water Treatment Equipment",
      IconComponent: Settings,
    },
    {
      id: 4,
      title: "Filtration Equipments",
      IconComponent: Search,
    },
    {
      id: 5,
      title: "Paints, Coating Waterproofing Chemicals",
      IconComponent: Palette,
    },
    {
      id: 6,
      title: "Air Filtration System and Equipments",
      IconComponent: Wind,
    },
    {
      id: 7,
      title: "Water Laboratory",
      IconComponent: Microscope,
    },
    {
      id: 8,
      title: "Preventative Maintenance Chemicals and Lubricants",
      IconComponent: Wrench,
    },
    {
      id: 9,
      title: "Laboratory Supplies, Reagents and Testing Equipments",
      IconComponent: TestTube,
    },
    {
      id: 10,
      title: "Industrial Cleaning Chemicals/ Janitorial Chemicals",
      IconComponent: Sparkles,
    },
    {
      id: 11,
      title: "Cleaning Services and Other Services",
      IconComponent: Brush,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Combined Navigation and Hero Section */}
      <section id="home" className="relative h-screen flex flex-col text-white">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/images/logos/login bg.jpg"
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div>
        {/* Light blue tint */}
        <div className="absolute inset-0 bg-[#002052] opacity-80"></div>

        {/* Navigation */}
        <nav className="relative z-10">
          <div className="px-15 lg:px-25 py-10">
            <div className="flex justify-between items-center">
              {/* Logo */}
              <div className="flex items-center">
                <img
                  src="/images/logos/TRISHKAYE LOGO SVG.svg"
                  alt="TRISHKAYE Logo"
                  className="w-50 lg:w-60 xl:w-65"
                />
              </div>

              {/* Navigation - Always visible */}
              <div className="flex items-center space-x-10 lg:space-x-10 xl:space-x-30">
                <button
                  onClick={() => handleNavigation("home")}
                  className="hover:text-amber-300 cursor-pointer transition-colors text-sm lg:text-lg xl:text-xl"
                >
                  Home
                </button>
                <button
                  onClick={() => handleNavigation("about")}
                  className="hover:text-amber-300 cursor-pointer transition-colors text-sm lg:text-lg xl:text-xl"
                >
                  About Us
                </button>
                <button
                  onClick={() => handleNavigation("services")}
                  className="hover:text-amber-300 cursor-pointer transition-colors text-sm lg:text-lg xl:text-xl"
                >
                  Services
                </button>
                <Link
                  to="/login"
                  className="hover:text-amber-300 cursor-pointer transition-colors text-sm lg:text-lg xl:text-xl"
                >
                  Log In | Sign Up
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center text-center">
          <div>
            <h1 className="text-4xl xl:text-6xl font-extralight">
              MORE THAN 17 YEARS OF
            </h1>
            <h2 className="text-4xl lg:text-5xl xl:text-7xl font-bold mb-8">
              WATER TREATMENT SERVICES
            </h2>
            <button
              onClick={() => handleNavigation("about")}
              className="bg-white hover:bg-gray-200 text-[#011D35] px-9 lg:px-9 xl:px-11 py-2 lg:py-2 xl:py-3 rounded-2xl lg:text-lg xl:text-2xl transition-colors cursor-pointer"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="about" className="py-16">
        <div className="mx-18 lg:mx-25">
          <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-center mb-16 text-[#004785]">
            Why Choose Us?
          </h2>

          {/* Image Slideshow */}
          <div className="relative mx-auto mb-12">
            <div className="overflow-hidden rounded-lg shadow-lg">
              <img
                src={slideImages[currentSlide]}
                alt={`Office slide ${currentSlide + 1}`}
                className="w-full h-100 lg:h-150 object-cover"
              />
            </div>

            {/* Slideshow Controls */}
            <button
              onClick={prevSlide}
              className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-1 md:p-2 shadow-md transition-all cursor-pointer"
            >
              <ChevronLeft size={20} className="text-gray-700 md:w-6 md:h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-1 md:p-2 shadow-md transition-all cursor-pointer"
            >
              <ChevronRight size={20} className="text-gray-700 md:w-6 md:h-6" />
            </button>

            {/* Slide Indicators */}
            <div className="flex justify-center mt-4 space-x-6">
              {slideImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-10 h-3 rounded-full transition-colors cursor-pointer ${
                    index === currentSlide ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Company Description */}
          <div className="text-justify">
            <p className="lg:text-2xl xl:text-3xl text-gray-600 leading-relaxed">
              Our company, TRISHKAYE ENTERPRISES & ALLIED SERVICES is equipped
              with more than 17 years of experience in the field of water
              treatment chemicals & services specializing on water filtration
              systems, water treatment chemical supplies, descaling and chemical
              cleaning of various industrial equipment such as Heat exchangers,
              Boilers, Cooling towers, Tanks, Boilers, Cooling towers, Chillers,
              Air-handling units, Condensers, Evaporators, Heat exchangers,
              Oil-coolers and also for Waste water treatment plant.
            </p>
          </div>
        </div>
      </section>

      {/* Products and Services Section */}
      <section id="services" className="pt-0 lg:pt-16 py-16 bg-white">
        <div className="mx-25">
          <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-center mb-16 text-[#004785]">
            Products and Services
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-[#ECF5FB] rounded-4xl p-8 text-center hover:shadow-lg transition-shadow cursor-pointer h-65 flex flex-col items-center justify-center"
              >
                {/* Icon */}
                <div className="flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <service.IconComponent className="text-[#0260A0] w-[50px] h-[50px] lg:w-[60px] lg:h-[60px] xl:w-[70px] xl:h-[70px]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-[#0260A0]">
                  {service.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#02538B] text-white py-8 md:py-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {/* Top right large droplet */}
          <img
            src="/images/logos/droplet.png"
            alt=""
            className="absolute top-0 right-0 w-30 h-45 translate-x-14 -translate-y-3"
          />

          {/* Bottom right large droplet */}
          <img
            src="/images/logos/droplet.png"
            alt=""
            className="absolute bottom-0 right-0 w-40 h-60 translate-x-15 translate-y-17"
          />

          {/* Middle Bottom large droplet */}
          <img
            src="/images/logos/droplet.png"
            alt=""
            className="absolute right-0 w-30 h-45 -translate-x-10 translate-y-13"
          />

          {/* Top Left large droplet */}
          <img
            src="/images/logos/droplet.png"
            alt=""
            className="absolute left-0 scale-x-[-1] w-55 h-70 rotate-70 -translate-x-30 -translate-y-28"
          />

          {/* Bottom Left large droplet */}
          <img
            src="/images/logos/droplet.png"
            alt=""
            className="absolute left-0 bottom-0 scale-x-[-1] w-55 h-70 rotate-60 -translate-x-45 translate-y-10"
          />
        </div>

        <div className="px-30 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Company Info */}
            <div>
              <div className="flex items-center mb-9">
                <img
                  src="/images/logos/TRISHKAYE LOGO SVG.svg"
                  alt="TRISHKAYE Logo"
                  className="w-50"
                />
              </div>

              <div className="space-y-2 text-white text-sm">
                <div className="flex items-start">
                  <MapPinIcon className="mr-2 mt-1 flex-shrink-0 w-6 h-6" />
                  <p>
                    B2 113 Pag-Asa Subdivision,
                    <br />
                    Bucandala IV, Imus, Cavite
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <div className="flex items-center mb-6">
                <PhoneIcon className="mr-2 w-5 h-5" />
                <h4 className="font-semibold text-lg">Call Us</h4>
              </div>
              <div className="space-y-3 text-white text-sm">
                <div>
                  <p className="font-medium">Cavite/Fax No.:</p>
                  <p>(046) 472 1415</p>
                </div>
                <div>
                  <p className="font-medium">Manila:</p>
                  <p>(02) 8542 1884 | (02) 8986 8011</p>
                </div>
              </div>
            </div>

            {/* Get In Touch */}
            <div>
              <h4 className="font-semibold mb-6 text-lg">Get In Touch</h4>

              {/* Email Us button - visible only on md and smaller screens */}
              <div className="bg-white rounded-lg p-4 inline-block lg:hidden">
                <div className="flex items-center">
                  <EnvelopeIcon className="mr-2 w-5 h-5 text-[#0260A0]" />
                  <span className="text-sm text-[#0260A0] font-semibold xl:whitespace-nowrap">
                    Email Us
                  </span>
                </div>
              </div>

              {/* Full email - visible only on md and larger screens */}
              <div className="bg-white rounded-lg p-4 hidden lg:inline-block">
                <div className="flex items-center">
                  <EnvelopeIcon className="mr-2 w-5 h-5 text-[#0260A0]" />
                  <span className="lg:text-xs xl:text-sm text-[#0260A0] font-semibold xl:whitespace-nowrap">
                    trishkaye@trishkayechemicals-services.com
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-300 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-white text-sm">
                All Rights Reserved ©2017| TRISHKAYE®
              </p>
              <div className="flex space-x-8">
                <a
                  href="#"
                  className="text-white hover:text-white text-sm transition-colors"
                >
                  Home
                </a>
                <a
                  href="#"
                  className="text-white hover:text-white text-sm transition-colors"
                >
                  About Us
                </a>
                <a
                  href="#"
                  className="text-white hover:text-white text-sm transition-colors"
                >
                  Services
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
