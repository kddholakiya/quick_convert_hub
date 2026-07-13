import ToolHub from "@/components/tool-hub";
import { buildToolMetadata, TOOLS_META } from "@/lib/tools-metadata";

export const metadata = buildToolMetadata("jwt-decoder");

export default function Page() {
  return (
    <>
      <ToolHub activeTool="jwt" />
      <h1 className="sr-only">{TOOLS_META["jwt-decoder"].heading}</h1>
    </>
  );
}
