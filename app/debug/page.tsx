'use client';

import { useState, useEffect } from 'react';
import rawResources from '../../data/resources.json';
import crawlLogData from '../../data/crawl_log.json';
import { Resource } from '@/lib/resourceUtils';

interface CrawlEntry {
  url: string;
  crawled_at: string;
  raw_text_file: string | null;
  resources_extracted: { name: string; phone: string; address: string }[];
  total_resources: number;
  phone_missing_count: number;
  error?: string;
}

export default function DebugPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [crawlLog, setCrawlLog] = useState<CrawlEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'resources' | 'crawl'>('resources');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [rawTexts, setRawTexts] = useState<Record<string, string>>({});
  const [loadingText, setLoadingText] = useState<string | null>(null);

  useEffect(() => {
    setResources(rawResources as Resource[]);
    setCrawlLog(crawlLogData as CrawlEntry[]);
  }, []);

  async function loadRawText(entry: CrawlEntry) {
    if (!entry.raw_text_file) return;
    const key = entry.url;
    if (rawTexts[key]) {
      setExpandedEntry(expandedEntry === key ? null : key);
      return;
    }
    setLoadingText(key);
    try {
      const res = await fetch(`/api/crawl-cache?file=${encodeURIComponent(entry.raw_text_file)}`);
      const text = await res.text();
      setRawTexts(prev => ({ ...prev, [key]: text }));
      setExpandedEntry(key);
    } catch (e) {
      setRawTexts(prev => ({ ...prev, [key]: '⚠️ Failed to load raw text.' }));
      setExpandedEntry(key);
    } finally {
      setLoadingText(null);
    }
  }

  const tabs = [
    { id: 'resources' as const, label: 'Resources', count: resources.length },
    { id: 'crawl' as const, label: 'Crawl Archive', count: crawlLog.length },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 border-b border-slate-200 pb-4">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Data Provenance Debugger</h1>
          <p className="text-slate-500 mt-2">Trace the source, crawl history, and phone extraction results for all ingested resources.</p>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all border ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {tab.label}
              <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-mono ${
                activeTab === tab.id ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* === RESOURCES TAB === */}
        {activeTab === 'resources' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-100/50 text-slate-500 uppercase tracking-wider font-bold text-xs">
                  <tr>
                    <th className="px-6 py-4 border-b border-slate-200">Resource Name</th>
                    <th className="px-6 py-4 border-b border-slate-200">Type</th>
                    <th className="px-6 py-4 border-b border-slate-200">Phone</th>
                    <th className="px-6 py-4 border-b border-slate-200">Last Updated</th>
                    <th className="px-6 py-4 border-b border-slate-200 w-1/3">Source URL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resources.map((res) => (
                    <tr key={res.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {res.name}
                        {res.notes && (
                          <div className="text-[10px] text-slate-400 font-normal mt-1 whitespace-normal max-w-xs leading-snug">
                            {res.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${
                          res.type === 'food' ? 'bg-green-100 text-green-700' :
                          res.type === 'shelter' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {res.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {(res as any).phone ? (
                          <span className="font-mono text-slate-700 text-xs">{(res as any).phone}</span>
                        ) : (
                          <span className="text-red-400 text-xs font-bold">⚠ Missing</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 tabular-nums">
                        {new Date(res.last_updated).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {res.source && res.source.startsWith('http') ? (
                          <a
                            href={res.source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline truncate inline-block max-w-xs"
                            title={res.source}
                          >
                            {res.source}
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">{res.source || 'Unknown Source'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {resources.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        No resources found in data store.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-slate-100 text-xs font-medium text-slate-400">
              Total: {resources.length} resources · {resources.filter(r => !(r as any).phone).length} missing phone
            </div>
          </div>
        )}

        {/* === CRAWL ARCHIVE TAB === */}
        {activeTab === 'crawl' && (
          <div className="space-y-4">
            {crawlLog.length === 0 && (
              <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-500">
                <div className="text-3xl mb-3">📭</div>
                <p className="font-bold text-slate-700">No crawl sessions recorded yet.</p>
                <p className="text-sm mt-1">Run the crawler agent to start populating this log.</p>
              </div>
            )}
            {[...crawlLog].reverse().map((entry, idx) => (
              <div
                key={`${entry.url}-${idx}`}
                className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
              >
                {/* Entry header */}
                <div className="px-6 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-mono text-sm truncate block"
                    >
                      {entry.url}
                    </a>
                    <div className="flex gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                      <span>🕐 {new Date(entry.crawled_at).toLocaleString()}</span>
                      <span>📄 {entry.total_resources} resources extracted</span>
                      {entry.phone_missing_count > 0 ? (
                        <span className="text-red-500 font-bold">⚠ {entry.phone_missing_count} missing phones</span>
                      ) : entry.total_resources > 0 ? (
                        <span className="text-green-600 font-bold">✓ All phones found</span>
                      ) : null}
                      {entry.error && (
                        <span className="text-red-500 font-bold">❌ Error: {entry.error}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {entry.raw_text_file && (
                      <button
                        id={`view-raw-${idx}`}
                        onClick={() => loadRawText(entry)}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 hover:border-slate-400 text-slate-600 transition-all"
                      >
                        {loadingText === entry.url ? '⏳ Loading...' : expandedEntry === entry.url ? '▲ Hide Raw' : '📄 View Raw'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Extracted resources table */}
                {entry.resources_extracted.length > 0 && (
                  <div className="border-t border-slate-100 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-bold">
                        <tr>
                          <th className="px-6 py-2">Name</th>
                          <th className="px-6 py-2">Phone</th>
                          <th className="px-6 py-2">Address</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {entry.resources_extracted.map((r, i) => (
                          <tr key={i} className={r.phone ? '' : 'bg-red-50/40'}>
                            <td className="px-6 py-2 font-medium text-slate-700">{r.name}</td>
                            <td className="px-6 py-2 font-mono text-xs">
                              {r.phone ? (
                                <span className="text-green-700">{r.phone}</span>
                              ) : (
                                <span className="text-red-500 font-bold">⚠ not found</span>
                              )}
                            </td>
                            <td className="px-6 py-2 text-slate-500 text-xs">{r.address || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Raw text panel */}
                {expandedEntry === entry.url && rawTexts[entry.url] && (
                  <div className="border-t border-slate-200">
                    <div className="bg-slate-900 text-slate-200 px-6 py-3 text-xs font-mono flex justify-between items-center">
                      <span>📄 {entry.raw_text_file}</span>
                      <span className="text-slate-400">{rawTexts[entry.url].length.toLocaleString()} chars</span>
                    </div>
                    <pre className="bg-slate-950 text-slate-300 text-xs font-mono p-6 overflow-auto max-h-96 leading-relaxed whitespace-pre-wrap">
                      {rawTexts[entry.url]}
                    </pre>
                  </div>
                )}
              </div>
            ))}

            {crawlLog.length > 0 && (
              <div className="text-xs font-medium text-slate-400 mt-2">
                {crawlLog.length} crawl sessions recorded
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
