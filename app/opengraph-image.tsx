import { ImageResponse } from "next/og";

export const alt = "QuickConvert Hub - Free Online Developer Tools";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          backgroundImage:
            "radial-gradient(circle at 25% 20%, rgba(16,185,129,0.25), transparent 40%), radial-gradient(circle at 75% 80%, rgba(168,85,247,0.25), transparent 40%)",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: -2,
          }}
        >
          QuickConvert Hub
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 32,
            color: "#a1a1aa",
          }}
        >
          Free Online Developer Tools · 100% Private &amp; Client-Side
        </div>
      </div>
    ),
    { ...size }
  );
}
