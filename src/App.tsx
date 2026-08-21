import React, { useState, useEffect, useCallback } from 'react';
import { ToolType } from './types';
import { Navbar } from './components/Navbar';
import { ImageUpscaler } from './components/ImageUpscaler';
import { WatermarkRemover } from './components/WatermarkRemover';
import { ObjectRemover } from './components/ObjectRemover';
import { VideoToMp3 } from './components/VideoToMp3';
import { VideoTrimmer } from './components/VideoTrimmer';
import { CsvToJsonConverter } from './components/CsvToJsonConverter';
import { PdfEditor } from './components/PdfEditor';
import { PdfToEpubConverter } from './components/PdfToEpubConverter';
import { ToolsGrid } from './components/ToolsGrid';
import { OmniLogo } from './components/OmniLogo';
import { ApiHub } from './components/ApiHub';
import { OpenBgPopup } from './components/OpenBgPopup';
import {
  Sparkles,
  Wand2,
  Scissors,
  Music,
  Film,
  FileSpreadsheet,
  Layers,
  BookOpen,
  KeyRound,
  ArrowLeft
} from 'lucide-react';

const resolveTabFromUrl = (): ToolType => {
  if (typeof window === 'undefined') return 'upscale';
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = new URLSearchParams(window.location.search);
  const tabParam = search.get('tab')?.toLowerCase();

  if (
    path.includes('api-key') ||
    path.includes('apikey') ||
    path.includes('api_key') ||
    path.includes('api-keys') ||
    path.includes('apihub') ||
    hash.includes('api-key') ||
    hash.includes('apikey') ||
    hash.includes('api_hub') ||
    tabParam === 'api_key' ||
    tabParam === 'api-key' ||
    tabParam === 'api_hub'
  ) {
    return 'api_hub';
  }

  if (path.includes('watermark') || hash.includes('watermark') || tabParam === 'watermark') return 'watermark';
  if (path.includes('object') || hash.includes('object') || tabParam === 'object') return 'object';
  if (path.includes('video-mp3') || path.includes('video_mp3') || hash.includes('video_mp3') || tabParam === 'video_mp3') return 'video_mp3';
  if (path.includes('video-trim') || path.includes('video_trim') || hash.includes('video_trim') || tabParam === 'video_trim') return 'video_trim';
  if (path.includes('csv') || hash.includes('csv') || tabParam === 'csv_json') return 'csv_json';
  if (path.includes('pdf-editor') || path.includes('pdf_editor') || hash.includes('pdf_editor') || tabParam === 'pdf_editor') return 'pdf_editor';
  if (path.includes('pdf-epub') || path.includes('pdf_epub') || hash.includes('pdf_epub') || tabParam === 'pdf_epub') return 'pdf_epub';
  if (path.includes('upscale') || hash.includes('upscale') || tabParam === 'upscale') return 'upscale';

  return 'upscale';
};

export default function App() {
  const [activeTab, setActiveTabState] = useState<ToolType>(resolveTabFromUrl);

  const navigateToTab = useCallback((tab: ToolType) => {
    setActiveTabState(tab);
    // Keep URL domain clean without pathname extensions
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      try {
        window.history.replaceState({ tab }, '', '/');
      } catch {}
    }
  }, []);

  // Clean initial pathname extensions on mount to ensure clean root domain URL
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      try {
        window.history.replaceState(null, '', '/');
      } catch {}
    }
  }, []);

  const toolTabs: { id: ToolType; label: string; icon: any; color: string; badge?: string }[] = [
    { id: 'upscale', label: 'Image Upscale (RealESRGAN)', icon: Sparkles, color: 'text-indigo-400', badge: 'AI' },
    { id: 'watermark', label: 'Watermark Remover', icon: Wand2, color: 'text-cyan-400' },
    { id: 'object', label: 'Object Remover', icon: Scissors, color: 'text-rose-400' },
    { id: 'video_mp3', label: 'Video to MP3', icon: Music, color: 'text-emerald-400' },
    { id: 'video_trim', label: 'Video Trim', icon: Film, color: 'text-purple-400' },
    { id: 'csv_json', label: 'CSV to JSON', icon: FileSpreadsheet, color: 'text-amber-400' },
    { id: 'pdf_editor', label: 'PDF Editor', icon: Layers, color: 'text-red-400' },
    { id: 'pdf_epub', label: 'PDF to EPUB', icon: BookOpen, color: 'text-teal-400' },
    { id: 'api_hub', label: 'API Key & Hub', icon: KeyRound, color: 'text-amber-400', badge: 'API' },
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/15 via-[#0b0f19] to-[#0b0f19]">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(t) => navigateToTab(t)}
        onOpenApiHub={() => navigateToTab('api_hub')}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner if in API Hub */}
        {activeTab === 'api_hub' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigateToTab('upscale')}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Media & Document Tools</span>
              </button>
            </div>
            <ApiHub />
          </div>
        ) : (
          /* Tools Dashboard */
          <div className="space-y-8">
            {/* Official Brand Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#121826]/90 via-[#182035]/80 to-[#121826]/90 border border-white/15 p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Embedded OmniLogo */}
              <OmniLogo size="xl" showText={false} />

              <div className="space-y-1.5 text-center sm:text-left flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    OmniTools <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">AI</span>
                  </h2>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    V 2.0
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold tracking-wide text-cyan-300 uppercase">
                  ALL TOOLS. ONE PLATFORM. LIMITLESS POSSIBILITIES.
                </p>
                <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
                  Zero-latency browser processing suite for image upscaling, watermark removal, object erasing, audio ripping, video trimming, and PDF document workflows.
                </p>
              </div>
            </div>

            {/* Tool Nav Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10 scrollbar-none">
              {toolTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => navigateToTab(tab.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-indigo-600/25 text-white border border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                        : 'bg-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? tab.color : 'text-gray-400'}`} />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full uppercase font-extrabold ml-0.5 border bg-amber-500/20 text-amber-300 border-amber-500/30">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Tool View */}
            <div className="bg-[#121826]/70 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
              {activeTab === 'upscale' && <ImageUpscaler />}
              {activeTab === 'watermark' && <WatermarkRemover />}
              {activeTab === 'object' && <ObjectRemover />}
              {activeTab === 'video_mp3' && <VideoToMp3 />}
              {activeTab === 'video_trim' && <VideoTrimmer />}
              {activeTab === 'csv_json' && <CsvToJsonConverter />}
              {activeTab === 'pdf_editor' && <PdfEditor />}
              {activeTab === 'pdf_epub' && <PdfToEpubConverter />}
            </div>

            {/* Bottom Tools Directory / Fast Switcher Grid */}
            <ToolsGrid activeTab={activeTab} onSelectTool={(t) => navigateToTab(t)} />
          </div>
        )}
      </main>

      {/* Mandatory Footer */}
      <footer className="mt-12 border-t border-white/10 bg-[#090d16] py-6 text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <OmniLogo size="sm" showText={false} />
            <span className="font-semibold text-gray-300">© OmniTools AI • Made by PreatomYT</span>
            <span className="text-gray-600">•</span>
            <span className="text-cyan-400 font-medium">All Tools Active</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateToTab('api_hub')}
              className="hover:text-white transition-colors flex items-center gap-1 font-medium text-amber-400"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>API Key (/api-key)</span>
            </button>
            <a
              href="https://drive.google.com/file/d/1A4MY2wtf1BTW3ogBMtPLeDuBiQiD5EOR/view"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors"
            >
              Tool Setup Manual (PDF)
            </a>
          </div>
        </div>
      </footer>

      {/* 15s Recurring OpenBG-AI Promotion Popup */}
      <OpenBgPopup />
    </div>
  );
}
