import React, { useState, useRef } from 'react';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import {
  FileText,
  Upload,
  Download,
  Plus,
  Trash2,
  RotateCw,
  Scissors,
  Layers,
  Stamp,
  Hash,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileCheck
} from 'lucide-react';

interface PdfFileItem {
  id: string;
  file: File;
  name: string;
  pageCount: number;
  arrayBuffer: ArrayBuffer;
}

export const PdfEditor: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'merge' | 'split' | 'rotate' | 'watermark' | 'pagenum'>('merge');

  // Multi-PDF files for Merge
  const [mergeFiles, setMergeFiles] = useState<PdfFileItem[]>([]);
  const mergeFileInputRef = useRef<HTMLInputElement>(null);

  // Single PDF file for Split / Rotate / Watermark / Numbering
  const [singlePdf, setSinglePdf] = useState<PdfFileItem | null>(null);
  const singleFileInputRef = useRef<HTMLInputElement>(null);

  // Split options
  const [splitRange, setSplitRange] = useState<string>('1-2');

  // Rotate options
  const [rotationAngle, setRotationAngle] = useState<number>(90);
  const [rotateTargetPages, setRotateTargetPages] = useState<'all' | 'custom'>('all');
  const [rotateCustomPages, setRotateCustomPages] = useState<string>('1');

  // Watermark options
  const [watermarkText, setWatermarkText] = useState<string>('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.3);
  const [watermarkSize, setWatermarkSize] = useState<number>(48);
  const [watermarkColor, setWatermarkColor] = useState<'red' | 'gray' | 'blue' | 'black'>('red');
  const [watermarkAngle, setWatermarkAngle] = useState<number>(45);

  // Page numbering options
  const [pageNumberPosition, setPageNumberPosition] = useState<'bottom-center' | 'bottom-right' | 'top-right'>('bottom-center');
  const [pageNumberFormat, setPageNumberFormat] = useState<'page_x_of_y' | 'x_of_y' | 'just_x'>('page_x_of_y');
  const [pageNumberSize, setPageNumberSize] = useState<number>(10);

  // Result state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultPdfUrl, setResultPdfUrl] = useState<string | null>(null);
  const [resultPdfName, setResultPdfName] = useState<string>('edited_document.pdf');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load sample PDF generator
  const createSamplePdf = async (title = 'Sample Document', numPages = 3): Promise<File> => {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    for (let i = 1; i <= numPages; i++) {
      const page = pdfDoc.addPage([595.28, 841.89]); // A4
      const { width, height } = page.getSize();

      page.drawText(`${title} - Page ${i}`, {
        x: 50,
        y: height - 80,
        size: 24,
        font: font,
        color: rgb(0.1, 0.2, 0.4)
      });

      page.drawText(
        `This is a generated demonstration document for the OmniTools AI PDF Editor.\nYou can test merging, page splitting, rotation, watermarking, and numbering.\n\nGenerated page ${i} of ${numPages}.\nDimensions: ${Math.round(width)} x ${Math.round(height)} pt (A4 Standard).`,
        {
          x: 50,
          y: height - 140,
          size: 13,
          font: regularFont,
          color: rgb(0.2, 0.2, 0.2),
          lineHeight: 20
        }
      );

      page.drawRectangle({
        x: 50,
        y: 80,
        width: width - 100,
        height: 2,
        color: rgb(0.8, 0.8, 0.8)
      });
    }

    const pdfBytes = await pdfDoc.save();
    return new File([pdfBytes], `${title.toLowerCase().replace(/\s+/g, '_')}.pdf`, { type: 'application/pdf' });
  };

  const loadSampleForMerge = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      const f1 = await createSamplePdf('Document Alpha', 2);
      const f2 = await createSamplePdf('Document Beta', 3);

      const item1: PdfFileItem = {
        id: 'sample_1_' + Date.now(),
        file: f1,
        name: f1.name,
        pageCount: 2,
        arrayBuffer: await f1.arrayBuffer()
      };
      const item2: PdfFileItem = {
        id: 'sample_2_' + Date.now(),
        file: f2,
        name: f2.name,
        pageCount: 3,
        arrayBuffer: await f2.arrayBuffer()
      };

      setMergeFiles([item1, item2]);
      setSuccessMsg('Sample PDFs loaded for Merge demonstration.');
    } catch (err: any) {
      setError(err.message || 'Failed to create sample PDFs.');
    } finally {
      setIsProcessing(false);
    }
  };

  const loadSampleForSingle = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      const file = await createSamplePdf('Contract Document', 4);
      const item: PdfFileItem = {
        id: 'sample_single_' + Date.now(),
        file,
        name: file.name,
        pageCount: 4,
        arrayBuffer: await file.arrayBuffer()
      };
      setSinglePdf(item);
      setSplitRange('1-2, 4');
      setSuccessMsg('Sample 4-page PDF loaded for editing.');
    } catch (err: any) {
      setError(err.message || 'Failed to create sample PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Merge Handler
  const handleMergePdf = async () => {
    if (mergeFiles.length < 2) {
      setError('Please add at least 2 PDF files to merge.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of mergeFiles) {
        const srcDoc = await PDFDocument.load(item.arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setResultPdfUrl(url);
      setResultPdfName('merged_document.pdf');
      setSuccessMsg(`Successfully merged ${mergeFiles.length} PDFs into ${mergedPdf.getPageCount()} pages!`);
    } catch (err: any) {
      setError(err.message || 'Failed to merge PDF files.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Split Handler
  const handleSplitPdf = async () => {
    if (!singlePdf) {
      setError('Please upload a PDF document first.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const srcDoc = await PDFDocument.load(singlePdf.arrayBuffer);
      const totalPages = srcDoc.getPageCount();

      // Parse range string (e.g. "1-3, 5")
      const pagesToExtract = parsePageRange(splitRange, totalPages);
      if (pagesToExtract.length === 0) {
        throw new Error(`Invalid page range. Document has ${totalPages} pages (range 1-${totalPages}).`);
      }

      const newPdf = await PDFDocument.create();
      // pdf-lib uses 0-indexed page indices
      const indices = pagesToExtract.map((p) => p - 1);
      const copiedPages = await newPdf.copyPages(srcDoc, indices);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setResultPdfUrl(url);
      setResultPdfName(`split_${singlePdf.name}`);
      setSuccessMsg(`Extracted ${copiedPages.length} pages (${pagesToExtract.join(', ')}) into new PDF!`);
    } catch (err: any) {
      setError(err.message || 'Failed to split PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Rotate Handler
  const handleRotatePdf = async () => {
    if (!singlePdf) {
      setError('Please upload a PDF document first.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const pdfDoc = await PDFDocument.load(singlePdf.arrayBuffer);
      const totalPages = pdfDoc.getPageCount();
      const targetIndices: number[] = [];

      if (rotateTargetPages === 'all') {
        for (let i = 0; i < totalPages; i++) targetIndices.push(i);
      } else {
        const pages = parsePageRange(rotateCustomPages, totalPages);
        pages.forEach((p) => targetIndices.push(p - 1));
      }

      targetIndices.forEach((idx) => {
        const page = pdfDoc.getPage(idx);
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees(currentRotation + rotationAngle));
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setResultPdfUrl(url);
      setResultPdfName(`rotated_${singlePdf.name}`);
      setSuccessMsg(`Successfully rotated ${targetIndices.length} pages by ${rotationAngle}°!`);
    } catch (err: any) {
      setError(err.message || 'Failed to rotate PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Watermark Handler
  const handleApplyWatermark = async () => {
    if (!singlePdf) {
      setError('Please upload a PDF document first.');
      return;
    }
    if (!watermarkText.trim()) {
      setError('Please enter watermark text.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const pdfDoc = await PDFDocument.load(singlePdf.arrayBuffer);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();

      let colorRgb = rgb(0.85, 0.1, 0.1); // red
      if (watermarkColor === 'gray') colorRgb = rgb(0.4, 0.4, 0.4);
      if (watermarkColor === 'blue') colorRgb = rgb(0.1, 0.3, 0.8);
      if (watermarkColor === 'black') colorRgb = rgb(0, 0, 0);

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(watermarkText, watermarkSize);
        const textHeight = font.heightAtSize(watermarkSize);

        // Center calculation
        const centerX = width / 2 - (textWidth / 2) * Math.cos((watermarkAngle * Math.PI) / 180);
        const centerY = height / 2 - (textHeight / 2) * Math.sin((watermarkAngle * Math.PI) / 180);

        page.drawText(watermarkText, {
          x: Math.max(20, width / 2 - textWidth / 2),
          y: Math.max(20, height / 2 - textHeight / 2),
          size: watermarkSize,
          font,
          color: colorRgb,
          opacity: watermarkOpacity,
          rotate: degrees(watermarkAngle)
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setResultPdfUrl(url);
      setResultPdfName(`watermarked_${singlePdf.name}`);
      setSuccessMsg(`Applied watermark "${watermarkText}" across all ${pages.length} pages!`);
    } catch (err: any) {
      setError(err.message || 'Failed to apply watermark.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Page Numbers Handler
  const handleApplyPageNumbers = async () => {
    if (!singlePdf) {
      setError('Please upload a PDF document first.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const pdfDoc = await PDFDocument.load(singlePdf.arrayBuffer);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const total = pages.length;

      pages.forEach((page, i) => {
        const pageNum = i + 1;
        const { width, height } = page.getSize();

        let numStr = `Page ${pageNum} of ${total}`;
        if (pageNumberFormat === 'x_of_y') numStr = `${pageNum} / ${total}`;
        if (pageNumberFormat === 'just_x') numStr = `${pageNum}`;

        const textWidth = font.widthOfTextAtSize(numStr, pageNumberSize);

        let posX = width / 2 - textWidth / 2;
        let posY = 25;

        if (pageNumberPosition === 'bottom-right') {
          posX = width - textWidth - 30;
          posY = 25;
        } else if (pageNumberPosition === 'top-right') {
          posX = width - textWidth - 30;
          posY = height - 30;
        }

        page.drawText(numStr, {
          x: posX,
          y: posY,
          size: pageNumberSize,
          font,
          color: rgb(0.3, 0.3, 0.3)
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setResultPdfUrl(url);
      setResultPdfName(`numbered_${singlePdf.name}`);
      setSuccessMsg(`Added page numbering (${pageNumberFormat}) to all ${total} pages!`);
    } catch (err: any) {
      setError(err.message || 'Failed to add page numbers.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to parse page range strings (e.g. "1-3, 5, 7-9")
  const parsePageRange = (str: string, maxPages: number): number[] => {
    const set = new Set<number>();
    const parts = str.split(',').map((s) => s.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-').map((s) => s.trim());
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const min = Math.max(1, Math.min(start, end));
          const max = Math.min(maxPages, Math.max(start, end));
          for (let p = min; p <= max; p++) set.add(p);
        }
      } else {
        const num = parseInt(part, 10);
        if (!isNaN(num) && num >= 1 && num <= maxPages) {
          set.add(num);
        }
      }
    }
    return Array.from(set).sort((a, b) => a - b);
  };

  // File upload handlers
  const handleMergeFilesAdded = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles: PdfFileItem[] = [];

    for (let i = 0; i < e.target.files.length; i++) {
      const f = e.target.files[i];
      if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
        try {
          const ab = await f.arrayBuffer();
          const doc = await PDFDocument.load(ab);
          newFiles.push({
            id: 'merge_' + Date.now() + '_' + i,
            file: f,
            name: f.name,
            pageCount: doc.getPageCount(),
            arrayBuffer: ab
          });
        } catch {
          // ignore corrupted
        }
      }
    }
    setMergeFiles((prev) => [...prev, ...newFiles]);
    setError(null);
  };

  const handleSingleFileAdded = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      try {
        const ab = await f.arrayBuffer();
        const doc = await PDFDocument.load(ab);
        const count = doc.getPageCount();
        setSinglePdf({
          id: 'single_' + Date.now(),
          file: f,
          name: f.name,
          pageCount: count,
          arrayBuffer: ab
        });
        setSplitRange(count > 1 ? `1-${Math.min(2, count)}` : '1');
        setError(null);
        setResultPdfUrl(null);
      } catch (err: any) {
        setError('Failed to open PDF document. File may be encrypted or corrupted.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <FileText className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">PDF Editor Suite</h2>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Merge multiple files, split pages, rotate layout, add watermark stamps, and insert page numbers locally.
          </p>
        </div>

        {/* Demo buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeMode === 'merge' ? (
            <button
              type="button"
              onClick={loadSampleForMerge}
              className="text-xs text-red-400 hover:text-red-300 font-medium px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-800/40 hover:bg-red-900/40 transition-colors flex items-center gap-1.5"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Load 2 Sample PDFs 📑</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={loadSampleForSingle}
              className="text-xs text-red-400 hover:text-red-300 font-medium px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-800/40 hover:bg-red-900/40 transition-colors flex items-center gap-1.5"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Load Sample PDF 📄</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode navigation tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'merge', label: 'Merge PDFs', icon: Layers, color: 'text-indigo-400' },
          { id: 'split', label: 'Split & Extract Pages', icon: Scissors, color: 'text-cyan-400' },
          { id: 'rotate', label: 'Rotate Pages', icon: RotateCw, color: 'text-amber-400' },
          { id: 'watermark', label: 'Watermark Stamp', icon: Stamp, color: 'text-rose-400' },
          { id: 'pagenum', label: 'Page Numbering', icon: Hash, color: 'text-emerald-400' }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeMode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveMode(tab.id as any);
                setError(null);
                setSuccessMsg(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-red-600/20 text-white border border-red-500/40 shadow-lg shadow-red-500/10'
                  : 'bg-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/10 border border-white/5'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? tab.color : 'text-gray-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Mode Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configuration & Inputs */}
        <div className="lg:col-span-1 space-y-4">
          {activeMode === 'merge' ? (
            /* Merge Mode File List */
            <div className="bg-[#121826]/80 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  PDF Merge Queue ({mergeFiles.length})
                </span>
                <input
                  ref={mergeFileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  multiple
                  onChange={handleMergeFilesAdded}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => mergeFileInputRef.current?.click()}
                  className="text-xs text-indigo-300 hover:text-white px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add PDFs</span>
                </button>
              </div>

              {mergeFiles.length === 0 ? (
                <div
                  onClick={() => mergeFileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/15 hover:border-indigo-500/50 rounded-xl p-6 text-center cursor-pointer bg-black/20 hover:bg-indigo-950/10 transition-colors"
                >
                  <Upload className="w-8 h-8 mx-auto text-indigo-400 mb-2" />
                  <p className="text-xs font-semibold text-gray-200">Click or drag multiple PDF files here</p>
                  <p className="text-[11px] text-gray-500 mt-1">Combine reports, scans, invoices into one document</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-auto pr-1">
                  {mergeFiles.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-black/40 border border-white/10 p-2.5 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="w-5 h-5 rounded bg-white/10 text-gray-300 font-mono text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <p className="font-semibold text-gray-200 truncate">{item.name}</p>
                          <span className="text-[10px] text-gray-400">{item.pageCount} pages</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMergeFiles((prev) => prev.filter((f) => f.id !== item.id))}
                        className="text-gray-500 hover:text-rose-400 p-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleMergePdf}
                disabled={mergeFiles.length < 2 || isProcessing}
                className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  mergeFiles.length < 2 || isProcessing
                    ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                    : 'bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white shadow-lg shadow-red-500/25 active:scale-98'
                }`}
              >
                {isProcessing ? 'Merging PDF Documents...' : `Merge ${mergeFiles.length} PDFs into One`}
              </button>
            </div>
          ) : (
            /* Single PDF File Selector + Mode Controls */
            <div className="bg-[#121826]/80 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  Target PDF File
                </span>
                <input
                  ref={singleFileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleSingleFileAdded}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => singleFileInputRef.current?.click()}
                  className="text-xs text-red-300 hover:text-white px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 flex items-center gap-1 transition-colors"
                >
                  <Upload className="w-3 h-3" />
                  <span>Choose PDF</span>
                </button>
              </div>

              {singlePdf ? (
                <div className="bg-black/40 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white truncate max-w-[200px]">{singlePdf.name}</p>
                    <span className="text-[11px] text-gray-400 font-mono">{singlePdf.pageCount} Pages Loaded</span>
                  </div>
                  <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 font-bold">
                    READY
                  </span>
                </div>
              ) : (
                <div
                  onClick={() => singleFileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/15 hover:border-red-500/50 rounded-xl p-5 text-center cursor-pointer bg-black/20 hover:bg-red-950/10 transition-colors"
                >
                  <FileText className="w-7 h-7 mx-auto text-red-400 mb-2" />
                  <p className="text-xs font-semibold text-gray-200">Upload a PDF to edit</p>
                </div>
              )}

              {/* Mode Specific Controls */}
              {activeMode === 'split' && (
                <div className="space-y-3 pt-2 border-t border-white/5 text-xs">
                  <div>
                    <label className="text-gray-400 block mb-1 font-medium">Page Range to Extract:</label>
                    <input
                      type="text"
                      value={splitRange}
                      onChange={(e) => setSplitRange(e.target.value)}
                      placeholder="e.g. 1-3, 5, 8-10"
                      className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white font-mono"
                    />
                    <span className="text-[11px] text-gray-500 mt-1 block">
                      Enter page numbers or ranges separated by commas.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSplitPdf}
                    disabled={!singlePdf || isProcessing}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg transition-all disabled:opacity-50"
                  >
                    Extract Selected Pages
                  </button>
                </div>
              )}

              {activeMode === 'rotate' && (
                <div className="space-y-3 pt-2 border-t border-white/5 text-xs">
                  <div>
                    <label className="text-gray-400 block mb-1 font-medium">Rotation Angle:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[90, 180, 270].map((deg) => (
                        <button
                          key={deg}
                          type="button"
                          onClick={() => setRotationAngle(deg)}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            rotationAngle === deg
                              ? 'bg-amber-500 text-black'
                              : 'bg-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          {deg}° CW
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400 block mb-1 font-medium">Target Pages:</label>
                    <div className="flex items-center gap-3 mb-2">
                      <label className="flex items-center gap-1.5 cursor-pointer text-gray-300">
                        <input
                          type="radio"
                          name="rotate_target"
                          checked={rotateTargetPages === 'all'}
                          onChange={() => setRotateTargetPages('all')}
                          className="accent-amber-500"
                        />
                        <span>All Pages</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-gray-300">
                        <input
                          type="radio"
                          name="rotate_target"
                          checked={rotateTargetPages === 'custom'}
                          onChange={() => setRotateTargetPages('custom')}
                          className="accent-amber-500"
                        />
                        <span>Specific Pages</span>
                      </label>
                    </div>

                    {rotateTargetPages === 'custom' && (
                      <input
                        type="text"
                        value={rotateCustomPages}
                        onChange={(e) => setRotateCustomPages(e.target.value)}
                        placeholder="e.g. 1, 3, 5"
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white font-mono text-xs"
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleRotatePdf}
                    disabled={!singlePdf || isProcessing}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-lg transition-all disabled:opacity-50"
                  >
                    Apply Rotation ({rotationAngle}°)
                  </button>
                </div>
              )}

              {activeMode === 'watermark' && (
                <div className="space-y-3 pt-2 border-t border-white/5 text-xs">
                  <div>
                    <label className="text-gray-400 block mb-1 font-medium">Watermark Stamp Text:</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="e.g. CONFIDENTIAL"
                      className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-gray-400 block mb-1">Color:</label>
                      <select
                        value={watermarkColor}
                        onChange={(e) => setWatermarkColor(e.target.value as any)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-1.5 text-white"
                      >
                        <option value="red">Red</option>
                        <option value="gray">Gray</option>
                        <option value="blue">Blue</option>
                        <option value="black">Black</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-400 block mb-1">Font Size ({watermarkSize}px):</label>
                      <input
                        type="range"
                        min={20}
                        max={80}
                        value={watermarkSize}
                        onChange={(e) => setWatermarkSize(parseInt(e.target.value))}
                        className="w-full accent-rose-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-gray-400 block mb-1">Opacity ({Math.round(watermarkOpacity * 100)}%):</label>
                      <input
                        type="range"
                        min={0.1}
                        max={1}
                        step={0.05}
                        value={watermarkOpacity}
                        onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                        className="w-full accent-rose-500"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 block mb-1">Angle ({watermarkAngle}°):</label>
                      <input
                        type="range"
                        min={0}
                        max={90}
                        step={5}
                        value={watermarkAngle}
                        onChange={(e) => setWatermarkAngle(parseInt(e.target.value))}
                        className="w-full accent-rose-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyWatermark}
                    disabled={!singlePdf || isProcessing}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition-all disabled:opacity-50"
                  >
                    Stamp Watermark on All Pages
                  </button>
                </div>
              )}

              {activeMode === 'pagenum' && (
                <div className="space-y-3 pt-2 border-t border-white/5 text-xs">
                  <div>
                    <label className="text-gray-400 block mb-1 font-medium">Position:</label>
                    <select
                      value={pageNumberPosition}
                      onChange={(e) => setPageNumberPosition(e.target.value as any)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg p-1.5 text-white"
                    >
                      <option value="bottom-center">Bottom Center</option>
                      <option value="bottom-right">Bottom Right</option>
                      <option value="top-right">Top Right</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-400 block mb-1 font-medium">Format:</label>
                    <select
                      value={pageNumberFormat}
                      onChange={(e) => setPageNumberFormat(e.target.value as any)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg p-1.5 text-white"
                    >
                      <option value="page_x_of_y">Page X of Y (e.g. Page 1 of 10)</option>
                      <option value="x_of_y">X / Y (e.g. 1 / 10)</option>
                      <option value="just_x">Number only (e.g. 1)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyPageNumbers}
                    disabled={!singlePdf || isProcessing}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all disabled:opacity-50"
                  >
                    Insert Page Numbers
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Feedback alerts */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Right: Output & Live PDF Viewer */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#121826]/80 border border-white/10 rounded-2xl p-4 flex flex-col min-h-[460px]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-bold text-gray-200">
                  {resultPdfUrl ? 'Resulting Modified PDF Output:' : 'PDF Document Viewer / Output Preview:'}
                </span>
              </div>

              {resultPdfUrl && (
                <a
                  href={resultPdfUrl}
                  download={resultPdfName}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-transform hover:scale-105"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Result (.pdf)</span>
                </a>
              )}
            </div>

            {resultPdfUrl ? (
              <div className="flex-1 w-full bg-black/60 rounded-xl overflow-hidden border border-white/10 min-h-[400px]">
                <iframe
                  src={resultPdfUrl}
                  title="PDF Preview"
                  className="w-full h-full min-h-[400px] border-none rounded-xl"
                />
              </div>
            ) : singlePdf ? (
              <div className="flex-1 w-full bg-black/60 rounded-xl overflow-hidden border border-white/10 min-h-[400px]">
                <iframe
                  src={URL.createObjectURL(new Blob([singlePdf.arrayBuffer], { type: 'application/pdf' }))}
                  title="Original PDF Preview"
                  className="w-full h-full min-h-[400px] border-none rounded-xl"
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500 space-y-3">
                <FileText className="w-12 h-12 stroke-1 text-gray-600" />
                <p className="text-sm font-semibold text-gray-300">No PDF Document Processed Yet</p>
                <p className="text-xs text-gray-400 max-w-sm">
                  Upload PDF files on the left or click the demo buttons above to merge, split, rotate, or stamp watermarks.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
