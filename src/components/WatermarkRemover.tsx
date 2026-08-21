import React, { useState, useRef, useEffect } from 'react';
import { Wand2, Upload, Download, Sparkles, Move, Film, Image as ImageIcon, Play, Pause, RefreshCw, CheckCircle2 } from 'lucide-react';
import { safeApiFetch } from '../lib/api';

export const WatermarkRemover: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaSrc, setMediaSrc] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState<boolean>(false);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultIsVideo, setResultIsVideo] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Bounding box for delogo / inpainting
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 40,
    y: 30,
    w: 220,
    h: 50,
  });

  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection (Image or Video)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    setSelectedFile(file);
    setError(null);
    setResultUrl(null);

    const isVid = file.type.startsWith('video/') || /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(file.name);
    setIsVideo(isVid);

    const url = URL.createObjectURL(file);
    setMediaSrc(url);

    if (!isVid) {
      setBox({ x: 40, y: 40, w: 180, h: 50 });
    } else {
      setBox({ x: 30, y: 30, w: 240, h: 50 });
    }
  };

  const loadSampleImage = async () => {
    try {
      const res = await fetch('/samples/sample_watermark.png');
      const blob = await res.blob();
      const file = new File([blob], 'sample_watermark.png', { type: 'image/png' });
      processSelectedFile(file);
    } catch {
      setError('Unable to load sample image.');
    }
  };

  const loadSampleVideo = async () => {
    try {
      const res = await fetch('/samples/sample_watermark_video.mp4');
      const blob = await res.blob();
      const file = new File([blob], 'sample_watermark_video.mp4', { type: 'video/mp4' });
      processSelectedFile(file);
    } catch {
      setError('Unable to load sample video.');
    }
  };

  // Draw overlay canvas for images or video frames
  const redrawCanvas = () => {
    if (!canvasRef.current || !mediaSrc) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isVideo && hiddenVideoRef.current) {
      const vid = hiddenVideoRef.current;
      if (vid.videoWidth > 0 && vid.videoHeight > 0) {
        canvas.width = vid.videoWidth;
        canvas.height = vid.videoHeight;
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
        drawSelectionBox(ctx);
      }
    } else {
      const img = new Image();
      img.src = mediaSrc;
      img.onload = () => {
        canvas.width = img.naturalWidth || 640;
        canvas.height = img.naturalHeight || 360;
        ctx.drawImage(img, 0, 0);
        drawSelectionBox(ctx);
      };
    }
  };

  const drawSelectionBox = (ctx: CanvasRenderingContext2D) => {
    // Selection box overlay
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.w, box.h);

    ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
    ctx.fillRect(box.x, box.y, box.w, box.h);

    // Label tag
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('WATERMARK REGION', box.x + 4, Math.max(14, box.y - 6));
  };

  useEffect(() => {
    redrawCanvas();
  }, [mediaSrc, isVideo, box]);

  // Video metadata & time update listeners
  const handleVideoLoadedMetadata = () => {
    if (hiddenVideoRef.current) {
      setVideoDuration(hiddenVideoRef.current.duration || 0);
      hiddenVideoRef.current.currentTime = 0.1;
    }
  };

  const handleVideoSeeked = () => {
    redrawCanvas();
  };

  const handleSliderTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (hiddenVideoRef.current) {
      hiddenVideoRef.current.currentTime = time;
    }
  };

  const getCanvasCoords = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    setIsDrawing(true);
    setStartPoint(coords);
    setBox({ x: Math.max(2, Math.round(coords.x)), y: Math.max(2, Math.round(coords.y)), w: 10, h: 10 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const coords = getCanvasCoords(e.clientX, e.clientY);
    const x = Math.min(startPoint.x, coords.x);
    const y = Math.min(startPoint.y, coords.y);
    const w = Math.abs(coords.x - startPoint.x);
    const h = Math.abs(coords.y - startPoint.y);

    const safeX = Math.max(2, Math.min(Math.round(x), canvasRef.current.width - 6));
    const safeY = Math.max(2, Math.min(Math.round(y), canvasRef.current.height - 6));
    const safeW = Math.max(4, Math.min(Math.round(w), canvasRef.current.width - safeX - 2));
    const safeH = Math.max(4, Math.min(Math.round(h), canvasRef.current.height - safeY - 2));

    setBox({ x: safeX, y: safeY, w: safeW, h: safeH });
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const coords = getCanvasCoords(touch.clientX, touch.clientY);
      setIsDrawing(true);
      setStartPoint(coords);
      setBox({ x: Math.max(2, Math.round(coords.x)), y: Math.max(2, Math.round(coords.y)), w: 10, h: 10 });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || e.touches.length === 0 || !canvasRef.current) return;
    const touch = e.touches[0];
    const coords = getCanvasCoords(touch.clientX, touch.clientY);
    const x = Math.min(startPoint.x, coords.x);
    const y = Math.min(startPoint.y, coords.y);
    const w = Math.abs(coords.x - startPoint.x);
    const h = Math.abs(coords.y - startPoint.y);

    const safeX = Math.max(2, Math.min(Math.round(x), canvasRef.current.width - 6));
    const safeY = Math.max(2, Math.min(Math.round(y), canvasRef.current.height - 6));
    const safeW = Math.max(4, Math.min(Math.round(w), canvasRef.current.width - safeX - 2));
    const safeH = Math.max(4, Math.min(Math.round(h), canvasRef.current.height - safeY - 2));

    setBox({ x: safeX, y: safeY, w: safeW, h: safeH });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleProcessWatermark = async () => {
    if (!selectedFile) {
      setError('Please upload an image or video file first.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('x', box.x.toString());
    formData.append('y', box.y.toString());
    formData.append('w', box.w.toString());
    formData.append('h', box.h.toString());

    try {
      const data = await safeApiFetch<{ success?: boolean; isVideo?: boolean; base64Image?: string; outputUrl?: string; error?: string }>('/api/remove-watermark', {
        method: 'POST',
        body: formData,
      });

      if (data.success) {
        setResultIsVideo(!!data.isVideo);
        setResultUrl(data.base64Image || data.outputUrl);
      } else {
        setError(data.error || 'Failed to remove watermark.');
      }
    } catch (err: any) {
      setError(err.message || 'Error executing watermark removal.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden video element used to extract frames */}
      {isVideo && mediaSrc && (
        <video
          ref={hiddenVideoRef}
          src={mediaSrc}
          className="hidden"
          playsInline
          muted
          crossOrigin="anonymous"
          onLoadedMetadata={handleVideoLoadedMetadata}
          onSeeked={handleVideoSeeked}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Wand2 className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">Watermark Remover (Images & Videos)</h2>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Texture synthesis & optical inpainting to erase logos, channel stamps, and copyright watermarks from both images and full video streams.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={loadSampleImage}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 hover:bg-cyan-900/40 transition-colors flex items-center gap-1.5"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Image Demo 🪄</span>
          </button>
          <button
            type="button"
            onClick={loadSampleVideo}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40 hover:bg-indigo-900/40 transition-colors flex items-center gap-1.5"
          >
            <Film className="w-3.5 h-3.5" />
            <span>Video Demo 🎬</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-1 space-y-5">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/15 hover:border-cyan-500/50 bg-black/20 hover:bg-cyan-950/10 rounded-2xl p-6 text-center cursor-pointer transition-all group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.mp4,.mov,.webm,.mkv,.avi,.png,.jpg,.jpeg,.webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white">
              {selectedFile ? selectedFile.name : 'Upload Image or Video'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Supports PNG, JPG, MP4, MOV, WEBM</p>
            {selectedFile && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 mt-2 rounded-full border ${
                isVideo ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
              }`}>
                {isVideo ? '🎬 Video Mode' : '🖼️ Image Mode'}
              </span>
            )}
          </div>

          <div className="bg-[#121826]/80 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <Move className="w-4 h-4 text-cyan-400" />
              Watermark Coordinates
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">X Offset (px):</label>
                <input
                  type="number"
                  value={box.x}
                  onChange={(e) => setBox({ ...box, x: Math.max(2, parseInt(e.target.value) || 2) })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Y Offset (px):</label>
                <input
                  type="number"
                  value={box.y}
                  onChange={(e) => setBox({ ...box, y: Math.max(2, parseInt(e.target.value) || 2) })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Width (W):</label>
                <input
                  type="number"
                  value={box.w}
                  onChange={(e) => setBox({ ...box, w: Math.max(4, parseInt(e.target.value) || 10) })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Height (H):</label>
                <input
                  type="number"
                  value={box.h}
                  onChange={(e) => setBox({ ...box, h: Math.max(4, parseInt(e.target.value) || 10) })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white font-mono"
                />
              </div>
            </div>

            {/* Video Frame Scrubber */}
            {isVideo && videoDuration > 0 && (
              <div className="pt-2 border-t border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-300 font-medium">
                  <span className="flex items-center gap-1 text-indigo-400">
                    <Film className="w-3.5 h-3.5" />
                    Preview Frame Time:
                  </span>
                  <span className="font-mono text-cyan-300">{currentTime.toFixed(1)}s / {videoDuration.toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={videoDuration}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSliderTimeChange}
                  className="w-full accent-cyan-400 bg-white/10 rounded-lg h-2 cursor-pointer"
                />
                <p className="text-[11px] text-gray-400">Scrub slider to identify and select the watermark location across video frames.</p>
              </div>
            )}

            <button
              onClick={handleProcessWatermark}
              disabled={!selectedFile || isProcessing}
              className={`w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                !selectedFile || isProcessing
                  ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                  : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isVideo ? 'Inpainting Video Frames...' : 'Erasing Watermark...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isVideo ? 'Erase Watermark from Video' : 'Erase Watermark from Image'}</span>
                </>
              )}
            </button>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs leading-relaxed">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Canvas & Output Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#121826]/80 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[440px]">
            {mediaSrc ? (
              <div className="w-full flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-2 text-xs text-gray-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    Drag cursor/touch over canvas to highlight watermark:
                  </span>
                  <span className="font-mono text-cyan-400 font-bold">{box.w}x{box.h} px</span>
                </div>

                <div className="relative max-h-[380px] max-w-full overflow-auto bg-black/60 rounded-xl border border-white/10 flex items-center justify-center p-1">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleMouseUp}
                    className="max-h-[360px] max-w-full object-contain cursor-crosshair rounded shadow-lg"
                  />
                </div>

                {/* Output Result Card */}
                {resultUrl && (
                  <div className="w-full mt-5 bg-black/50 p-4 rounded-xl border border-emerald-500/30 text-center space-y-3 shadow-xl">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        {resultIsVideo ? 'Watermark-Free Video Output (.mp4):' : 'Watermark-Cleaned Image Output:'}
                      </span>
                      <a
                        href={resultUrl}
                        download={resultIsVideo ? 'watermark_removed.mp4' : 'watermark_removed.png'}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/25 transition-transform hover:scale-105"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {resultIsVideo ? 'Download Clean Video (.mp4)' : 'Download Clean Image (.png)'}
                      </a>
                    </div>

                    {resultIsVideo ? (
                      <div className="max-w-xl mx-auto rounded-lg overflow-hidden border border-white/10 bg-black">
                        <video
                          src={resultUrl}
                          controls
                          autoPlay
                          loop
                          className="w-full max-h-[300px] object-contain"
                        />
                      </div>
                    ) : (
                      <img
                        src={resultUrl}
                        alt="Watermark Cleaned"
                        className="max-h-[280px] mx-auto rounded-lg border border-white/10 shadow-md"
                      />
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-8 text-gray-500 space-y-3">
                <Wand2 className="w-12 h-12 mx-auto stroke-1 text-gray-600" />
                <p className="text-sm font-semibold text-gray-300">No Image or Video Loaded</p>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Upload an image or video with a watermark, logo, or stamp, or click one of the demo buttons above to test inpainting.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
