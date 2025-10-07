import React, { useState, useMemo } from "react";
import { X, Trash2 } from "lucide-react";
import { useServiceRequest } from "../../contexts/ServiceRequestContext";
import API_URL from '../config/api';

const ServiceRequestModal = ({ onClose }) => {
  const { selectedServices, updateQuantity, removeService, clearServices } = useServiceRequest();
  
  const [paymentMode, setPaymentMode] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [downpayment, setDownpayment] = useState("");
  const [remarks, setRemarks] = useState("");
  const [siteLocation, setSiteLocation] = useState("");
  const [preferredSchedule, setPreferredSchedule] = useState("");
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // State for success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [requestNumber, setRequestNumber] = useState("");

  const calculateTotalCost = () => {
    return selectedServices.reduce(
      (total, service) => total + service.basePrice * service.quantity,
      0
    );
  };

  const estimatedDuration = useMemo(() => {
    if (!selectedServices || selectedServices.length === 0) {
      return "1 - 3 Days";
    }

    let totalServiceDuration = 0;
    let hasServices = false;
    let hasChemicalsOrRefrigerants = false;

    selectedServices.forEach((service) => {
      if (service.type === "Services") {
        hasServices = true;
        let serviceDuration = 3;

        if (
          service.estimated_duration_hours &&
          service.estimated_duration_hours > 0
        ) {
          serviceDuration = Math.ceil(service.estimated_duration_hours / 24);
        } else if (service.duration && service.duration > 0) {
          serviceDuration = service.duration;
        }

        totalServiceDuration += serviceDuration;
      } else if (
        service.type === "Chemicals" ||
        service.type === "Refrigerants"
      ) {
        hasChemicalsOrRefrigerants = true;
      }
    });

    let finalDuration;

    if (hasServices) {
      finalDuration = totalServiceDuration;
    } else if (hasChemicalsOrRefrigerants) {
      return "1 - 2 Days";
    } else {
      finalDuration = 1;
    }

    const minDuration = finalDuration;
    const maxWithBuffer =
      finalDuration + Math.min(2, Math.ceil(finalDuration * 0.2));

    return `${minDuration} - ${maxWithBuffer} Days`;
  }, [selectedServices]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedServices.length === 0) {
      setError("Please select at least one service");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("h2quote_token");
      
      const transformedServices = selectedServices.map((service) => ({
        id: service.id,
        quantity: service.quantity,
      }));

      const requestData = {
        selectedServices: transformedServices,
        paymentMode,
        paymentTerms,
        downpayment,
        remarks,
        siteLocation,
        preferredSchedule,
        specialRequirements,
      };

      const response = await fetch(
        `${API_URL}/api/service-requests`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      const data = await response.json();

      if (data.success) {
        setRequestNumber(data.data.requestNumber);
        setShowSuccessModal(true);

        clearServices();
        setPaymentMode("");
        setPaymentTerms("");
        setDownpayment("");
        setRemarks("");
        setSiteLocation("");
        setPreferredSchedule("");
        setSpecialRequirements("");
      } else {
        setError(data.message || "Failed to create service request");
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      setError("Failed to submit service request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
        <div className="bg-white rounded-4xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-10">
          <div className="flex items-center justify-between border-b border-gray-300 pb-3">
            <h2 className="text-3xl font-semibold text-[#3C61A8]">
              Request Form
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              disabled={isSubmitting}
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto mt-5 pr-4 mr-2">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-[#004785] mb-4">
                  Request Service
                </h3>

                {selectedServices.length > 0 ? (
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
                              updateQuantity(
                                service.id,
                                parseInt(e.target.value)
                              )
                            }
                            className="w-12 px-2 py-1 border border-gray-300 rounded text-center"
                            disabled={isSubmitting}
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
                            disabled={isSubmitting}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No services selected. Please go back and select services.
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Site Location
                  </label>
                  <input
                    type="text"
                    value={siteLocation}
                    onChange={(e) => setSiteLocation(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90C2] focus:border-transparent text-sm"
                    placeholder="Enter service location"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Preferred Schedule
                  </label>
                  <input
                    type="date"
                    value={preferredSchedule}
                    onChange={(e) => setPreferredSchedule(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90C2] focus:border-transparent text-sm"
                    min={new Date().toISOString().split("T")[0]}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Special Requirements
                  </label>
                  <textarea
                    value={specialRequirements}
                    onChange={(e) => setSpecialRequirements(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90C2] focus:border-transparent text-sm"
                    placeholder="Any special requirements or notes"
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 px-4 border-b border-gray-300 pb-3">
                <div className="flex justify-between mt-2">
                  <label className="text-base font-semibold text-[#004785]">
                    Estimated Duration
                  </label>
                  <div className="text-lg font-semibold text-[#004785]">
                    {estimatedDuration}
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
                      disabled={isSubmitting}
                    >
                      <option value="">Choose Payment Mode</option>
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="check">Check</option>
                      <option value="gcash">GCash</option>
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
                      disabled={isSubmitting}
                    >
                      <option value="">Choose Payment Terms</option>
                      <option value="Full">Full Payment</option>
                      <option value="Down">Down Payment</option>
                    </select>
                  </div>

                  {paymentTerms === "Down" && (
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-black">
                        Downpayment
                      </label>
                      <select
                        value={downpayment}
                        onChange={(e) => setDownpayment(e.target.value)}
                        className="w-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90C2] focus:border-transparent text-gray-400 text-sm"
                        required
                        disabled={isSubmitting}
                      >
                        <option value="">Choose Downpayment</option>
                        <option value="50%">50% DP, 50% Upon Completion</option>
                        <option value="30%">30% DP, 70% Upon Completion</option>
                        <option value="20%">20% DP, 80% Upon Completion</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

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
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add More Items
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || selectedServices.length === 0}
                  className="flex-1 bg-[#004785] text-white rounded-lg hover:bg-[#003666] py-3 px-6 font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </div>
                  ) : (
                    "Submit Request"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-3xl p-5 w-120 max-w-md mx-4">
            <h2 className="text-lg font-bold text-[#004785] mb-4 pb-2 border-b border-gray-200">
              Request Submitted
            </h2>
            <p className="text-black mb-6 text-sm">
              Service request created successfully!
              <br />
              <span className="font-semibold">
                Request Number: {requestNumber}
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCloseSuccessModal}
                className="flex-1 px-4 py-2 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ServiceRequestModal;