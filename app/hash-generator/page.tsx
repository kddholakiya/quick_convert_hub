import ToolHub from "@/components/tool-hub";
import { buildToolMetadata, TOOLS_META } from "@/lib/tools-metadata";

export const metadata = buildToolMetadata("hash-generator");

export default function Page() {
  return (
    <>
      <ToolHub activeTool="hash" />
      <h1 className="sr-only">{TOOLS_META["hash-generator"].heading}</h1>
    </>
  );
}
