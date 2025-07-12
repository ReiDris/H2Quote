import React from "react";
import { Link } from "react-router-dom";
import { MapPinIcon, PhoneIcon, EnvelopeIcon } from "@heroicons/react/24/solid";

const Footer = () => {
  return (
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
              <Link to="/">
                <img
                  src="/images/logos/TRISHKAYE LOGO SVG.svg"
                  alt="TRISHKAYE Logo"
                  className="w-50"
                />
              </Link>
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
              <Link
                to="/"
                onClick={() => window.scrollTo(0, 0)}
                className="text-white hover:text-amber-300 text-sm transition-colors"
              >
                Home
              </Link>
              <Link
                to="/about"
                onClick={() => window.scrollTo(0, 0)}
                className="text-white hover:text-amber-300 text-sm transition-colors"
              >
                About Us
              </Link>
              <Link
                to="/services"
                onClick={() => window.scrollTo(0, 0)}
                className="text-white hover:text-amber-300 text-sm transition-colors"
              >
                Services
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;