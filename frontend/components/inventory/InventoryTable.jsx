import React from 'react';
import InventoryRowReadOnly from './InventoryRowReadOnly';

/**
 * InventoryTable
 * Renders table of barang items with full-page edit support only
 * All rows are read-only; clicking Edit button opens full-page edit screen
 */
export default function InventoryTable({ 
  items, 
  loading,
  onEditItem
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#1f293d]">
      <table className="w-full text-sm">
        <thead className="bg-[#141923] border-b border-[#1f293d]">
          <tr>
            <th className="py-3 px-4 pl-5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Kode</th>
            <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Nama</th>
            <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Kategori</th>
            <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Mitra</th>
            <th className="py-3 px-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Lok. Display</th>
            <th className="py-3 px-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Lok. Gudang</th>
            <th className="py-3 px-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Stok</th>
            <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Modal</th>
            <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">P1</th>
            <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">P2</th>
            <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">P3</th>
            <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">P4</th>
            <th className="py-3 px-5 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1f293d]">
          {loading ? (
            <tr>
              <td colSpan="13" className="py-8 text-center text-slate-400">Loading...</td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td colSpan="13" className="py-8 text-center text-slate-400">Tidak ada data</td>
            </tr>
          ) : (
            items.map((item) => (
              <InventoryRowReadOnly
                key={item.id}
                item={item}
                onEditItem={onEditItem}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}