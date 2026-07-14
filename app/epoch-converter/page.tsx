import ToolHub from "@/components/tool-hub";
import ToolSeoContent from "@/components/tool-seo-content";
import { buildToolMetadata, TOOLS_META } from "@/lib/tools-metadata";

export const metadata = buildToolMetadata("epoch-converter");

export default function Page() {
  return (
    <>
      <ToolHub activeTool="epoch" />
      <h1 className="sr-only">{TOOLS_META["epoch-converter"].heading}</h1>
      <ToolSeoContent slug="epoch-converter" />
    </>
  );
}
