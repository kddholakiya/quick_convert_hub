import ToolHub from "@/components/tool-hub";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "QuickConvert Hub - Free Online Developer Tools & Privacy-Focused Utilities",
  description: "Free online developer tools with 100% privacy. QR code generator, Base64 converter, AES-256 encryption, JSON formatter, JWT decoder, hash generator, color converter, URL parser, cron translator, and regex tester. All processing happens locally in your browser.",
  keywords: [
    "QR code generator",
    "Base64 converter",
    "AES-256 encryption",
    "JSON formatter",
    "JWT decoder",
    "password hasher",
    "bcrypt generator",
    "hash generator",
    "color converter",
    "HEX to RGB",
    "URL encoder decoder",
    "cron expression translator",
    "regex tester",
    "online developer tools",
    "privacy-focused tools",
    "client-side tools",
    "offline tools",
    "secure tools",
    "free online tools"
  ],
  openGraph: {
    title: "QuickConvert Hub - Free Online Developer Tools & Privacy-Focused Utilities",
    description: "Free online developer tools with 100% privacy. QR code generator, Base64 converter, AES-256 encryption, JSON formatter, JWT decoder, hash generator, color converter, URL parser, cron translator, and regex tester.",
    url: "https://quickconvert.dev",
    siteName: "QuickConvert Hub",
  },
  twitter: {
    card: "summary_large_image",
    title: "QuickConvert Hub - Free Online Developer Tools & Privacy-Focused Utilities",
    description: "Free online developer tools with 100% privacy. QR code generator, Base64 converter, AES-256 encryption, JSON formatter, JWT decoder, hash generator, color converter, URL parser, cron translator, and regex tester.",
  },
};

export default function Home() {
  return (
    <>
      <ToolHub activeTool="qr" />
      {/* Main content heading for SEO */}
      <h1 className="sr-only">
        QuickConvert Hub - Free Online Developer Tools Including QR Code Generator, Base64 Converter, AES-256 Encryption, JSON Formatter, JWT Decoder, Hash Generator, Color Converter, URL Parser, Cron Translator, and Regex Tester
      </h1>
    </>
  );
}
