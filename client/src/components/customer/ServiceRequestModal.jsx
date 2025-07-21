import React, { useState } from "react";
import { X, Trash2 } from "lucide-react";

const ServiceRequestModal = ({ onClose }) => {
  const [selectedServices, setSelectedServices] = useState([
    {
      id: 1,
      name: "Boiler Tube Cleaning",
      category: "Chemical Cleaning",
      basePrice: 20000,
      quantity: 1,
    },
    {
      id: 2,
      name: "Cooling Water Treatment",
      category: "Water Treatment",
      basePrice: 15000,
      quantity: 2,
    },
  ]);
  const [paymentMode, setPaymentMode] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [downpayment, setDownpayment] = useState("");
  const [remarks, setRemarks] = useState("");

  const updateQuantity = (serviceId, newQuantity) => {
    if (newQuantity <= 0) {
      removeService(serviceId);
    } else {
      setSelectedServices(
        selectedServices.map((s) =>
          s.id === serviceId ? { ...s, quantity: newQuantity } : s
        )
      );
    }
  };

  const removeService = (serviceId) => {
    setSelectedServices(selectedServices.filter((s) => s.id !== serviceId));
  };

  const calculateTotalCost = () => {
    return selectedServices.reduce(
      (total, service) => total + service.basePrice * service.quantity,
      0
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder for form submission
    console.log("Form submitted:", {
      selectedServices,
      paymentMode,
      paymentTerms,
      downpayment,
      remarks,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-white rounded-4xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-300 pb-3">
          <h2 className="text-3xl font-semibold text-[#3C61A8]">
            Request Form
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto mt-5 pr-4 mr-2">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Request Service Section */}
            <div>
              <h3 className="text-lg font-semibold text-[#004785] mb-4">
                Request Service
              </h3>

              {/* Selected Services Display */}
              {selectedServices.length > 0 && (
                <div className="space-y-3">
                  {selectedServices.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center gap-4 p-5 border border-gray-200 rounded-2xl shadow"
                    >
                      <div className="w-10 h-10 bg-[#4A90C2] rounded-lg flex items-center justify-center text-white font-semibold">
                        {service.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-gray-900">
                          {service.name}
                        </h5>
                        <p className="text-xs text-gray-600">
                          {service.category}
                        </p>
                      </div>
                      <div className="flex items-center gap-8">
                        <input
                          type="number"
                          min="1"
                          value={service.quantity}
                          onChange={(e) =>
                            updateQuantity(service.id, parseInt(e.target.value))
                          }
                          className="w-12 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                        <span className="text-sm font-semibold text-[#3C61A8]">
                          ₱
                          {(
                            service.basePrice * service.quantity
                          ).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeService(service.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Estimated Duration and Cost */}
            <div className="grid grid-cols-1 gap-4 px-4 border-b border-gray-300 pb-3">
              <div className="flex justify-between mt-2">
                <label className="text-base font-semibold text-[#004785]">
                  Estimated Duration
                </label>
                <div className="text-lg font-semibold text-[#004785]">
                  3 - 5 Days
                </div>
              </div>
              <div className="flex justify-between">
                <label className="text-base font-semibold text-[#004785]">
                  Estimated Cost
                </label>
                <div className="text-lg font-semibold text-[#004785]">
                  ₱ {calculateTotalCost().toLocaleString()}
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="border-b border-gray-300 pb-3">
              <h3 className="text-lg font-semibold text-[#004785] mb-4 px-4">
                Payment
              </h3>

              <div className="space-y-4 px-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-black">
                    Mode of Payment
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90C2] focus:border-transparent text-gray-400 text-sm"
                    required
                  >
                    <option value="">Choose Payment Terms</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-black">
                    Payment Terms
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90C2] focus:border-transparent text-gray-400 text-sm"
                    required
                  >
                    <option value="">Choose Payment Terms</option>
                    <option value="Full">Full Payment</option>
                    <option value="Down">Down Payment</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-black">
                    Downpayment
                  </label>
                  <select
                    value={downpayment}
                    onChange={(e) => setDownpayment(e.target.value)}
                    className="w-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90C2] focus:border-transparent text-gray-400 text-sm"
                    required
                  >
                    <option value="">Choose Payment Terms</option>
                    <option value="50%">50% DP, 50% Upon Completion</option>
                    <option value="20%">20% DP, 50% Upon Completion</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="text-lg font-semibold text-[#004785] mb-4 px-4">
                Remarks <span className="font-light text-sm">(Optional)</span>
              </label>
              <div className="mt-3 px-4">
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Type remarks"
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90C2] focus:border-transparent resize-none text-sm"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#004785] text-white rounded-lg hover:bg-[#003666] py-3 px-6 rounded-lg font-semibold transition-colors cursor-pointer"
            >
              Request
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ServiceRequestModal;
