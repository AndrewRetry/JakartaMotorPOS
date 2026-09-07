import React, { useState, useEffect } from 'react';
import CustomerRow from '../components/customer/CustomerRow';
import CustomerFormModal from '../components/customer/CustomerFormModal';

/**
 * CustomersScreen
 * Pelanggan (customer) list view with search, create, edit, and delete.
 * URL: /customers
 */
export default function CustomersScreen() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [lastMutationTime, setLastMutationTime] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingCustomer, setEditingCustomer] = useState(null);

  const fetchCustomers = async (q = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ q: q.trim() });

      const data = await res.json();

      setCustomers(data.data || []);
      setTotalCount(data.total || 0);
      setLastMutationTime(data.last_mutation_time);
    } catch (err) {
      console.error('Fetch error:', err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refetch whenever the committed search query changes, and keep a
   * lightweight background sync running (mirrors SupplierScreen)
   */
  useEffect(() => {
    fetchCustomers(activeQuery);

    const interval = setInterval(async () => {
      try {
        
        const data = await res.json();

        if (data.last_mutation_time !== lastMutationTime) {
          setCustomers(data.data || []);
          setTotalCount(data.total || 0);
          setLastMutationTime(data.last_mutation_time);
        }
      } catch (err) {
        console.error('Background sync error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeQuery]);

  const handleSearchSubmit = () => setActiveQuery(searchInput);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleSearchSubmit();
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingCustomer(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setModalMode('edit');
    setEditingCustomer(customer);
    setModalOpen(true);
  };

  const handleModalSave = () => {
    setModalOpen(false);
    fetchCustomers(activeQuery);
  };

  const handleDeleteSuccess = (deletedId) => {
    setCustomers(prev => prev.filter(cust => cust.id !== deletedId));
    setTotalCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="min-h-screen bg-[#0f131c] text-slate-100">
      {/* Header Section */}
      <div className="sticky top-0 z-40 bg-[#0f131c] border-b border-[#1f293d]">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Daftar Pelanggan</h1>
            <p className="text-sm text-indigo-400 mt-1">Kelola data pelanggan dan level harga</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
          >
            <span>+</span> Tambah Pelanggan
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 pb-4 flex items-center gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">🔍</span>
            <input
              type="text"
              placeholder="Cari nama atau no. telepon..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full bg-[#141923] border border-[#2b384e] rounded-lg pl-11 pr-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
            />
          </div>
          <button
            onClick={handleSearchSubmit}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-lg transition-all"
          >
            Cari
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && customers.length === 0 && (
        <div className="flex items-center justify-center h-64 text-slate-400">Memuat data...</div>
      )}

      {/* Empty State */}
      {!loading && customers.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="text-6xl">📭</div>
          <div className="text-slate-400 text-center">
            <p className="font-semibold mb-1">Tidak ada data</p>
            <p className="text-sm">Klik "Tambah Pelanggan" untuk membuat pelanggan baru</p>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && customers.length > 0 && (
        <div className="px-6 py-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f293d] text-left">
                <th className="py-3 px-4 pl-5 font-semibold text-slate-300 text-[11px] uppercase tracking-wide">Nama</th>
                <th className="py-3 px-4 font-semibold text-slate-300 text-[11px] uppercase tracking-wide">Telepon</th>
                <th className="py-3 px-4 font-semibold text-slate-300 text-[11px] uppercase tracking-wide">Alamat</th>
                <th className="py-3 px-4 font-semibold text-slate-300 text-[11px] uppercase tracking-wide">Level Harga</th>
                <th className="py-3 px-5 font-semibold text-slate-300 text-[11px] uppercase tracking-wide text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]">
              {customers.map(customer => (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  onEditCustomer={handleOpenEdit}
                  onDeleteSuccess={handleDeleteSuccess}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CustomerFormModal
        isOpen={modalOpen}
        mode={modalMode}
        initialData={editingCustomer}
        onSave={handleModalSave}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
}