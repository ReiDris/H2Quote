import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, X, Search, AlertCircle, Bot } from "lucide-react";
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
    isActive: true,
    keywords: "" 
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchPrompts();
  }, []);

  // Auto-hide success messages after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Auto-hide error messages after 5 seconds
  useEffect(() => {
    if (apiError) {
      const timer = setTimeout(() => setApiError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [apiError]);

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
          responseText: Array.isArray(intent.responses) && intent.responses.length > 0 
            ? intent.responses[0] 
            : '',
          category: intent.description || 'General',
          keywords: Array.isArray(intent.keywords) ? intent.keywords.join(", ") : "",
          isActive: intent.is_active,
          priority: intent.priority || 0,
          createdAt: intent.created_at
        }));
        
        setPrompts(transformedPrompts);
      } else {
        setApiError(data.message || "Failed to fetch prompts");
      }
    } catch (error) {
      console.error("Error fetching prompts:", error);
      setApiError("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.promptText.trim()) {
      newErrors.promptText = "Prompt text is required";
    } else if (formData.promptText.trim().length < 3) {
      newErrors.promptText = "Prompt text must be at least 3 characters";
    }
    
    if (!formData.responseText.trim()) {
      newErrors.responseText = "Response text is required";
    } else if (formData.responseText.trim().length < 5) {
      newErrors.responseText = "Response text must be at least 5 characters";
    }
    
    if (!formData.category.trim()) {
      newErrors.category = "Category is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Parse keywords from comma-separated string to array
  const parseKeywords = (keywordsString) => {
    if (!keywordsString || !keywordsString.trim()) {
      // If no keywords provided, use the prompt text as default
      return [formData.promptText.toLowerCase().trim()];
    }
    
    return keywordsString
      .split(",")
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 0);
  };

  const handleAddPrompt = async () => {
    if (!validateForm()) return;

    setApiError("");
    
    try {
      const keywordsArray = parseKeywords(formData.keywords);
      
      const payload = {
        intent_name: formData.promptText.trim(),
        description: formData.category.trim(),
        keywords: keywordsArray,
        responses: [formData.responseText.trim()],
        is_active: formData.isActive,
        priority: 0
      };

      console.log("Creating chat intent with payload:", payload);

      const response = await customizationAPI.createChatIntent(payload);
      const data = await response.json();
      
      if (data.success) {
        await fetchPrompts();
        setShowAddModal(false);
        resetForm();
        setSuccessMessage("✅ Prompt added successfully!");
        console.log("✅ Prompt added successfully");
      } else {
        // Handle specific error cases
        if (data.message && data.message.includes("duplicate") || 
            data.message && data.message.includes("unique")) {
          setApiError("A prompt with this name already exists. Please use a different name.");
        } else {
          setApiError(data.message || "Failed to add prompt");
        }
      }
    } catch (error) {
      console.error("Error adding prompt:", error);
      setApiError("Failed to add prompt. Please check your connection and try again.");
    }
  };

  const handleUpdatePrompt = async () => {
    if (!validateForm()) return;

    setApiError("");
    
    try {
      const keywordsArray = parseKeywords(formData.keywords);
      
      const payload = {
        intent_name: formData.promptText.trim(),
        description: formData.category.trim(),
        keywords: keywordsArray,
        responses: [formData.responseText.trim()],
        is_active: formData.isActive
      };

      console.log("Updating chat intent with payload:", payload);

      const response = await customizationAPI.updateChatIntent(selectedPrompt.id, payload);
      const data = await response.json();
      
      if (data.success) {
        await fetchPrompts();
        setShowEditModal(false);
        resetForm();
        setSuccessMessage("✅ Prompt updated successfully!");
        console.log("✅ Prompt updated successfully");
      } else {
        if (data.message && data.message.includes("duplicate") || 
            data.message && data.message.includes("unique")) {
          setApiError("A prompt with this name already exists. Please use a different name.");
        } else {
          setApiError(data.message || "Failed to update prompt");
        }
      }
    } catch (error) {
      console.error("Error updating prompt:", error);
      setApiError("Failed to update prompt. Please check your connection and try again.");
    }
  };

  const handleDeletePrompt = async () => {
    setApiError("");
    
    try {
      const response = await customizationAPI.deleteChatIntent(selectedPrompt.id);
      const data = await response.json();
      
      if (data.success) {
        await fetchPrompts();
        setShowDeleteConfirm(false);
        setSelectedPrompt(null);
        setSuccessMessage("✅ Prompt deleted successfully!");
        console.log("✅ Prompt deleted successfully");
      } else {
        setApiError(data.message || "Failed to delete prompt");
      }
    } catch (error) {
      console.error("Error deleting prompt:", error);
      setApiError("Failed to delete prompt. Please check your connection and try again.");
    }
  };

  const openAddModal = () => {
    resetForm();
    setApiError("");
    setShowAddModal(true);
  };

  const openEditModal = (prompt) => {
    setSelectedPrompt(prompt);
    setFormData({
      promptText: prompt.promptText,
      responseText: prompt.responseText,
      category: prompt.category,
      keywords: prompt.keywords || "",
      isActive: prompt.isActive
    });
    setApiError("");
    setShowEditModal(true);
  };

  const openDeleteConfirm = (prompt) => {
    setSelectedPrompt(prompt);
    setApiError("");
    setShowDeleteConfirm(true);
  };

  const resetForm = () => {
    setFormData({
      promptText: "",
      responseText: "",
      category: "",
      keywords: "",
      isActive: true
    });
    setErrors({});
    setApiError("");
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
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <span className="text-green-600">✓</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Error</p>
            <p className="text-sm">{apiError}</p>
          </div>
          <button
            onClick={() => setApiError("")}
            className="text-red-600 hover:text-red-800"
          >
            <X size={18} />
          </button>
        </div>
      )}

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
                  
                  <p className="text-sm text-gray-600 leading-relaxed mb-2">
                    {prompt.responseText}
                  </p>
                  
                  {prompt.keywords && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {prompt.keywords.split(",").map((keyword, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded"
                        >
                          {keyword.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-400">
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
                onClick={() => {
                  setShowAddModal(false);
                  setApiError("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {apiError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}

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

              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keywords (optional)
                </label>
                <input
                  type="text"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  placeholder="e.g., service, price, cost (comma-separated)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter keywords separated by commas. If left empty, the prompt text will be used.
                </p>
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
                onClick={() => {
                  setShowAddModal(false);
                  setApiError("");
                }}
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
                onClick={() => {
                  setShowEditModal(false);
                  setApiError("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {apiError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}

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

              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keywords (optional)
                </label>
                <input
                  type="text"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  placeholder="e.g., service, price, cost (comma-separated)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter keywords separated by commas. If left empty, the prompt text will be used.
                </p>
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
                onClick={() => {
                  setShowEditModal(false);
                  setApiError("");
                }}
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
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setApiError("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {apiError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}

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
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setApiError("");
                }}
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