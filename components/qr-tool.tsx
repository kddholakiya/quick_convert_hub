"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import jsQR from "jsqr";
import gsap from "gsap";
import { 
  QrCode, 
  Upload, 
  Camera, 
  Download, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  Sliders, 
  Palette, 
  Image as ImageIcon,
  Check,
  VideoOff,
  Sparkles,
  Link as LinkIcon,
  Mail,
  Wifi,
  Phone,
  FileText,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function QrTool() {
  // --- Generator State ---
  const [text, setText] = useState("https://quickconvert.dev");
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState("#ffffff");
  const [bgColor, setBgColor] = useState("#0a0a0a");
  const [ecc, setEcc] = useState<"L" | "M" | "Q" | "H">("H");
  const [margin, setMargin] = useState(4);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoSizePercent, setLogoSizePercent] = useState(20);
  const [logoBg, setLogoBg] = useState(true);
  const [qrImageUrl, setQrImageUrl] = useState<string>("");
  
  // --- Helper: Validate hex color ---
  const isValidHexColor = (color: string) => {
    return /^#([0-9A-F]{3}){1,2}$/i.test(color);
  };
  
  // --- Main Tab State ---
  const [activeMainTab, setActiveMainTab] = useState("generator");

  // --- Scanner State ---
  const [scanResult, setScanResult] = useState<{
    text: string;
    type: "url" | "email" | "wifi" | "tel" | "text";
  } | null>(null);
  const [activeScannerTab, setActiveScannerTab] = useState("upload");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const laserRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // GSAP Animations on Mount
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

  // --- Generate QR Code ---
  useEffect(() => {
    generateQrCode();
  }, [text, size, fgColor, bgColor, ecc, margin, logoPreview, logoSizePercent, logoBg]);

  const generateQrCode = async () => {
    if (!text) {
      setQrImageUrl("");
      return;
    }

    // Validate hex colors before generating QR code
    const validFgColor = isValidHexColor(fgColor) ? fgColor : "#00ffcc";
    const validBgColor = isValidHexColor(bgColor) ? bgColor : "#0a0a0a";

    try {
      // First, render the QR code using a temporary canvas to get clean dimensions
      const tempCanvas = document.createElement("canvas");
      await QRCode.toCanvas(tempCanvas, text, {
        width: size,
        margin: margin,
        errorCorrectionLevel: ecc,
        color: {
          dark: validFgColor,
          light: validBgColor
        }
      });

      const finalCanvas = canvasRef.current;
      if (!finalCanvas) return;
      
      finalCanvas.width = size;
      finalCanvas.height = size;
      const ctx = finalCanvas.getContext("2d");
      if (!ctx) return;

      // Draw the generated QR code onto our main canvas
      ctx.drawImage(tempCanvas, 0, 0);

      // If a logo is selected, overlay it
      if (logoPreview) {
        const logoImg = new Image();
        logoImg.src = logoPreview;
        await new Promise((resolve) => {
          logoImg.onload = resolve;
        });

        const logoSize = (size * logoSizePercent) / 100;
        const logoX = (size - logoSize) / 2;
        const logoY = (size - logoSize) / 2;

        if (logoBg) {
          // Draw a background padding for the logo
          ctx.fillStyle = bgColor;
          const pad = logoSize * 0.15; // 15% padding
          
          // Draw rounded rectangle for clean look
          ctx.beginPath();
          ctx.roundRect(logoX - pad, logoY - pad, logoSize + pad * 2, logoSize + pad * 2, 8);
          ctx.fill();
        }

        // Draw the logo itself
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
      }

      // Set state to standard URL for easy downloading/sharing
      setQrImageUrl(finalCanvas.toDataURL("image/png"));
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate QR Code. Adjust your configurations.");
    }
  };

  // --- Download QR Code ---
  const downloadQr = (format: "png" | "svg") => {
    if (!qrImageUrl) return;

    if (format === "png") {
      const link = document.createElement("a");
      link.download = `qrcode-${Date.now()}.png`;
      link.href = qrImageUrl;
      link.click();
      toast.success("PNG Downloaded!");
    } else {
      // SVG Download using canvas-to-SVG or regenerator
      QRCode.toString(text, {
        type: "svg",
        width: size,
        margin: margin,
        errorCorrectionLevel: ecc,
        color: {
          dark: fgColor,
          light: bgColor
        }
      }).then((svgString) => {
        const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const link = document.createElement("a");
        link.download = `qrcode-${Date.now()}.svg`;
        link.href = URL.createObjectURL(blob);
        link.click();
        toast.success("SVG Downloaded!");
      }).catch((err) => {
        console.error(err);
        toast.error("Failed to download SVG");
      });
    }
  };

  // --- Copy QR Image to Clipboard ---
  const copyToClipboard = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) {
          toast.error("Failed to copy image");
          return;
        }
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob,
          }),
        ]);
        toast.success("QR Code copied to clipboard!");
      }, "image/png");
    } catch (err) {
      console.error(err);
      toast.error("Clipboard copy failed. Try downloading PNG.");
    }
  };

  // --- Logo Upload Handling ---
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (e.g. 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB");
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
      toast.success("Logo uploaded. Setting Error Correction to High (H) automatically.");
      setEcc("H"); // Force high error correction for scannability
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
    toast.success("Logo removed");
  };

  // --- File Decryption Handling ---
  const handleScanFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    let file: File | null = null;
    
    if (e.type === "change") {
      const target = e.target as HTMLInputElement;
      file = target.files?.[0] || null;
    } else if (e.type === "drop") {
      const dragEvent = e as React.DragEvent<HTMLDivElement>;
      file = dragEvent.dataTransfer.files?.[0] || null;
    }

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });

        if (code) {
          processDecodedText(code.data);
          toast.success("QR Code decoded successfully!");
        } else {
          toast.error("No QR Code found in image. Make sure it's clear and bright.");
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const processDecodedText = (text: string) => {
    let type: "url" | "email" | "wifi" | "tel" | "text" = "text";
    
    if (text.startsWith("http://") || text.startsWith("https://")) {
      type = "url";
    } else if (text.startsWith("mailto:")) {
      type = "email";
    } else if (text.startsWith("WIFI:")) {
      type = "wifi";
    } else if (text.startsWith("tel:")) {
      type = "tel";
    }

    setScanResult({ text, type });
  };

  // --- Camera Scan Handling ---
  useEffect(() => {
    // List available video devices
    if (typeof window !== "undefined" && navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoDevices = devices.filter((device) => device.kind === "videoinput");
        setCameras(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedCameraId(videoDevices[0].deviceId);
        }
      }).catch((err) => {
        console.error("Enumerate devices error:", err);
      });
    }
  }, []);

  // GSAP Laser Line Animation Loop
  const startLaserAnimation = () => {
    if (!laserRef.current) return;
    gsap.killTweensOf(laserRef.current);
    gsap.fromTo(
      laserRef.current,
      { yPercent: 0, opacity: 0.8 },
      {
        yPercent: 320,
        opacity: 0.8,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      }
    );
  };

  const stopLaserAnimation = () => {
    if (laserRef.current) {
      gsap.killTweensOf(laserRef.current);
    }
  };

  const startCamera = async (cameraId: string) => {
    setIsCameraActive(true);
    setScanResult(null);
    
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: cameraId ? { deviceId: { exact: cameraId } } : { facingMode: "environment" }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true"); // required to tell iOS safari we don't want fullscreen
        videoRef.current.play();
      }

      startLaserAnimation();
      animationFrameId.current = requestAnimationFrame(scanFrame);
      toast.success("Scanner active");
    } catch (err) {
      console.error(err);
      setIsCameraActive(false);
      stopLaserAnimation();
      toast.error("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    setIsCameraActive(false);
    stopLaserAnimation();

    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const scanFrame = () => {
    if (!isCameraActive || !videoRef.current) return;

    const video = videoRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });

        if (code) {
          // Play a visual feedback flash
          if (scannerContainerRef.current) {
            gsap.fromTo(
              scannerContainerRef.current,
              { ringColor: "rgba(0, 255, 204, 1)", ringWidth: "6px" },
              { ringColor: "rgba(0, 255, 204, 0)", ringWidth: "2px", duration: 0.5 }
            );
          }

          processDecodedText(code.data);
          toast.success("QR Decoded!");
          stopCamera();
          return; // Exit recursion
        }
      }
    }

    animationFrameId.current = requestAnimationFrame(scanFrame);
  };

  // Clean up camera on unmount or tab switch
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleMainTabChange = (value: string) => {
    setActiveMainTab(value);
    if (value !== "scanner" && isCameraActive) {
      stopCamera();
    }
  };

  const handleScannerTabChange = (value: string) => {
    setActiveScannerTab(value);
    if (value !== "camera" && isCameraActive) {
      stopCamera();
    }
  };

  // Helper component to render specific icon depending on content type
  const getTypeBadge = (type: string) => {
    const classes = "w-4 h-4 mr-1.5";
    switch (type) {
      case "url":
        return (
          <span className="flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <LinkIcon className={classes} /> URL
          </span>
        );
      case "email":
        return (
          <span className="flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Mail className={classes} /> Email
          </span>
        );
      case "wifi":
        return (
          <span className="flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Wifi className={classes} /> Wi-Fi
          </span>
        );
      case "tel":
        return (
          <span className="flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Phone className={classes} /> Phone
          </span>
        );
      default:
        return (
          <span className="flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            <FileText className={classes} /> Text
          </span>
        );
    }
  };

  return (
    <div ref={containerRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT COLUMN: Main Controls & Generator Config / Drag-Drop Scanner */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Main Switcher (Generate vs Scan) */}
        <Tabs value={activeMainTab} onValueChange={handleMainTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 p-1.5 bg-zinc-950/60 border border-zinc-700 rounded-xl">
            <TabsTrigger value="generator" className="flex items-center justify-center gap-2 py-2.5 rounded-lg data-active:bg-emerald-500/10 data-active:text-emerald-400 data-active:border-emerald-500/20 font-medium min-w-0">
              <QrCode className="w-4 h-4 shrink-0" />
              <span className="truncate">QR Code Generator</span>
            </TabsTrigger>
            <TabsTrigger value="scanner" className="flex items-center justify-center gap-2 py-2.5 rounded-lg data-active:bg-emerald-500/10 data-active:text-emerald-400 data-active:border-emerald-500/20 font-medium min-w-0">
              <Camera className="w-4 h-4 shrink-0" />
              <span className="truncate">QR Code Scanner / Decryptor</span>
            </TabsTrigger>
          </TabsList>

          {/* GENERATOR TAB */}
          <TabsContent value="generator" className="space-y-6">
            <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
              
              <CardHeader>
                <CardTitle className="text-zinc-50 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-emerald-400" />
                  Customize QR Code
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Input content, configure styles, and brand your QR code client-side.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 text-zinc-300">
                {/* 1. Value Input */}
                <div className="space-y-2">
                  <Label htmlFor="qr-text" className="text-zinc-400 flex justify-between items-center text-xs uppercase tracking-wider font-semibold">
                    Content (Text, URL, Wi-Fi info...)
                    <span className="text-[10px] text-zinc-500 font-normal normal-case">
                      {text.length} chars
                    </span>
                  </Label>
                  <Input
                    id="qr-text"
                    placeholder="Enter link or data to encode..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="bg-zinc-900/60 border-zinc-700 focus:border-emerald-500/50 focus:ring-emerald-500/10 text-zinc-100 placeholder-zinc-500 py-6 text-base"
                  />
                </div>

                {/* 2. Colors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-emerald-400" />
                      Foreground Color
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative w-12 h-10 rounded-lg overflow-hidden border border-zinc-700 cursor-pointer">
                        <input
                          type="color"
                          value={fgColor}
                          onChange={(e) => setFgColor(e.target.value)}
                          className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                        />
                        <div className="w-full h-full" style={{ backgroundColor: fgColor }} />
                      </div>
                      <Input
                        value={fgColor}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Only allow valid hex color format
                          if (value === '' || /^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                            setFgColor(value);
                          }
                        }}
                        className="bg-zinc-900/60 border-zinc-700 text-zinc-100 uppercase font-mono text-sm"
                        placeholder="#00FFCC"
                        maxLength={7}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-zinc-500" />
                      Background Color
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative w-12 h-10 rounded-lg overflow-hidden border border-zinc-700 cursor-pointer">
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                        />
                        <div className="w-full h-full" style={{ backgroundColor: bgColor }} />
                      </div>
                      <Input
                        value={bgColor}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Only allow valid hex color format
                          if (value === '' || /^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                            setBgColor(value);
                          }
                        }}
                        className="bg-zinc-900/60 border-zinc-700 text-zinc-100 uppercase font-mono text-sm"
                        placeholder="#0A0A0A"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Sizing & Spacing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-400 flex justify-between text-xs uppercase tracking-wider font-semibold">
                      QR Size (Pixels)
                      <span className="text-emerald-400 font-mono font-medium">{size}x{size}</span>
                    </Label>
                    <input
                      type="range"
                      min="128"
                      max="1024"
                      step="64"
                      value={size}
                      onChange={(e) => setSize(Number(e.target.value))}
                      className="w-full accent-emerald-400 bg-zinc-900 h-2 rounded-lg cursor-pointer appearance-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-400 flex justify-between text-xs uppercase tracking-wider font-semibold">
                      Quiet Zone (Margin)
                      <span className="text-emerald-400 font-mono font-medium">{margin}px</span>
                    </Label>
                    <input
                      type="range"
                      min="0"
                      max="12"
                      step="1"
                      value={margin}
                      onChange={(e) => setMargin(Number(e.target.value))}
                      className="w-full accent-emerald-400 bg-zinc-900 h-2 rounded-lg cursor-pointer appearance-none"
                    />
                  </div>
                </div>

                {/* 4. Logo Overlay (Premium Feature) */}
                <div className="p-4 rounded-xl border border-zinc-700/80 bg-zinc-900/30 space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-zinc-300 font-semibold text-sm flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-400" />
                      Add Custom Logo (Center Overlay)
                    </Label>
                    {logoPreview && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={removeLogo}
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 h-7 text-xs rounded-md"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Remove Logo
                      </Button>
                    )}
                  </div>

                  {!logoPreview ? (
                    <div 
                      onClick={() => logoInputRef.current?.click()}
                      className="border border-dashed border-zinc-700 hover:border-emerald-500/50 hover:bg-emerald-500/[0.02] rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                    >
                      <input 
                        ref={logoInputRef}
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload} 
                        className="hidden" 
                      />
                      <Upload className="w-6 h-6 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                      <span className="text-xs text-zinc-400 font-medium">Click to upload logo PNG / JPG (Max 2MB)</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      <div className="flex items-center gap-3 bg-zinc-950/60 p-3 rounded-lg border border-zinc-700">
                        <div className="w-10 h-10 rounded border border-zinc-600 bg-zinc-900 overflow-hidden flex items-center justify-center p-1 shrink-0">
                          <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-zinc-300 font-semibold truncate">{logoFile?.name}</p>
                          <p className="text-[10px] text-zinc-500">{(Number(logoFile?.size) / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* Logo options */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-zinc-400 font-medium">Logo Size Percent</span>
                            <span className="text-xs font-semibold text-emerald-400">{logoSizePercent}%</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="30"
                            value={logoSizePercent}
                            onChange={(e) => setLogoSizePercent(Number(e.target.value))}
                            className="w-full accent-emerald-400 bg-zinc-900 h-1.5 rounded cursor-pointer appearance-none"
                          />
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-400">
                          <input
                            type="checkbox"
                            checked={logoBg}
                            onChange={(e) => setLogoBg(e.target.checked)}
                            className="rounded border-zinc-800 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-zinc-900 accent-emerald-500"
                          />
                          Render solid background container
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Error Correction */}
                <div className="space-y-2">
                  <Label className="text-zinc-400 flex justify-between text-xs uppercase tracking-wider font-semibold">
                    Error Correction Level
                    <span className="text-[10px] text-zinc-500 lowercase">High level standard for logos</span>
                  </Label>
                  <Select value={ecc} onValueChange={(val: any) => setEcc(val)}>
                    <SelectTrigger className="bg-zinc-900/60 border-zinc-700 text-zinc-100 py-5 min-w-0">
                      <SelectValue placeholder="Select EC Level" className="truncate" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-200">
                      <SelectItem value="L">L - Low (~7% recovery)</SelectItem>
                      <SelectItem value="M">M - Medium (~15% recovery)</SelectItem>
                      <SelectItem value="Q">Q - Quartile (~25% recovery)</SelectItem>
                      <SelectItem value="H">H - High (~30% recovery)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* SCANNER TAB */}
          <TabsContent value="scanner" className="space-y-6">
            <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
              
              <CardHeader>
                <div className="flex justify-between items-center gap-4">
                  <CardTitle className="text-zinc-50 flex items-center gap-2 min-w-0">
                    <Camera className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="truncate">Scan / Decrypt QR Code</span>
                  </CardTitle>
                </div>
                <CardDescription className="text-zinc-400">
                  Upload an image containing a QR code, or use your camera to scan directly.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <Tabs value={activeScannerTab} onValueChange={handleScannerTabChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-zinc-900/60 border border-zinc-700/80 rounded-lg">
                    <TabsTrigger value="upload" className="flex items-center gap-1.5 py-2 min-w-0">
                      <Upload className="w-4 h-4 shrink-0" />
                      <span className="truncate">Upload File</span>
                    </TabsTrigger>
                    <TabsTrigger value="camera" className="flex items-center gap-1.5 py-2 min-w-0">
                      <Camera className="w-4 h-4 shrink-0" />
                      <span className="truncate">Live Camera</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* FILE UPLOAD SUBTAB */}
                  <TabsContent value="upload" className="mt-0">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        handleScanFileUpload(e);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4 group min-h-[220px] ${
                        isDragOver
                          ? "border-emerald-400 bg-emerald-500/5"
                          : "border-zinc-700 hover:border-emerald-500/30 hover:bg-emerald-500/[0.01]"
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleScanFileUpload}
                        className="hidden"
                      />
                      
                      <div className="p-4 rounded-full bg-zinc-900/80 border border-zinc-700 group-hover:scale-110 group-hover:border-emerald-500/30 transition-all">
                        <Upload className="w-8 h-8 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                      </div>

                      <div className="space-y-1">
                        <p className="text-zinc-200 font-semibold">Drag & drop your QR image here</p>
                        <p className="text-xs text-zinc-500">or click to browse from files</p>
                      </div>

                      <p className="text-[10px] text-zinc-500 max-w-xs">Supports PNG, JPG, JPEG, WEBP and processes entirely in browser memory (no server uploads).</p>
                    </div>
                  </TabsContent>

                  {/* CAMERA SCANNER SUBTAB */}
                  <TabsContent value="camera" className="mt-0 space-y-4">
                    
                    {/* Camera Selectors */}
                    {cameras.length > 1 && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Select Camera Source</Label>
                        <Select 
                          value={selectedCameraId} 
                          onValueChange={(val) => {
                            if (val) {
                              setSelectedCameraId(val);
                              if (isCameraActive) {
                                startCamera(val);
                              }
                            }
                          }}
                        >
                          <SelectTrigger className="bg-zinc-900/60 border-zinc-700 text-zinc-100 min-w-0">
                            <SelectValue placeholder="Choose camera" className="truncate" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-950 border-zinc-700 text-zinc-200">
                            {cameras.map((cam, idx) => (
                              <SelectItem key={cam.deviceId} value={cam.deviceId}>
                                {cam.label || `Camera ${idx + 1}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Camera Feed Container */}
                    <div 
                      ref={scannerContainerRef}
                      className="relative rounded-xl border border-zinc-700 bg-zinc-950 overflow-hidden flex items-center justify-center aspect-video ring-2 ring-transparent transition-all"
                    >
                      {/* Laser scanner element */}
                      {isCameraActive && (
                        <div 
                          ref={laserRef}
                          className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_2px_rgba(16,185,129,0.8)] z-10 pointer-events-none"
                        />
                      )}

                      <video 
                        ref={videoRef} 
                        className="w-full h-full object-cover"
                        style={{ display: isCameraActive ? "block" : "none" }}
                      />

                      {!isCameraActive && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
                          <div className="p-4 rounded-full bg-zinc-900 border border-zinc-700">
                            <VideoOff className="w-8 h-8 text-zinc-500" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold text-zinc-300">Camera Inactive</h4>
                            <p className="text-xs text-zinc-500 max-w-xs">Allow browser access to scan directly using your phone/laptop camera.</p>
                          </div>
                          <Button 
                            onClick={() => startCamera(selectedCameraId)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold px-6 py-2.5 rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 min-w-0"
                          >
                            <Camera className="w-4 h-4 shrink-0" /> <span className="truncate">Start Live Scan</span>
                          </Button>
                        </div>
                      )}

                      {isCameraActive && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                          <Button 
                            variant="destructive"
                            onClick={stopCamera}
                            className="bg-rose-500 hover:bg-rose-600 text-zinc-50 font-semibold rounded-lg shadow-lg"
                          >
                            Stop Scanning
                          </Button>
                        </div>
                      )}

                      {/* Scanning frame guides */}
                      {isCameraActive && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] border-2 border-emerald-400/50 rounded-xl relative">
                            {/* Corner Accents */}
                            <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-sm" />
                            <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-sm" />
                            <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-sm" />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-sm" />
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* RIGHT COLUMN: Realtime Live Preview / Results Deck */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Realtime QR Preview Hint (Visible when Scanner Tab Active but no results) */}
        {activeMainTab === "scanner" && activeScannerTab === "upload" && !scanResult && (
          <div className="text-zinc-500 text-sm hidden lg:block border border-zinc-800/80 rounded-xl p-4 bg-zinc-950/20 text-center select-none font-medium">
            Upload an image on the left to see decrypted contents here.
          </div>
        )}

        {/* GENERATOR PREVIEW CARD */}
        {activeMainTab === "generator" && (
          <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 blur-2xl rounded-full pointer-events-none" />
            <CardHeader className="border-b border-zinc-900 pb-4">
              <CardTitle className="text-sm text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5 justify-between">
                <span>Realtime QR Preview</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col items-center justify-center p-8 space-y-6">
              
              {/* Invisible HTML5 Canvas used for Logo Rendering */}
              <canvas ref={canvasRef} style={{ display: "none" }} />

              {/* Glowing Wrapper for QR Code */}
              <div 
                className="p-5 rounded-2xl bg-zinc-900 border border-zinc-700/80 shadow-[0_0_30px_rgba(0,255,204,0.06)] relative group"
                style={{ backgroundColor: bgColor }}
              >
                {qrImageUrl ? (
                  <img 
                    src={qrImageUrl} 
                    alt="Real-time QR Code" 
                    className="w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] object-contain select-none" 
                  />
                ) : (
                  <div className="w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] flex items-center justify-center text-zinc-600 bg-zinc-950/40 rounded-xl">
                    No text inputted
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="w-full flex flex-col gap-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <Button 
                    onClick={() => downloadQr("png")} 
                    disabled={!text}
                    className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold border-none transition-all py-5 flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50 min-w-0"
                  >
                    <Download className="w-4 h-4 shrink-0" /> <span className="truncate">Download PNG</span>
                  </Button>
                  <Button 
                    onClick={() => downloadQr("svg")} 
                    disabled={!text}
                    className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-100 font-semibold transition-all py-5 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 min-w-0"
                  >
                    <Download className="w-4 h-4 shrink-0" /> <span className="truncate">Download SVG</span>
                  </Button>
                </div>
                
                <Button 
                  onClick={copyToClipboard}
                  disabled={!text}
                  variant="outline"
                  className="w-full bg-transparent border-zinc-800 hover:bg-zinc-900/60 hover:text-emerald-400 text-zinc-400 transition-all font-semibold py-5 cursor-pointer disabled:opacity-50 min-w-0"
                >
                  <Copy className="w-4 h-4 mr-1.5 shrink-0" /> <span className="truncate">Copy Image to Clipboard</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SCAN / DECRYPT RESULTS PANEL */}
        {activeMainTab === "scanner" && scanResult && (
          <Card className="bg-zinc-950/60 border-emerald-500/20 backdrop-blur-xl animate-fade-in relative overflow-hidden shadow-[0_0_25px_rgba(16,185,129,0.06)] border ring-1 ring-emerald-500/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-2xl rounded-full pointer-events-none" />
            
            <CardHeader className="border-b border-zinc-900/80 pb-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-zinc-50 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                  Decrypted Data
                </CardTitle>
                {getTypeBadge(scanResult.type)}
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              
              {/* Output Content Field */}
              <div className="space-y-2">
                <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Raw Output Payload</Label>
                <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 font-mono text-zinc-200 text-sm overflow-x-auto whitespace-pre-wrap break-all min-h-[100px]">
                  {scanResult.text}
                </div>
              </div>

              {/* Actions Box */}
              <div className="flex flex-col gap-2 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button 
                    onClick={() => {
                      navigator.clipboard.writeText(scanResult.text);
                      toast.success("Payload copied to clipboard!");
                    }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold border-none transition-all flex items-center gap-1.5 justify-center py-5 shadow-lg shadow-emerald-500/10 cursor-pointer min-w-0"
                  >
                    <Copy className="w-4 h-4 shrink-0" /> <span className="truncate">Copy Content</span>
                  </Button>

                  {scanResult.type === "url" && (
                    <a 
                      href={scanResult.text} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-full"
                    >
                      <Button 
                        className="w-full bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 hover:text-emerald-400 text-zinc-100 font-semibold transition-all py-5 flex items-center gap-1.5 justify-center min-w-0"
                      >
                        <ExternalLink className="w-4 h-4 shrink-0" /> <span className="truncate">Open Link</span>
                      </Button>
                    </a>
                  )}

                  {scanResult.type === "email" && (
                    <a 
                      href={scanResult.text}
                      className="w-full"
                    >
                      <Button 
                        className="w-full bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 hover:text-emerald-400 text-zinc-100 font-semibold transition-all py-5 flex items-center gap-1.5 justify-center min-w-0"
                      >
                        <Mail className="w-4 h-4 shrink-0" /> <span className="truncate">Send Email</span>
                      </Button>
                    </a>
                  )}

                  {scanResult.type === "tel" && (
                    <a 
                      href={scanResult.text}
                      className="w-full"
                    >
                      <Button 
                        className="w-full bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 hover:text-emerald-400 text-zinc-100 font-semibold transition-all py-5 flex items-center gap-1.5 justify-center min-w-0"
                      >
                        <Phone className="w-4 h-4 shrink-0" /> <span className="truncate">Call Number</span>
                      </Button>
                    </a>
                  )}
                </div>

                <Button
                  variant="ghost"
                  onClick={() => setScanResult(null)}
                  className="text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 py-4 min-w-0"
                >
                  <span className="truncate">Clear Results</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
