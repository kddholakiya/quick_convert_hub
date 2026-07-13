"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { 
  FileImage, 
  Binary, 
  Copy, 
  Download, 
  Trash2, 
  RefreshCw, 
  FileCode, 
  Info,
  Sparkles,
  ArrowRightLeft
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Base64Tool() {
  // --- Image to Base64 State ---
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [base64Output, setBase64Output] = useState<string>("");
  const [withPrefix, setWithPrefix] = useState<boolean>(true);
  const [imageSize, setImageSize] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState(false);

  // --- Base64 to Image State ---
  const [base64Input, setBase64Input] = useState<string>("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [mimeType, setMimeType] = useState<string>("");
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mount animation
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll(".animate-fade-in"),
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
      );
    }
  }, []);

  // --- Process File for Image to Base64 ---
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    let file: File | null = null;
    if (e.type === "change") {
      const target = e.target as HTMLInputElement;
      file = target.files?.[0] || null;
    } else if (e.type === "drop") {
      const dragEvent = e as React.DragEvent<HTMLDivElement>;
      file = dragEvent.dataTransfer.files?.[0] || null;
    }

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setImgFile(file);
    setImageSize(file.size);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setBase64Output(event.target.result as string);
        toast.success("Image converted to Base64!");
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read image file");
    };
    reader.readAsDataURL(file);
  };

  const getCleanBase64 = () => {
    if (!base64Output) return "";
    if (withPrefix) return base64Output;
    // Strip "data:image/xyz;base64," prefix
    const commaIndex = base64Output.indexOf(",");
    return commaIndex > -1 ? base64Output.substring(commaIndex + 1) : base64Output;
  };

  const copyToClipboard = (text: string, msg: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  const downloadBase64Txt = () => {
    const text = getCleanBase64();
    if (!text) return;

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${imgFile?.name || "image"}-base64.txt`;
    link.click();
    toast.success("Base64 text file downloaded!");
  };

  const resetImageToBase64 = () => {
    setImgFile(null);
    setBase64Output("");
    setImageSize(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Base64 to Image Rendering ---
  useEffect(() => {
    if (!base64Input.trim()) {
      setImagePreviewUrl("");
      setMimeType("");
      return;
    }

    let rawString = base64Input.trim();
    
    // Check if it has data url schema prefix
    const match = rawString.match(/^data:(image\/[a-zA-Z+.-]+);base64,/);
    if (match) {
      setImagePreviewUrl(rawString);
      setMimeType(match[1]);
    } else {
      // If prefix is missing, assume it is png or jpeg and add it
      // Standard image prefix fallback
      const derivedMime = "image/png"; // default fallback
      const formattedUrl = `data:${derivedMime};base64,${rawString}`;
      setImagePreviewUrl(formattedUrl);
      setMimeType(derivedMime + " (Assumed)");
    }
  }, [base64Input]);

  const downloadDecodedImage = () => {
    if (!imagePreviewUrl) return;

    const link = document.createElement("a");
    link.href = imagePreviewUrl;
    
    // Derive file extension
    let extension = "png";
    const match = mimeType.match(/image\/([a-zA-Z0-9+.-]+)/);
    if (match) {
      extension = match[1] === "svg+xml" ? "svg" : match[1];
    }
    
    link.download = `decoded-image-${Date.now()}.${extension}`;
    link.click();
    toast.success("Image file downloaded!");
  };

  // Helper formatting for sizes
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div ref={containerRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* CONTROL COLUMN */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Sub Navigation */}
        <Tabs defaultValue="image-to-b64" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 p-1.5 bg-zinc-950/60 border border-zinc-700 rounded-xl">
            <TabsTrigger value="image-to-b64" className="flex items-center justify-center gap-2 py-2.5 rounded-lg data-active:bg-purple-500/10 data-active:text-purple-400 data-active:border-purple-500/20 font-medium min-w-0">
              <FileImage className="w-4 h-4 shrink-0" />
              <span className="truncate">Image to Base64</span>
            </TabsTrigger>
            <TabsTrigger value="b64-to-image" className="flex items-center justify-center gap-2 py-2.5 rounded-lg data-active:bg-purple-500/10 data-active:text-purple-400 data-active:border-purple-500/20 font-medium min-w-0">
              <Binary className="w-4 h-4 shrink-0" />
              <span className="truncate">Base64 to Image</span>
            </TabsTrigger>
          </TabsList>

          {/* IMAGE TO BASE64 PANEL */}
          <TabsContent value="image-to-b64" className="space-y-6 mt-0">
            <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
              
              <CardHeader>
                <CardTitle className="text-zinc-50 flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-purple-400" />
                  Convert Image
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Select an image to convert it into a base64 encoded text string.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                
                {/* Drag and Drop */}
                {!imgFile ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      handleImageSelect(e);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4 min-h-[220px] group ${
                      isDragOver
                        ? "border-purple-400 bg-purple-500/5"
                        : "border-zinc-800 hover:border-purple-500/30 hover:bg-purple-500/[0.01]"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    
                    <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800 group-hover:scale-110 group-hover:border-purple-500/30 transition-all">
                      <FileImage className="w-8 h-8 text-zinc-400 group-hover:text-purple-400 transition-colors" />
                    </div>

                    <div className="space-y-1">
                      <p className="text-zinc-200 font-semibold">Drag & drop your image here</p>
                      <p className="text-xs text-zinc-500">or click to browse from files</p>
                    </div>

                    <p className="text-[10px] text-zinc-500 max-w-xs">Supports PNG, JPG, JPEG, GIF, WEBP, SVG, and BMP.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Selected Image Metadata card */}
                    <div className="flex items-center gap-4 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80">
                      <div className="w-16 h-16 rounded-lg border border-zinc-700 bg-zinc-950 overflow-hidden flex items-center justify-center p-1.5 shrink-0">
                        {base64Output && (
                          <img src={base64Output} alt="Source thumbnail" className="max-w-full max-h-full object-contain" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-zinc-200 font-semibold truncate text-sm">{imgFile.name}</p>
                        <div className="flex gap-2 text-xs text-zinc-400 mt-1 items-center">
                          <span className="truncate">Size: <strong className="text-purple-400 font-mono">{formatSize(imageSize)}</strong></span>
                          <span className="shrink-0">•</span>
                          <span className="truncate">Type: <strong className="text-zinc-300 font-mono">{imgFile.type}</strong></span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={resetImageToBase64}
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-full h-9 w-9 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Prefix toggle Option */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/30 border border-zinc-800 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-400 min-w-0">
                        <input
                          type="checkbox"
                          checked={withPrefix}
                          onChange={(e) => setWithPrefix(e.target.checked)}
                          className="rounded border-zinc-800 text-purple-500 bg-zinc-900 accent-purple-500 shrink-0"
                        />
                        <span className="truncate">Include data URI prefix</span>
                        <code className="text-[10px] text-purple-400 bg-purple-500/5 px-1 py-0.5 rounded border border-purple-500/10 font-mono shrink-0">data:image/png;base64,</code>
                      </label>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* BASE64 TO IMAGE PANEL */}
          <TabsContent value="b64-to-image" className="space-y-6 mt-0">
            <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
              
              <CardHeader>
                <CardTitle className="text-zinc-50 flex items-center gap-2">
                  <Binary className="w-5 h-5 text-purple-400" />
                  Paste Base64
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Paste a Base64 text string to reconstruct and download the original image.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="b64-input" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                    Base64 String Payload
                  </Label>
                  <textarea
                    id="b64-input"
                    value={base64Input}
                    onChange={(e) => setBase64Input(e.target.value)}
                    placeholder="Paste Base64 data here (with or without data:image/png;base64 prefix)..."
                    className="w-full bg-zinc-900/60 border border-zinc-700 focus:border-purple-500/50 focus:ring-purple-500/10 text-zinc-100 placeholder-zinc-600 rounded-lg p-3 font-mono text-xs h-[180px] outline-none"
                  />
                </div>

                {base64Input && (
                  <Button
                    variant="ghost"
                    onClick={() => setBase64Input("")}
                    className="text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 w-full text-xs h-9"
                  >
                    Clear Input
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* RESULTS COLUMN */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* IMAGE TO BASE64 OUTPUT DISPLAY */}
        {base64Output && imgFile && (
          <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in relative overflow-hidden">
            <CardHeader className="border-b border-zinc-900 pb-4">
              <CardTitle className="text-sm text-zinc-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                <span>Base64 String Result</span>
                <span className="text-[10px] text-purple-400 font-mono lowercase">
                  ~{(getCleanBase64().length / 1024).toFixed(1)} KB text
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              
              {/* Truncated Text preview box */}
              <div className="space-y-2">
                <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Output String Preview</Label>
                <div className="relative">
                  <div className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl p-3 font-mono text-zinc-300 text-[11px] h-[140px] overflow-y-auto break-all scrollbar-thin">
                    {getCleanBase64()}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-zinc-900 to-transparent pointer-events-none rounded-b-xl" />
                </div>
              </div>

              {/* Action grid */}
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={() => copyToClipboard(getCleanBase64(), "Base64 string copied to clipboard!")}
                    className="bg-purple-600 hover:bg-purple-500 text-zinc-50 font-bold border-none transition-all py-5 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-500/10 min-w-0"
                  >
                    <Copy className="w-4 h-4 shrink-0" /> <span className="truncate">Copy Text</span>
                  </Button>
                  <Button 
                    onClick={downloadBase64Txt}
                    className="bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-100 font-semibold transition-all py-5 flex items-center gap-1.5 cursor-pointer min-w-0"
                  >
                    <Download className="w-4 h-4 shrink-0" /> <span className="truncate">Download TXT</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* BASE64 TO IMAGE OUTPUT PREVIEW */}
        {base64Input && (
          <Card className={`bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in relative overflow-hidden`}>
            <CardHeader className="border-b border-zinc-900 pb-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Reconstructed Image
                </CardTitle>
                {mimeType && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
                    {mimeType}
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex flex-col items-center justify-center p-6 space-y-6">
              
              {/* Preview image render */}
              {imagePreviewUrl ? (
                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-700/80 shadow-[0_0_20px_rgba(168,85,247,0.04)] max-w-full overflow-hidden shrink-0 flex items-center justify-center min-h-[160px]">
                  <img 
                    src={imagePreviewUrl} 
                    alt="Pasted base64 render" 
                    onError={(e) => {
                      // Handle invalid base64 image strings gracefully
                      (e.target as HTMLImageElement).src = "";
                      toast.error("Invalid base64 string. Cannot render image.");
                    }}
                    className="max-h-[220px] max-w-full object-contain select-none rounded-lg"
                  />
                </div>
              ) : (
                <div className="w-full h-[180px] flex items-center justify-center text-zinc-600 bg-zinc-900/40 border border-zinc-700 border-dashed rounded-xl">
                  Waiting for input...
                </div>
              )}

              {/* Actions */}
              {imagePreviewUrl && (
                <Button 
                  onClick={downloadDecodedImage}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-zinc-50 font-bold border-none transition-all py-5 flex items-center gap-1.5 justify-center shadow-lg shadow-purple-500/10 cursor-pointer min-w-0"
                >
                  <Download className="w-4 h-4 shrink-0" /> <span className="truncate">Download Decoded Image</span>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
