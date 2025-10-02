import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

const PaymentProofViewer = ({ isOpen, onClose, paymentId, fileName }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  useEffect(() => {
    if (isOpen && paymentId) {
      loadPaymentProof();
    }
  }, [isOpen, paymentId]);

  useEffect(() => {
    // Cleanup: revoke object URL when component unmounts or modal closes
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  const loadPaymentProof = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('h2quote_token');
      const response = await fetch(
        `http://localhost:5000/api/payments/${paymentId}/proof`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load payment proof');
      }

      // Create object URL from blob
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setFileUrl(url);
    } catch (error) {
      console.error('Load proof error:', error);
      setError('Failed to load payment proof');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'payment-proof';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  const isPdf = fileName && fileName.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Payment Proof
          </h2>
          <div className="flex items-center gap-2">
            {fileUrl && (
              <button
                onClick={handleDownload}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Download"
              >
                <Download size={20} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading payment proof...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-4">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {!loading && !error && fileUrl && (
            <div className="flex items-center justify-center min-h-full">
              {isPdf ? (
                <iframe
                  src={fileUrl}
                  className="w-full h-[600px] border rounded"
                  title="Payment Proof PDF"
                />
              ) : (
                <img
                  src={fileUrl}
                  alt="Payment Proof"
                  className="max-w-full max-h-full object-contain rounded"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentProofViewer;