import React, { useState, useEffect } from 'react';
import { Icons } from '../components/common/Icons';
import CategoryRow from '../components/category/CategoryRow';
import CategoryFormModal from '../components/category/CategoryFormModal';

/**
 * CategoriesScreen
 * Kategori (category) list view with search, create, edit, and delete.
 * URL: /categories
 */
export default function CategoriesScreen() {

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingCategory, setEditingCategory] = useState(null);

  const {
    records: categories,
    totalCount,
    error,
    searchInput,
    updateSearch,
    refresh,
    isInitialLoad,
    isRefreshing,
    isEmpty,
  } = useEntitySearch('/kategori', {pageSize: 200});
  useChangeNotifier('kategori', refresh);

  const handleRefresh = () => refresh();

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingCategory(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (category) => {
    setModalMode('edit');
    setEditingCategory(category);
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
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn selection:bg-transparent">
      {/* Section Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span className="text-purple-400"><Icons.Tag /></span> Kategori Barang
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Total: <span className="font-semibold text-slate-300">{totalCount}</span> kategori
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            🔄 Refresh
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-all flex items-center gap-2 text-sm"
          >
            + Tambah Kategori
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Cari kategori berdasarkan kode atau nama..."
        value={searchInput}
        onChange={(event) => updateSearch(event.target.value)}
        className="w-full bg-[#141923] border border-[#1f293d] rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
      />
      {isRefreshing && (
        <span
          aria-hidden="true"
          className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full
                    border-2 border-slate-600 border-t-blue-400 animate-spin"
        />
      )}

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
        <div aria-busy={isRefreshing} className={`px-4 sm:px-6 py-4 overflow-x-auto transition-opacity duration-200 ${isRefreshing ? 'opacity-60' : 'opacity-100'}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f293d] text-left">
                <th className="py-3 px-4 pl-5 font-semibold text-slate-300 text-[11px] uppercase tracking-wide">Kode</th>
                <th className="py-3 px-4 font-semibold text-slate-300 text-[11px] uppercase tracking-wide">Nama Kategori</th>
                <th className="py-3 px-4 font-semibold text-slate-300 text-[11px] uppercase tracking-wide">Deskripsi</th>
                <th className="py-3 px-4 font-semibold text-slate-300 text-[11px] uppercase tracking-wide">Status</th>
                <th className="py-3 px-4 font-semibold text-slate-300 text-[11px] uppercase tracking-wide text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]">
              {categories.map(category => (
                <CategoryRow 
                  key={category.id} 
                  category={category} 
                  onEditCategory={handleOpenEdit} 
                  onDeleteSuccess={handleDeleteSuccess} 
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CategoryFormModal
        isOpen={modalOpen}
        mode={modalMode}
        initialData={editingCategory}
        onSave={handleModalSave}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
}