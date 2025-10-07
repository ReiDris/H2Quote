import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Search, AlertCircle } from "lucide-react";
import API_URL from '../../config/api';

const ManageRequestItemsModal = ({ isOpen, onClose, requestId, onSuccess }) => {
  const [activeTab, setActiveTab] = useState("chemicals");
  const [items, setItems] = useState([]);
  const [currentItems, setCurrentItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchAvailableItems();
      fetchCurrentItems();
    }
  }, [isOpen, activeTab]);

  const fetchAvailableItems = async () => {
    try {
      const token = localStorage.getItem("h2quote_token");
      const endpoint = activeTab === "chemicals" ? "chemicals" : "refrigerants";

      const response = await fetch(
        `${API_URL}/api/service-requests/${endpoint}/catalog`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setItems(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const fetchCurrentItems = async () => {
    try {
      const token = localStorage.getItem("h2quote_token");

      const response = await fetch(
        `${API_URL}/api/service-requests/${requestId}/details`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const allItems = data.data.items || [];
        const filtered = allItems.filter((item) =>
          activeTab === "chemicals"
            ? item.item_type === "chemical"
            : item.item_type === "refrigerant"
        );
        setCurrentItems(filtered);
      }
    } catch (error) {
      console.error("Error fetching current items:", error);
    }
  };

  const handleAddItem = async () => {
    if (!selectedItem) {
      setError("Please select an item");
      return;
    }

    if (quantity <= 0) {
      setError("Please enter a valid quantity");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("h2quote_token");
      // FIXED: Correct endpoint paths (plural)
      const endpoint =
        activeTab === "chemicals" ? "add-chemicals" : "add-refrigerants";

      // FIXED: Correct request body format (arrays)
      const requestBody =
        activeTab === "chemicals"
          ? {
              chemicals: [
                {
                  id: selectedItem.id,
                  quantity: parseInt(quantity),
                },
              ],
              adminNotes: notes || undefined,
            }
          : {
              refrigerants: [
                {
                  id: selectedItem.id,
                  quantity: parseInt(quantity),
                },
              ],
              adminNotes: notes || undefined,
            };

      const response = await fetch(
        `${API_URL}/api/service-requests/${requestId}/${endpoint}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message);
        setSelectedItem(null);
        setQuantity(1);
        setNotes("");
        fetchCurrentItems(); // Refresh the current items list in the modal

        // DON'T call onSuccess here - only call it when modal closes
        // This allows multiple additions without closing the modal

        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to add item");
      }
    } catch (error) {
      console.error("Error adding item:", error);
      setError("Failed to add item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = async (item) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("h2quote_token");
      const endpoint =
        activeTab === "chemicals" ? "add-chemicals" : "add-refrigerants";

      const requestBody =
        activeTab === "chemicals"
          ? {
              chemicals: [
                {
                  id: item.id,
                  quantity: 1, // Default quantity
                },
              ],
              adminNotes: "Quick add",
            }
          : {
              refrigerants: [
                {
                  id: item.id,
                  quantity: 1, // Default quantity
                },
              ],
              adminNotes: "Quick add",
            };

      const response = await fetch(
        `${API_URL}/api/service-requests/${requestId}/${endpoint}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(`✓ Added ${item.name}`);
        fetchCurrentItems();

        setTimeout(() => setSuccess(""), 2000);
      } else {
        setError(data.message || "Failed to add item");
      }
    } catch (error) {
      console.error("Error quick adding item:", error);
      setError("Failed to add item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!confirm("Are you sure you want to remove this item?")) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("h2quote_token");
      // FIXED: Correct endpoint path
      const endpoint =
        activeTab === "chemicals" ? "remove-chemicals" : "remove-refrigerants";

      // FIXED: Correct request body format (array of item IDs)
      const requestBody =
        activeTab === "chemicals"
          ? { chemicalItemIds: [itemId] }
          : { refrigerantItemIds: [itemId] };

      const response = await fetch(
        `${API_URL}/api/service-requests/${requestId}/${endpoint}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess("Item removed successfully");
        fetchCurrentItems(); // Refresh the current items list in the modal

        // DON'T call onSuccess here - only call it when modal closes

        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to remove item");
      }
    } catch (error) {
      console.error("Error removing item:", error);
      setError("Failed to remove item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    if (activeTab === "chemicals") {
      return (
        item.brand?.toLowerCase().includes(searchLower) ||
        item.chemical_name?.toLowerCase().includes(searchLower) ||
        item.name?.toLowerCase().includes(searchLower)
      );
    } else {
      return item.name?.toLowerCase().includes(searchLower);
    }
  });

  if (!isOpen) return null;

  const handleClose = () => {
    if (onSuccess) {
      onSuccess(); // Trigger parent to refresh data
    }
    onClose(); // Close the modal
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-5 w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-200 mb-4">
          <h2 className="text-lg font-bold text-[#004785]">
            Manage Request Items
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("chemicals")}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "chemicals"
                ? "text-[#004785] border-b-2 border-[#004785]"
                : "text-gray-700 hover:text-[#004785]"
            }`}
          >
            Chemicals
          </button>
          <button
            onClick={() => setActiveTab("refrigerants")}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "refrigerants"
                ? "text-[#004785] border-b-2 border-[#004785]"
                : "text-gray-700 hover:text-[#004785]"
            }`}
          >
            Refrigerants
          </button>
        </div>

        <div
          className="p-6 overflow-y-auto"
          style={{ maxHeight: "calc(90vh - 200px)" }}
        >
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle
                className="text-red-600 flex-shrink-0 mt-0.5"
                size={20}
              />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
              {success}
            </div>
          )}

          {/* Current Items Section */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-[#004785] mb-3">
              Current {activeTab === "chemicals" ? "Chemicals" : "Refrigerants"}
            </h3>

            {currentItems.length === 0 ? (
              <p className="text-black text-sm italic">
                No {activeTab} in this request yet.
              </p>
            ) : (
              <div className="space-y-2">
                {currentItems.map((item) => (
                  <div
                    key={item.item_id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-black">{item.name}</p>
                      <p className="text-sm text-black">
                        Quantity: {item.quantity} | Line Total: ₱
                        {parseFloat(
                          item.line_total_numeric || 0
                        ).toLocaleString()}
                      </p>
                      {item.notes && item.notes !== "-" && (
                        <p className="text-xs text-black mt-1">
                          Note: {item.notes}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.item_id)}
                      className="text-red-600 hover:text-red-800 transition-colors p-2 cursor-pointer"
                      disabled={loading}
                      title="Remove item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Item Section */}
          <div>
            <h3 className="text-lg font-bold text-[#004785] mb-3">
              Add {activeTab === "chemicals" ? "Chemical" : "Refrigerant"}
            </h3>

            {/* Search */}
            <div className="relative mb-4">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004785] focus:border-[#004785]"
              />
            </div>

            {/* Item Selection */}
            <div className="mb-4 max-h-64 overflow-y-auto border border-gray-300 rounded-lg">
              {filteredItems.length === 0 ? (
                <p className="p-4 text-black text-sm text-center">
                  No {activeTab} found
                </p>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 transition-colors ${
                        selectedItem?.id === item.id
                          ? "bg-blue-50 border-l-4 border-[#004785]"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => handleQuickAdd(item)}
                        >
                          <p className="font-medium text-black hover:text-[#004785] transition-colors">
                            {item.name}
                          </p>
                          {item.description && (
                            <p className="text-sm text-black mt-1">
                              {item.description}
                            </p>
                          )}
                          <p className="text-sm text-black mt-2">
                            Price:{" "}
                            <span className="font-medium">
                              ₱{parseFloat(item.base_price).toLocaleString()}
                            </span>
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                          }}
                          className="text-[#004785] hover:text-[#003666] text-sm font-medium whitespace-nowrap cursor-pointer"
                        >
                          Customize
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quantity and Notes - Only show when item is selected for customization */}
            {selectedItem && (
              <div className="space-y-4 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg ">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-black">
                    Customize: {selectedItem.name}
                  </h4>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="text-gray-700 hover:text-black"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004785] focus:border-[#004785]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004785] focus:border-[#004785]"
                    placeholder="Add any notes..."
                  />
                </div>

                <div className="p-3 bg-white rounded-lg border border-gray-300">
                  <p className="text-sm text-black">
                    Line Total:{" "}
                    <span className="font-semibold text-black">
                      ₱{(selectedItem.base_price * quantity).toLocaleString()}
                    </span>
                  </p>
                </div>

                <button
                  onClick={handleAddItem}
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer ${
                    loading
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-[#004785] text-white hover:bg-[#003666]"
                  }`}
                >
                  <Plus size={20} />
                  {loading ? "Adding..." : "Add with Custom Settings"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Done Button */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageRequestItemsModal;
