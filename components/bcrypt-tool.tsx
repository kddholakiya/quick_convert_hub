"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  Lock,
  Unlock,
  Copy,
  Check,
  Trash2,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Hash,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import * as bcrypt from "bcryptjs";

export default function BcryptTool() {
  // Hash State
  const [hashPassword, setHashPassword] = useState("");
  const [hashRounds, setHashRounds] = useState(10);
  const [hashedResult, setHashedResult] = useState("");
  const [showHashPassword, setShowHashPassword] = useState(false);
  const [isHashing, setIsHashing] = useState(false);

  // Compare State
  const [comparePassword, setComparePassword] = useState("");
  const [compareHash, setCompareHash] = useState("");
  const [compareResult, setCompareResult] = useState<boolean | null>(null);
  const [showComparePassword, setShowComparePassword] = useState(false);
  const [isComparing, setIsComparing] = useState(false);

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

  const handleHash = async () => {
    if (!hashPassword.trim()) {
      toast.error("Please enter a password to hash");
      return;
    }

    setIsHashing(true);
    try {
      const salt = await bcrypt.genSalt(hashRounds);
      const hash = await bcrypt.hash(hashPassword, salt);
      setHashedResult(hash);
      toast.success("Password hashed successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to hash password");
    } finally {
      setIsHashing(false);
    }
  };

  const handleCompare = async () => {
    if (!comparePassword.trim() || !compareHash.trim()) {
      toast.error("Please enter both password and hash to compare");
      return;
    }

    setIsComparing(true);
    try {
      const result = await bcrypt.compare(comparePassword, compareHash);
      setCompareResult(result);
      if (result) {
        toast.success("Password matches the hash!");
      } else {
        toast.error("Password does not match the hash");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to compare password");
      setCompareResult(null);
    } finally {
      setIsComparing(false);
    }
  };

  const copyToClipboard = (text: string, msg: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(msg);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearHash = () => {
    setHashPassword("");
    setHashedResult("");
  };

  const clearCompare = () => {
    setComparePassword("");
    setCompareHash("");
    setCompareResult(null);
  };

  return (
    <div ref={containerRef} className="space-y-6">
      <Tabs defaultValue="hash" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 p-1.5 bg-zinc-950/60 border border-zinc-700 rounded-xl">
          <TabsTrigger
            value="hash"
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg data-active:bg-indigo-500/10 data-active:text-indigo-400 data-active:border-indigo-500/20 font-medium min-w-0"
          >
            <Hash className="w-4 h-4 shrink-0" />
            <span className="truncate">Hash Password</span>
          </TabsTrigger>
          <TabsTrigger
            value="compare"
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg data-active:bg-indigo-500/10 data-active:text-indigo-400 data-active:border-indigo-500/20 font-medium min-w-0"
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="truncate">Compare Password</span>
          </TabsTrigger>
        </TabsList>

        {/* HASH TAB */}
        <TabsContent value="hash" className="mt-0 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-6">
              <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
                
                <CardHeader>
                  <CardTitle className="text-zinc-50 flex items-center gap-2">
                    <Hash className="w-5 h-5 text-indigo-400" />
                    Bcrypt Password Hasher
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Generate secure bcrypt hashes for passwords with configurable cost factor.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="hash-password" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="hash-password"
                        type={showHashPassword ? "text" : "password"}
                        value={hashPassword}
                        onChange={(e) => setHashPassword(e.target.value)}
                        placeholder="Enter password to hash..."
                        className="bg-zinc-900/60 border-zinc-700 focus:border-indigo-500/50 text-zinc-100 placeholder-zinc-600 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowHashPassword(!showHashPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
                      >
                        {showHashPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hash-rounds" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                      Cost Factor (Rounds): {hashRounds}
                    </Label>
                    <div className="flex items-center gap-4">
                      <input
                        id="hash-rounds"
                        type="range"
                        min="4"
                        max="12"
                        value={hashRounds}
                        onChange={(e) => setHashRounds(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <div className="flex gap-1">
                        {[4, 8, 10, 12].map((round) => (
                          <button
                            key={round}
                            onClick={() => setHashRounds(round)}
                            className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                              hashRounds === round
                                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                                : "bg-zinc-800 text-zinc-500 hover:text-zinc-300 border border-zinc-700"
                            }`}
                          >
                            {round}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-500">
                      Higher rounds = more secure but slower. Recommended: 10-12 for production.
                    </p>
                  </div>

                  <Button
                    onClick={handleHash}
                    disabled={!hashPassword.trim() || isHashing}
                    className="w-full bg-indigo-500 hover:bg-indigo-400 text-zinc-950 font-bold border-none py-5 flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/10 cursor-pointer disabled:opacity-40"
                  >
                    {isHashing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> <span className="truncate">Hashing...</span>
                      </>
                    ) : (
                      <>
                        <Hash className="w-4 h-4" /> <span className="truncate">Generate Hash</span>
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-5 space-y-6">
              {hashedResult && (
                <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in">
                  <CardHeader className="border-b border-zinc-900 pb-4">
                    <CardTitle className="text-sm text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-indigo-400" /> Bcrypt Hash
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="relative">
                      <div className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl p-3 font-mono text-zinc-300 text-xs h-[140px] overflow-y-auto break-all">
                        {hashedResult}
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-zinc-900 to-transparent pointer-events-none rounded-b-xl" />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => copyToClipboard(hashedResult, "Hash copied!")}
                        className="flex-1 bg-indigo-500 hover:bg-indigo-400 text-zinc-950 font-bold border-none py-5 flex items-center gap-1.5 justify-center cursor-pointer shadow-lg shadow-indigo-500/10"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Copy Hash
                      </Button>
                      <Button
                        variant="outline"
                        onClick={clearHash}
                        className="bg-transparent border-zinc-700 hover:bg-zinc-900 text-zinc-500 py-5 cursor-pointer shrink-0"
                      >
                        Clear
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!hashedResult && (
                <Card className="bg-zinc-950/40 border-zinc-800/60 backdrop-blur-xl">
                  <CardContent className="p-6 space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">About Bcrypt</h4>
                    <ul className="space-y-2 text-[11px] text-zinc-500 leading-relaxed">
                      <li className="flex gap-2"><span className="text-indigo-400 shrink-0">•</span> Bcrypt is a password hashing function designed for security</li>
                      <li className="flex gap-2"><span className="text-indigo-400 shrink-0">•</span> Uses a salt to protect against rainbow table attacks</li>
                      <li className="flex gap-2"><span className="text-indigo-400 shrink-0">•</span> Configurable cost factor controls computational complexity</li>
                      <li className="flex gap-2"><span className="text-indigo-400 shrink-0">•</span> All processing happens locally in your browser</li>
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* COMPARE TAB */}
        <TabsContent value="compare" className="mt-0 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-6">
              <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
                
                <CardHeader>
                  <CardTitle className="text-zinc-50 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    Bcrypt Password Comparator
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Verify if a password matches a bcrypt hash.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="compare-password" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                      Password to Verify
                    </Label>
                    <div className="relative">
                      <Input
                        id="compare-password"
                        type={showComparePassword ? "text" : "password"}
                        value={comparePassword}
                        onChange={(e) => setComparePassword(e.target.value)}
                        placeholder="Enter password to verify..."
                        className="bg-zinc-900/60 border-zinc-700 focus:border-indigo-500/50 text-zinc-100 placeholder-zinc-600 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowComparePassword(!showComparePassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
                      >
                        {showComparePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="compare-hash" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                      Bcrypt Hash
                    </Label>
                    <textarea
                      id="compare-hash"
                      value={compareHash}
                      onChange={(e) => setCompareHash(e.target.value)}
                      placeholder="$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
                      className="w-full bg-zinc-900/60 border border-zinc-700 focus:border-indigo-500/50 text-zinc-100 placeholder-zinc-600 rounded-lg p-3 font-mono text-xs h-[100px] outline-none resize-none"
                    />
                  </div>

                  <Button
                    onClick={handleCompare}
                    disabled={!comparePassword.trim() || !compareHash.trim() || isComparing}
                    className="w-full bg-indigo-500 hover:bg-indigo-400 text-zinc-950 font-bold border-none py-5 flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/10 cursor-pointer disabled:opacity-40"
                  >
                    {isComparing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> <span className="truncate">Comparing...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" /> <span className="truncate">Compare Password</span>
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-5 space-y-6">
              {compareResult !== null && (
                <Card className={`animate-fade-in bg-zinc-950/60 border backdrop-blur-xl relative overflow-hidden ${
                  compareResult
                    ? "border-emerald-500/20 shadow-[0_0_25px_rgba(16,185,129,0.06)] ring-1 ring-emerald-500/10"
                    : "border-rose-500/20 shadow-[0_0_25px_rgba(244,63,94,0.06)] ring-1 ring-rose-500/10"
                }`}>
                  <CardHeader className="border-b border-zinc-900 pb-4">
                    <CardTitle className="text-sm text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      {compareResult ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                      )}
                      Comparison Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      {compareResult ? (
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <Check className="w-6 h-6 text-emerald-400" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                          <AlertCircle className="w-6 h-6 text-rose-400" />
                        </div>
                      )}
                      <div>
                        <p className={`text-sm font-semibold ${compareResult ? "text-emerald-400" : "text-rose-400"}`}>
                          {compareResult ? "Password Match!" : "Password Mismatch"}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {compareResult
                            ? "The password matches the provided bcrypt hash."
                            : "The password does not match the provided bcrypt hash."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {compareResult === null && (
                <Card className="bg-zinc-950/40 border-zinc-800/60 backdrop-blur-xl">
                  <CardContent className="p-6 space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">How to use</h4>
                    <ul className="space-y-2 text-[11px] text-zinc-500 leading-relaxed">
                      <li className="flex gap-2"><span className="text-indigo-400 shrink-0">1.</span> Enter the password you want to verify</li>
                      <li className="flex gap-2"><span className="text-indigo-400 shrink-0">2.</span> Paste the bcrypt hash to compare against</li>
                      <li className="flex gap-2"><span className="text-indigo-400 shrink-0">3.</span> Click compare to check if they match</li>
                      <li className="flex gap-2"><span className="text-indigo-400 shrink-0">4.</span> All verification happens locally in your browser</li>
                    </ul>
                  </CardContent>
                </Card>
              )}

              {comparePassword && compareHash && (
                <Button
                  variant="ghost"
                  onClick={clearCompare}
                  className="w-full text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 text-xs h-8"
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Clear All
                </Button>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}