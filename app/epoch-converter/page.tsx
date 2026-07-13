import ToolHub from "@/components/tool-hub";
import { buildToolMetadata, TOOLS_META } from "@/lib/tools-metadata";

export const metadata = buildToolMetadata("epoch-converter");

export default function Page() {
  return (
    <>
      <ToolHub activeTool="epoch" />
      <h1 className="sr-only">{TOOLS_META["epoch-converter"].heading}</h1>
    </>
  );
}
