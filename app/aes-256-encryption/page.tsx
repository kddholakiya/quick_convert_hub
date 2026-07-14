import ToolHub from "@/components/tool-hub";
import ToolSeoContent from "@/components/tool-seo-content";
import { buildToolMetadata, TOOLS_META } from "@/lib/tools-metadata";

export const metadata = buildToolMetadata("aes-256-encryption");

export default function Page() {
  return (
    <>
      <ToolHub activeTool="crypto" />
      <h1 className="sr-only">{TOOLS_META["aes-256-encryption"].heading}</h1>
      <ToolSeoContent slug="aes-256-encryption" />
    </>
  );
}
