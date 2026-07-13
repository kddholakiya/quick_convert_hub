import ToolHub from "@/components/tool-hub";
import { buildToolMetadata, TOOLS_META } from "@/lib/tools-metadata";

export const metadata = buildToolMetadata("base64-converter");

export default function Page() {
  return (
    <>
      <ToolHub activeTool="base64" />
      <h1 className="sr-only">{TOOLS_META["base64-converter"].heading}</h1>
    </>
  );
}
