import React, { useState } from 'react';
import { ToolType } from '../types';
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
  ArrowUpRight,
  Zap,
  Grid,
  CheckCircle2
} from 'lucide-react';

interface ToolsGridProps {
  activeTab: ToolType;
  onSelectTool: (tool: ToolType) => void;
}

interface ToolCardInfo {
  id: ToolType;
  title: string;
  subtitle: string;
  category: 'ai' | 'media' | 'doc';
  categoryLabel: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  icon: any;
  color: string;
  gradient: string;
}

export const ToolsGrid: React.FC<ToolsGridProps> = ({ activeTab, onSelectTool }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'ai' | 'media' | 'doc'>('all');

  const tools: ToolCardInfo[] = [
    {
      id: 'upscale',
      title: 'Image Upscaler',
      subtitle: 'RealESRGAN Super-Resolution (2x, 4x, 8x)',
      category: 'ai',
      categoryLabel: 'AI Vision',
      description: 'Super-resolution AI algorithm with Lanczos edge filtering to enhance resolution up to 8x.',
      badge: 'RealESRGAN',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      icon: Sparkles,
      color: 'text-indigo-400',
      gradient: 'from-indigo-500/20 to-purple-500/5'
    },
    {
      id: 'watermark',
      title: 'Watermark Remover',
      subtitle: 'Optical Inpainting & Stamp Eraser',
      category: 'ai',
      categoryLabel: 'AI Vision',
      description: 'OpenCV Inpainting and texture synthesis to erase logos, date stamps, and watermarks.',
      icon: Wand2,
      color: 'text-cyan-400',
      gradient: 'from-cyan-500/20 to-blue-500/5'
    },
    {
      id: 'object',
      title: 'Object Eraser',
      subtitle: 'Photobomb & Geometry Inpainter',
      category: 'ai',
      categoryLabel: 'AI Vision',
      description: 'Photobomb and object eraser with surrounding background geometry and texture reconstruction.',
      icon: Scissors,
      color: 'text-rose-400',
      gradient: 'from-rose-500/20 to-pink-500/5'
    },
    {
      id: 'video_mp3',
      title: 'Video to MP3 Converter',
      subtitle: 'Lossless 320kbps Audio Extractor',
      category: 'media',
      categoryLabel: 'Audio & Video',
      description: 'Extract studio-quality 320kbps MP3 audio streams from MP4, MKV, and WEBM video containers.',
      badge: '320kbps Hi-Fi',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: Music,
      color: 'text-emerald-400',
      gradient: 'from-emerald-500/20 to-teal-500/5'
    },
    {
      id: 'video_trim',
      title: 'Video Trimmer',
      subtitle: 'Precision Frame-Accurate Slicer',
      category: 'media',
      categoryLabel: 'Audio & Video',
      description: 'Frame-accurate precision trimming and stream slicing with zero quality loss.',
      icon: Film,
      color: 'text-purple-400',
      gradient: 'from-purple-500/20 to-indigo-500/5'
    },
    {
      id: 'csv_json',
      title: 'CSV to JSON Converter',
      subtitle: 'High-Speed Delimiter & Type Parser',
      category: 'doc',
      categoryLabel: 'Document & Data',
      description: 'Convert CSV/TSV files to JSON instantly with auto-delimiter detection, type casting, and table view.',
      badge: 'DOC TOOL',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20 font-bold',
      icon: FileSpreadsheet,
      color: 'text-amber-400',
      gradient: 'from-amber-500/20 to-orange-500/5'
    },
    {
      id: 'pdf_editor',
      title: 'PDF Editor Suite',
      subtitle: 'Merge, Split, Rotate & Stamp',
      category: 'doc',
      categoryLabel: 'Document & Data',
      description: 'Merge multiple PDFs, split page ranges, rotate layout, add watermark stamps, and customize pagination.',
      badge: 'PDF SUITE',
      badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20 font-bold',
      icon: Layers,
      color: 'text-red-400',
      gradient: 'from-red-500/20 to-rose-500/5'
    },
    {
      id: 'pdf_epub',
      title: 'PDF to EPUB Converter',
      subtitle: 'Reflowable EPUB 3 Ebook Creator',
      category: 'doc',
      categoryLabel: 'Document & Data',
      description: 'Transform PDF documents into standard reflowable EPUB 3 ebook formats for Kindle and Apple Books.',
      badge: 'EBOOK',
      badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20 font-bold',
      icon: BookOpen,
      color: 'text-teal-400',
      gradient: 'from-teal-500/20 to-cyan-500/5'
    },
    {
      id: 'api_hub',
      title: 'API Key & Hub',
      subtitle: 'Access Keys, Python Scripts & Manual',
      category: 'ai',
      categoryLabel: 'API & Developer',
      description: 'Generate instant free API keys, download standalone Python automation scripts, and read local tool setup guides.',
      badge: 'API & SCRIPTS',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20 font-bold',
      icon: KeyRound,
      color: 'text-amber-400',
      gradient: 'from-amber-500/20 to-yellow-500/5'
    },
  ];

  const filteredTools = tools.filter((t) => {
    if (selectedCategory === 'all') return true;
    return t.category === selectedCategory;
  });

  const handleCardClick = (id: ToolType) => {
    onSelectTool(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="space-y-6 pt-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Grid className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              All OmniTools AI Suite • Complete Tool Catalog
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Browse all high-performance tools and utilities. Click any card to launch the workspace.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: 'All Tools (9)' },
            { id: 'ai', label: 'AI Vision (3)' },
            { id: 'media', label: 'Audio & Video (2)' },
            { id: 'doc', label: 'Docs & PDF (3)' }
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTab === tool.id;

          return (
            <div
              key={tool.id}
              onClick={() => handleCardClick(tool.id)}
              className={`group relative rounded-2xl p-5 border transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden bg-gradient-to-b ${tool.gradient} ${
                isActive
                  ? 'bg-[#161f36] border-indigo-500/80 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/50 scale-[1.02]'
                  : 'bg-[#121826]/70 border-white/10 hover:border-white/25 hover:bg-[#161f36]/90 hover:-translate-y-1 hover:shadow-xl shadow-black/40'
              }`}
            >
              {/* Card top */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={`w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center ${tool.color} group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {tool.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-bold ${
                          tool.badgeColor || 'bg-white/10 text-gray-300 border-white/10'
                        }`}
                      >
                        {tool.badge}
                      </span>
                    )}
                    {isActive && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        ACTIVE
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center justify-between">
                    <span>{tool.title}</span>
                    <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium">{tool.subtitle}</p>
                </div>

                <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              {/* Card bottom footer */}
              <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                  {tool.categoryLabel}
                </span>

                <button
                  type="button"
                  className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/5 text-gray-300 group-hover:bg-white/15 group-hover:text-white'
                  }`}
                >
                  <span>{isActive ? 'Active Now' : 'Open Tool'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
