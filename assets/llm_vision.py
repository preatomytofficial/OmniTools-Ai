#!/usr/bin/env python3
"""
OmniTools AI - LLM Multimodal Vision Analysis
Model: Gemini 3.7 Flash / Gemini Flash
Author: OmniTools AI Team
"""

import os
import sys
import argparse
from pathlib import Path

try:
    from google import genai
    from google.genai import types
    from PIL import Image
except ImportError:
    print("[ERROR] Required packages not found. Run:")
    print("pip install google-genai pillow")
    sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="OmniTools AI - LLM Vision & Document Analysis")
    parser.add_argument("-i", "--image", required=True, type=str, help="Path to input image (PNG/JPG/WEBP)")
    parser.add_argument("-p", "--prompt", type=str, default="Describe and analyze this image in rich detail.", help="Question or prompt about the image")
    parser.add_argument("-m", "--model", type=str, default="gemini-3.7-flash", help="Model name")
    parser.add_argument("--api-key", type=str, default=None, help="Gemini API Key")

    args = parser.parse_args()

    api_key = args.api_key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("[!] GEMINI_API_KEY is required. Pass --api-key or export GEMINI_API_KEY")
        sys.exit(1)

    image_path = Path(args.image)
    if not image_path.exists():
        print(f"[!] Image not found: {args.image}")
        sys.exit(1)

    img = Image.open(image_path)

    client = genai.Client(
        api_key=api_key,
        http_options={"headers": {"User-Agent": "aistudio-build"}}
    )

    print(f"[*] Analyzing '{image_path.name}' with {args.model}...\n")
    response = client.models.generate_content(
        model=args.model,
        contents=[img, args.prompt]
    )

    print(response.text)

if __name__ == "__main__":
    main()
