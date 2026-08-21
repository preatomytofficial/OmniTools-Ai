"""
Object Remover Module (Local Patch & Inpainting Eraser)
OmniTools AI - Offline Tool Suite
Author: PreatomYT (c) 2026
"""

import sys
import os
import argparse
import subprocess
from typing import Optional, Tuple

def remove_object(
    input_path: str,
    output_path: str,
    mask_path: Optional[str] = None,
    bbox: Optional[Tuple[int, int, int, int]] = None
) -> str:
    """
    Erases selected objects or photobombers and synthesizes the background.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input image not found: {input_path}")

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
            # Center object fallback
            mask = np.zeros((h, w), dtype=np.uint8)
            cv2.circle(mask, (w // 2, h // 2), min(w, h) // 6, 255, -1)
            
        # Dilate mask slightly for smooth edge blending
        kernel = np.ones((5, 5), np.uint8)
        dilated_mask = cv2.dilate(mask, kernel, iterations=2)
        
        # Dual-pass inpainting (NS + Telea blending)
        inpainted_ns = cv2.inpaint(img, dilated_mask, inpaintRadius=7, flags=cv2.INPAINT_NS)
        inpainted = cv2.inpaint(inpainted_ns, dilated_mask, inpaintRadius=3, flags=cv2.INPAINT_TELEA)
        
        cv2.imwrite(output_path, inpainted)
        return output_path
    except ImportError:
        # Fallback using FFmpeg inpainting filter
        if bbox:
            bx, by, bw, bh = bbox
        else:
            bx, by, bw, bh = 100, 100, 150, 150
            
        cmd = [
            "ffmpeg", "-y", "-i", input_path,
            "-vf", f"delogo=x={bx}:y={by}:w={bw}:h={bh}:show=0",
            output_path
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return output_path

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="OmniTools AI - Object Remover")
    parser.add_argument("--input", "-i", required=True, help="Input image file")
    parser.add_argument("--output", "-o", required=True, help="Output image file")
    parser.add_argument("--mask", "-m", default=None, help="Binary mask image path")
    parser.add_argument("--bbox", "-b", nargs=4, type=int, default=None, help="Bounding box x y w h")
    args = parser.parse_args()
    
    bbox = tuple(args.bbox) if args.bbox else None
    out = remove_object(args.input, args.output, mask_path=args.mask, bbox=bbox)
    print(f"[SUCCESS] Object removed. Output: {out}")
