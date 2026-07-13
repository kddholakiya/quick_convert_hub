import React from "react";
import Link from "next/link";
import { Zap, ShieldCheck, Code } from "lucide-react";

export default function Navbar() {
  return (
    <header className="relative z-50 border-b border-zinc-900 bg-black/60 backdrop-blur-md px-6 py-4 flex justify-between items-center w-full sticky top-0">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-emerald-400 to-emerald-300 flex items-center justify-center shadow-lg shadow-emerald-500/10 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 text-black font-extrabold" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold tracking-tight text-white flex items-center gap-1.5 group-hover:text-emerald-400 transition-colors">
              QuickConvert Hub
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h1>
            <p className="text-[10px] text-zinc-500 font-mono">100% Client-Side Privacy Toolsets</p>
          </div>
        </Link>
      </div>

      {/* Desktop Header Links */}
      <div className="flex items-center gap-5 text-sm text-zinc-400 font-medium">
        <div className="hidden md:flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" /> Zero Data Uploads
        </div>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
          <Code className="w-4 h-4" /> GitHub
        </a>
      </div>
    </header>
  );
}
