import React from 'react';
import { Icons } from '../components/common/Icons';

export default function StubScreen({ targetFeature }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[45vh] text-center border-2 border-dashed border-[#1f293d] rounded-2xl p-12 bg-[#141923]/30 animate-fadeIn select-none">
      <div className="w-14 h-14 rounded-2xl bg-[#1c2331] flex items-center justify-center text-slate-500 mb-4 border border-[#2b384e]">
        <Icons.Stock />
      </div>
      <h3 className="text-base font-bold text-slate-200 mb-1">Workflow Channel: {targetFeature}</h3>
      <p className="text-slate-400 text-xs max-w-xs mb-5">
        Sub-system environment parameters mapped. Dynamic records load automatically on component hook initialization step.
      </p>
      <span className="px-3 py-1 bg-[#1c2331] border border-[#2b384e] text-slate-500 rounded-lg font-mono text-[10px] uppercase tracking-wider">
        Process Router Active
      </span>
    </div>
  );
}