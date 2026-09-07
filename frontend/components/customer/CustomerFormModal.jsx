import React, { useState, useEffect } from 'react';

const PRICE_TIER_OPTIONS = [
  { value: 'p1', label: 'Harga Umum (P1)' },
  { value: 'p2', label: 'Harga Diskon 1 (P2)' },
  { value: 'p3', label: 'Harga Diskon 2 (P3)' },
  { value: 'p4', label: 'Harga Grosir (P4)' },
];

/**
 * CustomerFormModal
 * Shared modal for creating and editing pelanggan records.
 */
export default function CustomerFormModal({ isOpen, mode, initialData, onSave, onCancel }) {
  const [formState, setFormState] = useState({ name: '', phone: '', address: '', priceTier: 'p1' });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setFormState({
        name: initialData?.name || '',
        phone: initialData?.phone || '',
        address: initialData?.address || '',
        priceTier: initialData?.priceTier || 'p1'
      });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formState.name.trim()) {
      setError('Nama lengkap wajib diisi');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const payload = {
        name: formState.name.trim(),
        phone: formState.phone.trim(),
        address: formState.address.trim(),
        priceTier: formState.priceTier
      };

      const isEditMode = mode === 'edit';
      const path = isEditMode ? '/customer/update' : '/customer/create';
      if (isEditMode) payload.id = initialData.id;

      await api.post(path, payload);
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm px-4">
      <div className="bg-[#141923] border border-[#1f293d] rounded-lg p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-bold text-slate-100 mb-4">
          {mode === 'edit' ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-200 mb-1.5">Nama Lengkap</label>
          <input
            type="text"
            value={formState.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Contoh: Budi Santoso"
            className="w-full bg-[#0f131c] border border-[#2b384e] rounded px-3 py-2 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-200 mb-1.5">No. Telepon / WA</label>
          <input
            type="text"
            value={formState.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="0812..."
            className="w-full bg-[#0f131c] border border-[#2b384e] rounded px-3 py-2 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-200 mb-1.5">Alamat</label>
          <textarea
            value={formState.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Alamat lengkap..."
            rows="3"
            className="w-full bg-[#0f131c] border border-[#2b384e] rounded px-3 py-2 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-y"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-200 mb-1.5">Level Harga</label>
          <select
            value={formState.priceTier}
            onChange={(e) => handleChange('priceTier', e.target.value)}
            className="w-full bg-[#0f131c] border border-[#2b384e] rounded px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {PRICE_TIER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1.5">
            Level harga ini akan otomatis diterapkan saat transaksi.
          </p>
        </div>

        {error && <p className="text-rose-400 text-xs mb-4">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1 px-6 py-2.5 bg-transparent border border-[#2b384e] hover:bg-[#1c2331] text-slate-300 font-semibold rounded transition-all disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded transition-all disabled:opacity-50"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}