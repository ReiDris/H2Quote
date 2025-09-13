import React, { useState } from "react";
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
import Hero from "../components/common/Hero";
import Footer from "../components/common/Footer";
import Vincent from '../components/common/Vincent';


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
      IconComponent: Beaker,
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
      {/* Hero Section */}
      <Hero 
        title="MORE THAN 17 YEARS OF"
        subtitle="WATER TREATMENT SERVICES"
        showButton={true}
        buttonText="Learn More"
        onButtonClick={() => handleNavigation("about")}
        sectionId="home"
        titleWeight="font-extralight"
        subtitleWeight="font-bold"
        titleSize="text-4xl xl:text-6xl"
        subtitleSize="text-4xl lg:text-5xl xl:text-7xl"
      />

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
                className="w-full h-100 lg:h-150 xl:h-200 object-cover"
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
      <Footer />
      <Vincent />
    </div>
  );
};

export default LandingPage;