import React from 'react';

/**
 * ItemEditForm
 * Reusable form component for editing barang items
 * Responsive grid layout that adapts to mobile/tablet/desktop
 */
export default function ItemEditForm({ formState, onChange, onSave, onCancel, isSaving }) {
  
  const sections = [
    {
      title: 'Informasi Dasar',
      fields: [
        { label: 'Kode Item', name: 'kode', type: 'text', required: true, colSpan: 'col-span-1' },
        { label: 'Nama Item', name: 'nama', type: 'text', required: true, colSpan: 'col-span-2' },
        { label: 'Kategori', name: 'categoryId', type: 'select', colSpan: 'col-span-1', options: ['', 'Elektronik', 'Mekanik', 'Aksesoris'] },
        { label: 'Mitra/Supplier', name: 'mitra', type: 'text', colSpan: 'col-span-1' },
        { label: 'Tipe Item', name: 'tipe', type: 'select', colSpan: 'col-span-1', options: ['', 'Barang', 'Spare Part'] },
      ]
    },
    {
      title: 'Stok & Harga',
      fields: [
        { label: 'Stok (Qty)', name: 'stok', type: 'number', colSpan: 'col-span-1', min: 0 },
        { label: 'Modal (Harga Beli)', name: 'modal', type: 'number', colSpan: 'col-span-1', min: 0 },
        { label: 'Harga P1', name: 'p1', type: 'number', colSpan: 'col-span-1', min: 0 },
        { label: 'Harga P2', name: 'p2', type: 'number', colSpan: 'col-span-1', min: 0 },
        { label: 'Harga P3', name: 'p3', type: 'number', colSpan: 'col-span-1', min: 0 },
        { label: 'Harga P4', name: 'p4', type: 'number', colSpan: 'col-span-1', min: 0 },
      ]
    },
    {
      title: 'Lokasi & Catatan',
      fields: [
        { label: 'Lokasi Item (Display)', name: 'lokasiItem', type: 'text', colSpan: 'col-span-1', placeholder: 'Contoh: Rak A-1' },
        { label: 'Lokasi Stock (Gudang)', name: 'lokasiStock', type: 'text', colSpan: 'col-span-1', placeholder: 'Contoh: Box 12' },
        { label: 'Catatan', name: 'notes', type: 'textarea', colSpan: 'col-span-2', placeholder: 'Keterangan tambahan tentang item ini...' },
      ]
    }
  ];

  return (
    <form className="space-y-8">
      {sections.map((section, idx) => (
        <section key={idx} className="bg-[#141923] border border-[#1f293d] rounded-xl p-6">
          {/* Section Title */}
          <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
            {section.title}
          </h3>

          {/* Section Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {section.fields.map((field) => (
              <div key={field.name} className={field.colSpan}>
                {/* Label */}
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-400 ml-1">*</span>}
                </label>

                {/* Input Field */}
                {field.type === 'textarea' ? (
                  <textarea
                    value={formState[field.name] || ''}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-2.5 bg-[#0f131c] border border-[#2b384e] rounded-lg text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none"
                    rows="4"
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={formState[field.name] || ''}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0f131c] border border-[#2b384e] rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all appearance-none"
                  >
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt || '-- Pilih --'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={formState[field.name] || ''}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    min={field.min}
                    className="w-full px-4 py-2.5 bg-[#0f131c] border border-[#2b384e] rounded-lg text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pt-6 border-t border-[#1f293d]">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:pointer-events-none text-slate-200 font-semibold rounded-lg transition-all text-sm"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:pointer-events-none text-white font-semibold rounded-lg transition-all text-sm flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <span className="inline-block animate-spin">⟳</span>
              Menyimpan...
            </>
          ) : (
            <>
              ✓ Simpan Perubahan
            </>
          )}
        </button>
      </div>
    </form>
  );
}