import React, { useState, useEffect } from 'react';
import { healthApi } from '../../api/healthApi';
import { Database, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const ConnectionStatus = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  const fetchHealth = async () => {
    try {
      const data = await healthApi.checkHealth();
      setHealth(data);
    } catch (err) {
      setHealth({
        success: false,
        database: { connected: false, status: 'Disconnected' },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 25000); // 25s poll
    return () => clearInterval(interval);
  }, []);

  const isConnected = health?.database?.connected;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        title="MongoDB & Backend Health Status"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
          isConnected
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
        }`}
      >
        <span className="relative flex h-2 w-2">
          {isConnected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isConnected ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          ></span>
        </span>
        <Database className="w-3 h-3 text-current" />
        <span className="hidden md:inline">
          {isConnected ? 'MongoDB Active' : 'DB Disconnected'}
        </span>
      </button>

      {/* Popover Card */}
      {showDetails && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDetails(false)}
          />
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 text-xs text-slate-700 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>MongoDB Live Status</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fetchHealth();
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Connection:</span>
                <span className="font-medium text-emerald-600 flex items-center gap-1">
                  {isConnected ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> Connected
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-rose-500" /> Offline
                    </>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Database:</span>
                <span className="font-mono text-slate-900 font-semibold">
                  {health?.database?.name || 'kk_brothers_management'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Host:</span>
                <span className="font-mono text-slate-600">
                  {health?.database?.host || '127.0.0.1'}
                </span>
              </div>

              {health?.database?.counts && (
                <div className="pt-2 border-t border-slate-100 mt-2">
                  <div className="text-[11px] font-semibold uppercase text-slate-400 mb-1.5">
                    Live Record Counts
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-50 p-1.5 rounded">
                      Staff: <span className="font-bold">{health.database.counts.staff}</span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded">
                      Hotels/Caterers: <span className="font-bold">{health.database.counts.clients}</span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded">
                      Duties: <span className="font-bold">{health.database.counts.duties}</span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded">
                      Users: <span className="font-bold">{health.database.counts.users}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ConnectionStatus;
