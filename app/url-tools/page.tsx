import ToolHub from "@/components/tool-hub";
import ToolSeoContent from "@/components/tool-seo-content";
import { buildToolMetadata, TOOLS_META } from "@/lib/tools-metadata";

export const metadata = buildToolMetadata("url-tools");

export default function Page() {
  return (
    <>
      <ToolHub activeTool="url" />
      <h1 className="sr-only">{TOOLS_META["url-tools"].heading}</h1>
      <ToolSeoContent slug="url-tools" />
    </>
  );
}
