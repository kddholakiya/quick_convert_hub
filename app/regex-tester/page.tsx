import ToolHub from "@/components/tool-hub";
import { buildToolMetadata, TOOLS_META } from "@/lib/tools-metadata";

export const metadata = buildToolMetadata("regex-tester");

export default function Page() {
  return (
    <>
      <ToolHub activeTool="regex" />
      <h1 className="sr-only">{TOOLS_META["regex-tester"].heading}</h1>
    </>
  );
}
