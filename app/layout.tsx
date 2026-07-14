import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import Navbar from "@/components/navbar";
import StructuredData from "@/components/structured-data";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "QuickConvert Hub - Free Online Developer Tools & Privacy-Focused Utilities",
    template: "%s | QuickConvert Hub"
  },
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
  authors: [{ name: "QuickConvert" }],
  creator: "QuickConvert",
  publisher: "QuickConvert",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://quickconvert.dev'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://quickconvert.dev',
    siteName: 'QuickConvert Hub',
    title: 'QuickConvert Hub - Free Online Developer Tools & Privacy-Focused Utilities',
    description: 'Free online developer tools with 100% privacy. QR code generator, Base64 converter, AES-256 encryption, JSON formatter, JWT decoder, hash generator, color converter, URL parser, cron translator, and regex tester.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QuickConvert Hub - Free Online Developer Tools & Privacy-Focused Utilities',
    description: 'Free online developer tools with 100% privacy. QR code generator, Base64 converter, AES-256 encryption, JSON formatter, JWT decoder, hash generator, color converter, URL parser, cron translator, and regex tester.',
    creator: '@quickconvert',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <StructuredData />
      </head>
      <body className="min-h-full flex flex-col dark bg-black custom-scrollbar">
        <Navbar />
        {children}
        <Toaster position="bottom-right" theme="dark" richColors closeButton />
      </body>
    </html>
  );
}
