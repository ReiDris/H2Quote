import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Search, AlertCircle } from 'lucide-react';

const ManageRequestItemsModal = ({ isOpen, onClose, requestId, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('chemicals'); // 'chemicals' or 'refrigerants'
  const [items, setItems] = useState([]);
  const [currentItems, setCurrentItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch available items (chemicals or refrigerants)
  useEffect(() => {
    if (isOpen) {
      fetchAvailableItems();
      fetchCurrentItems();
    }
  }, [isOpen, activeTab]);

  const fetchAvailableItems = async () => {
    try {
      const token = localStorage.getItem('h2quote_token');
      const endpoint = activeTab === 'chemicals' ? 'chemicals' : 'refrigerants';
      
      const response = await fetch(`http://localhost:5000/api/service-requests/${endpoint}/catalog`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const fetchCurrentItems = async () => {
    try {
      const token = localStorage.getItem('h2quote_token');
      
      const response = await fetch(`http://localhost:5000/api/service-requests/${requestId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const allItems = data.data.items || [];
        const filtered = allItems.filter(item => 
          activeTab === 'chemicals' ? item.item_type === 'chemical' : item.item_type === 'refrigerant'
        );
        setCurrentItems(filtered);
      }
    } catch (error) {
      console.error('Error fetching current items:', error);
    }
  };

  const handleAddItem = async () => {
    if (!selectedItem) {
      setError('Please select an item');
      return;
    }

    if (quantity <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    // Check stock
    if (selectedItem.stock_quantity < quantity) {
      setError(`Insufficient stock. Available: ${selectedItem.stock_quantity}`);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('h2quote_token');
      const endpoint = activeTab === 'chemicals' ? 'add-chemical' : 'add-refrigerant';
      const idField = activeTab === 'chemicals' ? 'chemicalId' : 'refrigerantId';

      const response = await fetch(`http://localhost:5000/api/service-requests/${requestId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          [idField]: selectedItem.id,
          quantity: parseInt(quantity),
          notes: notes || undefined
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message);
        setSelectedItem(null);
        setQuantity(1);
        setNotes('');
        fetchCurrentItems();
        
        // Notify parent to refresh
        if (onSuccess) {
          onSuccess();
        }

        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to add item');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      setError('Failed to add item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId, itemType) => {
    if (!confirm('Are you sure you want to remove this item?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('h2quote_token');

      const response = await fetch(`http://localhost:5000/api/service-requests/${requestId}/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ itemType })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Item removed successfully');
        fetchCurrentItems();
        
        // Notify parent to refresh
        if (onSuccess) {
          onSuccess();
        }

        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      setError('Failed to remove item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId, itemType, newQuantity) => {
    if (newQuantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('h2quote_token');

      const response = await fetch(`http://localhost:5000/api/service-requests/${requestId}/items/${itemId}/quantity`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          itemType,
          quantity: parseInt(newQuantity)
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Quantity updated successfully');
        fetchCurrentItems();
        
        // Notify parent to refresh
        if (onSuccess) {
          onSuccess();
        }

        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(data.message || 'Failed to update quantity');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      setError('Failed to update quantity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    if (activeTab === 'chemicals') {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            Manage Request Items
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('chemicals')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'chemicals'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Chemicals
          </button>
          <button
            onClick={() => setActiveTab('refrigerants')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'refrigerants'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Refrigerants
          </button>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
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
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Current {activeTab === 'chemicals' ? 'Chemicals' : 'Refrigerants'}
            </h3>
            
            {currentItems.length === 0 ? (
              <p className="text-gray-500 text-sm italic">
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
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        ₱{parseFloat(item.unit_price).toLocaleString()} × {item.quantity} = 
                        ₱{parseFloat(item.line_total || item.total_price).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Qty:</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.item_id, item.item_type, e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          disabled={loading}
                        />
                      </div>
                      
                      <button
                        onClick={() => handleRemoveItem(item.item_id, item.item_type)}
                        className="text-red-600 hover:text-red-800 transition-colors p-1"
                        disabled={loading}
                        title="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Item Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Add {activeTab === 'chemicals' ? 'Chemical' : 'Refrigerant'}
            </h3>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Item Selection */}
            <div className="mb-4 max-h-64 overflow-y-auto border border-gray-300 rounded-lg">
              {filteredItems.length === 0 ? (
                <p className="p-4 text-gray-500 text-sm text-center">
                  No {activeTab} found
                </p>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`p-3 cursor-pointer transition-colors ${
                        selectedItem?.id === item.id
                          ? 'bg-blue-50 border-l-4 border-blue-600'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="text-gray-600">
                              Price: <span className="font-medium">₱{parseFloat(item.base_price).toLocaleString()}</span>
                            </span>
                            <span className={`font-medium ${
                              item.stock_quantity > 10 ? 'text-green-600' :
                              item.stock_quantity > 0 ? 'text-orange-600' :
                              'text-red-600'
                            }`}>
                              Stock: {item.stock_quantity}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quantity and Notes */}
            {selectedItem && (
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedItem.stock_quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Available stock: {selectedItem.stock_quantity}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add any notes..."
                  />
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Line Total: <span className="font-semibold text-gray-900">
                      ₱{(selectedItem.base_price * quantity).toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Add Button */}
            <button
              onClick={handleAddItem}
              disabled={!selectedItem || loading}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                !selectedItem || loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Plus size={20} />
              {loading ? 'Adding...' : `Add ${activeTab === 'chemicals' ? 'Chemical' : 'Refrigerant'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageRequestItemsModal;