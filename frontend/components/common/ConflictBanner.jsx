import React from 'react';

export default function ConflictBanner({ message, onResolve }) {
  if (!message) return null;
  return (
    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn">
      <div>
        <span className="font-bold uppercase tracking-widest block text-[10px] text-red-500">⚠️ Optimistic Concurrency Conflict</span>
        <p className="text-slate-300 mt-0.5">{message}. Another device committed updates to this row during your session.</p>
      </div>
      <button 
        onClick={onResolve}
        className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg tracking-wide transition-all shrink-0 shadow-md shadow-red-600/15"
      >
        Discard Edits & Reload
      </button>
    </div>
  );
}