
import React from 'react';
import { RiskLevel } from '../types';

interface RiskBadgeProps {
  level: RiskLevel;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level }) => {
  const styles = {
    [RiskLevel.LOW]: 'bg-emerald-500/5 text-emerald-500 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
    [RiskLevel.MEDIUM]: 'bg-yellow-500/5 text-yellow-500 border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.1)]',
    [RiskLevel.HIGH]: 'bg-orange-500/5 text-orange-500 border-orange-500/40 shadow-[0_0_10px_rgba(249,115,22,0.1)]',
    [RiskLevel.CRITICAL]: 'bg-red-500/5 text-red-500 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.1)]',
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-sm border mono font-bold text-[10px] tracking-widest ${styles[level]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
      {level} THREAT LEVEL
    </div>
  );
};
