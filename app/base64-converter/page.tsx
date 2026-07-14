import ToolHub from "@/components/tool-hub";
import ToolSeoContent from "@/components/tool-seo-content";
import { buildToolMetadata, TOOLS_META } from "@/lib/tools-metadata";

export const metadata = buildToolMetadata("base64-converter");

export default function Page() {
  return (
    <>
      <ToolHub activeTool="base64" />
      <h1 className="sr-only">{TOOLS_META["base64-converter"].heading}</h1>
      <ToolSeoContent slug="base64-converter" />
    </>
  );
}
