"use client";

import { useState, useMemo } from "react";
import commands, { COMMAND_CATEGORIES, Command, searchCommands } from "@/lib/seeds/commands";

interface Props {
  onBack: () => void;
}

// Auto-parse a usage string into typed parts for hover display
interface ParsedPart {
  text: string;
  type: "command" | "option" | "argument" | "operator" | "space";
  label: string;
}

function parseUsage(usage: string, cmd: Command): ParsedPart[] {
  const parts: ParsedPart[] = [];
  const tokens = usage.match(/\S+|\s+/g) || [];
  let isFirst = true;

  for (const token of tokens) {
    if (/^\s+$/.test(token)) {
      parts.push({ text: token, type: "space", label: "" });
      continue;
    }
    if (isFirst) {
      parts.push({ text: token, type: "command", label: `Command: ${cmd.description}` });
      isFirst = false;
    } else if (token.startsWith("-")) {
      const flag = cmd.flags.find((f) => f.flag === token || token.startsWith(f.flag));
      parts.push({ text: token, type: "option", label: flag ? `${flag.flag}: ${flag.description}` : `Option: ${token}` });
    } else if (token === "|" || token === ">" || token === ">>" || token === "&&" || token === "||" || token === ";") {
      parts.push({ text: token, type: "operator", label: token === "|" ? "Pipe: send output to next command" : `Operator: ${token}` });
    } else {
      parts.push({ text: token, type: "argument", label: `Argument: ${token}` });
    }
  }
  return parts;
}

const TYPE_COLORS: Record<string, string> = {
  command: "#FF6B6B",
  option: "#FFA832",
  argument: "#7AE87A",
  operator: "#C8A0FF",
  space: "transparent",
};

function DissectorView({ cmd }: { cmd: Command }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [exampleIdx, setExampleIdx] = useState(0);

  const usage = cmd.examples[exampleIdx]?.usage || cmd.command;
  const parts = useMemo(() => parseUsage(usage, cmd), [usage, cmd]);

  return (
    <div>
      {/* Example selector tabs */}
      {cmd.examples.length > 1 && (
        <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
          {cmd.examples.map((ex, i) => (
            <button key={i} onClick={() => { setExampleIdx(i); setHovered(null); }} style={{
              padding: "3px 10px", borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: "pointer",
              background: exampleIdx === i ? "rgba(80,200,255,0.15)" : "rgba(255,255,255,0.04)",
              border: exampleIdx === i ? "1px solid rgba(80,200,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
              color: exampleIdx === i ? "#50C8FF" : "var(--color-v2-text-muted)",
              fontFamily: "'JetBrains Mono', monospace",
            }}>{ex.usage.split(" ")[0]} {i + 1}</button>
          ))}
        </div>
      )}

      {/* Hoverable parts display */}
      <div style={{
        background: "rgba(0,0,0,0.4)", borderRadius: 8, padding: "14px 16px",
        border: "1px solid rgba(255,255,255,0.08)", fontFamily: "'JetBrains Mono', monospace",
        fontSize: 15, letterSpacing: "0.3px", marginBottom: 8, overflowX: "auto",
      }}>
        {parts.map((p, i) => (
          <span
            key={i}
            onMouseEnter={() => p.type !== "space" && setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              color: hovered === i ? "#FFF" : (TYPE_COLORS[p.type] || "#C8D8E8"),
              background: hovered === i ? (TYPE_COLORS[p.type] + "30") : "transparent",
              borderBottom: `2px solid ${hovered === i ? TYPE_COLORS[p.type] : "transparent"}`,
              padding: p.type !== "space" ? "2px 1px" : 0,
              borderRadius: 3,
              cursor: p.type !== "space" ? "pointer" : "default",
              transition: "all 0.12s",
              whiteSpace: "pre",
            }}
          >{p.text}</span>
        ))}
      </div>

      {/* Tooltip */}
      <div style={{
        minHeight: 32, padding: "6px 10px", borderRadius: 6,
        background: hovered !== null ? "rgba(255,255,255,0.04)" : "transparent",
        border: hovered !== null ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
        transition: "all 0.15s",
      }}>
        {hovered !== null && parts[hovered] ? (
          <span style={{ color: TYPE_COLORS[parts[hovered].type], fontSize: 13, fontWeight: 500 }}>
            {parts[hovered].label}
          </span>
        ) : (
          <span style={{ color: "var(--color-v2-text-muted)", fontSize: 12, fontStyle: "italic" }}>Hover over any part to see what it does</span>
        )}
      </div>

      {/* Example explanation */}
      {cmd.examples[exampleIdx] && (
        <p style={{ color: "var(--color-v2-text-muted)", fontSize: 12, margin: "6px 0 0 0", fontStyle: "italic" }}>
          {cmd.examples[exampleIdx].explanation}
        </p>
      )}
    </div>
  );
}

export default function CommandDissector({ onBack }: Props) {
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedCmd, setSelectedCmd] = useState<Command | null>(null);

  const filtered = useMemo(() => {
    let result = category === "all" ? commands : commands.filter((c) => c.category === category);
    if (search.trim()) {
      const hits = searchCommands(search);
      result = result.filter((c) => hits.some((h) => h.id === c.id));
    }
    return result;
  }, [category, search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Command Dissector — {commands.length} commands</h3>
        <button onClick={onBack} className="text-xs text-forge-text-muted hover:text-forge-text">
          Back
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search commands..."
        className="w-full bg-forge-surface border border-forge-border rounded-lg px-3 py-1.5 text-sm mono outline-none focus:border-forge-accent/50 placeholder:text-forge-text-muted mb-3"
      />

      {/* Category chips */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        <button
          onClick={() => setCategory("all")}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            category === "all"
              ? "bg-forge-accent/15 text-forge-accent-text border border-forge-accent/30"
              : "bg-forge-surface border border-forge-border text-forge-text-dim hover:text-forge-text"
          }`}
        >
          All ({commands.length})
        </button>
        {COMMAND_CATEGORIES.map((cat) => {
          const count = commands.filter((c) => c.category === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                category === cat.id
                  ? "bg-forge-accent/15 text-forge-accent-text border border-forge-accent/30"
                  : "bg-forge-surface border border-forge-border text-forge-text-dim hover:text-forge-text"
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Selected command dissector */}
      {selectedCmd && (
        <div className="mb-4 bg-forge-surface border border-forge-accent/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="mono text-forge-accent-text font-bold">{selectedCmd.command}</span>
              <span className="text-xs text-forge-text-dim">{selectedCmd.description}</span>
            </div>
            <button
              onClick={() => setSelectedCmd(null)}
              className="text-xs text-forge-text-muted hover:text-forge-text"
            >
              Close
            </button>
          </div>
          <DissectorView cmd={selectedCmd} />

          {/* Flags reference */}
          {selectedCmd.flags.length > 0 && (
            <div className="mt-4 pt-3 border-t border-forge-border">
              <span className="text-[10px] uppercase text-forge-text-muted font-semibold tracking-wider">Flags</span>
              <div className="mt-1 space-y-1">
                {selectedCmd.flags.map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="mono text-xs text-forge-accent-text shrink-0 w-24">{f.flag}</span>
                    <span className="text-xs text-forge-text-dim">{f.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Command grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[55vh] overflow-y-auto">
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-sm text-forge-text-muted py-8">No commands match.</p>
        )}
        {filtered.map((cmd) => (
          <button
            key={cmd.id}
            onClick={() => setSelectedCmd(cmd)}
            className={`text-left px-3 py-2 rounded-lg border transition-colors ${
              selectedCmd?.id === cmd.id
                ? "bg-forge-accent/10 border-forge-accent/30 text-forge-accent-text"
                : "bg-forge-surface border-forge-border hover:border-forge-border-hover text-forge-text"
            }`}
          >
            <span className="mono text-sm font-bold block">{cmd.command}</span>
            <span className="text-[11px] text-forge-text-dim line-clamp-1">{cmd.description}</span>
          </button>
        ))}
      </div>

      {/* Color legend */}
      <div className="flex gap-4 mt-3 pt-3 border-t border-forge-border">
        {[
          { label: "Command", color: "#FF6B6B" },
          { label: "Option", color: "#FFA832" },
          { label: "Argument", color: "#7AE87A" },
          { label: "Operator", color: "#C8A0FF" },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1.5 text-[11px] text-forge-text-dim">
            <span style={{ width: 8, height: 8, borderRadius: 2, background: item.color, display: "inline-block" }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
