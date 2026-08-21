"""
Watermark Remover Module (OpenCV Inpainting & Optical Synthesis)
OmniTools AI - Offline Tool Suite
Author: PreatomYT (c) 2026
"""

import sys
import os
import argparse
import subprocess
from typing import Optional, Tuple

def remove_watermark(
    input_path: str,
    output_path: str,
    mask_path: Optional[str] = None,
    bbox: Optional[Tuple[int, int, int, int]] = None,
    inpaint_radius: int = 5
) -> str:
    """
    Removes watermarks from an image using local inpainting synthesis algorithms.
    Supports either an explicit binary mask or a bounding box (x, y, w, h).
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input image not found: {input_path}")

    # Try OpenCV if available
    try:
        import cv2
        import numpy as np
        
        img = cv2.imread(input_path)
        h, w = img.shape[:2]
        
        if mask_path and os.path.exists(mask_path):
            mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
            mask = cv2.resize(mask, (w, h))
        elif bbox:
            bx, by, bw, bh = bbox
            mask = np.zeros((h, w), dtype=np.uint8)
            cv2.rectangle(mask, (bx, by), (bx + bw, by + bh), 255, -1)
        else:
            # Fallback: estimate watermark in bottom-right corner
            mask = np.zeros((h, w), dtype=np.uint8)
            cv2.rectangle(mask, (int(w * 0.75), int(h * 0.85)), (w - 10, h - 10), 255, -1)
            
        # Inpainting via Navier-Stokes or Telea
        inpainted = cv2.inpaint(img, mask, inpaintRadius=inpaint_radius, flags=cv2.INPAINT_TELEA)
        cv2.imwrite(output_path, inpainted)
        return output_path
    except ImportError:
        # Fallback using FFmpeg delogo or local bilateral blurring
        if bbox:
            bx, by, bw, bh = bbox
        else:
            bx, by, bw, bh = 50, 50, 100, 40
            
        cmd = [
            "ffmpeg", "-y", "-i", input_path,
            "-vf", f"delogo=x={bx}:y={by}:w={bw}:h={bh}:show=0",
            output_path
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return output_path

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="OmniTools AI - Watermark Remover")
    parser.add_argument("--input", "-i", required=True, help="Input image file")
    parser.add_argument("--output", "-o", required=True, help="Output image file")
    parser.add_argument("--mask", "-m", default=None, help="Path to binary mask image")
    parser.add_argument("--bbox", "-b", nargs=4, type=int, default=None, help="Bounding box x y w h")
    args = parser.parse_args()
    
    bbox = tuple(args.bbox) if args.bbox else None
    out = remove_watermark(args.input, args.output, mask_path=args.mask, bbox=bbox)
    print(f"[SUCCESS] Cleaned image saved to: {out}")
