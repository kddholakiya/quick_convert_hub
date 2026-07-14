import type { ToolSlug } from "@/lib/tools-metadata";

export interface ToolFeature {
  title: string;
  desc: string;
}

export interface ToolFaqItem {
  q: string;
  a: string;
}

export interface ToolSeoContent {
  heading: string;
  intro: string;
  features: ToolFeature[];
  faq: ToolFaqItem[];
}

export const TOOL_SEO_CONTENT: Record<ToolSlug, ToolSeoContent> = {
  "base64-converter": {
    heading: "Base64 Converter: Image to Base64 & Base64 to Image",
    intro:
      "Convert images to Base64 strings or decode Base64 back into images instantly. Supports PNG, JPG, JPEG, GIF, WEBP, SVG, and BMP, entirely in your browser with no uploads.",
    features: [
      { title: "Image to Base64", desc: "Drag-and-drop or pick a file, toggle the data-URI prefix on or off, and copy or download the Base64 output as a .txt file." },
      { title: "Base64 to Image", desc: "Paste raw or data-URI-prefixed Base64 and get a live image preview, with an automatic MIME-type fallback to image/png when no prefix is present." },
      { title: "100% Client-Side", desc: "Conversion runs via the browser's FileReader and Blob APIs — your image never leaves your device." },
    ],
    faq: [
      { q: "Can I convert an image to Base64 without uploading it anywhere?", a: "Yes, conversion uses the browser's FileReader API — the image never leaves your device." },
      { q: "What image formats are supported?", a: "PNG, JPG, JPEG, GIF, WEBP, SVG, and BMP." },
      { q: "Do I need the data:image/...;base64, prefix to decode Base64 back to an image?", a: "No — if the prefix is missing, the tool assumes image/png and still renders the image; invalid strings show an \"Invalid base64 string\" error." },
      { q: "Can I download the decoded image or the Base64 text?", a: "Yes, both the reconstructed image and a plain-text .txt file of the Base64 string can be downloaded directly." },
      { q: "Can I strip the data URI prefix from the output?", a: "Yes, an \"Include data URI prefix\" toggle lets you copy just the raw Base64 payload." },
    ],
  },
  "aes-256-encryption": {
    heading: "AES-256 Vault: Encrypt & Decrypt Text Online",
    intro:
      "Encrypt and decrypt text with AES-256, either password-based (PBKDF2 + AES-GCM) or with a raw key and IV (AES-CBC) compatible with OpenSSL, CryptoJS, Java, and Python. All processing happens locally.",
    features: [
      { title: "Password-Based Mode", desc: "PBKDF2 (100,000 iterations, SHA-256) derives an AES-256-GCM key with a random salt and IV generated and embedded automatically." },
      { title: "Raw Key + IV Mode", desc: "AES-CBC encrypt/decrypt with an explicit 128/192/256-bit key (Hex, Base64, or UTF-8) and 16-byte IV, interoperable with other AES-CBC implementations." },
      { title: "Live Key Validation", desc: "Byte-length chips confirm your key and IV sizes are valid before you submit, with one-click random key/IV generation." },
    ],
    faq: [
      { q: "What encryption algorithm is used?", a: "AES-256-GCM for password-based mode (via PBKDF2 key derivation), or AES-CBC for raw key+IV mode." },
      { q: "Is this compatible with encryption done in other languages like Python or Java?", a: "Yes, Raw Key+IV mode uses standard AES-CBC with an explicit key/IV so ciphertext interoperates with any AES-CBC implementation, including OpenSSL and CryptoJS." },
      { q: "Do I need to manage the salt and IV myself?", a: "Not in password-based mode — a random salt and IV are generated per encryption and embedded in the output; you only need the password to decrypt." },
      { q: "What key sizes are supported in raw mode?", a: "128, 192, or 256-bit keys (16/24/32 bytes) in Hex, Base64, or UTF-8, with a strict 16-byte IV." },
      { q: "Does my plaintext or key ever leave my browser?", a: "No, all encryption and decryption run via the Web Crypto API locally; nothing is sent to a server." },
    ],
  },
  "json-formatter": {
    heading: "JSON Formatter, Validator & Diff Tool",
    intro:
      "Format, validate, minify, and diff JSON instantly with syntax highlighting and exact parser error messages. Fully client-side, with a side-by-side compare mode for two JSON payloads.",
    features: [
      { title: "Format & Minify", desc: "Pretty-print with 2 or 4-space indent and full syntax highlighting, or collapse valid JSON to a single compact line." },
      { title: "Compare / Diff", desc: "An LCS-based line diff highlights added and removed lines side-by-side between two JSON payloads, with counts and a swap-sides button." },
      { title: "Live Validation", desc: "Invalid JSON shows the exact JSON.parse error message immediately; valid JSON shows a clear success indicator." },
    ],
    faq: [
      { q: "Can I compare two JSON files and see exactly what changed?", a: "Yes, the Compare tab runs an LCS-based line diff and highlights added and removed lines side-by-side with counts." },
      { q: "Does it validate JSON as I type?", a: "Yes, invalid JSON shows the exact parser error message immediately; valid JSON shows a green \"Valid JSON\" indicator." },
      { q: "Can I minify JSON instead of pretty-printing it?", a: "Yes, a Minify button collapses valid JSON to a single compact line." },
      { q: "Can I download the formatted JSON?", a: "Yes, as a .json file, alongside copy-to-clipboard." },
      { q: "Is my JSON data uploaded anywhere?", a: "No, formatting, diffing, and validation all run in your browser." },
    ],
  },
  "jwt-decoder": {
    heading: "JWT Decoder & HS256 Verifier",
    intro:
      "Decode JWT headers and payloads and verify HS256 signatures locally in your browser. Malformed tokens are handled with explicit, clear error messages instead of silent failures.",
    features: [
      { title: "Instant Decode", desc: "Header and payload decode from Base64URL to JSON immediately, no secret key required, with per-part copy buttons." },
      { title: "HS256 Verification", desc: "Verify a token's signature against a user-supplied secret using Web Crypto HMAC-SHA256; unsupported algorithms are explicitly rejected." },
      { title: "Robust Error Handling", desc: "Malformed tokens (wrong part count, invalid Base64/JSON) surface a clear error instead of crashing." },
    ],
    faq: [
      { q: "Which JWT signing algorithms can this verify?", a: "Only HS256 (HMAC-SHA256); other algorithms show \"Only HS256 algorithm is supported for verification.\"" },
      { q: "Does decoding require the secret key?", a: "No, header and payload decode instantly without any key — the secret is only needed to verify the signature." },
      { q: "What happens if I paste an invalid JWT?", a: "You get an explicit \"Invalid JWT format\" or \"Failed to decode JWT\" error instead of a silent failure." },
      { q: "Is my token sent to a server for decoding or verification?", a: "No, decoding and HMAC verification both run locally via the Web Crypto API." },
    ],
  },
  "hash-generator": {
    heading: "Hash Generator: MD5, SHA-1, SHA-256, SHA-512",
    intro:
      "Generate MD5, SHA-1, SHA-256, and SHA-512 hashes for text or files instantly, computed entirely client-side as you type or upload.",
    features: [
      { title: "Text Hashing", desc: "All four hash algorithms compute live as you type, including a pure-JS MD5 implementation since MD5 isn't in the Web Crypto API." },
      { title: "File Checksums", desc: "Drag-and-drop or pick any file to get its MD5, SHA-1, SHA-256, and SHA-512 checksum, read entirely in-browser." },
      { title: "One-Click Copy", desc: "Per-algorithm copy buttons and a loading spinner while large files hash." },
    ],
    faq: [
      { q: "Which hash algorithms are supported?", a: "MD5, SHA-1, SHA-256, and SHA-512, for both text input and uploaded files." },
      { q: "Why is MD5 supported if it's not in the Web Crypto API?", a: "The tool includes its own MD5 implementation since MD5 was deprecated from crypto.subtle." },
      { q: "Can I get a file checksum without uploading the file anywhere?", a: "Yes, the file is read and hashed entirely in-browser via File.arrayBuffer()." },
      { q: "Can I hash large text or files?", a: "Any size the browser can hold in memory; hashes recompute automatically whenever the text or file changes." },
    ],
  },
  "bcrypt-password": {
    heading: "Bcrypt Password Hasher & Verifier",
    intro:
      "Generate secure bcrypt password hashes with a configurable cost factor, and verify passwords against existing hashes, entirely client-side.",
    features: [
      { title: "Configurable Cost Factor", desc: "Choose the bcrypt rounds before generating a hash, with a password visibility toggle and one-click copy." },
      { title: "Compare Mode", desc: "Verify a plaintext password against any existing bcrypt hash and get a clear match / no-match result." },
      { title: "Client-Side bcryptjs", desc: "Hashing and comparison both run via the bcryptjs library in your browser, with a loading state during computation." },
    ],
    faq: [
      { q: "Can I choose the bcrypt cost factor (rounds)?", a: "Yes, the hash rounds are configurable before generating the hash." },
      { q: "Can I verify a password against an existing bcrypt hash?", a: "Yes, the Compare tab checks a plaintext password against any bcrypt hash and reports match or no-match." },
      { q: "Does my password get sent anywhere?", a: "No, hashing and comparison both run in-browser via bcryptjs." },
      { q: "What happens if the hash format is invalid during compare?", a: "The compare fails gracefully with an error toast instead of crashing." },
    ],
  },
  "color-converter": {
    heading: "Color Converter: HEX, RGB, HSL & CMYK",
    intro:
      "Convert colors between HEX, RGB, HSL, and CMYK in real time, pick colors visually or from presets, and extract dominant palettes from any image.",
    features: [
      { title: "Live Format Sync", desc: "Editing HEX, RGB, HSL, or CMYK instantly updates every other format and the live color preview." },
      { title: "Visual Color Picker", desc: "Click the preview swatch to open a native color picker, or choose from 18 preset swatches." },
      { title: "Palette Extraction", desc: "Upload an image to extract its dominant colors, then click any extracted swatch to load it back into the converter." },
    ],
    faq: [
      { q: "Which color formats can I convert between?", a: "HEX, RGB, HSL, and CMYK — editing any one instantly updates the rest." },
      { q: "Can I pick a color visually instead of typing values?", a: "Yes, click the color preview to open your OS's native color picker, or choose from the built-in preset swatches." },
      { q: "Can I extract colors from an image?", a: "Yes, upload an image and the tool extracts its dominant colors as a clickable palette." },
      { q: "Is my image uploaded to a server for color extraction?", a: "No, colors are sampled locally using a canvas element in your browser." },
    ],
  },
  "url-tools": {
    heading: "URL Encoder, Decoder & Parser",
    intro:
      "Encode, decode, and parse URLs into protocol, host, path, query parameters, and hash fragment instantly, updating live as you type.",
    features: [
      { title: "Encode / Decode", desc: "Live encodeURIComponent/decodeURIComponent conversion with explicit handling of invalid percent-encoded input." },
      { title: "Full URL Parser", desc: "Breaks any URL into protocol, hostname, port, path, individual query parameters, and hash fragment using the native URL API." },
      { title: "Live, No Submit", desc: "Both encoding and parsing update automatically as you type — no button needed." },
    ],
    faq: [
      { q: "What does the URL Parser break a URL into?", a: "Protocol, hostname, port, path, individual query parameters, and the hash fragment." },
      { q: "What happens if I decode an invalid percent-encoded string?", a: "It shows \"Invalid encoded string\" instead of throwing." },
      { q: "Does encoding/decoding update automatically?", a: "Yes, both run live as you type — no button needed." },
      { q: "Can I parse query strings with multiple parameters?", a: "Yes, every query parameter is extracted individually as key/value pairs." },
    ],
  },
  "cron-translator": {
    heading: "Cron Expression Translator",
    intro:
      "Translate standard 5-field cron expressions into plain English instantly, including ranges, lists, step values, and named months or weekdays.",
    features: [
      { title: "Plain-English Translation", desc: "Parses minute, hour, day-of-month, month, and day-of-week fields into a readable sentence." },
      { title: "Ranges, Lists & Steps", desc: "Handles ranges like 1-5, lists like 1,3,5, and step syntax like */5 with natural phrasing." },
      { title: "Common Pattern Shortcuts", desc: "Special-cases frequent expressions like every minute, hourly, and daily for cleaner output." },
    ],
    faq: [
      { q: "What cron format is supported?", a: "Standard 5-field cron (minute, hour, day-of-month, month, day-of-week)." },
      { q: "Can it handle step values like */15?", a: "Yes, step syntax (*/n or base/step) translates to phrasing like \"every 15 minutes.\"" },
      { q: "Does it support ranges and lists in a field?", a: "Yes, e.g. 1-5 becomes \"from 1 to 5\" and 1,3,5 becomes \"1, 3 and 5.\"" },
      { q: "What happens if I enter an invalid cron expression?", a: "Parsing returns an error state instead of a wrong translation — an expression must have exactly 5 space-separated fields." },
    ],
  },
  "regex-tester": {
    heading: "Regex Tester with Live Matches & Cheat Sheet",
    intro:
      "Test regular expressions against text with live match highlighting, capture groups, configurable flags, and a built-in regex cheat sheet.",
    features: [
      { title: "Live Match Highlighting", desc: "Every match is shown with its index and captured groups as you type, using any valid JS RegExp flags." },
      { title: "Clear Error Messages", desc: "Invalid patterns show the exact RegExp constructor error instead of crashing." },
      { title: "Built-in Cheat Sheet", desc: "Collapsible reference for character classes, anchors, quantifiers, groups, and character sets." },
    ],
    faq: [
      { q: "Can I see capture groups for each match, not just the full match?", a: "Yes, each match result includes its captured groups alongside the match text and index." },
      { q: "What regex flags are supported?", a: "Any valid JS RegExp flags (g, i, m, s, u, y, etc.), settable directly." },
      { q: "What happens if my regex pattern is invalid?", a: "The exact RegExp constructor error message is shown instead of the tool crashing." },
      { q: "Is there a reference for regex syntax built in?", a: "Yes, a collapsible cheat sheet covers character classes, anchors, quantifiers, groups, and character sets." },
      { q: "Is there a limit on how many matches are shown?", a: "Yes, capped at 100 matches to avoid hangs on catastrophic patterns." },
    ],
  },
  "epoch-converter": {
    heading: "Epoch Time Converter: Compare & Convert Across Timezones and Countries",
    intro:
      "Convert epoch time to date, or date to epoch time, in one click. This epoch time converter lets you compare epoch time across multiple countries at once, convert Unix timestamps timezone-wise using the full IANA database, and defaults to your device's local timezone so results are relevant immediately.",
    features: [
      { title: "Epoch Time Compare", desc: "Add multiple countries or cities and compare the same epoch timestamp across all of them side-by-side, with local date, time, and UTC offset." },
      { title: "Epoch Time Timezone Wise", desc: "Every conversion accounts for the exact timezone rules and daylight saving of the country you select, not just a fixed UTC offset." },
      { title: "Date to Epoch Time", desc: "Pick any date, time, and timezone to instantly convert it to a Unix epoch timestamp in seconds and milliseconds." },
    ],
    faq: [
      { q: "How do I compare epoch time across multiple countries?", a: "Enter a Unix epoch timestamp, then add any countries or cities to the timezone comparison list. The tool instantly shows the local date, time, day of week, and UTC offset for every location side-by-side." },
      { q: "Can I convert epoch time timezone-wise?", a: "Yes. Every conversion is calculated per-timezone using the full IANA timezone database, so you get accurate local time for any country or city, including DST adjustments." },
      { q: "Can I convert a date and time to epoch time?", a: "Yes. Switch to Date to Epoch mode, pick a date, time, and timezone (your device timezone is selected by default), and get the Unix timestamp in both seconds and milliseconds." },
      { q: "Does this epoch time converter support all countries and timezones?", a: "Yes, all IANA timezones across every country are supported, so you can convert or compare epoch time for any location in the world." },
      { q: "Is my epoch timestamp data sent to a server?", a: "No. All epoch time conversion and timezone comparison happens locally in your browser. Nothing is uploaded or stored." },
    ],
  },
};
