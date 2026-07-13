import type { Metadata } from "next";

export type ToolSlug =
  | "base64-converter"
  | "aes-256-encryption"
  | "json-formatter"
  | "jwt-decoder"
  | "hash-generator"
  | "bcrypt-password"
  | "color-converter"
  | "url-tools"
  | "cron-translator"
  | "regex-tester";

interface ToolMeta {
  activeTool:
    | "base64"
    | "crypto"
    | "json"
    | "jwt"
    | "hash"
    | "bcrypt"
    | "color"
    | "url"
    | "cron"
    | "regex";
  title: string;
  description: string;
  keywords: string[];
  heading: string;
}

export const TOOLS_META: Record<ToolSlug, ToolMeta> = {
  "base64-converter": {
    activeTool: "base64",
    title: "Base64 Converter - Encode & Decode Images Online Free",
    description: "Convert images to Base64 strings or decode Base64 back to images instantly, free, and 100% client-side. No uploads, no tracking.",
    keywords: ["base64 converter", "base64 encode", "base64 decode", "image to base64", "base64 to image online"],
    heading: "Base64 Converter - Free Online Image to Base64 Encoder & Decoder",
  },
  "aes-256-encryption": {
    activeTool: "crypto",
    title: "AES-256 Encryption Vault - Encrypt & Decrypt Text Online Free",
    description: "Encrypt and decrypt text with AES-256 (PBKDF2 + AES-GCM or raw Key+IV AES-CBC) entirely in your browser. No data ever leaves your device.",
    keywords: ["AES-256 encryption", "AES encrypt online", "AES decrypt online", "PBKDF2", "AES-GCM", "text encryption tool"],
    heading: "AES-256 Vault - Free Online Text Encryption & Decryption Tool",
  },
  "json-formatter": {
    activeTool: "json",
    title: "JSON Formatter & Validator - Pretty Print JSON Online Free",
    description: "Format, validate, and beautify JSON instantly, or diff two JSON payloads side-by-side. Free, private, and fully client-side.",
    keywords: ["JSON formatter", "JSON validator", "JSON pretty print", "JSON diff tool", "JSON parser online"],
    heading: "JSON Formatter - Free Online JSON Validator, Beautifier & Diff Tool",
  },
  "jwt-decoder": {
    activeTool: "jwt",
    title: "JWT Decoder - Decode & Verify JSON Web Tokens Online Free",
    description: "Decode JWT headers and payloads and verify signatures locally in your browser. No token ever leaves your device.",
    keywords: ["JWT decoder", "JSON web token decoder", "JWT verifier", "decode JWT online", "JWT debugger"],
    heading: "JWT Decoder - Free Online JSON Web Token Decoder & Verifier",
  },
  "hash-generator": {
    activeTool: "hash",
    title: "Hash Generator - MD5, SHA-1, SHA-256, SHA-512 Online Free",
    description: "Generate MD5, SHA-1, SHA-256, and SHA-512 hashes for text or files instantly, entirely client-side.",
    keywords: ["hash generator", "MD5 generator", "SHA-256 online", "SHA-512 generator", "file hash checker"],
    heading: "Hash Generator - Free Online MD5, SHA-1, SHA-256 & SHA-512 Tool",
  },
  "bcrypt-password": {
    activeTool: "bcrypt",
    title: "Bcrypt Password Hasher - Generate & Verify Bcrypt Hashes Free",
    description: "Generate secure bcrypt password hashes with configurable cost factor and verify passwords against existing hashes, client-side.",
    keywords: ["bcrypt generator", "bcrypt hash online", "password hasher", "bcrypt verify", "bcrypt compare online"],
    heading: "Bcrypt Hasher - Free Online Bcrypt Password Hash Generator & Verifier",
  },
  "color-converter": {
    activeTool: "color",
    title: "Color Converter - HEX, RGB, HSL, CMYK Online Free",
    description: "Convert colors between HEX, RGB, HSL, and CMYK, and extract dominant palettes from images. Free and client-side.",
    keywords: ["color converter", "HEX to RGB", "RGB to HSL", "CMYK converter", "color palette extractor"],
    heading: "Color Converter - Free Online HEX, RGB, HSL & CMYK Converter",
  },
  "url-tools": {
    activeTool: "url",
    title: "URL Encoder Decoder & Parser Online Free",
    description: "Encode, decode, and parse URLs into protocol, host, path, query parameters, and hash instantly in your browser.",
    keywords: ["URL encoder", "URL decoder", "URL parser online", "percent encoding tool", "query string parser"],
    heading: "URL Tools - Free Online URL Encoder, Decoder & Parser",
  },
  "cron-translator": {
    activeTool: "cron",
    title: "Cron Expression Translator - Human Readable Cron Online Free",
    description: "Translate cron expressions into plain English and preview the next 5 execution times instantly.",
    keywords: ["cron translator", "cron expression parser", "crontab generator", "cron to human readable", "cron schedule preview"],
    heading: "Cron Translator - Free Online Cron Expression to Human Readable Tool",
  },
  "regex-tester": {
    activeTool: "regex",
    title: "Regex Tester - Test Regular Expressions Online Free",
    description: "Test regular expressions against text with live match highlighting and a built-in regex cheat sheet.",
    keywords: ["regex tester", "regular expression tester", "regex online", "regex cheat sheet", "test regex pattern"],
    heading: "Regex Tester - Free Online Regular Expression Tester & Cheat Sheet",
  },
};

export function buildToolMetadata(slug: ToolSlug): Metadata {
  const meta = TOOLS_META[slug];
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: {
      canonical: `/${slug}`,
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://quickconvert.dev/${slug}`,
      siteName: "QuickConvert Hub",
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
  };
}
