import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye, Upload, MessageCircle } from "lucide-react";
import CustomerLayout from "../../layouts/CustomerLayout";
import PaymentProofUploadModal from "./PaymentProofUploadModal";
import PaymentProofViewer from "../../components/shared/PaymentProofViewer";
import { serviceRequestsAPI } from "../../config/api";

const CustomerServiceRequestDetails = () => {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Payment proof modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewingPaymentId, setViewingPaymentId] = useState(null);
  const [viewingFileName, setViewingFileName] = useState("");



  const formatPaymentMode = (mode) => {
    const modeMap = {
      bank_transfer: "Bank Transfer",
      cash: "Cash",
      check: "Check",
      gcash: "GCash",
    };
    return modeMap[mode] || mode;
  };

  useEffect(() => {
    if (requestId) {
      fetchRequestDetails();
    }
  }, [requestId]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("h2quote_token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await serviceRequestsAPI.getDetails(requestId);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("h2quote_token");
          navigate("/login");
          return;
        }
        if (response.status === 404) {
          setError("Service request not found");
          return;
        }
        throw new Error("Failed to fetch request details");
      }

      const data = await response.json();

      if (data.success) {
        const { request: requestDetails, items } = data.data;

        const transformedData = {
          id: requestDetails.request_number,
          requestId: requestDetails.request_id, // Store the actual request_id
          requestedAt: requestDetails.requested_at,
          serviceStatus: requestDetails.service_status,
          paymentStatus: requestDetails.payment_status,
          warrantyStatus: requestDetails.warranty_status,
          services: (items || []).map((item) => ({
            category: item.service_category || item.category,
            service: item.service || item.name,
            remarks: item.remarks || "-",
            quantity: item.quantity,
            unitPrice: item.unit_price,
            totalPrice: item.total_price,
          })),
          paymentHistory: requestDetails.paymentHistory || [],
          estimatedDuration: requestDetails.estimated_duration || "3 - 7 Days",
          totalCost: requestDetails.totalCost,
          paymentMode: requestDetails.payment_mode || "-",
          paymentTerms: requestDetails.payment_terms || "-",
          paymentDeadline: requestDetails.payment_deadline || "-",
          assignedStaff: requestDetails.assigned_staff_name || "-",
          serviceStartDate: requestDetails.service_start_date || "-",
          estimatedEndDate: requestDetails.estimated_end_date || "-",
          warranty: requestDetails.warranty || "6 months",
        };

        setRequestData(transformedData);
        setError("");
      } else {
        setError(data.message || "Failed to fetch request details");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to fetch request details");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    fetchRequestDetails();
  };

  const handleViewProof = (paymentId, fileName) => {
    setViewingPaymentId(paymentId);
    setViewingFileName(fileName);
    setIsViewerOpen(true);
  };

  // Navigate to compose message page with request context
  const handleMessageTrishkaye = () => {
    navigate("/customer/messages/compose", {
      state: {
        requestId: requestData?.requestId || requestId,
        requestNumber: requestData?.id
      }
    });
  };

  const handleApproveQuotation = () => {
    // TODO: Implement approval logic
    console.log("Approve quotation clicked");
  };

  const getStatusBadge = (status, type) => {
    const statusStyles = {
      serviceStatus: {
        Pending: "bg-gray-100 text-gray-800",
        Assigned: "bg-orange-200 text-orange-600",
        "Waiting for Approval": "bg-purple-100 text-purple-800",
        Approved: "bg-purple-100 text-purple-800",
        Ongoing: "bg-blue-100 text-blue-800",
        Completed: "bg-green-100 text-green-800",
        Cancelled: "bg-red-100 text-red-800",
      },
      paymentStatus: {
        Pending: "bg-gray-100 text-gray-800",
        Partial: "bg-blue-100 text-blue-800",
        Paid: "bg-green-100 text-green-800",
        Overdue: "bg-red-100 text-red-800",
        "N/A": "bg-gray-100 text-gray-500",
      },
      warrantyStatus: {
        Pending: "bg-gray-100 text-gray-800",
        Valid: "bg-green-100 text-green-800",
        Expired: "bg-red-100 text-red-800",
        "N/A": "bg-gray-100 text-gray-500",
      },
    };

    const style = statusStyles[type][status] || "bg-gray-100 text-gray-800";
    return (
      <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${style}`}>
        {status}
      </span>
    );
  };

  const StatusTracker = () => {
    const steps = [
      { label: "Pending", key: "pending" },
      { label: "Assigned for Processing", key: "processing" },
      { label: "Waiting for Approval", key: "waiting_approval" },
      { label: "Approved", key: "approved" },
      { label: "Service Ongoing", key: "ongoing" },
      { label: "Completed", key: "completed" },
    ];

    const getCurrentStep = () => {
      if (!requestData) return 0;

      switch (requestData.serviceStatus) {
        case "Pending":
          return 0;
        case "Assigned":
        case "Processing":
          return 1;
        case "Waiting for Approval":
          return 2;
        case "Approved":
          return 3;
        case "Ongoing":
          return 4;
        case "Completed":
          return 5;
        default:
          return 0;
      }
    };

    const currentStep = getCurrentStep();

    return (
      <div className="my-8">
        <div className="flex items-start justify-between overflow-x-auto">
          {steps.map((step, index) => (
            <div
              key={step.key}
              className="flex items-center min-w-0 flex-shrink-0"
            >
              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-semibold ${
                    index <= currentStep
                      ? "text-[#0260A0] border-2 border-[#0260A0]"
                      : "text-gray-400 border-2 border-gray-400"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </div>
                <span
                  className={`mt-2 text-sm text-center w-23 h-10 ${
                    index <= currentStep
                      ? "text-[#0260A0] font-semibold"
                      : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="flex items-center -mt-10">
                  <div
                    className={`w-2 lg:w-10 xl:w-25 2xl:w-34 h-0.5 flex-shrink-0 ${
                      index < currentStep ? "bg-[#0260A0]" : "bg-gray-200"
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading request details...</p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (error) {
    return (
      <CustomerLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
            {error}
          </div>
          <button
            onClick={() => navigate("/customer/service-tracker")}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back to Service Tracker
          </button>
        </div>
      </CustomerLayout>
    );
  }

  if (!requestData) {
    return (
      <CustomerLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Request not found</p>
          <button
            onClick={() => navigate("/customer/service-tracker")}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back to Service Tracker
          </button>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="pt-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/customer/service-tracker")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 cursor-pointer"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        </div>

        <div className="p-6">
          <StatusTracker />
        </div>

        {/* Approval Notification Banner */}
        {requestData.serviceStatus === "Waiting for Approval" && (
          <div className="mx-6 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-[#004785] font-semibold text-base mb-2">
                    Quotation Revised – Please Review
                  </h3>
                  <p className="text-gray-700 text-sm mb-4">
                    The final quotation for your request has been updated.
                    Please review the details before proceeding.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={handleMessageTrishkaye}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#004785] text-[#004785] rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium"
                    >
                      <MessageCircle size={18} />
                      Message TRISHKAYE
                    </button>
                    <button
                      onClick={handleApproveQuotation}
                      className="px-4 py-3 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors cursor-pointer text-sm font-medium"
                    >
                      Approve Updated Quotation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rest of the component remains the same... */}
        {/* (Service Details, Payment sections, etc.) */}

      </div>

      {/* Payment Proof Modals */}
      <PaymentProofUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setSelectedPaymentId(null);
        }}
        paymentId={selectedPaymentId}
        currentProof={
          requestData?.paymentHistory.find(
            (p) => p.payment_id === selectedPaymentId
          )?.proofOfPayment || "-"
        }
        onSuccess={handleUploadSuccess}
      />

      <PaymentProofViewer
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setViewingPaymentId(null);
        }}
        paymentId={viewingPaymentId}
        fileName={viewingFileName}
      />
    </CustomerLayout>
  );
};

export default CustomerServiceRequestDetails;