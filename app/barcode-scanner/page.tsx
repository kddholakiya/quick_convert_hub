import ToolHub from "@/components/tool-hub";
import ToolSeoContent from "@/components/tool-seo-content";
import { buildToolMetadata, TOOLS_META } from "@/lib/tools-metadata";

export const metadata = buildToolMetadata("barcode-scanner");

export default function Page() {
  return (
    <>
      <ToolHub activeTool="barcode" />
      <h1 className="sr-only">{TOOLS_META["barcode-scanner"].heading}</h1>
      <ToolSeoContent slug="barcode-scanner" />
    </>
  );
}
