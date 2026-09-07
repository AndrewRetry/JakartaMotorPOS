import React from 'react';

export default function Header({ title }) {
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  return (
    <header className="h-16 border-b border-[#1f293d] px-8 flex items-center justify-between bg-[#111622] shrink-0 selection:bg-transparent">
      <h1 className="text-base font-bold tracking-tight text-slate-100">{title}</h1>
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="font-mono">🌙 ${today}</span>
      </div>
    </header>
  );
}