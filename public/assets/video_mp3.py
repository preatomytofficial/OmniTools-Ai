"""
Video to MP3 Converter Module (FFmpeg / MoviePy Audio Rip)
OmniTools AI - Offline Tool Suite
Author: PreatomYT (c) 2026
"""

import sys
import os
import argparse
import subprocess

def convert_video_to_mp3(
    video_path: str,
    output_mp3_path: str,
    bitrate: str = "320k",
    sample_rate: int = 44100
) -> str:
    """
    Extracts pristine audio from a video container (MP4, MKV, AVI, MOV, WEBM) to MP3.
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Input video not found: {video_path}")

    # Ensure output ends with .mp3
    if not output_mp3_path.lower().endswith(".mp3"):
        output_mp3_path += ".mp3"

    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vn", # Disable video recording
        "-acodec", "libmp3lame",
        "-ab", bitrate,
        "-ar", str(sample_rate),
        output_mp3_path
    ]

    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg audio extraction failed: {result.stderr.decode('utf-8', errors='ignore')}")

    return output_mp3_path

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="OmniTools AI - Video to MP3")
    parser.add_argument("--input", "-i", required=True, help="Input video file")
    parser.add_argument("--output", "-o", required=True, help="Output MP3 file")
    parser.add_argument("--bitrate", "-b", default="320k", help="Audio bitrate (e.g. 128k, 192k, 256k, 320k)")
    args = parser.parse_args()

    out = convert_video_to_mp3(args.input, args.output, bitrate=args.bitrate)
    print(f"[SUCCESS] Audio extracted to: {out}")
