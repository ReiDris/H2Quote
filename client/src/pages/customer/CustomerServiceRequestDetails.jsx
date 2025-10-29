import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye, Upload, MessageCircle } from "lucide-react";
import CustomerLayout from "../../layouts/CustomerLayout";
import PaymentProofUploadModal from "./PaymentProofUploadModal";
import PaymentProofViewer from "../../components/shared/PaymentProofViewer";
import { serviceRequestsAPI } from "../../config/api";
import { formatPaymentDate, formatDateTime } from "../../utils/dateUtils";

const CustomerServiceRequestDetails = () => {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State for approval modal
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState(false);
  const [approvalError, setApprovalError] = useState("");

  const formatPaymentMode = (mode) => {
    const modeMap = {
      bank_transfer: "Bank Transfer",
      cash: "Cash",
      check: "Check",
      gcash: "GCash",
    };
    return modeMap[mode] || mode;
  };

  // Helper function to calculate subtotal (before discount) from services
  const calculateSubtotal = () => {
    if (!requestData || !requestData.services) return 0;
    
    return requestData.services.reduce((sum, service) => {
      // Remove currency symbol and parse the number
      const price = parseFloat(
        service.totalPrice.replace(/[₱,]/g, "").trim()
      );
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
  };

  // Payment proof modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewingPaymentId, setViewingPaymentId] = useState(null);
  const [viewingFileName, setViewingFileName] = useState("");

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
        const { request: requestDetails, items, quotation } = data.data;

        const transformedData = {
          id: requestDetails.request_number,
          requestId: requestDetails.request_id,
          requestedAt: requestDetails.requested_at,
          requestAcknowledgedDate: requestDetails.request_acknowledged_date || "-",
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
          discountPercentage: requestDetails.discount_percentage || 0,
          paymentMode: requestDetails.payment_mode || "-",
          paymentTerms: requestDetails.payment_terms || "-",
          paymentDeadline: requestDetails.payment_deadline || "-",
          assignedStaff: requestDetails.assigned_staff_name || "-",
          serviceStartDate: requestDetails.service_start_date || "-",
          serviceEndDate: requestDetails.service_end_date || "-",
          estimatedEndDate: requestDetails.estimated_end_date || "-",
          warranty: requestDetails.warranty || "6 months",
          statusName: requestDetails.status_name, // Backend status name
          quotation: quotation, // Store quotation information
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

  const handleMessageTrishkaye = () => {
    navigate("/customer/messages/compose", {
      state: {
        requestId: requestData?.requestId || requestId,
        requestNumber: requestData?.id,
      },
    });
  };

  // ✅ UPDATED: Approve service request directly (quotation auto-created on submit)
  const handleApproveQuotation = async () => {
  setApprovalLoading(true);
  setApprovalError("");

  try {
    const token = localStorage.getItem("h2quote_token");
    
    console.log('🚀 Sending approve request:', requestData.requestId); // ADD THIS
    
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/api/service-requests/${requestData.requestId}/approve`,
      {
        method: "POST",  // Make sure this is POST
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerNotes: "Customer approved the service request"
        }),
      }
    );

    console.log('📡 Response status:', response.status); // ADD THIS
    console.log('📡 Response ok:', response.ok); // ADD THIS


      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setApprovalSuccess(true);
        setApprovalError("");

        setTimeout(() => {
          setShowApprovalModal(false);
          fetchRequestDetails();
        }, 1500);
      } else {
        setApprovalError(data.message || "Failed to approve service request");
      }
    } catch (error) {
      console.error("Approval error:", error);
      setApprovalError(error.message || "An error occurred while approving the service request");
    } finally {
      setApprovalLoading(false);
    }
  };

  const openApprovalModal = () => {
    setShowApprovalModal(true);
    setApprovalSuccess(false);
    setApprovalError("");
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
        <div className="flex items-start justify-between overflow-x-auto ">
          {steps.map((step, index) => (
            <div
              key={step.key}
              className="flex items-center min-w-0 flex-shrink-0 "
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
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004785]"></div>
        </div>
      </CustomerLayout>
    );
  }

  if (error) {
    return (
      <CustomerLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (!requestData) {
    return (
      <CustomerLayout>
        <div className="p-6">
          <div className="text-center text-gray-500">No data available</div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 cursor-pointer"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        </div>

        <div className="p-6">
          <StatusTracker />
        </div>

        {/* DEBUG: Remove after testing */}
        {console.log('Service Status:', requestData.serviceStatus)}
        {console.log('Status Name (backend):', requestData.statusName)}

        {/* Approval/Messaging Banner - Shows when status is "Waiting for Approval" */}
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
                    Quotation Ready – Please Review
                  </h3>
                  <p className="text-gray-700 text-sm mb-4">
                    A quotation for your service request has been prepared.
                    Please review the details and approve to proceed.
                  </p>
                  {requestData.quotation && (
                    <p className="text-xs text-gray-600 mb-4">
                      <strong>Quotation #:</strong> {requestData.quotation.quotation_number}
                      {requestData.quotation.valid_until && (
                        <span className="ml-3">
                          <strong>Valid Until:</strong> {requestData.quotation.valid_until}
                        </span>
                      )}
                    </p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={handleMessageTrishkaye}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#004785] text-[#004785] rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium"
                    >
                      <MessageCircle size={18} />
                      Message TRISHKAYE
                    </button>
                    <button
                      onClick={openApprovalModal}
                      className="px-4 py-3 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors cursor-pointer text-sm font-medium"
                    >
                      Approve Quotation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6 pb-3 text-[#004785] border-b-2 border-gray-300">
            Service Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="inline text-sm font-medium text-gray-700 mr-2">
                Request ID:
              </label>
              <span className="text-sm text-gray-800">{requestData.id}</span>
            </div>
            <div className="flex items-center">
              <label className="text-sm font-medium text-gray-700 mr-2">
                Service Status:
              </label>
              <div className="mt-1">
                {getStatusBadge(requestData.serviceStatus, "serviceStatus")}
              </div>
            </div>
            <div>
              <label className="inline text-sm font-medium text-gray-700 mr-2">
                Requested At:
              </label>
              <span className="text-sm text-gray-800">
                {formatDateTime(requestData.requestedAt)}
              </span>
            </div>
            <div>
              <label className="inline text-sm font-medium text-gray-700 mr-2">
                Warranty: (In Months)
              </label>
              <span className="text-sm text-gray-800">
                {requestData.warranty}
              </span>
            </div>
            <div>
              <label className="inline text-sm font-medium text-gray-700 mr-2">
                Assigned Staff:
              </label>
              <span className="text-sm text-gray-800">
                {requestData.assignedStaff}
              </span>
            </div>
            <div>
              <label className="inline text-sm font-medium text-gray-700 mr-2">
                Warranty Fulfillment Status:
              </label>
              <span className="text-sm text-gray-800">
                {requestData.warrantyStatus}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              List of Requested Services:
            </label>
          </div>

          <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-black">
                    Service Category
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-black">
                    Requested Service
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-black">
                    Remarks
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-black">
                    Quantity
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-black">
                    Unit Price
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-black">
                    Total Price
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requestData.services.map((service, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-4 text-xs xl:text-sm text-gray-800 text-center">
                      {service.category}
                    </td>
                    <td className="px-3 py-4 text-xs xl:text-sm text-gray-800 text-center">
                      {service.service}
                    </td>
                    <td className="px-3 py-4 text-xs xl:text-sm text-gray-800 text-center">
                      {service.remarks}
                    </td>
                    <td className="px-3 py-4 text-xs xl:text-sm text-gray-800 text-center">
                      {service.quantity}
                    </td>
                    <td className="px-3 py-4 text-xs xl:text-sm text-gray-800 text-center">
                      {service.unitPrice}
                    </td>
                    <td className="px-3 py-4 text-xs xl:text-sm text-gray-800 text-center">
                      {service.totalPrice}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Discount Display - Only show if discount exists */}
        {requestData.discountPercentage > 0 && (
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-500">
                Availed Discounts
              </h2>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  Subtotal: ₱{calculateSubtotal().toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {requestData.discountPercentage}% discount applied
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-500">Total Cost</h2>
            <div className="text-right">
              {requestData.discountPercentage > 0 && (
                <p className="text-sm text-gray-500 line-through mb-1">
                  ₱{calculateSubtotal().toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              )}
              <p className="text-2xl font-bold text-[#0260A0]">
                {requestData.totalCost}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6 pb-3 text-[#004785] border-b-2 border-gray-300">
            Payment
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="inline text-sm font-medium text-gray-700 mr-2">
                Mode of Payment:
              </label>
              <span className="text-sm text-gray-800">
                {formatPaymentMode(requestData.paymentMode)}
              </span>
            </div>
            <div className="flex items-center">
              <label className="inline text-sm font-medium text-gray-700 mr-2">
                Full Payment Status:
              </label>
              <div className="mt-1">
                {getStatusBadge(requestData.paymentStatus, "paymentStatus")}
              </div>
            </div>
            <div>
              <label className="inline text-sm font-medium text-gray-700 mr-2">
                Payment Terms:
              </label>
              <span className="text-sm text-gray-800">
                {requestData.paymentTerms}
              </span>
            </div>
            <div>
              <label className="inline text-sm font-medium text-gray-700 mr-2">
                Payment Deadline:
              </label>
              <span className="text-sm text-gray-800">
                {formatDateTime(requestData.paymentDeadline)}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Payment Breakdown:
            </label>
          </div>

          <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-black">
                    Payment Phase
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-black">
                    Percentage
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-black">
                    Amount
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-black">
                    Proof of Payment
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-black">
                    Paid On
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-black">
                    Payment Status
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-black">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requestData.paymentHistory.map((payment, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-4 text-xs xl:text-sm text-gray-800 text-center">
                      {payment.phase}
                    </td>
                    <td className="px-3 py-4 text-xs xl:text-sm text-gray-800 text-center">
                      {payment.percentage}
                    </td>
                    <td className="px-3 py-4 text-xs xl:text-sm text-gray-800 text-center">
                      {payment.amount}
                    </td>
                    <td className="px-3 py-4 text-xs xl:text-sm text-gray-800 text-center">
                      {payment.proofOfPayment === "-" ? (
                        <span className="text-gray-400">Not uploaded</span>
                      ) : (
                        <button
                          onClick={() =>
                            handleViewProof(
                              payment.payment_id,
                              payment.proofOfPayment
                            )
                          }
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 mx-auto cursor-pointer"
                        >
                          <Eye size={16} />
                          View
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-4 text-xs xl:text-sm text-gray-800 text-center">
                      {formatPaymentDate(payment.paidOn)}
                    </td>
                    <td className="px-3 py-4 text-xs xl:text-sm text-center">
                      <span className="text-xs xl:text-sm text-gray-800">
                        {getStatusBadge(payment.paymentStatus, "paymentStatus")}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-xs xl:text-sm text-center">
                      <button
                        onClick={() => {
                          setSelectedPaymentId(payment.payment_id);
                          setIsUploadModalOpen(true);
                        }}
                        disabled={
                          !["Approved", "Ongoing", "Completed"].includes(
                            requestData.serviceStatus
                          )
                        }
                        className={`flex items-center gap-1 px-3 py-2 rounded-lg mx-auto text-xs ${
                          ["Approved", "Ongoing", "Completed"].includes(
                            requestData.serviceStatus
                          )
                            ? "bg-[#004785] text-white hover:bg-[#003666] cursor-pointer"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        <Upload size={14} />
                        {payment.proofOfPayment === "-" ? "Upload" : "Update"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6 pb-3 text-[#004785] border-b-2 border-gray-300">
            Duration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="inline text-sm font-medium text-gray-700 mr-2">
                Estimated Duration:
              </label>
              <span className="text-sm text-gray-800">
                {requestData.estimatedDuration}
              </span>
            </div>
            <div className="flex items-center">
              <label className="inline text-sm font-medium text-gray-700 mr-2">
                Service Start Date:
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-800">
                  {formatDateTime(requestData.serviceStartDate)}
                </span>
              </div>
            </div>
            <div>
              <label className="inline text-sm font-medium text-gray-700 mr-2">
                Request Acknowledged:
              </label>
              <span className="text-sm text-gray-800">
                {formatDateTime(requestData.requestAcknowledgedDate)}
              </span>
            </div>
            <div>
              <label className="inline text-sm font-medium text-gray-700 mr-2">
                Service End Date:
              </label>
              <span className="text-sm text-gray-800">
                {formatDateTime(requestData.serviceEndDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Approval Confirmation Modal */}
        {showApprovalModal && (
          <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-5 w-120 max-w-md mx-4">
              <h2 className="text-lg font-bold text-[#004785] mb-4 pb-2 border-b border-gray-200">
                {approvalSuccess ? "Success!" : "Approve Service Request"}
              </h2>

              {approvalSuccess ? (
                <div className="text-center py-4">
                  <div className="flex justify-center mb-4">
                    <svg
                      className="h-16 w-16 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-black text-sm">
                    Service request approved successfully! TRISHKAYE will
                    proceed with the service.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 my-5">
                    <p className="text-black leading-relaxed font-semibold">
                      Are you sure you want to approve this service request?
                    </p>

                    <p className="text-sm text-gray-500 leading-relaxed">
                      By approving, you confirm that you have reviewed the
                      services, pricing, and terms, and agree to proceed with
                      TRISHKAYE performing the service.
                    </p>
                  </div>

                  {approvalError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm">{approvalError}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowApprovalModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      disabled={approvalLoading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApproveQuotation}
                      className="flex-1 px-4 py-2 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={approvalLoading}
                    >
                      {approvalLoading ? "Approving..." : "Approve"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

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
      </div>
    </CustomerLayout>
  );
};

export default CustomerServiceRequestDetails;