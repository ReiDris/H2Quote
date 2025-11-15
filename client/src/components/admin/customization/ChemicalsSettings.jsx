import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, TestTube } from "lucide-react";

/**
 * Chemicals Settings Component
 * 
 * Manages chemicals catalog including:
 * - Brand and chemical name
 * - Price and capacity
 * - Hazard type
 * - Description and uses
 * - Stock status
 * 
 * TODO (Backend): API endpoints for chemicals CRUD operations
 */

const ChemicalsSettings = () => {
  const [chemicals, setChemicals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedChemical, setSelectedChemical] = useState(null);
  const [formData, setFormData] = useState({
    brand: "",
    chemicalName: "",
    description: "",
    price: "",
    capacity: "",
    hazardType: "",
    uses: "",
    isActive: true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchChemicals();
  }, []);

  /**
   * TODO (Backend): GET /api/chemicals
   */
  const fetchChemicals = async () => {
    try {
      setLoading(true);
      
      const dummyChemicals = [
        {
          chemicalId: 1,
          brand: "ANCO",
          chemicalName: "Corrosion Inhibitor 100",
          description: "High-performance corrosion inhibitor",
          price: 8500,
          capacity: "25L",
          hazardType: "Moderate",
          uses: "Industrial water systems",
          isActive: true
        },
        {
          chemicalId: 2,
          brand: "ANCO",
          chemicalName: "Scale Remover Pro",
          description: "Professional scale removal solution",
          price: 12000,
          capacity: "20L",
          hazardType: "High",
          uses: "Descaling equipment",
          isActive: true
        }
      ];

      setChemicals(dummyChemicals);
    } catch (error) {
      console.error("Error fetching chemicals:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * TODO (Backend): POST /api/chemicals
   */
  const handleAddChemical = async () => {
    const newErrors = {};
    
    if (!formData.brand.trim()) newErrors.brand = "Brand is required";
    if (!formData.chemicalName.trim()) newErrors.chemicalName = "Chemical name is required";
    if (!formData.price || formData.price <= 0) newErrors.price = "Valid price is required";
    if (!formData.capacity.trim()) newErrors.capacity = "Capacity is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const newChemical = {
        chemicalId: chemicals.length + 1,
        brand: formData.brand,
        chemicalName: formData.chemicalName,
        description: formData.description,
        price: parseFloat(formData.price),
        capacity: formData.capacity,
        hazardType: formData.hazardType,
        uses: formData.uses,
        isActive: formData.isActive
      };

      setChemicals([...chemicals, newChemical]);
      setShowAddModal(false);
      resetForm();
      
      console.log("✅ Chemical added successfully");
    } catch (error) {
      console.error("Error adding chemical:", error);
    }
  };

  /**
   * TODO (Backend): PUT /api/chemicals/:id
   */
  const handleUpdateChemical = async () => {
    const newErrors = {};
    
    if (!formData.brand.trim()) newErrors.brand = "Brand is required";
    if (!formData.chemicalName.trim()) newErrors.chemicalName = "Chemical name is required";
    if (!formData.price || formData.price <= 0) newErrors.price = "Valid price is required";
    if (!formData.capacity.trim()) newErrors.capacity = "Capacity is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setChemicals(chemicals.map(c =>
        c.chemicalId === selectedChemical.chemicalId
          ? {
              ...c,
              brand: formData.brand,
              chemicalName: formData.chemicalName,
              description: formData.description,
              price: parseFloat(formData.price),
              capacity: formData.capacity,
              hazardType: formData.hazardType,
              uses: formData.uses,
              isActive: formData.isActive
            }
          : c
      ));

      setShowEditModal(false);
      resetForm();
      
      console.log("✅ Chemical updated successfully");
    } catch (error) {
      console.error("Error updating chemical:", error);
    }
  };

  /**
   * TODO (Backend): DELETE /api/chemicals/:id
   */
  const handleDeleteChemical = async () => {
    try {
      setChemicals(chemicals.filter(c => c.chemicalId !== selectedChemical.chemicalId));
      setShowDeleteConfirm(false);
      setSelectedChemical(null);
      
      console.log("✅ Chemical deleted successfully");
    } catch (error) {
      console.error("Error deleting chemical:", error);
    }
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (chemical) => {
    setSelectedChemical(chemical);
    setFormData({
      brand: chemical.brand,
      chemicalName: chemical.chemicalName,
      description: chemical.description,
      price: chemical.price.toString(),
      capacity: chemical.capacity,
      hazardType: chemical.hazardType,
      uses: chemical.uses,
      isActive: chemical.isActive
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (chemical) => {
    setSelectedChemical(chemical);
    setShowDeleteConfirm(true);
  };

  const resetForm = () => {
    setFormData({
      brand: "",
      chemicalName: "",
      description: "",
      price: "",
      capacity: "",
      hazardType: "",
      uses: "",
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

  const filteredChemicals = chemicals.filter(chemical =>
    chemical.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chemical.chemicalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chemical.description.toLowerCase().includes(searchTerm.toLowerCase())
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
            placeholder="Search chemicals..."
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
          Add Chemical
        </button>
      </div>

      {/* Chemicals Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Brand / Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Capacity</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Price</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Hazard</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredChemicals.length > 0 ? (
              filteredChemicals.map((chemical) => (
                <tr key={chemical.chemicalId} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{chemical.brand} - {chemical.chemicalName}</div>
                      <div className="text-xs text-gray-500">{chemical.description}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {chemical.capacity}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    ₱{chemical.price.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded font-medium ${
                      chemical.hazardType === 'High' 
                        ? 'bg-red-100 text-red-700'
                        : chemical.hazardType === 'Moderate'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {chemical.hazardType || 'Low'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {chemical.isActive ? (
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
                        onClick={() => openEditModal(chemical)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                        title="Edit Chemical"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(chemical)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        title="Delete Chemical"
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
                  <TestTube size={48} className="mx-auto mb-3 text-gray-400" />
                  <p>No chemicals found</p>
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

      {/* Add/Edit/Delete Modals - Similar structure to Services */}
      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <h2 className="text-lg font-bold text-[#004785]">Add New Chemical</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">✕</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="brand" value={formData.brand} onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.brand ? 'border-red-300' : 'border-gray-300'}`} />
                  {errors.brand && <p className="mt-1 text-sm text-red-600">{errors.brand}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chemical Name <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="chemicalName" value={formData.chemicalName} onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.chemicalName ? 'border-red-300' : 'border-gray-300'}`} />
                  {errors.chemicalName && <p className="mt-1 text-sm text-red-600">{errors.chemicalName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <input type="text" name="capacity" value={formData.capacity} onChange={handleInputChange} placeholder="e.g., 25L"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.capacity ? 'border-red-300' : 'border-gray-300'}`} />
                  {errors.capacity && <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>}
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Uses</label>
                <input type="text" name="uses" value={formData.uses} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
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
              <button onClick={handleAddChemical}
                className="flex-1 px-4 py-2 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors cursor-pointer">
                Add Chemical
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - Same structure as Add but with title "Edit Chemical" and handleUpdateChemical */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <h2 className="text-lg font-bold text-[#004785]">Edit Chemical</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">✕</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand <span className="text-red-500">*</span></label>
                  <input type="text" name="brand" value={formData.brand} onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.brand ? 'border-red-300' : 'border-gray-300'}`} />
                  {errors.brand && <p className="mt-1 text-sm text-red-600">{errors.brand}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chemical Name <span className="text-red-500">*</span></label>
                  <input type="text" name="chemicalName" value={formData.chemicalName} onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.chemicalName ? 'border-red-300' : 'border-gray-300'}`} />
                  {errors.chemicalName && <p className="mt-1 text-sm text-red-600">{errors.chemicalName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Uses</label>
                <input type="text" name="uses" value={formData.uses} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
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
              <button onClick={handleUpdateChemical}
                className="flex-1 px-4 py-2 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors cursor-pointer">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedChemical && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-md">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 mb-4">
              <h2 className="text-lg font-bold text-[#004785]">Confirm Delete</h2>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">✕</button>
            </div>

            <div className="mb-6">
              <p className="text-black text-sm mb-4">Are you sure you want to delete this chemical?</p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-900 mb-1">{selectedChemical.brand} - {selectedChemical.chemicalName}</p>
                <p className="text-sm text-gray-600">{selectedChemical.description}</p>
                <p className="text-sm text-gray-900 font-medium mt-2">Price: ₱{selectedChemical.price.toLocaleString()}</p>
              </div>
              <p className="text-gray-600 text-xs mt-3">This action cannot be undone.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={handleDeleteChemical}
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

export default ChemicalsSettings;