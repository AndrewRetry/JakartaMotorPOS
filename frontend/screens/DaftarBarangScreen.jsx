import React, { useState, useEffect } from 'react';
import InventoryRowReadOnly from '../components/inventory/InventoryRowReadOnly';

/**
 * DataBarangScreen
 * Main inventory list view with search, pagination, create, edit, and delete
 * URL: /barang
 */
export default function DataBarangScreen({ onNavigateToEdit, onNavigateToCreate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [lastMutationTime, setLastMutationTime] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);

  const pageCount = Math.ceil(totalCount / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  /**
   * Fetch items from backend with search and pagination
   */
  const fetchItems = async (q = '', newOffset = 0) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        q: q.trim(),
        limit: limit.toString(),
        offset: newOffset.toString()
      });

      const res = await fetch(`/api/barang?${params.toString()}`);
      const data = await res.json();

      setItems(data.data || []);
      setTotalCount(data.total || 0);
      setLastMutationTime(data.last_mutation_time);
      setOffset(newOffset);
    } catch (err) {
      console.error('Fetch error:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initial load and setup background refresh
   */
  useEffect(() => {
    fetchItems(searchQuery, 0);

    // Set up background sync every 3 seconds (lightweight mutation check)
    const interval = setInterval(async () => {
      try {
        const params = new URLSearchParams({
          q: searchQuery.trim(),
          limit: limit.toString(),
          offset: offset.toString()
        });
        const res = await fetch(`/api/barang?${params.toString()}`);
        const data = await res.json();

        // Only update if mutation time changed (new data from other users)
        if (data.last_mutation_time !== lastMutationTime) {
          setItems(data.data || []);
          setTotalCount(data.total || 0);
          setLastMutationTime(data.last_mutation_time);
        }
      } catch (err) {
        console.error('Background sync error:', err);
      }
    }, 3000);

    setRefreshInterval(interval);

    return () => clearInterval(interval);
  }, []);

  /**
   * Handle search input change
   */
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setOffset(0); // Reset to first page on search
    fetchItems(query, 0);
  };

  /**
   * Handle pagination
   */
  const handlePrevPage = () => {
    const newOffset = Math.max(0, offset - limit);
    setOffset(newOffset);
    fetchItems(searchQuery, newOffset);
  };

  const handleNextPage = () => {
    const newOffset = offset + limit;
    if (newOffset < totalCount) {
      setOffset(newOffset);
      fetchItems(searchQuery, newOffset);
    }
  };

  /**
   * Handle manual refresh button
   */
  const handleRefresh = () => {
    fetchItems(searchQuery, offset);
  };

  /**
   * Handle successful deletion - remove item from local state
   */
  const handleDeleteSuccess = (deletedItemId) => {
    setItems(prev => prev.filter(item => item.id !== deletedItemId));
    setTotalCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="min-h-screen bg-[#0f131c] text-slate-100">
      {/* Header Section */}
      <div className="sticky top-0 z-40 bg-[#0f131c] border-b border-[#1f293d]">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <span className="text-blue-400">📦</span> Data Barang
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Total: <span className="font-mono font-semibold text-slate-200">{totalCount.toLocaleString('id-ID')}</span> items
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded transition-all disabled:opacity-50 flex items-center gap-2"
              title="Refresh data"
            >
              <span>🔄</span> Refresh
            </button>

            {/* Create Button */}
            <button
              onClick={onNavigateToCreate}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded transition-all flex items-center gap-2"
            >
              <span>➕</span> Tambah Barang
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 pb-4">
          <input
            type="text"
            placeholder="Cari kode, nama, atau kategori..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full bg-[#141923] border border-[#2b384e] rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && items.length === 0 && (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Memuat data...</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="text-6xl">📭</div>
          <div className="text-slate-400 text-center">
            <p className="font-semibold mb-1">Tidak ada data</p>
            <p className="text-sm">Klik "Tambah Barang" untuk membuat item baru</p>
          </div>
        </div>
      )}

      {/* Table Section */}
      {!loading && items.length > 0 && (
        <>
          <div className="px-6 py-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f293d] text-left">
                  <th className="py-3 px-4 pl-5 font-semibold text-slate-300 text-[11px] uppercase tracking-wide">Kode</th>
                  <th className="py-3 px-4 font-semibold text-slate-300 text-[11px] uppercase tracking-wide">Nama</th>
                  <th className="py-3 px-4 font-semibold text-slate-300 text-[11px] uppercase tracking-wide">Kategori</th>
                  <th className="py-3 px-4 font-semibold text-slate-300 text-[11px] uppercase tracking-wide">Mitra</th>
                  <th className="py-3 px-4 font-semibold text-slate-300 text-[11px] uppercase tracking-wide text-center">Lokasi Item</th>
                  <th className="py-3 px-4 font-semibold text-slate-300 text-[11px] uppercase tracking-wide text-center">Lokasi Stock</th>
                  <th className="py-3 px-4 font-semibold text-slate-300 text-[11px] uppercase tracking-wide text-center">Stok</th>
                  <th className="py-3 px-4 font-semibold text-slate-300 text-[11px] uppercase tracking-wide text-right">Modal</th>
                  <th className="py-3 px-4 font-semibold text-slate-300 text-[11px] uppercase tracking-wide text-right">P1</th>
                  <th className="py-3 px-4 font-semibold text-slate-300 text-[11px] uppercase tracking-wide text-right">P2</th>
                  <th className="py-3 px-4 font-semibold text-slate-300 text-[11px] uppercase tracking-wide text-right">P3</th>
                  <th className="py-3 px-4 font-semibold text-slate-300 text-[11px] uppercase tracking-wide text-right">P4</th>
                  <th className="py-3 px-5 font-semibold text-slate-300 text-[11px] uppercase tracking-wide text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f293d]">
                {items.map(item => (
                  <InventoryRowReadOnly
                    key={item.id}
                    item={item}
                    onEditItem={onNavigateToEdit}
                    onDeleteSuccess={handleDeleteSuccess}
                    isConflictActive={false}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-6 py-6 border-t border-[#1f293d] flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Halaman <span className="font-semibold text-slate-300">{currentPage}</span> dari{' '}
              <span className="font-semibold text-slate-300">{pageCount || 1}</span> ({totalCount} total)
            </div>

            <div className="flex gap-2">
              <button
                onClick={handlePrevPage}
                disabled={offset === 0}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded disabled:opacity-50 transition-all"
              >
                ← Sebelumnya
              </button>
              <button
                onClick={handleNextPage}
                disabled={offset + limit >= totalCount}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded disabled:opacity-50 transition-all"
              >
                Selanjutnya →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}