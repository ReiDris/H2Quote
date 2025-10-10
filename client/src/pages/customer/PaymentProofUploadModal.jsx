import React, { useState } from "react";
import { X, Upload, FileImage, Trash2 } from "lucide-react";
import { paymentsAPI } from "../../config/api";

const PaymentProofUploadModal = ({
  isOpen,
  onClose,
  paymentId,
  currentProof,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Only JPG, PNG, and PDF are allowed.");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB.");
      return;
    }

    setSelectedFile(file);
    setError("");

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
  if (!selectedFile) {
    setError("Please select a file to upload.");
    return;
  }

  try {
    setUploading(true);
    setError("");

    const response = await paymentsAPI.uploadPaymentProof(paymentId, selectedFile);
    const data = await response.json();

    if (data.success) {
      setSuccessMessage("Payment proof uploaded successfully!");
      setShowSuccessModal(true);
    } else {
      setSuccessMessage(data.message || "Failed to upload payment proof");
      setShowSuccessModal(true);
    }
  } catch (error) {
    console.error("Upload error:", error);
    setSuccessMessage("Failed to upload payment proof. Please try again.");
    setShowSuccessModal(true);
  } finally {
    setUploading(false);
  }
};

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
  try {
    setUploading(true);

    const response = await paymentsAPI.deletePaymentProof(paymentId);
    const data = await response.json();

    if (data.success) {
      setShowDeleteConfirm(false);
      setShowDeleteSuccessModal(true);
    } else {
      setError(data.message || "Failed to delete payment proof");
      setShowDeleteConfirm(false);
    }
  } catch (error) {
    console.error("Delete error:", error);
    setError("Failed to delete payment proof. Please try again.");
    setShowDeleteConfirm(false);
  } finally {
    setUploading(false);
  }
};

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    onSuccess();
    onClose();
  };

  const handleCloseDeleteSuccessModal = () => {
    setShowDeleteSuccessModal(false);
    onSuccess();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-5 w-200 mx-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-200 mb-4">
            <h2 className="text-lg font-bold text-[#004785]">
              {currentProof !== "-"
                ? "Manage Payment Proof"
                : "Upload Payment Proof"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {currentProof !== "-" && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <p className="text-sm text-blue-800 font-medium mb-3">
                A payment proof has already been uploaded for this payment.
              </p>
              <button
                onClick={handleDeleteClick}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} />
                Delete Current Upload
              </button>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-2">
              Select Payment Proof (JPG, PNG, or PDF - Max 5MB)
            </label>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-20 text-center hover:border-[#004785] transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-48 mb-4 rounded-lg"
                  />
                ) : (
                  <FileImage size={48} className="text-gray-400 mb-4" />
                )}

                <span className="text-[#004785] hover:text-[#003666] font-medium">
                  {selectedFile ? selectedFile.name : "Choose a file"}
                </span>
                <span className="text-xs text-black mt-1">
                  or drag and drop
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={uploading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
              className="flex-1 px-4 py-2 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-3xl p-5 w-120 max-w-md mx-4">
            <h2 className="text-lg font-bold text-[#004785] mb-4 pb-2 border-b border-gray-200">
              Delete Payment Proof
            </h2>
            <p className="text-black mb-6 text-sm">
              Are you sure you want to delete this payment proof?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Success/Error Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-3xl p-5 w-120 max-w-md mx-4">
            <h2 className="text-lg font-bold text-[#004785] mb-4 pb-2 border-b border-gray-200">
              Upload Status
            </h2>
            <p className="text-black mb-6 text-sm">{successMessage}</p>
            <div className="flex gap-3">
              <button
                onClick={handleCloseSuccessModal}
                className="flex-1 px-4 py-2 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Success Modal */}
      {showDeleteSuccessModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-3xl p-5 w-120 max-w-md mx-4">
            <h2 className="text-lg font-bold text-[#004785] mb-4 pb-2 border-b border-gray-200">
              Deletion Successful
            </h2>
            <p className="text-black mb-6 text-sm">
              Payment proof has been deleted successfully!
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCloseDeleteSuccessModal}
                className="flex-1 px-4 py-2 bg-[#004785] text-white rounded-lg hover:bg-[#003666] transition-colors cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentProofUploadModal;