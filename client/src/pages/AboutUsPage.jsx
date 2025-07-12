import React from "react";
import Hero from "../components/common/Hero";
import Footer from "../components/common/Footer";

const AboutUsPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <Hero 
        title="About Us"
        subtitle="TRISHKAYE ENTERPRISES & ALLIED SERVICES"
        showButton={false}
        sectionId="about-hero"
      />

      {/* Main Content */}
      <div className="py-16">
        <div className="mx-18 lg:mx-25">
          
          {/* Company Profile Section */}
          <section className="mb-16">
            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-center mb-12 text-[#004785]">
              Company Profile
            </h2>
            
            {/* Company Image */}
            <div className="mb-12">
              <img
                src="/images/site/company-building.jpg"
                alt="TRISHKAYE Company Building"
                className="w-full h-64 lg:h-96 object-cover rounded-lg shadow-lg"
              />
            </div>

            {/* Company Description */}
            <div className="space-y-6 text-justify">
              <p className="lg:text-lg xl:text-xl text-gray-700 leading-relaxed">
                TRISHKAYE Enterprises & Allied Services supply and serve in various industries 
                plants and facilities, malls, buildings, hospitals, educational institutions, 
                hotels and resorts and commercial establishments.
              </p>
              
              <p className="lg:text-lg xl:text-xl text-gray-700 leading-relaxed">
                The company also conduct water testing and complete laboratory analysis for 
                water monitoring, chlorine/chloramines residual testing, bacteria testing 
                on potable water, industrial boiler water analysis, cooling water systems 
                treatment contracts and services.
              </p>

              <p className="lg:text-lg xl:text-xl text-gray-700 leading-relaxed">
                Our company is also capable in the installation of cooling tower systems, 
                cooling tower assembly, water cooling tower systems, commercial water 
                treatment systems, industrial cooling towers, cooling towers and water 
                treatment equipment coupled with our experiences and vast technical expertise and 
                knowledge enable us to develop quality cost effective water treatment solutions for 
                various cooling tower and water heating systems and boiler water treatment as well as 
                commercial requirements.
              </p>

              <p className="lg:text-lg xl:text-xl text-gray-700 leading-relaxed font-semibold text-[#004785]">
                We are totally dedicated to supply for your plants requirements and needs.
              </p>
            </div>
          </section>

          {/* Team Photo Section */}
          <section className="mb-16">
            <div className="bg-gray-50 rounded-lg p-8">
              <img
                src="/images/site/team-photo.jpg"
                alt="TRISHKAYE Team"
                className="w-full h-80 lg:h-96 object-cover rounded-lg shadow-md"
              />
              <p className="text-center text-gray-600 mt-4 italic">
                The dedicated team at TRISHKAYE Enterprises & Allied Services
              </p>
            </div>
          </section>

          {/* Our Clients Section */}
          <section className="mb-16">
            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-center mb-12 text-[#004785]">
              Our Clients
            </h2>
            
            <div className="text-center mb-8">
              <p className="lg:text-lg xl:text-xl text-gray-700 leading-relaxed">
                TRISHKAYE ENTERPRISES & ALLIED SERVICES has been providing labor and 
                routine maintenance services to supplement customer needs.
              </p>
            </div>

            {/* Client Logos Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 items-center">
              {/* Coca-Cola */}
              <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <img
                  src="/images/clients/coca-cola-logo.png"
                  alt="Coca-Cola"
                  className="h-16 w-auto mb-4"
                />
                <div className="text-center">
                  <p className="font-semibold text-sm text-gray-800">COCA-COLA</p>
                  <p className="text-xs text-gray-600">MERALCO CENTRAL PLANT</p>
                  <p className="text-xs text-gray-600">LOPEZ GROUP INC</p>
                </div>
              </div>

              {/* JVC */}
              <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <img
                  src="/images/clients/jvc-logo.png"
                  alt="JVC"
                  className="h-16 w-auto mb-4"
                />
                <div className="text-center">
                  <p className="font-semibold text-sm text-gray-800">JMaterials Corporation</p>
                  <p className="text-xs text-gray-600">AYALA ALABANG VILLAGE CITY</p>
                </div>
              </div>

              {/* Amkor */}
              <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <img
                  src="/images/clients/amkor-logo.png"
                  alt="Amkor Technology"
                  className="h-16 w-auto mb-4"
                />
                <div className="text-center">
                  <p className="font-semibold text-sm text-gray-800">AMKOR TECHNOLOGY PHILS INC.</p>
                  <p className="text-xs text-gray-600">FTI TAGUIG</p>
                  <p className="text-xs text-gray-600">Cooling Waterlineage</p>
                </div>
              </div>

              {/* Team Sual */}
              <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <img
                  src="/images/clients/team-sual-logo.png"
                  alt="Team Sual Corporation"
                  className="h-16 w-auto mb-4"
                />
                <div className="text-center">
                  <p className="font-semibold text-sm text-gray-800">TEAM SUAL CORPORATION</p>
                  <p className="text-xs text-gray-600">SUAL POWER PLANT</p>
                  <p className="text-xs text-gray-600">PANGASINAN POWER PLANT</p>
                  <p className="text-xs text-gray-600">Sea Water and Demineralized Water</p>
                  <p className="text-xs text-gray-600">Products Generic Protocol</p>
                </div>
              </div>

              {/* Team Energy */}
              <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <img
                  src="/images/clients/team-energy-logo.png"
                  alt="Team Energy Corporation"
                  className="h-16 w-auto mb-4"
                />
                <div className="text-center">
                  <p className="font-semibold text-sm text-gray-800">TEAM ENERGY CORPORATION</p>
                  <p className="text-xs text-gray-600">PAGBILAO POWER PLANT</p>
                  <p className="text-xs text-gray-600">Sea Water and Boiler Water</p>
                  <p className="text-xs text-gray-600">Cooling Tower Water Descaling and</p>
                  <p className="text-xs text-gray-600">PAGBILAO POWER PLANT</p>
                  <p className="text-xs text-gray-600">Preventive Power Plant</p>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AboutUsPage;