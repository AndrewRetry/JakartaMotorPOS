import React from 'react';

/**
 * ConfirmationModal
 * Reusable confirmation dialog for destructive actions
 * Shows message and two action buttons (Cancel/Confirm)
 */
export default function ConfirmationModal({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Hapus', 
  cancelText = 'Batal',
  isDangerous = false,
  isLoading = false,
  onConfirm, 
  onCancel 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-[#141923] border border-[#1f293d] rounded-lg p-6 w-full max-w-sm shadow-2xl">
        {/* Icon & Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-xl">⚠️</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">{title}</h2>
        </div>

        {/* Message */}
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 font-semibold rounded transition-all disabled:opacity-50 ${
              isDangerous 
                ? 'bg-red-600 hover:bg-red-500 text-white' 
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {isLoading ? 'Memproses...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}