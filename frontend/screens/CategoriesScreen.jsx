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
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [lastMutationTime, setLastMutationTime] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingCategory, setEditingCategory] = useState(null);

  const fetchCategories = async (q = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ q: q.trim() });
      const data = await res.json();

      setCategories(data.data || []);
      setTotalCount(data.total || 0);
      setLastMutationTime(data.last_mutation_time);
    } catch (err) {
      console.error('Fetch error:', err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initial load + lightweight background sync (mirrors DaftarBarangScreen)
   */
  useEffect(() => {
    fetchCategories(searchQuery);

    const interval = setInterval(async () => {
      try {
        
        const data = await res.json();

        if (data.last_mutation_time !== lastMutationTime) {
          setCategories(data.data || []);
          setTotalCount(data.total || 0);
          setLastMutationTime(data.last_mutation_time);
        }
      } catch (err) {
        console.error('Background sync error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    fetchCategories(query);
  };

  const handleRefresh = () => fetchCategories(searchQuery);

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
    fetchCategories(searchQuery);
  };

  const handleDeleteSuccess = (deletedId) => {
    setCategories(prev => prev.filter(cat => cat.id !== deletedId));
    setTotalCount(prev => Math.max(0, prev - 1));
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
        value={searchQuery}
        onChange={handleSearch}
        className="w-full bg-[#141923] border border-[#1f293d] rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
      />

      {/* Table */}
      <div className="bg-[#141923] border border-[#1f293d] rounded-lg overflow-hidden">
        {loading && categories.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-slate-400">Memuat data...</div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-400">
            <p className="font-semibold">Tidak ada kategori</p>
            <p className="text-sm">Klik "Tambah Kategori" untuk membuat kategori baru</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
      </div>

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