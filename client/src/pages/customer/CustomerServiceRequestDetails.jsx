import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye } from "lucide-react";
import CustomerLayout from "../../layouts/CustomerLayout";

const CustomerServiceRequestDetails = () => {
  const navigate = useNavigate();

  // Mock data for the specific request (customer's view)
  const requestData = {
    id: "#REQ01",
    requestedAt: "May 07, 2025 - 10:34 AM",
    serviceStatus: "Ongoing",
    paymentStatus: "Partial",
    warrantyStatus: "Pending",
    services: [
      {
        category: "Services",
        service: "Service A",
        remarks: "-",
        quantity: 1,
        unitPrice: "₱50,000",
        totalPrice: "₱50,000",
      },
      {
        category: "Chemicals",
        service: "Chemical A",
        remarks: "-",
        quantity: 1,
        unitPrice: "₱40,000",
        totalPrice: "₱40,000",
      },
    ],
    paymentHistory: [
      {
        phase: "Down Payment",
        percentage: "50%",
        amount: "₱25,000",
        proofOfPayment: "proof_payment_1.pdf",
        paidOn: "May 08, 2025",
        paymentStatus: "Paid",
      },
      {
        phase: "Completion Balance",
        percentage: "50%",
        amount: "₱25,000",
        proofOfPayment: "-",
        paidOn: "Pending",
        paymentStatus: "Pending",
      },
    ],
    estimatedDuration: "3 - 7 Days",
    totalCost: "₱ 50,000",
    paymentMode: "Bank Transfer",
    paymentTerms: "50% Down Payment, 50% upon Completion",
    paymentDeadline: "May 20, 2025",
    assignedStaff: "Staff 1",
    serviceStartDate: "May 09, 2025",
    estimatedEndDate: "May 16, 2025",
    warranty: "6 months",
  };

  const getStatusBadge = (status, type) => {
    const statusStyles = {
      serviceStatus: {
        Pending: "bg-gray-100 text-gray-800",
        Assigned: "bg-orange-200 text-orange-600",
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
      { label: "Approval", key: "approval" },
      { label: "Service Ongoing", key: "ongoing" },
      { label: "Completed", key: "completed" },
    ];

    const getCurrentStep = () => {
      switch (requestData.serviceStatus) {
        case "Pending":
          return 0;
        case "Assigned":
          return 1;
        case "Processing":
          return 1;
        case "Approval":
          return 2;
        case "Ongoing":
          return 3;
        case "Completed":
          return 4;
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
                    className={`w-9 lg:w-22 xl:w-42 2xl:w-58 h-0.5 flex-shrink-0 ${
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

  return (
    <CustomerLayout>
      <div className="pt-5">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/customer/service-tracker")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 cursor-pointer"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        </div>

        {/* Status Tracker */}
        <div className="p-6">
          <StatusTracker />
        </div>

        {/* Services Details */}
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6 pb-3 text-[#004785] border-b-2 border-gray-300">
            Service Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="inline text-sm font-medium text-gray-700 mr-2">
                Request ID:
              </label>
              <span className="text-sm text-gray-800">{requestData.id}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 mr-2">
                Service Status:
              </label>
              {getStatusBadge(requestData.serviceStatus, "serviceStatus")}
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
                Warranty:
              </label>
              <span className="text-sm text-gray-800">{requestData.warranty}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 mr-2">
                Warranty Status:
              </label>
              {getStatusBadge(requestData.warrantyStatus, "warrantyStatus")}
            </div>
            <div>
              <label className="inline text-sm font-medium text-gray-700 mr-2">
                Assigned Staff:
              </label>
              <span className="text-sm text-gray-800">{requestData.assignedStaff}</span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              List of Requested Services:
            </label>
          </div>

          {/* Services Table */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-black">
                    Service Category
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-black">
                    Service
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

        {/* Total Cost */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-500">Total Cost</h2>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#0260A0]">
                {requestData.totalCost}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Information */}
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
                {requestData.paymentMode}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 mr-2">
                Payment Status:
              </label>
              {getStatusBadge(requestData.paymentStatus, "paymentStatus")}
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

          {/* Payment Breakdown */}
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
                    Status
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
                        "-"
                      ) : (
                        <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800 mx-auto">
                          <Eye size={16} />
                          View
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-4 text-xs xl:text-sm text-gray-800 text-center">
                      {payment.paidOn}
                    </td>
                    <td className="px-3 py-4 text-xs xl:text-sm text-gray-800 text-center">
                      {getStatusBadge(payment.paymentStatus, "paymentStatus")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Duration Information */}
        <div className="p-6 mb-10">
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
            <div>
              <label className="inline text-sm font-medium text-gray-700 mr-2">
                Service Start Date:
              </label>
              <span className="text-sm text-gray-800">
                {requestData.serviceStartDate}
              </span>
            </div>
            <div>
              <label className="inline text-sm font-medium text-gray-700 mr-2">
                Request Acknowledged On:
              </label>
              <span className="text-sm text-gray-800">
                -
              </span>
            </div>
            <div>
              <label className="inline text-sm font-medium text-gray-700 mr-2">
                Service End Date:
              </label>
              <span className="text-sm text-gray-800">
                -
              </span>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerServiceRequestDetails;