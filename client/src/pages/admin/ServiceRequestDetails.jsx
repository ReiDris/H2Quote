import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Eye } from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";

const ServiceRequestDetails = () => {
  const [serviceStatus, setServiceStatus] = useState("Pending");
  const [paymentStatus, setPaymentStatus] = useState("Pending");
  const [warrantyStatus, setWarrantyStatus] = useState("Pending");
  const [serviceStartDate, setServiceStartDate] = useState("");
  const [serviceEndDate, setServiceEndDate] = useState("");
  const navigate = useNavigate();

  // Mock data for the specific request (this would come from props or API)
  const requestData = {
    id: "#REQ01",
    requestedAt: "May 07, 2025 - 10:34 AM",
    customer: {
      name: "John Doe",
      company: "Company A",
      email: "company@gmail.com",
      contact: "09654840369",
    },
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
        proofOfPayment: "-",
        paidOn: "Pending",
        paymentStatus: "Pending",
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
    paymentTerms: "50% Exp. 30% upon Completion",
    paymentDeadline: "Tomorrow",
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
      switch (serviceStatus) {
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
                    className={`w-9 lg:w-22 xl:w-56 h-0.5 flex-shrink-0 ${
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
    <AdminLayout>
      <div>
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/service-tracker")}
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

        {/* Customer Information */}
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
                Email: company@gmail.com
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

        {/* Service Details */}
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
                onChange={(e) => setServiceStatus(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-2 py-1 w-50 cursor-pointer"
              >
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Assigned">Assigned</option>
                <option value="Ongoing">Ongoing</option>
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
              <span className="text-sm text-gray-800">Not yet decided</span>
            </div>
            <div>
              <label className="inline text-sm font-medium text-gray-700 mr-2">
                Customer Remarks:
              </label>
              <span className="text-sm text-gray-800">-</span>
            </div>
            <div>
              <label className="inline text-sm font-medium text-gray-700 mr-2">
                Warranty Fulfillment Status:
              </label>
              <span className="text-sm text-gray-800">-</span>
            </div>
            <div className="col-span-2">
              <label className="inline text-sm font-medium text-gray-700 mr-2">
                Assigned Staff:
              </label>
              <select
                value={serviceStatus}
                onChange={(e) => setServiceStatus(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-2 py-1 w-50 cursor-pointer"
              >
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Assigned">Assigned</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
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
                    Total Estimated Price
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

        {/* Availed Discounts */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-500">
              Availed Discounts
            </h2>
            <div className="flex gap-2">
              <button className="p-3 text-[#0260A0] border border-gray-300 text-sm rounded-lg font-semibold cursor-pointer">
                5%
              </button>
              <button className="p-3 text-[#0260A0] border border-[#0260A0] text-sm rounded-lg font-semibold bg-[#F0F8FF] cursor-pointer">
                No Discount
              </button>
            </div>
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

        {/* Payment */}
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
            <div className="flex items-center">
              <label className="inline text-sm font-medium text-gray-700 mr-2">
                Payment Status:
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
                    Payment Status
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
                        <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
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
                        className="text-xs xl:text-sm border border-gray-300 rounded p-2"
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

        {/* Duration */}
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
                <input
                  type="date"
                  value={serviceStartDate}
                  onChange={(e) => setServiceStartDate(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-2 py-2 w-50 cursor-pointer text-gray-400"
                />
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
              <span className="text-sm text-gray-800">-</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-5">
          <button className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl cursor-pointer hover:bg-gray-200 transition-all">
            Cancel
          </button>
          <button className="flex-1 px-6 py-2 bg-[#004785] text-white rounded-lg cursor-pointer">
            Save Changes
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ServiceRequestDetails;
