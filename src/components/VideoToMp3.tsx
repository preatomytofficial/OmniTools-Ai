import React, { useState, useRef } from 'react';
import { Music, Upload, Download, Sparkles, Volume2, FileVideo, Play, Pause } from 'lucide-react';
import { safeApiFetch } from '../lib/api';

export const VideoToMp3: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [resultMp3Url, setResultMp3Url] = useState<string | null>(null);
  const [bitrate, setBitrate] = useState<string>('320k');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setError(null);
      setResultMp3Url(null);
      setVideoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const loadSampleVideo = async () => {
    try {
      const res = await fetch('/samples/sample_video.mp4');
      const blob = await res.blob();
      const file = new File([blob], 'sample_video.mp4', { type: 'video/mp4' });
      setSelectedFile(file);
      setVideoPreviewUrl(URL.createObjectURL(blob));
      setResultMp3Url(null);
      setError(null);
    } catch (err: any) {
      setError('Unable to load sample video. Please upload any local MP4 or MKV file.');
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      setError('Please upload a video file first.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('bitrate', bitrate);

    try {
      const data = await safeApiFetch<{ success?: boolean; outputUrl?: string; base64Audio?: string; error?: string }>('/api/video-mp3', {
        method: 'POST',
        body: formData,
      });

      if (data.success && (data.outputUrl || data.base64Audio)) {
        setResultMp3Url(data.outputUrl || data.base64Audio);
      } else {
        setError(data.error || 'Failed to extract MP3 audio.');
      }
    } catch (err: any) {
      setError(err.message || 'Error executing video to MP3 extraction.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Music className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">Video to MP3 Converter (FFmpeg)</h2>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Extract studio-grade 320kbps MP3 audio tracks directly from MP4, MKV, WEBM, MOV, and AVI files.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSampleVideo}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-medium px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 hover:bg-emerald-900/40 transition-colors self-start sm:self-auto"
        >
          Generate Video Demo 🎵
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-1 space-y-5">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/15 hover:border-emerald-500/50 bg-black/20 hover:bg-emerald-950/10 rounded-2xl p-6 text-center cursor-pointer transition-all group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <FileVideo className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white truncate px-2">
              {selectedFile ? selectedFile.name : 'Upload Video File'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              MP4, MKV, WEBM, AVI up to 100MB
            </p>
          </div>

          <div className="bg-[#121826]/80 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              Audio Settings
            </h3>

            <div>
              <label className="text-xs text-gray-400 block mb-2 font-medium">
                Target Bitrate:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '320 kbps (HQ)', val: '320k' },
                  { label: '256 kbps', val: '256k' },
                  { label: '192 kbps', val: '192k' },
                  { label: '128 kbps', val: '128k' },
                ].map((b) => (
                  <button
                    key={b.val}
                    type="button"
                    onClick={() => setBitrate(b.val)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      bitrate === b.val
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/40'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleConvert}
              disabled={!selectedFile || isProcessing}
              className={`w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                !selectedFile || isProcessing
                  ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Extracting MP3 Audio...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Rip MP3 Track ({bitrate})</span>
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

        {/* Video Preview & Audio Output */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#121826]/80 border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center min-h-[420px]">
            {videoPreviewUrl ? (
              <div className="w-full space-y-4">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="font-semibold text-gray-300">Input Video Preview:</span>
                  <span className="font-mono">
                    {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : ''}
                  </span>
                </div>

                <div className="w-full max-w-lg mx-auto bg-black/60 rounded-xl overflow-hidden border border-white/10 aspect-video flex items-center justify-center">
                  <video
                    src={videoPreviewUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Result Audio Card */}
                {resultMp3Url && (
                  <div className="w-full bg-gradient-to-r from-emerald-950/40 to-teal-950/30 p-5 rounded-xl border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <Volume2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">Extracted MP3 Audio File</h4>
                          <span className="text-[10px] text-emerald-400 font-mono">Sample Rate: 44.1kHz • {bitrate}</span>
                        </div>
                      </div>

                      <a
                        href={resultMp3Url}
                        download="extracted_audio.mp3"
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download MP3
                      </a>
                    </div>

                    <audio
                      src={resultMp3Url}
                      controls
                      className="w-full h-10 accent-emerald-500"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-8 text-gray-500">
                <Music className="w-12 h-12 mx-auto mb-3 stroke-1 text-gray-600" />
                <p className="text-sm font-medium text-gray-400">No video selected</p>
                <p className="text-xs mt-1">Upload any video to extract high-fidelity MP3 audio instantly.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
