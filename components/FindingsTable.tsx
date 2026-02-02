
import React from 'react';
import { Finding } from '../types';

interface FindingsTableProps {
  findings: Finding[];
}

export const FindingsTable: React.FC<FindingsTableProps> = ({ findings }) => {
  return (
    <div className="overflow-x-auto rounded-sm border border-zinc-800 bg-zinc-950/40">
      <table className="w-full text-left border-collapse">
        <thead className="bg-zinc-900/50 text-zinc-500 mono font-bold text-[10px] tracking-[0.2em]">
          <tr>
            <th className="px-6 py-4 border-b border-zinc-800">UPLINK_SOURCE</th>
            <th className="px-6 py-4 border-b border-zinc-800">SUMMARY_LOG</th>
            <th className="px-6 py-4 border-b border-zinc-800 text-right">UTC_DATETIME</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50 mono">
          {findings.map((f, i) => (
            <tr key={i} className="group hover:bg-orange-500/[0.02] transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className={`w-1 h-4 ${
                    f.severity === 'Alert' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 
                    f.severity === 'Warning' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]' : 
                    'bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                  }`} />
                  <span className="text-[11px] font-bold text-zinc-300 tracking-tight group-hover:text-zinc-100">{f.source}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <p className="text-[11px] text-zinc-500 leading-relaxed group-hover:text-zinc-400">
                  {f.summary}
                </p>
              </td>
              <td className="px-6 py-4 text-right">
                <span className="text-[10px] text-zinc-600 font-medium tabular-nums">{f.timestamp}</span>
              </td>
            </tr>
          ))}
          {findings.length === 0 && (
            <tr>
              <td colSpan={3} className="px-6 py-12 text-center">
                <div className="flex flex-col items-center gap-2 opacity-30">
                  <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.691.346a2 2 0 01-1.428.188l-2.387-.477a2 2 0 01-1.022-.547m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4.71a3 3 0 00.781 2.122l.33.33a3 3 0 002.122.781H17a2 2 0 012 2v4.71a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4.71a3 3 0 00-.781-2.122l-.33-.33a3 3 0 00-2.122-.781H7a2 2 0 01-2-2V5a2 2 0 012-2h2a2 2 0 012 2v4.71a3 3 0 00.781 2.122l.33.33a3 3 0 002.122.781H17a2 2 0 012 2v4.71a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4.71a3 3 0 00-.781-2.122l-.33-.33a3 3 0 00-2.122-.781H7a2 2 0 01-2-2V5a2 2 0 012-2h2a2 2 0 012 2v4.71a3 3 0 00.781 2.122l.33.33a3 3 0 002.122.781H17a2 2 0 012 2v4.71a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4.71a3 3 0 00-.781-2.122l-.33-.33a3 3 0 00-2.122-.781H7z" /></svg>
                  <span className="text-[10px] mono tracking-widest uppercase">Null pointer detected: No public footprints found.</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
