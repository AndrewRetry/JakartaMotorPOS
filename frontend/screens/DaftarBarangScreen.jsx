import React, { useState, useEffect, useRef } from 'react';
import InventoryRowReadOnly from '../components/inventory/InventoryRowReadOnly';

/**
 * DaftarBarangScreen - Inventory List with Horizontal Scrolling
 * Features:
 * - Fetches paginated items from backend
 * - Displays table with horizontal scroll (invisible scrollbar)
 * - Supports search filtering
 * - Edit and delete operations via row actions
 */
export default function DaftarBarangScreen({ onBack, onEditItem, onCreateItem }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [limit] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const tableContainerRef = useRef(null);

  const pageCount = Math.ceil(totalCount / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  /**
   * Fetch items from backend with pagination and search
   */
  const fetchItems = async (searchTerm = '', pageOffset = 0) => {
    setLoading(true);
    setError(null);
    try {
      // Build query string with URLSearchParams for proper encoding
      const params = new URLSearchParams({
        q: searchTerm.trim(),
        limit: limit.toString(),
        offset: pageOffset.toString()
      });

      const response = await fetch(`/api/barang?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      // Backend returns "data" key, not "items"
      setItems(data.data || []);
      setTotalCount(data.total || 0);
      setOffset(pageOffset);
    } catch (err) {
      console.error('Failed to fetch items:', err);
      setError(err.message);
      setItems([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initial load on component mount
   */
  useEffect(() => {
    fetchItems(searchQuery, 0);
  }, []);

  /**
   * Handle search input change
   */
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setOffset(0);
    // Fetch with new search term and reset offset
    fetchItems(query, 0);
  };

  /**
   * Refresh data
   */
  const handleRefresh = () => {
    fetchItems(searchQuery, offset);
  };

  /**
   * Go to previous page
   */
  const handlePrevPage = () => {
    if (offset > 0) {
      const newOffset = Math.max(0, offset - limit);
      setOffset(newOffset);
      fetchItems(searchQuery, newOffset);
    }
  };

  /**
   * Go to next page
   */
  const handleNextPage = () => {
    if (offset + limit < totalCount) {
      const newOffset = offset + limit;
      setOffset(newOffset);
      fetchItems(searchQuery, newOffset);
    }
  };

  /**
   * Handle successful delete
   */
  const handleDeleteSuccess = () => {
    fetchItems(searchQuery, offset);
  };

  /**
   * Navigate to edit page
   */
  const handleNavigateToEdit = (itemId) => {
    onEditItem(itemId);
  };

  /**
   * Navigate to create page
   */
  const handleNavigateToCreate = () => {
    onCreateItem();
  };

  return (
    <div className="bg-[#0f131c] rounded-lg border border-[#1f293d] overflow-hidden flex flex-col h-full">
      {/* Header Section */}
      <div className="px-6 py-6 border-b border-[#1f293d] bg-[#141923]">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
              <span className="text-slate-400">📦</span> Data Barang
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
              onClick={handleNavigateToCreate}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded transition-all flex items-center gap-2"
            >
              <span>➕</span> Tambah Barang
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div>
          <input
            type="text"
            placeholder="Cari kode, nama, atau kategori..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full bg-[#0f131c] border border-[#2b384e] rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="px-6 py-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded">
          ⚠️ {error}
        </div>
      )}

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

      {/* Table Section with Horizontal Scrollbar (Hidden) */}
      {!loading && items.length > 0 && (
        <>
          {/* Horizontal Scroll Container - Invisible Scrollbar */}
          <div
            ref={tableContainerRef}
            className="flex-1 overflow-x-auto px-6 py-4"
            style={{
              scrollBehavior: 'smooth',
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none', // IE and Edge
            }}
          >
            {/* Hide scrollbar for Chrome, Safari, and Opera */}
            <style>{`
              .scroll-container::-webkit-scrollbar {
                display: none;
              }
            `}</style>

            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-[#1f293d] text-left sticky top-0 bg-[#141923]">
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
                {items.map((item) => (
                  <InventoryRowReadOnly
                    key={item.id}
                    item={item}
                    onEditItem={handleNavigateToEdit}
                    onDeleteSuccess={handleDeleteSuccess}
                    isConflictActive={false}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-6 py-6 border-t border-[#1f293d] bg-[#141923] flex items-center justify-between">
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