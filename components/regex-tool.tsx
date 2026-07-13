"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  Code,
  Search,
  Copy,
  Trash2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface RegexMatch {
  match: string;
  index: number;
  groups: string[];
}

// Regex cheat sheet data
const cheatSheetCategories = [
  {
    name: "Character Classes",
    patterns: [
      { pattern: ".", desc: "Any character except newline" },
      { pattern: "\\d", desc: "Digit (0-9)" },
      { pattern: "\\D", desc: "Not a digit" },
      { pattern: "\\w", desc: "Word character (a-z, A-Z, 0-9, _)" },
      { pattern: "\\W", desc: "Not a word character" },
      { pattern: "\\s", desc: "Whitespace character" },
      { pattern: "\\S", desc: "Not a whitespace character" },
    ],
  },
  {
    name: "Anchors",
    patterns: [
      { pattern: "^", desc: "Start of string" },
      { pattern: "$", desc: "End of string" },
      { pattern: "\\b", desc: "Word boundary" },
      { pattern: "\\B", desc: "Not a word boundary" },
    ],
  },
  {
    name: "Quantifiers",
    patterns: [
      { pattern: "*", desc: "0 or more" },
      { pattern: "+", desc: "1 or more" },
      { pattern: "?", desc: "0 or 1 (optional)" },
      { pattern: "{n}", desc: "Exactly n times" },
      { pattern: "{n,}", desc: "n or more times" },
      { pattern: "{n,m}", desc: "Between n and m times" },
    ],
  },
  {
    name: "Groups",
    patterns: [
      { pattern: "(abc)", desc: "Capturing group" },
      { pattern: "(?:abc)", desc: "Non-capturing group" },
      { pattern: "(?=abc)", desc: "Positive lookahead" },
      { pattern: "(?!abc)", desc: "Negative lookahead" },
    ],
  },
  {
    name: "Character Sets",
    patterns: [
      { pattern: "[abc]", desc: "Any of a, b, or c" },
      { pattern: "[^abc]", desc: "Not a, b, or c" },
      { pattern: "[a-z]", desc: "Any lowercase letter" },
      { pattern: "[A-Z]", desc: "Any uppercase letter" },
      { pattern: "[0-9]", desc: "Any digit" },
    ],
  },
];

export default function RegexTool() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [testString, setTestString] = useState("");
  const [matches, setMatches] = useState<RegexMatch[]>([]);
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCheatSheet, setShowCheatSheet] = useState(true);

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

  // Test regex on input change
  useEffect(() => {
    if (!pattern || !testString) {
      setMatches([]);
      setIsValid(true);
      setError(null);
      return;
    }

    try {
      const regex = new RegExp(pattern, flags);
      setIsValid(true);
      setError(null);

      const foundMatches: RegexMatch[] = [];
      let match: RegExpExecArray | null;

      // Reset lastIndex for global regex
      regex.lastIndex = 0;

      if (flags.includes("g")) {
        while ((match = regex.exec(testString)) !== null) {
          foundMatches.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1),
          });
          
          // Prevent infinite loops
          if (foundMatches.length > 100) break;
        }
      } else {
        match = regex.exec(testString);
        if (match) {
          foundMatches.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1),
          });
        }
      }

      setMatches(foundMatches);
    } catch (e) {
      setIsValid(false);
      setError((e as Error).message);
      setMatches([]);
    }
  }, [pattern, flags, testString]);

  const toggleFlag = (flag: string) => {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ""));
    } else {
      setFlags(flags + flag);
    }
  };

  const insertPattern = (patternStr: string) => {
    setPattern(prev => prev + patternStr);
  };

  const clearAll = () => {
    setPattern("");
    setFlags("g");
    setTestString("");
    setMatches([]);
    setError(null);
  };

  const copyToClipboard = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  const highlightMatches = (text: string, matches: RegexMatch[]) => {
    if (matches.length === 0) return text;

    let result = "";
    let lastIndex = 0;

    matches.forEach((match) => {
      // Add text before match
      result += text.slice(lastIndex, match.index);
      
      // Add highlighted match
      result += `<mark class="bg-emerald-500/30 text-emerald-300 px-0.5 rounded">${escapeHtml(match.match)}</mark>`;
      
      lastIndex = match.index + match.match.length;
    });

    // Add remaining text
    result += text.slice(lastIndex);

    return result;
  };

  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-lime-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
            
            <CardHeader>
              <CardTitle className="text-zinc-50 flex items-center gap-2">
                <Code className="w-5 h-5 text-lime-400" />
                Regex Tester
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Test regular expressions against text with visual highlighting.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Pattern Input */}
              <div className="space-y-2">
                <Label htmlFor="pattern-input" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                  Regular Expression
                </Label>
                <div className="flex gap-2">
                  <span className="flex items-center text-zinc-500 font-mono text-sm">/</span>
                  <Input
                    id="pattern-input"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    placeholder="\b\w+\b"
                    className="flex-1 bg-zinc-900/60 border-zinc-700 focus:border-lime-500/50 text-zinc-100 placeholder-zinc-600 font-mono text-sm"
                  />
                  <span className="flex items-center text-zinc-500 font-mono text-sm">/</span>
                </div>
              </div>

              {/* Flags */}
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Flags</Label>
                <div className="flex gap-2">
                  {["g", "i", "m", "s", "u", "y"].map((flag) => (
                    <button
                      key={flag}
                      onClick={() => toggleFlag(flag)}
                      className={`w-8 h-8 rounded-lg font-mono text-sm font-semibold transition-all ${
                        flags.includes(flag)
                          ? "bg-lime-500/20 text-lime-400 border border-lime-500/30"
                          : "bg-zinc-900/60 text-zinc-500 border border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      {flag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Test String Input */}
              <div className="space-y-2">
                <Label htmlFor="test-string" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                  Test String
                </Label>
                <textarea
                  id="test-string"
                  value={testString}
                  onChange={(e) => setTestString(e.target.value)}
                  placeholder="Enter text to test your regex against..."
                  className="w-full bg-zinc-900/60 border border-zinc-700 focus:border-lime-500/50 text-zinc-100 placeholder-zinc-600 rounded-lg p-3 text-sm h-[150px] outline-none resize-none font-mono"
                />
                {testString && (
                  <Button
                    variant="ghost"
                    onClick={clearAll}
                    className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 w-full text-xs h-8"
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Clear All
                  </Button>
                )}
              </div>

              {/* Validation Status */}
              {pattern && (
                <div className="flex items-center gap-2">
                  {isValid ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Valid regex pattern
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-rose-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {error || "Invalid regex pattern"}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-6">
          {/* Matches Result */}
          {matches.length > 0 && (
            <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in">
              <CardHeader className="border-b border-zinc-900 pb-4">
                <CardTitle className="text-sm text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-lime-400" /> Matches Found ({matches.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3 max-h-[300px] overflow-y-auto">
                {matches.slice(0, 50).map((match, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center gap-2 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                      <div className="w-6 h-6 rounded-full bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-400 text-xs font-bold">
                        {index + 1}
                      </div>
                      <span className="text-sm text-lime-300 font-mono truncate flex-1">{escapeHtml(match.match)}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">at {match.index}</span>
                    </div>
                    {match.groups.length > 0 && (
                      <div className="pl-8 space-y-1">
                        {match.groups.map((group, groupIndex) => (
                          <div key={groupIndex} className="text-xs text-zinc-400 font-mono">
                            <span className="text-zinc-500">$${groupIndex + 1}:</span> {escapeHtml(group)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {matches.length > 50 && (
                  <p className="text-xs text-zinc-500 text-center">
                    Showing first 50 of {matches.length} matches
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Highlighted Output */}
          {testString && matches.length > 0 && (
            <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in">
              <CardHeader className="border-b border-zinc-900 pb-4">
                <CardTitle className="text-sm text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-lime-400" /> Highlighted Output
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl p-4 font-mono text-sm whitespace-pre-wrap break-all max-h-[200px] overflow-y-auto">
                  <div dangerouslySetInnerHTML={{ __html: highlightMatches(testString, matches) }} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Matches */}
          {testString && pattern && isValid && matches.length === 0 && (
            <Card className="bg-zinc-950/40 border-zinc-800/60 backdrop-blur-xl">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Search className="w-5 h-5" />
                  <p className="font-semibold text-sm">No matches found</p>
                </div>
                <p className="text-xs text-zinc-500">
                  Try adjusting your pattern or test string to find matches.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Cheat Sheet Toggle */}
          <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <Button
                variant="ghost"
                onClick={() => setShowCheatSheet(!showCheatSheet)}
                className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
              >
                <CardTitle className="text-sm text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-lime-400" /> Regex Cheat Sheet
                </CardTitle>
                {showCheatSheet ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
              </Button>
            </CardHeader>
            {showCheatSheet && (
              <CardContent className="pt-0 space-y-4 max-h-[400px] overflow-y-auto">
                {cheatSheetCategories.map((category) => (
                  <div key={category.name} className="space-y-2">
                    <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">{category.name}</p>
                    <div className="space-y-1">
                      {category.patterns.map((item) => (
                        <button
                          key={item.pattern}
                          onClick={() => insertPattern(item.pattern)}
                          className="w-full flex items-center justify-between p-2 rounded-lg bg-zinc-900/40 border border-zinc-800 hover:border-lime-500/30 hover:bg-lime-500/5 transition-all text-left group"
                        >
                          <span className="text-xs text-lime-400 font-mono group-hover:text-lime-300">{item.pattern}</span>
                          <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}