import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Download, FileCode } from 'lucide-react';
import { safeApiFetch } from '../lib/api';
import { MODULE_SOURCES } from '../data/moduleSources';

interface CodeModalProps {
  filename: string | null;
  onClose: () => void;
}

export const CodeModal: React.FC<CodeModalProps> = ({ filename, onClose }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!filename) return;

    // Set immediate local bundled code if available
    const localCode = MODULE_SOURCES[filename];
    if (localCode) {
      setContent(localCode);
    } else {
      setLoading(true);
    }

    safeApiFetch<{ content?: string; error?: string }>(`/api/view-module/${filename}`)
      .then((data) => {
        if (data && data.content) {
          setContent(data.content);
        } else if (!localCode) {
          setContent('# Error: Unable to fetch source code.');
        }
      })
      .catch((err) => {
        if (!localCode) {
          setContent(`# Error: ${err.message}`);
        }
      })
      .finally(() => setLoading(false));
  }, [filename]);

  if (!filename) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!content) return;
    const blob = new Blob([content], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0f1422] border border-white/15 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-black/40 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono">{filename}</h3>
              <p className="text-[11px] text-gray-400">Offline Python Source Module</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Code View */}
        <div className="flex-1 overflow-auto p-5 bg-[#0b0f19]">
          {loading ? (
            <div className="h-64 flex items-center justify-center text-xs text-gray-400 gap-2">
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <span>Loading source code...</span>
            </div>
          ) : (
            <pre className="text-xs sm:text-sm font-mono text-cyan-300/90 leading-relaxed overflow-x-auto whitespace-pre">
              <code>{content}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
