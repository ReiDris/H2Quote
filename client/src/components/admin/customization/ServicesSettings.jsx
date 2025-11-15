import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Package } from "lucide-react";

/**
 * Services Settings Component
 * 
 * Manages the services catalog including:
 * - Service name and description
 * - Base price
 * - Estimated duration
 * - Category
 * - Active status
 * 
 * TODO (Backend):
 * - API endpoints for services CRUD operations
 * - Service categories management
 */

const ServicesSettings = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({
    serviceName: "",
    description: "",
    categoryId: "",
    basePrice: "",
    estimatedDurationHours: "",
    isActive: true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  /**
   * TODO (Backend): Implement API call
   * GET /api/services
   */
  const fetchServices = async () => {
    try {
      setLoading(true);
      
      // PLACEHOLDER: Dummy data
      const dummyServices = [
        {
          serviceId: 1,
          serviceName: "Chemical Cleaning",
          description: "Industrial equipment chemical cleaning service",
          category: "Maintenance",
          categoryId: 1,
          basePrice: 15000,
          estimatedDurationHours: 48,
          isActive: true
        },
        {
          serviceId: 2,
          serviceName: "Descaling Service",
          description: "Professional descaling for industrial systems",
          category: "Maintenance",
          categoryId: 1,
          basePrice: 12000,
          estimatedDurationHours: 24,
          isActive: true
        },
        {
          serviceId: 3,
          serviceName: "Water Testing",
          description: "Comprehensive water quality analysis",
          category: "Testing",
          categoryId: 2,
          basePrice: 5000,
          estimatedDurationHours: 8,
          isActive: true
        }
      ];

      setServices(dummyServices);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * TODO (Backend): Implement API call
   * GET /api/service-categories
   */
  const fetchCategories = async () => {
    try {
      // PLACEHOLDER: Dummy categories
      const dummyCategories = [
        { categoryId: 1, categoryName: "Maintenance" },
        { categoryId: 2, categoryName: "Testing" },
        { categoryId: 3, categoryName: "Installation" }
      ];

      setCategories(dummyCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  /**
   * TODO (Backend): Implement API call
   * POST /api/services
   */
  const handleAddService = async () => {
    const newErrors = {};
    
    if (!formData.serviceName.trim()) {
      newErrors.serviceName = "Service name is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!formData.categoryId) {
      newErrors.categoryId = "Category is required";
    }
    if (!formData.basePrice || formData.basePrice <= 0) {
      newErrors.basePrice = "Valid price is required";
    }
    if (!formData.estimatedDurationHours || formData.estimatedDurationHours <= 0) {
      newErrors.estimatedDurationHours = "Valid duration is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // PLACEHOLDER: Simulated add
      const category = categories.find(c => c.categoryId === parseInt(formData.categoryId));
      const newService = {
        serviceId: services.length + 1,
        serviceName: formData.serviceName,
        description: formData.description,
        category: category.categoryName,
        categoryId: formData.categoryId,
        basePrice: parseFloat(formData.basePrice),
        estimatedDurationHours: parseInt(formData.estimatedDurationHours),
        isActive: formData.isActive
      };

      setServices([...services, newService]);
      setShowAddModal(false);
      resetForm();
      
      console.log("✅ Service added successfully");
    } catch (error) {
      console.error("Error adding service:", error);
    }
  };

  /**
   * TODO (Backend): Implement API call
   * PUT /api/services/:id
   */
  const handleUpdateService = async () => {
    const newErrors = {};
    
    if (!formData.serviceName.trim()) {
      newErrors.serviceName = "Service name is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!formData.categoryId) {
      newErrors.categoryId = "Category is required";
    }
    if (!formData.basePrice || formData.basePrice <= 0) {
      newErrors.basePrice = "Valid price is required";
    }
    if (!formData.estimatedDurationHours || formData.estimatedDurationHours <= 0) {
      newErrors.estimatedDurationHours = "Valid duration is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // PLACEHOLDER: Simulated update
      const category = categories.find(c => c.categoryId === parseInt(formData.categoryId));
      
      setServices(services.map(s =>
        s.serviceId === selectedService.serviceId
          ? {
              ...s,
              serviceName: formData.serviceName,
              description: formData.description,
              category: category.categoryName,
              categoryId: formData.categoryId,
              basePrice: parseFloat(formData.basePrice),
              estimatedDurationHours: parseInt(formData.estimatedDurationHours),
              isActive: formData.isActive
            }
          : s
      ));

      setShowEditModal(false);
      resetForm();
      
      console.log("✅ Service updated successfully");
    } catch (error) {
      console.error("Error updating service:", error);
    }
  };

  /**
   * TODO (Backend): Implement API call
   * DELETE /api/services/:id
   */
  const handleDeleteService = async () => {
    try {
      // PLACEHOLDER: Simulated delete
      setServices(services.filter(s => s.serviceId !== selectedService.serviceId));
      setShowDeleteConfirm(false);
      setSelectedService(null);
      
      console.log("✅ Service deleted successfully");
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (service) => {
    setSelectedService(service);
    setFormData({
      serviceName: service.serviceName,
      description: service.description,
      categoryId: service.categoryId.toString(),
      basePrice: service.basePrice.toString(),
      estimatedDurationHours: service.estimatedDurationHours.toString(),
      isActive: service.isActive
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (service) => {
    setSelectedService(service);
    setShowDeleteConfirm(true);
  };

  const resetForm = () => {
    setFormData({
      serviceName: "",
      description: "",
      categoryId: "",
      basePrice: "",
      estimatedDurationHours: "",
      isActive: true
    });
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const filteredServices = services.filter(service =>
    service.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Add Button */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors cursor-pointer"
        >
          <Plus size={20} />
          Add Service
        </button>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Service Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Price</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Duration</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredServices.length > 0 ? (
              filteredServices.map((service) => (
                <tr key={service.serviceId} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{service.serviceName}</div>
                      <div className="text-xs text-gray-500">{service.description}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {service.category}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    ₱{service.basePrice.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {service.estimatedDurationHours} hours
                  </td>
                  <td className="px-4 py-3">
                    {service.isActive ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded font-medium">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(service)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                        title="Edit Service"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(service)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        title="Delete Service"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                  <Package size={48} className="mx-auto mb-3 text-gray-400" />
                  <p>No services found</p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="mt-2 text-blue-600 hover:underline cursor-pointer"
                    >
                      Clear search
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <h2 className="text-lg font-bold text-[#004785]">Add New Service</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="serviceName"
                    value={formData.serviceName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.serviceName ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.serviceName && (
                    <p className="mt-1 text-sm text-red-600">{errors.serviceName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.categoryId ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.categoryId} value={cat.categoryId}>
                        {cat.categoryName}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Price (₱) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="basePrice"
                    value={formData.basePrice}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.basePrice ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.basePrice && (
                    <p className="mt-1 text-sm text-red-600">{errors.basePrice}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Est. Duration (hours) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="estimatedDurationHours"
                    value={formData.estimatedDurationHours}
                    onChange={handleInputChange}
                    min="1"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.estimatedDurationHours ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.estimatedDurationHours && (
                    <p className="mt-1 text-sm text-red-600">{errors.estimatedDurationHours}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700 cursor-pointer">
                  Active (service will be visible to customers)
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddService}
                className="flex-1 px-4 py-2 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors cursor-pointer"
              >
                Add Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal (Similar structure to Add Modal) */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <h2 className="text-lg font-bold text-[#004785]">Edit Service</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="serviceName"
                    value={formData.serviceName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.serviceName ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.serviceName && (
                    <p className="mt-1 text-sm text-red-600">{errors.serviceName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.categoryId ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.categoryId} value={cat.categoryId}>
                        {cat.categoryName}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Price (₱) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="basePrice"
                    value={formData.basePrice}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.basePrice ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.basePrice && (
                    <p className="mt-1 text-sm text-red-600">{errors.basePrice}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Est. Duration (hours) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="estimatedDurationHours"
                    value={formData.estimatedDurationHours}
                    onChange={handleInputChange}
                    min="1"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.estimatedDurationHours ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.estimatedDurationHours && (
                    <p className="mt-1 text-sm text-red-600">{errors.estimatedDurationHours}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive-edit"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="isActive-edit" className="text-sm text-gray-700 cursor-pointer">
                  Active (service will be visible to customers)
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateService}
                className="flex-1 px-4 py-2 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedService && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-md">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 mb-4">
              <h2 className="text-lg font-bold text-[#004785]">Confirm Delete</h2>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <p className="text-black text-sm mb-4">
                Are you sure you want to delete this service?
              </p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-900 mb-1">
                  {selectedService.serviceName}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedService.description}
                </p>
                <p className="text-sm text-gray-900 font-medium mt-2">
                  Price: ₱{selectedService.basePrice.toLocaleString()}
                </p>
              </div>
              <p className="text-gray-600 text-xs mt-3">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteService}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesSettings;