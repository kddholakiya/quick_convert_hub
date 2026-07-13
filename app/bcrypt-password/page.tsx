import ToolHub from "@/components/tool-hub";
import { buildToolMetadata, TOOLS_META } from "@/lib/tools-metadata";

export const metadata = buildToolMetadata("bcrypt-password");

export default function Page() {
  return (
    <>
      <ToolHub activeTool="bcrypt" />
      <h1 className="sr-only">{TOOLS_META["bcrypt-password"].heading}</h1>
    </>
  );
}
