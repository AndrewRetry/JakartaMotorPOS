import React, { useState } from 'react';
import ConfirmationModal from '../common/ConfirmationModal';

/**
 * CategoryRow
 * Table row showing a single kategori record in read-only mode.
 * Action column: Edit (opens form modal), Delete (with confirmation).
 */
export default function CategoryRow({ category, onEditCategory, onDeleteSuccess }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isActive = String(category.isActive).toUpperCase() === 'TRUE';

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);

      const res = await fetch(`/api/kategori/${category.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await res.json();

      if (res.ok) {
        setShowDeleteConfirm(false);
        if (onDeleteSuccess) onDeleteSuccess(category.id);
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
        <td className="py-3 px-4 pl-5 font-mono text-slate-400 text-[11px]">{category.kode}</td>
        <td className="py-3 px-4 text-slate-100 font-bold tracking-tight">{category.nama}</td>
        <td className="py-3 px-4 text-slate-400">{category.deskripsi || '-'}</td>
        <td className="py-3 px-4">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
            isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
          }`}>
            {isActive ? '✓ Aktif' : '✕ Nonaktif'}
          </span>
        </td>
        <td className="py-3 px-4 text-center">
          <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-all">
            <button
              onClick={() => onEditCategory(category)}
              className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-all"
              title="Edit kategori"
            >
              ✏️
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all"
              title="Hapus kategori"
            >
              🗑️
            </button>
          </div>
        </td>
      </tr>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Hapus Kategori"
        message={`Apakah Anda yakin ingin menghapus kategori "${category.nama}"? Tindakan ini tidak dapat dibatalkan.`}
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