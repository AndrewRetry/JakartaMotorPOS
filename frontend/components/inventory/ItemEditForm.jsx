import React, { useState, useEffect } from 'react';

/**
 * ItemEditForm
 * Reusable form component for editing and creating barang items
 * Responsive grid layout that adapts to mobile/tablet/desktop
 * Used by both ItemEditScreen (edit mode) and ItemCreateScreen (create mode)
 */
export default function ItemEditForm({ formState, onChange, onSave, onCancel, isSaving, isCreateMode = false }) {

  // ==== Kategori data (was hardcoded, now pulled from /api/kategori) ====
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        const data = await api.get('/kategori')
        if (!isMounted) return;

        // Only show active categories in the dropdown
        const activeOnly = (data.data || []).filter(
          (cat) => String(cat.isActive).toUpperCase() === 'TRUE'
        );
        setCategories(activeOnly);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        if (isMounted) setCategories([]);
      } finally {
        if (isMounted) setCategoriesLoading(false);
      }
    };

    fetchCategories();
    return () => { isMounted = false; };
  }, []);

  // categoryId stores the kategori's id (matches backend contract in routes/barang.py),
  // so value=id and label=nama.
  const categoryOptions = categories.map((cat) => ({ value: cat.id, label: cat.nama }));

  const sections = [
    {
      title: 'Informasi Dasar',
      fields: [
        { 
          label: 'Nama Item', 
          name: 'nama', 
          type: 'text', 
          required: true, 
          colSpan: 'col-span-1 md:col-span-2',
          placeholder: 'Contoh: Oli Mesin 1L'
        },
        { 
          label: 'Kategori', 
          name: 'categoryId', 
          type: 'select', 
          colSpan: 'col-span-1',
          options: categoryOptions,
          placeholder: categoriesLoading
            ? 'Memuat kategori...'
            : (categoryOptions.length === 0 ? 'Belum ada kategori' : '-- Pilih Kategori --')
        },
        { 
          label: 'Mitra/Supplier', 
          name: 'mitra', 
          type: 'text', 
          colSpan: 'col-span-1',
          placeholder: 'Contoh: PT ABC'
        },
        { 
          label: 'Tipe Item', 
          name: 'tipe', 
          type: 'select', 
          colSpan: 'col-span-1',
          options: ['Barang (GOODS)', 'Jasa (SERVICE)'],
          placeholder: '-- Pilih Tipe --'
        },
      ]
    },
    {
      title: 'Stok & Harga',
      fields: [
        { 
          label: 'Stok Awal (Qty)', 
          name: 'stok', 
          type: 'number', 
          colSpan: 'col-span-1',
          min: 0,
          placeholder: '0'
        },
        { 
          label: 'Harga Modal (Beli)', 
          name: 'modal', 
          type: 'number', 
          colSpan: 'col-span-1',
          min: 0,
          placeholder: '0'
        },
        { 
          label: 'Harga P1 (Jual Normal)', 
          name: 'p1', 
          type: 'number', 
          colSpan: 'col-span-1',
          min: 0,
          placeholder: '0'
        },
        { 
          label: 'Harga P2 (Diskon 1)', 
          name: 'p2', 
          type: 'number', 
          colSpan: 'col-span-1',
          min: 0,
          placeholder: '0'
        },
        { 
          label: 'Harga P3 (Diskon 2)', 
          name: 'p3', 
          type: 'number', 
          colSpan: 'col-span-1',
          min: 0,
          placeholder: '0'
        },
        { 
          label: 'Harga P4 (Grosir)', 
          name: 'p4', 
          type: 'number', 
          colSpan: 'col-span-1',
          min: 0,
          placeholder: '0'
        },
      ]
    },
    {
      title: 'Lokasi & Catatan',
      fields: [
        { 
          label: 'Lokasi Display', 
          name: 'lokasiItem', 
          type: 'text', 
          colSpan: 'col-span-1',
          placeholder: 'Contoh: Rak A-1'
        },
        { 
          label: 'Lokasi Gudang', 
          name: 'lokasiStock', 
          type: 'text', 
          colSpan: 'col-span-1',
          placeholder: 'Contoh: Box 12'
        },
        { 
          label: 'Catatan', 
          name: 'notes', 
          type: 'textarea', 
          colSpan: 'col-span-1 md:col-span-2',
          placeholder: 'Keterangan tambahan tentang item ini (opsional)...'
        },
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
                    rows="3"
                    className="w-full bg-[#0f131c] border border-[#2b384e] rounded px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500 resize-none"
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={formState[field.name] || ''}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    disabled={field.name === 'categoryId' && categoriesLoading}
                    className="w-full bg-[#0f131c] border border-[#2b384e] rounded px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">{field.placeholder || '-- Pilih --'}</option>
                    {field.options.map((opt, i) => {
                      // Supports both plain string options (e.g. Tipe Item)
                      // and {value, label} objects (e.g. Kategori from API)
                      const optValue = typeof opt === 'object' ? opt.value : opt;
                      const optLabel = typeof opt === 'object' ? opt.label : opt;
                      return (
                        <option key={optValue || i} value={optValue}>
                          {optLabel}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={formState[field.name] || ''}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    min={field.min}
                    className="w-full bg-[#0f131c] border border-[#2b384e] rounded px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Action Buttons - Only shown in create/edit modes */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded transition-all disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <span>⏳</span> {isCreateMode ? 'Membuat...' : 'Menyimpan...'}
            </>
          ) : (
            <>
              <span>✓</span> {isCreateMode ? 'Buat Item' : 'Simpan'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}