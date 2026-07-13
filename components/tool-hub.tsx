"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import {
  QrCode, 
  ArrowRightLeft, 
  Lock, 
  Sparkles, 
  Terminal, 
  HelpCircle, 
  Code,
  Zap,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  Braces,
  Key,
  Hash,
  Droplet,
  Palette,
  Link2,
  Clock,
  Search
} from "lucide-react";
import QrTool from "./qr-tool";
import Base64Tool from "./base64-tool";
import CryptoTool from "./crypto-tool";
import JsonTool from "./json-tool";
import JwtTool from "./jwt-tool";
import HashTool from "./hash-tool";
import ColorTool from "./color-tool";
import UrlTool from "./url-tool";
import CronTool from "./cron-tool";
import RegexTool from "./regex-tool";
import BcryptTool from "./bcrypt-tool";
import { Button } from "@/components/ui/button";

type ToolType = "qr" | "base64" | "crypto" | "json" | "jwt" | "hash" | "color" | "url" | "cron" | "regex" | "bcrypt";

interface ToolItem {
  id: ToolType;
  href: string;
  name: string;
  shortDesc: string;
  desc: string;
  icon: React.ComponentType<any>;
  badge?: string;
  accentClass: string;
  bgGlowClass: string;
}

const TOOLS: ToolItem[] = [
  {
    id: "qr",
    href: "/",
    name: "QR Code Studio",
    shortDesc: "Generate & Scan QR codes",
    desc: "Create fully customizable branded QR codes with custom colors and logo overlays, or scan directly using camera/files.",
    icon: QrCode,
    accentClass: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
    bgGlowClass: "from-emerald-500/10 via-transparent to-transparent"
  },
  {
    id: "base64",
    href: "/base64-converter",
    name: "Base64 Converter",
    shortDesc: "Image <-> Base64 parser",
    desc: "Convert image files to base64 string outputs instantly or paste base64 representations to recover original image formats.",
    icon: ArrowRightLeft,
    badge: "New",
    accentClass: "text-purple-400 border-purple-500/20 bg-purple-500/5",
    bgGlowClass: "from-purple-500/10 via-transparent to-transparent"
  },
  {
    id: "crypto",
    href: "/aes-256-encryption",
    name: "AES-256 Vault",
    shortDesc: "Encrypt & decrypt text",
    desc: "Use secure password-based PBKDF2 + AES-GCM algorithms or raw Key+IV AES-CBC to lock messages or payload structures completely client-side.",
    icon: Lock,
    badge: "Secure",
    accentClass: "text-amber-400 border-amber-500/20 bg-amber-500/5",
    bgGlowClass: "from-amber-500/10 via-transparent to-transparent"
  },
  {
    id: "json",
    href: "/json-formatter",
    name: "JSON Tools",
    shortDesc: "Format, parse & compare JSON",
    desc: "Pretty-print and syntax-highlight JSON instantly, or run a side-by-side line diff to spot differences between two JSON payloads.",
    icon: Braces,
    badge: "New",
    accentClass: "text-violet-400 border-violet-500/20 bg-violet-500/5",
    bgGlowClass: "from-violet-500/10 via-transparent to-transparent"
  },
  {
    id: "jwt",
    href: "/jwt-decoder",
    name: "JWT Decoder",
    shortDesc: "Decode & verify JWT tokens",
    desc: "Inspect JSON Web Tokens locally by decoding headers and payloads, with optional signature verification using your secret key.",
    icon: Key,
    badge: "Secure",
    accentClass: "text-rose-400 border-rose-500/20 bg-rose-500/5",
    bgGlowClass: "from-rose-500/10 via-transparent to-transparent"
  },
  {
    id: "hash",
    href: "/hash-generator",
    name: "Hash Generator",
    shortDesc: "MD5, SHA-1, SHA-256, SHA-512",
    desc: "Generate cryptographic hashes for text strings or files using multiple algorithms. All calculations performed client-side.",
    icon: Hash,
    accentClass: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5",
    bgGlowClass: "from-cyan-500/10 via-transparent to-transparent"
  },
  {
    id: "color",
    href: "/color-converter",
    name: "Color Converter",
    shortDesc: "HEX, RGB, HSL, CMYK & palette",
    desc: "Convert colors between different formats and extract dominant color palettes from uploaded images using canvas processing.",
    icon: Droplet,
    accentClass: "text-pink-400 border-pink-500/20 bg-pink-500/5",
    bgGlowClass: "from-pink-500/10 via-transparent to-transparent"
  },
  {
    id: "url",
    href: "/url-tools",
    name: "URL Tools",
    shortDesc: "Encode, decode & parse URLs",
    desc: "Encode and decode URL strings, or parse complete URLs into components like protocol, host, path, query parameters, and hash.",
    icon: Link2,
    accentClass: "text-sky-400 border-sky-500/20 bg-sky-500/5",
    bgGlowClass: "from-sky-500/10 via-transparent to-transparent"
  },
  {
    id: "cron",
    href: "/cron-translator",
    name: "Cron Translator",
    shortDesc: "Translate cron expressions",
    desc: "Convert cryptic cron schedules into human-readable descriptions and preview the next 5 execution times.",
    icon: Clock,
    accentClass: "text-orange-400 border-orange-500/20 bg-orange-500/5",
    bgGlowClass: "from-orange-500/10 via-transparent to-transparent"
  },
  {
    id: "regex",
    href: "/regex-tester",
    name: "Regex Tester",
    shortDesc: "Test regular expressions",
    desc: "Test regex patterns against text with visual highlighting and a built-in cheat sheet for common patterns.",
    icon: Search,
    accentClass: "text-lime-400 border-lime-500/20 bg-lime-500/5",
    bgGlowClass: "from-lime-500/10 via-transparent to-transparent"
  },
  {
    id: "bcrypt",
    href: "/bcrypt-password",
    name: "Bcrypt Hasher",
    shortDesc: "Hash & compare passwords",
    desc: "Generate secure bcrypt hashes for passwords with configurable cost factor, and verify passwords against existing hashes.",
    icon: Lock,
    badge: "Secure",
    accentClass: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
    bgGlowClass: "from-indigo-500/10 via-transparent to-transparent"
  }
];

export default function ToolHub({ activeTool }: { activeTool: ToolType }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mainPanelRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);

  // Background animated particle blobs
  useEffect(() => {
    if (backgroundRef.current) {
      const blobs = backgroundRef.current.querySelectorAll(".glow-blob");
      blobs.forEach((blob) => {
        gsap.to(blob, {
          x: "random(-100, 100)",
          y: "random(-100, 100)",
          duration: "random(10, 20)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      });
    }
  }, []);

  // Fade-in entrance for the active tool panel on mount/route change
  useEffect(() => {
    if (mainPanelRef.current) {
      gsap.fromTo(
        mainPanelRef.current,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [activeTool]);

  const activeToolObj = TOOLS.find(t => t.id === activeTool)!;
  const ActiveComponent = activeTool === "qr" 
    ? QrTool 
    : activeTool === "base64" 
      ? Base64Tool 
      : activeTool === "json"
        ? JsonTool
        : activeTool === "crypto"
          ? CryptoTool
          : activeTool === "jwt"
            ? JwtTool
            : activeTool === "hash"
              ? HashTool
              : activeTool === "color"
                ? ColorTool
                : activeTool === "url"
                  ? UrlTool
                  : activeTool === "cron"
                    ? CronTool
                    : activeTool === "bcrypt"
                      ? BcryptTool
                      : RegexTool;

  return (
    <div className="flex-1 w-full min-h-screen bg-black text-zinc-100 flex flex-col relative overflow-hidden font-sans select-none antialiased">
      
      {/* 1. FUTURISTIC BACKGROUND GRID & BLURRED GLOWS */}
      <div ref={backgroundRef} className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Fine-line grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370f_1px,transparent_1px),linear-gradient(to_bottom,#1f29370f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
        
        {/* Soft glowing ambient circles */}
        <div className="glow-blob absolute top-[10%] left-[20%] w-[350px] h-[350px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
        <div className="glow-blob absolute bottom-[20%] right-[15%] w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[140px] pointer-events-none" />
        <div className="glow-blob absolute top-[40%] right-[30%] w-[300px] h-[300px] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />
        <div className="glow-blob absolute top-[60%] left-[10%] w-[250px] h-[250px] rounded-full bg-rose-500/5 blur-[80px] pointer-events-none" />
        <div className="glow-blob absolute bottom-[10%] left-[30%] w-[300px] h-[300px] rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none" />
        <div className="glow-blob absolute top-[20%] right-[10%] w-[280px] h-[280px] rounded-full bg-pink-500/5 blur-[90px] pointer-events-none" />
      </div>

      {/* 2. MOBILE MENU TOGGLE BAR */}
      <div className="md:hidden relative z-20 border-b border-zinc-900 bg-black/60 backdrop-blur-md px-6 py-3 flex justify-between items-center w-full">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Menu</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-zinc-400 hover:text-white bg-zinc-900/40 border border-zinc-800 h-8 w-8"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT AREA */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10">
        
        {/* DESKTOP SIDEBAR NAVIGATION (Col spans 3) */}
        <aside className="hidden md:block md:col-span-3 space-y-6" aria-label="Tool navigation">
          <div className="space-y-2">
            <h2 className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold font-mono pl-3">Conversion Suite</h2>
            <nav className="space-y-1.5" aria-label="Developer tools">
              {TOOLS.map((tool) => {
                const Icon = tool.icon;
                const isSelected = tool.id === activeTool;
                return (
                  <Link
                    key={tool.id}
                    href={tool.href}
                    prefetch
                    aria-label={`Open ${tool.name} - ${tool.shortDesc}`}
                    aria-current={isSelected ? "page" : undefined}
                    className={`w-full text-left flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer group ${
                      isSelected
                        ? `bg-zinc-900 border-zinc-800 ${tool.accentClass.split(" ")[0]} shadow-[0_0_15px_rgba(255,255,255,0.02)]`
                        : "border-transparent bg-transparent hover:bg-zinc-900/30 hover:border-zinc-900 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border transition-all ${
                        isSelected ? tool.accentClass : "border-zinc-800/80 bg-zinc-900/40 text-zinc-500 group-hover:text-zinc-400"
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold tracking-tight truncate">{tool.name}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{tool.shortDesc}</p>
                      </div>
                    </div>
                    
                    {tool.badge ? (
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                        tool.id === "base64" || tool.id === "json"
                          ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                          : tool.id === "jwt" || tool.id === "crypto" || tool.id === "bcrypt"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {tool.badge}
                      </span>
                    ) : (
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? "translate-x-0.5 opacity-100" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-zinc-600"}`} />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Quick Info Deck */}
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4.5 space-y-3.5 backdrop-blur-md">
            <h4 className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              Developer Guarantee
            </h4>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              No remote servers process or store your text payloads or uploaded media. Cryptography keys and canvas parses run solely inside your browser environment.
            </p>
            <div className="h-px bg-zinc-900" />
            <a 
              href="https://github.com" 
              className="text-[10px] font-semibold text-zinc-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Documentation Guide
            </a>
          </div>
        </aside>

        {/* MOBILE MENU overlay (Visible when toggled on mobile) */}
        {mobileMenuOpen && (
          <div className="absolute inset-x-0 top-0 z-30 bg-black border-b border-zinc-900 p-6 space-y-4 md:hidden flex flex-col backdrop-blur-lg animate-in fade-in slide-in-from-top duration-250" role="dialog" aria-modal="true">
            <h2 className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold font-mono">Select Active Tool</h2>
            <nav className="flex flex-col gap-2" aria-label="Mobile tool navigation">
              {TOOLS.map((tool) => {
                const Icon = tool.icon;
                const isSelected = tool.id === activeTool;
                return (
                  <Link
                    key={tool.id}
                    href={tool.href}
                    prefetch
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label={`Open ${tool.name} - ${tool.shortDesc}`}
                    aria-current={isSelected ? "page" : undefined}
                    className={`flex items-center justify-between p-3.5 rounded-xl border ${
                      isSelected
                        ? `bg-zinc-900 border-zinc-800 ${tool.accentClass.split(" ")[0]}`
                        : "border-zinc-900 bg-zinc-950/40 text-zinc-400"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Icon className="w-4 h-4 shrink-0" />
                      <div className="text-left min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{tool.name}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{tool.shortDesc}</p>
                      </div>
                    </div>
                    {tool.badge && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        tool.id === "base64" || tool.id === "json"
                          ? "bg-violet-500/15 text-violet-400 border border-violet-500/20"
                          : tool.id === "jwt" || tool.id === "crypto" || tool.id === "bcrypt"
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                      }`}>
                        {tool.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* MAIN ACTIVE VIEWPORT (Col spans 9) */}
        <main ref={mainPanelRef} className="col-span-1 md:col-span-9 space-y-6" role="main" aria-label={`${activeToolObj.name} tool interface`}>
          
          {/* Active Tool Header and Info Summary */}
          <div className="border border-zinc-900 bg-zinc-950/30 p-5 rounded-2xl backdrop-blur-md relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className={`absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b ${
              activeTool === "qr" 
                ? "from-emerald-400 to-teal-600" 
                : activeTool === "base64" 
                  ? "from-purple-400 to-indigo-600" 
                  : activeTool === "json"
                    ? "from-violet-400 to-purple-600"
                    : activeTool === "crypto"
                      ? "from-amber-400 to-orange-600"
                      : activeTool === "jwt"
                        ? "from-rose-400 to-red-600"
                        : activeTool === "hash"
                          ? "from-cyan-400 to-blue-600"
                          : activeTool === "color"
                            ? "from-pink-400 to-rose-600"
                            : activeTool === "url"
                              ? "from-sky-400 to-blue-600"
                              : activeTool === "cron"
                                ? "from-orange-400 to-amber-600"
                                : activeTool === "bcrypt"
                                  ? "from-indigo-400 to-blue-600"
                                  : "from-lime-400 to-green-600"
            }`} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">{activeToolObj.name}</h1>
                {activeToolObj.badge && (
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wide uppercase ${
                    activeTool === "base64" || activeTool === "json"
                      ? "bg-violet-500/15 text-violet-400 border border-violet-500/25" 
                      : activeTool === "jwt" || activeTool === "crypto" || activeTool === "bcrypt"
                        ? "bg-rose-500/15 text-rose-400 border border-rose-500/25"
                        : "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                  }`}>
                    {activeToolObj.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-xl">{activeToolObj.desc}</p>
            </div>
            
            <div className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5 self-end md:self-center shrink-0 border border-zinc-900/80 bg-zinc-950/80 px-3 py-1.5 rounded-full">
              <Sparkles className={`w-3.5 h-3.5 ${
                activeTool === "qr" ? "text-emerald-400" : 
                activeTool === "base64" ? "text-purple-400" : 
                activeTool === "json" ? "text-violet-400" : 
                activeTool === "crypto" ? "text-amber-400" :
                activeTool === "jwt" ? "text-rose-400" :
                activeTool === "hash" ? "text-cyan-400" :
                activeTool === "color" ? "text-pink-400" :
                activeTool === "url" ? "text-sky-400" :
                activeTool === "cron" ? "text-orange-400" :
                activeTool === "bcrypt" ? "text-indigo-400" :
                "text-lime-400"
              }`} />
              Active Workspace
            </div>
          </div>

          {/* Render Active Component Panel */}
          <div className="relative">
            <ActiveComponent />
          </div>

        </main>
      </div>

      {/* 4. FOOTER */}
      <footer className="relative z-20 border-t border-zinc-950 bg-black/80 px-6 py-6 text-center text-[10px] text-zinc-650 text-zinc-500 mt-auto">
        <p className="max-w-md mx-auto leading-relaxed">
          QuickConvert Hub © 2026. Designed with Shadcn and animated with GSAP. Zero trackers, zero cookies, zero network transfers. Handcrafted client-side utility suite.
        </p>
      </footer>

    </div>
  );
}
