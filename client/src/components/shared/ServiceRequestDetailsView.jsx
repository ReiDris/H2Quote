import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, Package } from "lucide-react";
import ManageRequestItemsModal from "./ManageRequestItemsModal";
import PaymentProofViewer from "./PaymentProofViewer";
import { serviceRequestsAPI } from "../../config/api";

const ServiceRequestDetailsView = ({ requestNumber, userRole }) => {
  const navigate = useNavigate();

  // Helper function to decode HTML entities (e.g., &#8369; to ₱)
  const decodeHTMLEntities = (text) => {
    if (!text) return text;
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  // Permission flags based on role
  const canAssignStaff = userRole === "admin";
  const canGiveDiscounts = userRole === "admin";

  // State for editable fields
  const [serviceStatus, setServiceStatus] = useState("Pending");
  const [paymentStatus, setPaymentStatus] = useState("Pending");
  const [warrantyStatus, setWarrantyStatus] = useState("Pending");
  const [serviceStartDate, setServiceStartDate] = useState("");
  const [serviceEndDate, setServiceEndDate] = useState("");
  const [paymentDeadline, setPaymentDeadline] = useState("");
  const [selectedDiscount, setSelectedDiscount] = useState("No Discount");
  const [customDiscountPercent, setCustomDiscountPercent] = useState("");

  // State for data loading
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState(null);

  const formatPaymentMode = (mode) => {
    const modeMap = {
      bank_transfer: "Bank Transfer",
      cash: "Cash",
      check: "Check",
      gcash: "GCash",
    };
    return modeMap[mode] || mode;
  };

  // State for payment breakdown individual status changes
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);

  // State for manage items modal
  const [isManageItemsModalOpen, setIsManageItemsModalOpen] = useState(false);

  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewingPaymentId, setViewingPaymentId] = useState(null);
  const [viewingFileName, setViewingFileName] = useState("");

  // State for staff list
  const [staffList, setStaffList] = useState([]);

  // State for success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // State for status restriction modal
  const [showStatusRestrictionModal, setShowStatusRestrictionModal] =
    useState(false);
  const [statusRestrictionMessage, setStatusRestrictionMessage] = useState("");

  // Check if discount should be disabled based on service status
  const isDiscountDisabled = ["Ongoing", "Completed", "Cancelled"].includes(
    serviceStatus
  );

  const handleServiceStatusChange = (newStatus) => {
    // 🔍 DEBUG LOGGING
    console.log("=== handleServiceStatusChange DEBUG ===");
    console.log("New Status:", newStatus);
    console.log("Assigned Staff:", requestData?.assignedStaff);
    console.log("Staff is 'Not assigned'?", requestData?.assignedStaff === "Not assigned");
    console.log("=======================================");

    // Check if trying to set to "Assigned" without assigning staff
    const staffValue = requestData?.assignedStaff?.trim() || "";
    const isNoStaff = staffValue === "Not assigned" || staffValue === "" || !staffValue;
    
    if (newStatus === "Assigned" && isNoStaff) {
      console.error("❌ VALIDATION BLOCKED: Cannot set to Assigned without staff");
      setStatusRestrictionMessage(
        "Cannot set status to Assigned for Processing. Please assign a staff member first."
      );
      setShowStatusRestrictionModal(true);
      // Keep the current status unchanged
      setServiceStatus(serviceStatus);
      return;
    }

    // Check if trying to set to "Waiting for Approval" without assigning staff
    if (newStatus === "Waiting for Approval" && isNoStaff) {
      console.error("❌ VALIDATION BLOCKED: Cannot set to Waiting for Approval without staff");
      setStatusRestrictionMessage(
        "Cannot set status to Waiting for Approval. Please assign a staff member first."
      );
      setShowStatusRestrictionModal(true);
      // Keep the current status unchanged
      setServiceStatus(serviceStatus);
      return;
    }

    // Check if trying to set to "Ongoing" without being "Approved"
    if (newStatus === "Ongoing" && serviceStatus !== "Approved") {
      setStatusRestrictionMessage(
        "Cannot set status to Service Ongoing. Please wait for customer approval first."
      );
      setShowStatusRestrictionModal(true);
      return;
    }

    // Check if trying to set to "Completed" without being "Ongoing"
    if (newStatus === "Completed" && serviceStatus !== "Ongoing") {
      setStatusRestrictionMessage(
        "Cannot set status to Completed. The service must be ongoing first."
      );
      setShowStatusRestrictionModal(true);
      return;
    }

    // Automatically set service start date when status changes to Ongoing
    if (newStatus === "Ongoing" && serviceStatus !== "Ongoing") {
      const today = new Date().toISOString().split("T")[0];
      setServiceStartDate(today);
    }

    // If validation passes, update the status
    setServiceStatus(newStatus);
  };

  const calculateDiscountedTotal = () => {
    const baseTotal = parseFloat(requestData.totalCost.replace(/[₱,]/g, ""));

    if (selectedDiscount === "No Discount" || !selectedDiscount) {
      return requestData.totalCost;
    }

    // Use customDiscountPercent if it's a custom discount
    const discountPercent =
      selectedDiscount === "Custom"
        ? parseFloat(customDiscountPercent) || 0
        : parseFloat(selectedDiscount.replace("%", ""));

    const discountAmount = (baseTotal * discountPercent) / 100;
    const finalTotal = baseTotal - discountAmount;

    return `₱${finalTotal.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const recalculatePaymentBreakdown = () => {
    if (!requestData || paymentBreakdown.length === 0) return;

    const baseTotal = parseFloat(requestData.totalCost.replace(/[₱,]/g, ""));

    // Calculate discounted total
    let discountPercent = 0;
    if (selectedDiscount !== "No Discount" && selectedDiscount) {
      discountPercent =
        selectedDiscount === "Custom"
          ? parseFloat(customDiscountPercent) || 0
          : parseFloat(selectedDiscount.replace("%", ""));
    }

    const discountAmount = (baseTotal * discountPercent) / 100;
    const discountedTotal = baseTotal - discountAmount;

    // Recalculate payment breakdown amounts based on percentages
    const updatedBreakdown = paymentBreakdown.map((payment) => {
      const percentage = parseFloat(payment.percentage.replace("%", ""));
      const newAmount = Math.round((discountedTotal * percentage) / 100);

      return {
        ...payment,
        amount: `₱${newAmount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      };
    });

    setPaymentBreakdown(updatedBreakdown);
  };

  const handleViewProof = (paymentId, fileName) => {
    setViewingPaymentId(paymentId);
    setViewingFileName(fileName);
    setIsViewerOpen(true);
  };

  // Fetch staff list
  const fetchStaffList = async () => {
    try {
      const response = await serviceRequestsAPI.getStaffList();
      const data = await response.json();

      if (data.success) {
        setStaffList(data.data);
      }
    } catch (error) {
      console.error("Error fetching staff list:", error);
    }
  };

  // Fetch request details from backend
  const fetchRequestDetails = async () => {
    try {
      setLoading(true);

      // Use getAll with search parameter
      const searchResponse = await serviceRequestsAPI.getAll({
        search: requestNumber,
        limit: 1,
      });

      if (!searchResponse.ok) {
        throw new Error("Failed to find service request");
      }

      const searchData = await searchResponse.json();

      if (!searchData.success || searchData.data.requests.length === 0) {
        setError("Service request not found");
        return;
      }

      const request = searchData.data.requests[0];
      setRequestId(request.request_id);

      // Use getDetails (not getRequestDetails)
      const detailResponse = await serviceRequestsAPI.getDetails(
        request.request_id
      );

      if (!detailResponse.ok) {
        throw new Error("Failed to fetch request details");
      }

      const detailData = await detailResponse.json();

      if (detailData.success) {
        const {
          request: requestDetails,
          items,
          paymentHistory,
        } = detailData.data;

        const actualTotalCost = items.reduce((sum, item) => {
          const lineTotal =
            typeof item.line_total === "string"
              ? parseFloat(item.line_total.replace(/[₱,]/g, ""))
              : parseFloat(item.line_total) || 0;
          return sum + lineTotal;
        }, 0);

        const formattedTotalCost = `₱${actualTotalCost.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

        const transformedData = {
          id: requestDetails.request_number,
          requestedAt: requestDetails.requested_at,
          requestAcknowledgedDate:
            requestDetails.request_acknowledged_date || "-",
          actualCompletionDate: requestDetails.actual_completion_date || "-",
          customer: {
            name: requestDetails.customer_name,
            company: requestDetails.company_name,
            email: requestDetails.email || "Not provided",
            contact: requestDetails.phone || "Not provided",
          },
          services: items.map((item) => ({
            service_id: item.service_id,
            category: item.service_category || item.category,
            service: item.name,
            remarks: item.remarks || "-",
            quantity: item.quantity,
            unitPrice: item.unit_price,
            totalPrice: item.total_price,
            itemType: item.item_type,
            warranty_months: item.warranty_months || 6,
            warranty_start_date: item.warranty_start_date || "",
            warranty_status: item.warranty_status || "Not Set",
          })),
          paymentHistory: requestDetails.paymentHistory || [],
          estimatedDuration: requestDetails.estimated_duration || "3 - 7 Days",
          totalCost: formattedTotalCost,
          paymentMode: requestDetails.payment_mode || "Bank Transfer",
          paymentTerms:
            requestDetails.payment_terms || "50% Down, 50% upon Completion",
          paymentDeadline: requestDetails.payment_deadline || "Not set",
          assignedStaff: requestDetails.assigned_staff_name || "Not assigned",
          warranty: requestDetails.warranty || "6 months",
          warrantyStatus: requestDetails.warranty_status || "Pending",
          remarks: requestDetails.remarks || "-",
          serviceStatus: requestDetails.service_status || "Pending",
        };

        // ✅ Auto-correct inconsistent status from database (legacy data fix)
        const dbStatus = requestDetails.service_status || "Pending";
        const dbStaff = requestDetails.assigned_staff_name || "Not assigned";

        // Correct "Assigned" status without staff
        if (dbStatus === "Assigned" && dbStaff === "Not assigned") {
          console.warn(
            "⚠️ INCONSISTENT DATA: Correcting 'Assigned' without staff"
          );
          console.log("  Database status:", dbStatus);
          console.log("  Database staff:", dbStaff);
          console.log("  Correcting to: Pending");

          // Correct the status in transformedData
          transformedData.serviceStatus = "Pending";
        }

        // NOTE: Removed auto-correction for "Waiting for Approval" 
        // The validation in handleServiceStatusChange already prevents this
        // Auto-correction was causing the tracker to show "Pending" incorrectly

        setRequestData(transformedData);
        setPaymentBreakdown(requestDetails.paymentHistory || []);

        // Set service status with correction applied
        setServiceStatus(transformedData.serviceStatus);

        // Show message if we corrected an inconsistent status
        if (dbStatus === "Assigned" && dbStaff === "Not assigned") {
          setTimeout(() => {
            setStatusRestrictionMessage(
              `This request had an inconsistent status ('${dbStatus}' without assigned staff). ` +
                "The status has been automatically corrected to Pending. " +
                "Please assign a staff member before changing the status."
            );
            setShowStatusRestrictionModal(true);
          }, 500);
        }

        setPaymentStatus(requestDetails.payment_status || "Pending");
        setWarrantyStatus(requestDetails.warranty_status || "Pending");
        setServiceStartDate(requestDetails.service_start_date || "");
        setServiceEndDate(requestDetails.actual_completion_date || "");
        setPaymentDeadline(requestDetails.payment_deadline || "");

        // Initialize discount states
        if (
          requestDetails.discount_percentage &&
          requestDetails.discount_percentage > 0
        ) {
          setCustomDiscountPercent(
            requestDetails.discount_percentage.toString()
          );
          setSelectedDiscount("Custom");
        } else {
          setCustomDiscountPercent("");
          setSelectedDiscount("No Discount");
        }
      } else {
        setError(detailData.message || "Failed to fetch request details");
      }
    } catch (error) {
      console.error("Error fetching request details:", error);
      setError("Failed to fetch request details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (requestNumber) {
      fetchRequestDetails();
      if (canAssignStaff) {
        fetchStaffList();
      }
    }
  }, [requestNumber, canAssignStaff]);

  // Recalculate payment breakdown when discount changes
  useEffect(() => {
    if (requestData && paymentBreakdown.length > 0) {
      recalculatePaymentBreakdown();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDiscount, customDiscountPercent]);

  const handleItemsUpdated = () => {
    fetchRequestDetails();
  };

  const handlePaymentStatusChange = (index, newStatus) => {
    const updatedPayments = [...paymentBreakdown];
    updatedPayments[index] = {
      ...updatedPayments[index],
      paymentStatus: newStatus,
    };
    setPaymentBreakdown(updatedPayments);
  };

  const getStatusBadge = (status, type) => {
    const statusStyles = {
      serviceStatus: {
        Pending: "bg-gray-100 text-gray-800",
        Assigned: "bg-orange-200 text-orange-600",
        Processing: "bg-yellow-100 text-yellow-800",
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
        "Not Set": "bg-gray-100 text-gray-500",
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
      // ✅ FIX: Use serviceStatus state instead of requestData.serviceStatus
      // This makes the tracker update immediately when dropdown changes
      switch (serviceStatus) {
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

  const getBackPath = () => {
    return userRole === "admin"
      ? "/admin/service-tracker"
      : "/staff/service-tracker";
  };

  const handleSaveChanges = async () => {
    try {
      // 🔍 DEBUG LOGGING
      console.log("=== handleSaveChanges DEBUG ===");
      console.log("Service Status:", serviceStatus);
      console.log("Assigned Staff:", requestData?.assignedStaff);
      console.log("================================");

      // Validate Service End Date when status is Completed
      if (serviceStatus === "Completed" && !serviceEndDate) {
        setStatusRestrictionMessage(
          "Service End Date is required when marking service as Completed."
        );
        setShowStatusRestrictionModal(true);
        return;
      }

      // ✅ NEW: Validate warranty periods for services when status is Completed
      if (serviceStatus === "Completed") {
        // Filter only actual services (not chemicals/refrigerants)
        const actualServices = requestData.services.filter(
          (item) => item.itemType === "service"
        );

        // Check if any service is missing warranty information
        const servicesWithoutWarranty = actualServices.filter(
          (service) => !service.warranty_start_date || !service.warranty_months
        );

        if (servicesWithoutWarranty.length > 0) {
          const serviceNames = servicesWithoutWarranty
            .map((s) => s.service)
            .join(", ");
          
          setStatusRestrictionMessage(
            `Cannot mark service as Completed. The following service(s) are missing warranty information: ${serviceNames}. Please set warranty periods for all services before completing.`
          );
          setShowStatusRestrictionModal(true);
          return;
        }
      }

      // Validate staff assignment for "Assigned" or "Waiting for Approval" status
      const staffValue = requestData?.assignedStaff?.trim() || "";
      const isNoStaff = staffValue === "Not assigned" || staffValue === "" || !staffValue;
      
      if (serviceStatus === "Assigned" && isNoStaff) {
        console.error("❌ SAVE BLOCKED: Cannot save Assigned without staff");
        setStatusRestrictionMessage(
          "Cannot set status to Assigned for Processing. Please assign a staff member first."
        );
        setShowStatusRestrictionModal(true);
        return;
      }
      
      if (serviceStatus === "Waiting for Approval" && isNoStaff) {
        console.error("❌ SAVE BLOCKED: Cannot save Waiting for Approval without staff");
        setStatusRestrictionMessage(
          "Cannot set status to Waiting for Approval. Please assign a staff member first."
        );
        setShowStatusRestrictionModal(true);
        return;
      }

      // ✅ IMPROVED: Smart status management based on staff assignment
      let finalServiceStatus = serviceStatus;

      // ✅ VALIDATION 1: If currently "Assigned" but staff was just unassigned
      // This means user is trying to remove staff from an Assigned request
      if (
        serviceStatus === "Assigned" &&
        requestData.assignedStaff === "Not assigned"
      ) {
        setStatusRestrictionMessage(
          "Cannot unassign staff while status is 'Assigned for Processing'. " +
            "The status will be automatically reverted to 'Pending' when you save."
        );
        setShowStatusRestrictionModal(true);
        // Change status to Pending automatically
        finalServiceStatus = "Pending";
        setServiceStatus("Pending");
        return; // Stop here so user can see the revert, then save again
      }

      // ✅ AUTO-ASSIGN: If staff is assigned and status is "Pending", auto-promote to "Assigned"
      if (
        requestData.assignedStaff !== "Not assigned" &&
        serviceStatus === "Pending"
      ) {
        finalServiceStatus = "Assigned";
        // Don't update UI here - let backend confirm via fetchRequestDetails()
      }

      if (
        finalServiceStatus === "Assigned" &&
        requestData.assignedStaff === "Not assigned"
      ) {
        setStatusRestrictionMessage(
          "Cannot change status to 'Assigned for Processing' without assigning a staff member. Keep status as 'Pending' or assign staff first."
        );
        setShowStatusRestrictionModal(true);
        return;
      }



      // Format discount for backend
      let discountForBackend = "No Discount";
      if (selectedDiscount === "Custom" && customDiscountPercent) {
        discountForBackend = `${customDiscountPercent}%`;
      }

      const updatePayload = {
        serviceStatus: finalServiceStatus,
        paymentStatus: paymentStatus,
        warrantyStatus: warrantyStatus,
        assignedStaff: requestData.assignedStaff,
        serviceStartDate: serviceStartDate || null,
        serviceEndDate: serviceEndDate || null,
        paymentDeadline: paymentDeadline || null,
        discount: discountForBackend,
        services: requestData.services.map((service) => ({
          service_id: service.service_id,
          itemType: service.itemType,
          warranty_months: service.warranty_months,
          warranty_start_date: service.warranty_start_date || null,
          warranty_status: service.warranty_status,
        })),
        paymentBreakdown: paymentBreakdown.map((payment) => ({
          phase: payment.phase,
          paymentStatus: payment.paymentStatus,
        })),
      };

      console.log("Sending update payload:", updatePayload);

      // Use updateRequest (not updateRequestDetails)
      const response = await serviceRequestsAPI.updateRequest(
        requestId,
        updatePayload
      );
      const data = await response.json();

      if (data.success) {
        // Check if backend auto-reverted the status
        if (data.statusReverted) {
          setSuccessMessage(
            "Staff unassigned. Status has been automatically reverted to 'Pending'."
          );
        } else {
          setSuccessMessage("Changes saved successfully!");
        }
        setShowSuccessModal(true);
        fetchRequestDetails(); // Reload data from backend to sync UI
      } else {
        setSuccessMessage("Failed to save changes: " + data.message);
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Save changes error:", error);
      setSuccessMessage("Failed to save changes. Please try again.");
      setShowSuccessModal(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
        {error}
      </div>
    );
  }

  if (!requestData) {
    return (
      <div className="text-center py-8 text-gray-500">
        No request data found.
      </div>
    );
  }

  const isEditable = ["Pending", "Assigned", "Processing"].includes(
    requestData.serviceStatus
  );

  return (
    <div>
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(getBackPath())}
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
      {requestData.serviceStatus === "Approved" && (
        <div className="mx-6 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-green-800 font-semibold text-base mb-2">
                  Customer Approval Received
                </h3>
                <p className="text-gray-700 text-sm mb-3">
                  The customer has reviewed and approved the updated service
                  request, including all added services and the final quotation.
                  You may now proceed with the next steps.
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-white rounded px-3 py-2 inline-flex">
                  <span className="font-medium">Status:</span>
                  <span className="text-green-700 font-semibold">
                    Ready to Begin Service
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4 pb-3 text-[#004785] border-b-2 border-gray-300">
          Customer Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="inline text-sm font-medium text-gray-700 mr-2">
              Customer:
            </label>
            <span className="text-sm text-gray-800">
              {requestData.customer.name}
            </span>
          </div>
          <div>
            <label className="inline text-sm font-medium text-gray-700 mb-1">
              Email: {requestData.customer.email}
            </label>
          </div>
          <div>
            <label className="inline text-sm font-medium text-gray-700 mr-2">
              Company:
            </label>
            <span className="text-sm text-gray-800">
              {requestData.customer.company}
            </span>
          </div>
          <div>
            <label className="inline text-sm font-medium text-gray-700 mr-2">
              Contact No:
            </label>
            <span className="text-sm text-gray-800">
              {requestData.customer.contact}
            </span>
          </div>
        </div>
      </div>

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
            <select
              value={serviceStatus}
              onChange={(e) => handleServiceStatusChange(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1 w-55 cursor-pointer"
            >
              {/* Pending is auto-set on request creation, not selectable */}
              {serviceStatus === "Pending" && (
                <option value="Pending">Pending</option>
              )}

              {/* Assigned is auto-set when staff is assigned, not selectable */}
              {serviceStatus === "Assigned" && (
                <option value="Assigned">Assigned for Processing</option>
              )}

              {/* Manual options */}
              <option value="Waiting for Approval">Waiting for Approval</option>

              {/* Approved is auto-set by customer approval, not selectable */}
              {serviceStatus === "Approved" && (
                <option value="Approved">Approved</option>
              )}

              <option value="Ongoing">Service Ongoing</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="inline text-sm font-medium text-gray-700 mr-2">
              Requested At:
            </label>
            <span className="text-sm text-gray-800">
              {requestData.requestedAt}
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
              Customer Remarks:
            </label>
            <span className="text-sm text-gray-800">{requestData.remarks}</span>
          </div>
          <div>
            <label className="inline text-sm font-medium text-gray-700 mr-2">
              Warranty Fulfillment Status:
            </label>
            <span className="text-sm text-gray-800">
              {requestData.warrantyStatus}
            </span>
          </div>

          <div className="col-span-2">
            <label className="inline text-sm font-medium text-gray-700 mr-2">
              Assigned Staff:
            </label>
            {canAssignStaff ? (
              <select
                value={requestData.assignedStaff}
                onChange={(e) => {
                  setRequestData({
                    ...requestData,
                    assignedStaff: e.target.value,
                  });
                }}
                className="text-sm border border-gray-300 rounded-lg px-2 py-1 cursor-pointer"
              >
                <option value="Not assigned">Not assigned</option>
                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.name}>
                    {staff.name} {staff.department && `- ${staff.department}`}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-gray-800">
                {requestData.assignedStaff}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">
            List of Requested Services:
          </label>

          {isEditable && requestId && (
            <button
              onClick={() => setIsManageItemsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#004785] text-white rounded-lg cursor-pointer hover:bg-[#003366] transition-all"
            >
              <Package size={18} />
              Manage Items
            </button>
          )}
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
                <th className="px-3 py-3 text-center text-xs font-semibold text-black">
                  Warranty (Months)
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-black">
                  Start Date
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-black">
                  Warranty Status
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
                    {decodeHTMLEntities(service.unitPrice)}
                  </td>
                  <td className="px-3 py-4 text-xs xl:text-sm text-gray-800 text-center">
                    {decodeHTMLEntities(service.totalPrice)}
                  </td>

                  {service.itemType === "service" ? (
                    <>
                      <td className="px-3 py-4 text-xs xl:text-sm text-gray-800 text-center">
                        <input
                          type="number"
                          min="0"
                          max="60"
                          value={service.warranty_months || 6}
                          onChange={(e) => {
                            const updatedServices = [...requestData.services];
                            updatedServices[index] = {
                              ...updatedServices[index],
                              warranty_months: parseInt(e.target.value) || 6,
                            };
                            setRequestData({
                              ...requestData,
                              services: updatedServices,
                            });
                          }}
                          className="w-16 text-center border border-gray-300 rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-4 text-xs xl:text-sm text-gray-800 text-center">
                        <input
                          type="date"
                          value={service.warranty_start_date || ""}
                          onChange={(e) => {
                            const updatedServices = [...requestData.services];
                            updatedServices[index] = {
                              ...updatedServices[index],
                              warranty_start_date: e.target.value,
                            };
                            setRequestData({
                              ...requestData,
                              services: updatedServices,
                            });
                          }}
                          className="border border-gray-300 rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-4 text-xs xl:text-sm text-center">
                        {getStatusBadge(
                          service.warranty_status || "Not Set",
                          "warrantyStatus"
                        )}
                      </td>
                    </>
                  ) : (
                    <td
                      className="px-3 py-4 text-xs xl:text-sm text-gray-500 text-center"
                      colSpan="3"
                    >
                      N/A (Material)
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {canGiveDiscounts && (
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-500">
              Availed Discounts
            </h2>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={customDiscountPercent}
                onChange={(e) => {
                  const value = e.target.value;
                  setCustomDiscountPercent(value);
                  if (value && parseFloat(value) > 0) {
                    setSelectedDiscount("Custom");
                  } else {
                    setSelectedDiscount("No Discount");
                  }
                }}
                placeholder="0"
                disabled={isDiscountDisabled}
                className={`w-20 text-center border border-gray-300 rounded-lg px-2 py-2 text-sm ${
                  isDiscountDisabled ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              />
              <span className="text-sm font-medium text-gray-700">%</span>
              <button
                onClick={() => {
                  setSelectedDiscount("No Discount");
                  setCustomDiscountPercent("");
                }}
                disabled={isDiscountDisabled}
                className={`p-3 border text-sm rounded-lg font-semibold ${
                  isDiscountDisabled
                    ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                    : selectedDiscount === "No Discount"
                    ? "border-[#0260A0] bg-[#F0F8FF] text-[#0260A0] cursor-pointer"
                    : "border-gray-300 text-[#0260A0] cursor-pointer"
                }`}
              >
                No Discount
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-500">Total Cost</h2>
          <div className="text-right">
            {selectedDiscount !== "No Discount" && (
              <>
                <p className="text-sm text-gray-500 line-through">
                  {decodeHTMLEntities(requestData.totalCost)}
                </p>
                <p className="text-xs text-green-600 mb-1">
                  {customDiscountPercent}% discount applied
                </p>
              </>
            )}
            <p className="text-2xl font-bold text-[#0260A0]">
              {decodeHTMLEntities(calculateDiscountedTotal())}
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
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-2 py-1 w-50 cursor-pointer"
              >
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
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
          <div className="flex items-center">
            <label className="inline text-sm font-medium text-gray-700 mr-2">
              Payment Deadline:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={paymentDeadline}
                onChange={(e) => setPaymentDeadline(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-2 py-2 w-50 cursor-pointer text-gray-400"
              />
            </div>
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paymentBreakdown.map((payment, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-3 py-4 text-xs xl:text-sm text-gray-800 text-center">
                    {payment.phase}
                  </td>
                  <td className="px-3 py-4 text-xs xl:text-sm text-gray-800 text-center">
                    {payment.percentage}
                  </td>
                  <td className="px-3 py-4 text-xs xl:text-sm text-gray-800 text-center">
                    {decodeHTMLEntities(payment.amount)}
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
                      onChange={(e) =>
                        handlePaymentStatusChange(index, e.target.value)
                      }
                      className="text-xs xl:text-sm border border-gray-300 rounded p-2 cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>
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
            <span className="text-sm text-gray-800">
              {serviceStartDate
                ? new Date(serviceStartDate + "T00:00:00").toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }
                  )
                : "-"}
            </span>
          </div>
          <div>
            <label className="inline text-sm font-medium text-gray-700 mr-2">
              Request Acknowledged:
            </label>
            <span className="text-sm text-gray-800">
              {requestData.requestAcknowledgedDate}
            </span>
          </div>
          <div className="flex items-center">
            <label className="inline text-sm font-medium text-gray-700 mr-2">
              Service End Date:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={serviceEndDate}
                onChange={(e) => setServiceEndDate(e.target.value)}
                disabled={serviceStatus !== "Completed"}
                className={`text-sm border border-gray-300 rounded-lg px-2 py-2 w-50 ${
                  serviceStatus === "Completed"
                    ? "cursor-pointer text-gray-400"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-5 mb-10">
        <button
          onClick={() => navigate(getBackPath())}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl cursor-pointer hover:bg-gray-200 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveChanges}
          className="flex-1 px-6 py-2 bg-[#004785] text-white rounded-lg cursor-pointer hover:bg-[#003366] transition-all"
        >
          Save Changes
        </button>
      </div>

      {requestId && (
        <ManageRequestItemsModal
          isOpen={isManageItemsModalOpen}
          onClose={() => setIsManageItemsModalOpen(false)}
          requestId={requestId}
          onSuccess={handleItemsUpdated}
        />
      )}

      <PaymentProofViewer
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setViewingPaymentId(null);
        }}
        paymentId={viewingPaymentId}
        fileName={viewingFileName}
      />

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-5 w-120 max-w-md mx-4">
            <h2 className="text-lg font-bold text-[#004785] mb-4 pb-2 border-b border-gray-200">
              Save Changes
            </h2>
            <p className="text-black mb-6 text-sm">{successMessage}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 px-4 py-2 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showStatusRestrictionModal && (
        <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-5 w-120 max-w-md mx-4">
            <h2 className="text-lg font-bold text-[#004785] mb-4 pb-2 border-b border-gray-200">
              Status Restriction
            </h2>
            <p className="text-black mb-6 text-sm">
              {statusRestrictionMessage}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStatusRestrictionModal(false)}
                className="flex-1 px-4 py-2 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceRequestDetailsView;