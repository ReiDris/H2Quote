import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Droplet } from "lucide-react";
import { customizationAPI } from "../../../config/api";

const RefrigerantsSettings = () => {
  const [refrigerants, setRefrigerants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedRefrigerant, setSelectedRefrigerant] = useState(null);
  const [formData, setFormData] = useState({
    refrigerantName: "",
    description: "",
    price: "",
    capacity: "",
    chemicalComponents: "",
    hazardType: "",
    isActive: true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchRefrigerants();
  }, []);

  /**
   * TODO (Backend): GET /api/refrigerants
   */
  const fetchRefrigerants = async () => {
  try {
    setLoading(true);
    
    const response = await customizationAPI.getAllRefrigerants();
    const data = await response.json();
    
    if (data.success) {
      const transformedRefrigerants = data.data.map(refrigerant => ({
        refrigerantId: refrigerant.refrigerant_id,
        refrigerantName: refrigerant.refrigerant_name,
        description: refrigerant.description,
        price: parseFloat(refrigerant.price),
        capacity: refrigerant.capacity,
        chemicalComponents: refrigerant.chemical_components,
        hazardType: refrigerant.hazard_type,
        isActive: refrigerant.is_active
      }));
      
      setRefrigerants(transformedRefrigerants);
    }
  } catch (error) {
    console.error("Error fetching refrigerants:", error);
  } finally {
    setLoading(false);
  }
};

  /**
   * TODO (Backend): POST /api/refrigerants
   */
  const handleAddRefrigerant = async () => {
  const newErrors = {};
  if (!formData.refrigerantName.trim()) newErrors.refrigerantName = "Refrigerant name is required";
  if (!formData.price || formData.price <= 0) newErrors.price = "Valid price is required";
  if (!formData.capacity.trim()) newErrors.capacity = "Capacity is required";

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  try {
    const response = await customizationAPI.createRefrigerant({
      refrigerant_name: formData.refrigerantName,
      description: formData.description,
      price: parseFloat(formData.price),
      capacity: formData.capacity,
      chemical_components: formData.chemicalComponents,
      hazard_type: formData.hazardType,
      is_active: formData.isActive
    });

    const data = await response.json();
    
    if (data.success) {
      await fetchRefrigerants(); // Refresh the list
      setShowAddModal(false);
      resetForm();
      console.log("✅ Refrigerant added successfully");
    }
  } catch (error) {
    console.error("Error adding refrigerant:", error);
  }
};

  /**
   * TODO (Backend): PUT /api/refrigerants/:id
   */
  const handleUpdateRefrigerant = async () => {
  const newErrors = {};
  if (!formData.refrigerantName.trim()) newErrors.refrigerantName = "Refrigerant name is required";
  if (!formData.price || formData.price <= 0) newErrors.price = "Valid price is required";
  if (!formData.capacity.trim()) newErrors.capacity = "Capacity is required";

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  try {
    const response = await customizationAPI.updateRefrigerant(selectedRefrigerant.refrigerantId, {
      refrigerant_name: formData.refrigerantName,
      description: formData.description,
      price: parseFloat(formData.price),
      capacity: formData.capacity,
      chemical_components: formData.chemicalComponents,
      hazard_type: formData.hazardType,
      is_active: formData.isActive
    });

    const data = await response.json();
    
    if (data.success) {
      await fetchRefrigerants(); // Refresh the list
      setShowEditModal(false);
      resetForm();
      console.log("✅ Refrigerant updated successfully");
    }
  } catch (error) {
    console.error("Error updating refrigerant:", error);
  }
};

  /**
   * TODO (Backend): DELETE /api/refrigerants/:id
   */
  const handleDeleteRefrigerant = async () => {
  try {
    const response = await customizationAPI.deleteRefrigerant(selectedRefrigerant.refrigerantId);
    const data = await response.json();
    
    if (data.success) {
      await fetchRefrigerants(); // Refresh the list
      setShowDeleteConfirm(false);
      setSelectedRefrigerant(null);
      console.log("✅ Refrigerant deleted successfully");
    }
  } catch (error) {
    console.error("Error deleting refrigerant:", error);
  }
};

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (refrigerant) => {
    setSelectedRefrigerant(refrigerant);
    setFormData({
      refrigerantName: refrigerant.refrigerantName,
      description: refrigerant.description,
      price: refrigerant.price.toString(),
      capacity: refrigerant.capacity,
      chemicalComponents: refrigerant.chemicalComponents,
      hazardType: refrigerant.hazardType,
      isActive: refrigerant.isActive
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (refrigerant) => {
    setSelectedRefrigerant(refrigerant);
    setShowDeleteConfirm(true);
  };

  const resetForm = () => {
    setFormData({
      refrigerantName: "",
      description: "",
      price: "",
      capacity: "",
      chemicalComponents: "",
      hazardType: "",
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

  const filteredRefrigerants = refrigerants.filter(refrigerant =>
    refrigerant.refrigerantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    refrigerant.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    refrigerant.chemicalComponents.toLowerCase().includes(searchTerm.toLowerCase())
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
            placeholder="Search refrigerants..."
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
          Add Refrigerant
        </button>
      </div>

      {/* Refrigerants Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Refrigerant Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Components</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Capacity</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Price</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Hazard</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRefrigerants.length > 0 ? (
              filteredRefrigerants.map((refrigerant) => (
                <tr key={refrigerant.refrigerantId} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{refrigerant.refrigerantName}</div>
                      <div className="text-xs text-gray-500">{refrigerant.description}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {refrigerant.chemicalComponents}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {refrigerant.capacity}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    ₱{refrigerant.price.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded font-medium ${
                      refrigerant.hazardType === 'High' 
                        ? 'bg-red-100 text-red-700'
                        : refrigerant.hazardType === 'Moderate'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {refrigerant.hazardType || 'Low'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {refrigerant.isActive ? (
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
                        onClick={() => openEditModal(refrigerant)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                        title="Edit Refrigerant"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(refrigerant)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        title="Delete Refrigerant"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  <Droplet size={48} className="mx-auto mb-3 text-gray-400" />
                  <p>No refrigerants found</p>
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <h2 className="text-lg font-bold text-[#004785]">Add New Refrigerant</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refrigerant Name <span className="text-red-500">*</span>
                </label>
                <input type="text" name="refrigerantName" value={formData.refrigerantName} onChange={handleInputChange} placeholder="e.g., R-22, R-410A"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.refrigerantName ? 'border-red-300' : 'border-gray-300'}`} />
                {errors.refrigerantName && <p className="mt-1 text-sm text-red-600">{errors.refrigerantName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₱) <span className="text-red-500">*</span>
                  </label>
                  <input type="number" name="price" value={formData.price} onChange={handleInputChange} min="0" step="0.01"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.price ? 'border-red-300' : 'border-gray-300'}`} />
                  {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="capacity" value={formData.capacity} onChange={handleInputChange} placeholder="e.g., 13.6kg"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.capacity ? 'border-red-300' : 'border-gray-300'}`} />
                  {errors.capacity && <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chemical Components</label>
                <input type="text" name="chemicalComponents" value={formData.chemicalComponents} onChange={handleInputChange}
                  placeholder="e.g., 50% R-32 / 50% R-125"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hazard Type</label>
                <select name="hazardType" value={formData.hazardType} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Select hazard level</option>
                  <option value="Low">Low</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer" />
                <label htmlFor="isActive" className="text-sm text-gray-700 cursor-pointer">Active</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
              <button onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={handleAddRefrigerant}
                className="flex-1 px-4 py-2 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors cursor-pointer">
                Add Refrigerant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - Same as Add but with Edit title and handleUpdateRefrigerant */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <h2 className="text-lg font-bold text-[#004785]">Edit Refrigerant</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Refrigerant Name <span className="text-red-500">*</span></label>
                <input type="text" name="refrigerantName" value={formData.refrigerantName} onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.refrigerantName ? 'border-red-300' : 'border-gray-300'}`} />
                {errors.refrigerantName && <p className="mt-1 text-sm text-red-600">{errors.refrigerantName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₱) <span className="text-red-500">*</span></label>
                  <input type="number" name="price" value={formData.price} onChange={handleInputChange} min="0" step="0.01"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.price ? 'border-red-300' : 'border-gray-300'}`} />
                  {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity <span className="text-red-500">*</span></label>
                  <input type="text" name="capacity" value={formData.capacity} onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.capacity ? 'border-red-300' : 'border-gray-300'}`} />
                  {errors.capacity && <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chemical Components</label>
                <input type="text" name="chemicalComponents" value={formData.chemicalComponents} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hazard Type</label>
                <select name="hazardType" value={formData.hazardType} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Select hazard level</option>
                  <option value="Low">Low</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive-edit" name="isActive" checked={formData.isActive} onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer" />
                <label htmlFor="isActive-edit" className="text-sm text-gray-700 cursor-pointer">Active</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
              <button onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={handleUpdateRefrigerant}
                className="flex-1 px-4 py-2 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors cursor-pointer">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedRefrigerant && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-md">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 mb-4">
              <h2 className="text-lg font-bold text-[#004785]">Confirm Delete</h2>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">✕</button>
            </div>

            <div className="mb-6">
              <p className="text-black text-sm mb-4">Are you sure you want to delete this refrigerant?</p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-900 mb-1">{selectedRefrigerant.refrigerantName}</p>
                <p className="text-sm text-gray-600">{selectedRefrigerant.description}</p>
                <p className="text-sm text-gray-900 font-medium mt-2">Price: ₱{selectedRefrigerant.price.toLocaleString()}</p>
              </div>
              <p className="text-gray-600 text-xs mt-3">This action cannot be undone.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={handleDeleteRefrigerant}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefrigerantsSettings;