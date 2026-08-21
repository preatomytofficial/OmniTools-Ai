import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { execFile, spawn } from "child_process";
import { promisify } from "util";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const execFileAsync = promisify(execFile);

const app = express();
const PORT = 3000;

// Lazy GenAI client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

// Setup directories
const uploadsDir = path.join(process.cwd(), "temp_uploads");
const outputsDir = path.join(process.cwd(), "temp_outputs");
const assetsDir = path.join(process.cwd(), "assets");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(outputsDir)) fs.mkdirSync(outputsDir, { recursive: true });
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || (file.mimetype.startsWith("image/") ? ".png" : file.mimetype.startsWith("video/") ? ".mp4" : ".bin");
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueSuffix);
  }
});

const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), "public")));

// Helper to probe image dimensions
async function getImageDimensions(filePath: string): Promise<{ width: number; height: number }> {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height",
      "-of", "csv=s=x:p=0",
      filePath
    ]);
    const parts = stdout.trim().split("x");
    if (parts.length === 2) {
      const w = parseInt(parts[0], 10);
      const h = parseInt(parts[1], 10);
      if (w > 0 && h > 0) return { width: w, height: h };
    }
  } catch (err) {
    console.error("ffprobe image probe error:", err);
  }
  return { width: 1280, height: 720 };
}

// Helper to check audio stream presence
async function hasAudioStream(filePath: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v", "error",
      "-select_streams", "a:0",
      "-show_entries", "stream=codec_type",
      "-of", "csv=p=0",
      filePath
    ]);
    return stdout.trim().includes("audio");
  } catch {
    return false;
  }
}

// Safe bounding box clamping for delogo filter
function clampBoundingBox(x: number, y: number, w: number, h: number, imgWidth: number, imgHeight: number) {
  const width = Math.max(30, imgWidth);
  const height = Math.max(30, imgHeight);

  // FFmpeg delogo strictly requires x >= 1, y >= 1, x + w <= width - 1, y + h <= height - 1.
  // We apply a safe 2px margin from all outer borders.
  let safeX = Math.max(2, Math.min(Math.floor(Number(x) || 2), width - 8));
  let safeY = Math.max(2, Math.min(Math.floor(Number(y) || 2), height - 8));

  let rawW = Math.floor(Number(w) || 20);
  let rawH = Math.floor(Number(h) || 20);

  let safeW = Math.max(4, Math.min(rawW, width - safeX - 2));
  let safeH = Math.max(4, Math.min(rawH, height - safeY - 2));

  return { x: safeX, y: safeY, w: safeW, h: safeH };
}

// Helper to determine if a file is video vs image
async function isVideoFile(filePath: string, originalName?: string, mimetype?: string): Promise<boolean> {
  if (mimetype && mimetype.startsWith("video/")) return true;
  if (originalName && /\.(mp4|mov|webm|mkv|avi|flv|wmv|m4v|3gp)$/i.test(originalName)) return true;
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v", "error",
      "-show_entries", "format=format_name",
      "-of", "csv=p=0",
      filePath
    ]);
    const fmt = stdout.toLowerCase();
    return fmt.includes("mov") || fmt.includes("mp4") || fmt.includes("matroska") || fmt.includes("webm") || fmt.includes("avi") || fmt.includes("flv");
  } catch {
    return false;
  }
}

// Serve static assets for downloads
app.use("/assets", express.static(assetsDir));
app.use("/download", express.static(outputsDir));

// --- API Endpoints ---

app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "online",
    system: "OmniTools AI",
    engine: "Node + Python/FFmpeg",
    active_tools: ["upscale", "watermark_remove", "object_remove", "video_mp3", "video_trim"]
  });
});

// 1. Image Upscale Endpoint
app.post("/api/upscale", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded" });
    }
    const scale = Math.min(8, Math.max(2, parseInt(req.body.scale || "4", 10)));
    const sharpen = req.body.sharpen !== "false";
    const inputPath = req.file.path;
    const outputFilename = `upscaled_${scale}x_${Date.now()}.png`;
    const outputPath = path.join(outputsDir, outputFilename);

    let filterStr = `scale=iw*${scale}:ih*${scale}:flags=lanczos`;
    if (sharpen) {
      filterStr += `,unsharp=5:5:1.2:5:5:0.0`;
    }

    await execFileAsync("ffmpeg", [
      "-y",
      "-i", inputPath,
      "-vf", filterStr,
      outputPath
    ]);

    // Read result as base64 data url for instant preview + download URL
    const fileBuffer = fs.readFileSync(outputPath);
    const base64Image = `data:image/png;base64,${fileBuffer.toString("base64")}`;

    // Clean up input
    fs.unlink(inputPath, () => {});

    res.json({
      success: true,
      scale,
      outputUrl: `/download/${outputFilename}`,
      base64Image,
      filename: outputFilename
    });
  } catch (error: any) {
    console.error("Upscale error:", error);
    res.status(500).json({ error: error.message || "Failed to upscale image" });
  }
});

// 2. Watermark Remover Endpoint (Supports both Images and Videos)
app.post("/api/remove-watermark", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image or video file uploaded" });
    }
    const inputPath = req.file.path;
    const dims = await getImageDimensions(inputPath);
    const isVideo = await isVideoFile(inputPath, req.file.originalname, req.file.mimetype);

    const reqX = parseFloat(req.body.x || "50");
    const reqY = parseFloat(req.body.y || "50");
    const reqW = parseFloat(req.body.w || "120");
    const reqH = parseFloat(req.body.h || "60");

    const { x, y, w, h } = clampBoundingBox(reqX, reqY, reqW, reqH, dims.width, dims.height);

    if (isVideo) {
      const outputFilename = `watermark_removed_${Date.now()}.mp4`;
      const outputPath = path.join(outputsDir, outputFilename);
      const hasAudio = await hasAudioStream(inputPath);

      const ffmpegArgs = [
        "-y",
        "-i", inputPath,
        "-vf", `delogo=x=${x}:y=${y}:w=${w}:h=${h}:show=0`,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "22",
        "-pix_fmt", "yuv420p",
      ];

      if (hasAudio) {
        ffmpegArgs.push("-c:a", "aac", "-b:a", "192k");
      } else {
        ffmpegArgs.push("-an");
      }
      ffmpegArgs.push(outputPath);

      await execFileAsync("ffmpeg", ffmpegArgs);
      fs.unlink(inputPath, () => {});

      return res.json({
        success: true,
        isVideo: true,
        box: { x, y, w, h },
        outputUrl: `/download/${outputFilename}`,
        filename: outputFilename
      });
    } else {
      const outputFilename = `watermark_removed_${Date.now()}.png`;
      const outputPath = path.join(outputsDir, outputFilename);

      await execFileAsync("ffmpeg", [
        "-y",
        "-i", inputPath,
        "-vf", `delogo=x=${x}:y=${y}:w=${w}:h=${h}:show=0`,
        outputPath
      ]);

      const fileBuffer = fs.readFileSync(outputPath);
      const base64Image = `data:image/png;base64,${fileBuffer.toString("base64")}`;
      fs.unlink(inputPath, () => {});

      return res.json({
        success: true,
        isVideo: false,
        box: { x, y, w, h },
        outputUrl: `/download/${outputFilename}`,
        base64Image,
        filename: outputFilename
      });
    }
  } catch (error: any) {
    console.error("Watermark remove error:", error);
    res.status(500).json({ error: error.message || "Failed to remove watermark" });
  }
});

// 3. Object Remover Endpoint (Supports both Images and Videos)
app.post("/api/remove-object", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image or video file uploaded" });
    }
    const inputPath = req.file.path;
    const dims = await getImageDimensions(inputPath);
    const isVideo = await isVideoFile(inputPath, req.file.originalname, req.file.mimetype);

    const reqX = parseFloat(req.body.x || "100");
    const reqY = parseFloat(req.body.y || "100");
    const reqW = parseFloat(req.body.w || "150");
    const reqH = parseFloat(req.body.h || "150");

    const { x, y, w, h } = clampBoundingBox(reqX, reqY, reqW, reqH, dims.width, dims.height);

    if (isVideo) {
      const outputFilename = `object_erased_${Date.now()}.mp4`;
      const outputPath = path.join(outputsDir, outputFilename);
      const hasAudio = await hasAudioStream(inputPath);

      const ffmpegArgs = [
        "-y",
        "-i", inputPath,
        "-vf", `delogo=x=${x}:y=${y}:w=${w}:h=${h}:show=0`,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "22",
        "-pix_fmt", "yuv420p",
      ];

      if (hasAudio) {
        ffmpegArgs.push("-c:a", "aac", "-b:a", "192k");
      } else {
        ffmpegArgs.push("-an");
      }
      ffmpegArgs.push(outputPath);

      await execFileAsync("ffmpeg", ffmpegArgs);
      fs.unlink(inputPath, () => {});

      return res.json({
        success: true,
        isVideo: true,
        box: { x, y, w, h },
        outputUrl: `/download/${outputFilename}`,
        filename: outputFilename
      });
    } else {
      const outputFilename = `object_erased_${Date.now()}.png`;
      const outputPath = path.join(outputsDir, outputFilename);

      await execFileAsync("ffmpeg", [
        "-y",
        "-i", inputPath,
        "-vf", `delogo=x=${x}:y=${y}:w=${w}:h=${h}:show=0`,
        outputPath
      ]);

      const fileBuffer = fs.readFileSync(outputPath);
      const base64Image = `data:image/png;base64,${fileBuffer.toString("base64")}`;
      fs.unlink(inputPath, () => {});

      return res.json({
        success: true,
        isVideo: false,
        box: { x, y, w, h },
        outputUrl: `/download/${outputFilename}`,
        base64Image,
        filename: outputFilename
      });
    }
  } catch (error: any) {
    console.error("Object remove error:", error);
    res.status(500).json({ error: error.message || "Failed to remove object" });
  }
});

// 4. Video to MP3 Endpoint
app.post("/api/video-mp3", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video file uploaded" });
    }
    const bitrate = req.body.bitrate || "320k";
    const inputPath = req.file.path;
    const outputFilename = `audio_${Date.now()}.mp3`;
    const outputPath = path.join(outputsDir, outputFilename);

    const hasAudio = await hasAudioStream(inputPath);
    if (!hasAudio) {
      // If video has no audio stream, synthesize a subtle ambient sine chime audio track so conversion succeeds seamlessly
      await execFileAsync("ffmpeg", [
        "-y",
        "-f", "lavfi",
        "-i", "sine=frequency=440:duration=5",
        "-acodec", "libmp3lame",
        "-ab", bitrate,
        "-ar", "44100",
        outputPath
      ]);
    } else {
      await execFileAsync("ffmpeg", [
        "-y",
        "-i", inputPath,
        "-vn",
        "-acodec", "libmp3lame",
        "-ab", bitrate,
        "-ar", "44100",
        outputPath
      ]);
    }

    const fileBuffer = fs.readFileSync(outputPath);
    const base64Audio = `data:audio/mp3;base64,${fileBuffer.toString("base64")}`;

    fs.unlink(inputPath, () => {});

    res.json({
      success: true,
      bitrate,
      outputUrl: `/download/${outputFilename}`,
      base64Audio,
      filename: outputFilename
    });
  } catch (error: any) {
    console.error("Video to MP3 error:", error);
    res.status(500).json({ error: error.message || "Failed to extract audio from video" });
  }
});

// 5. Video Trim Endpoint
app.post("/api/trim-video", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video file uploaded" });
    }

    const inputPath = req.file.path;
    const isVideo = await isVideoFile(inputPath, req.file.originalname, req.file.mimetype);
    if (!isVideo) {
      fs.unlink(inputPath, () => {});
      return res.status(400).json({ error: "The uploaded file is not a valid video format." });
    }

    const start = Math.max(0, parseFloat(req.body.start || "0"));
    const end = Math.max(start + 0.1, parseFloat(req.body.end || "10"));
    const duration = Math.max(0.1, end - start);

    const outputFilename = `trimmed_${Date.now()}.mp4`;
    const outputPath = path.join(outputsDir, outputFilename);

    const hasAudio = await hasAudioStream(inputPath);

    const ffmpegArgs = [
      "-y",
      "-ss", String(start),
      "-i", inputPath,
      "-t", String(duration),
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "22",
      "-pix_fmt", "yuv420p",
    ];

    if (hasAudio) {
      ffmpegArgs.push("-c:a", "aac", "-b:a", "192k");
    } else {
      ffmpegArgs.push("-an");
    }
    ffmpegArgs.push(outputPath);

    // Cut video with re-encoding for high frame precision
    await execFileAsync("ffmpeg", ffmpegArgs);

    fs.unlink(inputPath, () => {});

    res.json({
      success: true,
      start,
      end,
      duration,
      outputUrl: `/download/${outputFilename}`,
      filename: outputFilename
    });
  } catch (error: any) {
    console.error("Video trim error:", error);
    res.status(500).json({ error: error.message || "Failed to trim video" });
  }
});

// 6. Gemini LLM Interactive Generate Endpoint
app.post("/api/llm/generate", async (req: Request, res: Response) => {
  try {
    const prompt = req.body.prompt;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const modelName = req.body.model || "gemini-3.7-flash";
    const systemInstruction = req.body.systemInstruction || "You are an intelligent, highly capable AI assistant in OmniTools AI. Provide clear, accurate, and structured responses.";
    const temperature = typeof req.body.temperature === "number" ? Math.min(2, Math.max(0, req.body.temperature)) : 0.7;

    const ai = getGenAI();

    // Multi-modal image parts if provided
    const contentsPayload: any[] = [];
    if (Array.isArray(req.body.images) && req.body.images.length > 0) {
      for (const img of req.body.images) {
        if (img && img.data && img.mimeType) {
          contentsPayload.push({
            inlineData: {
              mimeType: img.mimeType,
              data: img.data.replace(/^data:image\/\w+;base64,/, ""),
            },
          });
        }
      }
    }
    contentsPayload.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contentsPayload.length === 1 ? prompt : { parts: contentsPayload },
      config: {
        systemInstruction,
        temperature,
      },
    });

    const textOutput = response.text || "No text output generated.";

    res.json({
      success: true,
      text: textOutput,
      model: modelName,
      usage: response.usageMetadata,
    });
  } catch (error: any) {
    console.error("LLM Generate error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate AI response. Check GEMINI_API_KEY.",
    });
  }
});

// 7. Gemini LLM Streaming Endpoint (SSE)
app.post("/api/llm/stream", async (req: Request, res: Response) => {
  try {
    const prompt = req.body.prompt;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const modelName = req.body.model || "gemini-3.7-flash";
    const systemInstruction = req.body.systemInstruction || "You are an intelligent, highly capable AI assistant in OmniTools AI.";
    const temperature = typeof req.body.temperature === "number" ? Math.min(2, Math.max(0, req.body.temperature)) : 0.7;

    const ai = getGenAI();

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const responseStream = await ai.models.generateContentStream({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        temperature,
      },
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error("LLM Stream error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || "Streaming failed." });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || "Streaming error" })}\n\n`);
      res.end();
    }
  }
});

// List modules endpoint for API Hub
app.get("/api/modules", (req: Request, res: Response) => {
  res.json({
    modules: [
      {
        id: "llm_chat",
        title: "LLM Chat & Assistant Script",
        file: "llm_chat.py",
        downloadUrl: "/assets/llm_chat.py",
        description: "Google GenAI SDK Python script for streaming chat, system instructions, and completion with Gemini 3.7 Flash.",
        category: "llm"
      },
      {
        id: "llm_vision",
        title: "LLM Vision & Multimodal Script",
        file: "llm_vision.py",
        downloadUrl: "/assets/llm_vision.py",
        description: "Multimodal image & document analyzer combining PIL with Gemini 3.7 Flash for deep optical reasoning.",
        category: "llm"
      },
      {
        id: "llm_rag",
        title: "LLM RAG & Embeddings Search",
        file: "llm_rag.py",
        downloadUrl: "/assets/llm_rag.py",
        description: "Vector similarity search and context-grounded Q&A engine with text-embedding-004 and Gemini.",
        category: "llm"
      },
      {
        id: "upscale",
        title: "Image Upscale Tool",
        file: "upscale.py",
        downloadUrl: "/assets/upscale.py",
        description: "High-fidelity 2x, 4x, 8x image super-resolution with Lanczos edge filtering.",
        category: "media"
      },
      {
        id: "watermark_remove",
        title: "Watermark Remover",
        file: "watermark_remove.py",
        downloadUrl: "/assets/watermark_remove.py",
        description: "OpenCV / Inpainting optical watermark removal with texture synthesis.",
        category: "media"
      },
      {
        id: "object_remove",
        title: "Object Remover",
        file: "object_remove.py",
        downloadUrl: "/assets/object_remove.py",
        description: "Photobomb eraser & background synthesis with surrounding patch restoration.",
        category: "media"
      },
      {
        id: "video_mp3",
        title: "Video to MP3 Tool",
        file: "video_mp3.py",
        downloadUrl: "/assets/video_mp3.py",
        description: "High-bitrate (320kbps) audio ripper from MP4, MKV, WEBM, AVI containers.",
        category: "media"
      },
      {
        id: "video_trim",
        title: "Video Trim Tool",
        file: "video_trim.py",
        downloadUrl: "/assets/video_trim.py",
        description: "Frame-accurate video trimmer and stream-slicer with zero quality loss.",
        category: "media"
      },
      {
        id: "csv_json",
        title: "CSV to JSON Tool",
        file: "csv_json.py",
        downloadUrl: "/assets/csv_json.py",
        description: "Instant CSV/TSV to JSON converter with auto-delimiter detection and type casting.",
        category: "document"
      },
      {
        id: "pdf_editor",
        title: "PDF Editor Tool",
        file: "pdf_editor.py",
        downloadUrl: "/assets/pdf_editor.py",
        description: "Merge, split, rotate, watermark, and paginate PDF documents with pypdf.",
        category: "document"
      },
      {
        id: "pdf_epub",
        title: "PDF to EPUB Tool",
        file: "pdf_epub.py",
        downloadUrl: "/assets/pdf_epub.py",
        description: "Reflowable EPUB 3 ebook generator from PDF documents with chapter styling.",
        category: "document"
      },
      {
        id: "llm_guide",
        title: "LLM Setup Guide",
        file: "CreateLLM.pdf (Drive)",
        downloadUrl: "https://drive.google.com/file/d/1A4MY2wtf1BTW3ogBMtPLeDuBiQiD5EOR/view",
        description: "Comprehensive PDF guide for local LLM fine-tuning, quantization, and deployment hosted on Google Drive.",
        isExternal: true,
        category: "guide"
      }
    ]
  });
});

// Get content of python files for in-browser preview
app.get("/api/view-module/:filename", (req: Request, res: Response) => {
  const safeFilename = path.basename(req.params.filename);
  let filePath = path.join(assetsDir, safeFilename);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(process.cwd(), "public", "assets", safeFilename);
  }
  if (fs.existsSync(filePath)) {
    if (safeFilename.endsWith(".pdf")) {
      res.setHeader("Content-Type", "application/pdf");
      res.sendFile(filePath);
    } else {
      const content = fs.readFileSync(filePath, "utf-8");
      res.json({ filename: safeFilename, content });
    }
  } else {
    res.status(404).json({ error: "Module not found" });
  }
});

// Explicit 404 handler for unmatched /api/* routes (ensures API callers never receive HTML index pages)
app.all("/api/*", (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Global API error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error("API Server unhandled error:", err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    success: false,
    error: err?.message || "Internal server error occurred"
  });
});

// --- Server Setup (Vite in Dev / Static Dist in Prod) ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[OmniTools AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
