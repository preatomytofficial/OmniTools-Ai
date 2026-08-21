import React, { useState } from 'react';
import {
  Download,
  FileCode,
  Sparkles,
  Wand2,
  Scissors,
  Music,
  Film,
  FileText,
  Eye,
  ShieldCheck,
  Terminal,
  ExternalLink,
  FileSpreadsheet,
  Layers,
  BookOpen,
  Copy,
  Check,
  Code2
} from 'lucide-react';
import { ToolModule } from '../types';
import { CodeModal } from './CodeModal';
import { MODULE_SOURCES } from '../data/moduleSources';

interface ApiHubProps {
  onBack?: () => void;
}

export const ApiHub: React.FC<ApiHubProps> = () => {
  const [activeCodeFile, setActiveCodeFile] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'media' | 'doc'>('all');

  const modules: (ToolModule & { category: 'media' | 'doc' | 'guide' })[] = [
    {
      id: 'box_1',
      title: 'Image Upscale Super-Res',
      file: 'upscale.py',
      downloadUrl: '/assets/upscale.py',
      description: 'RealESRGAN & Lanczos super-resolution algorithm with unsharp masking for 2x, 4x, and 8x image enhancement.',
      icon: 'sparkles',
      category: 'media',
    },
    {
      id: 'box_2',
      title: 'Watermark Optical Remover',
      file: 'watermark_remove.py',
      downloadUrl: '/assets/watermark_remove.py',
      description: 'OpenCV Inpainting (Telea and Navier-Stokes) with optical texture reconstruction to eliminate logos, stamps, and watermarks.',
      icon: 'wand',
      category: 'media',
    },
    {
      id: 'box_3',
      title: 'Object Remover & Eraser',
      file: 'object_remove.py',
      downloadUrl: '/assets/object_remove.py',
      description: 'Local patch synthesis and object eraser that reconstructs clean background geometry without leaving visual artifacts.',
      icon: 'scissors',
      category: 'media',
    },
    {
      id: 'box_4',
      title: 'Video to MP3 Extractor',
      file: 'video_mp3.py',
      downloadUrl: '/assets/video_mp3.py',
      description: 'High-speed audio extraction module supporting up to 320kbps MP3 fidelity from MP4, MKV, WEBM, and AVI containers.',
      icon: 'music',
      category: 'media',
    },
    {
      id: 'box_5',
      title: 'Video Trim & Stream Slicer',
      file: 'video_trim.py',
      downloadUrl: '/assets/video_trim.py',
      description: 'Frame-accurate video trimmer and stream slicer with support for fast stream copying and high-quality re-encoding.',
      icon: 'film',
      category: 'media',
    },
    {
      id: 'box_csv_json',
      title: 'CSV to JSON Parser',
      file: 'csv_json.py',
      downloadUrl: '/assets/csv_json.py',
      description: 'High-speed tabular CSV parser with auto-delimiter detection, type casting, and customizable JSON formatting.',
      icon: 'spreadsheet',
      category: 'doc',
    },
    {
      id: 'box_pdf_editor',
      title: 'PDF Editor & Merger',
      file: 'pdf_editor.py',
      downloadUrl: '/assets/pdf_editor.py',
      description: 'Multi-functional PDF toolkit for document merging, page splitting, rotation, watermarks, and pagination with pypdf.',
      icon: 'layers',
      category: 'doc',
    },
    {
      id: 'box_pdf_epub',
      title: 'PDF to EPUB Ebook Tool',
      file: 'pdf_epub.py',
      downloadUrl: '/assets/pdf_epub.py',
      description: 'Document to reflowable EPUB 3 ebook packager with chapter navigation, styling, and metadata embedding.',
      icon: 'book',
      category: 'doc',
    },
    {
      id: 'box_guide',
      title: 'Setup & Deployment Guide',
      file: 'CreateLLM.pdf (Drive)',
      downloadUrl: 'https://drive.google.com/file/d/1A4MY2wtf1BTW3ogBMtPLeDuBiQiD5EOR/view',
      externalUrl: 'https://drive.google.com/file/d/1A4MY2wtf1BTW3ogBMtPLeDuBiQiD5EOR/view',
      description: 'Official comprehensive manual on how to configure and run standalone media & processing tools on your system.',
      icon: 'file_text',
      isDoc: true,
      isExternal: true,
      category: 'guide',
    },
  ];

  const filteredModules = modules.filter((m) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'media') return m.category === 'media';
    if (selectedCategory === 'doc') return m.category === 'doc';
    return true;
  });

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'sparkles': return <Sparkles className="w-6 h-6 text-indigo-400" />;
      case 'wand': return <Wand2 className="w-6 h-6 text-cyan-400" />;
      case 'scissors': return <Scissors className="w-6 h-6 text-rose-400" />;
      case 'music': return <Music className="w-6 h-6 text-emerald-400" />;
      case 'film': return <Film className="w-6 h-6 text-purple-400" />;
      case 'spreadsheet': return <FileSpreadsheet className="w-6 h-6 text-amber-400" />;
      case 'layers': return <Layers className="w-6 h-6 text-red-400" />;
      case 'book': return <BookOpen className="w-6 h-6 text-teal-400" />;
      case 'file_text': return <FileText className="w-6 h-6 text-amber-400" />;
      default: return <FileCode className="w-6 h-6 text-gray-400" />;
    }
  };

  const handleDownloadFile = (filename: string, fallbackUrl: string) => {
    const code = MODULE_SOURCES[filename];
    if (code) {
      const blob = new Blob([code], { type: 'text/x-python;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const a = document.createElement('a');
      a.href = fallbackUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Notice Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/60 via-[#121826]/90 to-cyan-950/40 border border-white/10 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-white">API Key & Developer Hub</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Python Scripts Included
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 mt-1 leading-relaxed">
              Download complete standalone Python automation scripts for image enhancement, watermark removal, audio ripping, CSV conversion, and PDF tools.
            </p>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedCategory === 'all'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
          }`}
        >
          All Scripts ({modules.length})
        </button>
        <button
          onClick={() => setSelectedCategory('media')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            selectedCategory === 'media'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
              : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Media Processing (5)</span>
        </button>
        <button
          onClick={() => setSelectedCategory('doc')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            selectedCategory === 'doc'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
              : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Documents & PDF (3)</span>
        </button>
      </div>

      {/* Downloadable Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredModules.map((mod, idx) => (
          <div
            key={mod.id}
            className={`group rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 border backdrop-blur-xl ${
              mod.isDoc
                ? 'bg-gradient-to-b from-amber-950/20 to-[#121826]/90 border-amber-500/30 hover:border-amber-500/60 shadow-lg shadow-amber-950/20'
                : 'bg-[#121826]/80 hover:bg-[#151c2e]/90 border-white/10 hover:border-indigo-500/40 hover:-translate-y-1 shadow-lg'
            }`}
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {getIcon(mod.icon)}
                </div>
                <span className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg border ${
                  mod.isDoc 
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' 
                    : 'bg-white/5 text-gray-300 border-white/10'
                }`}>
                  {mod.file}
                </span>
              </div>

              {/* Title & Desc */}
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">
                  MODULE {idx + 1}
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight mb-2 group-hover:text-cyan-300 transition-colors">
                {mod.title}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-5">
                {mod.description}
              </p>
            </div>

            {/* Card Actions */}
            <div className="pt-4 border-t border-white/10 flex items-center gap-2">
              {mod.isExternal ? (
                <a
                  href={mod.externalUrl || mod.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white shadow-amber-600/20 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Download Setup Guide</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDownloadFile(mod.file, mod.downloadUrl)}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md text-white bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download {mod.file}</span>
                </button>
              )}

              {!mod.isDoc && (
                <button
                  type="button"
                  onClick={() => setActiveCodeFile(mod.file)}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 transition-colors cursor-pointer"
                  title="View Python Source Code"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CLI Quickstart */}
      <div className="bg-[#121826]/80 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Local Terminal Execution Examples
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-black/40 p-4 rounded-xl border border-indigo-500/20 space-y-2">
            <span className="text-indigo-400 font-bold"># 1. Upscale an Image locally</span>
            <div className="text-gray-300 overflow-x-auto">
              python upscale.py -i input.png -o output_4x.png -s 4
            </div>
          </div>

          <div className="bg-black/40 p-4 rounded-xl border border-emerald-500/20 space-y-2">
            <span className="text-emerald-400 font-bold"># 2. Inpaint / Erase Watermark</span>
            <div className="text-gray-300 overflow-x-auto">
              python watermark_remove.py -i input.png -o clean.png --x 50 --y 50 --w 200 --h 60
            </div>
          </div>

          <div className="bg-black/40 p-4 rounded-xl border border-rose-500/20 space-y-2">
            <span className="text-rose-400 font-bold"># 3. Object Eraser</span>
            <div className="text-gray-300 overflow-x-auto">
              python object_remove.py -i photo.jpg -o clean.jpg
            </div>
          </div>

          <div className="bg-black/40 p-4 rounded-xl border border-purple-500/20 space-y-2">
            <span className="text-purple-400 font-bold"># 4. Extract 320kbps MP3 Audio</span>
            <div className="text-gray-300 overflow-x-auto">
              python video_mp3.py -i footage.mp4 -o song.mp3 -b 320k
            </div>
          </div>
        </div>
      </div>

      {/* Code Modal */}
      <CodeModal
        filename={activeCodeFile}
        onClose={() => setActiveCodeFile(null)}
      />
    </div>
  );
};
