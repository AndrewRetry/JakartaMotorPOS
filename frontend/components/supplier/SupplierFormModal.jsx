import React, { useState, useEffect } from 'react';

/**
 * SupplierFormModal
 * Shared modal for creating and editing supplier records.
 */
export default function SupplierFormModal({ isOpen, mode, initialData, onSave, onCancel }) {
  const [formState, setFormState] = useState({ name: '', contact: '', phone: '', address: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setFormState({
        name: initialData?.name || '',
        contact: initialData?.contact || '',
        phone: initialData?.phone || '',
        address: initialData?.address || ''
      });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formState.name.trim()) {
      setError('Nama supplier wajib diisi');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const payload = {
        name: formState.name.trim(),
        contact: formState.contact.trim(),
        phone: formState.phone.trim(),
        address: formState.address.trim()
      };

      const isEditMode = mode === 'edit';
      const url = isEditMode ? '/api/supplier/update' : '/api/supplier/create';
      if (isEditMode) payload.id = initialData.id;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok) {
        onSave();
      } else {
        setError(result.message || 'Gagal menyimpan supplier');
      }
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
          {mode === 'edit' ? 'Edit Supplier' : 'Tambah Supplier'}
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-200 mb-1.5">
            Nama Supplier <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={formState.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full bg-[#0f131c] border border-[#2b384e] rounded px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-200 mb-1.5">Nama Kontak</label>
          <input
            type="text"
            value={formState.contact}
            onChange={(e) => handleChange('contact', e.target.value)}
            className="w-full bg-[#0f131c] border border-[#2b384e] rounded px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-200 mb-1.5">Telepon</label>
          <input
            type="text"
            value={formState.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full bg-[#0f131c] border border-[#2b384e] rounded px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-200 mb-1.5">Alamat</label>
          <textarea
            value={formState.address}
            onChange={(e) => handleChange('address', e.target.value)}
            rows="3"
            className="w-full bg-[#0f131c] border border-[#2b384e] rounded px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500 resize-y"
          />
        </div>

        {error && <p className="text-rose-400 text-xs mb-4">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded transition-all disabled:opacity-50"
          >
            {isSaving ? 'Menyimpan...' : mode === 'edit' ? 'Update' : 'Simpan'}
          </button>
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-6 py-2.5 bg-transparent border border-[#2b384e] hover:bg-[#1c2331] text-slate-300 font-semibold rounded transition-all disabled:opacity-50"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}