"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import {
  ScanLine,
  Camera,
  Upload,
  Download,
  Copy,
  Trash2,
  VideoOff,
  Check,
  FileSpreadsheet,
  Volume2,
  VolumeX,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface ScanRow {
  id: string;
  value: string;
  format: string;
  source: "camera" | "image";
  fileName?: string;
  scannedAt: string;
  count: number;
  note: string;
}

// 2D codes are square-ish, 1D codes are rectangular strips — used for the type chip.
const TWO_D_FORMATS = new Set(["QR_CODE", "DATA_MATRIX", "AZTEC", "PDF_417", "MAXICODE"]);

const CSV_COLUMNS = ["#", "Value", "Format", "Type", "Source", "File", "Scanned At", "Count", "Note"];

function formatLabel(format: string) {
  return format.replace(/_/g, "-");
}

function codeShape(format: string) {
  return TWO_D_FORMATS.has(format) ? "2D (square)" : "1D (rectangle)";
}

// Quote every field, escape embedded quotes, and neutralise spreadsheet formula injection.
function csvCell(value: string | number) {
  const raw = String(value ?? "");
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

function buildCsv(rows: ScanRow[]) {
  const lines = [CSV_COLUMNS.map(csvCell).join(",")];
  rows.forEach((row, i) => {
    lines.push(
      [
        i + 1,
        row.value,
        formatLabel(row.format),
        codeShape(row.format),
        row.source,
        row.fileName ?? "",
        row.scannedAt,
        row.count,
        row.note,
      ]
        .map(csvCell)
        .join(",")
    );
  });
  return lines.join("\r\n");
}

export default function BarcodeTool() {
  const [rows, setRows] = useState<ScanRow[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [dedupe, setDedupe] = useState(true);
  const [beep, setBeep] = useState(true);
  const [isDecodingFiles, setIsDecodingFiles] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("camera");

  const videoRef = useRef<HTMLVideoElement>(null);
  const laserRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const readerRef = useRef<any>(null);
  const dedupeRef = useRef(dedupe);
  const beepRef = useRef(beep);

  useEffect(() => {
    dedupeRef.current = dedupe;
  }, [dedupe]);
  useEffect(() => {
    beepRef.current = beep;
  }, [beep]);

  // --- Lazy loaded ZXing reader (keeps the decoder out of the initial bundle) ---
  const getReader = useCallback(async () => {
    if (readerRef.current) return readerRef.current;
    const { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } = await import("@zxing/library");

    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.AZTEC,
      BarcodeFormat.PDF_417,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_93,
      BarcodeFormat.CODABAR,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.ITF,
      // GS1 DataBar — ZXing logs an "not ready for production" warning for RSS Expanded; accepted.
      BarcodeFormat.RSS_14,
      BarcodeFormat.RSS_EXPANDED,
    ]);

    readerRef.current = new BrowserMultiFormatReader(hints, 300);
    return readerRef.current;
  }, []);

  const playBeep = useCallback(() => {
    if (!beepRef.current) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = 1180;
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
      osc.onended = () => ctx.close();
    } catch {
      /* audio is a nicety — ignore failures */
    }
  }, []);

  const addResult = useCallback(
    (value: string, format: string, source: ScanRow["source"], fileName?: string) => {
      let wasDuplicate = false;

      setRows((prev) => {
        if (dedupeRef.current) {
          const existing = prev.find((r) => r.value === value && r.format === format);
          if (existing) {
            wasDuplicate = true;
            return prev.map((r) =>
              r.id === existing.id
                ? { ...r, count: r.count + 1, scannedAt: new Date().toISOString() }
                : r
            );
          }
        }
        return [
          ...prev,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            value,
            format,
            source,
            fileName,
            scannedAt: new Date().toISOString(),
            count: 1,
            note: "",
          },
        ];
      });

      playBeep();
      return wasDuplicate;
    },
    [playBeep]
  );

  // --- Camera device list ---
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        setCameras(videoDevices);
        if (videoDevices.length > 0) setSelectedCameraId((prev) => prev || videoDevices[0].deviceId);
      })
      .catch(() => {
        /* device labels need permission — list fills in after the first grant */
      });
  }, [isCameraActive]);

  const startLaser = () => {
    if (!laserRef.current) return;
    gsap.killTweensOf(laserRef.current);
    gsap.fromTo(
      laserRef.current,
      { yPercent: 0, opacity: 0.85 },
      { yPercent: 300, opacity: 0.85, duration: 2.2, repeat: -1, yoyo: true, ease: "sine.inOut" }
    );
  };

  const stopLaser = () => {
    if (laserRef.current) gsap.killTweensOf(laserRef.current);
  };

  const stopCamera = useCallback(() => {
    setIsCameraActive(false);
    stopLaser();
    if (readerRef.current) {
      readerRef.current.reset();
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // ZXing returns a numeric BarcodeFormat enum; map it back to its name.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatNameOf = (result: any): string => {
    const raw = result?.getBarcodeFormat?.();
    if (typeof raw === "string") return raw;
    return BARCODE_FORMAT_NAMES[raw as number] ?? "UNKNOWN";
  };

  const startCamera = async () => {
    if (isCameraActive) return;
    try {
      const reader = await getReader();
      // Release any previous stream before ZXing attaches and plays a new one.
      reader.reset();
      setIsCameraActive(true);
      startLaser();

      await reader.decodeFromVideoDevice(
        selectedCameraId || null,
        videoRef.current,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (result: any) => {
          if (result) {
            const formatName = formatNameOf(result);
            const wasDup = addResult(result.getText(), formatName, "camera");
            if (!wasDup) toast.success(`Scanned ${formatLabel(formatName)}`);
          }
          // NotFoundException fires on every empty frame — expected, ignore it.
        }
      );
      toast.success("Scanner active - hold a barcode or QR code in view");
    } catch (err) {
      console.error(err);
      stopCamera();
      toast.error("Could not access camera. Check browser permissions.");
    }
  };

  // --- Image decoding ---
  const decodeFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setIsDecodingFiles(true);

    const reader = await getReader();
    let found = 0;

    for (const file of files) {
      const url = URL.createObjectURL(file);
      try {
        const result = await reader.decodeFromImageUrl(url);
        addResult(result.getText(), formatNameOf(result), "image", file.name);
        found += 1;
      } catch {
        toast.error(`No code found in ${file.name}`);
      } finally {
        URL.revokeObjectURL(url);
      }
    }

    setIsDecodingFiles(false);
    if (found > 0) toast.success(`Decoded ${found} of ${files.length} image${files.length > 1 ? "s" : ""}`);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    decodeFiles(files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files ?? []).filter((f) => f.type.startsWith("image/"));
    decodeFiles(files);
  };

  // --- Table actions ---
  const updateNote = (id: string, note: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, note } : r)));
  };

  const deleteRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const clearRows = () => {
    setRows([]);
    toast.success("Scan list cleared");
  };

  const copyValue = (row: ScanRow) => {
    navigator.clipboard.writeText(row.value);
    setCopiedId(row.id);
    setTimeout(() => setCopiedId(null), 1400);
  };

  const downloadCsv = () => {
    if (rows.length === 0) {
      toast.error("Nothing to export yet");
      return;
    }
    // UTF-8 BOM keeps accented characters readable in Excel.
    const blob = new Blob(["﻿" + buildCsv(rows)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `barcode-scans-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} row${rows.length > 1 ? "s" : ""} to CSV`);
  };

  const copyCsv = () => {
    if (rows.length === 0) {
      toast.error("Nothing to copy yet");
      return;
    }
    navigator.clipboard.writeText(buildCsv(rows));
    toast.success("CSV copied to clipboard");
  };

  // Stop the camera when leaving the scanner tab or unmounting.
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value !== "camera" && isCameraActive) stopCamera();
  };

  useEffect(() => {
    return () => {
      if (readerRef.current) readerRef.current.reset();
    };
  }, []);

  const totalScans = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-zinc-900/60 border border-zinc-800">
          <TabsTrigger value="camera" className="data-[state=active]:bg-zinc-800">
            <Camera className="w-4 h-4 mr-2" /> Camera Scan
          </TabsTrigger>
          <TabsTrigger value="image" className="data-[state=active]:bg-zinc-800">
            <Upload className="w-4 h-4 mr-2" /> Image Upload
          </TabsTrigger>
        </TabsList>

        {/* CAMERA */}
        <TabsContent value="camera" className="mt-4">
          <Card className="bg-zinc-950/40 border-zinc-900">
            <CardHeader>
              <CardTitle className="text-zinc-100 text-base flex items-center gap-2">
                <ScanLine className="w-4 h-4 text-fuchsia-400" /> Live Barcode Scanner
              </CardTitle>
              <CardDescription className="text-zinc-500">
                Scans 1D barcodes (EAN, UPC, Code 128, Code 39, ITF, Codabar) and 2D codes (QR, Data Matrix, Aztec, PDF417). Every hit is appended to the table below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs text-zinc-400">Camera</Label>
                  <Select
                    value={selectedCameraId}
                    onValueChange={(v) => {
                      setSelectedCameraId((v as string) ?? "");
                      if (isCameraActive) stopCamera();
                    }}
                  >
                    <SelectTrigger className="bg-zinc-900/60 border-zinc-800 text-zinc-200">
                      <SelectValue placeholder="Default camera" />
                    </SelectTrigger>
                    <SelectContent>
                      {cameras.map((cam, i) => (
                        <SelectItem key={cam.deviceId || i} value={cam.deviceId}>
                          {cam.label || `Camera ${i + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isCameraActive ? (
                  <Button onClick={stopCamera} variant="destructive">
                    <VideoOff className="w-4 h-4 mr-2" /> Stop
                  </Button>
                ) : (
                  <Button onClick={startCamera} className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white">
                    <Camera className="w-4 h-4 mr-2" /> Start Scanner
                  </Button>
                )}
              </div>

              <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-zinc-800 bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                {isCameraActive ? (
                  <>
                    <div className="absolute inset-8 border-2 border-fuchsia-400/40 rounded-lg pointer-events-none" />
                    <div
                      ref={laserRef}
                      className="absolute left-8 right-8 top-8 h-0.5 bg-fuchsia-400 shadow-[0_0_12px_2px_rgba(232,121,249,0.8)] pointer-events-none"
                    />
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 gap-2">
                    <ScanLine className="w-8 h-8" />
                    <p className="text-xs">Scanner idle</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dedupe}
                    onChange={(e) => setDedupe(e.target.checked)}
                    className="accent-fuchsia-500"
                  />
                  <Layers className="w-3.5 h-3.5" /> Merge duplicates (count instead of new row)
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={beep}
                    onChange={(e) => setBeep(e.target.checked)}
                    className="accent-fuchsia-500"
                  />
                  {beep ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />} Beep on scan
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* IMAGE */}
        <TabsContent value="image" className="mt-4">
          <Card className="bg-zinc-950/40 border-zinc-900">
            <CardHeader>
              <CardTitle className="text-zinc-100 text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-fuchsia-400" /> Decode From Images
              </CardTitle>
              <CardDescription className="text-zinc-500">
                Drop one or many images (PNG, JPG, WEBP, GIF, BMP). Each decoded code becomes a row in the table.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-800 rounded-xl p-10 text-center cursor-pointer hover:border-fuchsia-500/50 hover:bg-fuchsia-500/5 transition-colors"
              >
                <Upload className="w-7 h-7 mx-auto text-zinc-600 mb-3" />
                <p className="text-sm text-zinc-300">
                  {isDecodingFiles ? "Decoding..." : "Drop images here or click to browse"}
                </p>
                <p className="text-[11px] text-zinc-600 mt-1">Multiple files supported - decoded fully in your browser</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* RESULTS TABLE */}
      <Card className="bg-zinc-950/40 border-zinc-900">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-zinc-100 text-base flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Scanned Data
            </CardTitle>
            <CardDescription className="text-zinc-500">
              {rows.length} unique code{rows.length === 1 ? "" : "s"} - {totalScans} total scan{totalScans === 1 ? "" : "s"}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyCsv}
              className="border-zinc-800 text-zinc-300"
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy CSV
            </Button>
            <Button
              size="sm"
              onClick={downloadCsv}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Download CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearRows}
              className="text-zinc-500 hover:text-rose-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-zinc-600 py-8 text-center">
              No codes scanned yet. Start the camera or drop an image to build your CSV.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-900">
                    <TableHead className="text-zinc-500 w-10">#</TableHead>
                    <TableHead className="text-zinc-500">Value</TableHead>
                    <TableHead className="text-zinc-500">Format</TableHead>
                    <TableHead className="text-zinc-500">Source</TableHead>
                    <TableHead className="text-zinc-500">Scanned At</TableHead>
                    <TableHead className="text-zinc-500 w-14">Qty</TableHead>
                    <TableHead className="text-zinc-500">Note</TableHead>
                    <TableHead className="text-zinc-500 w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={row.id} className="border-zinc-900">
                      <TableCell className="text-zinc-600 text-xs">{i + 1}</TableCell>
                      <TableCell className="font-mono text-xs text-zinc-200 max-w-55 truncate" title={row.value}>
                        {row.value}
                      </TableCell>
                      <TableCell>
                        <span className="text-[10px] px-2 py-0.5 rounded border border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-300 whitespace-nowrap">
                          {formatLabel(row.format)}
                        </span>
                        <span className="block text-[9px] text-zinc-600 mt-0.5">{codeShape(row.format)}</span>
                      </TableCell>
                      <TableCell className="text-xs text-zinc-400">
                        {row.source === "image" ? row.fileName || "image" : "camera"}
                      </TableCell>
                      <TableCell className="text-[11px] text-zinc-500 whitespace-nowrap">
                        {new Date(row.scannedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-300">{row.count}</TableCell>
                      <TableCell>
                        <Input
                          value={row.note}
                          onChange={(e) => updateNote(row.id, e.target.value)}
                          placeholder="Add note"
                          className="h-7 text-xs bg-zinc-900/60 border-zinc-800"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-500 hover:text-emerald-400"
                            onClick={() => copyValue(row)}
                            aria-label="Copy value"
                          >
                            {copiedId === row.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-500 hover:text-rose-400"
                            onClick={() => deleteRow(row.id)}
                            aria-label="Delete row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ZXing BarcodeFormat enum index -> name
const BARCODE_FORMAT_NAMES: Record<number, string> = {
  0: "AZTEC",
  1: "CODABAR",
  2: "CODE_39",
  3: "CODE_93",
  4: "CODE_128",
  5: "DATA_MATRIX",
  6: "EAN_8",
  7: "EAN_13",
  8: "ITF",
  9: "MAXICODE",
  10: "PDF_417",
  11: "QR_CODE",
  12: "RSS_14",
  13: "RSS_EXPANDED",
  14: "UPC_A",
  15: "UPC_E",
  16: "UPC_EAN_EXTENSION",
};
