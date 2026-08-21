#!/usr/bin/env python3
"""
OmniTools AI - Document RAG & Vector Search Script
Model: Gemini 3.7 Flash + Embeddings
Author: OmniTools AI Team
"""

import os
import sys
import argparse
import numpy as np

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("[ERROR] Required packages not found. Run:")
    print("pip install google-genai numpy")
    sys.exit(1)

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def main():
    parser = argparse.ArgumentParser(description="OmniTools AI - RAG Knowledge Base Search")
    parser.add_argument("-f", "--file", type=str, help="Text or markdown file to index")
    parser.add_argument("-q", "--query", type=str, required=True, help="User question to answer from context")
    parser.add_argument("--api-key", type=str, default=None, help="Gemini API Key")

    args = parser.parse_args()
    api_key = args.api_key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("[!] GEMINI_API_KEY is required.")
        sys.exit(1)

    client = genai.Client(
        api_key=api_key,
        http_options={"headers": {"User-Agent": "aistudio-build"}}
    )

    doc_text = ""
    if args.file and os.path.exists(args.file):
        with open(args.file, "r", encoding="utf-8") as f:
            doc_text = f.read()
    else:
        doc_text = "OmniTools AI is an all-in-one local processing platform with image upscaling, watermark removal, object eraser, video trimmer, PDF suite, CSV converter, and Gemini LLM integration."

    # Chunk document
    chunks = [doc_text[i:i+800] for i in range(0, len(doc_text), 600)]

    print(f"[*] Embedding {len(chunks)} chunks and query with text-embedding...")
    # Embed chunks
    chunk_embeddings = []
    for chunk in chunks:
        emb = client.models.embed_content(
            model="text-embedding-004",
            contents=chunk
        )
        chunk_embeddings.append((chunk, emb.embedding.values))

    # Embed query
    query_emb = client.models.embed_content(
        model="text-embedding-004",
        contents=args.query
    ).embedding.values

    # Find best chunks
    scores = [(chunk, cosine_similarity(query_emb, emb_val)) for chunk, emb_val in chunk_embeddings]
    scores.sort(key=lambda x: x[1], reverse=True)
    top_context = "\n---\n".join([s[0] for s in scores[:3]])

    print(f"[*] Generating grounded answer with Gemini 3.7 Flash...\n")
    prompt = f"""Use the following retrieved context to answer the user query accurately:
Context:
{top_context}

User Query: {args.query}
"""

    response = client.models.generate_content(
        model="gemini-3.7-flash",
        contents=prompt
    )

    print(response.text)

if __name__ == "__main__":
    main()
