import ToolHub from "@/components/tool-hub";
import { buildToolMetadata, TOOLS_META } from "@/lib/tools-metadata";

export const metadata = buildToolMetadata("cron-translator");

export default function Page() {
  return (
    <>
      <ToolHub activeTool="cron" />
      <h1 className="sr-only">{TOOLS_META["cron-translator"].heading}</h1>
    </>
  );
}
