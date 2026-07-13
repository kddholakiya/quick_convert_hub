export default function StructuredData() {
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "QuickConvert Hub",
    "url": "https://quickconvert.dev",
    "description": "Free online developer tools with 100% privacy. QR code generator, Base64 converter, AES-256 encryption, JSON formatter, JWT decoder, hash generator, color converter, URL parser, cron translator, and regex tester.",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "QR Code Generator & Scanner",
      "Base64 Image Converter",
      "AES-256 Encryption Vault",
      "JSON Formatter & Parser",
      "JWT Decoder & Verifier",
      "Hash Generator (MD5, SHA-1, SHA-256, SHA-512)",
      "Bcrypt Password Hasher",
      "Color Space Converter (HEX, RGB, HSL, CMYK)",
      "URL Encoder/Decoder & Parser",
      "Cron Expression Translator",
      "Regex Tester"
    ],
    "browserRequirements": "Requires JavaScript. Works in all modern browsers.",
    "privacyPolicy": "All processing happens locally in your browser. No data is sent to external servers."
  };

  const webSiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "QuickConvert Hub",
    "url": "https://quickconvert.dev",
    "description": "Free online developer tools with 100% privacy. QR code generator, Base64 converter, AES-256 encryption, JSON formatter, JWT decoder, hash generator, color converter, URL parser, cron translator, and regex tester.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://quickconvert.dev/#search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  const softwareApplicationData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "QuickConvert Hub",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1250",
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is QuickConvert Hub free to use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, QuickConvert Hub is completely free to use. All tools are available at no cost."
        }
      },
      {
        "@type": "Question",
        "name": "Is my data safe when using QuickConvert Hub?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely. All processing happens locally in your browser. No data is sent to external servers, ensuring complete privacy and security."
        }
      },
      {
        "@type": "Question",
        "name": "Do I need to create an account to use the tools?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No account required. All tools are available instantly without registration."
        }
      },
      {
        "@type": "Question",
        "name": "Can I use QuickConvert Hub offline?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, once the page is loaded, all tools work offline as they run entirely in your browser."
        }
      },
      {
        "@type": "Question",
        "name": "What tools are available on QuickConvert Hub?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "QuickConvert Hub includes QR code generator, Base64 converter, AES-256 encryption, JSON formatter, JWT decoder, hash generator, bcrypt password hasher, color converter, URL tools, cron translator, and regex tester."
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />
    </>
  );
}