#!/usr/bin/env python3
"""
OmniTools AI - CSV to JSON Converter
Author: OmniTools AI Team
"""

import sys
import csv
import json
import argparse

def main():
    parser = argparse.ArgumentParser(description="Convert CSV/TSV data to structured JSON")
    parser.add_argument("-i", "--input", required=True, help="Input CSV file path")
    parser.add_argument("-o", "--output", help="Output JSON file path (optional, prints to stdout if omitted)")
    parser.add_argument("-d", "--delimiter", default=None, help="Custom delimiter (default: auto-detect)")
    parser.add_argument("--pretty", action="store_true", default=True, help="Pretty print JSON")

    args = parser.parse_args()

    with open(args.input, "r", encoding="utf-8-sig") as f:
        sample = f.read(2048)
        f.seek(0)
        
        delimiter = args.delimiter
        if not delimiter:
            try:
                dialect = csv.Sniffer().sniff(sample)
                delimiter = dialect.delimiter
            except Exception:
                delimiter = ","
        
        reader = csv.DictReader(f, delimiter=delimiter)
        rows = list(reader)

    indent = 2 if args.pretty else None
    json_output = json.dumps(rows, indent=indent, ensure_ascii=False)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(json_output)
        print(f"[✓] Converted {len(rows)} records saved to {args.output}")
    else:
        print(json_output)

if __name__ == "__main__":
    main()
