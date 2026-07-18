import React from 'react';
import InventoryRowReadOnly from './InventoryRowReadOnly';
import InventoryRowEdit from './InventoryRowEdit';
import TableLoading from '../common/TableLoading';

export default function InventoryTable({ 
  items, 
  loading, 
  editingId, 
  formState, 
  isConflict,
  onEditChange, 
  onSave, 
  onCancel, 
  onActivateEdit 
}) {
  const headers = [
    { label: 'Kode', align: 'pl-5' },
    { label: 'Nama' },
    { label: 'Kategori' },
    { label: 'Mitra' },
    { label: 'Lok. Display', align: 'text-center' },
    { label: 'Lok. Gudang', align: 'text-center' },
    { label: 'Stok', align: 'text-center' },
    { label: 'Modal', align: 'text-right' },
    { label: 'P1', align: 'text-right' },
    { label: 'P2', align: 'text-right' },
    { label: 'P3', align: 'text-right text-blue-400' },
    { label: 'P4', align: 'text-right text-indigo-400' },
    { label: 'Aksi', align: 'text-center pr-5' }
  ];

  return (
    <div className="bg-[#141923] border border-[#1f293d] rounded-xl overflow-hidden shadow-2xl selection:bg-transparent">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-[#111622] border-b border-[#1f293d] text-slate-400 font-mono text-[11px] font-semibold tracking-wider uppercase">
              {headers.map((h, i) => (
                <th key={i} className={`py-3 px-4 ${h.align || ''}`}>{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f293d]/40 text-xs font-medium text-slate-300">
            {loading ? (
              <TableLoading rows={4} />
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="13" className="py-12 text-center text-slate-500 text-xs">No records found matching target parameters.</td>
              </tr>
            ) : (
              items.map((item) => (
                editingId === item.id ? (
                  <InventoryRowEdit 
                    key={item.id}
                    formState={formState}
                    onChange={onEditChange}
                    onSave={onSave}
                    onCancel={onCancel}
                  />
                ) : (
                  <InventoryRowReadOnly 
                    key={item.id}
                    item={item}
                    onEdit={onActivateEdit}
                    isConflictActive={isConflict}
                  />
                )
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}