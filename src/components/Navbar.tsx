import React from 'react';
import { ToolType } from '../types';
import { OmniLogo } from './OmniLogo';
import { Sparkles, KeyRound } from 'lucide-react';

interface NavbarProps {
  activeTab: ToolType;
  setActiveTab: (tab: ToolType) => void;
  onOpenApiHub: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenApiHub }) => {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0f19]/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('upscale')}
          className="cursor-pointer group select-none"
        >
          <OmniLogo size="md" showText={true} />
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab(activeTab === 'api_hub' ? 'upscale' : activeTab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab !== 'api_hub'
                ? 'bg-indigo-600/25 text-indigo-200 border border-indigo-500/40 shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Suite Tools</span>
          </button>

          <button
            onClick={onOpenApiHub}
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'api_hub'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>API Key & Hub</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
