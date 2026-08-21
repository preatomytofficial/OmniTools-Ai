import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function generatePDF() {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Page 1: Introduction & Architecture
  let page = pdfDoc.addPage([600, 800]);
  let { width, height } = page.getSize();

  // Header Banner
  page.drawRectangle({
    x: 0,
    y: height - 100,
    width: width,
    height: 100,
    color: rgb(0.08, 0.12, 0.22),
  });

  page.drawText('OmniTools AI - Personal LLM Setup Guide', {
    x: 40,
    y: height - 55,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('100% Offline Intelligence Engine | Architecture & Local Deployment', {
    x: 40,
    y: height - 78,
    size: 11,
    font: fontRegular,
    color: rgb(0.4, 0.75, 1.0),
  });

  let y = height - 130;

  // Section 1
  page.drawText('1. Overview & Philosophy', { x: 40, y, size: 14, font: fontBold, color: rgb(0.1, 0.2, 0.4) });
  y -= 22;
  const p1 = [
    'OmniTools AI is engineered to run zero-dependency, air-gapped local intelligence.',
    'No telemetry, no external API keys, and no remote server requirements.',
    'The personal LLM core serves as a central orchestrator, parameter tuner, and',
    'autonomous task router for media enhancement algorithms.'
  ];
  for (const line of p1) {
    page.drawText(line, { x: 40, y, size: 10, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    y -= 16;
  }

  y -= 15;
  page.drawText('2. Local Environment Prerequisites', { x: 40, y, size: 14, font: fontBold, color: rgb(0.1, 0.2, 0.4) });
  y -= 22;
  const p2 = [
    '• Python 3.9+ (64-bit recommended)',
    '• FFmpeg (installed and added to system PATH for video/audio tools)',
    '• Optional GPU Acceleration: NVIDIA CUDA 11.8+ or Apple Silicon Metal (MPS)'
  ];
  for (const line of p2) {
    page.drawText(line, { x: 40, y, size: 10, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    y -= 16;
  }

  y -= 15;
  page.drawText('3. Step-by-Step Installation', { x: 40, y, size: 14, font: fontBold, color: rgb(0.1, 0.2, 0.4) });
  y -= 22;

  // Code Block box
  page.drawRectangle({
    x: 40,
    y: y - 110,
    width: 520,
    height: 110,
    color: rgb(0.94, 0.96, 0.98),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
  });

  const codeLines = [
    '# 1. Clone or download OmniTools AI repository',
    'git clone https://github.com/PreatomYT/omnitools-ai.git',
    'cd omnitools-ai',
    '',
    '# 2. Install dependencies',
    'pip install -r requirements.txt',
    '',
    '# 3. Start local controller',
    'python backend/app.py'
  ];

  let codeY = y - 16;
  for (const line of codeLines) {
    page.drawText(line, { x: 50, y: codeY, size: 9, font: fontBold, color: rgb(0.1, 0.3, 0.6) });
    codeY -= 12;
  }

  y -= 135;
  page.drawText('4. Integrating Local Transformers (HuggingFace / GGUF)', { x: 40, y, size: 14, font: fontBold, color: rgb(0.1, 0.2, 0.4) });
  y -= 22;
  const p3 = [
    'To upgrade the deterministic llm_core.py engine into a deep neural model:',
    '1. Install llama-cpp-python or transformers: pip install llama-cpp-python transformers',
    '2. Download any 4-bit quantized model (e.g. Qwen2.5-0.5B-Instruct-GGUF, Llama-3.2-1B-Q4)',
    '3. Point `llm_core.py` to the local .gguf file path for instant neural streaming.'
  ];
  for (const line of p3) {
    page.drawText(line, { x: 40, y, size: 10, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    y -= 16;
  }

  // Footer
  page.drawText('OmniTools AI Setup Documentation | © 2026 PreatomYT | Page 1 of 1', {
    x: 40,
    y: 30,
    size: 9,
    font: fontOblique,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  const outDir = path.join(process.cwd(), 'assets');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'CreateLLM.pdf'), pdfBytes);
  console.log('CreateLLM.pdf successfully generated!');
}

generatePDF().catch(console.error);
