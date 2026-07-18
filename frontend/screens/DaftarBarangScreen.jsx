import React, { useState, useEffect, useRef } from 'react';
import SearchFilterBar from '../components/inventory/SearchFilterBar';
import InventoryTable from '../components/inventory/InventoryTable';
import { Icons } from '../components/common/Icons';

/**
 * DaftarBarangScreen
 * Main inventory list view with search, filter, and pagination
 * All editing is done via full-page edit screen (no inline editing)
 */
export default function DaftarBarangScreen({ onBack, onEditItem }) {
  const [displayItems, setDisplayItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 50;

  const serverVersionPointer = useRef(0.0);

  /**
   * Fetch items from API
   */
  const fetchDataset = async (showLoader = true, targetQuery = searchQuery, targetPage = currentPage) => {
    try {
      if (showLoader) setLoading(true);
      
      const offset = targetPage * itemsPerPage;
      const url = `/api/barang?q=${encodeURIComponent(targetQuery)}&limit=${itemsPerPage}&offset=${offset}`;
      
      const res = await fetch(url);
      const payload = await res.json();
      
      setDisplayItems(payload.data || []);
      setTotalCount(payload.total || 0);
      
      if (payload.last_mutation_time) {
        serverVersionPointer.current = payload.last_mutation_time;
      }
    } catch (err) {
      console.error("API error:", err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  /**
   * Debounce search input
   */
  useEffect(() => {
    const typingDelayTimer = setTimeout(() => {
      setCurrentPage(0);
      fetchDataset(true, searchQuery, 0);
    }, 300);

    return () => clearTimeout(typingDelayTimer);
  }, [searchQuery]);

  /**
   * Background sync check
   */
  useEffect(() => {
    const syncDaemon = setInterval(async () => {
      try {
        const res = await fetch(`/api/barang/sync-check?last_sync=${serverVersionPointer.current}`);
        const state = await res.json();
        
        if (state.needs_refresh) {
          await fetchDataset(false);
        }
      } catch (e) {
        console.warn("Sync check error:", e);
      }
    }, 4000);

    return () => clearInterval(syncDaemon);
  }, [currentPage, searchQuery]);

  // Initial load
  useEffect(() => {
    fetchDataset();
  }, []);

  const handlePageNavigation = (newPageIndex) => {
    setCurrentPage(newPageIndex);
    fetchDataset(true, searchQuery, newPageIndex);
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-[10px] font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 uppercase tracking-wider transition-all">
        ← Kembali ke Master Hub
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/10 text-blue-500 rounded-xl"><Icons.Master /></div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Data Barang</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing <span className="text-blue-500 font-bold font-mono">{displayItems.length}</span> of <span className="text-slate-300 font-bold font-mono">{totalCount}</span> matched database elements
            </p>
          </div>
        </div>
      </div>

      <SearchFilterBar 
        query={searchQuery} 
        onQueryChange={setSearchQuery} 
        onClear={() => setSearchQuery('')}
      />
      
      <InventoryTable 
        items={displayItems}
        loading={loading}
        onEditFullPage={onEditItem}
      />

      {totalCount > itemsPerPage && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
          <button 
            disabled={currentPage === 0 || loading} 
            onClick={() => handlePageNavigation(currentPage - 1)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-20 disabled:hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-300 transition-all select-none"
          >
            Previous
          </button>
          <span className="text-[11px] text-slate-400 font-mono px-2">
            Page {currentPage + 1} of {Math.ceil(totalCount / itemsPerPage)}
          </span>
          <button 
            disabled={(currentPage + 1) * itemsPerPage >= totalCount || loading} 
            onClick={() => handlePageNavigation(currentPage + 1)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-20 disabled:hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-300 transition-all select-none"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}