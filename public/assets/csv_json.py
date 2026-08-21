#!/usr/bin/env python3
"""
OmniTools AI - CSV to JSON Standalone Converter
Usage: python3 csv_json.py input.csv output.json [--pretty] [--delimiter COMMA]
"""
import sys
import os
import csv
import json
import argparse

def convert_csv_to_json(csv_path, json_path=None, delimiter=None, pretty=True, dynamic_types=True):
    if not os.path.exists(csv_path):
        print(f"Error: File not found {csv_path}", file=sys.stderr)
        sys.exit(1)
        
    if json_path is None:
        base, _ = os.path.splitext(csv_path)
        json_path = f"{base}.json"
        
    # Sniff delimiter if not provided
    with open(csv_path, 'r', encoding='utf-8', errors='replace') as f:
        sample = f.read(4096)
        if not delimiter:
            try:
                dialect = csv.Sniffer().sniff(sample)
                delimiter = dialect.delimiter
            except Exception:
                delimiter = ','

    rows = []
    with open(csv_path, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f, delimiter=delimiter)
        for row in reader:
            parsed_row = {}
            for k, v in row.items():
                k_clean = k.strip() if k else ""
                v_clean = v.strip() if v else ""
                if dynamic_types:
                    if v_clean.lower() == 'true':
                        parsed_row[k_clean] = True
                    elif v_clean.lower() == 'false':
                        parsed_row[k_clean] = False
                    elif v_clean.lower() in ('null', 'none', ''):
                        parsed_row[k_clean] = None
                    else:
                        try:
                            if '.' in v_clean:
                                parsed_row[k_clean] = float(v_clean)
                            else:
                                parsed_row[k_clean] = int(v_clean)
                        except ValueError:
                            parsed_row[k_clean] = v_clean
                else:
                    parsed_row[k_clean] = v_clean
            rows.append(parsed_row)

    indent = 2 if pretty else None
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(rows, f, indent=indent, ensure_ascii=False)
        
    print(f"Successfully converted {len(rows)} rows to {json_path}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Convert CSV to JSON instantly.")
    parser.add_argument("input", help="Path to input CSV file")
    parser.add_argument("output", nargs="?", default=None, help="Path to output JSON file")
    parser.add_argument("--delimiter", default=None, help="Custom delimiter (e.g. ',', ';', '\\t')")
    parser.add_argument("--compact", action="store_true", help="Minify JSON output")
    args = parser.parse_args()
    
    convert_csv_to_json(args.input, args.output, delimiter=args.delimiter, pretty=not args.compact)
