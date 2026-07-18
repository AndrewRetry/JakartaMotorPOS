import React from 'react';

export default function InventoryRowEdit({ formState, onChange, onSave, onCancel }) {
  const inputFields = [
    { name: 'nama', type: 'text', width: 'w-64', bold: true },
    { name: 'categoryId', type: 'text', width: 'w-20' },
    { name: 'mitra', type: 'text', width: 'w-24' },
    { name: 'lokasiItem', type: 'text', width: 'w-20', align: 'text-center' },
    { name: 'lokasiStock', type: 'text', width: 'w-20', align: 'text-center' },
    { name: 'stok', type: 'number', width: 'w-16', align: 'text-center' },
    { name: 'modal', type: 'number', width: 'w-20', align: 'text-right' },
    { name: 'p1', type: 'number', width: 'w-20', align: 'text-right' },
    { name: 'p2', type: 'number', width: 'w-20', align: 'text-right' },
    { name: 'p3', type: 'number', width: 'w-20', align: 'text-right' },
    { name: 'p4', type: 'number', width: 'w-20', align: 'text-right' },
  ];

  return (
    <tr className="bg-blue-600/5">
      <td className="py-3 px-4 pl-5 font-mono text-slate-500 text-[11px]">{formState.kode}</td>
      {inputFields.map((field) => (
        <td key={field.name} className="py-2 px-2">
          <input
            type={field.type}
            value={formState[field.name] || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            className={`bg-[#0f131c] border border-[#2b384e] rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-blue-500 ${field.width} ${field.align || ''} ${field.bold ? 'font-bold' : ''}`}
          />
        </td>
      ))}
      <td className="py-3 px-5 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <button onClick={onSave} className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-[10px] uppercase transition-all">Simpan</button>
          <button onClick={onCancel} className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded text-[10px] uppercase transition-all">Batal</button>
        </div>
      </td>
    </tr>
  );
}