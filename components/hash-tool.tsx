"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  Hash,
  FileText,
  Upload,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type HashAlgorithm = "MD5" | "SHA-1" | "SHA-256" | "SHA-512";

// Hash functions using Web Crypto API
async function hashText(text: string, algorithm: HashAlgorithm): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  let algo: string;
  switch (algorithm) {
    case "MD5":
      // Web Crypto doesn't support MD5, so we'll use a simple implementation
      return md5(text);
    case "SHA-1":
      algo = "SHA-1";
      break;
    case "SHA-256":
      algo = "SHA-256";
      break;
    case "SHA-512":
      algo = "SHA-512";
      break;
    default:
      algo = "SHA-256";
  }
  
  const hashBuffer = await crypto.subtle.digest(algo, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

async function hashFile(file: File, algorithm: HashAlgorithm): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  
  let algo: string;
  switch (algorithm) {
    case "MD5":
      // For files, we need to process the data
      const data = new Uint8Array(arrayBuffer);
      return md5Array(data);
    case "SHA-1":
      algo = "SHA-1";
      break;
    case "SHA-256":
      algo = "SHA-256";
      break;
    case "SHA-512":
      algo = "SHA-512";
      break;
    default:
      algo = "SHA-256";
  }
  
  const hashBuffer = await crypto.subtle.digest(algo, arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

// Simple MD5 implementation (for compatibility)
function md5(string: string): string {
  function rotateLeft(lValue: number, iShiftBits: number) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }

  function addUnsigned(lX: number, lY: number) {
    const lX4 = (lX & 0x40000000) >>> 0;
    const lY4 = (lY & 0x40000000) >>> 0;
    const lX8 = (lX & 0x80000000) >>> 0;
    const lY8 = (lY & 0x80000000) >>> 0;
    const lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
    if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8) >>> 0;
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return (lResult ^ 0xc0000000 ^ lX8 ^ lY8) >>> 0;
      else return (lResult ^ 0x40000000 ^ lX8 ^ lY8) >>> 0;
    } else return (lResult ^ lX8 ^ lY8) >>> 0;
  }

  function f(x: number, y: number, z: number) {
    return (x & y) | (~x & z);
  }
  function g(x: number, y: number, z: number) {
    return (x & z) | (y & ~z);
  }
  function h(x: number, y: number, z: number) {
    return x ^ y ^ z;
  }
  function i(x: number, y: number, z: number) {
    return y ^ (x | ~z);
  }

  function ff(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(f(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(g(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(h(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(i(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function convertToWordArray(string: string) {
    let lWordCount: number;
    const lMessageLength = string.length;
    const lNumberOfWords_temp1 = lMessageLength + 8;
    const lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    const lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    const lWordArray = Array(lNumberOfWords - 1);
    let lBytePosition = 0;
    let lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition)) >>> 0;
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = (lWordArray[lWordCount] | (0x80 << lBytePosition)) >>> 0;
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }

  function wordToHex(lValue: number) {
    let wordToHexValue = "";
    let wordToHexValue_temp = "";
    let lByte: number;
    let lCount: number;
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      wordToHexValue_temp = "0" + lByte.toString(16);
      wordToHexValue = wordToHexValue + wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
    }
    return wordToHexValue;
  }

  let x: number[] = [];
  let k: number;
  let AA: number;
  let BB: number;
  let CC: number;
  let DD: number;
  let a: number;
  let b: number;
  let c: number;
  let d: number;
  const S11 = 7;
  const S12 = 12;
  const S13 = 17;
  const S14 = 22;
  const S21 = 5;
  const S22 = 9;
  const S23 = 14;
  const S24 = 20;
  const S31 = 4;
  const S32 = 11;
  const S33 = 16;
  const S34 = 23;
  const S41 = 6;
  const S42 = 10;
  const S43 = 15;
  const S44 = 21;

  x = convertToWordArray(string);
  a = 0x67452301;
  b = 0xefcdab89;
  c = 0x98badcfe;
  d = 0x10325476;

  for (k = 0; k < x.length; k += 16) {
    AA = a;
    BB = b;
    CC = c;
    DD = d;
    a = ff(a, b, c, d, x[k + 0], S11, 0xd76aa478);
    d = ff(d, a, b, c, x[k + 1], S12, 0xe8c7b756);
    c = ff(c, d, a, b, x[k + 2], S13, 0x242070db);
    b = ff(b, c, d, a, x[k + 3], S14, 0xc1bdceee);
    a = ff(a, b, c, d, x[k + 4], S11, 0xf57c0faf);
    d = ff(d, a, b, c, x[k + 5], S12, 0x4787c62a);
    c = ff(c, d, a, b, x[k + 6], S13, 0xa8304613);
    b = ff(b, c, d, a, x[k + 7], S14, 0xfd469501);
    a = ff(a, b, c, d, x[k + 8], S11, 0x698098d8);
    d = ff(d, a, b, c, x[k + 9], S12, 0x8b44f7af);
    c = ff(c, d, a, b, x[k + 10], S13, 0xffff5bb1);
    b = ff(b, c, d, a, x[k + 11], S14, 0x895cd7be);
    a = ff(a, b, c, d, x[k + 12], S11, 0x6b901122);
    d = ff(d, a, b, c, x[k + 13], S12, 0xfd987193);
    c = ff(c, d, a, b, x[k + 14], S13, 0xa679438e);
    b = ff(b, c, d, a, x[k + 15], S14, 0x49b40821);
    a = gg(a, b, c, d, x[k + 1], S21, 0xf61e2562);
    d = gg(d, a, b, c, x[k + 6], S22, 0xc040b340);
    c = gg(c, d, a, b, x[k + 11], S23, 0x265e5a51);
    b = gg(b, c, d, a, x[k + 0], S24, 0xe9b6c7aa);
    a = gg(a, b, c, d, x[k + 5], S21, 0xd62f105d);
    d = gg(d, a, b, c, x[k + 10], S22, 0x02441453);
    c = gg(c, d, a, b, x[k + 15], S23, 0xd8a1e681);
    b = gg(b, c, d, a, x[k + 4], S24, 0xe7d3fbc8);
    a = gg(a, b, c, d, x[k + 9], S21, 0x21e1cde6);
    d = gg(d, a, b, c, x[k + 14], S22, 0xc33707d6);
    c = gg(c, d, a, b, x[k + 3], S23, 0xf4d50d87);
    b = gg(b, c, d, a, x[k + 8], S24, 0x455a14ed);
    a = gg(a, b, c, d, x[k + 13], S21, 0xa9e3e905);
    d = gg(d, a, b, c, x[k + 2], S22, 0xfcefa3f8);
    c = gg(c, d, a, b, x[k + 7], S23, 0x676f02d9);
    b = gg(b, c, d, a, x[k + 12], S24, 0x8d2a4c8a);
    a = hh(a, b, c, d, x[k + 5], S31, 0xfffa3942);
    d = hh(d, a, b, c, x[k + 8], S32, 0x8771f681);
    c = hh(c, d, a, b, x[k + 11], S33, 0x6d9d6122);
    b = hh(b, c, d, a, x[k + 14], S34, 0xfde5380c);
    a = hh(a, b, c, d, x[k + 1], S31, 0xa4beea44);
    d = hh(d, a, b, c, x[k + 4], S32, 0x4bdecfa9);
    c = hh(c, d, a, b, x[k + 7], S33, 0xf6bb4b60);
    b = hh(b, c, d, a, x[k + 10], S34, 0xbebfbc70);
    a = hh(a, b, c, d, x[k + 13], S31, 0x289b7ec6);
    d = hh(d, a, b, c, x[k + 0], S32, 0xeaa127fa);
    c = hh(c, d, a, b, x[k + 3], S33, 0xd4ef3085);
    b = hh(b, c, d, a, x[k + 6], S34, 0x04881d05);
    a = hh(a, b, c, d, x[k + 9], S31, 0xd9d4d039);
    d = hh(d, a, b, c, x[k + 12], S32, 0xe6db99e5);
    c = hh(c, d, a, b, x[k + 15], S33, 0x1fa27cf8);
    b = hh(b, c, d, a, x[k + 2], S34, 0xc4ac5665);
    a = ii(a, b, c, d, x[k + 0], S41, 0xf4292244);
    d = ii(d, a, b, c, x[k + 7], S42, 0x432aff97);
    c = ii(c, d, a, b, x[k + 14], S43, 0xab9423a7);
    b = ii(b, c, d, a, x[k + 5], S44, 0xfc93a039);
    a = ii(a, b, c, d, x[k + 12], S41, 0x655b59c3);
    d = ii(d, a, b, c, x[k + 3], S42, 0x8f0ccc92);
    c = ii(c, d, a, b, x[k + 10], S43, 0xffeff47d);
    b = ii(b, c, d, a, x[k + 1], S44, 0x85845dd1);
    a = ii(a, b, c, d, x[k + 8], S41, 0x6fa87e4f);
    d = ii(d, a, b, c, x[k + 15], S42, 0xfe2ce6e0);
    c = ii(c, d, a, b, x[k + 6], S43, 0xa3014314);
    b = ii(b, c, d, a, x[k + 13], S44, 0x4e0811a1);
    a = ii(a, b, c, d, x[k + 2], S41, 0xf7537e82);
    d = ii(d, a, b, c, x[k + 9], S42, 0xbd3af235);
    c = ii(c, d, a, b, x[k + 4], S43, 0x2ad7d2bb);
    b = ii(b, c, d, a, x[k + 11], S44, 0xeb86d391);
    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

function md5Array(data: Uint8Array): string {
  let string = "";
  for (let i = 0; i < data.length; i++) {
    string += String.fromCharCode(data[i]);
  }
  return md5(string);
}

export default function HashTool() {
  const [textInput, setTextInput] = useState("");
  const [textHashes, setTextHashes] = useState<Record<HashAlgorithm, string>>({
    MD5: "",
    "SHA-1": "",
    "SHA-256": "",
    "SHA-512": "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [fileHashes, setFileHashes] = useState<Record<HashAlgorithm, string>>({
    MD5: "",
    "SHA-1": "",
    "SHA-256": "",
    "SHA-512": "",
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll(".animate-fade-in"),
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
      );
    }
  }, []);

  // Auto-calculate text hashes
  useEffect(() => {
    if (!textInput.trim()) {
      setTextHashes({ MD5: "", "SHA-1": "", "SHA-256": "", "SHA-512": "" });
      return;
    }

    const calculateAll = async () => {
      setIsCalculating(true);
      const algorithms: HashAlgorithm[] = ["MD5", "SHA-1", "SHA-256", "SHA-512"];
      const results: Record<HashAlgorithm, string> = { MD5: "", "SHA-1": "", "SHA-256": "", "SHA-512": "" };
      
      for (const algo of algorithms) {
        results[algo] = await hashText(textInput, algo);
      }
      
      setTextHashes(results);
      setIsCalculating(false);
    };

    calculateAll();
  }, [textInput]);

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsCalculating(true);

    const algorithms: HashAlgorithm[] = ["MD5", "SHA-1", "SHA-256", "SHA-512"];
    const results: Record<HashAlgorithm, string> = { MD5: "", "SHA-1": "", "SHA-256": "", "SHA-512": "" };
    
    for (const algo of algorithms) {
      try {
        results[algo] = await hashFile(selectedFile, algo);
      } catch (error) {
        results[algo] = "Error calculating hash";
      }
    }
    
    setFileHashes(results);
    setIsCalculating(false);
    toast.success("File hashes calculated!");
  };

  const copyToClipboard = (text: string, msg: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(msg);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearText = () => {
    setTextInput("");
    setTextHashes({ MD5: "", "SHA-1": "", "SHA-256": "", "SHA-512": "" });
  };

  const clearFile = () => {
    setFile(null);
    setFileHashes({ MD5: "", "SHA-1": "", "SHA-256": "", "SHA-512": "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const HashResultCard = ({ 
    algorithm, 
    hashValue, 
    label 
  }: { 
    algorithm: HashAlgorithm; 
    hashValue: string; 
    label: string;
  }) => (
    <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">{label}</Label>
          {isCalculating && (
            <RefreshCw className="w-3 h-3 text-zinc-500 animate-spin" />
          )}
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-zinc-900/80 border border-zinc-700 rounded-lg p-2.5 font-mono text-zinc-300 text-xs break-all min-h-[40px] flex items-center">
            {hashValue || <span className="text-zinc-600">-</span>}
          </div>
          {hashValue && (
            <Button
              size="sm"
              onClick={() => copyToClipboard(hashValue, `${algorithm} hash copied!`)}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 h-9 px-2 shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div ref={containerRef} className="space-y-6">
      <Tabs defaultValue="text" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 p-1.5 bg-zinc-950/60 border border-zinc-700 rounded-xl">
          <TabsTrigger
            value="text"
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg data-active:bg-cyan-500/10 data-active:text-cyan-400 data-active:border-cyan-500/20 font-medium min-w-0"
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span className="truncate">Text Hash</span>
          </TabsTrigger>
          <TabsTrigger
            value="file"
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg data-active:bg-cyan-500/10 data-active:text-cyan-400 data-active:border-cyan-500/20 font-medium min-w-0"
          >
            <Upload className="w-4 h-4 shrink-0" />
            <span className="truncate">File Checksum</span>
          </TabsTrigger>
        </TabsList>

        {/* TEXT HASH TAB */}
        <TabsContent value="text" className="mt-0 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-6">
              <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
                
                <CardHeader>
                  <CardTitle className="text-zinc-50 flex items-center gap-2">
                    <Hash className="w-5 h-5 text-cyan-400" />
                    Text Hash Generator
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Generate cryptographic hashes for text strings using multiple algorithms.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="text-input" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                      Input Text
                    </Label>
                    <textarea
                      id="text-input"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Enter text to hash..."
                      className="w-full bg-zinc-900/60 border border-zinc-700 focus:border-cyan-500/50 text-zinc-100 placeholder-zinc-600 rounded-lg p-3 text-sm h-[150px] outline-none resize-none"
                    />
                    {textInput && (
                      <Button
                        variant="ghost"
                        onClick={clearText}
                        className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 w-full text-xs h-8"
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Clear Text
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-zinc-300">Hash Results</h3>
              </div>
              <HashResultCard algorithm="MD5" hashValue={textHashes.MD5} label="MD5" />
              <HashResultCard algorithm="SHA-1" hashValue={textHashes["SHA-1"]} label="SHA-1" />
              <HashResultCard algorithm="SHA-256" hashValue={textHashes["SHA-256"]} label="SHA-256" />
              <HashResultCard algorithm="SHA-512" hashValue={textHashes["SHA-512"]} label="SHA-512" />
            </div>
          </div>
        </TabsContent>

        {/* FILE HASH TAB */}
        <TabsContent value="file" className="mt-0 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-6">
              <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
                
                <CardHeader>
                  <CardTitle className="text-zinc-50 flex items-center gap-2">
                    <Hash className="w-5 h-5 text-cyan-400" />
                    File Checksum Calculator
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Calculate cryptographic hashes for files entirely in your browser.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {!file ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all border-zinc-800 hover:border-cyan-500/30 hover:bg-cyan-500/[0.01] group"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      
                      <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800 group-hover:scale-110 group-hover:border-cyan-500/30 transition-all mx-auto w-fit">
                        <Upload className="w-8 h-8 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
                      </div>

                      <div className="space-y-1 mt-4">
                        <p className="text-zinc-200 font-semibold">Click to upload a file</p>
                        <p className="text-xs text-zinc-500">or drag and drop here</p>
                      </div>

                      <p className="text-[10px] text-zinc-500 max-w-xs mx-auto mt-2">
                        All calculations are performed locally in your browser.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80">
                        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-700">
                          <FileText className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-zinc-200 font-semibold truncate text-sm">{file.name}</p>
                          <p className="text-xs text-zinc-400">{formatFileSize(file.size)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={clearFile}
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-full h-9 w-9 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {isCalculating && (
                        <div className="flex items-center gap-2 text-cyan-400 text-sm">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Calculating hashes...</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-zinc-300">File Checksums</h3>
              </div>
              <HashResultCard algorithm="MD5" hashValue={fileHashes.MD5} label="MD5" />
              <HashResultCard algorithm="SHA-1" hashValue={fileHashes["SHA-1"]} label="SHA-1" />
              <HashResultCard algorithm="SHA-256" hashValue={fileHashes["SHA-256"]} label="SHA-256" />
              <HashResultCard algorithm="SHA-512" hashValue={fileHashes["SHA-512"]} label="SHA-512" />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}