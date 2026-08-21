"""
Video Trim Module (FFmpeg / Frame-Accurate Timeline Cutter)
OmniTools AI - Offline Tool Suite
Author: PreatomYT (c) 2026
"""

import sys
import os
import argparse
import subprocess

def trim_video(
    video_path: str,
    output_path: str,
    start_time: float,
    end_time: float,
    fast_cut: bool = False
) -> str:
    """
    Trims a video between start_time and end_time (in seconds).
    If fast_cut is True, stream copy is used for lightning-fast lossless cut.
    Otherwise re-encodes for frame-level accuracy.
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Input video not found: {video_path}")

    duration = max(0.1, end_time - start_time)

    if fast_cut:
        cmd = [
            "ffmpeg", "-y",
            "-ss", str(start_time),
            "-i", video_path,
            "-t", str(duration),
            "-c", "copy",
            output_path
        ]
    else:
        cmd = [
            "ffmpeg", "-y",
            "-ss", str(start_time),
            "-i", video_path,
            "-t", str(duration),
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "22",
            "-c:a", "aac",
            "-b:a", "192k",
            output_path
        ]

    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode != 0:
        # Fallback to copy if encoding failed or vice versa
        fallback_cmd = [
            "ffmpeg", "-y",
            "-ss", str(start_time),
            "-i", video_path,
            "-t", str(duration),
            output_path
        ]
        fallback_res = subprocess.run(fallback_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if fallback_res.returncode != 0:
            raise RuntimeError(f"FFmpeg trim failed: {result.stderr.decode('utf-8', errors='ignore')}")

    return output_path

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="OmniTools AI - Video Trimmer")
    parser.add_argument("--input", "-i", required=True, help="Input video file")
    parser.add_argument("--output", "-o", required=True, help="Output trimmed video file")
    parser.add_argument("--start", "-s", type=float, required=True, help="Start time in seconds")
    parser.add_argument("--end", "-e", type=float, required=True, help="End time in seconds")
    parser.add_argument("--fast", action="store_true", help="Fast stream-copy mode")
    args = parser.parse_args()

    out = trim_video(args.input, args.output, start_time=args.start, end_time=args.end, fast_cut=args.fast)
    print(f"[SUCCESS] Video trimmed to: {out}")
