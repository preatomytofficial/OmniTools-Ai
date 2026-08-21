# OmniTools AI - Offline Multi-Tool AI SaaS Platform

> **100% Local Personal LLM & Media Processing Suite**
> © 2026 This Tool is Made by PreatomYT

---

## 🌟 Overview

**OmniTools AI** is a modern, privacy-first, fully offline artificial intelligence suite featuring image super-resolution, optical watermark removal, object erasing, video-to-MP3 conversion, frame-accurate video trimming, and an integrated **Personal LLM System** running with zero external API dependencies.

---

## 🚀 Features

### 🖼️ Image Tools
1. **Image Upscaler (RealESRGAN)**: 2x, 4x, and 8x super-resolution with Lanczos edge filtering and unsharp contrast boost.
2. **Watermark Remover (OpenCV Inpainting)**: Smart inpainting (Telea & Navier-Stokes) to remove stamps, text, and logos.
3. **Object Remover**: Paint over photobombers and unwanted elements for seamless background synthesis.

### 🎥 Video Tools
4. **Video to MP3**: Rip crystal-clear 320kbps MP3 audio from any video container (MP4, MKV, WEBM, AVI, MOV).
5. **Video Trimmer**: Extract video slices with lossless stream copying or frame-accurate re-encoding.

### 🧠 Personal LLM Engine
- Runs 100% locally with zero cloud API keys or external server calls.
- Intent classification, parameter routing, prompt enhancement, and offline conversational assistance.

---

## 📦 Project Structure

```
/project
 ├── frontend/
 │   ├── index.html
 │   ├── api.html
 │   ├── style.css
 │   ├── script.js
 │
 ├── backend/
 │   ├── app.py
 │   ├── llm_core.py
 │   ├── tools/
 │   │   ├── upscale.py
 │   │   ├── watermark_remove.py
 │   │   ├── object_remove.py
 │   │   ├── video_mp3.py
 │   │   ├── video_trim.py
 │
 ├── assets/
 │   ├── llm_core.py
 │   ├── upscale.py
 │   ├── watermark_remove.py
 │   ├── object_remove.py
 │   ├── video_mp3.py
 │   ├── video_trim.py
 │   ├── CreateLLM.pdf
 │
 ├── requirements.txt
 └── README.md
```

---

## 🛠️ Quick Installation & Setup

1. **Install Dependencies:**
```bash
pip install -r requirements.txt
```

2. **Ensure FFmpeg is installed:**
```bash
# Ubuntu / Debian
sudo apt install ffmpeg

# MacOS (Homebrew)
brew install ffmpeg

# Windows (Chocolatey)
choco install ffmpeg
```

3. **Launch the Controller:**
```bash
python backend/app.py
```

Open your browser at `http://localhost:5000` or use the web dashboard at `http://localhost:3000`.

---

## 🔑 API & Tool Module Downloads

Visit the **Get API Key / Module Hub** page (`/api.html` or `/api-hub`) to download individual `.py` tool files and the `CreateLLM.pdf` guide!

---

*© 2026 This Tool is Made by PreatomYT*
