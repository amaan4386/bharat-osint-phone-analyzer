
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { FindingsTable } from './components/FindingsTable';
import { RiskBadge } from './components/RiskBadge';
import { validateIndianNumber } from './services/validator';
import { analyzePhoneNumber } from './services/osintService';
import { OsintResult, AnalysisState, RiskLevel } from './types';

const RECENT_SEARCHES_KEY = 'bharat_osint_recent_searches_v2';
const MAX_RECENT_SEARCHES = 5;
const ITEMS_PER_PAGE = 5;

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [log, setLog] = useState<string[]>(['System Ready. Waiting for target acquisition...']);
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    result: null,
    error: null,
    batchResults: [],
    batchProgress: 0
  });

  const addLog = (msg: string) => {
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
  };

  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setRecentSearches(parsed);
      } catch (e) { console.error(e); }
    }
  }, []);

  const saveToHistory = (number: string) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(n => n !== number);
      const updated = [number, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleSearch = useCallback(async (searchNumber?: string) => {
    const targetInput = searchNumber || input;
    if (!targetInput.trim()) return;

    if (!isBatchMode || searchNumber) {
      const validation = validateIndianNumber(targetInput);
      if (!validation.isValid) {
        setState(prev => ({ ...prev, error: validation.error || 'Invalid identifier format' }));
        addLog('ERROR: Validation failed.');
        return;
      }

      setState(prev => ({ ...prev, isAnalyzing: true, result: null, error: null, batchResults: [] }));
      addLog(`INITIATING TARGET SCAN: ${validation.sanitized}`);
      if (searchNumber) setInput(validation.sanitized);

      try {
        const data = await analyzePhoneNumber(validation.sanitized);
        setState(prev => ({ ...prev, isAnalyzing: false, result: data }));
        addLog('SCAN COMPLETE. DECRYPTED DATA AVAILABLE.');
        saveToHistory(validation.sanitized);
      } catch (err: any) {
        setState(prev => ({ ...prev, isAnalyzing: false, error: err.message }));
        addLog('SCAN ABORTED: SYSTEM TIMEOUT.');
      }
    } else {
      const lines = targetInput.split(/[\n,]+/).map(l => l.trim()).filter(l => l !== '');
      if (lines.length === 0) return;

      setState(prev => ({ ...prev, isAnalyzing: true, result: null, error: null, batchResults: [], batchProgress: 0 }));
      addLog(`INITIATING BATCH EXTRACTION: ${lines.length} TARGETS`);

      const results: OsintResult[] = [];
      for (let i = 0; i < lines.length; i++) {
        const num = lines[i];
        const validation = validateIndianNumber(num);
        
        if (validation.isValid) {
          addLog(`SCANNING [${i + 1}/${lines.length}]: ${validation.sanitized}`);
          try {
            const data = await analyzePhoneNumber(validation.sanitized);
            results.push(data);
            saveToHistory(validation.sanitized);
          } catch (e) {
            addLog(`FAILED [${i + 1}/${lines.length}]: ${num}`);
          }
        } else {
          addLog(`SKIPPING INVALID [${i + 1}/${lines.length}]: ${num}`);
        }
        setState(prev => ({ ...prev, batchProgress: Math.round(((i + 1) / lines.length) * 100) }));
      }

      setState(prev => ({ ...prev, isAnalyzing: false, batchResults: results }));
      addLog('BATCH EXTRACTION COMPLETE.');
      setCurrentPage(1);
    }
  }, [input, isBatchMode]);

  const exportToJson = () => {
    const data = state.batchResults.length > 0 ? state.batchResults : state.result;
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OSINT_REPORT_${Date.now()}.json`;
    a.click();
    addLog('REPORT EXPORTED: JSON PACKET GENERATED.');
  };

  const exportToCsv = () => {
    let csvContent = "";
    let filename = `OSINT_EXPORT_${Date.now()}.csv`;

    if (state.batchResults.length > 0) {
      // Export Batch Summary
      const headers = ['Identifier', 'Operator', 'Circle', 'Risk_Level', 'Confidence_Score'];
      const rows = state.batchResults.map(res => [
        `"${res.phoneNumber}"`,
        `"${res.operator}"`,
        `"${res.circle}"`,
        `"${res.riskLevel}"`,
        `"${res.confidenceScore}%"`
      ]);
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      filename = `BATCH_MANIFEST_${Date.now()}.csv`;
    } else if (state.result) {
      // Export Single Result Detailed Manifest
      const metadataHeaders = [
        ['TARGET IDENTIFIER', state.result.phoneNumber],
        ['OPERATOR', state.result.operator],
        ['CIRCLE', state.result.circle],
        ['RISK ASSESSMENT', state.result.riskLevel],
        ['CONFIDENCE SCORE', `${state.result.confidenceScore}%`],
        ['CONNECTION TYPE', state.result.metadata.connectionType],
        [''], // Spacer
        ['INTELLIGENCE FINDINGS MANIFEST'],
        ['Source', 'Summary', 'Timestamp', 'Severity']
      ];
      
      const rows = state.result.findings.map(f => [
        `"${f.source.replace(/"/g, '""')}"`,
        `"${f.summary.replace(/"/g, '""')}"`,
        `"${f.timestamp.replace(/"/g, '""')}"`,
        `"${f.severity}"`
      ]);

      csvContent = [
        ...metadataHeaders.map(m => m.join(',')),
        ...rows.map(r => r.join(','))
      ].join('\n');
      
      filename = `DETAILED_LOG_${state.result.phoneNumber.replace(/\D/g, '')}.csv`;
    }

    if (!csvContent) return;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    addLog(`REPORT EXPORTED: CSV FILE [${filename}] GENERATED.`);
  };

  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return state.batchResults.slice(start, start + ITEMS_PER_PAGE);
  }, [state.batchResults, currentPage]);

  const totalPages = Math.ceil(state.batchResults.length / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen pb-32 relative z-10">
      <Header />

      <main className="max-w-7xl mx-auto px-6 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Command & Input */}
          <div className="lg:col-span-4 space-y-6">
            <section className="cyber-border bg-zinc-950/60 p-6 rounded-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full animate-ping ${isBatchMode ? 'bg-cyan-500' : 'bg-orange-500'}`}></div>
                  <h2 className="mono font-bold text-xs uppercase tracking-[0.3em] text-zinc-400">Target Acquisition</h2>
                </div>
                <button 
                  onClick={() => setIsBatchMode(!isBatchMode)}
                  className={`mono text-[9px] px-2 py-1 border transition-all ${isBatchMode ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                >
                  {isBatchMode ? 'BATCH_MODE_ON' : 'SINGLE_MODE'}
                </button>
              </div>

              <div className="relative mb-4 group">
                {isBatchMode ? (
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="ENTER_UID_LIST&#10;+91 91234 56789&#10;+91 98765 43210"
                    className="w-full h-32 bg-zinc-900/50 border border-zinc-800 p-4 mono text-sm text-cyan-500 placeholder:text-zinc-700 focus:outline-none focus:border-cyan-500/50 transition-all resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="ENTER_UID_NUMBER"
                    className="w-full bg-zinc-900/50 border border-zinc-800 p-4 mono text-lg text-orange-500 placeholder:text-zinc-700 focus:outline-none focus:border-orange-500/50 transition-all"
                  />
                )}
                <div className="absolute right-4 bottom-4 text-[10px] mono text-zinc-700 select-none">
                  {isBatchMode ? 'LIST_ARRAY' : 'MSISDN_IN'}
                </div>
              </div>

              {state.error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] mono uppercase animate-pulse">
                  &gt; CRITICAL_ERROR: {state.error}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => handleSearch()}
                  disabled={state.isAnalyzing}
                  className={`w-full h-12 font-black mono text-xs uppercase tracking-widest active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none transition-all relative overflow-hidden group shadow-lg ${
                    isBatchMode 
                    ? 'bg-cyan-500 text-zinc-950 hover:bg-cyan-400' 
                    : 'bg-orange-500 text-zinc-950 hover:bg-orange-400'
                  }`}
                >
                  {state.isAnalyzing && <div className="scanner-line"></div>}
                  {state.isAnalyzing ? 'RUNNING_DEEP_SCAN' : (isBatchMode ? 'EXTRACT_BATCH_PACKETS' : 'INITIALIZE_OSINT_PROBE')}
                </button>
                <button
                  onClick={() => { setInput(''); setState({ ...state, result: null, error: null, batchResults: [] }); }}
                  className="w-full h-10 border border-zinc-800 text-zinc-500 font-bold mono text-[10px] uppercase tracking-widest hover:border-zinc-700 hover:text-zinc-300 transition-colors"
                >
                  Reset_Console
                </button>
              </div>

              {recentSearches.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Cached_Signals</span>
                    <button onClick={() => { setRecentSearches([]); localStorage.removeItem(RECENT_SEARCHES_KEY); }} className="text-[8px] text-zinc-700 hover:text-orange-500 uppercase transition-colors">Wipe_Cache</button>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {recentSearches.map((num, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSearch(num)}
                        className="text-left px-3 py-2 border border-zinc-900 hover:border-orange-500/30 hover:bg-orange-500/5 text-zinc-500 hover:text-orange-500 mono text-[11px] transition-all flex items-center justify-between group"
                      >
                        <span>{num}</span>
                        <span className="opacity-0 group-hover:opacity-100 text-[8px] tracking-tighter">RE-ACTIVATE</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="bg-black p-4 border border-zinc-900 rounded-sm overflow-hidden">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-[9px] mono text-zinc-700 uppercase">System_Terminal_v2.0</span>
               </div>
               <div className="h-48 overflow-y-auto space-y-1 pr-2">
                 {log.map((l, i) => (
                   <div key={i} className={`text-[10px] mono leading-tight ${i === 0 ? 'text-cyan-400 font-bold' : 'text-zinc-600'}`}>
                    <span className="opacity-40">&gt;&gt;</span> {l}
                   </div>
                 ))}
               </div>
            </section>
          </div>

          <div className="lg:col-span-8">
            {state.isAnalyzing ? (
              <div className="h-[600px] flex flex-col items-center justify-center space-y-6 cyber-border bg-zinc-950/40 rounded-sm border-dashed">
                <div className="relative w-48 h-48">
                  <div className="absolute inset-0 border-4 border-orange-500/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
                  <div className="absolute inset-4 border-2 border-dashed border-cyan-500/30 rounded-full animate-[spin_5s_linear_infinite_reverse]"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-orange-500 mono font-black text-2xl">{state.batchProgress}%</div>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="mono font-bold text-lg uppercase tracking-widest text-zinc-100">Synchronizing Uplink...</h3>
                  <div className="w-64 h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${state.batchProgress}%` }}></div>
                  </div>
                </div>
              </div>
            ) : state.batchResults.length > 0 ? (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="cyber-border bg-zinc-950/60 p-6 rounded-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-black text-zinc-100 uppercase tracking-tight">Batch Extraction Manifest</h3>
                      <p className="text-[10px] mono text-zinc-600 uppercase">Displaying extracted intelligence logs for {state.batchResults.length} targets.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={exportToCsv} className="px-4 py-2 border border-cyan-500/40 text-cyan-400 mono font-bold text-[10px] uppercase hover:bg-cyan-500/10 transition-all">CSV_MANIFEST</button>
                      <button onClick={exportToJson} className="px-4 py-2 border border-orange-500/40 text-orange-500 mono font-bold text-[10px] uppercase hover:bg-orange-500/10 shadow-[0_0_10px_rgba(249,115,22,0.1)] transition-all">JSON_PACKET</button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left mono text-[11px]">
                      <thead className="text-zinc-500 border-b border-zinc-800">
                        <tr>
                          <th className="p-4">IDENTIFIER</th>
                          <th className="p-4">OPERATOR</th>
                          <th className="p-4">CIRCLE</th>
                          <th className="p-4">RISK</th>
                          <th className="p-4">CONFIDENCE</th>
                          <th className="p-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900">
                        {paginatedResults.map((res, i) => (
                          <tr key={i} className="hover:bg-cyan-500/5 transition-colors">
                            <td className="p-4 text-zinc-300 font-bold">{res.phoneNumber}</td>
                            <td className="p-4 text-zinc-500">{res.operator}</td>
                            <td className="p-4 text-zinc-500">{res.circle}</td>
                            <td className="p-4"><RiskBadge level={res.riskLevel} /></td>
                            <td className="p-4 text-zinc-100 font-bold">{res.confidenceScore}%</td>
                            <td className="p-4 text-right">
                              <button 
                                onClick={() => { setState({ ...state, result: res, batchResults: [] }); addLog(`SWITCHED VIEW TO TARGET: ${res.phoneNumber}`); }}
                                className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4"
                              >
                                View_Full_Log
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between border-t border-zinc-900 pt-4">
                      <span className="text-[9px] text-zinc-600 mono uppercase">Page {currentPage} of {totalPages}</span>
                      <div className="flex gap-2">
                        <button 
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className="px-3 py-1 border border-zinc-800 text-zinc-500 hover:text-zinc-200 disabled:opacity-30"
                        >
                          Prev
                        </button>
                        <button 
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className="px-3 py-1 border border-zinc-800 text-zinc-500 hover:text-zinc-200 disabled:opacity-30"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : state.result ? (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                   <DataPod label="PRIMARY_UID" value={state.result.phoneNumber} subValue={state.result.country} accent="orange" />
                   <DataPod label="TELECOM_NODE" value={state.result.operator} subValue={`${state.result.circle} Circle`} accent="cyan" />
                   <div className="lg:col-span-2">
                     <div className="cyber-border bg-zinc-950/60 p-4 rounded-sm flex flex-col justify-between h-32">
                        <div className="flex items-center justify-between">
                           <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Risk_Assessment</span>
                           <RiskBadge level={state.result.riskLevel} />
                        </div>
                        <div className="flex items-end gap-6 mt-2">
                           <div className="text-4xl font-black text-zinc-100 mono tabular-nums">
                             {state.result.confidenceScore}<span className="text-orange-500 text-sm">%</span>
                           </div>
                           <div className="flex-1 pb-1">
                              <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" style={{ width: `${state.result.confidenceScore}%` }}></div>
                              </div>
                              <span className="text-[8px] mono text-zinc-700 uppercase mt-1 block">Signal_Confidence_Probability</span>
                           </div>
                        </div>
                     </div>
                   </div>
                </div>

                <div className="cyber-border bg-zinc-950/60 rounded-sm p-6 overflow-hidden">
                   <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                      <div>
                        <h3 className="text-lg font-black text-zinc-100 tracking-tight uppercase">Intelligence Manifest</h3>
                        <p className="text-[10px] mono text-zinc-600 uppercase tracking-widest">Retrieved digital fingerprints and signal registry matches.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={exportToCsv}
                          className="px-4 py-2 border border-cyan-500/40 text-cyan-400 mono font-bold text-[10px] uppercase hover:bg-cyan-500/10 transition-colors flex items-center gap-2 group"
                        >
                          <svg className="group-hover:translate-y-0.5 transition-transform" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          CSV_MANIFEST
                        </button>
                        <button 
                          onClick={exportToJson}
                          className="px-6 py-2 border border-orange-500/40 text-orange-500 mono font-bold text-[10px] uppercase hover:bg-orange-500/10 transition-colors flex items-center gap-2 group"
                        >
                          <svg className="group-hover:translate-y-0.5 transition-transform" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          JSON_PACKET
                        </button>
                      </div>
                   </div>
                   <FindingsTable findings={state.result.findings} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <MetaStat label="CONN_TYPE" value={state.result.metadata.connectionType} />
                   <MetaStat label="DND_FILTER" value={state.result.metadata.isDND ? "ACTIVE_BLOCKED" : "INACTIVE_BYPASS"} />
                   <MetaStat label="ENTITY_CLASS" value={state.result.metadata.potentialOwnerType} />
                </div>
              </div>
            ) : (
              <div className="h-[600px] flex flex-col items-center justify-center p-12 cyber-border bg-zinc-950/20 rounded-sm border-zinc-800/40 opacity-40">
                 <div className="w-24 h-24 text-zinc-800 mb-6">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
                 </div>
                 <h4 className="mono font-bold text-xs uppercase tracking-[0.4em] text-zinc-600 text-center leading-relaxed">
                   Enter Target Identifier<br/>to begin extraction
                 </h4>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-zinc-900 bg-black/90 backdrop-blur-md py-4 px-6 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-[9px] mono text-zinc-600 tracking-widest uppercase">
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 bg-cyan-500"></span>
              NODE_INDIA_WEST_01
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 bg-orange-500"></span>
              ENCRYPTION_AES_256
            </span>
            <span className="hidden sm:inline">OSINT-PROTOCOL-V4.2</span>
          </div>
          
          <div className="text-[10px] mono text-zinc-700 font-bold uppercase tracking-tight text-center">
            Ethical Boundaries Active • Public Signal Correlation Only
          </div>

          <div className="flex items-center gap-4 text-[9px] mono">
            <span className="text-zinc-600">ENGINE_STATUS:</span>
            <span className="text-emerald-500 font-bold animate-pulse">NOMINAL_OPERATIONAL</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

const DataPod = ({ label, value, subValue, accent }: { label: string, value: string, subValue: string, accent: 'orange' | 'cyan' }) => (
  <div className="cyber-border bg-zinc-950/60 p-4 rounded-sm flex flex-col justify-between h-32">
    <div className="flex items-center justify-between">
      <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{label}</span>
      <div className={`w-3 h-3 ${accent === 'orange' ? 'text-orange-500' : 'text-cyan-400'}`}>
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
      </div>
    </div>
    <div>
      <div className={`text-xl font-black mono text-zinc-100`}>{value}</div>
      <div className="text-[10px] mono text-zinc-600 uppercase mt-1 tracking-tighter">{subValue}</div>
    </div>
  </div>
);

const MetaStat = ({ label, value }: { label: string, value: string }) => (
  <div className="bg-zinc-900/40 border border-zinc-800 p-3 flex items-center justify-between mono">
    <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-[0.2em]">{label}</span>
    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-tight">{value}</span>
  </div>
);

export default App;
