import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Film,
  Upload,
  Download,
  Sparkles,
  Scissors,
  Clock,
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
  FileWarning,
  RotateCcw,
  Loader2,
  Info,
  Timer,
  Sliders,
  Maximize2
} from 'lucide-react';
import { safeApiFetch } from '../lib/api';

// Recognized video MIME types and file extensions
const ALLOWED_VIDEO_EXTENSIONS = /\.(mp4|mov|webm|mkv|avi|flv|wmv|m4v|3gp|ogv|ts|mts|m2ts)$/i;

function isValidVideoFile(file: File): boolean {
  if (file.type && file.type.startsWith('video/')) {
    return true;
  }
  return ALLOWED_VIDEO_EXTENSIONS.test(file.name);
}

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatSeconds(secs: number): string {
  if (isNaN(secs) || !isFinite(secs) || secs < 0) return '0:00.0';
  const mins = Math.floor(secs / 60);
  const remainingSecs = (secs % 60).toFixed(1);
  return `${mins}:${remainingSecs.padStart(4, '0')}`;
}

export const VideoTrimmer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [resultTrimUrl, setResultTrimUrl] = useState<string | null>(null);

  // Metadata & duration state
  const [isMetadataLoaded, setIsMetadataLoaded] = useState<boolean>(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(false);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);
  const [totalDuration, setTotalDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Trim range inputs
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(5);

  // Real-time input validation feedback
  const [endInputWarning, setEndInputWarning] = useState<string | null>(null);
  const [startInputWarning, setStartInputWarning] = useState<string | null>(null);

  // Status & processing
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Clean up object URLs on unmount or file switch
  useEffect(() => {
    return () => {
      if (videoPreviewUrl && videoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  /**
   * Helper to inspect and fetch video duration via auxiliary probe video element
   */
  const fetchSourceVideoMetadata = useCallback((fileUrl: string) => {
    setIsLoadingMetadata(true);
    setIsMetadataLoaded(false);

    const probeVideo = document.createElement('video');
    probeVideo.preload = 'metadata';
    probeVideo.crossOrigin = 'anonymous';

    const onMeta = () => {
      const dur = probeVideo.duration;
      if (dur && !isNaN(dur) && isFinite(dur) && dur > 0) {
        const roundedDuration = Math.round(dur * 100) / 100;
        setTotalDuration(roundedDuration);
        setVideoDimensions({
          width: probeVideo.videoWidth || 0,
          height: probeVideo.videoHeight || 0,
        });

        // Set initial trim window: start at 0, end at min(duration, 5s)
        setStartTime(0);
        const initialEnd = Math.min(roundedDuration, roundedDuration > 5 ? 5 : roundedDuration);
        setEndTime(initialEnd);
        setEndInputWarning(null);
        setStartInputWarning(null);

        setIsMetadataLoaded(true);
        setIsLoadingMetadata(false);
      }
      cleanup();
    };

    const onError = () => {
      cleanup();
    };

    const cleanup = () => {
      probeVideo.removeEventListener('loadedmetadata', onMeta);
      probeVideo.removeEventListener('error', onError);
      probeVideo.src = '';
      probeVideo.remove();
    };

    probeVideo.addEventListener('loadedmetadata', onMeta);
    probeVideo.addEventListener('error', onError);
    probeVideo.src = fileUrl;
  }, []);

  /**
   * Process and validate a selected or dropped file
   */
  const processAndValidateFile = (file: File) => {
    setError(null);
    setResultTrimUrl(null);
    setEndInputWarning(null);
    setStartInputWarning(null);

    // Strict validation of Video MIME / extension
    if (!isValidVideoFile(file)) {
      setSelectedFile(null);
      setVideoPreviewUrl(null);
      setIsMetadataLoaded(false);
      setIsLoadingMetadata(false);
      setTotalDuration(0);
      setVideoDimensions(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      const reportedType = file.type || 'unknown/non-video type';
      setError(
        `Invalid File: "${file.name}" (${reportedType}) is not a supported video file. Please upload an MP4, MOV, WEBM, MKV, or AVI file.`
      );
      return;
    }

    // Valid video file
    setSelectedFile(file);
    setCurrentTime(0);
    setIsPlaying(false);

    const objectUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(objectUrl);

    // Fetch video metadata & duration
    fetchSourceVideoMetadata(objectUrl);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processAndValidateFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAndValidateFile(e.dataTransfer.files[0]);
    }
  };

  /**
   * Video metadata loaded event callback on main video player
   */
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const vid = videoRef.current;
      const duration = vid.duration;

      if (duration && !isNaN(duration) && isFinite(duration) && duration > 0) {
        const roundedDuration = Math.round(duration * 100) / 100;
        setTotalDuration(roundedDuration);
        setVideoDimensions({
          width: vid.videoWidth || 0,
          height: vid.videoHeight || 0,
        });

        // Ensure endTime is clamped within total duration
        setEndTime((prevEnd) => {
          if (prevEnd <= 0 || prevEnd > roundedDuration) {
            return Math.min(roundedDuration, roundedDuration > 5 ? 5 : roundedDuration);
          }
          return prevEnd;
        });

        setIsMetadataLoaded(true);
        setIsLoadingMetadata(false);
        setError(null);
      } else {
        setIsLoadingMetadata(false);
        setError('Unable to parse video duration from metadata. The video file format may be unsupported.');
      }
    }
  };

  const handleVideoError = () => {
    setIsLoadingMetadata(false);
    setIsMetadataLoaded(false);
    setError('Failed to decode video file. Please ensure the file is not corrupted and uses standard H.264/AAC codecs.');
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const jumpToTime = (time: number) => {
    if (videoRef.current) {
      const targetTime = Math.max(0, Math.min(time, totalDuration || 100));
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  /**
   * Client-side validation for 'End (seconds)' input
   */
  const handleEndTimeChange = (rawVal: string) => {
    setError(null);

    if (rawVal === '') {
      setEndTime(0);
      setEndInputWarning('End time cannot be empty.');
      return;
    }

    const val = parseFloat(rawVal);
    if (isNaN(val)) {
      setEndInputWarning('Please enter a valid numeric timestamp.');
      return;
    }

    if (isMetadataLoaded && totalDuration > 0) {
      // 1. Strict Validation: End cannot exceed actual total video duration
      if (val > totalDuration) {
        const clampedVal = totalDuration;
        setEndTime(clampedVal);
        setEndInputWarning(
          `End time capped: ${val.toFixed(2)}s exceeds total video duration (${totalDuration.toFixed(2)}s).`
        );
        jumpToTime(clampedVal);
        return;
      }

      // 2. Strict Validation: End must be greater than Start time
      if (val <= startTime) {
        setEndTime(val);
        setEndInputWarning(`End time (${val.toFixed(1)}s) must be greater than start time (${startTime.toFixed(1)}s).`);
        jumpToTime(val);
        return;
      }

      // 3. Valid input within bounds
      setEndTime(val);
      setEndInputWarning(null);
      jumpToTime(val);
    } else {
      setEndTime(val);
      jumpToTime(val);
    }
  };

  /**
   * Blur cleanup to automatically enforce strict bounds
   */
  const handleEndTimeBlur = () => {
    if (!isMetadataLoaded || totalDuration <= 0) return;

    if (endTime > totalDuration) {
      setEndTime(totalDuration);
      setEndInputWarning(null);
      jumpToTime(totalDuration);
    } else if (endTime <= startTime) {
      const safeEnd = Math.min(totalDuration, Number((startTime + 0.1).toFixed(1)));
      setEndTime(safeEnd);
      setEndInputWarning(null);
      jumpToTime(safeEnd);
    } else {
      setEndInputWarning(null);
    }
  };

  /**
   * Client-side validation for 'Start (seconds)' input
   */
  const handleStartTimeChange = (rawVal: string) => {
    setError(null);

    if (rawVal === '') {
      setStartTime(0);
      return;
    }

    const val = parseFloat(rawVal);
    if (isNaN(val)) {
      setStartInputWarning('Please enter a valid numeric timestamp.');
      return;
    }

    const safeVal = Math.max(0, val);

    if (isMetadataLoaded && totalDuration > 0) {
      if (safeVal >= totalDuration) {
        const clampedStart = Math.max(0, Number((totalDuration - 0.1).toFixed(1)));
        setStartTime(clampedStart);
        setStartInputWarning(`Start time cannot exceed video duration (${totalDuration.toFixed(2)}s).`);
        jumpToTime(clampedStart);
        return;
      }

      if (safeVal >= endTime) {
        setStartTime(safeVal);
        setStartInputWarning(`Start time (${safeVal.toFixed(1)}s) must be less than end time (${endTime.toFixed(1)}s).`);
        jumpToTime(safeVal);
        return;
      }

      setStartTime(safeVal);
      setStartInputWarning(null);
      jumpToTime(safeVal);
    } else {
      setStartTime(safeVal);
      jumpToTime(safeVal);
    }
  };

  const handleStartTimeBlur = () => {
    if (!isMetadataLoaded || totalDuration <= 0) return;

    if (startTime >= endTime) {
      const safeStart = Math.max(0, Number((endTime - 0.1).toFixed(1)));
      setStartTime(safeStart);
      setStartInputWarning(null);
      jumpToTime(safeStart);
    } else {
      setStartInputWarning(null);
    }
  };

  /**
   * Load bundled sample video
   */
  const loadSampleVideo = async () => {
    try {
      setError(null);
      setResultTrimUrl(null);
      setIsLoadingMetadata(true);
      setIsMetadataLoaded(false);

      const res = await fetch('/samples/sample_video.mp4');
      if (!res.ok) throw new Error('Sample file missing');
      const blob = await res.blob();
      const file = new File([blob], 'sample_video.mp4', { type: 'video/mp4' });
      processAndValidateFile(file);
    } catch {
      setIsLoadingMetadata(false);
      setError('Unable to load sample video. Please upload a local video file.');
    }
  };

  /**
   * Trigger Trim with full metadata and duration guard
   */
  const handleTrim = async () => {
    // 1. Guard against missing file
    if (!selectedFile) {
      setError('Please select a video file first.');
      return;
    }

    // 2. Guard against missing/incomplete metadata
    if (!isMetadataLoaded || totalDuration <= 0) {
      setError('Video metadata is still loading. Please wait for the video to fully load before trimming.');
      return;
    }

    // 3. Client-side bounds validation: Ensure end time does NOT exceed actual video duration
    if (endTime > totalDuration + 0.01) {
      setError(`Validation Error: End time (${endTime}s) cannot exceed the actual video duration (${totalDuration.toFixed(2)}s).`);
      return;
    }

    if (startTime < 0 || startTime >= totalDuration) {
      setError(`Validation Error: Start time must be between 0.0s and ${totalDuration.toFixed(2)}s.`);
      return;
    }

    if (endTime <= startTime) {
      setError('Validation Error: End time must be greater than start time.');
      return;
    }

    const trimDuration = endTime - startTime;
    if (trimDuration < 0.1) {
      setError('Validation Error: Trim segment duration must be at least 0.1 seconds.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('start', startTime.toString());
    formData.append('end', endTime.toString());

    try {
      const data = await safeApiFetch<{ success?: boolean; outputUrl?: string; error?: string }>('/api/trim-video', {
        method: 'POST',
        body: formData,
      });

      if (data.success && data.outputUrl) {
        setResultTrimUrl(data.outputUrl);
      } else {
        setError(data.error || 'Failed to trim video.');
      }
    } catch (err: any) {
      setError(err.message || 'Error executing video trim routine.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick preset handlers with strict totalDuration constraints
  const applyPreset = (type: 'first3' | 'first5' | 'middle' | 'all') => {
    if (!isMetadataLoaded || totalDuration <= 0) return;
    setEndInputWarning(null);
    setStartInputWarning(null);

    if (type === 'first3') {
      setStartTime(0);
      setEndTime(Math.min(3, totalDuration));
      jumpToTime(0);
    } else if (type === 'first5') {
      setStartTime(0);
      setEndTime(Math.min(5, totalDuration));
      jumpToTime(0);
    } else if (type === 'middle') {
      const quarter = totalDuration / 4;
      setStartTime(Math.round(quarter * 10) / 10);
      setEndTime(Math.round((totalDuration - quarter) * 10) / 10);
      jumpToTime(quarter);
    } else if (type === 'all') {
      setStartTime(0);
      setEndTime(totalDuration);
      jumpToTime(0);
    }
  };

  const currentDuration = Math.max(0, endTime - startTime);
  const durationPercentage = totalDuration > 0 ? Math.min(100, Math.round((currentDuration / totalDuration) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Scissors className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">Video Trim & Timeline Cutter</h2>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Extract precise video segments with frame accuracy, automated duration detection, and zero quality loss.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSampleVideo}
          className="text-xs text-purple-400 hover:text-purple-300 font-medium px-3 py-1.5 rounded-lg bg-purple-950/40 border border-purple-800/40 hover:bg-purple-900/40 transition-colors self-start sm:self-auto flex items-center gap-1.5"
        >
          <Film className="w-3.5 h-3.5" />
          <span>Load Video Demo 🎬</span>
        </button>
      </div>

      {/* Immediate Validation Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs sm:text-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block text-rose-200">Validation Alert</span>
            <p className="leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-1 space-y-5">
          {/* Upload & Drag Drop Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all group ${
              isDraggingOver
                ? 'border-purple-400 bg-purple-950/30 scale-[1.01]'
                : selectedFile
                ? 'border-purple-500/40 bg-purple-950/10 hover:border-purple-400/70'
                : 'border-white/15 hover:border-purple-500/50 bg-black/20 hover:bg-purple-950/10'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,video/mp4,video/quicktime,video/webm,video/x-matroska,video/x-msvideo,.mp4,.mov,.webm,.mkv,.avi,.m4v"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Film className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white truncate px-2">
              {selectedFile ? selectedFile.name : 'Upload Video to Trim'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Drag & drop or browse (MP4, MOV, WEBM, MKV, AVI)</p>

            {selectedFile && (
              <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {formatBytes(selectedFile.size)}
                </span>
                {isMetadataLoaded ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    Duration: {totalDuration.toFixed(2)}s ({formatSeconds(totalDuration)})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Fetching Duration...
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Source Video Duration Display Banner */}
          {selectedFile && (
            <div className="bg-gradient-to-r from-purple-950/30 to-indigo-950/20 border border-purple-500/20 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-300 flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-purple-400" />
                  Source Video Duration
                </span>
                {isMetadataLoaded ? (
                  <span className="font-mono font-bold text-purple-300 text-sm">
                    {totalDuration.toFixed(2)}s{' '}
                    <span className="text-gray-400 text-xs font-normal">({formatSeconds(totalDuration)})</span>
                  </span>
                ) : (
                  <span className="text-amber-400 font-mono text-xs flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Analyzing...
                  </span>
                )}
              </div>

              {isMetadataLoaded && videoDimensions && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px]">
                  <div className="text-gray-400">
                    Resolution:{' '}
                    <span className="font-mono text-gray-200">
                      {videoDimensions.width} × {videoDimensions.height}
                    </span>
                  </div>
                  <div className="text-gray-400 text-right">
                    Allowed Range:{' '}
                    <span className="font-mono text-purple-300">0.0s – {totalDuration.toFixed(2)}s</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timeline Marks & Controls */}
          <div className="bg-[#121826]/80 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                Trim Range Settings
              </h3>
              {isMetadataLoaded && (
                <span className="text-[11px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  Max End: {totalDuration.toFixed(2)}s
                </span>
              )}
            </div>

            {/* Start and End Inputs with Client-Side Validation */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Start (seconds) Input */}
              <div>
                <label className="text-gray-300 block mb-1 font-medium flex items-center justify-between">
                  <span>Start (seconds):</span>
                  <span className="text-[10px] text-gray-500 font-mono">min: 0.0s</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={isMetadataLoaded ? Math.max(0, Number((totalDuration - 0.1).toFixed(1))) : 100}
                  disabled={!isMetadataLoaded || isProcessing}
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  onBlur={handleStartTimeBlur}
                  className={`w-full bg-black/40 border disabled:opacity-50 disabled:cursor-not-allowed rounded-lg p-2.5 text-white font-mono transition-colors ${
                    startInputWarning ? 'border-amber-500/60 focus:border-amber-400' : 'border-white/10 focus:border-purple-500'
                  }`}
                  placeholder="0.0"
                />
                {startInputWarning && (
                  <p className="text-[10px] text-amber-400 mt-1 leading-tight">{startInputWarning}</p>
                )}
              </div>

              {/* End (seconds) Input with strict max validation */}
              <div>
                <label className="text-gray-300 block mb-1 font-medium flex items-center justify-between">
                  <span>End (seconds):</span>
                  {isMetadataLoaded && (
                    <span className="text-[10px] text-purple-400 font-mono font-bold">
                      max: {totalDuration.toFixed(1)}s
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={Math.max(0.1, Number((startTime + 0.1).toFixed(1)))}
                  max={isMetadataLoaded && totalDuration > 0 ? totalDuration : undefined}
                  disabled={!isMetadataLoaded || isProcessing}
                  value={endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  onBlur={handleEndTimeBlur}
                  className={`w-full bg-black/40 border disabled:opacity-50 disabled:cursor-not-allowed rounded-lg p-2.5 text-white font-mono transition-colors ${
                    endInputWarning ? 'border-amber-500/60 focus:border-amber-400' : 'border-white/10 focus:border-purple-500'
                  }`}
                  placeholder={totalDuration > 0 ? totalDuration.toString() : '5.0'}
                />
                {endInputWarning && (
                  <p className="text-[10px] text-amber-400 mt-1 leading-tight">{endInputWarning}</p>
                )}
              </div>
            </div>

            {/* Quick Presets */}
            {isMetadataLoaded && totalDuration > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-white/5">
                <span className="text-[11px] font-medium text-gray-400">Quick Presets:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset('first3')}
                    className="py-1 px-2 text-[10px] font-semibold rounded bg-white/5 hover:bg-purple-500/20 text-gray-300 hover:text-purple-300 border border-white/5 transition-colors"
                  >
                    First 3s
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('first5')}
                    className="py-1 px-2 text-[10px] font-semibold rounded bg-white/5 hover:bg-purple-500/20 text-gray-300 hover:text-purple-300 border border-white/5 transition-colors"
                  >
                    First 5s
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('middle')}
                    className="py-1 px-2 text-[10px] font-semibold rounded bg-white/5 hover:bg-purple-500/20 text-gray-300 hover:text-purple-300 border border-white/5 transition-colors"
                  >
                    Middle 50%
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('all')}
                    className="py-1 px-2 text-[10px] font-semibold rounded bg-white/5 hover:bg-purple-500/20 text-gray-300 hover:text-purple-300 border border-white/5 transition-colors"
                  >
                    Full Clip
                  </button>
                </div>
              </div>
            )}

            {/* Summary details */}
            <div className="p-3.5 bg-black/40 rounded-xl border border-white/5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-gray-400">
                <span>Output Segment Length:</span>
                <span className="text-purple-300 font-mono font-bold">
                  {currentDuration.toFixed(2)}s ({formatSeconds(currentDuration)})
                </span>
              </div>

              {isMetadataLoaded && totalDuration > 0 && (
                <div className="flex items-center justify-between text-gray-400 text-[11px]">
                  <span>Segment Coverage:</span>
                  <span className="font-mono text-gray-300">
                    {durationPercentage}% of {totalDuration.toFixed(2)}s total
                  </span>
                </div>
              )}
            </div>

            {/* Action Button */}
            <button
              onClick={handleTrim}
              disabled={
                !selectedFile ||
                !isMetadataLoaded ||
                isProcessing ||
                endTime > totalDuration + 0.01 ||
                endTime <= startTime
              }
              className={`w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                !selectedFile ||
                !isMetadataLoaded ||
                isProcessing ||
                endTime > totalDuration + 0.01 ||
                endTime <= startTime
                  ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25 active:scale-[0.99]'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Cutting Video Segment...</span>
                </>
              ) : isLoadingMetadata ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span>Fetching Video Metadata...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Trim Video Segment</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Video Player & Output Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#121826]/80 border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center min-h-[440px]">
            {videoPreviewUrl ? (
              <div className="w-full space-y-4">
                {/* Status Bar */}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-300">Live Video Preview:</span>
                    {isLoadingMetadata && (
                      <span className="text-amber-400 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Fetching duration & metadata...
                      </span>
                    )}
                  </div>
                  <div className="font-mono flex items-center gap-2">
                    <span>Pos: {currentTime.toFixed(1)}s</span>
                    <span className="text-gray-600">/</span>
                    <span className="text-purple-300 font-semibold">
                      Total: {totalDuration > 0 ? `${totalDuration.toFixed(2)}s` : '--'}
                    </span>
                  </div>
                </div>

                {/* Video Player */}
                <div className="w-full max-w-xl mx-auto bg-black/80 rounded-xl overflow-hidden border border-white/10 aspect-video flex items-center justify-center relative shadow-2xl">
                  <video
                    ref={videoRef}
                    src={videoPreviewUrl}
                    controls
                    playsInline
                    crossOrigin="anonymous"
                    onLoadedMetadata={handleLoadedMetadata}
                    onError={handleVideoError}
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Timeline Range Indicator & Interactive Scrubbing Track */}
                {isMetadataLoaded && totalDuration > 0 && (
                  <div className="space-y-2 bg-black/30 p-3.5 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                      <span>0.00s</span>
                      <div className="text-center">
                        <span className="text-purple-300 font-bold">
                          Selected: {startTime.toFixed(2)}s → {endTime.toFixed(2)}s
                        </span>
                        <span className="text-gray-500 text-[10px] ml-1.5">
                          ({currentDuration.toFixed(2)}s)
                        </span>
                      </div>
                      <span className="text-purple-300 font-bold">{totalDuration.toFixed(2)}s</span>
                    </div>

                    {/* Timeline visualization range bar */}
                    <div
                      className="relative w-full h-4 bg-white/10 rounded-full overflow-hidden cursor-pointer"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const pct = Math.max(0, Math.min(1, clickX / rect.width));
                        const clickTime = pct * totalDuration;
                        jumpToTime(clickTime);
                      }}
                    >
                      {/* Active trimmed segment region */}
                      <div
                        className="absolute h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full opacity-80"
                        style={{
                          left: `${Math.max(0, Math.min(100, (startTime / totalDuration) * 100))}%`,
                          width: `${Math.max(1, Math.min(100, (currentDuration / totalDuration) * 100))}%`,
                        }}
                      />

                      {/* Playhead marker */}
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-white shadow-md z-10"
                        style={{
                          left: `${Math.max(0, Math.min(100, (currentTime / totalDuration) * 100))}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-500 pt-0.5">
                      <span>Start: {formatSeconds(startTime)}</span>
                      <span>Click bar to jump playhead</span>
                      <span>End: {formatSeconds(endTime)} (Max: {formatSeconds(totalDuration)})</span>
                    </div>
                  </div>
                )}

                {/* Trimmed Result Download Card */}
                {resultTrimUrl && (
                  <div className="w-full bg-gradient-to-r from-purple-950/40 to-indigo-950/30 p-5 rounded-xl border border-purple-500/30 space-y-3 shadow-xl animate-in fade-in duration-200">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Trimmed Video Output (.mp4)
                        </h4>
                        <span className="text-[10px] text-purple-400 font-mono">
                          Duration: {currentDuration.toFixed(2)}s ({startTime.toFixed(1)}s - {endTime.toFixed(1)}s)
                        </span>
                      </div>

                      <a
                        href={resultTrimUrl}
                        download="trimmed_video.mp4"
                        className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all hover:scale-105"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Video MP4
                      </a>
                    </div>

                    <div className="max-w-lg mx-auto rounded-lg overflow-hidden border border-white/10 bg-black">
                      <video
                        src={resultTrimUrl}
                        controls
                        className="w-full max-h-[240px] object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-8 text-gray-500 space-y-3">
                <Film className="w-12 h-12 mx-auto stroke-1 text-gray-600" />
                <p className="text-sm font-semibold text-gray-300">No Video Loaded</p>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Upload an MP4, MOV, WEBM, MKV, or AVI file, or click &ldquo;Load Video Demo&rdquo; above to preview, inspect duration, and trim precise segments.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
