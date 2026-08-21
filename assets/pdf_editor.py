#!/usr/bin/env python3
"""
OmniTools AI - PDF Document Editor & Merger
Operations: Merge, Split, Rotate, Extract
Author: OmniTools AI Team
"""

import sys
import argparse

try:
    from pypdf import PdfReader, PdfWriter
except ImportError:
    try:
        from PyPDF2 import PdfReader, PdfWriter
    except ImportError:
        print("[ERROR] pypdf library is required: pip install pypdf")
        sys.exit(1)

def merge_pdfs(inputs, output):
    writer = PdfWriter()
    for inp in inputs:
        reader = PdfReader(inp)
        for page in reader.pages:
            writer.add_page(page)
    with open(output, "wb") as f:
        writer.write(f)
    print(f"[✓] Merged {len(inputs)} PDFs into '{output}'")

def rotate_pdf(inp, output, angle=90):
    reader = PdfReader(inp)
    writer = PdfWriter()
    for page in reader.pages:
        page.rotate(int(angle))
        writer.add_page(page)
    with open(output, "wb") as f:
        writer.write(f)
    print(f"[✓] Rotated '{inp}' by {angle}° saved to '{output}'")

def main():
    parser = argparse.ArgumentParser(description="OmniTools AI - PDF Toolkit")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Merge
    merge_p = subparsers.add_parser("merge", help="Merge multiple PDFs")
    merge_p.add_argument("-i", "--inputs", nargs="+", required=True, help="Input PDF files")
    merge_p.add_argument("-o", "--output", required=True, help="Output PDF file")

    # Rotate
    rotate_p = subparsers.add_parser("rotate", help="Rotate all pages in a PDF")
    rotate_p.add_argument("-i", "--input", required=True, help="Input PDF file")
    rotate_p.add_argument("-o", "--output", required=True, help="Output PDF file")
    rotate_p.add_argument("-a", "--angle", type=int, default=90, choices=[90, 180, 270], help="Rotation angle")

    args = parser.parse_args()
    if args.command == "merge":
        merge_pdfs(args.inputs, args.output)
    elif args.command == "rotate":
        rotate_pdf(args.input, args.output, args.angle)

if __name__ == "__main__":
    main()
