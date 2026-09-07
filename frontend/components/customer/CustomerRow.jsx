import React, { useState } from 'react';
import ConfirmationModal from '../common/ConfirmationModal';

const TIER_LABELS = {
  p1: { label: 'P1', color: 'bg-blue-500/10 text-blue-400' },
  p2: { label: 'P2', color: 'bg-indigo-500/10 text-indigo-400' },
  p3: { label: 'P3', color: 'bg-purple-500/10 text-purple-400' },
  p4: { label: 'P4', color: 'bg-pink-500/10 text-pink-400' },
};

/**
 * CustomerRow
 * Table row showing a single pelanggan record in read-only mode.
 * Action column: Edit (opens form modal), Delete (with confirmation).
 */
export default function CustomerRow({ customer, onEditCustomer, onDeleteSuccess }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const tier = TIER_LABELS[String(customer.priceTier).toLowerCase()] || TIER_LABELS.p1;

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await api.delete(`/customer/${customer.id}`);
      setShowDeleteConfirm(false);
      onDeleteSuccess?.(customer.id);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <tr className="hover:bg-[#181f2d] transition-all duration-75 group">
        <td className="py-3 px-4 pl-5 text-slate-100 font-bold tracking-tight">{customer.name}</td>
        <td className="py-3 px-4 text-slate-400 font-mono">{customer.phone || '-'}</td>
        <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{customer.address || '-'}</td>
        <td className="py-3 px-4">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${tier.color}`}>
            {tier.label}
          </span>
        </td>
        <td className="py-3 px-5 text-center">
          <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-all">
            <button
              onClick={() => onEditCustomer(customer)}
              className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-all"
              title="Edit pelanggan"
            >
              ✏️
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all"
              title="Hapus pelanggan"
            >
              🗑️
            </button>
          </div>
        </td>
      </tr>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Hapus Pelanggan"
        message={`Apakah Anda yakin ingin menghapus pelanggan "${customer.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}