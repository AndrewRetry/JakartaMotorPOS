import React from 'react';
import { Icons } from '../common/Icons';

/**
 * EditHeader
 * Header for the item edit screen
 * Shows item code, name, and navigation
 */
export default function EditHeader({ item, onBack }) {
  return (
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
                <div className="p-2.5 bg-blue-600/10 text-blue-500 rounded-lg">
                  <Icons.Master />
                </div>
                Edit Item
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Ubah informasi barang: <span className="font-mono text-slate-300">{item.kode}</span>
              </p>
            </div>
          </div>

          {/* Right: Item name preview */}
          <div className="hidden sm:block text-right">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Nama Item</p>
            <p className="text-lg font-semibold text-slate-100 truncate max-w-xs">
              {item.nama}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}