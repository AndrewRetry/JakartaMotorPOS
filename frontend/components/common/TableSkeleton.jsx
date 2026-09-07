import React from 'react';

/**
 * Placeholder rows shown only on a first load
 */


export default function TableSkeleton({ columns = 5, rows = 6 }) {
  return (
    <div className="px-4 sm:px-6 py-4">
      <table className="w-full text-sm">
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-[#1f293d]">
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <td key={columnIndex} className="py-4 px-4">
                  <div className="h-3 rounded bg-slate-700/50 animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}