"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  Lock,
  Unlock,
  Copy,
  Key,
  Sparkles,
  Eye,
  EyeOff,
  ShieldCheck,
  Hash,
  ChevronDown,
  AlertCircle,
  Info,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

const textToBuffer = (text: string) => new TextEncoder().encode(text);
const bufferToText = (buffer: ArrayBuffer) => new TextDecoder().decode(buffer);

const bufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
};

const base64ToBuffer = (base64: string) => {
  const binary = window.atob(base64.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
};

/** Hex string → Uint8Array */
const hexToBytes = (hex: string): Uint8Array => {
  const cleaned = hex.replace(/\s/g, "");
  if (cleaned.length % 2 !== 0) throw new Error("Hex string has odd length");
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
};

/** Uint8Array → hex string */
const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

// ──── PBKDF2 + AES-GCM (password-based) ──────────────────────────────

const deriveKey = async (password: string, salt: Uint8Array) => {
  const importedKey = await window.crypto.subtle.importKey(
    "raw",
    textToBuffer(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    importedKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

const encryptData = async (plaintext: string, secret: string) => {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const derivedKey = await deriveKey(secret, salt);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    derivedKey,
    textToBuffer(plaintext)
  );
  const combined = new Uint8Array(salt.byteLength + iv.byteLength + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.byteLength);
  combined.set(new Uint8Array(encrypted), salt.byteLength + iv.byteLength);
  return bufferToBase64(combined.buffer);
};

const decryptData = async (encryptedBase64: string, secret: string) => {
  const combinedBuffer = base64ToBuffer(encryptedBase64);
  const combinedBytes = new Uint8Array(combinedBuffer);
  if (combinedBytes.length < 28) throw new Error("Invalid payload size");
  const salt = combinedBytes.slice(0, 16);
  const iv = combinedBytes.slice(16, 28);
  const ciphertext = combinedBytes.slice(28);
  const derivedKey = await deriveKey(secret, salt);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    derivedKey,
    ciphertext
  );
  return bufferToText(decrypted);
};

// ──── Raw AES-CBC (key + IV based) ───────────────────────────────────

type KeyFormat = "hex" | "base64" | "utf8";
type IVFormat = "hex" | "base64" | "utf8";

/** Parse raw key from user input */
const parseRawKey = (raw: string, fmt: KeyFormat): Uint8Array => {
  if (fmt === "hex") return hexToBytes(raw);
  if (fmt === "base64") return new Uint8Array(base64ToBuffer(raw));
  // UTF-8 — must be 16, 24, or 32 bytes
  return textToBuffer(raw);
};

/** Parse raw IV from user input */
const parseRawIV = (raw: string, fmt: IVFormat): Uint8Array => {
  if (fmt === "hex") return hexToBytes(raw);
  if (fmt === "base64") return new Uint8Array(base64ToBuffer(raw));
  return textToBuffer(raw);
};

const rawAesEncrypt = async (
  plaintext: string,
  keyBytes: Uint8Array,
  ivBytes: Uint8Array
): Promise<string> => {
  const keyLengths = [16, 24, 32];
  if (!keyLengths.includes(keyBytes.length))
    throw new Error(`Key must be 16, 24, or 32 bytes (got ${keyBytes.length})`);
  if (ivBytes.length !== 16)
    throw new Error(`IV must be 16 bytes (got ${ivBytes.length})`);

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-CBC" },
    false,
    ["encrypt"]
  );

  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-CBC", iv: ivBytes },
    cryptoKey,
    textToBuffer(plaintext)
  );

  return bufferToBase64(encrypted);
};

const rawAesDecrypt = async (
  ciphertextInput: string,
  inputFormat: "base64" | "hex",
  keyBytes: Uint8Array,
  ivBytes: Uint8Array
): Promise<string> => {
  const keyLengths = [16, 24, 32];
  if (!keyLengths.includes(keyBytes.length))
    throw new Error(`Key must be 16, 24, or 32 bytes (got ${keyBytes.length})`);
  if (ivBytes.length !== 16)
    throw new Error(`IV must be 16 bytes (got ${ivBytes.length})`);

  const ciphertextBuffer =
    inputFormat === "hex"
      ? hexToBytes(ciphertextInput).buffer
      : base64ToBuffer(ciphertextInput);

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-CBC" },
    false,
    ["decrypt"]
  );

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-CBC", iv: ivBytes },
    cryptoKey,
    ciphertextBuffer
  );

  return bufferToText(decrypted);
};

// ──────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────

export default function CryptoTool() {
  // ── GCM Encrypt State ──
  const [encryptText, setEncryptText] = useState("");
  const [encryptPassword, setEncryptPassword] = useState("");
  const [encryptedPayload, setEncryptedPayload] = useState("");
  const [showEncPwd, setShowEncPwd] = useState(false);

  // ── GCM Decrypt State ──
  const [decryptPayload, setDecryptPayload] = useState("");
  const [decryptPassword, setDecryptPassword] = useState("");
  const [decryptedText, setDecryptedText] = useState("");
  const [showDecPwd, setShowDecPwd] = useState(false);

  // ── Raw AES-CBC State ──
  const [rawMode, setRawMode] = useState<"encrypt" | "decrypt">("decrypt");

  // shared key/iv fields (used for both encrypt & decrypt in raw mode)
  const [rawKey, setRawKey] = useState("");
  const [rawKeyFmt, setRawKeyFmt] = useState<KeyFormat>("hex");
  const [rawIV, setRawIV] = useState("");
  const [rawIVFmt, setRawIVFmt] = useState<IVFormat>("hex");

  // encrypt fields
  const [rawPlaintext, setRawPlaintext] = useState("");
  const [rawEncryptedOut, setRawEncryptedOut] = useState("");

  // decrypt fields
  const [rawCiphertext, setRawCiphertext] = useState("");
  const [rawCiphertextFmt, setRawCiphertextFmt] = useState<"base64" | "hex">("base64");
  const [rawDecryptedOut, setRawDecryptedOut] = useState("");

  // key / iv info chips
  const [keyInfo, setKeyInfo] = useState<string | null>(null);
  const [ivInfo, setIVInfo] = useState<string | null>(null);

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

  // Compute key/iv info when fields change
  useEffect(() => {
    if (!rawKey.trim()) { setKeyInfo(null); return; }
    try {
      const bytes = parseRawKey(rawKey.trim(), rawKeyFmt);
      const bits = bytes.length * 8;
      const valid = [128, 192, 256].includes(bits);
      setKeyInfo(`${bytes.length} bytes = AES-${bits}${valid ? " ✓" : " ✗ (need 16/24/32 bytes)"}`);
    } catch {
      setKeyInfo("Invalid format");
    }
  }, [rawKey, rawKeyFmt]);

  useEffect(() => {
    if (!rawIV.trim()) { setIVInfo(null); return; }
    try {
      const bytes = parseRawIV(rawIV.trim(), rawIVFmt);
      const valid = bytes.length === 16;
      setIVInfo(`${bytes.length} bytes${valid ? " ✓" : " ✗ (need exactly 16 bytes)"}`);
    } catch {
      setIVInfo("Invalid format");
    }
  }, [rawIV, rawIVFmt]);

  // ── Handlers: GCM ──────────────────────────────────────────────────

  const handleEncryption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!encryptText.trim() || !encryptPassword.trim()) {
      toast.error("Please enter both plaintext and a secure key.");
      return;
    }
    try {
      const payload = await encryptData(encryptText, encryptPassword);
      setEncryptedPayload(payload);
      toast.success("Data encrypted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Encryption failed.");
    }
  };

  const handleDecryption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decryptPayload.trim() || !decryptPassword.trim()) {
      toast.error("Please enter both the encrypted payload and the decryption key.");
      return;
    }
    try {
      const originalText = await decryptData(decryptPayload.trim(), decryptPassword);
      setDecryptedText(originalText);
      toast.success("Payload decrypted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Decryption failed. Ensure key and payload are correct.");
    }
  };

  // ── Handlers: Raw AES-CBC ──────────────────────────────────────────

  const handleRawEncrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawPlaintext.trim() || !rawKey.trim() || !rawIV.trim()) {
      toast.error("Fill in plaintext, key, and IV.");
      return;
    }
    try {
      const keyBytes = parseRawKey(rawKey.trim(), rawKeyFmt);
      const ivBytes = parseRawIV(rawIV.trim(), rawIVFmt);
      const result = await rawAesEncrypt(rawPlaintext, keyBytes, ivBytes);
      setRawEncryptedOut(result);
      toast.success("AES-CBC encrypted!");
    } catch (err: unknown) {
      console.error(err);
      toast.error((err as Error).message || "Encryption failed.");
    }
  };

  const handleRawDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawCiphertext.trim() || !rawKey.trim() || !rawIV.trim()) {
      toast.error("Fill in ciphertext, key, and IV.");
      return;
    }
    try {
      const keyBytes = parseRawKey(rawKey.trim(), rawKeyFmt);
      const ivBytes = parseRawIV(rawIV.trim(), rawIVFmt);
      const result = await rawAesDecrypt(rawCiphertext.trim(), rawCiphertextFmt, keyBytes, ivBytes);
      setRawDecryptedOut(result);
      toast.success("AES-CBC decrypted!");
    } catch (err: unknown) {
      console.error(err);
      toast.error((err as Error).message || "Decryption failed — check key, IV, and ciphertext.");
    }
  };

  // ── Generate random key / IV ──
  const generateRandomKey = (bits: 128 | 192 | 256) => {
    const bytes = window.crypto.getRandomValues(new Uint8Array(bits / 8));
    setRawKey(bytesToHex(bytes));
    setRawKeyFmt("hex");
  };

  const generateRandomIV = () => {
    const bytes = window.crypto.getRandomValues(new Uint8Array(16));
    setRawIV(bytesToHex(bytes));
    setRawIVFmt("hex");
  };

  // ── Copy helper ──
  const copyToClipboard = (text: string, msg: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  // ── Format selector mini-component ──
  const FormatSelect = ({
    value,
    onChange,
    id,
  }: {
    value: string;
    onChange: (v: string) => void;
    id: string;
  }) => (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-2.5 pr-6 py-1.5 cursor-pointer outline-none focus:border-amber-500/40"
      >
        <option value="hex">Hex</option>
        <option value="base64">Base64</option>
        <option value="utf8">UTF-8</option>
      </select>
      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
    </div>
  );

  return (
    <div ref={containerRef} className="space-y-6">
      <Tabs defaultValue="gcm" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 p-1.5 bg-zinc-950/60 border border-zinc-700 rounded-xl">
          <TabsTrigger
            value="gcm"
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg data-active:bg-amber-500/10 data-active:text-amber-400 data-active:border-amber-500/20 font-medium min-w-0"
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="truncate">Password-Based (AES-GCM)</span>
          </TabsTrigger>
          <TabsTrigger
            value="raw"
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg data-active:bg-amber-500/10 data-active:text-amber-400 data-active:border-amber-500/20 font-medium min-w-0"
          >
            <Hash className="w-4 h-4 shrink-0" />
            <span className="truncate">Raw Key + IV (AES-CBC)</span>
          </TabsTrigger>
        </TabsList>

        {/* ════════════ GCM TAB ════════════ */}
        <TabsContent value="gcm" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              <Tabs defaultValue="encrypt" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 p-1.5 bg-zinc-950/60 border border-zinc-700 rounded-xl">
                  <TabsTrigger
                    value="encrypt"
                    className="flex items-center justify-center gap-2 py-2.5 rounded-lg data-active:bg-amber-500/10 data-active:text-amber-400 font-medium min-w-0"
                  >
                    <Lock className="w-4 h-4 shrink-0" />
                    <span className="truncate">Encrypt</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="decrypt"
                    className="flex items-center justify-center gap-2 py-2.5 rounded-lg data-active:bg-amber-500/10 data-active:text-amber-400 font-medium min-w-0"
                  >
                    <Unlock className="w-4 h-4 shrink-0" />
                    <span className="truncate">Decrypt</span>
                  </TabsTrigger>
                </TabsList>

                {/* ENCRYPT */}
                <TabsContent value="encrypt" className="mt-0">
                  <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
                    <CardHeader>
                      <CardTitle className="text-zinc-50 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-amber-400 animate-pulse" />
                        Encrypt Sensitive Data
                      </CardTitle>
                      <CardDescription className="text-zinc-400">
                        Secure messages using PBKDF2 + AES-256-GCM. Salt and IV are auto-generated and embedded in the output.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleEncryption} className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="encrypt-text" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                            Plaintext Payload
                          </Label>
                          <textarea
                            id="encrypt-text"
                            value={encryptText}
                            onChange={(e) => setEncryptText(e.target.value)}
                            placeholder="Type or paste secret text to encrypt..."
                            className="w-full bg-zinc-900/60 border border-zinc-700 focus:border-amber-500/50 text-zinc-100 placeholder-zinc-600 rounded-lg p-3 text-sm h-[130px] outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="encrypt-pwd" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-amber-400" /> Secret Key / Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="encrypt-pwd"
                              type={showEncPwd ? "text" : "password"}
                              value={encryptPassword}
                              onChange={(e) => setEncryptPassword(e.target.value)}
                              placeholder="Enter secure decryption key..."
                              className="bg-zinc-900/60 border-zinc-700 focus:border-amber-500/50 text-zinc-100 placeholder-zinc-600 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowEncPwd(!showEncPwd)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
                            >
                              {showEncPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold border-none py-5 flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10 cursor-pointer">
                          <Lock className="w-4 h-4 shrink-0" /> <span className="truncate">Encrypt Now</span>
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* DECRYPT */}
                <TabsContent value="decrypt" className="mt-0">
                  <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
                    <CardHeader>
                      <CardTitle className="text-zinc-50 flex items-center gap-2">
                        <Unlock className="w-5 h-5 text-amber-400" /> Decrypt Payload
                      </CardTitle>
                      <CardDescription className="text-zinc-400">
                        Input encrypted ciphertext and corresponding key to unlock original data.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleDecryption} className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="decrypt-payload" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                            Encrypted Base64 Payload
                          </Label>
                          <textarea
                            id="decrypt-payload"
                            value={decryptPayload}
                            onChange={(e) => setDecryptPayload(e.target.value)}
                            placeholder="Paste encrypted base64 payload here..."
                            className="w-full bg-zinc-900/60 border border-zinc-700 focus:border-amber-500/50 text-zinc-100 placeholder-zinc-600 rounded-lg p-3 font-mono text-xs h-[130px] outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="decrypt-pwd" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-amber-400" /> Secret Key / Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="decrypt-pwd"
                              type={showDecPwd ? "text" : "password"}
                              value={decryptPassword}
                              onChange={(e) => setDecryptPassword(e.target.value)}
                              placeholder="Enter the encryption key..."
                              className="bg-zinc-900/60 border-zinc-700 focus:border-amber-500/50 text-zinc-100 placeholder-zinc-600 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowDecPwd(!showDecPwd)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
                            >
                              {showDecPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold border-none py-5 flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10 cursor-pointer">
                          <Unlock className="w-4 h-4 shrink-0" /> <span className="truncate">Decrypt Data</span>
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* RIGHT COLUMN: Results */}
            <div className="lg:col-span-5 space-y-6">
              {encryptedPayload && (
                <Card className="bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl animate-fade-in relative overflow-hidden">
                  <CardHeader className="border-b border-zinc-900 pb-4">
                    <CardTitle className="text-sm text-zinc-400 font-semibold uppercase tracking-wider flex justify-between items-center">
                      <span>Encrypted Payload</span>
                      <span className="flex items-center gap-1 text-[10px] text-amber-400 uppercase font-mono">AES-GCM Secure</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="relative">
                      <div className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl p-3 font-mono text-zinc-300 text-xs h-[140px] overflow-y-auto break-all">
                        {encryptedPayload}
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-zinc-900 to-transparent pointer-events-none rounded-b-xl" />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => copyToClipboard(encryptedPayload, "Encrypted payload copied!")} className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold border-none py-5 flex items-center gap-1.5 justify-center cursor-pointer shadow-lg shadow-amber-500/10 min-w-0">
                        <Copy className="w-4 h-4 shrink-0" /> <span className="truncate">Copy Secure Payload</span>
                      </Button>
                      <Button variant="outline" onClick={() => setEncryptedPayload("")} className="bg-transparent border-zinc-700 hover:bg-zinc-900 hover:text-zinc-300 text-zinc-500 py-5 cursor-pointer shrink-0">
                        Clear
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {decryptedText && (
                <Card className="bg-zinc-950/60 border-amber-500/20 backdrop-blur-xl animate-fade-in relative overflow-hidden shadow-[0_0_25px_rgba(245,158,11,0.06)] ring-1 ring-amber-500/10">
                  <CardHeader className="border-b border-zinc-900 pb-4">
                    <CardTitle className="text-sm text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" /> Decrypted Output
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 font-mono text-zinc-200 text-sm overflow-x-auto whitespace-pre-wrap break-all min-h-[100px]">
                      {decryptedText}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => copyToClipboard(decryptedText, "Decrypted message copied!")} className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold border-none py-5 flex items-center gap-1.5 justify-center cursor-pointer shadow-lg shadow-amber-500/10 min-w-0">
                        <Copy className="w-4 h-4 shrink-0" /> <span className="truncate">Copy Text</span>
                      </Button>
                      <Button variant="outline" onClick={() => setDecryptedText("")} className="bg-transparent border-zinc-700 hover:bg-zinc-900 hover:text-zinc-300 text-zinc-500 py-5 cursor-pointer shrink-0">
                        Clear
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ════════════ RAW AES-CBC TAB ════════════ */}
        <TabsContent value="raw" className="mt-0 space-y-6">

          {/* Info Banner */}
          <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-zinc-400 leading-relaxed">
              Use this mode to encrypt/decrypt data with an <span className="text-amber-300 font-semibold">explicit raw key and IV</span>, 
              compatible with external AES-CBC implementations (OpenSSL, CryptoJS, Java, Python…). 
              Key accepts 128 / 192 / 256-bit values in Hex, Base64, or UTF-8. IV must be 16 bytes.
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center gap-2 p-1 bg-zinc-950/60 border border-zinc-700 rounded-xl w-fit">
            {(["encrypt", "decrypt"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setRawMode(m)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                  rawMode === m
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/25"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {m === "encrypt" ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                {m}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT: Key + IV + Input */}
            <div className="lg:col-span-7 space-y-5">

              {/* Key Field */}
              <Card className="animate-fade-in bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />
                <CardContent className="pt-5 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <Label className="text-zinc-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-amber-400" /> AES Key
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-mono">Format:</span>
                        <FormatSelect
                          id="raw-key-fmt"
                          value={rawKeyFmt}
                          onChange={(v) => setRawKeyFmt(v as KeyFormat)}
                        />
                        {/* Quick generate */}
                        <div className="flex items-center gap-1">
                          {([128, 192, 256] as const).map((bits) => (
                            <button
                              key={bits}
                              onClick={() => generateRandomKey(bits)}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-amber-500/15 text-zinc-400 hover:text-amber-300 transition-colors border border-zinc-700 hover:border-amber-500/30"
                            >
                              Gen {bits}b
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Input
                      id="raw-key"
                      value={rawKey}
                      onChange={(e) => setRawKey(e.target.value)}
                      placeholder={
                        rawKeyFmt === "hex"
                          ? "e.g. 000102030405060708090a0b0c0d0e0f"
                          : rawKeyFmt === "base64"
                          ? "e.g. AAECAwQFBgcICQoLDA0ODw=="
                          : "16, 24, or 32 chars"
                      }
                      className="bg-zinc-900/60 border-zinc-700 focus:border-amber-500/50 text-zinc-100 placeholder-zinc-600 font-mono text-sm"
                    />
                    {keyInfo && (
                      <p className={`text-[11px] flex items-center gap-1 ${keyInfo.includes("✓") ? "text-emerald-400" : "text-rose-400"}`}>
                        {keyInfo.includes("✓") ? <ShieldCheck className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {keyInfo}
                      </p>
                    )}
                  </div>

                  {/* IV Field */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <Label className="text-zinc-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-amber-400" /> Initialization Vector (IV)
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-mono">Format:</span>
                        <FormatSelect
                          id="raw-iv-fmt"
                          value={rawIVFmt}
                          onChange={(v) => setRawIVFmt(v as IVFormat)}
                        />
                        <button
                          onClick={generateRandomIV}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-amber-500/15 text-zinc-400 hover:text-amber-300 transition-colors border border-zinc-700 hover:border-amber-500/30"
                        >
                          Gen IV
                        </button>
                      </div>
                    </div>
                    <Input
                      id="raw-iv"
                      value={rawIV}
                      onChange={(e) => setRawIV(e.target.value)}
                      placeholder={
                        rawIVFmt === "hex"
                          ? "e.g. 000102030405060708090a0b0c0d0e0f (32 hex chars = 16 bytes)"
                          : rawIVFmt === "base64"
                          ? "e.g. AAECAwQFBgcICQoLDA0ODw=="
                          : "Exactly 16 characters"
                      }
                      className="bg-zinc-900/60 border-zinc-700 focus:border-amber-500/50 text-zinc-100 placeholder-zinc-600 font-mono text-sm"
                    />
                    {ivInfo && (
                      <p className={`text-[11px] flex items-center gap-1 ${ivInfo.includes("✓") ? "text-emerald-400" : "text-rose-400"}`}>
                        {ivInfo.includes("✓") ? <ShieldCheck className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {ivInfo}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Input data */}
              <Card className="animate-fade-in bg-zinc-950/60 border-zinc-700/80 backdrop-blur-xl relative overflow-hidden">
                <CardContent className="pt-5">
                  {rawMode === "encrypt" ? (
                    <form onSubmit={handleRawEncrypt} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="raw-plaintext" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                          Plaintext to Encrypt
                        </Label>
                        <textarea
                          id="raw-plaintext"
                          value={rawPlaintext}
                          onChange={(e) => setRawPlaintext(e.target.value)}
                          placeholder="Enter text to encrypt with AES-CBC..."
                          className="w-full bg-zinc-900/60 border border-zinc-700 focus:border-amber-500/50 text-zinc-100 placeholder-zinc-600 rounded-lg p-3 text-sm h-[130px] outline-none font-mono"
                        />
                      </div>
                      <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold border-none py-5 flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10 cursor-pointer">
                        <Lock className="w-4 h-4" /> AES-CBC Encrypt
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleRawDecrypt} className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="raw-ciphertext" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                            Ciphertext to Decrypt
                          </Label>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-zinc-500">Format:</span>
                            <div className="relative">
                              <select
                                value={rawCiphertextFmt}
                                onChange={(e) => setRawCiphertextFmt(e.target.value as "base64" | "hex")}
                                className="appearance-none bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-2.5 pr-6 py-1.5 cursor-pointer outline-none focus:border-amber-500/40"
                              >
                                <option value="base64">Base64</option>
                                <option value="hex">Hex</option>
                              </select>
                              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                        <textarea
                          id="raw-ciphertext"
                          value={rawCiphertext}
                          onChange={(e) => setRawCiphertext(e.target.value)}
                          placeholder={rawCiphertextFmt === "base64" ? "Paste Base64-encoded ciphertext..." : "Paste hex-encoded ciphertext..."}
                          className="w-full bg-zinc-900/60 border border-zinc-700 focus:border-amber-500/50 text-zinc-100 placeholder-zinc-600 rounded-lg p-3 text-xs h-[130px] outline-none font-mono"
                        />
                      </div>
                      <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold border-none py-5 flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10 cursor-pointer">
                        <Unlock className="w-4 h-4" /> AES-CBC Decrypt
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT: Output */}
            <div className="lg:col-span-5 space-y-6">
              {rawMode === "encrypt" && rawEncryptedOut && (
                <Card className="bg-zinc-950/60 border-amber-500/20 backdrop-blur-xl animate-fade-in relative overflow-hidden ring-1 ring-amber-500/10">
                  <CardHeader className="border-b border-zinc-900 pb-4">
                    <CardTitle className="text-sm text-zinc-400 font-semibold uppercase tracking-wider flex justify-between items-center">
                      <span>AES-CBC Ciphertext</span>
                      <span className="text-[10px] text-amber-400 font-mono">Base64 Output</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl p-3 font-mono text-zinc-300 text-xs min-h-[100px] break-all">
                      {rawEncryptedOut}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => copyToClipboard(rawEncryptedOut, "Ciphertext copied!")} className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold border-none py-5 flex items-center gap-1.5 justify-center cursor-pointer">
                        <Copy className="w-4 h-4" /> Copy Ciphertext
                      </Button>
                      <Button variant="outline" onClick={() => setRawEncryptedOut("")} className="bg-transparent border-zinc-700 hover:bg-zinc-900 text-zinc-500 py-5 cursor-pointer shrink-0">
                        Clear
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {rawMode === "decrypt" && rawDecryptedOut && (
                <Card className="bg-zinc-950/60 border-amber-500/20 backdrop-blur-xl animate-fade-in relative overflow-hidden shadow-[0_0_25px_rgba(245,158,11,0.06)] ring-1 ring-amber-500/10">
                  <CardHeader className="border-b border-zinc-900 pb-4">
                    <CardTitle className="text-sm text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" /> Decrypted Plaintext
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 font-mono text-zinc-200 text-sm whitespace-pre-wrap break-all min-h-[100px]">
                      {rawDecryptedOut}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => copyToClipboard(rawDecryptedOut, "Plaintext copied!")} className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold border-none py-5 flex items-center gap-1.5 justify-center cursor-pointer">
                        <Copy className="w-4 h-4" /> Copy Plaintext
                      </Button>
                      <Button variant="outline" onClick={() => setRawDecryptedOut("")} className="bg-transparent border-zinc-700 hover:bg-zinc-900 text-zinc-500 py-5 cursor-pointer shrink-0">
                        Clear
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Help card when no output */}
              {((rawMode === "encrypt" && !rawEncryptedOut) || (rawMode === "decrypt" && !rawDecryptedOut)) && (
                <Card className="bg-zinc-950/40 border-zinc-800/60 backdrop-blur-xl">
                  <CardContent className="p-6 space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">How to use</h4>
                    <ul className="space-y-2 text-[11px] text-zinc-500 leading-relaxed">
                      <li className="flex gap-2"><span className="text-amber-400 shrink-0">1.</span> Paste or generate an AES key (16, 24, or 32 bytes)</li>
                      <li className="flex gap-2"><span className="text-amber-400 shrink-0">2.</span> Paste or generate an IV (always 16 bytes for AES-CBC)</li>
                      <li className="flex gap-2"><span className="text-amber-400 shrink-0">3.</span> Choose the correct format (Hex is most common for raw keys)</li>
                      <li className="flex gap-2"><span className="text-amber-400 shrink-0">4.</span> Enter your {rawMode === "encrypt" ? "plaintext" : "ciphertext"} and click the button</li>
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
