import React, { useState, useRef } from 'react';
import { Upload, Sliders, Sparkles, Download, ZoomIn, ZoomOut, RotateCcw, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { safeApiFetch } from '../lib/api';

export const ImageUpscaler: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [scaleFactor, setScaleFactor] = useState<number>(4);
  const [sharpen, setSharpen] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setError(null);
      setResultUrl(null);
      const reader = new FileReader();
      reader.onload = (re) => {
        setPreviewUrl(re.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setError(null);
      setResultUrl(null);
      const reader = new FileReader();
      reader.onload = (re) => {
        setPreviewUrl(re.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const loadSample = async () => {
    try {
      const res = await fetch('/samples/sample_upscale.png');
      const blob = await res.blob();
      const file = new File([blob], 'sample_upscale.png', { type: 'image/png' });
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(blob));
      setResultUrl(null);
      setError(null);
    } catch (e) {
      // Fallback generator
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 160, 160);
        grad.addColorStop(0, '#3b82f6');
        grad.addColorStop(1, '#ec4899');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 160, 160);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('OmniTools', 25, 60);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'sample_lowres.png', { type: 'image/png' });
            setSelectedFile(file);
            setPreviewUrl(canvas.toDataURL());
            setResultUrl(null);
            setError(null);
          }
        });
      }
    }
  };

  const handleUpscale = async () => {
    if (!selectedFile) {
      setError('Please select or drop an image first.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('scale', scaleFactor.toString());
    formData.append('sharpen', sharpen.toString());

    try {
      const data = await safeApiFetch<{ success?: boolean; base64Image?: string; outputUrl?: string; error?: string }>('/api/upscale', {
        method: 'POST',
        body: formData,
      });

      if (data.success && (data.base64Image || data.outputUrl)) {
        setResultUrl(data.base64Image || data.outputUrl);
      } else {
        setError(data.error || 'Failed to upscale image with local engine.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error executing local upscale routine.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  };

  return (
    <div className="space-y-6">
      {/* Tool Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">Image Upscale (RealESRGAN)</h2>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            2x, 4x, and 8x super-resolution with Lanczos edge filtering and micro-contrast unsharp synthesis.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSample}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 hover:bg-cyan-900/40 transition-colors self-start sm:self-auto"
        >
          Load Demo Sample 🖼️
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-1 space-y-5">
          {/* Upload Box */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/15 hover:border-indigo-500/50 bg-black/20 hover:bg-indigo-950/10 rounded-2xl p-6 text-center cursor-pointer transition-all group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white">
              {selectedFile ? selectedFile.name : 'Click to select or drag image'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, WEBP, BMP up to 50MB
            </p>
          </div>

          {/* Settings Card */}
          <div className="bg-[#121826]/80 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Upscale Configuration
            </h3>

            {/* Scale Factor */}
            <div>
              <label className="text-xs text-gray-400 block mb-2 font-medium">
                Upscaling Multiplier:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[2, 4, 8].map((factor) => (
                  <button
                    key={factor}
                    type="button"
                    onClick={() => setScaleFactor(factor)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      scaleFactor === factor
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
                    }`}
                  >
                    {factor}x Scale
                  </button>
                ))}
              </div>
            </div>

            {/* Sharpen Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div>
                <span className="text-xs font-medium text-gray-300 block">Edge Sharpening</span>
                <span className="text-[11px] text-gray-500">Unsharp mask & texture boost</span>
              </div>
              <input
                type="checkbox"
                checked={sharpen}
                onChange={(e) => setSharpen(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            {/* Action Button */}
            <button
              onClick={handleUpscale}
              disabled={!selectedFile || isProcessing}
              className={`w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                !selectedFile || isProcessing
                  ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                  : 'bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.98]'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Super-Resolution...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Upscale {scaleFactor}x Locally</span>
                </>
              )}
            </button>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Preview & Compare Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#121826]/80 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden">
            {previewUrl ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                {/* View Toolbar */}
                <div className="w-full flex items-center justify-between mb-3 text-xs text-gray-400">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-gray-300">
                      {resultUrl ? 'Before & After Comparison (Drag slider):' : 'Original Input Preview:'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/10">
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                      className="p-1 hover:text-white"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                      className="p-1 hover:text-white"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomLevel(1)}
                      className="p-1 hover:text-white"
                      title="Reset Zoom"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-1 font-mono text-[10px] text-gray-400">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                  </div>
                </div>

                {/* Image Stage */}
                <div className="relative w-full max-w-lg aspect-video max-h-[380px] bg-black/50 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
                  {resultUrl ? (
                    // Split Comparison Slider
                    <div
                      ref={containerRef}
                      onMouseMove={handleSliderMove}
                      className="relative w-full h-full cursor-ew-resize select-none overflow-hidden"
                    >
                      {/* After Image (Upscaled) */}
                      <img
                        src={resultUrl}
                        alt="Upscaled"
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                        style={{ transform: `scale(${zoomLevel})` }}
                      />

                      {/* Before Image (Cropped by slider) */}
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: `${sliderPosition}%` }}
                      >
                        <img
                          src={previewUrl}
                          alt="Original"
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none filter blur-[0.5px]"
                          style={{
                            width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
                            maxWidth: 'none',
                            transform: `scale(${zoomLevel})`
                          }}
                        />
                      </div>

                      {/* Divider Line */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                        style={{ left: `${sliderPosition}%` }}
                      >
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-cyan-400 text-black flex items-center justify-center text-[10px] font-bold shadow-lg">
                          ↔
                        </div>
                      </div>

                      {/* Labels */}
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-gray-300 border border-white/10">
                        ORIGINAL (1x)
                      </div>
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-cyan-950/80 text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
                        UPSCALED ({scaleFactor}x)
                      </div>
                    </div>
                  ) : (
                    // Single Original Image Preview
                    <img
                      src={previewUrl}
                      alt="Original Preview"
                      className="max-h-full max-w-full object-contain transition-transform"
                      style={{ transform: `scale(${zoomLevel})` }}
                    />
                  )}
                </div>

                {/* Download Bar */}
                {resultUrl && (
                  <div className="w-full mt-4 flex items-center justify-between bg-black/30 p-3 rounded-xl border border-white/10">
                    <div className="text-xs text-gray-300">
                      <span className="text-emerald-400 font-bold">✓ Ready!</span> Enhanced {scaleFactor}x locally.
                    </div>
                    <a
                      href={resultUrl}
                      download={`omnitools_upscaled_${scaleFactor}x.png`}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all hover:scale-105"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download High-Res PNG
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-8 text-gray-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 stroke-1 text-gray-600" />
                <p className="text-sm font-medium text-gray-400">No image loaded yet</p>
                <p className="text-xs mt-1">Upload a photo to see the live before/after super-resolution preview.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
