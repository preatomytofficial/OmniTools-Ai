import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import {
  FileSpreadsheet,
  Upload,
  Copy,
  Download,
  Check,
  Code,
  FileText,
  RotateCcw,
  Sliders,
  Sparkles,
  Search,
  CheckCircle2,
  Table
} from 'lucide-react';

const SAMPLE_CSV = `id,name,role,department,salary,isActive,joinDate
101,Sarah Connor,Security Lead,CyberSec,125000,true,2023-01-15
102,John Doe,Senior Architect,Cloud Infra,142000,true,2022-04-10
103,Alex Rivera,Full-Stack Engineer,Platform,98000,true,2023-08-01
104,Elena Rostova,Data Scientist,AI Labs,135000,false,2021-11-20
105,Marcus Vance,Product Designer,UX Studio,89000,true,2024-02-14`;

export const CsvToJsonConverter: React.FC = () => {
  const [csvText, setCsvText] = useState<string>(SAMPLE_CSV);
  const [jsonOutput, setJsonOutput] = useState<string>('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'preview' | 'json' | 'table'>('json');
  const [fileName, setFileName] = useState<string>('data.csv');
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Options
  const [dynamicTyping, setDynamicTyping] = useState<boolean>(true);
  const [header, setHeader] = useState<boolean>(true);
  const [skipEmptyLines, setSkipEmptyLines] = useState<boolean>(true);
  const [delimiter, setDelimiter] = useState<string>('auto');
  const [outputFormat, setOutputFormat] = useState<'pretty2' | 'pretty4' | 'compact' | 'keyed'>('pretty2');
  const [stats, setStats] = useState<{ rows: number; cols: number; sizeDiff: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConvert = (input = csvText) => {
    if (!input.trim()) {
      setJsonOutput('');
      setParsedData([]);
      setStats(null);
      return;
    }

    const config: Papa.ParseConfig = {
      header,
      dynamicTyping,
      skipEmptyLines,
      delimiter: delimiter === 'auto' ? '' : delimiter,
      transform: (val: string) => {
        if (typeof val === 'string') return val.trim();
        return val;
      }
    };

    const results = Papa.parse(input, config);

    if (results.data && Array.isArray(results.data)) {
      const data = results.data;
      setParsedData(data);

      let formattedJson = '';
      if (outputFormat === 'compact') {
        formattedJson = JSON.stringify(data);
      } else if (outputFormat === 'pretty4') {
        formattedJson = JSON.stringify(data, null, 4);
      } else if (outputFormat === 'keyed' && header && data.length > 0) {
        // First key as index map
        const firstKey = Object.keys(data[0])[0];
        const keyedObj: Record<string, any> = {};
        data.forEach((item: any) => {
          if (item && item[firstKey] !== undefined) {
            keyedObj[item[firstKey]] = item;
          }
        });
        formattedJson = JSON.stringify(keyedObj, null, 2);
      } else {
        formattedJson = JSON.stringify(data, null, 2);
      }

      setJsonOutput(formattedJson);

      const rowCount = data.length;
      const colCount = data.length > 0 && typeof data[0] === 'object' ? Object.keys(data[0]).length : 0;
      const csvBytes = new Blob([input]).size;
      const jsonBytes = new Blob([formattedJson]).size;
      const diffPercent = Math.round(((jsonBytes - csvBytes) / (csvBytes || 1)) * 100);

      setStats({
        rows: rowCount,
        cols: colCount,
        sizeDiff: diffPercent > 0 ? `+${diffPercent}%` : `${diffPercent}%`
      });
    }
  };

  // Convert on mount and whenever input/options change
  React.useEffect(() => {
    handleConvert(csvText);
  }, [csvText, dynamicTyping, header, skipEmptyLines, delimiter, outputFormat]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvText(text);
      };
      reader.readAsText(file);
    }
  };

  const handleCopy = () => {
    if (!jsonOutput) return;
    navigator.clipboard.writeText(jsonOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!jsonOutput) return;
    const blob = new Blob([jsonOutput], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace(/\.[^/.]+$/, '') + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadSample = (sampleType: 'employees' | 'ecommerce' | 'crypto') => {
    if (sampleType === 'employees') {
      setFileName('employees.csv');
      setCsvText(SAMPLE_CSV);
    } else if (sampleType === 'ecommerce') {
      setFileName('orders.csv');
      setCsvText(`orderId,customer,item,category,quantity,unitPrice,status,delivered
ORD-9812,Alice Wong,Wireless Headset,Audio,2,79.99,Completed,true
ORD-9813,David Miller,Ergonomic Chair,Furniture,1,249.50,Shipped,false
ORD-9814,Sarah Jenkins,Mechanical Keyboard,Gaming,1,120.00,Completed,true
ORD-9815,Liam Chen,4K Monitor 27",Displays,2,389.00,Processing,false`);
    } else if (sampleType === 'crypto') {
      setFileName('market_rates.csv');
      setCsvText(`symbol,assetName,priceUsd,change24h,marketCapBillion,isProofOfWork
BTC,Bitcoin,96500.25,3.45,1890.5,true
ETH,Ethereum,3450.80,-1.12,415.2,false
SOL,Solana,210.45,8.20,98.6,false
ADA,Cardano,0.85,4.10,30.4,false`);
    }
  };

  // Filtered preview data for table search
  const filteredData = parsedData.filter((row) => {
    if (!searchQuery.trim()) return true;
    return JSON.stringify(row).toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FileSpreadsheet className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">CSV to JSON Converter</h2>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Convert CSV, TSV, and delimited spreadsheet files to JSON format instantly with high-speed parser.
          </p>
        </div>

        {/* Sample dataset selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400">Load sample:</span>
          <button
            type="button"
            onClick={() => loadSample('employees')}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-800/40 hover:bg-amber-900/40 transition-colors"
          >
            Staff
          </button>
          <button
            type="button"
            onClick={() => loadSample('ecommerce')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2.5 py-1 rounded-lg bg-indigo-950/40 border border-indigo-800/40 hover:bg-indigo-900/40 transition-colors"
          >
            Orders
          </button>
          <button
            type="button"
            onClick={() => loadSample('crypto')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-800/40 hover:bg-cyan-900/40 transition-colors"
          >
            Market
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
          <div>
            <span className="text-[11px] text-gray-400 uppercase font-semibold">Total Rows</span>
            <p className="text-lg font-bold text-white font-mono">{stats.rows}</p>
          </div>
          <div>
            <span className="text-[11px] text-gray-400 uppercase font-semibold">Columns Detected</span>
            <p className="text-lg font-bold text-amber-400 font-mono">{stats.cols}</p>
          </div>
          <div>
            <span className="text-[11px] text-gray-400 uppercase font-semibold">Source Name</span>
            <p className="text-sm font-semibold text-gray-200 truncate">{fileName}</p>
          </div>
          <div>
            <span className="text-[11px] text-gray-400 uppercase font-semibold">JSON Size Delta</span>
            <p className="text-sm font-semibold text-cyan-400 font-mono">{stats.sizeDiff}</p>
          </div>
        </div>
      )}

      {/* Main workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: CSV Input */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              CSV / Delimited Source Text
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt,.tab"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-gray-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3 h-3" />
                <span>Upload CSV</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCsvText('');
                  setFileName('empty.csv');
                }}
                className="text-xs text-gray-400 hover:text-rose-400 p-1 transition-colors"
                title="Clear text"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Paste raw CSV text here or upload a file..."
              className="w-full h-80 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs sm:text-sm font-mono text-gray-200 focus:outline-none focus:border-amber-500/50 resize-none selection:bg-amber-500/30"
              spellCheck={false}
            />
          </div>

          {/* Options Panel */}
          <div className="bg-[#121826]/80 border border-white/10 rounded-2xl p-4 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Parser Settings
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                <input
                  type="checkbox"
                  checked={header}
                  onChange={(e) => setHeader(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span>First row is Header</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                <input
                  type="checkbox"
                  checked={dynamicTyping}
                  onChange={(e) => setDynamicTyping(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span>Auto-detect Numbers/Booleans</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                <input
                  type="checkbox"
                  checked={skipEmptyLines}
                  onChange={(e) => setSkipEmptyLines(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span>Skip Empty Lines</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-gray-400">Delimiter:</span>
                <select
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value)}
                  className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-gray-200 text-xs focus:outline-none"
                >
                  <option value="auto">Auto-Detect</option>
                  <option value=",">Comma (,)</option>
                  <option value=";">Semicolon (;)</option>
                  <option value="	">Tab (\t)</option>
                  <option value="|">Pipe (|)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="text-gray-400">Output Structure:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'pretty2', label: '2-Space JSON' },
                  { id: 'pretty4', label: '4-Space JSON' },
                  { id: 'compact', label: 'Minified' },
                  { id: 'keyed', label: 'Key-Value Map' }
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setOutputFormat(fmt.id as any)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                      outputFormat === fmt.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: JSON Output & Table View */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            {/* View Tabs */}
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('json')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'json' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>JSON Code</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('table')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'table' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Data Table ({parsedData.length})</span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!jsonOutput}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-gray-200 hover:text-white border border-white/10 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!jsonOutput}
                className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .json</span>
              </button>
            </div>
          </div>

          {activeTab === 'json' ? (
            <div className="relative">
              <textarea
                readOnly
                value={jsonOutput}
                placeholder="JSON output will appear here automatically..."
                className="w-full h-[470px] bg-black/60 border border-white/10 rounded-2xl p-4 text-xs sm:text-sm font-mono text-amber-200/90 focus:outline-none resize-none selection:bg-amber-500/30 overflow-auto"
                spellCheck={false}
              />
              {jsonOutput && (
                <span className="absolute bottom-3 right-4 text-[10px] text-gray-400 font-mono bg-black/80 px-2 py-0.5 rounded border border-white/10">
                  {jsonOutput.length.toLocaleString()} characters
                </span>
              )}
            </div>
          ) : (
            /* Table View */
            <div className="h-[470px] bg-black/60 border border-white/10 rounded-2xl p-3 flex flex-col space-y-3">
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                <Search className="w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter and search table records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none w-full"
                />
              </div>

              <div className="flex-1 overflow-auto rounded-xl border border-white/10">
                {filteredData.length > 0 && typeof filteredData[0] === 'object' ? (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#182032] sticky top-0 border-b border-white/10 text-gray-300 uppercase text-[10px] tracking-wider">
                      <tr>
                        {Object.keys(filteredData[0]).map((key, i) => (
                          <th key={i} className="p-2.5 font-bold border-r border-white/5 whitespace-nowrap">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-gray-300">
                      {filteredData.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                          {Object.values(row).map((val: any, cIdx) => (
                            <td key={cIdx} className="p-2.5 border-r border-white/5 whitespace-nowrap">
                              {typeof val === 'boolean' ? (
                                <span className={val ? 'text-emerald-400' : 'text-rose-400'}>
                                  {val ? 'true' : 'false'}
                                </span>
                              ) : typeof val === 'number' ? (
                                <span className="text-cyan-300">{val}</span>
                              ) : (
                                String(val ?? '')
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-gray-500 text-xs">
                    No structured table rows matching search criteria.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
