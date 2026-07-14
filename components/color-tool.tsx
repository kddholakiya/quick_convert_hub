"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  Palette,
  Droplet,
  Copy,
  Check,
  Trash2,
  Upload,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  Hash,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Color conversion utilities
interface RGB { r: number; g: number; b: number; }
interface HSL { h: number; s: number; l: number; }
interface CMYK { c: number; m: number; y: number; k: number; }

function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function isSameRgb(a: RGB, b: RGB): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b;
}

function hslToRgb(h: number, s: number, l: number): RGB {
  h /= 360; s /= 100; l /= 100;
  let r = 0, g = 0, b = 0;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function rgbToCmyk(r: number, g: number, b: number): CMYK {
  const c = 1 - (r / 255);
  const m = 1 - (g / 255);
  const y = 1 - (b / 255);
  const k = Math.min(c, Math.min(m, y));

  return {
    c: Math.round((c - k) / (1 - k) * 100) || 0,
    m: Math.round((m - k) / (1 - k) * 100) || 0,
    y: Math.round((y - k) / (1 - k) * 100) || 0,
    k: Math.round(k * 100)
  };
}

function cmykToRgb(c: number, m: number, y: number, k: number): RGB {
  const cNorm = c / 100;
  const mNorm = m / 100;
  const yNorm = y / 100;
  const kNorm = k / 100;

  const r = 255 * (1 - cNorm) * (1 - kNorm);
  const g = 255 * (1 - mNorm) * (1 - kNorm);
  const b = 255 * (1 - yNorm) * (1 - kNorm);

  return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
}

// Extract dominant colors from image
function extractColorsFromImage(imageData: ImageData, colorCount: number = 6): string[] {
  const { data } = imageData;
  const colorMap: Map<string, number> = new Map();
  
  // Sample every 10th pixel for performance
  for (let i = 0; i < data.length; i += 40) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // Skip transparent pixels
    if (a < 128) continue;
    
    // Quantize colors to reduce noise
    const quantizedR = Math.round(r / 32) * 32;
    const quantizedG = Math.round(g / 32) * 32;
    const quantizedB = Math.round(b / 32) * 32;
    
    const key = `${quantizedR},${quantizedG},${quantizedB}`;
    colorMap.set(key, (colorMap.get(key) || 0) + 1);
  }
  
  // Sort by frequency and get top colors
  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, colorCount)
    .map(([color]) => {
      const [r, g, b] = color.split(",").map(Number);
      return rgbToHex(r, g, b);
    });
  
  return sortedColors;
}

const PRESET_COLORS = [
  { name: "Red", hex: "#ef4444" },
  { name: "Orange", hex: "#f97316" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Green", hex: "#22c55e" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Teal", hex: "#14b8a6" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Sky", hex: "#0ea5e9" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Indigo", hex: "#6366f1" },
  { name: "Violet", hex: "#8b5cf6" },
  { name: "Purple", hex: "#a855f7" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Slate", hex: "#64748b" },
  { name: "White", hex: "#ffffff" },
  { name: "Black", hex: "#000000" },
];

export default function ColorTool() {
  const [hexInput, setHexInput] = useState("");
  const [rgbInput, setRgbInput] = useState({ r: 0, g: 0, b: 0 });
  const [hslInput, setHslInput] = useState({ h: 0, s: 0, l: 0 });
  const [cmykInput, setCmykInput] = useState({ c: 0, m: 0, y: 0, k: 0 });
  const [currentColor, setCurrentColor] = useState<RGB>({ r: 100, g: 149, b: 237 }); // Default cornflower blue
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorPickerRef = useRef<HTMLInputElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll(".animate-fade-in"),
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
      );
    }
  }, []);

  // Update all color formats when current color changes
  useEffect(() => {
    // 1. Update HEX input if the parsed value doesn't match current color
    const hexClean = hexInput.replace("#", "").trim();
    let currentHexRgb: RGB | null = null;
    if (/^[0-9A-Fa-f]{6}$/.test(hexClean)) {
      currentHexRgb = hexToRgb("#" + hexClean);
    } else if (/^[0-9A-Fa-f]{3}$/.test(hexClean)) {
      const expanded = hexClean.split("").map(char => char + char).join("");
      currentHexRgb = hexToRgb("#" + expanded);
    }

    if (!currentHexRgb || !isSameRgb(currentHexRgb, currentColor)) {
      const hex = rgbToHex(currentColor.r, currentColor.g, currentColor.b);
      setHexInput(hex);
    }

    // 2. Update RGB input if it doesn't match current color
    if (!isSameRgb(rgbInput, currentColor)) {
      setRgbInput(currentColor);
    }

    // 3. Update HSL input if it doesn't match current color
    const currentHslRgb = hslToRgb(hslInput.h, hslInput.s, hslInput.l);
    if (!isSameRgb(currentHslRgb, currentColor)) {
      const hsl = rgbToHsl(currentColor.r, currentColor.g, currentColor.b);
      setHslInput(hsl);
    }

    // 4. Update CMYK input if it doesn't match current color
    const currentCmykRgb = cmykToRgb(cmykInput.c, cmykInput.m, cmykInput.y, cmykInput.k);
    if (!isSameRgb(currentCmykRgb, currentColor)) {
      const cmyk = rgbToCmyk(currentColor.r, currentColor.g, currentColor.b);
      setCmykInput(cmyk);
    }
  }, [currentColor]);

  // Handle HEX input
  const handleHexChange = (value: string) => {
    const cleanHex = value.replace("#", "").trim();
    setHexInput(value);

    if (/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
      const rgb = hexToRgb("#" + cleanHex);
      if (rgb) setCurrentColor(rgb);
    } else if (/^[0-9A-Fa-f]{3}$/.test(cleanHex)) {
      const expandedHex = cleanHex.split("").map(char => char + char).join("");
      const rgb = hexToRgb("#" + expandedHex);
      if (rgb) setCurrentColor(rgb);
    }
  };

  // Handle RGB input
  const handleRgbChange = (channel: keyof RGB, value: number) => {
    const clamped = Math.max(0, Math.min(255, value));
    const newRgb = { ...rgbInput, [channel]: clamped };
    setRgbInput(newRgb);
    setCurrentColor(newRgb);
  };

  // Handle HSL input
  const handleHslChange = (channel: keyof HSL, value: number) => {
    const clampedValue = channel === "h" 
      ? Math.max(0, Math.min(360, value)) 
      : Math.max(0, Math.min(100, value));
    const newHsl = { ...hslInput, [channel]: clampedValue };
    setHslInput(newHsl);
    const rgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    setCurrentColor(rgb);
  };

  // Handle CMYK input
  const handleCmykChange = (channel: keyof CMYK, value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    const newCmyk = { ...cmykInput, [channel]: clamped };
    setCmykInput(newCmyk);
    const rgb = cmykToRgb(newCmyk.c, newCmyk.m, newCmyk.y, newCmyk.k);
    setCurrentColor(rgb);
  };

  // Handle image upload for color extraction
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setImageFile(file);
    setIsExtracting(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Resize image for performance
        const maxSize = 200;
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const colors = extractColorsFromImage(imageData);
        setExtractedColors(colors);
        setIsExtracting(false);
        toast.success("Colors extracted successfully!");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const copyToClipboard = (text: string, msg: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    toast.success(msg);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  const applyColor = (hex: string) => {
    const rgb = hexToRgb(hex);
    if (rgb) setCurrentColor(rgb);
  };

  const clearImage = () => {
    setImageFile(null);
    setExtractedColors([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div ref={containerRef} className="space-y-6">
      <Tabs defaultValue="converter" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 p-1.5 bg-zinc-950/60 border border-zinc-700 rounded-xl">
          <TabsTrigger
            value="converter"
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg data-active:bg-pink-500/10 data-active:text-pink-400 data-active:border-pink-500/20 font-medium min-w-0"
          >
            <Droplet className="w-4 h-4 shrink-0" />
            <span className="truncate">Color Converter</span>
          </TabsTrigger>
          <TabsTrigger
            value="palette"
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg data-active:bg-pink-500/10 data-active:text-pink-400 data-active:border-pink-500/20 font-medium min-w-0"
          >
            <Palette className="w-4 h-4 shrink-0" />
            <span className="truncate">Palette Generator</span>
          </TabsTrigger>
        </TabsList>

        {/* COLOR CONVERTER TAB */}
        <TabsContent value="converter" className="mt-0 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-6">
              <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
                
                <CardHeader>
                  <CardTitle className="text-zinc-50 flex items-center gap-2">
                    <Droplet className="w-5 h-5 text-pink-400" />
                    Color Space Converter
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Convert colors between HEX, RGB, HSL, and CMYK formats.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  {/* Color Preview / Native Picker */}
                  <div
                    onClick={() => colorPickerRef.current?.click()}
                    className="relative w-full h-24 rounded-xl border-2 border-zinc-700 shadow-lg cursor-pointer group overflow-hidden"
                    style={{ backgroundColor: rgbToHex(currentColor.r, currentColor.g, currentColor.b) }}
                  >
                    <input
                      ref={colorPickerRef}
                      type="color"
                      value={rgbToHex(currentColor.r, currentColor.g, currentColor.b)}
                      onChange={(e) => applyColor(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold text-white bg-black/50 px-2 py-1 rounded-md backdrop-blur-sm">
                        Click to pick a color
                      </span>
                    </div>
                  </div>

                  {/* Preset Swatches */}
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                      Presets
                    </Label>
                    <div className="grid grid-cols-9 gap-2">
                      {PRESET_COLORS.map((preset) => (
                        <button
                          key={preset.hex}
                          type="button"
                          title={preset.name}
                          onClick={() => applyColor(preset.hex)}
                          style={{ backgroundColor: preset.hex }}
                          className="aspect-square rounded-lg border border-zinc-700 hover:scale-110 hover:border-pink-400/60 transition-transform shadow-sm"
                        />
                      ))}
                    </div>
                  </div>

                  {/* HEX Input */}
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-pink-400" /> HEX
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">#</span>
                        <Input
                          value={hexInput.replace("#", "")}
                          onChange={(e) => handleHexChange(e.target.value)}
                          placeholder="RRGGBB"
                          className="bg-zinc-900/60 border-zinc-700 focus:border-pink-500/50 text-zinc-100 placeholder-zinc-600 pl-7 font-mono text-sm"
                        />
                      </div>
                      <Button
                        onClick={() => copyToClipboard(hexInput, "HEX copied!", "hex-main")}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3"
                      >
                        {copiedLabel === "hex-main" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* RGB Input */}
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">RGB</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { channel: "r" as keyof RGB, label: "R", max: 255 },
                        { channel: "g" as keyof RGB, label: "G", max: 255 },
                        { channel: "b" as keyof RGB, label: "B", max: 255 },
                      ].map(({ channel, label, max }) => (
                        <div key={channel} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-500 font-semibold">{label}</span>
                            <span className="text-[10px] text-pink-400 font-mono">{rgbInput[channel]}</span>
                          </div>
                          <Input
                            type="number"
                            min="0"
                            max={max}
                            value={rgbInput[channel]}
                            onChange={(e) => handleRgbChange(channel, parseInt(e.target.value) || 0)}
                            className="bg-zinc-900/60 border-zinc-700 focus:border-pink-500/50 text-zinc-100 font-mono text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* HSL Input */}
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">HSL</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { channel: "h" as keyof HSL, label: "H", max: 360, suffix: "°" },
                        { channel: "s" as keyof HSL, label: "S", max: 100, suffix: "%" },
                        { channel: "l" as keyof HSL, label: "L", max: 100, suffix: "%" },
                      ].map(({ channel, label, max, suffix }) => (
                        <div key={channel} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-500 font-semibold">{label}</span>
                            <span className="text-[10px] text-pink-400 font-mono">{hslInput[channel]}{suffix}</span>
                          </div>
                          <Input
                            type="number"
                            min="0"
                            max={max}
                            value={hslInput[channel]}
                            onChange={(e) => handleHslChange(channel, parseInt(e.target.value) || 0)}
                            className="bg-zinc-900/60 border-zinc-700 focus:border-pink-500/50 text-zinc-100 font-mono text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CMYK Input */}
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">CMYK</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { channel: "c" as keyof CMYK, label: "C" },
                        { channel: "m" as keyof CMYK, label: "M" },
                        { channel: "y" as keyof CMYK, label: "Y" },
                        { channel: "k" as keyof CMYK, label: "K" },
                      ].map(({ channel, label }) => (
                        <div key={channel} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-500 font-semibold">{label}</span>
                            <span className="text-[10px] text-pink-400 font-mono">{cmykInput[channel]}%</span>
                          </div>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={cmykInput[channel]}
                            onChange={(e) => handleCmykChange(channel, parseInt(e.target.value) || 0)}
                            className="bg-zinc-900/60 border-zinc-700 focus:border-pink-500/50 text-zinc-100 font-mono text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in">
                <CardHeader>
                  <CardTitle className="text-sm text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-pink-400" /> Quick Copy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "HEX", value: hexInput },
                    { label: "RGB", value: `rgb(${rgbInput.r}, ${rgbInput.g}, ${rgbInput.b})` },
                    { label: "HSL", value: `hsl(${hslInput.h}, ${hslInput.s}%, ${hslInput.l}%)` },
                    { label: "CMYK", value: `cmyk(${cmykInput.c}%, ${cmykInput.m}%, ${cmykInput.y}%, ${cmykInput.k}%)` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-2">
                      <div className="flex-1 bg-zinc-900/80 border border-zinc-700 rounded-lg p-2.5 font-mono text-zinc-300 text-xs break-all">
                        {value}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => copyToClipboard(value, `${label} copied!`, label)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 h-9 px-2 shrink-0"
                      >
                        {copiedLabel === label ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* PALETTE GENERATOR TAB */}
        <TabsContent value="palette" className="mt-0 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-6">
              <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
                
                <CardHeader>
                  <CardTitle className="text-zinc-50 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-pink-400" />
                    Extract Colors from Image
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Upload an image to extract its dominant colors.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {!imageFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all border-zinc-800 hover:border-pink-500/30 hover:bg-pink-500/[0.01] group"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      
                      <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800 group-hover:scale-110 group-hover:border-pink-500/30 transition-all mx-auto w-fit">
                        <Upload className="w-8 h-8 text-zinc-400 group-hover:text-pink-400 transition-colors" />
                      </div>

                      <div className="space-y-1 mt-4">
                        <p className="text-zinc-200 font-semibold">Upload an image</p>
                        <p className="text-xs text-zinc-500">to extract dominant colors</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80">
                        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-700">
                          <ImageIcon className="w-6 h-6 text-pink-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-zinc-200 font-semibold truncate text-sm">{imageFile.name}</p>
                          <p className="text-xs text-zinc-400">{(imageFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={clearImage}
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-full h-9 w-9 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {isExtracting && (
                        <div className="flex items-center gap-2 text-pink-400 text-sm">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Extracting colors...</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in">
                <CardHeader>
                  <CardTitle className="text-sm text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-pink-400" /> Extracted Palette
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {extractedColors.length > 0 ? (
                    <div className="space-y-2">
                      {extractedColors.map((color, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/60 border border-zinc-700 hover:border-pink-500/30 transition-all cursor-pointer group"
                          onClick={() => applyColor(color)}
                        >
                          <div
                            className="w-10 h-10 rounded-lg border border-zinc-600 shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-mono text-zinc-300 truncate">{color}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(color, "Color copied!", `extracted-${index}`);
                            }}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-zinc-500">
                      <Palette className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">Upload an image to see colors</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}