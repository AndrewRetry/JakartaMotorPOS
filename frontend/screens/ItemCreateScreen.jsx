import React, { useState } from 'react';
import ItemEditForm from '../components/inventory/ItemEditForm';
import { Icons } from '../components/common/Icons';

/**
 * ItemCreateScreen (FIXED)
 * Full-page create view for a new barang item
 * URL: /barang/create
 * Auto-generates or allows manual kode with format BRG-YYYYMMDD-XXX
 * 
 * FIX: Don't use EditHeader for create mode, use a custom header instead
 */
export default function ItemCreateScreen({ onBack }) {
  const [formState, setFormState] = useState({
    kode: '',
    nama: '',
    categoryId: '',
    mitra: '',
    tipe: 'Barang (GOODS)',
    stok: '0',
    modal: '0',
    p1: '0',
    p2: '0',
    p3: '0',
    p4: '0',
    lokasiItem: '',
    lokasiStock: '',
    notes: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [kodeMode, setKodeMode] = useState('auto'); // 'auto' or 'manual'

  /**
   * Generate kode barang with format BRG-YYYYMMDD-XXX
   * XXX is a 3-digit random number
   */
  const generateKode = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const randomSuffix = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    
    return `BRG-${year}${month}${day}-${randomSuffix}`;
  };

  const handleFieldChange = (fieldName, value) => {
    setFormState(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleAutoGenerateKode = () => {
    const newKode = generateKode();
    setFormState(prev => ({
      ...prev,
      kode: newKode
    }));
  };

  const handleCreate = async () => {
    try {
      // Validation
      if (!formState.kode || formState.kode.trim() === '') {
        setError('Kode barang harus diisi');
        return;
      }

      if (!formState.nama || formState.nama.trim() === '') {
        setError('Nama barang harus diisi');
        return;
      }

      setIsLoading(true);
      setError(null);

      const payload = {
        kode: formState.kode.trim(),
        nama: formState.nama.trim(),
        categoryId: formState.categoryId.trim(),
        mitra: formState.mitra.trim(),
        tipe: formState.tipe.trim(),
        stok: parseInt(formState.stok) || 0,
        modal: parseInt(formState.modal) || 0,
        p1: parseInt(formState.p1) || 0,
        p2: parseInt(formState.p2) || 0,
        p3: parseInt(formState.p3) || 0,
        p4: parseInt(formState.p4) || 0,
        lokasiItem: formState.lokasiItem.trim(),
        lokasiStock: formState.lokasiStock.trim(),
        notes: formState.notes.trim(),
      };

      const res = await fetch('/api/barang/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.status === 201) {
        setSuccessMessage('Item berhasil dibuat!');
        setTimeout(() => {
          setSuccessMessage(null);
          onBack();
        }, 1500);
      } else {
        setError(result.message || 'Gagal membuat item');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f131c]">
      {/* Custom Header for Create Mode (don't use EditHeader) */}
      <div className="bg-gradient-to-r from-[#141923] to-[#0f131c] border-b border-[#1f293d]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Left: Back button + Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-[#1c2331] rounded-lg transition-all text-slate-400 hover:text-slate-200"
                title="Kembali"
              >
                ← Kembali
              </button>
              
              <div className="h-8 w-px bg-[#1f293d]"></div>

              <div>
                <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                  <div className="p-2.5 bg-green-600/10 text-green-500 rounded-lg">
                    <Icons.Master />
                  </div>
                  Tambah Barang Baru
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Isi form untuk menambahkan barang baru ke sistem
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-auto max-w-5xl mt-6 px-8 py-4 bg-red-600/20 border border-red-600/50 rounded-lg text-red-300 text-sm font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div className="mx-auto max-w-5xl mt-6 px-8 py-4 bg-emerald-600/20 border border-emerald-600/50 rounded-lg text-emerald-300 text-sm font-semibold">
          ✓ {successMessage}
        </div>
      )}

      {/* Form Container */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Kode Barang Section */}
        <section className="bg-[#141923] border border-[#1f293d] rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
            Kode Barang
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mode Toggle */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">Mode Kode</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setKodeMode('auto')}
                  className={`flex-1 py-2 px-4 rounded font-semibold text-sm transition-all ${
                    kodeMode === 'auto'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Auto Generate
                </button>
                <button
                  type="button"
                  onClick={() => setKodeMode('manual')}
                  className={`flex-1 py-2 px-4 rounded font-semibold text-sm transition-all ${
                    kodeMode === 'manual'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Manual Input
                </button>
              </div>
            </div>

            {/* Kode Input or Display */}
            <div>
              {kodeMode === 'auto' ? (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-400 mb-2">KODE (Auto-Generated)</label>
                    <div className="px-3 py-2 bg-[#0f131c] border border-[#2b384e] rounded text-slate-300 text-sm font-mono">
                      {formState.kode || '(akan di-generate)'}
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAutoGenerateKode}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded transition-all text-sm"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">KODE (Manual)</label>
                  <input
                    type="text"
                    value={formState.kode}
                    onChange={(e) => handleFieldChange('kode', e.target.value)}
                    placeholder="Contoh: BR-001-OLI"
                    className="w-full px-3 py-2 bg-[#0f131c] border border-[#2b384e] rounded text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Item Form */}
        <ItemEditForm
          formState={formState}
          onChange={handleFieldChange}
          onSave={handleCreate}
          onCancel={onBack}
          isSaving={isLoading}
          isCreateMode={true}
        />
      </div>
    </div>
  );
}