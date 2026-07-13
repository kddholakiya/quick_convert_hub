import ToolHub from "@/components/tool-hub";
import { buildToolMetadata, TOOLS_META } from "@/lib/tools-metadata";

export const metadata = buildToolMetadata("color-converter");

export default function Page() {
  return (
    <>
      <ToolHub activeTool="color" />
      <h1 className="sr-only">{TOOLS_META["color-converter"].heading}</h1>
    </>
  );
}
