import React, { useState, useEffect, useRef } from 'react';
import SearchFilterBar from '../components/inventory/SearchFilterBar';
import InventoryTable from '../components/inventory/InventoryTable';
import ConflictBanner from '../components/common/ConflictBanner';
import { Icons } from '../components/common/Icons';

export default function DaftarBarangScreen({ onBack }) {
  // Operational Core States
  const [displayItems, setDisplayItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Server-Side Chunking Boundaries
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 50;

  // Optimistic Concurrency Control (OCC) Form States
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [conflictMessage, setConflictMessage] = useState(null); 
  
  // Track system mutation clock strictly in RAM memory
  const serverVersionPointer = useRef(0.0);

  /**
   * Centralized API Fetch Engine
   * Requests sliced data subsets from the Flask CSV reader engine
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
      
      // Update global sync anchor timestamp safely without causing UI re-renders
      if (payload.last_mutation_time) {
        serverVersionPointer.current = payload.last_mutation_time;
      }
      setConflictMessage(null);
    } catch (err) {
      console.error("API communications channel link severed:", err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  /**
   * ⏱️ Debounce Interface Layer
   * Pauses 300ms after the user stops typing before making the backend API request.
   * Prevents every individual keystroke from thrashing the flat CSV file on the server.
   */
  useEffect(() => {
    const typingDelayTimer = setTimeout(() => {
      setCurrentPage(0); // Snap back to first data segment page on new keywords
      fetchDataset(true, searchQuery, 0);
    }, 300);

    return () => clearTimeout(typingDelayTimer);
  }, [searchQuery]);

  /**
   * 🔄 Lightweight Synchronization Check Loop
   * Periodically hits the lightweight endpoint to check if the CSV file timestamp changed.
   */
  useEffect(() => {
    const syncDaemon = setInterval(async () => {
      try {
        // Halt synchronization checks if the user is in the middle of modifying a form line
        if (editingId) return; 

        const res = await fetch(`/api/barang/sync-check?last_sync=${serverVersionPointer.current}`);
        const state = await res.json();
        
        if (state.needs_refresh) {
          await fetchDataset(false); // Silent background data update
        }
      } catch (e) {
        console.warn("Background sync connection dropped momentarily:", e);
      }
    }, 4000);

    return () => clearInterval(syncDaemon);
  }, [editingId, currentPage, searchQuery]);

  // Pagination Link Click Event Handler
  const handlePageNavigation = (newPageIndex) => {
    setCurrentPage(newPageIndex);
    fetchDataset(true, searchQuery, newPageIndex);
  };

  // Inline Editing Form Handlers
  const handleEditInit = (item) => {
    setEditingId(item.id);
    // Deep copy target row contents along with its unique hidden 'version' attribute
    setEditForm({ ...item }); 
    setConflictMessage(null);
  };

  const handleFormFieldChange = (key, val) => {
    setEditForm(prev => ({ ...prev, [key]: val }));
  };

  /**
   * POST Mutation Submissions Handler
   * Ships modified columns along with the original client-side version tag
   */
  const executeWriteCommit = async () => {
    try {
      const res = await fetch('/api/barang/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const outcome = await res.json();

      if (res.status === 200) {
        setEditingId(null);
        await fetchDataset(false); // Grab fresh changes from server silently
      } else if (res.status === 409) {
        // ⚠️ OCC Trigger: Version mismatch detected on backend
        setConflictMessage(outcome.message || "Another user modified this item concurrently.");
      } else {
        alert(`Mutation Failed: ${outcome.message}`);
      }
    } catch {
      alert("Network processing path execution error.");
    }
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
      
      <ConflictBanner message={conflictMessage} onResolve={() => fetchDataset(true)} />
      
      <InventoryTable 
        items={displayItems}
        loading={loading}
        editingId={editingId}
        formState={editForm}
        isConflict={!!conflictMessage}
        onEditChange={handleFormFieldChange}
        onSave={executeWriteCommit}
        onCancel={() => setEditingId(null)}
        onActivateEdit={handleEditInit}
      />

      {/* 🧭 Server-Side Micro-Pagination Navigation Block */}
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