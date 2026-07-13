import ToolHub from "@/components/tool-hub";
import { buildToolMetadata, TOOLS_META } from "@/lib/tools-metadata";

export const metadata = buildToolMetadata("json-formatter");

export default function Page() {
  return (
    <>
      <ToolHub activeTool="json" />
      <h1 className="sr-only">{TOOLS_META["json-formatter"].heading}</h1>
    </>
  );
}
