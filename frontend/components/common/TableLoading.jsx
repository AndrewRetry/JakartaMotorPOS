import React from 'react';

export default function TableLoading({ colSpan = 13, rows = 3 }) {
  return (
    <>
      {[...Array(rows)].map((_, idx) => (
        <tr key={idx} className="animate-pulse bg-[#141923]/30">
          <td colSpan={colSpan} className="py-6 text-center text-slate-500 font-mono text-xs tracking-wider">
            Streaming file synchronization layers into layout array loops...
          </td>
        </tr>
      ))}
    </>
  );
}