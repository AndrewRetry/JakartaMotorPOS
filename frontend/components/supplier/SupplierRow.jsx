import React, { useState } from 'react';
import ConfirmationModal from '../common/ConfirmationModal';

/**
 * SupplierRow
 * Table row showing a single supplier record in read-only mode.
 * Action column: Edit (opens form modal), Delete (with confirmation).
 */
export default function SupplierRow({ supplier, onEditSupplier, onDeleteSuccess }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);

      const res = await fetch(`/api/supplier/${supplier.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await res.json();

      if (res.ok) {
        setShowDeleteConfirm(false);
        if (onDeleteSuccess) onDeleteSuccess(supplier.id);
      } else {
        alert(`Gagal menghapus: ${result.message || 'Kesalahan tidak diketahui'}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <tr className="hover:bg-[#181f2d] transition-all duration-75 group">
        <td className="py-3 px-4 pl-5 text-slate-100 font-bold tracking-tight">{supplier.name}</td>
        <td className="py-3 px-4 text-slate-400">{supplier.contact || '-'}</td>
        <td className="py-3 px-4 text-slate-400">{supplier.phone || '-'}</td>
        <td className="py-3 px-4 text-slate-400">{supplier.address || '-'}</td>
        <td className="py-3 px-5 text-center">
          <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-all">
            <button
              onClick={() => onEditSupplier(supplier)}
              className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-all"
              title="Edit supplier"
            >
              ✏️
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all"
              title="Hapus supplier"
            >
              🗑️
            </button>
          </div>
        </td>
      </tr>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Hapus Supplier"
        message={`Apakah Anda yakin ingin menghapus supplier "${supplier.name}"? Tindakan ini tidak dapat dibatalkan.`}
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