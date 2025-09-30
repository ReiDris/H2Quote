import React from "react";
import { useParams } from "react-router-dom";
import StaffLayout from "../../layouts/StaffLayout"; // You'll need to create this if it doesn't exist
import ServiceRequestDetailsView from "../../components/shared/ServiceRequestDetailsView";

const ServiceRequestDetails = () => {
  const { requestNumber } = useParams();

  return (
    <StaffLayout>
      <ServiceRequestDetailsView 
        requestNumber={requestNumber} 
        userRole="staff" 
      />
    </StaffLayout>
  );
};

export default ServiceRequestDetails;