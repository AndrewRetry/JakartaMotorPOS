import React from 'react';
import { Icons } from '../components/common/Icons';

export default function DataMasterHubScreen({ onSelectSubView }) {
  const directoryCards = [
    { id: 'barang', title: 'Daftar Barang', desc: 'Kelola produk dan barang dagangan', count: '20.494 item', color: 'border-blue-500/30 text-blue-400 bg-blue-500/5', active: true },
    { id: 'kategori', title: 'Kategori', desc: 'Kelompok dan kategori barang', count: '1 kategori', color: 'border-purple-500/30 text-purple-400 bg-purple-500/5', active: false },
    { id: 'supplier', title: 'Supplier', desc: 'Data pemasok barang', count: '89 supplier', color: 'border-amber-500/30 text-amber-400 bg-amber-500/5', active: false },
    { id: 'pelanggan', title: 'Pelanggan', desc: 'Data pelanggan toko', count: '9 pelanggan', color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5', active: false },
    { id: 'harga', title: 'Harga Bertingkat', desc: 'Atur harga berdasarkan level', count: 'Atur Level', color: 'border-pink-500/30 text-pink-400 bg-pink-500/5', active: false },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn selection:bg-transparent">
      <div className="flex items-center gap-4 mb-8 bg-[#141923] p-6 rounded-2xl border border-[#1f293d]">
        <div className="p-4 bg-blue-500/10 rounded-xl text-blue-400"><Icons.Master /></div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Data Master</h2>
          <p className="text-slate-400 text-xs mt-0.5">Kelola konfigurasi file entitas toko</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {directoryCards.map((card) => (
          <div
            key={card.id}
            onClick={() => card.active && onSelectSubView('daftar-barang')}
            className={`p-6 rounded-2xl border bg-[#141923] transition-all duration-200 ${
              card.active 
                ? 'border-[#1f293d] hover:border-blue-500/40 cursor-pointer hover:shadow-lg hover:shadow-blue-500/5' 
                : 'border-[#1f293d]/50 opacity-40 cursor-not-allowed'
            }`}
          >
            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-4 ${card.color}`}>
              <Icons.Master />
            </div>
            <h3 className="text-sm font-bold text-slate-100 mb-1">{card.title}</h3>
            <p className="text-xs text-slate-400 mb-4">{card.desc}</p>
            <p className="text-[10px] font-mono tracking-wider font-semibold text-slate-500 uppercase">{card.count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}