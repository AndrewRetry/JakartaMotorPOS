import React from 'react';

export default function SearchFilterBar({ query, onQueryChange, onClear }) {
  return (
    <div className="space-y-2 bg-[#141923] border border-[#1f293d] p-3 rounded-xl shadow-sm">
      {/* Search Input Control */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500 text-xs">
            🔍
          </span>
          <input 
            type="text" 
            placeholder="Cari item (kode, nama, kategori)..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full bg-[#0f131c] border border-[#1f293d] rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-medium"
          />
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 border border-[#2b384e] bg-[#141923] hover:bg-[#1c2331] text-[11px] font-bold rounded-lg text-slate-300 transition-all shrink-0 shadow-sm">
          ⚙️ Filter Mitra
        </button>
      </div>

      {query.trim() && (
        <div className="flex items-center gap-2 text-[11px] text-slate-400 pl-1 pt-1 border-t border-[#1f293d]/30 animate-fadeIn">
          <span>Active filters:</span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono rounded text-[10px]">
            Search: "{query}"
          </div>
          <button 
            onClick={onClear} 
            className="text-slate-500 hover:text-rose-400 underline transition-all ml-1 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}