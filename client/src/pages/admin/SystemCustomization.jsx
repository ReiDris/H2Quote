import React, { useState, useEffect } from "react";
import { Settings, Bot, Package, Droplet, TestTube } from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";
import ChatbotSettings from "../../components/admin/customization/ChatbotSettings";
import ServicesSettings from "../../components/admin/customization/ServicesSettings";
import ChemicalsSettings from "../../components/admin/customization/ChemicalsSettings";
import RefrigerantsSettings from "../../components/admin/customization/RefrigerantsSettings";

/**
 * System Customization Page
 * 
 * This page allows administrators to customize:
 * - Chatbot prompts and responses
 * - Services catalog (add/edit services, prices, durations)
 * - Chemicals catalog (add/edit chemicals and prices)
 * - Refrigerants catalog (add/edit refrigerants and prices)
 * 
 * Navigation is done through tabs at the top of the page
 * Each tab loads a different settings component
 */

const SystemCustomization = () => {
  // Active tab state - determines which settings panel to show
  const [activeTab, setActiveTab] = useState("chatbot");
  const [loading, setLoading] = useState(false);

  // Tab configuration - defines all available customization categories
  const tabs = [
    {
      id: "chatbot",
      label: "Chatbot Settings",
      icon: Bot,
      description: "Manage chatbot prompts and responses"
    },
    {
      id: "services",
      label: "Services Catalog",
      icon: Package,
      description: "Manage services, prices, and durations"
    },
    {
      id: "chemicals",
      label: "Chemicals Catalog",
      icon: TestTube,
      description: "Manage chemical products and pricing"
    },
    {
      id: "refrigerants",
      label: "Refrigerants Catalog",
      icon: Droplet,
      description: "Manage refrigerant products and pricing"
    }
  ];

  // Component mapping - which component to render for each tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "chatbot":
        return <ChatbotSettings />;
      case "services":
        return <ServicesSettings />;
      case "chemicals":
        return <ChemicalsSettings />;
      case "refrigerants":
        return <RefrigerantsSettings />;
      default:
        return <ChatbotSettings />;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="p-2">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-semibold text-[#004785]">
              System Customization
            </h1>
          </div>
          <p className="text-gray-600 text-sm">
            Customize chatbot responses, manage service catalogs, and update product information
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-300">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                      isActive
                        ? "border-[#004785] text-[#004785]"
                        : "border-transparent text-gray-600 hover:text-[#004785] hover:border-gray-300"
                    }`}
                  >
                    <IconComponent size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Current Tab Description */}
            <div className="mb-6 pb-4 border-b border-gray-200">
              <p className="text-gray-600 text-sm">
                {tabs.find(tab => tab.id === activeTab)?.description}
              </p>
            </div>

            {/* Render Active Tab Component */}
            {renderTabContent()}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SystemCustomization;