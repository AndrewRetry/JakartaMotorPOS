import React, { useState, useEffect } from 'react';
import SupplierRow from '../components/supplier/SupplierRow';
import SupplierFormModal from '../components/supplier/SupplierFormModal';

/**
 * SupplierScreen
 * Supplier list view with search, create, edit, and delete.
 * URL: /suppliers
 */
export default function SupplierScreen() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingSupplier, setEditingSupplier] = useState(null);

  const {
    records: suppliers,
    totalCount,
    error,
    searchInput,
    updateSearch,
    refresh,
    isInitialLoad,
    isRefreshing,
    isEmpty,
  } = useEntitySearch('/supplier', {pageSize: 200});
  useChangeNotifier('supplier', refresh);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingSupplier(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (supplier) => {
    setModalMode('edit');
    setEditingSupplier(supplier);
    setModalOpen(true);
  };

  const handleModalSave = () => {
    setModalOpen(false);
    refresh();
  };

  const handleDeleteSuccess = (deletedId) => {
    refresh();
  };

  return (
    <div className="min-h-screen bg-[#0f131c] text-slate-100">
      {/* Header Section */}
      <div className="sticky top-0 z-40 bg-[#0f131c] border-b border-[#1f293d]">
        <div className="px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-100">Pengaturan Supplier</h1>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
          >
            <span>+</span> Tambah Supplier
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 pb-4 flex items-center gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">🔍</span>
            <input
              type="text"
              placeholder="Cari nama supplier..."
              value={searchInput}
              onChange={(event) => updateSearch(event.target.value)}
              className="w-full bg-[#141923] border border-[#2b384e] rounded-lg pl-11 pr-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
            />
            {isRefreshing && (
              <span
                aria-hidden="true"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full
                          border-2 border-slate-600 border-t-blue-400 animate-spin"
              />
            )}
          </div>
        </div>
      </div>
            
      {/* Error State */}      
      {error && (
        <div className="mx-4 sm:mx-6 my-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Loading State */}
      {isInitialLoad && <TableSkeleton columns={5} />}

      {/* Empty State */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="text-6xl">📭</div>
          <div className="text-slate-400 text-center">
            <p className="font-semibold mb-1">
              {searchInput ? 'Tidak ada hasil' : 'Tidak ada data'}
            </p>
            <p className="text-sm">
              {searchInput
                ? `Tidak ditemukan supplier untuk "${searchInput}"`
                : 'Klik "Tambah Supplier" untuk mendaftarkan supplier baru'}
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      {!isInitialLoad && !isEmpty && (
        <div aria-busy={isRefreshing} className={`px-4 sm:px-6 py-4 overflow-x-auto transition-opacity duration-200 ${isRefreshing ? 'opacity-60' : 'opacity-100'}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f293d] text-left">
                <th className="py-3 px-4 pl-5 font-semibold text-slate-300 text-[11px] uppercase tracking-wide">Nama Supplier</th>
                <th className="py-3 px-4 font-semibold text-slate-300 text-[11px] uppercase tracking-wide">Kontak</th>
                <th className="py-3 px-4 font-semibold text-slate-300 text-[11px] uppercase tracking-wide">Telepon</th>
                <th className="py-3 px-4 font-semibold text-slate-300 text-[11px] uppercase tracking-wide">Alamat</th>
                <th className="py-3 px-5 font-semibold text-slate-300 text-[11px] uppercase tracking-wide text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]">
              {suppliers.map(supplier => (
                <SupplierRow
                  key={supplier.id}
                  supplier={supplier}
                  onEditSupplier={handleOpenEdit}
                  onDeleteSuccess={handleDeleteSuccess}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SupplierFormModal
        isOpen={modalOpen}
        mode={modalMode}
        initialData={editingSupplier}
        onSave={handleModalSave}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
}