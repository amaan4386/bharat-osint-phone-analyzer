
import React, { useState, useEffect } from 'react';

export const Header: React.FC = () => {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="border-b border-orange-500/20 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-orange-500/40 rotate-45 flex items-center justify-center overflow-hidden">
               <div className="rotate-[-45deg] font-black text-orange-500 text-xl tracking-tighter">BH</div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-orange-500 animate-pulse rounded-full border-2 border-zinc-950"></div>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-[0.2em] text-zinc-100 flex items-center gap-2">
              BHARAT<span className="text-orange-500">SYSTEMS</span>
              <span className="bg-orange-500/10 text-orange-500 text-[10px] px-2 py-0.5 border border-orange-500/20 tracking-normal">OSINT-CONSOLE</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Encrypted Channel Access • Level 4 Clearance
            </p>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-8 font-mono text-xs">
          <div className="flex flex-col items-end">
            <span className="text-zinc-600 uppercase text-[9px] font-bold tracking-widest">Local System Time</span>
            <span className="text-orange-500 font-bold tabular-nums">{time}</span>
          </div>
          <div className="h-10 w-[1px] bg-zinc-800"></div>
          <div className="flex flex-col items-end">
            <span className="text-zinc-600 uppercase text-[9px] font-bold tracking-widest">Server Load</span>
            <span className="text-cyan-400 font-bold">12.4% OPS</span>
          </div>
        </div>
      </div>
    </header>
  );
};
