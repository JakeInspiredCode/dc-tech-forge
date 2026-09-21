"use client";

import ToolPage from "@/components/ui/tool-page";
import CommandDissector from "@/components/forge/explorer/command-dissector";

export default function CommandDissectorPage() {
  return (
    <ToolPage title="Command Dissector" subtitle="Take a command apart — the command itself, its flags, and its arguments." width="wide">
        <CommandDissector />
    </ToolPage>
  );
}
