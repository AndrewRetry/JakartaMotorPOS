import React from 'react';

export default function Header({ title }) {
  return (
    <header className="h-16 border-b border-[#1f293d] px-8 flex items-center justify-between bg-[#111622] shrink-0 selection:bg-transparent">
      <h1 className="text-base font-bold tracking-tight text-slate-100">{title}</h1>
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="font-mono">🌙 Sabtu, 18 Juli 2026</span>
      </div>
    </header>
  );
}