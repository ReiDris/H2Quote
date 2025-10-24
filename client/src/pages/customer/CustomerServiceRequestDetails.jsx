import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye, Upload, MessageCircle } from "lucide-react";
import CustomerLayout from "../../layouts/CustomerLayout";
import PaymentProofUploadModal from "./PaymentProofUploadModal";
import PaymentProofViewer from "../../components/shared/PaymentProofViewer";
import { serviceRequestsAPI, messagingAPI } from "../../config/api";

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

  // State for message existence check
  const [hasExistingMessage, setHasExistingMessage] = useState(false);
  const [existingMessageId, setExistingMessageId] = useState(null);
  const [checkingMessage, setCheckingMessage] = useState(false);

  const formatPaymentMode = (mode) => {
    const modeMap = {
      bank_transfer: "Bank Transfer",
      cash: "Cash",
      check: "Check",
      gcash: "GCash",
    };
    return modeMap[mode] || mode;
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
      checkExistingMessage();
    }
  }, [requestId]);

  const checkExistingMessage = async () => {
    try {
      setCheckingMessage(true);
      const token = localStorage.getItem("h2quote_token");

      if (!token) {
        return;
      }

      // Get user's inbox to check if there's already a message for this request
      const response = await messagingAPI.getInbox({ page: 1, limit: 100 });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data.messages) {
          // Check if any message is related to this service request
          const existingMsg = data.data.messages.find(
            msg => msg.requestId && msg.requestId.toString() === requestId.toString()
          );
          
          if (existingMsg) {
            setHasExistingMessage(true);
            setExistingMessageId(existingMsg.id);
          } else {
            setHasExistingMessage(false);
            setExistingMessageId(null);
          }
        }
      }
    } catch (error) {
      console.error("Error checking existing message:", error);
    } finally {
      setCheckingMessage(false);
    }
  };

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
          requestId: requestDetails.request_id,
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
          statusName: requestDetails.status_name, // Backend status name
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
    // Check if message already exists
    if (hasExistingMessage && existingMessageId) {
      // Navigate to existing message thread instead of creating new one
      navigate(`/customer/messages/${existingMessageId}`);
    } else {
      // Allow creating new message
      navigate("/customer/messages/compose", {
        state: {
          requestId: requestData?.requestId || requestId,
          requestNumber: requestData?.id,
        },
      });
    }
  };

  // ✅ UPDATED: Approve service request directly (no quotation_id needed)
  const handleApproveQuotation = async () => {
    setApprovalLoading(true);
    setApprovalError("");

    try {
      // ✅ CORRECT: Call the customer approval endpoint
      const response = await serviceRequestsAPI.approveServiceRequest(
        requestData.requestId,
        "Customer approved the service request and pricing"
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setApprovalSuccess(true);
        setApprovalError("");

        // Wait a moment to show success message, then refresh
        setTimeout(() => {
          setShowApprovalModal(false);
          fetchRequestDetails(); // Refresh the data to show updated status
        }, 1500);
      } else {
        setApprovalError(data.message || "Failed to approve service request");
      }
    } catch (error) {
      console.error("Approval error:", error);
      setApprovalError("An error occurred while approving the service request");
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
      { label: "Waiting for Approval", key: "waiting" },
      { label: "Approved", key: "approved" },
      { label: "Ongoing", key: "ongoing" },
      { label: "Completed", key: "completed" },
    ];

    const getStepStatus = (stepKey) => {
      const statusMap = {
        Pending: ["pending"],
        Assigned: ["pending", "processing"],
        "Waiting for Approval": ["pending", "processing", "waiting"],
        Approved: ["pending", "processing", "waiting", "approved"],
        Ongoing: ["pending", "processing", "waiting", "approved", "ongoing"],
        Completed: [
          "pending",
          "processing",
          "waiting",
          "approved",
          "ongoing",
          "completed",
        ],
      };

      const currentSteps = statusMap[requestData.serviceStatus] || ["pending"];
      return currentSteps.includes(stepKey);
    };

    return (
      <div className="relative">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => {
            const isActive = getStepStatus(step.key);
            const isLast = index === steps.length - 1;

            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isActive
                        ? "bg-[#004785] text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {isActive ? "✓" : index + 1}
                  </div>
                  <p
                    className={`mt-2 text-xs text-center max-w-[100px] ${
                      isActive ? "text-[#004785] font-semibold" : "text-gray-600"
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
                {!isLast && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-colors ${
                      isActive ? "bg-[#004785]" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004785] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading service request details...</p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (error) {
    return (
      <CustomerLayout>
        <div className="p-6">
          <button
            onClick={() => navigate("/customer/service-tracker")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 cursor-pointer"
          >
            <ArrowLeft size={20} />
            Back to Service Tracker
          </button>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="space-y-6 relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-white rounded-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/customer/service-tracker")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 cursor-pointer"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-[#004785]">
                Service Request #{requestData.id}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(requestData.requestedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {requestData.serviceStatus === "Waiting for Approval" && (
              <button
                onClick={openApprovalModal}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
              >
                Approve Service Request
              </button>
            )}
            <button
              onClick={handleMessageTrishkaye}
              disabled={checkingMessage}
              className="flex items-center gap-2 px-4 py-2 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageCircle size={18} />
              {checkingMessage ? (
                "Checking..."
              ) : hasExistingMessage ? (
                "View Message Thread"
              ) : (
                "Message TRISHKAYE"
              )}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 pb-3 text-[#004785] border-b-2 border-gray-300">
            Request Status
          </h2>
          <StatusTracker />
        </div>

        <div className="bg-white rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 pb-3 text-[#004785] border-b-2 border-gray-300">
            Current Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">
                Service Status
              </label>
              {getStatusBadge(requestData.serviceStatus, "serviceStatus")}
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              {getStatusBadge(requestData.paymentStatus, "paymentStatus")}
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">
                Warranty Status
              </label>
              {getStatusBadge(requestData.warrantyStatus, "warrantyStatus")}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 pb-3 text-[#004785] border-b-2 border-gray-300">
            Services Requested
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                    Service Category
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                    Service
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
                  <th className="px-3 py-3 text-left text-xs font-semibold text-black">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requestData.services.map((service, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-4 text-sm text-gray-800">
                      {service.category}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-800">
                      {service.service}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-800 text-center">
                      {service.quantity}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-800 text-center">
                      ₱{parseFloat(service.unitPrice).toFixed(2)}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-800 text-center">
                      ₱{parseFloat(service.totalPrice).toFixed(2)}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-800">
                      {service.remarks}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td
                    colSpan="4"
                    className="px-3 py-4 text-sm font-semibold text-right text-black"
                  >
                    Total Cost:
                  </td>
                  <td className="px-3 py-4 text-sm font-semibold text-center text-black">
                    ₱{parseFloat(requestData.totalCost).toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 pb-3 text-[#004785] border-b-2 border-gray-300">
            Payment Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="inline text-sm font-medium text-gray-700 mr-2">
                Payment Mode:
              </label>
              <span className="text-sm text-gray-800">
                {formatPaymentMode(requestData.paymentMode)}
              </span>
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
                {requestData.paymentDeadline}
              </span>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-4 text-[#004785]">
            Payment History
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
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
                      {payment.paidOn}
                    </td>
                    <td className="px-3 py-4 text-xs xl:text-sm text-gray-800 text-center">
                      <select
                        value={payment.paymentStatus}
                        className="text-xs xl:text-sm border border-gray-300 rounded p-2 cursor-pointer"
                        disabled
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </td>
                    <td className="px-3 py-4 text-xs xl:text-sm text-center">
                      <button
                        onClick={() => {
                          setSelectedPaymentId(payment.payment_id);
                          setIsUploadModalOpen(true);
                        }}
                        className="flex items-center gap-1 px-3 py-2 bg-[#004785] text-white rounded-lg hover:bg-[#003666] mx-auto text-xs cursor-pointer"
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
                  {requestData.serviceStartDate}
                </span>
              </div>
            </div>
            <div>
              <label className="inline text-sm font-medium text-gray-700 mr-2">
                Request Acknowledged:
              </label>
              <span className="text-sm text-gray-800">-</span>
            </div>
            <div>
              <label className="inline text-sm font-medium text-gray-700 mr-2">
                Service End Date:
              </label>
              <span className="text-sm text-gray-800">
                {requestData.serviceEndDate}
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
                  <p className="text-black mb-6 text-sm">
                    Are you sure you want to approve this service request? By
                    approving, you confirm that you have reviewed the services,
                    pricing, and terms, and agree to proceed with TRISHKAYE
                    performing the service.
                  </p>

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