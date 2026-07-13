"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  Key,
  ShieldCheck,
  Copy,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Code,
  Info,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// JWT parsing helpers
function base64UrlDecode(base64Url: string): string {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
  try {
    const decoded = atob(padded);
    return decoded;
  } catch {
    return "";
  }
}

function parseJWT(token: string): { header: any; payload: any; signature: string; error: string | null } {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return { header: null, payload: null, signature: "", error: "Invalid JWT format. Must have 3 parts separated by dots." };
  }

  try {
    const headerStr = base64UrlDecode(parts[0]);
    const payloadStr = base64UrlDecode(parts[1]);
    
    const header = JSON.parse(headerStr);
    const payload = JSON.parse(payloadStr);
    
    return { header, payload, signature: parts[2], error: null };
  } catch (e) {
    return { header: null, payload: null, signature: "", error: "Failed to decode JWT. Invalid base64 or JSON." };
  }
}

// Simple HMAC-SHA256 verification (for HS256)
async function verifyHMAC(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split(".");
    const data = `${parts[0]}.${parts[1]}`;
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(data);
    
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign("HMAC", key, messageData);
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
    
    return signatureBase64 === parts[2];
  } catch {
    return false;
  }
}

export default function JwtTool() {
  const [jwtInput, setJwtInput] = useState("");
  const [secretInput, setSecretInput] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [parsedData, setParsedData] = useState<{ header: any; payload: any; signature: string; error: string | null } | null>(null);
  const [verificationResult, setVerificationResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

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

  // Auto-parse on input change
  useEffect(() => {
    if (!jwtInput.trim()) {
      setParsedData(null);
      setVerificationResult(null);
      return;
    }
    const result = parseJWT(jwtInput.trim());
    setParsedData(result);
    setVerificationResult(null);
  }, [jwtInput]);

  const handleVerify = async () => {
    if (!parsedData || parsedData.error || !secretInput.trim()) {
      toast.error("Please enter a valid JWT and secret key");
      return;
    }

    const algorithm = parsedData.header?.alg;
    if (algorithm !== "HS256") {
      toast.error(`Only HS256 algorithm is supported for verification. Found: ${algorithm}`);
      return;
    }

    const isValid = await verifyHMAC(jwtInput.trim(), secretInput.trim());
    setVerificationResult({
      valid: isValid,
      message: isValid ? "Signature verified successfully!" : "Signature verification failed!"
    });
    
    if (isValid) {
      toast.success("JWT signature verified!");
    } else {
      toast.error("JWT signature verification failed!");
    }
  };

  const copyToClipboard = (text: string, msg: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(msg);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearAll = () => {
    setJwtInput("");
    setSecretInput("");
    setParsedData(null);
    setVerificationResult(null);
  };

  const formatJSON = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Input */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
            
            <CardHeader>
              <CardTitle className="text-zinc-50 flex items-center gap-2">
                <Key className="w-5 h-5 text-rose-400" />
                JWT Decoder & Verifier
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Decode JSON Web Tokens locally and verify signatures with your secret key.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* JWT Input */}
              <div className="space-y-2">
                <Label htmlFor="jwt-input" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                  JWT Token
                </Label>
                <textarea
                  id="jwt-input"
                  value={jwtInput}
                  onChange={(e) => setJwtInput(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
                  className="w-full bg-zinc-900/60 border border-zinc-700 focus:border-rose-500/50 text-zinc-100 placeholder-zinc-600 rounded-lg p-3 font-mono text-xs h-[120px] outline-none resize-none"
                />
                {jwtInput && (
                  <Button
                    variant="ghost"
                    onClick={() => setJwtInput("")}
                    className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 w-full text-xs h-8"
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Clear JWT
                  </Button>
                )}
              </div>

              {/* Secret Key Input */}
              <div className="space-y-2">
                <Label htmlFor="secret-input" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-400" /> Secret Key (for HS256 verification)
                </Label>
                <div className="relative">
                  <Input
                    id="secret-input"
                    type={showSecret ? "text" : "password"}
                    value={secretInput}
                    onChange={(e) => setSecretInput(e.target.value)}
                    placeholder="your-256-bit-secret"
                    className="bg-zinc-900/60 border-zinc-700 focus:border-rose-500/50 text-zinc-100 placeholder-zinc-600 pr-10 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Verify Button */}
              <Button
                onClick={handleVerify}
                disabled={!parsedData || !!parsedData.error}
                className="w-full bg-rose-500 hover:bg-rose-400 text-zinc-950 font-bold border-none py-5 flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/10 cursor-pointer disabled:opacity-40"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" /> <span className="truncate">Verify Signature</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Results */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Verification Status */}
          {verificationResult && (
            <Card className={`animate-fade-in bg-zinc-950/60 border backdrop-blur-xl relative overflow-hidden ${
              verificationResult.valid 
                ? "border-emerald-500/20 shadow-[0_0_25px_rgba(16,185,129,0.06)] ring-1 ring-emerald-500/10" 
                : "border-rose-500/20 shadow-[0_0_25px_rgba(244,63,94,0.06)] ring-1 ring-rose-500/10"
            }`}>
              <CardHeader className="border-b border-zinc-900 pb-4">
                <CardTitle className="text-sm text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  {verificationResult.valid ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  )}
                  Verification Result
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className={`text-sm font-semibold ${verificationResult.valid ? "text-emerald-400" : "text-rose-400"}`}>
                  {verificationResult.message}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Parsed Header */}
          {parsedData && parsedData.header && (
            <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in relative overflow-hidden">
              <CardHeader className="border-b border-zinc-900 pb-4">
                <CardTitle className="text-sm text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-rose-400" /> Header
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl p-3 font-mono text-zinc-300 text-xs overflow-x-auto">
                  <pre className="whitespace-pre-wrap break-all">{formatJSON(parsedData.header)}</pre>
                </div>
                <Button
                  onClick={() => copyToClipboard(formatJSON(parsedData.header), "Header copied!")}
                  className="w-full bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-100 font-semibold transition-all py-3 flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Copy Header
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Parsed Payload */}
          {parsedData && parsedData.payload && (
            <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in relative overflow-hidden">
              <CardHeader className="border-b border-zinc-900 pb-4">
                <CardTitle className="text-sm text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-rose-400" /> Payload
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl p-3 font-mono text-zinc-300 text-xs overflow-x-auto max-h-[200px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap break-all">{formatJSON(parsedData.payload)}</pre>
                </div>
                <Button
                  onClick={() => copyToClipboard(formatJSON(parsedData.payload), "Payload copied!")}
                  className="w-full bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-100 font-semibold transition-all py-3 flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Copy Payload
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {parsedData && parsedData.error && (
            <Card className="bg-rose-500/5 border-rose-500/20 backdrop-blur-xl animate-fade-in">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-rose-400">
                  <AlertCircle className="w-5 h-5" />
                  <p className="font-semibold text-sm">Invalid JWT</p>
                </div>
                <p className="text-xs text-rose-300/80">{parsedData.error}</p>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!parsedData && (
            <Card className="bg-zinc-950/40 border-zinc-800/60 backdrop-blur-xl">
              <CardContent className="p-6 space-y-3">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">How to use</h4>
                <ul className="space-y-2 text-[11px] text-zinc-500 leading-relaxed">
                  <li className="flex gap-2"><span className="text-rose-400 shrink-0">1.</span> Paste your JWT token in the input field</li>
                  <li className="flex gap-2"><span className="text-rose-400 shrink-0">2.</span> View the decoded header and payload instantly</li>
                  <li className="flex gap-2"><span className="text-rose-400 shrink-0">3.</span> For HS256 tokens, enter your secret to verify the signature</li>
                  <li className="flex gap-2"><span className="text-rose-400 shrink-0">4.</span> All processing happens locally in your browser</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}