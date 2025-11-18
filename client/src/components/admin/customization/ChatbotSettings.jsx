import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, X, Search } from "lucide-react";
import { customizationAPI } from "../../../config/api";

const ChatbotSettings = () => {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [formData, setFormData] = useState({
    promptText: "",
    responseText: "",
    category: "",
    isActive: true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchPrompts();
  }, []);

  /**
   * TODO (Backend): Implement API call to fetch all chatbot prompts
   * Expected API: GET /api/chatbot/prompts
   * Expected Response: { success: true, data: [...prompts] }
   */
  const fetchPrompts = async () => {
  try {
    setLoading(true);
    
    const response = await customizationAPI.getChatIntents();
    const data = await response.json();
    
    if (data.success) {
      // Transform backend data to match frontend structure
      const transformedPrompts = data.data.map(intent => ({
        id: intent.intent_id,
        promptText: intent.intent_name,
        responseText: intent.responses[0] || '', // Use first response
        category: intent.description || 'General',
        isActive: intent.is_active,
        createdAt: intent.created_at
      }));
      
      setPrompts(transformedPrompts);
    }
  } catch (error) {
    console.error("Error fetching prompts:", error);
  } finally {
    setLoading(false);
  }
};

  /**
   * TODO (Backend): Implement API call to add new prompt
   * Expected API: POST /api/chatbot/prompts
   * Expected Body: { promptText, responseText, category, isActive }
   */
  const handleAddPrompt = async () => {
  const newErrors = {};
  if (!formData.promptText.trim()) newErrors.promptText = "Prompt text is required";
  if (!formData.responseText.trim()) newErrors.responseText = "Response text is required";
  if (!formData.category.trim()) newErrors.category = "Category is required";

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  try {
    const response = await customizationAPI.createChatIntent({
      intent_name: formData.promptText,
      description: formData.category,
      keywords: [formData.promptText.toLowerCase()],
      responses: [formData.responseText],
      is_active: formData.isActive,
      priority: 0
    });

    const data = await response.json();
    
    if (data.success) {
      await fetchPrompts(); // Refresh the list
      setShowAddModal(false);
      resetForm();
      console.log("✅ Prompt added successfully");
    }
  } catch (error) {
    console.error("Error adding prompt:", error);
  }
};

  /**
   * TODO (Backend): Implement API call to update prompt
   * Expected API: PUT /api/chatbot/prompts/:id
   * Expected Body: { promptText, responseText, category, isActive }
   */
  const handleUpdatePrompt = async () => {
  const newErrors = {};
  if (!formData.promptText.trim()) newErrors.promptText = "Prompt text is required";
  if (!formData.responseText.trim()) newErrors.responseText = "Response text is required";
  if (!formData.category.trim()) newErrors.category = "Category is required";

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  try {
    const response = await customizationAPI.updateChatIntent(selectedPrompt.id, {
      intent_name: formData.promptText,
      description: formData.category,
      keywords: [formData.promptText.toLowerCase()],
      responses: [formData.responseText],
      is_active: formData.isActive
    });

    const data = await response.json();
    
    if (data.success) {
      await fetchPrompts(); // Refresh the list
      setShowEditModal(false);
      resetForm();
      console.log("✅ Prompt updated successfully");
    }
  } catch (error) {
    console.error("Error updating prompt:", error);
  }
};

  /**
   * TODO (Backend): Implement API call to delete prompt
   * Expected API: DELETE /api/chatbot/prompts/:id
   */
  const handleDeletePrompt = async () => {
  try {
    const response = await customizationAPI.deleteChatIntent(selectedPrompt.id);
    const data = await response.json();
    
    if (data.success) {
      await fetchPrompts(); // Refresh the list
      setShowDeleteConfirm(false);
      setSelectedPrompt(null);
      console.log("✅ Prompt deleted successfully");
    }
  } catch (error) {
    console.error("Error deleting prompt:", error);
  }
};

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (prompt) => {
    setSelectedPrompt(prompt);
    setFormData({
      promptText: prompt.promptText,
      responseText: prompt.responseText,
      category: prompt.category,
      isActive: prompt.isActive
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (prompt) => {
    setSelectedPrompt(prompt);
    setShowDeleteConfirm(true);
  };

  const resetForm = () => {
    setFormData({
      promptText: "",
      responseText: "",
      category: "",
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
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // Filter prompts based on search term
  const filteredPrompts = prompts.filter(prompt =>
    prompt.promptText.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prompt.responseText.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prompt.category.toLowerCase().includes(searchTerm.toLowerCase())
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
            placeholder="Search prompts..."
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
          Add New Prompt
        </button>
      </div>

      {/* Prompts List */}
      <div className="space-y-3">
        {filteredPrompts.length > 0 ? (
          filteredPrompts.map((prompt) => (
            <div
              key={prompt.id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                      {prompt.category}
                    </span>
                    {!prompt.isActive && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded font-medium">
                        Inactive
                      </span>
                    )}
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {prompt.promptText}
                  </h4>
                  
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {prompt.responseText}
                  </p>
                  
                  <p className="text-xs text-gray-400 mt-2">
                    Created: {new Date(prompt.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(prompt)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit Prompt"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => openDeleteConfirm(prompt)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Prompt"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Bot size={48} className="mx-auto mb-3 text-gray-400" />
            <p>No prompts found</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-2 text-blue-600 hover:underline cursor-pointer"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Prompt Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <h2 className="text-lg font-bold text-[#004785]">Add New Prompt</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="e.g., Services, General, Quotations"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.category ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                )}
              </div>

              {/* Prompt Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prompt / Question <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="promptText"
                  value={formData.promptText}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="What question or prompt should trigger this response?"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.promptText ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.promptText && (
                  <p className="mt-1 text-sm text-red-600">{errors.promptText}</p>
                )}
              </div>

              {/* Response Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Response <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="responseText"
                  value={formData.responseText}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="What should the chatbot respond with?"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.responseText ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.responseText && (
                  <p className="mt-1 text-sm text-red-600">{errors.responseText}</p>
                )}
              </div>

              {/* Active Status */}
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
                  Active (chatbot will use this prompt)
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
                onClick={handleAddPrompt}
                className="flex-1 px-4 py-2 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors cursor-pointer"
              >
                Add Prompt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Prompt Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <h2 className="text-lg font-bold text-[#004785]">Edit Prompt</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="e.g., Services, General, Quotations"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.category ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                )}
              </div>

              {/* Prompt Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prompt / Question <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="promptText"
                  value={formData.promptText}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="What question or prompt should trigger this response?"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.promptText ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.promptText && (
                  <p className="mt-1 text-sm text-red-600">{errors.promptText}</p>
                )}
              </div>

              {/* Response Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Response <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="responseText"
                  value={formData.responseText}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="What should the chatbot respond with?"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.responseText ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.responseText && (
                  <p className="mt-1 text-sm text-red-600">{errors.responseText}</p>
                )}
              </div>

              {/* Active Status */}
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
                  Active (chatbot will use this prompt)
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
                onClick={handleUpdatePrompt}
                className="flex-1 px-4 py-2 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedPrompt && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-md">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 mb-4">
              <h2 className="text-lg font-bold text-[#004785]">Confirm Delete</h2>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-black text-sm mb-4">
                Are you sure you want to delete this prompt?
              </p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-900 mb-1">
                  {selectedPrompt.promptText}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedPrompt.responseText}
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
                onClick={handleDeletePrompt}
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

export default ChatbotSettings;