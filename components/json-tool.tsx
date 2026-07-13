"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import {
  Braces,
  GitCompare,
  Copy,
  Check,
  Trash2,
  Minimize2,
  Maximize2,
  AlertCircle,
  CheckCircle2,
  ArrowLeftRight,
  Download,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// ─── Diff Types ────────────────────────────────────────────────
type DiffLine =
  | { type: "equal"; line: string; lineA: number; lineB: number }
  | { type: "added"; line: string; lineB: number }
  | { type: "removed"; line: string; lineA: number }
  | { type: "changed"; lineA: string; lineB: string; lineNumA: number; lineNumB: number };

// ─── Lightweight line-by-line diff ─────────────────────────────
function computeDiff(aText: string, bText: string): DiffLine[] {
  const aLines = aText.split("\n");
  const bLines = bText.split("\n");

  // LCS-based diff (simple Myers-like approach for reasonable sizes)
  const m = aLines.length;
  const n = bLines.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (aLines[i] === bLines[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const result: DiffLine[] = [];
  let i = 0, j = 0, lineA = 1, lineB = 1;

  while (i < m && j < n) {
    if (aLines[i] === bLines[j]) {
      result.push({ type: "equal", line: aLines[i], lineA: lineA++, lineB: lineB++ });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: "removed", line: aLines[i], lineA: lineA++ });
      i++;
    } else {
      result.push({ type: "added", line: bLines[j], lineB: lineB++ });
      j++;
    }
  }
  while (i < m) {
    result.push({ type: "removed", line: aLines[i], lineA: lineA++ });
    i++;
  }
  while (j < n) {
    result.push({ type: "added", line: bLines[j], lineB: lineB++ });
    j++;
  }

  return result;
}

// ─── Syntax highlighting (token-level) ─────────────────────────
function syntaxHighlight(json: string): string {
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = "text-sky-300"; // number
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = "text-violet-300 font-medium"; // key
          } else {
            cls = "text-emerald-300"; // string value
          }
        } else if (/true|false/.test(match)) {
          cls = "text-amber-300";
        } else if (/null/.test(match)) {
          cls = "text-rose-400";
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
}

// ─── Helpers ───────────────────────────────────────────────────
function tryParse(text: string): { ok: true; parsed: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, parsed: JSON.parse(text) };
  } catch (e: unknown) {
    return { ok: false, error: (e as Error).message };
  }
}

export default function JsonTool() {
  // ── Formatter State ──
  const [rawInput, setRawInput] = useState("");
  const [indent, setIndent] = useState(2);
  const [formattedOutput, setFormattedOutput] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Comparer State ──
  const [leftJson, setLeftJson] = useState("");
  const [rightJson, setRightJson] = useState("");
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);
  const [diffStats, setDiffStats] = useState({ added: 0, removed: 0, equal: 0 });
  const [leftError, setLeftError] = useState<string | null>(null);
  const [rightError, setRightError] = useState<string | null>(null);
  const [compareRan, setCompareRan] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Mount animation
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll(".animate-fade-in"),
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power2.out" }
      );
    }
  }, []);

  // ── Auto-format on input/indent change ──
  useEffect(() => {
    if (!rawInput.trim()) {
      setFormattedOutput("");
      setParseError(null);
      return;
    }
    const result = tryParse(rawInput);
    if (result.ok) {
      setFormattedOutput(JSON.stringify(result.parsed, null, indent));
      setParseError(null);
    } else {
      setFormattedOutput("");
      setParseError(result.error);
    }
  }, [rawInput, indent]);

  // ── Minify ──
  const handleMinify = () => {
    if (!rawInput.trim()) return;
    const result = tryParse(rawInput);
    if (!result.ok) { toast.error("Invalid JSON — cannot minify"); return; }
    const minified = JSON.stringify(result.parsed);
    setRawInput(minified);
    toast.success("JSON minified!");
  };

  // ── Copy formatted ──
  const handleCopy = async () => {
    if (!formattedOutput) return;
    await navigator.clipboard.writeText(formattedOutput);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Download formatted ──
  const handleDownload = () => {
    if (!formattedOutput) return;
    const blob = new Blob([formattedOutput], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `formatted-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded!");
  };

  // ── JSON Compare ──
  const handleCompare = useCallback(() => {
    const lResult = tryParse(leftJson);
    const rResult = tryParse(rightJson);

    setLeftError(lResult.ok ? null : lResult.error);
    setRightError(rResult.ok ? null : rResult.error);

    if (!lResult.ok || !rResult.ok) {
      toast.error("Fix JSON errors before comparing.");
      return;
    }

    const prettyLeft = JSON.stringify(lResult.parsed, null, 2);
    const prettyRight = JSON.stringify(rResult.parsed, null, 2);

    const diff = computeDiff(prettyLeft, prettyRight);
    setDiffLines(diff);

    const stats = diff.reduce(
      (acc, d) => {
        if (d.type === "added") acc.added++;
        else if (d.type === "removed") acc.removed++;
        else acc.equal++;
        return acc;
      },
      { added: 0, removed: 0, equal: 0 }
    );
    setDiffStats(stats);
    setCompareRan(true);

    if (stats.added === 0 && stats.removed === 0) {
      toast.success("✅ JSONs are identical!");
    } else {
      toast.info(`Found ${stats.added + stats.removed} difference(s)`);
    }
  }, [leftJson, rightJson]);

  const handleSwap = () => {
    setLeftJson(rightJson);
    setRightJson(leftJson);
    setCompareRan(false);
    setDiffLines([]);
  };

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="space-y-6">
      <Tabs defaultValue="format" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 p-1.5 bg-zinc-950/60 border border-zinc-700 rounded-xl">
          <TabsTrigger
            value="format"
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg data-active:bg-violet-500/10 data-active:text-violet-400 data-active:border-violet-500/20 font-medium min-w-0"
          >
            <Braces className="w-4 h-4 shrink-0" />
            <span className="truncate">JSON Formatter / Parser</span>
          </TabsTrigger>
          <TabsTrigger
            value="compare"
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg data-active:bg-violet-500/10 data-active:text-violet-400 data-active:border-violet-500/20 font-medium min-w-0"
          >
            <GitCompare className="w-4 h-4 shrink-0" />
            <span className="truncate">JSON Compare / Diff</span>
          </TabsTrigger>
        </TabsList>

        {/* ════════════ FORMATTER TAB ════════════ */}
        <TabsContent value="format" className="mt-0 space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* ── INPUT ── */}
            <Card className="animate-fade-in bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-zinc-50 flex items-center gap-2 text-base">
                    <Braces className="w-4 h-4 text-violet-400" />
                    Raw / Minified JSON
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {/* Indent selector */}
                    <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-700 rounded-lg px-2 py-1">
                      <span className="text-[10px] text-zinc-500 font-mono">Indent</span>
                      {[2, 4].map((n) => (
                        <button
                          key={n}
                          onClick={() => setIndent(n)}
                          className={`text-xs font-bold px-1.5 py-0.5 rounded transition-all ${
                            indent === n
                              ? "bg-violet-500/20 text-violet-300"
                              : "text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setRawInput("")}
                      className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 h-8 px-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-zinc-500 text-xs">
                  Paste raw, minified, or escaped JSON
                </CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  id="json-format-input"
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder={`{\n  "key": "value",\n  "number": 42\n}`}
                  spellCheck={false}
                  className="w-full bg-zinc-900/60 border border-zinc-700 focus:border-violet-500/50 outline-none text-zinc-100 placeholder-zinc-600 rounded-xl p-4 font-mono text-sm h-[380px] resize-none leading-relaxed transition-colors"
                />
                {/* Validation status */}
                <div className="mt-3 flex items-center justify-between">
                  {rawInput.trim() ? (
                    parseError ? (
                      <span className="flex items-center gap-1.5 text-xs text-rose-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {parseError}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Valid JSON
                      </span>
                    )
                  ) : (
                    <span className="text-xs text-zinc-600">Awaiting input…</span>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleMinify}
                    disabled={!formattedOutput}
                    className="text-xs text-zinc-500 hover:text-violet-300 h-7 px-2 gap-1 disabled:opacity-30"
                  >
                    <Minimize2 className="w-3 h-3" /> Minify
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ── OUTPUT ── */}
            <Card className="animate-fade-in bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-48 h-48 bg-violet-500/5 blur-3xl rounded-full -ml-16 -mt-16 pointer-events-none" />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-zinc-50 flex items-center gap-2 text-base">
                    <Maximize2 className="w-4 h-4 text-violet-400" />
                    Formatted Output
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDownload}
                      disabled={!formattedOutput}
                      className="text-zinc-500 hover:text-violet-300 h-8 px-2 disabled:opacity-30"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCopy}
                      disabled={!formattedOutput}
                      className="h-8 px-3 text-xs bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/20 disabled:opacity-30"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="ml-1">{copied ? "Copied" : "Copy"}</span>
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-zinc-500 text-xs">
                  Syntax-highlighted, pretty-printed result
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-zinc-900/60 border border-zinc-700 rounded-xl p-4 font-mono text-sm h-[380px] overflow-auto leading-relaxed">
                  {formattedOutput ? (
                    <pre
                      className="whitespace-pre-wrap break-words"
                      dangerouslySetInnerHTML={{ __html: syntaxHighlight(formattedOutput) }}
                    />
                  ) : parseError ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                      <AlertCircle className="w-8 h-8 text-rose-500/60" />
                      <p className="text-rose-400 text-xs max-w-[200px] leading-relaxed">{parseError}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-600">
                      <Braces className="w-8 h-8 opacity-30" />
                      <p className="text-xs">Formatted JSON will appear here</p>
                    </div>
                  )}
                </div>

                {/* Stats bar */}
                {formattedOutput && (
                  <div className="mt-3 flex items-center gap-4 text-[10px] font-mono text-zinc-500">
                    <span>{formattedOutput.split("\n").length} lines</span>
                    <span>{new Blob([formattedOutput]).size.toLocaleString()} bytes</span>
                    <span>
                      {(() => {
                        try { return Object.keys(JSON.parse(rawInput)).length + " root keys"; } catch { return ""; }
                      })()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ════════════ COMPARE TAB ════════════ */}
        <TabsContent value="compare" className="mt-0 space-y-6">
          {/* Input row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Left JSON */}
            <Card className="animate-fade-in bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-zinc-50 text-sm flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-bold flex items-center justify-center">A</span>
                    Original JSON
                  </CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => setLeftJson("")} className="h-7 px-2 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <textarea
                  id="json-compare-left"
                  value={leftJson}
                  onChange={(e) => { setLeftJson(e.target.value); setCompareRan(false); }}
                  placeholder={'{\n  "name": "Alice",\n  "age": 30\n}'}
                  spellCheck={false}
                  className={`w-full bg-zinc-900/60 border rounded-xl p-3.5 font-mono text-xs h-[260px] resize-none leading-relaxed outline-none text-zinc-100 placeholder-zinc-600 transition-colors ${
                    leftError ? "border-rose-500/40 focus:border-rose-500/60" : "border-zinc-700 focus:border-emerald-500/40"
                  }`}
                />
                {leftError && (
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-rose-400">
                    <AlertCircle className="w-3 h-3" /> {leftError}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Right JSON */}
            <Card className="animate-fade-in bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-sky-500/5 blur-3xl rounded-full pointer-events-none" />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-zinc-50 text-sm flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-sky-500/15 border border-sky-500/25 text-sky-400 text-xs font-bold flex items-center justify-center">B</span>
                    Modified JSON
                  </CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => setRightJson("")} className="h-7 px-2 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <textarea
                  id="json-compare-right"
                  value={rightJson}
                  onChange={(e) => { setRightJson(e.target.value); setCompareRan(false); }}
                  placeholder={'{\n  "name": "Bob",\n  "age": 25,\n  "city": "NYC"\n}'}
                  spellCheck={false}
                  className={`w-full bg-zinc-900/60 border rounded-xl p-3.5 font-mono text-xs h-[260px] resize-none leading-relaxed outline-none text-zinc-100 placeholder-zinc-600 transition-colors ${
                    rightError ? "border-rose-500/40 focus:border-rose-500/60" : "border-zinc-700 focus:border-sky-500/40"
                  }`}
                />
                {rightError && (
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-rose-400">
                    <AlertCircle className="w-3 h-3" /> {rightError}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={handleCompare}
              disabled={!leftJson.trim() || !rightJson.trim()}
              className="bg-violet-500 hover:bg-violet-400 text-white font-bold border-none shadow-lg shadow-violet-500/10 flex items-center gap-2 px-6 py-5 disabled:opacity-40"
            >
              <GitCompare className="w-4 h-4" /> Compare JSONs
            </Button>
            <Button
              variant="outline"
              onClick={handleSwap}
              className="border-zinc-700 bg-transparent hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 flex items-center gap-2 py-5"
            >
              <ArrowLeftRight className="w-4 h-4" /> Swap A ↔ B
            </Button>

            {compareRan && (
              <div className="flex items-center gap-3 ml-auto">
                <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  +{diffStats.added} added
                </span>
                <span className="flex items-center gap-1.5 text-xs font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full">
                  -{diffStats.removed} removed
                </span>
                <span className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 bg-zinc-800/60 border border-zinc-700 px-2.5 py-1 rounded-full">
                  {diffStats.equal} equal
                </span>
              </div>
            )}
          </div>

          {/* Diff Viewer */}
          {compareRan && diffLines.length > 0 && (
            <Card className="animate-fade-in bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-zinc-800/60">
                <CardTitle className="text-zinc-200 flex items-center gap-2 text-sm">
                  <GitCompare className="w-4 h-4 text-violet-400" />
                  Diff Output
                  {diffStats.added === 0 && diffStats.removed === 0 && (
                    <span className="ml-2 text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Identical
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-auto max-h-[500px] font-mono text-xs leading-6">
                  {/* Header labels */}
                  <div className="grid grid-cols-2 sticky top-0 bg-zinc-950 border-b border-zinc-800/80 z-10">
                    <div className="flex items-center gap-2 px-4 py-2 text-[10px] text-emerald-400 font-semibold uppercase tracking-wider border-r border-zinc-800/60">
                      <span className="w-4 h-4 rounded bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-[8px]">A</span>
                      Original
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 text-[10px] text-sky-400 font-semibold uppercase tracking-wider">
                      <span className="w-4 h-4 rounded bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-[8px]">B</span>
                      Modified
                    </div>
                  </div>

                  {/* Diff Lines */}
                  <div className="divide-y divide-zinc-900/40">
                    {diffLines.map((d, idx) => {
                      if (d.type === "equal") {
                        return (
                          <div key={idx} className="grid grid-cols-2 hover:bg-zinc-900/30 transition-colors">
                            <div className="flex border-r border-zinc-800/40 min-w-0">
                              <span className="select-none w-10 text-right pr-3 text-zinc-700 border-r border-zinc-800/40 py-0.5 flex-shrink-0 text-[10px] leading-6">
                                {d.lineA}
                              </span>
                              <span className="px-3 py-0.5 text-zinc-400 whitespace-pre-wrap break-all flex-1 min-w-0">{d.line}</span>
                            </div>
                            <div className="flex min-w-0">
                              <span className="select-none w-10 text-right pr-3 text-zinc-700 border-r border-zinc-800/40 py-0.5 flex-shrink-0 text-[10px] leading-6">
                                {d.lineB}
                              </span>
                              <span className="px-3 py-0.5 text-zinc-400 whitespace-pre-wrap break-all flex-1 min-w-0">{d.line}</span>
                            </div>
                          </div>
                        );
                      }
                      if (d.type === "removed") {
                        return (
                          <div key={idx} className="grid grid-cols-2 bg-rose-500/[0.06]">
                            <div className="flex border-r border-zinc-800/40 min-w-0">
                              <span className="select-none w-10 text-right pr-3 text-rose-600 border-r border-rose-500/20 py-0.5 flex-shrink-0 text-[10px] leading-6">
                                {d.lineA}
                              </span>
                              <span className="px-3 py-0.5 text-rose-300 whitespace-pre-wrap break-all flex-1 min-w-0 bg-rose-500/5">
                                <span className="text-rose-500 mr-1 select-none">−</span>{d.line}
                              </span>
                            </div>
                            <div className="flex min-w-0 opacity-30">
                              <span className="w-10 border-r border-zinc-800/40 py-0.5 flex-shrink-0" />
                              <span className="px-3 py-0.5 flex-1 min-w-0" />
                            </div>
                          </div>
                        );
                      }
                      if (d.type === "added") {
                        return (
                          <div key={idx} className="grid grid-cols-2 bg-emerald-500/[0.06]">
                            <div className="flex border-r border-zinc-800/40 min-w-0 opacity-30">
                              <span className="w-10 border-r border-zinc-800/40 py-0.5 flex-shrink-0" />
                              <span className="px-3 py-0.5 flex-1 min-w-0" />
                            </div>
                            <div className="flex min-w-0">
                              <span className="select-none w-10 text-right pr-3 text-emerald-600 border-r border-emerald-500/20 py-0.5 flex-shrink-0 text-[10px] leading-6">
                                {d.lineB}
                              </span>
                              <span className="px-3 py-0.5 text-emerald-300 whitespace-pre-wrap break-all flex-1 min-w-0 bg-emerald-500/5">
                                <span className="text-emerald-500 mr-1 select-none">+</span>{d.line}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
