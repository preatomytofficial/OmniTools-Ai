#!/usr/bin/env python3
"""
OmniTools AI - LLM Chat & Completion Client
Model: Gemini 3.7 Flash / Gemini Pro
Author: OmniTools AI Team
"""

import os
import sys
import argparse
try:
    from google import genai
    from google.genai import types
except ImportError:
    print("[ERROR] 'google-genai' SDK is not installed.")
    print("Please install it using: pip install google-genai")
    sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="OmniTools AI - Standalone LLM Python Runner")
    parser.add_argument("-p", "--prompt", type=str, help="User prompt to send to the LLM")
    parser.add_argument("-m", "--model", type=str, default="gemini-3.7-flash", help="Model name (default: gemini-3.7-flash)")
    parser.add_argument("-s", "--system", type=str, default="You are a helpful, expert AI assistant developed by OmniTools AI.", help="System instructions")
    parser.add_argument("-t", "--temperature", type=float, default=0.7, help="Sampling temperature (0.0 to 2.0)")
    parser.add_argument("--stream", action="store_true", help="Stream response tokens in real-time")
    parser.add_argument("--api-key", type=str, default=None, help="Gemini API Key (or set GEMINI_API_KEY env var)")

    args = parser.parse_args()

    api_key = args.api_key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("[!] No API key provided.")
        print("Please provide --api-key YOUR_KEY or set 'export GEMINI_API_KEY=your_key'")
        sys.exit(1)

    # Initialize Google GenAI client
    client = genai.Client(
        api_key=api_key,
        http_options={"headers": {"User-Agent": "aistudio-build"}}
    )

    prompt = args.prompt
    if not prompt:
        print("=== OmniTools AI Interactive LLM Chat ===")
        print(f"Model: {args.model} | Type 'exit' or 'quit' to end.\n")
        
        chat = client.chats.create(
            model=args.model,
            config=types.GenerateContentConfig(
                system_instruction=args.system,
                temperature=args.temperature,
            )
        )
        
        while True:
            try:
                user_msg = input("\n👤 You: ").strip()
                if not user_msg:
                    continue
                if user_msg.lower() in ("exit", "quit"):
                    print("Goodbye!")
                    break
                
                print(f"🤖 {args.model}: ", end="", flush=True)
                response = chat.send_message_stream(user_msg)
                for chunk in response:
                    if chunk.text:
                        print(chunk.text, end="", flush=True)
                print()
            except KeyboardInterrupt:
                print("\nSession aborted.")
                break
    else:
        print(f"[*] Querying {args.model}...\n")
        if args.stream:
            response = client.models.generate_content_stream(
                model=args.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=args.system,
                    temperature=args.temperature
                )
            )
            for chunk in response:
                if chunk.text:
                    print(chunk.text, end="", flush=True)
            print()
        else:
            response = client.models.generate_content(
                model=args.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=args.system,
                    temperature=args.temperature
                )
            )
            print(response.text)

if __name__ == "__main__":
    main()
