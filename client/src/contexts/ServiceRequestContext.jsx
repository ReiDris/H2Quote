import React, { createContext, useContext, useState } from 'react';

const ServiceRequestContext = createContext();

export const useServiceRequest = () => {
  const context = useContext(ServiceRequestContext);
  if (!context) {
    throw new Error('useServiceRequest must be used within ServiceRequestProvider');
  }
  return context;
};

export const ServiceRequestProvider = ({ children }) => {
  const [selectedServices, setSelectedServices] = useState([]);

  const addService = (service) => {
    const existingService = selectedServices.find(s => s.id === service.id);
    
    if (existingService) {
      setSelectedServices(prev => 
        prev.map(s => 
          s.id === service.id 
            ? { ...s, quantity: s.quantity + 1 }
            : s
        )
      );
    } else {
      setSelectedServices(prev => [...prev, {
        id: service.id,
        name: service.title,
        category: service.category,
        basePrice: service.basePrice,
        quantity: 1,
        type: service.type,
        duration: service.duration,
        estimated_duration_hours: service.estimated_duration_hours
      }]);
    }
  };

  const removeService = (serviceId) => {
    setSelectedServices(prev => prev.filter(s => s.id !== serviceId));
  };

  const updateQuantity = (serviceId, newQuantity) => {
    if (newQuantity <= 0) {
      removeService(serviceId);
    } else {
      setSelectedServices(prev =>
        prev.map(s =>
          s.id === serviceId ? { ...s, quantity: newQuantity } : s
        )
      );
    }
  };

  const clearServices = () => {
    setSelectedServices([]);
  };

  return (
    <ServiceRequestContext.Provider
      value={{
        selectedServices,
        setSelectedServices,
        addService,
        removeService,
        updateQuantity,
        clearServices
      }}
    >
      {children}
    </ServiceRequestContext.Provider>
  );
};