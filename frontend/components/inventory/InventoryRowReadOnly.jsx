import React from 'react';

export default function InventoryRowReadOnly({ item, onEdit, isConflictActive }) {
  const stockNum = parseInt(item.stok || 0);
  const formatNumber = (val) => parseInt(val || 0).toLocaleString('id-ID');

  return (
    <tr className="hover:bg-[#181f2d] transition-all duration-75 group">
      <td className="py-3 px-4 pl-5 font-mono text-slate-400 text-[11px]">{item.kode}</td>
      <td className="py-3 px-4 text-slate-100 font-bold tracking-tight">{item.nama}</td>
      <td className="py-3 px-4 text-slate-400">{item.categoryId || '-'}</td>
      <td className="py-3 px-4 text-slate-400 max-w-[120px] truncate">{item.mitra || '-'}</td>
      <td className="py-3 px-4 text-center text-slate-400">{item.lokasiItem || '-'}</td>
      <td className="py-3 px-4 text-center text-slate-400">{item.lokasiStock || '-'}</td>
      <td className="py-3 px-4 text-center font-mono font-bold">
        <span className={stockNum <= 0 ? 'text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded text-[11px]' : 'text-slate-300'}>
          {stockNum}
        </span>
      </td>
      <td className="py-3 px-4 text-right font-mono text-slate-400">{formatNumber(item.modal)}</td>
      <td className="py-3 px-4 text-right font-mono text-slate-200">{formatNumber(item.p1)}</td>
      <td className="py-3 px-4 text-right font-mono text-slate-200">{formatNumber(item.p2)}</td>
      <td className="py-3 px-4 text-right font-mono text-blue-400">{formatNumber(item.p3)}</td>
      <td className="py-3 px-4 text-right font-mono text-indigo-400">{formatNumber(item.p4)}</td>
      <td className="py-3 px-5 text-center">
        <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-all">
          <button 
            onClick={() => onEdit(item)} 
            disabled={isConflictActive}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:pointer-events-none text-white font-bold rounded text-[10px] transition-all"
          >
            Edit
          </button>
          <button className="px-2 py-1 bg-red-600/30 hover:bg-red-600 text-red-400 hover:text-white rounded text-[10px] transition-all">
            🗑️
          </button>
        </div>
      </td>
    </tr>
  );
}