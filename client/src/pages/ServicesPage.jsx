import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Hero from "../components/common/Hero";
import Footer from "../components/common/Footer";
import { LucideArrowLeft, LucideArrowRight } from "lucide-react";
import Vincent from "../components/common/Vincent";
import { serviceRequestsAPI } from "../config/api";

const ServicesPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState("All");
  const [services, setServices] = useState([]);
  const [chemicals, setChemicals] = useState([]);
  const [refrigerants, setRefrigerants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const servicesPerPage = 6;

  useEffect(() => {
    fetchCatalogData();
  }, []);

  const fetchCatalogData = async () => {
    try {
      setLoading(true);

      const servicesResponse = await serviceRequestsAPI.getServicesCatalog();
      const servicesData = await servicesResponse.json();

      let chemicalsData = { success: true, data: [] };
      try {
        const chemicalsResponse =
          await serviceRequestsAPI.getChemicalsCatalog();
        chemicalsData = await chemicalsResponse.json();
      } catch (chemError) {
        console.log("Chemicals not accessible:", chemError);
      }

      let refrigerantsData = { success: true, data: [] };
      try {
        const refrigerantsResponse =
          await serviceRequestsAPI.getRefrigerantsCatalog();
        refrigerantsData = await refrigerantsResponse.json();
      } catch (refrigerantError) {
        console.log("Refrigerants not accessible:", refrigerantError);
      }

      if (servicesData.success) {
        const transformedServices = servicesData.data.map((service) => ({
          id: service.service_id,
          title: service.name,
          description: service.description || "Professional service",
          category: service.category || "Services",
          type: "Services",
          price: `₱${service.base_price?.toLocaleString() || "10,000"}`,
          basePrice: service.base_price || 10000,
          duration: service.estimated_duration_hours
            ? Math.ceil(service.estimated_duration_hours / 24)
            : 3,
          estimated_duration_hours: service.estimated_duration_hours,
          requiresSiteVisit: service.requires_site_visit || false,
          chemicalsRequired: service.chemicals_required,
        }));

        setServices(transformedServices);
      }

      if (chemicalsData.success && chemicalsData.data.length > 0) {
        const transformedChemicals = chemicalsData.data.map((chemical) => ({
          id: `chem_${chemical.id}`,
          title: chemical.name,
          description: chemical.description || "High-quality chemical product",
          category: "Chemical Supply",
          type: "Chemicals",
          price: `₱${chemical.base_price?.toLocaleString() || "10,000"}`,
          basePrice: chemical.base_price || 10000,
          capacity: chemical.capacity,
          hazardType: chemical.hazard_type,
          uses: chemical.uses,
        }));

        setChemicals(transformedChemicals);
      }

      if (refrigerantsData.success && refrigerantsData.data.length > 0) {
        const transformedRefrigerants = refrigerantsData.data.map(
          (refrigerant) => ({
            id: `refrig_${refrigerant.id}`,
            title: refrigerant.name,
            description: refrigerant.description || "High-quality refrigerant",
            category: "Refrigerant Supply",
            type: "Refrigerants",
            price: `₱${refrigerant.base_price?.toLocaleString() || "10,000"}`,
            basePrice: refrigerant.base_price || 10000,
            capacity: refrigerant.capacity,
            hazardType: refrigerant.hazard_type,
            chemicalComponents: refrigerant.chemical_components,
          })
        );

        setRefrigerants(transformedRefrigerants);
      }
    } catch (error) {
      console.error("Error fetching catalog:", error);
      setError("Failed to load services catalog");
    } finally {
      setLoading(false);
    }
  };

  const getServiceIcon = (type) => {
    switch (type) {
      case "Services":
        return "🔧";
      case "Chemicals":
        return "⚗️";
      case "Refrigerants":
        return "❄️";
      default:
        return "🔧";
    }
  };

  const allServices = useMemo(() => {
    return [...services, ...chemicals, ...refrigerants];
  }, [services, chemicals, refrigerants]);

  const filteredServices = useMemo(() => {
    let filtered = allServices;

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
      if (activeFilter !== "All") {
        filtered = filtered.filter((service) => service.type === activeFilter);
      }
    }

    return filtered;
  }, [searchTerm, activeFilter, allServices]);

  const totalPages = Math.ceil(filteredServices.length / servicesPerPage);
  const startIndex = (currentPage - 1) * servicesPerPage;
  const currentServices = filteredServices.slice(
    startIndex,
    startIndex + servicesPerPage
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filterType) => {
    setActiveFilter(filterType);
    setCurrentPage(1);
    setSearchTerm("");
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
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

  const handleRequestClick = () => {
    setShowAuthModal(true);
  };

  const handleLoginRedirect = () => {
    navigate("/login");
  };

  const handleSignupRedirect = () => {
    navigate("/signup");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
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
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
        <Footer />
        <Vincent />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
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
        <div className="py-16 mx-18 lg:mx-30 xl:mx-60">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchCatalogData}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
        <Footer />
        <Vincent />
      </div>
    );
  }

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
                    className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col"
                  >
                    {/* Service Image/Icon */}
                    <div className="h-48 bg-gradient-to-br from-[#004785] to-[#0066b3] flex items-center justify-center">
                      <div className="text-white text-center p-8">
                        <div className="text-4xl mb-2">
                          {getServiceIcon(service.type)}
                        </div>
                        <div className="text-sm font-medium">
                          {service.type}
                        </div>
                      </div>
                    </div>

                    {/* Service Content */}
                    <div className="p-6 flex flex-col h-full">
                      <h3 className="text-xl font-bold text-[#004785] mb-3">
                        {service.title}
                      </h3>
                      <p className="text-[#004785] text-sm leading-relaxed font-light flex-grow">
                        {service.description}
                      </p>
                      <p className="text-[#004785] text-sm leading-relaxed mb-4 font-semibold">
                        Starts at {service.price}
                      </p>
                      <button
                        onClick={handleRequestClick}
                        className="w-full bg-[#004785] text-white py-3 px-4 rounded-lg hover:bg-[#003366] transition-colors duration-300 font-medium cursor-pointer mt-auto"
                      >
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
                <LucideArrowLeft className="w-4 mr-2" />
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
                    <span className="px-2 py-2 text-base text-gray-400">
                      ...
                    </span>
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
                <LucideArrowRight className="w-4 ms-2" />
              </button>
            </section>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />
      <Vincent />

      {/* Authentication Required Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-2xl font-bold text-[#004785] mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-6">
              You need to sign up or log in to request services. Please choose
              an option below.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleLoginRedirect}
                className="w-full bg-[#004785] text-white py-3 px-4 rounded-lg hover:bg-[#003366] transition-colors duration-300 font-medium cursor-pointer"
              >
                Log In
              </button>
              <button
                onClick={handleSignupRedirect}
                className="w-full bg-white text-[#004785] border-2 border-[#004785] py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors duration-300 font-medium cursor-pointer"
              >
                Sign Up
              </button>
              <button
                onClick={() => setShowAuthModal(false)}
                className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-300 font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
