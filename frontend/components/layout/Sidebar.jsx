import React from 'react';
import { Icons } from '../common/Icons';

export default function Sidebar({ activeMenu, onMenuChange }) {
  const links = [
    { name: 'Beranda', icon: <Icons.Home /> },
    { name: 'Data Master', icon: <Icons.Master /> },
    { name: 'Stok', icon: <Icons.Stock /> },
    { name: 'Penjualan', icon: <Icons.Sales /> },
    { name: 'Pembelian', icon: <Icons.Stock /> },
    { name: 'Keuangan', icon: <Icons.Finance /> },
    { name: 'Laporan', icon: <Icons.Stock /> },
    { name: 'Pengaturan', icon: <Icons.Settings /> },
  ];

  return (
    <aside className="w-64 bg-[#141923] border-r border-[#1f293d] flex flex-col justify-between p-4 shrink-0 selection:bg-transparent">
      <div>
        <div className="flex items-center gap-3 px-2 py-4 border-b border-[#1f293d] mb-6">
          <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/10">
            <Icons.Sales />
          </div>
          <span className="text-lg font-bold tracking-wide text-slate-100">
            Jakarta <span className="text-blue-500">Motor</span>
          </span>
        </div>
        <nav className="space-y-1">
          {links.map((link) => (
            <button
              key={link.name}
              onClick={() => onMenuChange(link.name)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-xs transition-all duration-150 ${
                activeMenu === link.name
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/10'
                  : 'text-slate-400 hover:bg-[#1c2331] hover:text-slate-200'
              }`}
            >
              {link.icon}
              <span>{link.name}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="pt-4 border-t border-[#1f293d] flex flex-col gap-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs">
            AU
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-200">Admin User</p>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider">ADMIN</p>
          </div>
        </div>
        <button className="w-full py-2 px-4 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-medium transition-all">
          ➔ Sign Out
        </button>
      </div>
    </aside>
  );
}