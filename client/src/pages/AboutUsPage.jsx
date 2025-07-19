import React from "react";
import Hero from "../components/common/Hero";
import Footer from "../components/common/Footer";
import Vincent from '../components/common/Vincent';


const AboutUsPage = () => {
  const handleNavigation = (section) => {
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <Hero 
        title="ABOUT US"
        subtitle="TRISHKAYE ENTERPRISES & ALLIED SERVICES"
        showButton={true}
        onButtonClick={() => handleNavigation("company-profile")}
        sectionId="about-hero"
        titleWeight="font-bold"
        subtitleWeight="font-extralight"
        titleSize="text-4xl lg:text-5xl xl:text-7xl"
        subtitleSize="text-4xl xl:text-6xl"
      />

      {/* Main Content */}
      <div className="py-16">
        <div className="mx-18 lg:mx-25">
          {/* Company Profile Section */}
          <section id="company-profile" className="mb-16">
            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-center mb-12 text-[#004785] lg:py-4 xl:py-5">
              Company Profile
            </h2>
            
            {/* Company Image */}
            <div className="mb-12">
              <img
                src="/images/site/company pic.png"
                alt="TRISHKAYE Company Building"
                className="mx-auto object-contain rounded-lg"
              />
            </div>

            {/* Company Description */}
            <div className="space-y-6 text-justify">
              <p className="lg:text-lg xl:text-2xl text-gray-700 leading-relaxed">
                TRISHKAYE Enterprises & Allied Services supply and serve in various industries 
                plants and facilities, malls, buildings, hospitals, educational institutions, 
                hotels and resorts and commercial establishments.
              </p>
              
              <p className="lg:text-lg xl:text-2xl text-gray-700 leading-relaxed">
                The company also conduct water testing and complete laboratory analysis for 
                water monitoring, chlorine/chloramines residual testing, bacteria testing 
                on potable water, industrial boiler water analysis, cooling water systems 
                treatment contracts and services.
              </p>

              <p className="lg:text-lg xl:text-2xl text-gray-700 leading-relaxed">
                Our company is also capable in the installation of cooling tower systems, 
                cooling tower assembly, water cooling tower systems, commercial water 
                treatment systems, industrial cooling towers, cooling towers and water 
                treatment equipment coupled with our experiences and vast technical expertise and 
                knowledge enable us to develop quality cost effective water treatment solutions for 
                various cooling tower and water heating systems and boiler water treatment as well as 
                commercial requirements.
              </p>

              <p className="lg:text-lg xl:text-2xl leading-relaxed font-semibold text-[#004785] text-center">
                We are totally dedicated to supply for your plants requirements and needs.
              </p>
            </div>
          </section>
        </div>

        <div className="bg-[#E1F0FB] mt-10 pt-20 px-25 rounded-t-[10%] pb-20 -mb-16">

          {/* Our Clients Section */}
          <section>
            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-center mb-12 text-[#004785]">
              Our Clients
            </h2>
            
            <div className="text-center mb-8">
              <p className="lg:text-lg xl:text-xl text-gray-700 leading-relaxed">
                TRISHKAYE ENTERPRISES & ALLIED SERVICES has been providing labor and <br />
                routine maintenance services to supplement customer needs.
              </p>
            </div>

            {/* Client Logos Grid */}
            <div className="grid grid-cols-2 gap-8">
              {/* Coca-Cola */}
              <div className="flex flex-col items-center p-6">
                <img
                  src="/images/logos/coke.png"
                  alt="Coca-Cola"
                  className="h-30 w-auto mb-4"
                />
                <div className="text-center">
                  <p className="font-bold text-lg text-[#004785] mb-5">COCA COLA</p>
                  <p className="font-semibold text-md">MERALCO CENTRAL PLANT</p>
                  <p className="font-light text-md">LOPEZ GROUP INC</p>
                </div>
              </div>

              {/* JVC */}
              <div className="flex flex-col items-center p-6">
                <img
                  src="/images/logos/jm.svg"
                  alt="JVC"
                  className="h-30 w-auto mb-4"
                />
                <div className="text-center">
                  <p className="font-bold text-lg text-[#004785] mb-5">JMATERIALS CORPORATION</p>
                  <p className="font-light text-md">Ayala Avenue, Makati City</p>
                </div>
              </div>

              {/* Amkor */}
              <div className="flex flex-col items-center p-6">
                <img
                  src="/images/logos/amkor.svg"
                  alt="Amkor Technology"
                  className="h-30 w-auto mb-4"
                />
                <div className="text-center">
                  <p className="font-bold text-lg text-[#004785] mb-5">AMKOR TECHNOLOGY PHILS INC.</p>
                  <p className="font-semibold text-md">P1 PLANT</p>
                  <p className="font-light text-md mb-5">Cupang, Muntinlupa</p>
                  <p className="font-semibold text-md">P3 PLANT</p>
                  <p className="font-light text-md">Binan, Laguna</p>
                </div>
              </div>

              {/* Team Sual */}
              <div className="flex flex-col items-center p-6">
                <img
                  src="/images/logos/team.png"
                  alt="Team Sual Corporation"
                  className="h-30 w-auto mb-4"
                />
                <div className="text-center">
                  <p className="font-bold text-lg text-[#004785] mb-5">TEAM ENERGY CORPORATION</p>
                  <p className="font-semibold text-md">SUAL POWER PLANT</p>
                  <p className="font-light text-md mb-5">Sual, Pangasinan</p>
                  <p className="font-semibold text-md">PAGBILAO POWER PLANT</p>
                  <p className="font-light text-md">Bay View Accomodation Plant</p>
                  <p className="font-light text-md">Pagbilao Power Station</p>
                  <p className="font-light text-md">Pagbilao, Quezon Province</p>
                </div>
              </div>  
            </div>
          </section>

        </div>
      </div>

      {/* Footer */}
      <Footer />
      <Vincent />
    </div>
  );
};

export default AboutUsPage;