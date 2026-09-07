import React, { useState, useEffect } from 'react';
import CustomerRow from '../components/customer/CustomerRow';
import CustomerFormModal from '../components/customer/CustomerFormModal';
import { useEntitySearch } from '../hooks/useEntitySearch';

/**
 * CustomersScreen
 * Pelanggan (customer) list view with search, create, edit, and delete.
 * URL: /customers
 */
export default function CustomersScreen() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingCustomer, setEditingCustomer] = useState(null);

  const {
    records: customers,
    totalCount,
    error,
    searchInput,
    updateSearch,
    refresh,
    isInitialLoad,
    isRefreshing,
    isEmpty,
  } = useEntitySearch('/customer', {pageSize: 200});
  useChangeNotifier('customer', refresh);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingCustomer(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setModalMode('edit');
    setEditingCustomer(customer);
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
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Daftar Pelanggan</h1>
            <p className="text-sm text-indigo-400 mt-1">Kelola data pelanggan dan level harga</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
          >
            <span>+</span> Tambah Pelanggan
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 pb-4 flex items-center gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">🔍</span>
            <input
              type="text"
              placeholder="Cari nama atau no. telepon..."
              value={searchInput}
              onChange={(event) => updateSearch(event.target.value)}
              className="w-full bg-[#141923] border border-[#2b384e] rounded-lg pl-11 pr-11 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
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
                ? `Tidak ditemukan pelanggan untuk "${searchInput}"`
                : 'Klik "Tambah Pelanggan" untuk membuat pelanggan baru'}
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      {!isInitialLoad && !isEmpty && (
        <div
          aria-busy={isRefreshing}
          className={`px-4 sm:px-6 py-4 overflow-x-auto transition-opacity duration-200 ${
            isRefreshing ? 'opacity-60' : 'opacity-100'
          }`}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f293d] text-left">
                <th className="py-3 px-4 pl-5 font-semibold text-slate-300 text-[11px] uppercase tracking-wide">Nama</th>
                <th className="py-3 px-4 font-semibold text-slate-300 text-[11px] uppercase tracking-wide">Telepon</th>
                <th className="py-3 px-4 font-semibold text-slate-300 text-[11px] uppercase tracking-wide">Alamat</th>
                <th className="py-3 px-4 font-semibold text-slate-300 text-[11px] uppercase tracking-wide">Level Harga</th>
                <th className="py-3 px-5 font-semibold text-slate-300 text-[11px] uppercase tracking-wide text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]">
              {customers.map(customer => (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  onEditCustomer={handleOpenEdit}
                  onDeleteSuccess={handleDeleteSuccess}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CustomerFormModal
        isOpen={modalOpen}
        mode={modalMode}
        initialData={editingCustomer}
        onSave={handleModalSave}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
}