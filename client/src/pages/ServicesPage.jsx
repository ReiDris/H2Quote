import React, { useState, useMemo } from "react";
import Hero from "../components/common/Hero";
import Footer from "../components/common/Footer";
import {
    LucideArrowLeft,
    LucideArrowRight
} from "lucide-react";
import Vincent from '../components/common/Vincent';


const ServicesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState("All");
  const servicesPerPage = 6;

  // Sample services data - replace with your actual services
  const allServices = [
    // Services
    {
      id: 1,
      title: "Boiler Tube Cleaning",
      description:
        "Chemical cleaning of industrial equipment, descaling and maintenance services for optimal boiler performance.",
      image: "/images/services/boiler-cleaning.jpg",
      category: "Chemical Cleaning",
      type: "Services",
      price: "P10,000",
    },
    {
      id: 2,
      title: "Cooling Water Treatment",
      description:
        "Comprehensive cooling water treatment solutions including chemical dosing and system optimization.",
      image: "/images/services/cooling-water.jpg",
      category: "Water Treatment",
      type: "Services",
      price: "P10,000",
    },
    {
      id: 3,
      title: "Water Testing & Analysis",
      description:
        "Complete laboratory analysis for water monitoring, chlorine residual testing, and bacteria testing.",
      image: "/images/services/water-testing.jpg",
      category: "Laboratory Services",
      type: "Services",
      price: "P10,000",
    },
    {
      id: 4,
      title: "Pipeline Disinfection",
      description:
        "Professional water pipeline disinfection services ensuring safe and clean water distribution.",
      image: "/images/services/pipeline.jpg",
      category: "Disinfection",
      type: "Services",
      price: "P10,000",
    },
    {
      id: 5,
      title: "Cooling Tower Installation",
      description:
        "Expert installation of cooling tower systems, assembly, and water cooling tower systems.",
      image: "/images/services/cooling-tower.jpg",
      category: "Installation",
      type: "Services",
      price: "P10,000",
    },
    {
      id: 6,
      title: "System Maintenance",
      description:
        "Routine maintenance services for cooling towers and water treatment equipment.",
      image: "/images/services/maintenance.jpg",
      category: "Maintenance",
      type: "Services",
      price: "P10,000",
    },
    // Chemicals
    {
      id: 7,
      title: "Corrosion Inhibitors",
      description:
        "High-quality corrosion inhibitors to protect metal surfaces in water systems and industrial equipment.",
      image: "/images/services/corrosion-inhibitors.jpg",
      category: "Chemical Supply",
      type: "Chemicals",
      price: "P10,000",
    },
    {
      id: 8,
      title: "Disinfectants",
      description:
        "Professional-grade disinfectants for water treatment and sanitization applications.",
      image: "/images/services/disinfectants.jpg",
      category: "Chemical Supply",
      type: "Chemicals",
      price: "P10,000",
    },
    {
      id: 9,
      title: "Descaling Chemicals",
      description:
        "Effective descaling chemicals for removing mineral deposits and scale buildup.",
      image: "/images/services/descaling-chemicals.jpg",
      category: "Chemical Supply",
      type: "Chemicals",
      price: "P10,000",
    },
    {
      id: 10,
      title: "Water Treatment Polymers",
      description:
        "Specialized polymers for various water treatment applications and system optimization.",
      image: "/images/services/polymers.jpg",
      category: "Chemical Supply",
      type: "Chemicals",
      price: "P10,000",
    },
    // Refrigerants
    {
      id: 11,
      title: "R-134a Refrigerant",
      description:
        "High-purity R-134a refrigerant for automotive and commercial cooling applications.",
      image: "/images/services/r134a.jpg",
      category: "Refrigerant Supply",
      type: "Refrigerants",
      price: "P10,000",
    },
    {
      id: 12,
      title: "R-410A Refrigerant",
      description:
        "Premium R-410A refrigerant for residential and commercial air conditioning systems.",
      image: "/images/services/r410a.jpg",
      category: "Refrigerant Supply",
      type: "Refrigerants",
      price: "P10,000",
    },
    {
      id: 13,
      title: "R-22 Refrigerant",
      description:
        "R-22 refrigerant for legacy HVAC systems and specialized cooling applications.",
      image: "/images/services/r22.jpg",
      category: "Refrigerant Supply",
      type: "Refrigerants",
      price: "P10,000",
    },
    {
      id: 14,
      title: "Industrial Refrigerants",
      description:
        "Wide range of industrial refrigerants for large-scale cooling and refrigeration systems.",
      image: "/images/services/industrial-refrigerants.jpg",
      category: "Refrigerant Supply",
      type: "Refrigerants",
      price: "P10,000",
    },
  ];

  // Filter services based on search term and active filter
  const filteredServices = useMemo(() => {
    let filtered = allServices;

    // If there's a search term, search across ALL services regardless of filter
    if (searchTerm) {
      filtered = allServices.filter(
        (service) =>
          service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          service.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      // Only apply type filter when there's no search term
      if (activeFilter !== "All") {
        filtered = filtered.filter((service) => service.type === activeFilter);
      }
    }

    return filtered;
  }, [searchTerm, activeFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredServices.length / servicesPerPage);
  const startIndex = (currentPage - 1) * servicesPerPage;
  const currentServices = filteredServices.slice(
    startIndex,
    startIndex + servicesPerPage
  );

  // Handle search
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle filter change
  const handleFilterChange = (filterType) => {
    setActiveFilter(filterType);
    setCurrentPage(1);
    setSearchTerm("");
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to the services content area instead of top of page
    const servicesContent = document.getElementById("services-grid");
    if (servicesContent) {
      servicesContent.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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
        title="SERVICES"
        subtitle="TRISHKAYE ENTERPRISES & ALLIED SERVICES"
        showButton={true}
        onButtonClick={() => handleNavigation("services-content")}
        sectionId="services-hero"
        titleWeight="font-bold"
        subtitleWeight="font-extralight"
        titleSize="text-4xl lg:text-5xl xl:text-7xl"
        subtitleSize="text-4xl xl:text-6xl"
      />

      {/* Main Content */}
      <div className="py-16" id="services-content">
        <div className="mx-18 lg:mx-30 xl:mx-60">
          {/* Services Introduction */}
          <section className="mb-12">
            <div className="text-justify mb-8">
              <p className="lg:text-lg xl:text-2xl text-gray-700 leading-relaxed mb-5">
                We provide full-service O&M solutions for facilities and
                engineering networks, managing everything or specific tasks for
                a set period.
              </p>
              <p className="lg:text-lg xl:text-2xl text-gray-700 leading-relaxed mb-5">
                Our Operations and Maintenance Services are tailored to your
                needs, covering performance monitoring, preventive and
                corrective maintenance, and the supply of necessary chemicals.
                <br />
              </p>
              <p className="lg:text-lg xl:text-2xl text-gray-700 leading-relaxed">
                Count on us for comprehensive after-sales service to ensure the
                smooth operation of your water systems, including cooling,
                boiler, filtration, softening, potable water, and wastewater
                treatment <br />
              </p>
            </div>
          </section>

          {/* Search Bar and Filter Buttons */}
          <section className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {["All", "Services", "Chemicals", "Refrigerants"].map(
                  (filter) => (
                    <button
                      key={filter}
                      onClick={() => handleFilterChange(filter)}
                      className={`px-4 py-2 xl:text-lg transition-colors duration-300 ${
                        activeFilter === filter
                          ? "text-[#004785] font-semibold border-b-2 border-b-[#004785] cursor-pointer"
                          : "text-gray-700 hover:border-b-2 hover:border-b-[#004785] hover:text-[#004785] cursor-pointer"
                      }`}
                    >
                      {filter}
                    </button>
                  )
                )}
              </div>

              {/* Search Bar */}
              <div className="lg:w-[35%] xl:w-[50%]">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004785] focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Filter Indicator */}
            {searchTerm && (
              <div className="mt-4 text-center">
                <p className="text-gray-600">
                  Showing search results for "
                  <span className="font-semibold">{searchTerm}</span>" across
                  all service types
                  {" - "}
                  <span className="font-semibold">
                    {filteredServices.length}
                  </span>
                  {filteredServices.length === 1 ? " result" : " results"} found
                </p>
              </div>
            )}
          </section>

          {/* Services Grid */}
          <section className="mb-12" id="services-grid">
            {currentServices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {currentServices.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  >
                    {/* Service Image */}
                    <div className="h-48 bg-gradient-to-br from-[#004785] to-[#0066b3] flex items-center justify-center">
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback icons based on service type
                          const icons = {
                            Services: "🔧",
                            Chemicals: "⚗️",
                            Refrigerants: "❄️",
                          };
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML = `
                            <div class="text-white text-center p-8">
                              <div class="text-4xl mb-2">${
                                icons[service.type] || "🔧"
                              }</div>
                              <div class="text-sm font-medium">${
                                service.type
                              }</div>
                            </div>
                          `;
                        }}
                      />
                    </div>

                    {/* Service Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-[#004785] mb-3">
                        {service.title}
                      </h3>
                      <p className="text-[#004785] text-sm leading-relaxed mb-4 font-light">
                        {service.description}
                      </p>
                      <p className="text-[#004785] text-sm leading-relaxed mb-4 font-semibold">
                        Starts at {service.price}
                      </p>
                      <button className="w-full bg-[#004785] text-white py-3 px-4 rounded-lg hover:bg-[#003366] transition-colors duration-300 font-medium">
                        Request
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No services found
                </h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? "Try adjusting your search terms or select a different category."
                    : "No services available in this category."}
                </p>
                {(searchTerm || activeFilter !== "All") && (
                  <button
                    onClick={() => {
                      setActiveFilter("All");
                      setSearchTerm("");
                      setCurrentPage(1);
                    }}
                    className="mt-4 px-4 py-2 bg-[#004785] text-white rounded-lg hover:bg-[#003366] transition-colors duration-300"
                  >
                    Show All Services
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Pagination */}
          {totalPages > 1 && (
            <section className="flex justify-between items-center w-full">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center px-3 py-2 border rounded-xl xl:text-base font-medium transition-colors duration-300 cursor-pointer ${
                  currentPage === 1
                    ? "text-gray-400 cursor-not-allowed border-gray-400"
                    : "text-gray-600 hover:text-[#004785] hover:border-[#004785]"
                }`}
              >
                <LucideArrowLeft className="w-4 mr-2"/>
                Previous
              </button>

              {/* Page Numbers - Centered */}
              <div className="flex items-center space-x-3">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 text-base font-medium rounded-md transition-colors duration-300 cursor-pointer ${
                        currentPage === pageNum
                          ? "bg-gray-200 text-gray-600"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {/* Ellipsis if needed */}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="px-2 py-2 text-base text-gray-400">...</span>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors duration-300"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`flex items-center px-3 py-2 border rounded-xl text-sm font-medium transition-colors duration-300 cursor-pointer ${
                  currentPage === totalPages
                    ? "text-gray-400 cursor-not-allowed border-gray-400"
                    : "text-gray-600 hover:text-[#004785] hover:border-[#004785]"
                }`}
              >
                Next
                <LucideArrowRight className="w-4 ms-2"/>
              </button>
            </section>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />
      <Vincent />
    </div>
  );
};

export default ServicesPage;
