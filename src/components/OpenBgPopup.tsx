import React, { useState, useEffect } from 'react';
import { Sparkles, ExternalLink, X, Wand2, ArrowRight } from 'lucide-react';

export const OpenBgPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Trigger every 15 seconds (15,000 ms)
    const interval = setInterval(() => {
      setIsOpen(true);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  const handleOpenLink = () => {
    window.open('https://openinapp.link/hy3t6', '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      {/* Modal Card */}
      <div 
        className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#161d2f] to-[#0c101c] border border-cyan-500/30 p-6 sm:p-7 shadow-2xl shadow-cyan-500/20 transform transition-all scale-100 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
          aria-label="Close popup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Badge & Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/30 shrink-0">
            <div className="w-full h-full bg-[#0d1322] rounded-[14px] flex items-center justify-center">
              <Wand2 className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Recommended Tool
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                <Sparkles className="w-3 h-3" /> Top Rated
              </span>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight mt-0.5">
              OpenBG-AI
            </h3>
          </div>
        </div>

        {/* Content Details */}
        <div className="space-y-2 mb-6">
          <p className="text-sm font-semibold text-cyan-200">
            ✨ Best Background Remover Online
          </p>
          <p className="text-xs text-gray-300 leading-relaxed">
            Instantly remove or replace image backgrounds with precision edge-detection. 100% automatic, ultra-fast, and crystal-clear results.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenLink}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Try OpenBG-AI Now</span>
            <ExternalLink className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsOpen(false)}
            className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-medium text-xs border border-white/10 transition-colors"
          >
            Later
          </button>
        </div>

        <p className="text-[10px] text-center text-gray-500 mt-4">
          Opens in a new tab • Powered by OpenBG-AI
        </p>
      </div>
    </div>
  );
};
