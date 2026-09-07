import React from 'react';
import InventoryRowReadOnly from '../components/inventory/InventoryRowReadOnly';
import TableSkeleton from '../components/common/TableSkeleton';
import { useEntitySearch } from '../hooks/useEntitySearch';

const PAGE_SIZE = 50;

/**
 * Daftar Barang - the inventory list.
 *
 * Search, pagination and refresh all live in useEntitySearch; this file is
 * only responsible for laying the results out.
 */
export default function DaftarBarangScreen({ onEditItem, onCreateItem }) {
  const {
    records: items,
    totalCount,
    error,
    searchInput,
    updateSearch,
    refresh,
    isInitialLoad,
    isRefreshing,
    isEmpty,
    pageIndex,
    pageCount,
    goToPreviousPage,
    goToNextPage,
  } = useEntitySearch('/barang', { pageSize: PAGE_SIZE });

  return (
    <div className="bg-[#0f131c] rounded-lg border border-[#1f293d] overflow-hidden flex flex-col h-full">
      <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-[#1f293d] bg-[#141923]">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-3">
              <span className="text-slate-400">📦</span> Data Barang
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Total:{' '}
              <span className="font-mono font-semibold text-slate-200">
                {totalCount.toLocaleString('id-ID')}
              </span>{' '}
              item
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              disabled={isRefreshing}
              className="px-4 py-2 min-h-[44px] bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded transition-all disabled:opacity-50 flex items-center gap-2"
              title="Refresh data"
            >
              <span>🔄</span> Refresh
            </button>
            <button
              onClick={onCreateItem}
              className="px-4 py-2 min-h-[44px] bg-green-600 hover:bg-green-500 text-white font-semibold rounded transition-all flex items-center gap-2"
            >
              <span>➕</span> Tambah Barang
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="search"
            placeholder="Cari kode, nama, atau mitra..."
            value={searchInput}
            onChange={(event) => updateSearch(event.target.value)}
            className="w-full bg-[#0f131c] border border-[#2b384e] rounded-lg px-4 pr-11 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
          />
          {isRefreshing && (
            <span
              aria-hidden="true"
              className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-slate-600 border-t-blue-400 animate-spin"
            />
          )}
        </div>
      </div>
      
      {/* Error State */}   
      {error && (
        <div className="mx-4 sm:mx-6 mt-4 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded">
          ⚠️ {error}
        </div>
      )}
      
      {/* Loading State */}
      {isInitialLoad && <TableSkeleton columns={7} rows={8} />}

      {/* Empty State */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center h-64 gap-4 px-6">
          <div className="text-6xl">📭</div>
          <div className="text-slate-400 text-center">
            <p className="font-semibold mb-1">
              {searchInput ? 'Tidak ada hasil' : 'Tidak ada data'}
            </p>
            <p className="text-sm">
              {searchInput
                ? `Tidak ditemukan barang untuk "${searchInput}"`
                : 'Klik "Tambah Barang" untuk membuat item baru'}
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      {!isInitialLoad && !isEmpty && (
        <>
          <div
            aria-busy={isRefreshing}
            className={`flex-1 overflow-x-auto px-4 sm:px-6 py-4 transition-opacity duration-200 ${
              isRefreshing ? 'opacity-60' : 'opacity-100'
            }`}
          >
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
                    onEditItem={onEditItem}
                    onDeleteSuccess={refresh}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 sm:px-6 py-4 sm:py-6 border-t border-[#1f293d] bg-[#141923] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-slate-400">
              Halaman <span className="font-semibold text-slate-300">{pageIndex + 1}</span> dari{' '}
              <span className="font-semibold text-slate-300">{pageCount}</span>{' '}
              ({totalCount.toLocaleString('id-ID')} total)
            </div>

            <div className="flex gap-2">
              <button
                onClick={goToPreviousPage}
                disabled={pageIndex === 0}
                className="px-4 py-2 min-h-[44px] bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded disabled:opacity-50 transition-all"
              >
                ← Sebelumnya
              </button>
              <button
                onClick={goToNextPage}
                disabled={pageIndex >= pageCount - 1}
                className="px-4 py-2 min-h-[44px] bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded disabled:opacity-50 transition-all"
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