import React, { useState, useEffect, useRef } from 'react';
import SearchFilterBar from '../components/inventory/SearchFilterBar';
import InventoryTable from '../components/inventory/InventoryTable';
import ConflictBanner from '../components/common/ConflictBanner';
import { Icons } from '../components/common/Icons';

export default function DaftarBarangScreen({ onBack }) {
  const [rawItems, setRawItems] = useState([]);
  const [displayItems, setDisplayItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  // Inline Mutation States
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [conflictMessage, setConflictMessage] = useState(null); 
  
  const serverVersionPointer = useRef(0.0);

  const fetchDataset = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const res = await fetch('/api/barang');
      const payload = await res.json();
      const records = payload.data || [];
      setRawItems(records);
      setDisplayItems(records);
      serverVersionPointer.current = payload.last_mutation_time || 0.0;
      setConflictMessage(null);
    } catch (err) {
      console.error("Flat-file data access channel dropped:", err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  // Sync Background Daemon Loop
  useEffect(() => {
    fetchDataset(true);

    const daemonPoller = setInterval(async () => {
      try {
        setSyncing(true);
        const res = await fetch('/api/sync-check');
        const state = await res.json();
        const freshServerStamp = state.matrix?.barang || 0.0;
        
        if (freshServerStamp > serverVersionPointer.current && !editingId) {
          await fetchDataset(false);
        }
      } catch (e) {
        console.warn("Background channel dropped:", e);
      } finally {
        setTimeout(() => setSyncing(false), 300);
      }
    }, 5000);

    return () => clearInterval(daemonPoller);
  }, [editingId]);

  // 🔥 High-Performance Tokenized Multi-Term Substring Engine
  useEffect(() => {
    const cleanQuery = searchQuery.toLowerCase().trim();
    
    // Short-circuit execution if input field is empty
    if (!cleanQuery) {
      setDisplayItems(rawItems);
      return;
    }

    // Split input into array fragments using space delimiter pattern
    const searchTokens = cleanQuery.split(/\s+/).filter(Boolean);

    const filtered = rawItems.filter((item) => {
      const targetKode = (item.kode || '').toLowerCase();
      const targetNama = (item.nama || '').toLowerCase();
      const targetKategori = (item.categoryId || '').toLowerCase();

      // Relational AND validation check: each token must reside somewhere in this row's targets
      return searchTokens.every((token) => {
        return (
          targetKode.includes(token) ||
          targetNama.includes(token) ||
          targetKategori.includes(token)
        );
      });
    });

    setDisplayItems(filtered);
  }, [searchQuery, rawItems]);

  const handleEditInit = (item) => {
    setEditingId(item.id);
    setEditForm({ ...item });
    setConflictMessage(null);
  };

  const handleFormFieldChange = (key, val) => {
    setEditForm(prev => ({ ...prev, [key]: val }));
  };

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
        await fetchDataset(false);
      } else if (res.status === 409) {
        setConflictMessage(outcome.message);
      } else {
        alert(`Mutation Fail: ${outcome.message}`);
      }
    } catch {
      alert("Network processing path execution error.");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <button onClick={onBack} className="text-[10px] font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 uppercase tracking-wider transition-all">
        ← Kembali ke Master Hub
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/10 text-blue-500 rounded-xl"><Icons.Master /></div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Data Barang</h2>
            <p className="text-xs text-slate-400 mt-0.5">Total count: <span className="text-blue-500 font-bold font-mono">{displayItems.length}</span> items</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold tracking-wide shadow-sm transition-all">+ Tambah Barang</button>
          <button onClick={() => fetchDataset(true)} className="flex items-center gap-1.5 px-4 py-2 bg-[#4c3ce6] hover:bg-[#5b4df2] text-white rounded-xl text-xs font-bold tracking-wide shadow-sm transition-all">
            {syncing ? <Icons.Refresh /> : '↻'} Refresh
          </button>
        </div>
      </div>

      {/* Embedded High Density Query Components */}
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
    </div>
  );
}