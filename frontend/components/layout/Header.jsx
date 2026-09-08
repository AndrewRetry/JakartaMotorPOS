import React from 'react';

export default function Header({ title, onOpenNav }) {
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <header className="h-16 border-b border-[#1f293d] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 bg-[#111622] shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenNav}
          aria-label="Buka menu"
          className="lg:hidden p-2 -ml-2 min-h-[44px] min-w-[44px] rounded-lg text-slate-300 hover:bg-[#1c2331]"
        >
          ☰
        </button>
        <h1 className="text-base font-bold tracking-tight text-slate-100 truncate">{title}</h1>
      </div>

      <span className="font-mono text-xs text-slate-400 hidden sm:inline">🌙 {today}</span>
    </header>
  );
}