"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  Link2,
  Code,
  Copy,
  Trash2,
  ArrowRightLeft,
  FileText,
  Globe,
  Search,
  Hash,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// URL parsing utilities
interface ParsedUrl {
  protocol: string;
  host: string;
  port: string;
  path: string;
  query: Record<string, string>;
  hash: string;
}

function parseUrl(url: string): ParsedUrl | null {
  try {
    const urlObj = new URL(url);
    const query: Record<string, string> = {};
    
    urlObj.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    return {
      protocol: urlObj.protocol.replace(":", ""),
      host: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      query,
      hash: urlObj.hash.replace("#", ""),
    };
  } catch {
    return null;
  }
}

export default function UrlTool() {
  const [encodeInput, setEncodeInput] = useState("");
  const [encodedOutput, setEncodedOutput] = useState("");
  const [decodeInput, setDecodeInput] = useState("");
  const [decodedOutput, setDecodedOutput] = useState("");

  const [parseInput, setParseInput] = useState("");
  const [parsedUrl, setParsedUrl] = useState<ParsedUrl | null>(null);

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

  // Auto-encode on input change
  useEffect(() => {
    if (!encodeInput) {
      setEncodedOutput("");
      return;
    }
    setEncodedOutput(encodeURIComponent(encodeInput));
  }, [encodeInput]);

  // Auto-decode on input change
  useEffect(() => {
    if (!decodeInput) {
      setDecodedOutput("");
      return;
    }
    try {
      setDecodedOutput(decodeURIComponent(decodeInput));
    } catch {
      setDecodedOutput("Invalid encoded string");
    }
  }, [decodeInput]);

  // Auto-parse on input change
  useEffect(() => {
    if (!parseInput) {
      setParsedUrl(null);
      return;
    }
    const parsed = parseUrl(parseInput);
    setParsedUrl(parsed);
  }, [parseInput]);

  const copyToClipboard = (text: string, msg: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  const clearEncode = () => {
    setEncodeInput("");
    setEncodedOutput("");
  };

  const clearDecode = () => {
    setDecodeInput("");
    setDecodedOutput("");
  };

  const clearParse = () => {
    setParseInput("");
    setParsedUrl(null);
  };

  return (
    <div ref={containerRef} className="space-y-6">
      <Tabs defaultValue="encode" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 p-1.5 bg-zinc-950/60 border border-zinc-700 rounded-xl">
          <TabsTrigger
            value="encode"
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg data-active:bg-sky-500/10 data-active:text-sky-400 data-active:border-sky-500/20 font-medium min-w-0"
          >
            <Code className="w-4 h-4 shrink-0" />
            <span className="truncate">Encode/Decode</span>
          </TabsTrigger>
          <TabsTrigger
            value="parse"
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg data-active:bg-sky-500/10 data-active:text-sky-400 data-active:border-sky-500/20 font-medium min-w-0"
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span className="truncate">URL Parser</span>
          </TabsTrigger>
        </TabsList>

        {/* ENCODE/DECODE TAB */}
        <TabsContent value="encode" className="mt-0 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-6">
              <Tabs defaultValue="encode" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 p-1.5 bg-zinc-950/60 border border-zinc-700 rounded-xl">
                  <TabsTrigger
                    value="encode"
                    className="flex items-center justify-center gap-2 py-2.5 rounded-lg data-active:bg-sky-500/10 data-active:text-sky-400 font-medium min-w-0"
                  >
                    <ArrowRightLeft className="w-4 h-4 shrink-0" />
                    <span className="truncate">Encode</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="decode"
                    className="flex items-center justify-center gap-2 py-2.5 rounded-lg data-active:bg-sky-500/10 data-active:text-sky-400 font-medium min-w-0"
                  >
                    <ArrowRightLeft className="w-4 h-4 shrink-0" />
                    <span className="truncate">Decode</span>
                  </TabsTrigger>
                </TabsList>

                {/* ENCODE */}
                <TabsContent value="encode" className="mt-0">
                  <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
                    
                    <CardHeader>
                      <CardTitle className="text-zinc-50 flex items-center gap-2">
                        <Code className="w-5 h-5 text-sky-400" />
                        URL Encoder
                      </CardTitle>
                      <CardDescription className="text-zinc-400">
                        Encode special characters for safe URL transmission.
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="encode-input" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                          Input Text
                        </Label>
                        <textarea
                          id="encode-input"
                          value={encodeInput}
                          onChange={(e) => setEncodeInput(e.target.value)}
                          placeholder="Hello World! @#$%"
                          className="w-full bg-zinc-900/60 border border-zinc-700 focus:border-sky-500/50 text-zinc-100 placeholder-zinc-600 rounded-lg p-3 text-sm h-[120px] outline-none resize-none"
                        />
                        {encodeInput && (
                          <Button
                            variant="ghost"
                            onClick={clearEncode}
                            className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 w-full text-xs h-8"
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Clear
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* DECODE */}
                <TabsContent value="decode" className="mt-0">
                  <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
                    
                    <CardHeader>
                      <CardTitle className="text-zinc-50 flex items-center gap-2">
                        <Code className="w-5 h-5 text-sky-400" />
                        URL Decoder
                      </CardTitle>
                      <CardDescription className="text-zinc-400">
                        Decode URL-encoded strings back to readable text.
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="decode-input" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                          Encoded Input
                        </Label>
                        <textarea
                          id="decode-input"
                          value={decodeInput}
                          onChange={(e) => setDecodeInput(e.target.value)}
                          placeholder="Hello%20World%21%20%40%23%24%25"
                          className="w-full bg-zinc-900/60 border border-zinc-700 focus:border-sky-500/50 text-zinc-100 placeholder-zinc-600 rounded-lg p-3 text-sm h-[120px] outline-none resize-none font-mono"
                        />
                        {decodeInput && (
                          <Button
                            variant="ghost"
                            onClick={clearDecode}
                            className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 w-full text-xs h-8"
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Clear
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div className="lg:col-span-5 space-y-6">
              {/* Encoded Output */}
              {encodedOutput && (
                <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in">
                  <CardHeader className="border-b border-zinc-900 pb-4">
                    <CardTitle className="text-sm text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <Code className="w-4 h-4 text-sky-400" /> Encoded Output
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl p-3 font-mono text-zinc-300 text-xs break-all min-h-[100px]">
                      {encodedOutput}
                    </div>
                    <Button
                      onClick={() => copyToClipboard(encodedOutput, "Encoded text copied!")}
                      className="w-full bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold border-none py-5 flex items-center gap-1.5 justify-center cursor-pointer shadow-lg shadow-sky-500/10"
                    >
                      <Copy className="w-4 h-4" /> Copy Encoded
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Decoded Output */}
              {decodedOutput && (
                <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in">
                  <CardHeader className="border-b border-zinc-900 pb-4">
                    <CardTitle className="text-sm text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-sky-400" /> Decoded Output
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl p-3 font-mono text-zinc-300 text-xs break-all min-h-[100px]">
                      {decodedOutput}
                    </div>
                    <Button
                      onClick={() => copyToClipboard(decodedOutput, "Decoded text copied!")}
                      className="w-full bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold border-none py-5 flex items-center gap-1.5 justify-center cursor-pointer shadow-lg shadow-sky-500/10"
                    >
                      <Copy className="w-4 h-4" /> Copy Decoded
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* URL PARSER TAB */}
        <TabsContent value="parse" className="mt-0 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-6">
              <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
                
                <CardHeader>
                  <CardTitle className="text-zinc-50 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-sky-400" />
                    URL Parser
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Break down URLs into their components: protocol, host, path, query params, and hash.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="parse-input" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                      URL
                    </Label>
                    <input
                      id="parse-input"
                      type="text"
                      value={parseInput}
                      onChange={(e) => setParseInput(e.target.value)}
                      placeholder="https://example.com:8080/path/to/page?query=value&another=123#section"
                      className="w-full bg-zinc-900/60 border border-zinc-700 focus:border-sky-500/50 text-zinc-100 placeholder-zinc-600 rounded-lg p-3 text-sm outline-none font-mono"
                    />
                    {parseInput && (
                      <Button
                        variant="ghost"
                        onClick={clearParse}
                        className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 w-full text-xs h-8"
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Clear
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-5 space-y-6">
              {parsedUrl ? (
                <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in">
                  <CardHeader className="border-b border-zinc-900 pb-4">
                    <CardTitle className="text-sm text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-sky-400" /> Parsed Components
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-sky-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-zinc-500 uppercase font-semibold">Protocol</p>
                          <p className="text-sm text-zinc-300 font-mono truncate">{parsedUrl.protocol}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-sky-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-zinc-500 uppercase font-semibold">Host</p>
                          <p className="text-sm text-zinc-300 font-mono truncate">{parsedUrl.host}</p>
                        </div>
                      </div>

                      {parsedUrl.port && (
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-sky-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-zinc-500 uppercase font-semibold">Port</p>
                            <p className="text-sm text-zinc-300 font-mono truncate">{parsedUrl.port}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-zinc-500 uppercase font-semibold">Path</p>
                          <p className="text-sm text-zinc-300 font-mono truncate">{parsedUrl.path || "/"}</p>
                        </div>
                      </div>

                      {parsedUrl.hash && (
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-sky-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-zinc-500 uppercase font-semibold">Hash</p>
                            <p className="text-sm text-zinc-300 font-mono truncate">#{parsedUrl.hash}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {Object.keys(parsedUrl.query).length > 0 && (
                      <div className="pt-3 border-t border-zinc-800">
                        <p className="text-[10px] text-zinc-500 uppercase font-semibold mb-2 flex items-center gap-1.5">
                          <Search className="w-3.5 h-3.5 text-sky-400" /> Query Parameters
                        </p>
                        <div className="space-y-2">
                          {Object.entries(parsedUrl.query).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2 bg-zinc-900/60 p-2 rounded-lg">
                              <span className="text-xs text-sky-400 font-mono font-semibold">{key}</span>
                              <span className="text-zinc-600">=</span>
                              <span className="text-xs text-zinc-300 font-mono truncate flex-1">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-zinc-950/40 border-zinc-800/60 backdrop-blur-xl">
                  <CardContent className="p-6 space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">How to use</h4>
                    <ul className="space-y-2 text-[11px] text-zinc-500 leading-relaxed">
                      <li className="flex gap-2"><span className="text-sky-400 shrink-0">1.</span> Paste a complete URL in the input field</li>
                      <li className="flex gap-2"><span className="text-sky-400 shrink-0">2.</span> View the parsed components instantly</li>
                      <li className="flex gap-2"><span className="text-sky-400 shrink-0">3.</span> Query parameters are displayed in a table</li>
                      <li className="flex gap-2"><span className="text-sky-400 shrink-0">4.</span> All processing happens locally in your browser</li>
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}