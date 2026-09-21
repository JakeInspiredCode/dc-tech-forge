// @ts-nocheck — migrated from JSX, full TS conversion in a future pass
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { SECTIONS, QUICK_REF } from "@/lib/seeds/foundations-content";
import FoundationsNav from "@/components/foundations/foundations-nav";
import { useLessonScale, scaleLabel } from "@/lib/use-lesson-scale";
import { onActivate } from "@/lib/a11y";

// ─── REUSABLE COMPONENTS ────────────────────────────────────────────────────

function ThinkAboutIt({ scenario, hint, answer, onComplete }) {
  const [userAnswer, setUserAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);

  const handleReveal = () => {
    setRevealed(true);
    setHasAttempted(true);
    if (onComplete) onComplete();
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(255,170,50,0.08), rgba(255,120,20,0.04))",
      border: "1px solid rgba(255,170,50,0.25)",
      borderLeft: "3px solid #FFA832",
      borderRadius: 8, padding: "18px 20px", margin: "14px 0",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, color: "#FFA832", fontWeight: 700, fontSize: 11, letterSpacing: "0.5px" }}>
        <span style={{ fontSize: 12 }}>⚡</span> THINK ABOUT IT
      </div>
      <p style={{ color: "#E0D8CF", lineHeight: 1.6, margin: "0 0 12px 0" }}>{scenario}</p>
      {hint && <p style={{ color: "#A09080", fontSize: 11, fontStyle: "italic", margin: "0 0 12px 0" }}>Hint: {hint}</p>}
      {!revealed && (
        <>
          <textarea aria-label="Your answer"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Try to answer before revealing — or reveal when ready..."
            style={{
              width: "100%", minHeight: 70, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,170,50,0.2)",
              borderRadius: 6, padding: 12, color: "#E8E0D8", fontSize: 11, fontFamily: "inherit", resize: "vertical",
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={handleReveal}
            style={{
              marginTop: 10, padding: "8px 20px", background: "#FFA832",
              border: "none", borderRadius: 6, color: "#1A1A2E",
              fontWeight: 700, fontSize: 11, cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Reveal Insight
          </button>
        </>
      )}
      {revealed && (
        <>
          <div style={{
            marginTop: 12, padding: 14, background: "rgba(255,170,50,0.1)", borderRadius: 6,
            border: "1px solid rgba(255,170,50,0.2)",
          }}>
            <div style={{ color: "#FFA832", fontWeight: 700, fontSize: 10, marginBottom: 6 }}>INSIGHT</div>
            <p style={{ color: "#E8E0D8", lineHeight: 1.6, margin: 0 }}>{answer}</p>
          </div>
          <button
            onClick={() => { setUserAnswer(""); setRevealed(false); }}
            style={{
              marginTop: 10, padding: "6px 14px", background: "transparent",
              border: "1px solid rgba(255,170,50,0.35)", borderRadius: 6,
              color: "#FFC878", fontWeight: 600, fontSize: 10, cursor: "pointer",
            }}
          >↻ Try Again</button>
        </>
      )}
    </div>
  );
}

function KnowledgeCheck({ question, correctAnswer, onComplete }) {
  const [userAnswer, setUserAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [confidence, setConfidence] = useState(null);

  const handleReveal = () => {
    setRevealed(true);
    if (onComplete) onComplete();
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(80,200,255,0.08), rgba(40,140,255,0.04))",
      border: "1px solid rgba(80,200,255,0.25)",
      borderLeft: "3px solid #50C8FF",
      borderRadius: 8, padding: "18px 20px", margin: "14px 0",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, color: "#50C8FF", fontWeight: 700, fontSize: 11, letterSpacing: "0.5px" }}>
        <span style={{ fontSize: 12 }}>◇</span> KNOWLEDGE CHECK
      </div>
      <p style={{ color: "#E0E4E8", lineHeight: 1.6, margin: "0 0 12px 0", fontWeight: 500 }}>{question}</p>
      {!revealed && (
        <>
          <textarea aria-label="Your answer"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Try to answer before checking — or check when ready..."
            style={{
              width: "100%", minHeight: 70, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(80,200,255,0.2)",
              borderRadius: 6, padding: 12, color: "#E8E8F0", fontSize: 11, fontFamily: "inherit", resize: "vertical",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <span style={{ color: "var(--color-v2-text-muted)", fontSize: 10, marginRight: 4 }}>Confidence:</span>
            {["Sure", "Unsure", "Guessing"].map((c) => (
              <button key={c} onClick={() => setConfidence(c)} style={{
                padding: "5px 14px", borderRadius: 20,
                background: confidence === c ? (c === "Sure" ? "#2A8A4A" : c === "Unsure" ? "#AA7A20" : "#AA3030") : "rgba(255,255,255,0.05)",
                border: confidence === c ? "none" : "1px solid rgba(255,255,255,0.15)",
                color: confidence === c ? "#FFF" : "var(--color-v2-text-muted)", fontSize: 10, fontWeight: 600, cursor: "pointer",
                transition: "all 0.2s",
              }}>{c}</button>
            ))}
            <button
              onClick={handleReveal}
              style={{
                marginLeft: "auto", padding: "8px 20px",
                background: "#50C8FF",
                border: "none", borderRadius: 6,
                color: "#1A1A2E",
                fontWeight: 700, fontSize: 11,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >Check Answer</button>
          </div>
        </>
      )}
      {revealed && (
        <>
          <div style={{
            marginTop: 12, padding: 14, background: "rgba(80,200,255,0.08)", borderRadius: 6,
            border: "1px solid rgba(80,200,255,0.2)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ color: "#50C8FF", fontWeight: 700, fontSize: 10 }}>ANSWER</span>
              <span style={{
                fontSize: 10, padding: "2px 10px", borderRadius: 10,
                background: confidence === "Sure" ? "rgba(42,138,74,0.3)" : confidence === "Unsure" ? "rgba(170,122,32,0.3)" : "rgba(170,48,48,0.3)",
                color: confidence === "Sure" ? "#5ADA7A" : confidence === "Unsure" ? "#DDAA44" : "#EE6666",
              }}>You were: {confidence}</span>
            </div>
            <p style={{ color: "#E8E8F0", lineHeight: 1.6, margin: 0 }}>{correctAnswer}</p>
          </div>
          <button
            onClick={() => { setUserAnswer(""); setRevealed(false); setConfidence(null); }}
            style={{
              marginTop: 10, padding: "6px 14px", background: "transparent",
              border: "1px solid rgba(80,200,255,0.35)", borderRadius: 6,
              color: "#9CD8FF", fontWeight: 600, fontSize: 10, cursor: "pointer",
            }}
          >↻ Try Again</button>
        </>
      )}
    </div>
  );
}

function Code({ children }) {
  return (
    <code style={{
      background: "rgba(80,200,255,0.1)", color: "#7DD8FF", padding: "2px 7px",
      borderRadius: 4, fontSize: "0.92em", fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    }}>{children}</code>
  );
}

function CodeBlock({ children, label }) {
  return (
    <div style={{ margin: "12px 0" }}>
      {label && <div style={{ color: "var(--color-v2-text-muted)", fontSize: 10, fontWeight: 600, marginBottom: 4, letterSpacing: "0.5px" }}>{label}</div>}
      <pre style={{
        background: "rgba(0,0,0,0.4)", border: "1px solid rgba(80,200,255,0.12)", borderRadius: 8,
        padding: "14px 16px", overflowX: "auto", margin: 0,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 11, lineHeight: 1.6, color: "#C8D8E8",
      }}>{children}</pre>
    </div>
  );
}

function InfoTable({ headers, rows }) {
  return (
    <div style={{ overflowX: "auto", margin: "12px 0" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{
                textAlign: "left", padding: "10px 14px", borderBottom: "2px solid rgba(80,200,255,0.3)",
                color: "#50C8FF", fontWeight: 700, fontSize: 10, letterSpacing: "0.5px", whiteSpace: "nowrap",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)",
                  color: "#C8CCD0", lineHeight: 1.5,
                }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionHeading({ children }) {
  return <h3 style={{ color: "#E8ECF0", fontSize: 15, fontWeight: 700, margin: "20px 0 10px 0", lineHeight: 1.3 }}>{children}</h3>;
}

// ─── INTERACTIVE: OS FUNCTION CARDS (COLLAPSIBLE) ───────────────────────────
function OsFunctionCards() {
  const [expanded, setExpanded] = useState(new Set());
  const items = [
    { title: "It manages hardware.", body: "Your computer has a CPU, memory, storage, and devices (keyboard, network card, GPU). The OS decides which program gets CPU time, which region of memory it can use, and how it talks to devices. Without an OS, every program would need to contain its own code for reading a keyboard, drawing to a screen, and writing to a disk — and they would all fight over resources.", color: "#FF6B6B" },
    { title: "It provides abstractions.", body: 'Instead of forcing programs to know the physical address of a sector on a spinning disk, the OS presents "files" and "directories." Instead of making programs manage raw memory addresses, the OS gives each one its own virtual memory space. These abstractions make software portable and development possible.', color: "#FFA832" },
    { title: "It enforces boundaries.", body: "Program A cannot read Program B's memory. A normal user cannot delete system files. A process that crashes does not take the entire machine down (usually). The OS is the enforcer.", color: "#50C8FF" },
  ];

  const toggle = (i) => {
    const next = new Set(expanded);
    if (next.has(i)) next.delete(i); else next.add(i);
    setExpanded(next);
  };

  return (
    <div style={{ display: "grid", gap: 8, margin: "16px 0 20px" }}>
      {items.map((item, i) => (
        <div key={i} onClick={() => toggle(i)} style={{
          padding: "14px 18px", borderRadius: 8, background: "rgba(255,255,255,0.02)",
          borderLeft: `3px solid ${item.color}`, cursor: "pointer", transition: "all 0.2s",
        }}>
          <div
            role="button" tabIndex={0} aria-expanded={expanded.has(i)}
            onKeyDown={onActivate(() => toggle(i))}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <strong style={{ color: item.color }}>{item.title}</strong>
            <span style={{ color: "var(--color-v2-text-muted)", fontSize: 10, flexShrink: 0, marginLeft: 12, transition: "transform 0.2s", transform: expanded.has(i) ? "rotate(90deg)" : "none" }}>▸</span>
            {!expanded.has(i) && <span style={{ color: "var(--color-v2-text-muted)", fontSize: 10, marginLeft: 6, fontStyle: "italic" }}>click to expand</span>}
          </div>
          {expanded.has(i) && (
            <p style={{ color: "#B8BCC0", fontSize: 11, lineHeight: 1.6, margin: "10px 0 0 0" }}>{item.body}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── INTERACTIVE: CLI TERMS CARDS (COLLAPSIBLE) ─────────────────────────────
function CliTermsCards() {
  const [expanded, setExpanded] = useState(new Set());
  const items = [
    { term: "Terminal", desc: 'The window or application that displays text input and output. It is the container. On your laptop, this might be "Terminal" or "iTerm2" or "Windows Terminal." On a remote server, your SSH session is your terminal.', color: "#FF6B6B" },
    { term: "Shell", desc: "The program running inside the terminal that interprets your commands. The most common shell is Bash (Bourne Again Shell). When you type a command and press Enter, the shell reads your input, figures out what to do, and shows you the result.", color: "#FFA832" },
    { term: "Command Line", desc: "The general concept of interacting with a computer by typing text commands rather than clicking on graphical elements.", color: "#50C8FF" },
  ];

  const toggle = (i) => {
    const next = new Set(expanded);
    if (next.has(i)) next.delete(i); else next.add(i);
    setExpanded(next);
  };

  return (
    <div style={{ display: "grid", gap: 8, margin: "12px 0 20px" }}>
      {items.map((item, i) => (
        <div key={i} onClick={() => toggle(i)} style={{
          padding: "14px 18px", borderRadius: 8, background: "rgba(255,255,255,0.02)",
          borderLeft: `3px solid ${item.color}`, cursor: "pointer", transition: "all 0.2s",
        }}>
          <div
            role="button" tabIndex={0} aria-expanded={expanded.has(i)}
            onKeyDown={onActivate(() => toggle(i))}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <strong style={{ color: item.color }}>{item.term}</strong>
            <span style={{ color: "var(--color-v2-text-muted)", fontSize: 10, flexShrink: 0, marginLeft: 12, transition: "transform 0.2s", transform: expanded.has(i) ? "rotate(90deg)" : "none" }}>▸</span>
            {!expanded.has(i) && <span style={{ color: "var(--color-v2-text-muted)", fontSize: 10, marginLeft: 6, fontStyle: "italic" }}>click to expand</span>}
          </div>
          {expanded.has(i) && (
            <p style={{ color: "#B8BCC0", fontSize: 11, lineHeight: 1.6, margin: "10px 0 0 0" }}>{item.desc}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── INTERACTIVE: OS LAYER SORTER ───────────────────────────────────────────
function LayerSorter({ onComplete }) {
  const correctOrder = ["Applications", "User Space", "Kernel", "Hardware"];
  const [items, setItems] = useState(() => [...correctOrder].sort(() => Math.random() - 0.5));
  const [dragIdx, setDragIdx] = useState(null);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleDragStart = (i) => setDragIdx(i);
  const handleDrop = (i) => {
    if (dragIdx === null) return;
    const next = [...items];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(i, 0, moved);
    setItems(next);
    setDragIdx(null);
    setChecked(false);
  };

  const check = () => {
    const correct = items.every((item, i) => item === correctOrder[i]);
    setIsCorrect(correct);
    setChecked(true);
    if (correct && onComplete) onComplete();
  };

  const layerColors = { Hardware: "#FF6B6B", Kernel: "#FFA832", "User Space": "#50C8FF", Applications: "#7AE87A" };
  const layerDescs = {
    Hardware: "CPU, RAM, Storage, Network — the physical components",
    Kernel: "Full hardware access — scheduling, memory, drivers, system calls",
    "User Space": "Programs running with restricted access, must ask kernel for hardware",
    Applications: "Your browser, terminal, file manager — what users interact with",
  };

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10, padding: 20, margin: "14px 0",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ color: "#AAB4BE", fontWeight: 700, fontSize: 10, letterSpacing: "0.5px" }}>
          ▸ SORT THE LAYERS — Drag to stack from bottom (1 = hardware) to top (4 = applications)
        </div>
        <button onClick={() => { setItems([...correctOrder].sort(() => Math.random() - 0.5)); setChecked(false); setIsCorrect(false); }} style={{
          padding: "3px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer",
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-v2-text-muted)",
        }}>↻ Reset</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item, i) => (
          <div
            key={item}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(i)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px", borderRadius: 8, cursor: "grab",
              background: checked && isCorrect
                ? `rgba(${item === "Hardware" ? "255,107,107" : item === "Kernel" ? "255,168,50" : item === "User Space" ? "80,200,255" : "122,232,122"},0.12)`
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${checked && isCorrect ? layerColors[item] + "66" : "rgba(255,255,255,0.08)"}`,
              transition: "all 0.2s",
            }}
          >
            <span style={{ color: "var(--color-v2-text-muted)", fontSize: 10, fontWeight: 600, minWidth: 20 }}>{items.length - i}</span>
            <span style={{
              color: layerColors[item], fontWeight: 700, fontSize: 11, minWidth: 120,
            }}>{item}</span>
            <span style={{ color: "var(--color-v2-text-muted)", fontSize: 10 }}>
              {checked && isCorrect ? layerDescs[item] : ""}
            </span>
            <span style={{ marginLeft: "auto", color: "var(--color-v2-text-muted)", fontSize: 13 }}>⠿</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
        <button onClick={check} style={{
          padding: "8px 22px", background: "#50C8FF", border: "none", borderRadius: 6,
          color: "#1A1A2E", fontWeight: 700, fontSize: 11, cursor: "pointer",
        }}>Check Order</button>
        {checked && (
          <span style={{ color: isCorrect ? "#7AE87A" : "#FF6B6B", fontWeight: 600, fontSize: 11 }}>
            {isCorrect ? "✓ Correct! Bottom to top: Hardware (1) → Kernel (2) → User Space (3) → Applications (4)" : "✗ Not quite — remember: hardware is the foundation at the bottom, kernel sits on it, then user space, then apps on top."}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── INTERACTIVE: COMMAND DISSECTOR ─────────────────────────────────────────
function CommandDissector() {
  const commands = [
    {
      text: "ls -la /var/log",
      parts: [
        { text: "ls", type: "command", label: "Command: the program to run (ls = list)" },
        { text: " ", type: "space", label: "" },
        { text: "-la", type: "option", label: "Options: -l = long format, -a = show hidden files" },
        { text: " ", type: "space", label: "" },
        { text: "/var/log", type: "argument", label: "Argument: what to act on (the /var/log directory)" },
      ],
    },
    {
      text: "cp -r /source /destination",
      parts: [
        { text: "cp", type: "command", label: "Command: copy files" },
        { text: " ", type: "space", label: "" },
        { text: "-r", type: "option", label: "Option: -r = recursive (include subdirectories)" },
        { text: " ", type: "space", label: "" },
        { text: "/source", type: "argument", label: "Argument: source path to copy from" },
        { text: " ", type: "space", label: "" },
        { text: "/destination", type: "argument", label: "Argument: destination path to copy to" },
      ],
    },
    {
      text: 'grep -i "error" /var/log/syslog',
      parts: [
        { text: "grep", type: "command", label: "Command: search for text patterns" },
        { text: " ", type: "space", label: "" },
        { text: "-i", type: "option", label: "Option: -i = case-insensitive matching" },
        { text: " ", type: "space", label: "" },
        { text: '"error"', type: "argument", label: 'Argument: the pattern to search for' },
        { text: " ", type: "space", label: "" },
        { text: "/var/log/syslog", type: "argument", label: "Argument: the file to search in" },
      ],
    },
  ];
  const [cmdIdx, setCmdIdx] = useState(0);
  const [hovered, setHovered] = useState(null);

  const typeColors = { command: "#FF6B6B", option: "#FFA832", argument: "#7AE87A" };

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10, padding: 20, margin: "14px 0",
    }}>
      <div style={{ color: "#AAB4BE", fontWeight: 700, fontSize: 10, marginBottom: 6, letterSpacing: "0.5px" }}>
        ▸ COMMAND DISSECTOR — Hover over each part to see what it does
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {commands.map((c, i) => (
          <button key={i} onClick={() => { setCmdIdx(i); setHovered(null); }} style={{
            padding: "5px 14px", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer",
            background: cmdIdx === i ? "rgba(80,200,255,0.15)" : "rgba(255,255,255,0.04)",
            border: cmdIdx === i ? "1px solid rgba(80,200,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
            color: cmdIdx === i ? "#50C8FF" : "var(--color-v2-text-muted)",
            fontFamily: "'JetBrains Mono', monospace",
          }}>{c.text.split(" ")[0]}</button>
        ))}
      </div>
      <div style={{
        background: "rgba(0,0,0,0.4)", borderRadius: 8, padding: "16px 18px",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 13, lineHeight: 1.6,
        border: "1px solid rgba(80,200,255,0.1)",
      }}>
        {commands[cmdIdx].parts.map((p, i) => (
          p.type === "space" ? <span key={i}> </span> : (
            <span
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                color: hovered === i ? "#FFF" : (typeColors[p.type] || "#C8D8E8"),
                background: hovered === i ? (typeColors[p.type] + "30") : "transparent",
                padding: "2px 4px", borderRadius: 4, cursor: "pointer",
                textDecoration: hovered === i ? "none" : "none",
                borderBottom: `2px solid ${hovered === i ? typeColors[p.type] : "transparent"}`,
                transition: "all 0.15s",
              }}
            >{p.text}</span>
          )
        ))}
      </div>
      <div style={{ minHeight: 36, marginTop: 10 }}>
        {hovered !== null && commands[cmdIdx].parts[hovered]?.label && (
          <div style={{
            padding: "8px 14px", background: "rgba(0,0,0,0.3)", borderRadius: 6,
            color: typeColors[commands[cmdIdx].parts[hovered].type],
            fontSize: 11, fontWeight: 500, display: "inline-block",
          }}>
            {commands[cmdIdx].parts[hovered].label}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
        {Object.entries(typeColors).map(([type, color]) => (
          <span key={type} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: color, display: "inline-block" }} />
            <span style={{ color: "var(--color-v2-text-muted)" }}>{type}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── INTERACTIVE: RESOURCE INVESTIGATION SIMULATOR ──────────────────────────
function ResourceInvestigator({ onComplete }) {
  const scenarios = [
    {
      prompt: "Users report the application is extremely sluggish. SSH into the server and investigate.",
      answer: "CPU",
      explanation: "CPU is the bottleneck. The top output shows a single process (java) consuming 98.2% of a CPU core, and overall CPU idle is only 1.3%. Other processes are queued waiting for CPU time. RAM has plenty available, disk has space, and network is quiet.",
      resources: {
        CPU: {
          cmd: "top -bn1 | head -20",
          output: `top - 14:23:07 up 47 days, 3:12, 2 users
Tasks: 214 total,   4 running, 210 sleeping
%Cpu(s): \x1b[91m98.7 us\x1b[0m,  0.0 sy,  0.0 ni, \x1b[91m 1.3 id\x1b[0m,  0.0 wa
MiB Mem :  64234.2 total,  31024.8 free,  28456.1 used

  PID USER      %CPU  %MEM    COMMAND
 4821 appuser   \x1b[91m98.2\x1b[0m   8.4    java
 1204 root       0.3   0.1    systemd
  892 prometheus 0.1   0.2    node_exporter`,
          highlight: "98.7% user CPU — only 1.3% idle. Process 4821 (java) is consuming an entire core.",
          status: "critical",
        },
        RAM: {
          cmd: "free -h",
          output: `              total     used     free   available
Mem:           62Gi      27Gi      30Gi      33Gi
Swap:         8.0Gi       0B     8.0Gi`,
          highlight: "33 GB available, zero swap usage. Memory is healthy — not the problem.",
          status: "healthy",
        },
        Storage: {
          cmd: "df -h /",
          output: `Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p1  477G  261G  216G  55% /`,
          highlight: "55% used, 216 GB free. Plenty of disk space remaining.",
          status: "healthy",
        },
        Network: {
          cmd: "ip -s link show eth0 | tail -6",
          output: `    RX:  bytes  packets  errors  dropped
    1284923847  982341       0        0
    TX:  bytes  packets  errors  dropped
     387492174  412893       0        0`,
          highlight: "Zero errors, zero drops on both RX and TX. Network is clean.",
          status: "healthy",
        },
      },
    },
    {
      prompt: "Monitoring alerts: server response times spiked from 50ms to 12 seconds. Investigate.",
      answer: "RAM",
      explanation: "RAM is the bottleneck. The system has exhausted physical memory — only 187 MB free with 7.8 GB of swap actively in use. When the system swaps, every memory access that hits swap goes to disk instead of RAM (microseconds vs. milliseconds), causing the massive latency spike. CPU wait time (wa) at 34.2% confirms the CPU is idle waiting on slow swap I/O.",
      resources: {
        CPU: {
          cmd: "top -bn1 | head -8",
          output: `top - 09:41:33 up 12 days, 7:04, 1 user
Tasks: 287 total,   1 running, 286 sleeping
%Cpu(s): 12.1 us,  4.3 sy,  0.0 ni, 49.4 id, \x1b[91m34.2 wa\x1b[0m
MiB Mem :  32048.0 total,    187.2 free,  30892.4 used
MiB Swap:   8192.0 total,    384.0 free,  \x1b[91m 7808.0 used\x1b[0m`,
          highlight: "34.2% CPU wait (wa) — the CPU is idle, stuck waiting on slow disk I/O. This is a symptom, not the root cause.",
          status: "warning",
        },
        RAM: {
          cmd: "free -h",
          output: `              total     used     free   available
Mem:           31Gi    \x1b[91m 30Gi\x1b[0m     187Mi      201Mi
Swap:         8.0Gi    \x1b[91m7.6Gi\x1b[0m     384Mi`,
          highlight: "Only 187 MB free RAM. 7.6 GB of swap in use — the system is heavily swapping to disk. This is the root cause.",
          status: "critical",
        },
        Storage: {
          cmd: "df -h /",
          output: `Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p1  477G  198G  279G  42% /`,
          highlight: "42% used. Disk space is fine — but the disk is being hammered by swap I/O.",
          status: "healthy",
        },
        Network: {
          cmd: "ip -s link show eth0 | tail -6",
          output: `    RX:  bytes  packets  errors  dropped
     482917364  371294       0        0
    TX:  bytes  packets  errors  dropped
     129384721  198472       0        0`,
          highlight: "Zero errors, zero drops. Network is not the issue.",
          status: "healthy",
        },
      },
    },
    {
      prompt: "Multiple services are crashing with write errors. The application logs show 'No space left on device.' Investigate.",
      answer: "Storage",
      explanation: "Storage is the bottleneck. The root filesystem is at 99% — only 2.1 GB free on a 477 GB drive. Services that write logs, temp files, or database records are failing because they can't allocate disk space. The 'No space left on device' error is the direct symptom. CPU, RAM, and network are all healthy.",
      resources: {
        CPU: {
          cmd: "top -bn1 | head -5",
          output: `top - 22:15:44 up 89 days, 11:42, 3 users
Tasks: 193 total,   1 running, 192 sleeping
%Cpu(s):  8.4 us,  2.1 sy,  0.0 ni, 89.5 id,  0.0 wa`,
          highlight: "89.5% idle. CPU is barely working — not the problem.",
          status: "healthy",
        },
        RAM: {
          cmd: "free -h",
          output: `              total     used     free   available
Mem:          125Gi      48Gi      22Gi      74Gi
Swap:         8.0Gi       0B     8.0Gi`,
          highlight: "74 GB available, zero swap. Memory is healthy.",
          status: "healthy",
        },
        Storage: {
          cmd: "df -h /",
          output: `Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p1  477G  \x1b[91m475G\x1b[0m  2.1G  \x1b[91m99%\x1b[0m /`,
          highlight: "99% full — only 2.1 GB remaining. This is why writes are failing. Immediate action needed.",
          status: "critical",
        },
        Network: {
          cmd: "ip -s link show eth0 | tail -6",
          output: `    RX:  bytes  packets  errors  dropped
    3847291048  2918347      0        0
    TX:  bytes  packets  errors  dropped
    1293847210  1847291      0        0`,
          highlight: "Zero errors, zero drops. High traffic volume but no issues.",
          status: "healthy",
        },
      },
    },
    {
      prompt: "A batch job that transfers data to a remote cluster is running 10x slower than normal. Investigate.",
      answer: "Network",
      explanation: "Network is the bottleneck. The interface shows 14,892 dropped packets and 2,341 errors on TX (transmit). Dropped packets mean the network buffer is overflowing — the link is saturated or there's a hardware issue. The batch job's data transfers are being retransmitted repeatedly, causing the 10x slowdown. CPU, RAM, and storage are all healthy.",
      resources: {
        CPU: {
          cmd: "top -bn1 | head -5",
          output: `top - 03:47:19 up 204 days, 8:33, 1 user
Tasks: 178 total,   2 running, 176 sleeping
%Cpu(s):  5.8 us,  9.2 sy,  0.0 ni, 85.0 id,  0.0 wa`,
          highlight: "85% idle. Slightly elevated system (sy) time from network processing, but CPU is not saturated.",
          status: "healthy",
        },
        RAM: {
          cmd: "free -h",
          output: `              total     used     free   available
Mem:          125Gi      34Gi      61Gi      88Gi
Swap:         8.0Gi       0B     8.0Gi`,
          highlight: "88 GB available, zero swap. Memory is fine.",
          status: "healthy",
        },
        Storage: {
          cmd: "df -h /",
          output: `Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p1  477G  312G  165G  66% /`,
          highlight: "66% used, 165 GB free. Storage is healthy.",
          status: "healthy",
        },
        Network: {
          cmd: "ip -s link show eth0 | tail -6",
          output: `    RX:  bytes  packets   errors  dropped
    89274918234  67291843       0        0
    TX:  bytes  packets   errors  dropped
    74918234091  52918347    \x1b[91m 2341\x1b[0m    \x1b[91m14892\x1b[0m`,
          highlight: "2,341 TX errors and 14,892 dropped packets. The outbound link is failing — packets are being lost and retransmitted.",
          status: "critical",
        },
      },
    },
  ];

  const containerRef = useRef(null);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [investigated, setInvestigated] = useState(new Set());
  const [expandedResource, setExpandedResource] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [scenarioResults, setScenarioResults] = useState({}); // { idx: "correct" | "wrong" }

  // ── Guided instruction system ──
  // Steps: 0=intro banner, 1=click-first-resource hint, 2=read-output hint, 3=diagnose hint, 4=done (hidden)
  const [guideStep, setGuideStep] = useState(0);
  const [guideDismissed, setGuideDismissed] = useState(false);

  // Auto-advance guide based on user actions
  const guideVisible = !guideDismissed && guideStep < 4;
  const advanceGuide = (toStep) => {
    if (toStep > guideStep) setGuideStep(toStep);
  };

  const restartGuide = () => {
    setGuideStep(0);
    setGuideDismissed(false);
  };

  const s = scenarios[scenarioIdx];
  const allInvestigated = investigated.size === 4;
  const resourceOrder = ["CPU", "RAM", "Storage", "Network"];
  const resourceColors = { CPU: "#FF6B6B", RAM: "#FFA832", Storage: "#50C8FF", Network: "#7AE87A" };
  const statusColors = { critical: "#FF4444", warning: "#DDAA22", healthy: "#4A9A5A" };
  const statusLabels = { critical: "CRITICAL", warning: "WARNING", healthy: "OK" };

  const scrollToContainer = () => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const investigate = (name) => {
    const wasExpanded = expandedResource === name;
    const wasNew = !investigated.has(name);
    // If collapsing, just collapse
    if (wasExpanded) {
      setExpandedResource(null);
      return;
    }
    // If expanding: first close any open panel, mark investigated, then expand
    setExpandedResource(null);
    setInvestigated(prev => new Set([...prev, name]));
    // Delay expansion so the layout settles before the panel opens
    requestAnimationFrame(() => {
      setExpandedResource(name);
      // After expansion renders, scroll panel into view and advance guide
      requestAnimationFrame(() => {
        const panel = document.getElementById(`ri-panel-${name}`);
        if (panel) panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
        // Delay guide hint swap until after scroll starts — avoids layout shift
        // from hint unmount/mount coinciding with panel expansion
        if (wasNew && guideStep <= 1) {
          setTimeout(() => advanceGuide(2), 350);
        }
      });
    });
  };

  const jumpTo = (idx) => {
    setScenarioIdx(idx);
    setInvestigated(new Set());
    setExpandedResource(null);
    setDiagnosis(null);
    setChecked(false);
    // Scroll back to top of component
    requestAnimationFrame(() => scrollToContainer());
  };

  const check = () => {
    setChecked(true);
    setTotal(t => t + 1);
    const correct = diagnosis === s.answer;
    if (correct) setScore(sc => sc + 1);
    setScenarioResults(prev => ({ ...prev, [scenarioIdx]: correct ? "correct" : "wrong" }));
    // Guide complete after first diagnosis attempt
    advanceGuide(4);
  };

  const next = () => {
    if (scenarioIdx < scenarios.length - 1) {
      jumpTo(scenarioIdx + 1);
    } else {
      if (onComplete) onComplete();
    }
  };

  // Strip ANSI-like markers for display styling
  const renderOutput = (text) => {
    const parts = text.split(/\x1b\[91m|\x1b\[0m/);
    let inRed = false;
    return parts.map((part, i) => {
      const el = <span key={i} style={{ color: inRed ? "#FF5555" : "#A0B0C0", fontWeight: inRed ? 700 : 400 }}>{part}</span>;
      inRed = !inRed;
      return el;
    });
  };

  return (
    <div ref={containerRef} style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10, padding: 20, margin: "14px 0",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#AAB4BE", fontWeight: 700, fontSize: 10, letterSpacing: "0.5px" }}>
            ▸ RESOURCE INVESTIGATION
          </span>
          <button
            onClick={restartGuide}
            title="Show instructions"
            style={{
              width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(80,200,255,0.1)", border: "1px solid rgba(80,200,255,0.25)", color: "#50C8FF",
              fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
            }}
          >?</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {total > 0 && <span style={{ color: "#7AE87A", fontSize: 10, fontWeight: 600 }}>{score}/{total}</span>}
          <span style={{ color: "var(--color-v2-text-muted)", fontSize: 10 }}>{investigated.size}/4 checked</span>
          <button onClick={() => { jumpTo(0); setScore(0); setTotal(0); setScenarioResults({}); }} style={{
            padding: "3px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer",
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-v2-text-muted)",
          }}>↻ Reset</button>
        </div>
      </div>

      {/* ── Guide: Step 0 — Intro banner ── */}
      {guideVisible && guideStep === 0 && (
        <div style={{
          padding: "12px 16px", borderRadius: 8, marginBottom: 14,
          background: "rgba(80,200,255,0.06)", border: "1px solid rgba(80,200,255,0.2)",
          display: "flex", alignItems: "flex-start", gap: 12,
        }}>
          <span style={{ fontSize: 13, flexShrink: 0 }}>🔍</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#50C8FF", fontWeight: 700, fontSize: 10, marginBottom: 4 }}>How this works</div>
            <div style={{ color: "#C8CCD0", fontSize: 10, lineHeight: 1.5 }}>
              You're an ops engineer responding to a server incident. Click each resource panel below to run a diagnostic command and see the output.
              Look for <span style={{ color: "#FF5555", fontWeight: 600 }}>red/highlighted values</span> — they indicate trouble.
              After checking all 4 resources, pick which one is the bottleneck.
            </div>
            <button onClick={() => advanceGuide(1)} style={{
              marginTop: 8, padding: "5px 14px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer",
              background: "rgba(80,200,255,0.15)", border: "1px solid rgba(80,200,255,0.35)", color: "#50C8FF",
            }}>Got it</button>
          </div>
          <button onClick={() => setGuideDismissed(true)} style={{
            background: "none", border: "none", color: "var(--color-v2-text-muted)", cursor: "pointer", fontSize: 11, padding: 2, flexShrink: 0,
          }}>✕</button>
        </div>
      )}

      {/* Scenario Selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {scenarios.map((sc, i) => {
          const result = scenarioResults[i];
          const isActive = scenarioIdx === i;
          const bgColor = result === "correct" ? "rgba(122,232,122,0.15)"
            : result === "wrong" ? "rgba(255,107,107,0.15)"
            : isActive ? "rgba(80,200,255,0.15)" : "rgba(255,255,255,0.04)";
          const borderColor = result === "correct" ? "rgba(122,232,122,0.5)"
            : result === "wrong" ? "rgba(255,107,107,0.5)"
            : isActive ? "rgba(80,200,255,0.5)" : "rgba(255,255,255,0.1)";
          const textColor = result === "correct" ? "#7AE87A"
            : result === "wrong" ? "#FF6B6B"
            : isActive ? "#50C8FF" : "var(--color-v2-text-muted)";
          const icon = result === "correct" ? "✓" : result === "wrong" ? "✗" : String(i + 1);
          return (
            <button key={i} onClick={() => jumpTo(i)} style={{
              width: 40, height: 40, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
              background: bgColor, border: `1.5px solid ${borderColor}`,
              color: textColor, fontWeight: 800, fontSize: 11, cursor: "pointer",
              transition: "all 0.2s",
            }}>{icon}</button>
          );
        })}
      </div>

      {/* Scenario Prompt */}
      <div style={{
        padding: "12px 16px", borderRadius: 8, marginBottom: 16,
        background: "rgba(255,168,50,0.06)", border: "1px solid rgba(255,168,50,0.2)",
      }}>
        <span style={{ color: "#FFA832", fontWeight: 700, fontSize: 10 }}>INCIDENT: </span>
        <span style={{ color: "#E0D8CF", fontSize: 11 }}>{s.prompt}</span>
      </div>

      {/* ── Guide: Step 1 — Click first resource hint ── */}
      {guideVisible && guideStep === 1 && investigated.size === 0 && (
        <div style={{
          padding: "8px 14px", borderRadius: 6, marginBottom: 10,
          background: "rgba(80,200,255,0.05)", border: "1px dashed rgba(80,200,255,0.25)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ color: "#50C8FF", fontSize: 11 }}>↓</span>
          <span style={{ color: "#50C8FF", fontSize: 10, fontWeight: 600 }}>
            Click any resource panel below to run its diagnostic command
          </span>
        </div>
      )}

      {/* Resource Panels */}
      <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        {resourceOrder.map((name, ri) => {
          const r = s.resources[name];
          const isInvestigated = investigated.has(name);
          const isExpanded = expandedResource === name;
          // Pulse the first panel when guide is on step 1 and nothing investigated yet
          const shouldPulse = guideVisible && guideStep === 1 && investigated.size === 0 && ri === 0;
          const color = resourceColors[name];

          return (
            <div key={name} id={`ri-panel-${name}`} style={{
              borderRadius: 8, overflow: "hidden",
              border: `1px solid ${shouldPulse ? "rgba(80,200,255,0.5)" : isInvestigated ? (r.status === "critical" ? "rgba(255,68,68,0.3)" : r.status === "warning" ? "rgba(221,170,34,0.3)" : "rgba(74,154,90,0.25)") : "rgba(255,255,255,0.08)"}`,
              background: shouldPulse ? "rgba(80,200,255,0.04)" : isExpanded ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.2)",
              transition: "all 0.25s",
              boxShadow: shouldPulse ? "0 0 12px rgba(80,200,255,0.15)" : "none",
              animation: shouldPulse ? "resourcePulse 2s ease-in-out infinite" : "none",
            }}>
              {/* Header */}
              <div
                role="button" tabIndex={0}
                onClick={() => investigate(name)}
                onKeyDown={onActivate(() => investigate(name))}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer",
                }}
              >
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: isInvestigated ? statusColors[r.status] : "rgba(255,255,255,0.1)",
                  boxShadow: isInvestigated && r.status === "critical" ? `0 0 8px ${statusColors[r.status]}88` : "none",
                  transition: "all 0.3s",
                }} />
                <span style={{ color, fontWeight: 700, fontSize: 11, minWidth: 70 }}>{name}</span>

                {/* Command badge — always visible, dims after investigation */}
                <span style={{
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 10,
                  color: isInvestigated ? "var(--color-v2-text-muted)" : "#50C8FF",
                  background: isInvestigated ? "rgba(255,255,255,0.02)" : "rgba(80,200,255,0.08)",
                  padding: "3px 10px", borderRadius: 4,
                  border: `1px solid ${isInvestigated ? "rgba(255,255,255,0.05)" : "rgba(80,200,255,0.2)"}`,
                  transition: "all 0.3s",
                }}>
                  $ {r.cmd}
                </span>

                {/* Status badge — always reserve space to prevent reflow */}
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                  background: isInvestigated ? `${statusColors[r.status]}22` : "transparent",
                  color: isInvestigated ? statusColors[r.status] : "transparent",
                  minWidth: 60, textAlign: "center",
                  transition: "all 0.3s",
                }}>{isInvestigated ? statusLabels[r.status] : "—"}</span>

                {/* Right side — CTA or toggle arrow */}
                <span style={{
                  color: isInvestigated ? "var(--color-v2-text-muted)" : "#50C8FF", fontSize: 10, fontWeight: 600, marginLeft: "auto",
                  transition: "transform 0.2s, color 0.3s",
                  transform: isExpanded ? "rotate(90deg)" : "none",
                }}>{isInvestigated ? "▸" : "Click to run ▸"}</span>
              </div>

              {/* Expanded Terminal Output */}
              {isExpanded && isInvestigated && (
                <div style={{ padding: "0 16px 14px" }}>
                  <div style={{
                    background: "rgba(0,0,0,0.5)", borderRadius: 6, padding: "4px 0", overflow: "hidden",
                    border: "1px solid rgba(80,200,255,0.08)",
                  }}>
                    {/* Terminal title bar */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF5F57" }} />
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FEBC2E" }} />
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#28C840" }} />
                      <span style={{ fontFamily: "monospace", fontSize: 10, color: "var(--color-v2-text-muted)", marginLeft: 8 }}>ops@srv-{String(scenarioIdx + 1).padStart(2, "0")}:~$</span>
                      <span style={{ fontFamily: "monospace", fontSize: 10, color: "#50C8FF" }}> {r.cmd}</span>
                    </div>
                    {/* Output */}
                    <pre style={{
                      margin: 0, padding: "10px 14px",
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      fontSize: 10, lineHeight: 1.5, overflowX: "auto",
                      color: "#A0B0C0", whiteSpace: "pre",
                    }}>
                      {renderOutput(r.output)}
                    </pre>
                  </div>
                  {/* Annotation */}
                  <div style={{
                    marginTop: 8, padding: "8px 12px", borderRadius: 6,
                    background: `${statusColors[r.status]}11`,
                    borderLeft: `3px solid ${statusColors[r.status]}`,
                  }}>
                    <span style={{ color: statusColors[r.status], fontWeight: 700, fontSize: 10 }}>
                      {r.status === "critical" ? "⚠ " : r.status === "warning" ? "△ " : "✓ "}
                    </span>
                    <span style={{ color: "#C8CCD0", fontSize: 10 }}>{r.highlight}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Guide: Step 2 — Read the output hint ── */}
      {guideVisible && guideStep === 2 && investigated.size >= 1 && investigated.size < 4 && (
        <div style={{
          padding: "8px 14px", borderRadius: 6, marginBottom: 10,
          background: "rgba(80,200,255,0.04)", border: "1px solid rgba(80,200,255,0.15)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ color: "#50C8FF", fontSize: 10 }}>💡</span>
          <span style={{ color: "#AAB4BE", fontSize: 10 }}>
            Look for <span style={{ color: "#FF5555", fontWeight: 600 }}>red highlighted values</span> in the output — they point to the problem.
            Keep checking all 4 resources to compare.
          </span>
        </div>
      )}

      {/* ── Guide: Step 3 — Time to diagnose hint ── */}
      {guideVisible && guideStep >= 2 && allInvestigated && !checked && (
        <div style={{
          padding: "8px 14px", borderRadius: 6, marginBottom: 10,
          background: "rgba(122,232,122,0.05)", border: "1px solid rgba(122,232,122,0.2)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ color: "#7AE87A", fontSize: 10 }}>✓</span>
          <span style={{ color: "#AAB4BE", fontSize: 10 }}>
            All resources checked. Now pick which one is the bottleneck from the dropdown below.
            Which resource had <span style={{ color: "#FF5555", fontWeight: 600 }}>CRITICAL</span> status?
          </span>
        </div>
      )}

      {/* Diagnosis */}
      {!checked && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {!allInvestigated && (
            <span style={{ color: "var(--color-v2-text-muted)", fontSize: 10, fontStyle: "italic" }}>Investigate all 4 resources before diagnosing...</span>
          )}
          {allInvestigated && (
            <>
              <span style={{ color: "#AAB4BE", fontSize: 10, fontWeight: 600 }}>Diagnosis:</span>
              <select aria-label="Which resource is the problem?"
                value={diagnosis || ""}
                onChange={(e) => setDiagnosis(e.target.value)}
                style={{
                  padding: "8px 14px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(80,200,255,0.3)",
                  borderRadius: 6, color: "#E8ECF0", fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                <option value="" disabled>Select the bottleneck...</option>
                {resourceOrder.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <button onClick={check} disabled={!diagnosis} style={{
                padding: "8px 22px", background: diagnosis ? "#50C8FF" : "rgba(80,200,255,0.15)",
                border: "none", borderRadius: 6, color: diagnosis ? "#1A1A2E" : "var(--color-v2-text-muted)",
                fontWeight: 700, fontSize: 11, cursor: diagnosis ? "pointer" : "not-allowed",
              }}>Diagnose</button>
            </>
          )}
        </div>
      )}
      {checked && (
        <div style={{ marginTop: 4 }}>
          <div style={{
            padding: 14, borderRadius: 6, marginBottom: 12,
            background: diagnosis === s.answer ? "rgba(122,232,122,0.08)" : "rgba(255,107,107,0.08)",
            border: `1px solid ${diagnosis === s.answer ? "rgba(122,232,122,0.3)" : "rgba(255,107,107,0.3)"}`,
          }}>
            <span style={{ color: diagnosis === s.answer ? "#7AE87A" : "#FF6B6B", fontWeight: 700 }}>
              {diagnosis === s.answer ? "✓ Correct diagnosis!" : `✗ The bottleneck is ${s.answer}, not ${diagnosis}.`}
            </span>
            <p style={{ color: "#C8CCD0", margin: "8px 0 0 0", fontSize: 11, lineHeight: 1.6 }}>{s.explanation}</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {scenarioIdx < scenarios.length - 1 && (
              <button onClick={() => jumpTo(scenarioIdx + 1)} style={{
                padding: "8px 22px", background: "#50C8FF", border: "none", borderRadius: 6,
                color: "#1A1A2E", fontWeight: 700, fontSize: 11, cursor: "pointer",
              }}>Next Scenario →</button>
            )}
            <button onClick={() => jumpTo(scenarioIdx)} style={{
              padding: "8px 22px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 6, color: "#AAB4BE", fontWeight: 600, fontSize: 11, cursor: "pointer",
            }}>Retry This Scenario</button>
            {Object.keys(scenarioResults).length === scenarios.length && (
              <button onClick={() => { setScenarioResults({}); setScore(0); setTotal(0); jumpTo(0); }} style={{
                padding: "8px 22px", background: "rgba(255,168,50,0.12)", border: "1px solid rgba(255,168,50,0.35)",
                borderRadius: 6, color: "#FFA832", fontWeight: 700, fontSize: 11, cursor: "pointer",
              }}>Reset All</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── INTERACTIVE: PATH RESOLVER ─────────────────────────────────────────────
function PathResolver({ onComplete }) {
  const challenges = [
    { cwd: "/home/alice/scripts", path: "../../bob/notes.txt", steps: ["/home/alice", "/home", "/home/bob", "/home/bob/notes.txt"] },
    { cwd: "/var/log", path: "../../etc", steps: ["/var", "/", "/etc"] },
    { cwd: "/home/ops", path: "../alice/scripts/../docs/readme.md", steps: ["/home", "/home/alice", "/home/alice/scripts", "/home/alice", "/home/alice/docs", "/home/alice/docs/readme.md"] },
  ];
  const [chIdx, setChIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);

  const ch = challenges[chIdx];
  const finalPath = ch.steps[ch.steps.length - 1];

  const handleCheck = () => {
    setRevealed(true);
    if (chIdx === challenges.length - 1 && onComplete) onComplete();
  };

  const next = () => {
    if (chIdx < challenges.length - 1) {
      setChIdx(i => i + 1);
      setUserAnswer("");
      setRevealed(false);
    }
  };

  const isCorrect = userAnswer.trim().replace(/\/+$/, "") === finalPath;

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10, padding: 20, margin: "14px 0",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ color: "#AAB4BE", fontWeight: 700, fontSize: 10, letterSpacing: "0.5px" }}>
          ▸ PATH RESOLVER — Challenge {chIdx + 1}/{challenges.length}
        </div>
        <button onClick={() => { setChIdx(0); setUserAnswer(""); setRevealed(false); }} style={{
          padding: "3px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer",
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-v2-text-muted)",
        }}>↻ Reset</button>
      </div>
      <p style={{ color: "#C8CCD0", margin: "0 0 6px 0", fontSize: 11 }}>
        You are in <Code>{ch.cwd}</Code>. Where does <Code>{ch.path}</Code> resolve to?
      </p>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
        <input aria-label="Type the absolute path"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Type the absolute path..."
          disabled={revealed}
          style={{
            flex: 1, minWidth: 200, padding: "10px 14px", background: "rgba(0,0,0,0.3)",
            border: `1px solid ${revealed ? (isCorrect ? "rgba(122,232,122,0.4)" : "rgba(255,107,107,0.4)") : "rgba(80,200,255,0.2)"}`,
            borderRadius: 6, color: "#E8E8F0", fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
          }}
          onKeyDown={(e) => e.key === "Enter" && !revealed && handleCheck()}
        />
        {!revealed && (
          <button onClick={handleCheck} disabled={!userAnswer.trim()} style={{
            padding: "10px 20px", background: userAnswer.trim() ? "#50C8FF" : "rgba(80,200,255,0.15)",
            border: "none", borderRadius: 6, color: userAnswer.trim() ? "#1A1A2E" : "var(--color-v2-text-muted)",
            fontWeight: 700, fontSize: 11, cursor: userAnswer.trim() ? "pointer" : "not-allowed",
          }}>Resolve</button>
        )}
      </div>
      {revealed && (
        <div style={{ marginTop: 14 }}>
          <div style={{
            color: isCorrect ? "#7AE87A" : "#FF6B6B", fontWeight: 700, fontSize: 11, marginBottom: 8,
          }}>
            {isCorrect ? "✓ Correct!" : `✗ The answer is ${finalPath}`}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4, fontSize: 11 }}>
            <span style={{ color: "var(--color-v2-text-muted)" }}>Step by step:</span>
            <Code>{ch.cwd}</Code>
            {ch.steps.map((step, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: "var(--color-v2-text-muted)" }}>→</span>
                <Code>{step}</Code>
              </span>
            ))}
          </div>
          {chIdx < challenges.length - 1 && (
            <button onClick={next} style={{
              marginTop: 12, padding: "8px 22px", background: "#50C8FF", border: "none", borderRadius: 6,
              color: "#1A1A2E", fontWeight: 700, fontSize: 11, cursor: "pointer",
            }}>Next Challenge →</button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── INTERACTIVE: OCTAL VALUE FLIP CARDS ────────────────────────────────────
function OctalFlipCards() {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const allRevealed = revealed[0] && revealed[1] && revealed[2];

  const cards = [
    { perm: "Read", letter: "r", value: "4" },
    { perm: "Write", letter: "w", value: "2" },
    { perm: "Execute", letter: "x", value: "1" },
  ];

  return (
    <div style={{ margin: "12px 0 20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {cards.map((card, i) => {
          const isRevealed = !!revealed[i];
          return (
            <button
              key={i}
              type="button"
              onClick={() => setRevealed((prev) => ({ ...prev, [i]: true }))}
              style={{
                padding: "14px 16px", borderRadius: 8, textAlign: "center",
                cursor: isRevealed ? "default" : "pointer",
                background: isRevealed ? "rgba(80,200,255,0.06)" : "rgba(80,200,255,0.02)",
                border: isRevealed ? "1px solid rgba(80,200,255,0.25)" : "1px solid rgba(80,200,255,0.12)",
                transition: "all 0.3s ease",
                transform: isRevealed ? "none" : "none",
              }}
            >
              <div style={{ color: "#50C8FF", fontWeight: 700, fontSize: 11, marginBottom: 6 }}>
                {card.perm} ({card.letter})
              </div>
              {isRevealed ? (
                <div style={{
                  color: "#E8ECF0", fontSize: 18, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                  animation: "fadeInUp 0.3s ease-out",
                }}>
                  {card.value}
                </div>
              ) : (
                <div style={{
                  color: "#50C8FF", fontSize: 11, opacity: 0.85,
                  fontFamily: "'Chakra Petch', sans-serif", letterSpacing: "0.5px",
                }}>
                  tap to reveal
                </div>
              )}
            </button>
          );
        })}
      </div>
      {allRevealed && (
        <div style={{
          marginTop: 10, padding: "8px 14px", borderRadius: 6,
          background: "rgba(122,232,122,0.06)", border: "1px solid rgba(122,232,122,0.15)",
          color: "#7AE87A", fontSize: 10, fontWeight: 600, textAlign: "center",
          animation: "fadeInUp 0.3s ease-out",
        }}>
          r + w + x = 4 + 2 + 1 = 7 (full access)
        </div>
      )}
      {(revealed[0] || revealed[1] || revealed[2]) && (
        <div style={{ marginTop: 10, textAlign: "center" }}>
          <button
            onClick={() => setRevealed({})}
            style={{
              padding: "6px 14px", background: "transparent",
              border: "1px solid rgba(80,200,255,0.35)", borderRadius: 6,
              color: "#9CD8FF", fontWeight: 600, fontSize: 10, cursor: "pointer",
            }}
          >↻ Reset</button>
        </div>
      )}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── INTERACTIVE: PERMISSION BUILDER ────────────────────────────────────────
function PermissionBuilder({ onComplete }) {
  const [mode, setMode] = useState("decode"); // decode | encode | octal
  const [bits, setBits] = useState([true, true, true, true, false, true, true, false, false]);
  const [challenge, setChallenge] = useState<{ desc: string; answer: string } | null>(null);
  const [userInput, setUserInput] = useState("");
  const [checked, setChecked] = useState(false);

  const encodeProblems = [
    { desc: "Owner can read and write. Group can read only. Others have no access.", answer: "rw-r-----" },
    { desc: "Owner has full access. Group can read and execute. Others can read and execute.", answer: "rwxr-xr-x" },
    { desc: "Owner can read and execute. Nobody else has any access.", answer: "r-x------" },
  ];

  const octalProblems = [
    { desc: "rwxr-xr-x", answer: "755" },
    { desc: "rw-r--r--", answer: "644" },
    { desc: "rwx------", answer: "700" },
    { desc: "rw-------", answer: "600" },
    { desc: "rwxr-x---", answer: "750" },
    { desc: "r--r--r--", answer: "444" },
    { desc: "rwxrwxr-x", answer: "775" },
    { desc: "rw-rw----", answer: "660" },
  ];

  useEffect(() => {
    if (mode === "encode") {
      setChallenge(encodeProblems[Math.floor(Math.random() * encodeProblems.length)]);
      setUserInput("");
      setChecked(false);
    } else if (mode === "octal") {
      setChallenge(octalProblems[Math.floor(Math.random() * octalProblems.length)]);
      setUserInput("");
      setChecked(false);
    }
  }, [mode]);

  const labels = ["Owner", "Group", "Others"];
  const groupColors = ["#FF6B6B", "#FFA832", "#7AE87A"];

  // Compute octal digit for a group of 3 bits
  const octalDigit = (start: number) =>
    (bits[start] ? 4 : 0) + (bits[start + 1] ? 2 : 0) + (bits[start + 2] ? 1 : 0);
  const octalStr = `${octalDigit(0)}${octalDigit(3)}${octalDigit(6)}`;

  const describe = (start: number) => {
    const perms: string[] = [];
    if (bits[start]) perms.push("read");
    if (bits[start + 1]) perms.push("write");
    if (bits[start + 2]) perms.push("execute");
    return perms.length > 0 ? perms.join(", ") : "no access";
  };

  const checkAnswer = () => {
    setChecked(true);
    if (onComplete) onComplete();
  };

  const nextOctalChallenge = () => {
    setChallenge(octalProblems[Math.floor(Math.random() * octalProblems.length)]);
    setUserInput("");
    setChecked(false);
  };

  const modeLabels: Record<string, string> = {
    decode: "Decode",
    encode: "String",
    octal: "Octal",
  };

  const inputLength = mode === "octal" ? 3 : 9;
  const placeholder = mode === "octal" ? "755" : "rwx------";

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10, padding: 20, margin: "14px 0",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div style={{ color: "#AAB4BE", fontWeight: 700, fontSize: 10, letterSpacing: "0.5px" }}>
          ▸ PERMISSION LAB
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
          {(["decode", "encode", "octal"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: "4px 14px", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer",
              background: mode === m ? "rgba(80,200,255,0.15)" : "rgba(255,255,255,0.04)",
              border: mode === m ? "1px solid rgba(80,200,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
              color: mode === m ? "#50C8FF" : "var(--color-v2-text-muted)",
            }}>{modeLabels[m]}</button>
          ))}
          <button onClick={() => { setBits([true, true, true, true, false, true, true, false, false]); setUserInput(""); setChecked(false); }} style={{
            padding: "3px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer",
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-v2-text-muted)", marginLeft: 4,
          }}>↻ Reset</button>
        </div>
      </div>

      {/* ── DECODE MODE: toggle bits, see English + live octal ── */}
      {mode === "decode" && (
        <>
          <p style={{ color: "var(--color-v2-text-muted)", fontSize: 11, margin: "0 0 12px 0" }}>Toggle permission bits and see the meaning and octal value update in real time.</p>
          <div style={{
            background: "rgba(0,0,0,0.4)", borderRadius: 8, padding: 16,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 15, textAlign: "center",
            border: "1px solid rgba(80,200,255,0.1)", marginBottom: 14,
          }}>
            {/* rwx string display */}
            <div>
              {bits.map((b, i) => (
                <span
                  key={i}
                  role="button" tabIndex={0} aria-pressed={b}
                  aria-label={`${["owner", "group", "others"][Math.floor(i / 3)]} ${["read", "write", "execute"][i % 3]}`}
                  onClick={() => { const n = [...bits]; n[i] = !n[i]; setBits(n); }}
                  onKeyDown={onActivate(() => { const n = [...bits]; n[i] = !n[i]; setBits(n); })}
                  style={{
                    color: b ? groupColors[Math.floor(i / 3)] : "var(--color-v2-text-muted)",
                    cursor: "pointer", padding: "2px 1px",
                    borderBottom: `2px solid ${b ? groupColors[Math.floor(i / 3)] : "transparent"}`,
                    transition: "all 0.15s",
                  }}
                >{"rwx"[i % 3] === "r" && b ? "r" : "rwx"[i % 3] === "w" && b ? "w" : "rwx"[i % 3] === "x" && b ? "x" : "-"}</span>
              ))}
            </div>
            {/* Live octal readout */}
            <div style={{ marginTop: 8, fontSize: 11, color: "var(--color-v2-text-muted)" }}>
              <span style={{ color: "var(--color-v2-text-muted)", marginRight: 6 }}>chmod</span>
              {[0, 1, 2].map((gi) => (
                <span key={gi} style={{
                  color: groupColors[gi], fontWeight: 700, fontSize: 13,
                  transition: "all 0.15s",
                }}>
                  {octalDigit(gi * 3)}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {labels.map((label, li) => (
              <div key={label} style={{
                padding: 12, borderRadius: 6, background: "rgba(0,0,0,0.2)",
                border: `1px solid ${groupColors[li]}33`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ color: groupColors[li], fontWeight: 700, fontSize: 10 }}>{label}</span>
                  <span style={{ color: groupColors[li], fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, opacity: 0.9 }}>{octalDigit(li * 3)}</span>
                </div>
                <div style={{ color: "#C8CCD0", fontSize: 10 }}>
                  {bits[li * 3] ? "4" : "0"} + {bits[li * 3 + 1] ? "2" : "0"} + {bits[li * 3 + 2] ? "1" : "0"} = {octalDigit(li * 3)}
                </div>
                <div style={{ color: "var(--color-v2-text-muted)", fontSize: 10, marginTop: 2 }}>Can {describe(li * 3)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── ENCODE MODE: English → rwx string ── */}
      {mode === "encode" && challenge && (
        <>
          <p style={{ color: "var(--color-v2-text-muted)", fontSize: 11, margin: "0 0 6px 0" }}>Write the 9-character permission string for this description:</p>
          <p style={{ color: "#E8ECF0", fontSize: 11, margin: "0 0 14px 0", lineHeight: 1.6 }}>{challenge.desc}</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input aria-label="Your answer"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={placeholder}
              maxLength={inputLength}
              disabled={checked}
              style={{
                padding: "10px 14px", background: "rgba(0,0,0,0.3)",
                border: `1px solid ${checked ? (userInput === challenge.answer ? "rgba(122,232,122,0.4)" : "rgba(255,107,107,0.4)") : "rgba(80,200,255,0.2)"}`,
                borderRadius: 6, color: "#E8E8F0", fontSize: 13, width: 140,
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2, textAlign: "center",
              }}
              onKeyDown={(e) => e.key === "Enter" && !checked && userInput.length === inputLength && checkAnswer()}
            />
            {!checked && (
              <button onClick={checkAnswer} disabled={userInput.length !== inputLength} style={{
                padding: "10px 20px", background: userInput.length === inputLength ? "#50C8FF" : "rgba(80,200,255,0.15)",
                border: "none", borderRadius: 6, color: userInput.length === inputLength ? "#1A1A2E" : "var(--color-v2-text-muted)",
                fontWeight: 700, fontSize: 11, cursor: userInput.length === inputLength ? "pointer" : "not-allowed",
              }}>Check</button>
            )}
          </div>
          {checked && (
            <div style={{ marginTop: 10, color: userInput === challenge.answer ? "#7AE87A" : "#FF6B6B", fontWeight: 600, fontSize: 11 }}>
              {userInput === challenge.answer ? "✓ Perfect!" : `✗ Correct answer: ${challenge.answer}`}
            </div>
          )}
        </>
      )}

      {/* ── OCTAL MODE: rwx string → 3-digit octal ── */}
      {mode === "octal" && challenge && (
        <>
          <p style={{ color: "var(--color-v2-text-muted)", fontSize: 11, margin: "0 0 6px 0" }}>Convert this permission string to its 3-digit octal number:</p>
          <div style={{
            background: "rgba(0,0,0,0.4)", borderRadius: 8, padding: "12px 20px", marginBottom: 14,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 16, textAlign: "center",
            border: "1px solid rgba(80,200,255,0.1)",
          }}>
            {challenge.desc.split("").map((ch, i) => (
              <span key={i} style={{
                color: ch === "-" ? "var(--color-v2-text-muted)" : groupColors[Math.floor(i / 3)],
                padding: "0 1px",
              }}>{ch}</span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: "var(--color-v2-text-muted)", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>chmod</span>
              <input aria-label="Octal permissions, three digits"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value.replace(/[^0-7]/g, ""))}
                placeholder="755"
                maxLength={3}
                disabled={checked}
                style={{
                  padding: "10px 14px", background: "rgba(0,0,0,0.3)",
                  border: `1px solid ${checked ? (userInput === challenge.answer ? "rgba(122,232,122,0.4)" : "rgba(255,107,107,0.4)") : "rgba(80,200,255,0.2)"}`,
                  borderRadius: 6, color: "#E8E8F0", fontSize: 15, width: 80,
                  fontFamily: "'JetBrains Mono', monospace", letterSpacing: 4, textAlign: "center",
                }}
                onKeyDown={(e) => e.key === "Enter" && !checked && userInput.length === 3 && checkAnswer()}
              />
            </div>
            {!checked && (
              <button onClick={checkAnswer} disabled={userInput.length !== 3} style={{
                padding: "10px 20px", background: userInput.length === 3 ? "#50C8FF" : "rgba(80,200,255,0.15)",
                border: "none", borderRadius: 6, color: userInput.length === 3 ? "#1A1A2E" : "var(--color-v2-text-muted)",
                fontWeight: 700, fontSize: 11, cursor: userInput.length === 3 ? "pointer" : "not-allowed",
              }}>Check</button>
            )}
            {checked && (
              <button onClick={nextOctalChallenge} style={{
                padding: "10px 20px", background: "rgba(80,200,255,0.1)",
                border: "1px solid rgba(80,200,255,0.3)", borderRadius: 6, color: "#50C8FF",
                fontWeight: 700, fontSize: 11, cursor: "pointer",
              }}>Next →</button>
            )}
          </div>
          {checked && (
            <div style={{ marginTop: 10 }}>
              <div style={{ color: userInput === challenge.answer ? "#7AE87A" : "#FF6B6B", fontWeight: 600, fontSize: 11 }}>
                {userInput === challenge.answer ? "✓ Perfect!" : `✗ Correct answer: ${challenge.answer}`}
              </div>
              {/* Show the breakdown */}
              <div style={{
                marginTop: 8, padding: "10px 14px", borderRadius: 6,
                background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)",
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#C8CCD0",
              }}>
                {[0, 1, 2].map((gi) => {
                  const g = challenge.desc.slice(gi * 3, gi * 3 + 3);
                  const r = g[0] === "r" ? 4 : 0;
                  const w = g[1] === "w" ? 2 : 0;
                  const x = g[2] === "x" ? 1 : 0;
                  return (
                    <div key={gi}>
                      <span style={{ color: groupColors[gi], fontWeight: 700 }}>{labels[gi]}:</span>{" "}
                      {g} = {r} + {w} + {x} = <strong style={{ color: "#E8ECF0" }}>{r + w + x}</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── INTERACTIVE: PROCESS SIGNAL SIMULATOR ──────────────────────────────────
function SignalSimulator({ onComplete }) {
  const [process, setProcess] = useState({ name: "PostgreSQL", state: "running", writing: true });
  const [signal, setSignal] = useState(null);
  const [result, setResult] = useState(null);

  const sendSignal = (sig) => {
    setSignal(sig);
    if (sig === "SIGTERM") {
      setResult({
        outcome: "graceful",
        text: "Process received SIGTERM. PostgreSQL finishes the current write transaction, flushes buffers to disk, closes all client connections cleanly, writes a shutdown record to the log, and exits with code 0. Data is safe.",
      });
    } else {
      setResult({
        outcome: "forced",
        text: "Process received SIGKILL. PostgreSQL is terminated immediately by the kernel — mid-write. The transaction is incomplete. On restart, PostgreSQL must run crash recovery to repair potentially corrupted data files. Client connections are dropped without notification.",
      });
    }
    if (onComplete) onComplete();
  };

  const reset = () => { setSignal(null); setResult(null); };

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10, padding: 20, margin: "14px 0",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ color: "#AAB4BE", fontWeight: 700, fontSize: 10, letterSpacing: "0.5px" }}>
          ▸ SIGNAL SIMULATOR — Send a signal to a running database process
        </div>
        {signal && <button onClick={() => { setSignal(null); setResult(null); }} style={{
          padding: "3px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer",
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-v2-text-muted)",
        }}>↻ Reset</button>}
      </div>
      <div style={{
        background: "rgba(0,0,0,0.4)", borderRadius: 8, padding: 16, marginBottom: 14,
        border: "1px solid rgba(80,200,255,0.1)", display: "flex", alignItems: "center", gap: 14,
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        <span style={{
          width: 10, height: 10, borderRadius: "50%",
          background: !signal ? "#7AE87A" : result?.outcome === "graceful" ? "var(--color-v2-text-muted)" : "#FF4444",
          boxShadow: !signal ? "0 0 8px rgba(122,232,122,0.5)" : "none",
        }} />
        <span style={{ color: "#C8D8E8", fontSize: 11 }}>PID 1842 — postgres</span>
        <span style={{ color: "var(--color-v2-text-muted)", fontSize: 10, marginLeft: "auto" }}>
          {!signal ? "STATE: running — writing transaction" : result?.outcome === "graceful" ? "STATE: exited (0)" : "STATE: killed (9)"}
        </span>
      </div>
      {!signal && (
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => sendSignal("SIGTERM")} style={{
            padding: "10px 24px", background: "rgba(255,168,50,0.15)", border: "1px solid rgba(255,168,50,0.4)",
            borderRadius: 6, color: "#FFA832", fontWeight: 700, fontSize: 11, cursor: "pointer",
          }}>Send SIGTERM (15)</button>
          <button onClick={() => sendSignal("SIGKILL")} style={{
            padding: "10px 24px", background: "rgba(255,68,68,0.15)", border: "1px solid rgba(255,68,68,0.4)",
            borderRadius: 6, color: "#FF4444", fontWeight: 700, fontSize: 11, cursor: "pointer",
          }}>Send SIGKILL (9)</button>
        </div>
      )}
      {result && (
        <div style={{
          padding: 14, borderRadius: 6, marginTop: 4,
          background: result.outcome === "graceful" ? "rgba(122,232,122,0.06)" : "rgba(255,68,68,0.06)",
          border: `1px solid ${result.outcome === "graceful" ? "rgba(122,232,122,0.2)" : "rgba(255,68,68,0.2)"}`,
        }}>
          <p style={{ color: "#C8CCD0", margin: 0, fontSize: 11, lineHeight: 1.6 }}>{result.text}</p>
          <button onClick={reset} style={{
            marginTop: 12, padding: "6px 18px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 6, color: "var(--color-v2-text-muted)", fontWeight: 600, fontSize: 10, cursor: "pointer",
          }}>Try the other signal</button>
        </div>
      )}
    </div>
  );
}

// ─── INTERACTIVE: RACK FAILURE DIAGNOSIS ────────────────────────────────────
function RackDiagnosis({ onComplete }) {
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);

  const components = [
    { id: "tor", name: "ToR Switch", correct: true, explanation: "If the Top-of-Rack switch fails, every server connected to it loses network connectivity simultaneously — they all go unreachable at the same time." },
    { id: "pdu", name: "PDU (Power)", correct: true, explanation: "If the PDU (Power Distribution Unit) fails, every server drawing power from it loses electricity simultaneously — all go dark at once." },
    { id: "server1", name: "Server #3", correct: false, explanation: "A single server failing cannot cause 8 servers to go down simultaneously. Individual failures are independent." },
    { id: "cooling", name: "Cooling System", correct: true, explanation: "If cooling fails for the rack/aisle, all servers will thermal-throttle and potentially emergency shutdown — though this happens over minutes, not instantly." },
  ];

  const check = () => {
    setChecked(true);
    if (onComplete) onComplete();
  };

  const comp = components.find(c => c.id === selected);

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10, padding: 20, margin: "14px 0",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ color: "#AAB4BE", fontWeight: 700, fontSize: 10, letterSpacing: "0.5px" }}>
          ▸ RACK FAILURE DIAGNOSIS
        </div>
        {checked && <button onClick={() => { setSelected(null); setChecked(false); }} style={{
          padding: "3px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer",
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-v2-text-muted)",
        }}>↻ Reset</button>}
      </div>
      <p style={{ color: "#E8ECF0", fontSize: 11, margin: "0 0 16px 0", lineHeight: 1.6 }}>
        A rack of 8 servers goes completely unreachable at the same time. All 8 failing independently at the exact same moment is nearly impossible. <strong>What shared infrastructure component failed?</strong>
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 14 }}>
        {components.map((c) => (
          <button key={c.id} onClick={() => !checked && setSelected(c.id)} style={{
            padding: "12px 16px", borderRadius: 8, textAlign: "left", cursor: checked ? "default" : "pointer",
            background: selected === c.id ? "rgba(80,200,255,0.1)" : "rgba(0,0,0,0.2)",
            border: `1px solid ${selected === c.id ? "rgba(80,200,255,0.4)" : "rgba(255,255,255,0.06)"}`,
            transition: "all 0.2s",
          }}>
            <span style={{ color: selected === c.id ? "#50C8FF" : "#AAB4BE", fontWeight: 600, fontSize: 11 }}>{c.name}</span>
          </button>
        ))}
      </div>
      {!checked && (
        <button onClick={check} disabled={!selected} style={{
          padding: "8px 22px", background: selected ? "#50C8FF" : "rgba(80,200,255,0.15)",
          border: "none", borderRadius: 6, color: selected ? "#1A1A2E" : "var(--color-v2-text-muted)",
          fontWeight: 700, fontSize: 11, cursor: selected ? "pointer" : "not-allowed",
        }}>Diagnose</button>
      )}
      {checked && comp && (
        <div style={{
          padding: 14, borderRadius: 6,
          background: comp.correct ? "rgba(122,232,122,0.06)" : "rgba(255,107,107,0.06)",
          border: `1px solid ${comp.correct ? "rgba(122,232,122,0.2)" : "rgba(255,107,107,0.2)"}`,
        }}>
          <span style={{ color: comp.correct ? "#7AE87A" : "#FF6B6B", fontWeight: 700 }}>
            {comp.correct ? "✓ Correct — shared infrastructure!" : "✗ Not a shared component."}
          </span>
          <p style={{ color: "#C8CCD0", margin: "8px 0 0 0", fontSize: 11, lineHeight: 1.6 }}>{comp.explanation}</p>
          <p style={{ color: "var(--color-v2-text-muted)", margin: "10px 0 0 0", fontSize: 10, fontStyle: "italic" }}>
            The key insight: simultaneous failures point to shared dependencies — ToR switch (network), PDU (power), or cooling. Never to individual server hardware.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── INTERACTIVE: FLASHCARD RAPID FIRE ──────────────────────────────────────
function FlashcardRapidFire() {
  const [cards] = useState(() => [...QUICK_REF].sort(() => Math.random() - 0.5));
  const [idx, setIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [flipped, setFlipped] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const inputRef = useRef(null);

  const flip = () => {
    setFlipped(true);
  };

  const rate = (correct) => {
    if (correct) setScore(s => s + 1);
    if (idx < cards.length - 1) {
      setIdx(i => i + 1);
      setFlipped(false);
      setUserAnswer("");
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <div style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10, padding: 30, margin: "14px 0", textAlign: "center",
      }}>
        <div style={{ fontSize: 24, marginBottom: 10 }}>✦</div>
        <div style={{ color: "#E8ECF0", fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Complete!</div>
        <div style={{ color: "#7AE87A", fontSize: 13, fontWeight: 600 }}>{score}/{cards.length} self-rated correct</div>
        <button onClick={() => { setIdx(0); setFlipped(false); setUserAnswer(""); setScore(0); setDone(false); }} style={{
          marginTop: 16, padding: "10px 28px", background: "#50C8FF", border: "none", borderRadius: 6,
          color: "#1A1A2E", fontWeight: 700, fontSize: 11, cursor: "pointer",
        }}>Shuffle &amp; Retry</button>
      </div>
    );
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10, padding: 20, margin: "14px 0",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ color: "#AAB4BE", fontWeight: 700, fontSize: 10, letterSpacing: "0.5px" }}>
          ▸ RAPID-FIRE FLASHCARDS — {idx + 1}/{cards.length}
        </div>
        <button onClick={() => { setIdx(0); setFlipped(false); setUserAnswer(""); setScore(0); setDone(false); }} style={{
          padding: "3px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer",
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-v2-text-muted)",
        }}>↻ Reset</button>
      </div>
      <div style={{ position: "relative", height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, marginBottom: 16 }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", borderRadius: 3, background: "#50C8FF", width: `${((idx + 1) / cards.length) * 100}%`, transition: "width 0.3s" }} />
      </div>
      <div style={{
        background: "rgba(0,0,0,0.4)", borderRadius: 10, padding: 24,
        border: "1px solid rgba(80,200,255,0.15)", textAlign: "center", minHeight: 120,
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
      }}>
        <div style={{ color: "#50C8FF", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{cards[idx].term}</div>
        <div style={{ color: "var(--color-v2-text-muted)", fontSize: 11, marginBottom: 12 }}>What is this?</div>
        {!flipped ? (
          <>
            <textarea aria-label="Type your definition"
              ref={inputRef}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your definition..."
              style={{
                width: "100%", maxWidth: 500, minHeight: 60, background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(80,200,255,0.15)", borderRadius: 6, padding: 10,
                color: "#E8E8F0", fontSize: 11, fontFamily: "inherit", resize: "vertical",
                textAlign: "center", boxSizing: "border-box",
              }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); flip(); } }}
            />
            <button onClick={flip} style={{
              marginTop: 10, padding: "8px 28px",
              background: "#50C8FF",
              border: "none", borderRadius: 6, color: "#1A1A2E",
              fontWeight: 700, fontSize: 11, cursor: "pointer",
            }}>Flip</button>
          </>
        ) : (
          <>
            <div style={{
              padding: "14px 20px", background: "rgba(80,200,255,0.08)", borderRadius: 8,
              border: "1px solid rgba(80,200,255,0.2)", maxWidth: 500, width: "100%",
            }}>
              <div style={{ color: "#E8ECF0", fontSize: 11, lineHeight: 1.6 }}>{cards[idx].def}</div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button onClick={() => rate(true)} style={{
                padding: "8px 24px", background: "rgba(122,232,122,0.15)", border: "1px solid rgba(122,232,122,0.4)",
                borderRadius: 6, color: "#7AE87A", fontWeight: 700, fontSize: 11, cursor: "pointer",
              }}>Got It ✓</button>
              <button onClick={() => rate(false)} style={{
                padding: "8px 24px", background: "rgba(255,107,107,0.15)", border: "1px solid rgba(255,107,107,0.4)",
                borderRadius: 6, color: "#FF6B6B", fontWeight: 700, fontSize: 11, cursor: "pointer",
              }}>Missed It ✗</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── INTERACTIVE: FILESYSTEM TREE ───────────────────────────────────────────
function FilesystemTree() {
  const tree = {
    name: "/", desc: "Root — the top of the entire filesystem tree", children: [
      { name: "home/", desc: "User home directories — personal files, configs, scripts", children: [
        { name: "alice/", desc: "Home directory for user 'alice'" },
        { name: "bob/", desc: "Home directory for user 'bob'" },
        { name: "ops/", desc: "Home directory for the operations account" },
      ]},
      { name: "var/", desc: "Variable data — things that change during system operation", children: [
        { name: "log/", desc: "System and application logs — the first place to look when troubleshooting" },
        { name: "tmp/", desc: "Temporary files preserved between reboots" },
      ]},
      { name: "etc/", desc: "Configuration files — the settings for every service on the system" },
      { name: "tmp/", desc: "Temporary files — cleared on reboot" },
      { name: "dev/", desc: "Device files — hardware represented as files (disks, GPUs, USB devices)", children: [
        { name: "sda", desc: "A SATA/SAS hard disk device" },
        { name: "nvme0n1", desc: "An NVMe drive (controller 0, namespace 1)" },
        { name: "nvidia0", desc: "A GPU device — used by nvidia-smi and training frameworks" },
      ]},
      { name: "proc/", desc: "Virtual filesystem — kernel and process info generated on the fly, not stored on disk", children: [
        { name: "cpuinfo", desc: "CPU details — read this file to see processor specs" },
        { name: "meminfo", desc: "Memory statistics — current RAM usage and availability" },
      ]},
      { name: "sys/", desc: "Virtual filesystem — hardware and kernel parameter interface", children: [
        { name: "class/net/", desc: "Network interface settings and stats" },
      ]},
      { name: "usr/", desc: "User programs and utilities", children: [
        { name: "bin/", desc: "Essential user commands (ls, grep, etc.)" },
        { name: "sbin/", desc: "System administration commands" },
        { name: "local/bin/", desc: "Locally installed programs — often in the PATH" },
      ]},
    ],
  };

  const [phase, setPhase] = useState("prompt"); // prompt | hint | tree
  const [cmdInput, setCmdInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState([]);
  const [expanded, setExpanded] = useState(new Set([""]));
  const [selectedDesc, setSelectedDesc] = useState(null);
  const inputRef = useRef(null);

  // Accepted commands — flexible matching
  const isValidTreeCmd = (cmd) => {
    const c = cmd.trim().toLowerCase();
    // Accept: tree -L 2 /, tree -L2 /, tree /, tree -L 2, tree -d /, tree, etc
    return /^tree(\s|$)/.test(c) && /(-l\s*\d|\/|\s*$)/.test(c);
  };

  const isPartialTreeCmd = (cmd) => {
    const c = cmd.trim().toLowerCase();
    return c === "ls" || c.startsWith("ls ") || c === "find" || c.startsWith("find ");
  };

  const handleSubmit = () => {
    const cmd = cmdInput.trim();
    if (!cmd) return;

    if (isValidTreeCmd(cmd)) {
      setCmdHistory(prev => [...prev, { cmd, type: "success" }]);
      setCmdInput("");
      setPhase("tree");
    } else if (isPartialTreeCmd(cmd)) {
      setCmdHistory(prev => [...prev, { cmd, type: "partial", msg: `'${cmd.split(" ")[0]}' can list files, but to visualize the full directory tree structure, there's a more specific command. Try: tree` }]);
      setCmdInput("");
    } else {
      setCmdHistory(prev => [...prev, { cmd, type: "error", msg: `bash: ${cmd.split(" ")[0]}: not the command we're looking for. What command displays a directory tree?` }]);
      setCmdInput("");
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleHint = () => {
    setPhase("hint");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const toggle = (path) => {
    const next = new Set(expanded);
    if (next.has(path)) next.delete(path); else next.add(path);
    setExpanded(next);
  };

  const renderNode = (node, path = "", depth = 0, isLast = false, prefix = "") => {
    const fullPath = path + node.name;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded.has(fullPath);
    const connector = depth === 0 ? "" : (isLast ? "└── " : "├── ");
    const childPrefix = depth === 0 ? "" : prefix + (isLast ? "    " : "│   ");

    return (
      <div key={fullPath}>
        <div
          role="button" tabIndex={0}
          aria-expanded={hasChildren ? expanded.has(fullPath) : undefined}
          onClick={() => { if (hasChildren) toggle(fullPath); setSelectedDesc({ name: fullPath || "/", desc: node.desc }); }}
          onKeyDown={onActivate(() => { if (hasChildren) toggle(fullPath); setSelectedDesc({ name: fullPath || "/", desc: node.desc }); })}
          style={{
            display: "flex", alignItems: "center", gap: 0, padding: "2px 0",
            cursor: "pointer", fontSize: 10, whiteSpace: "pre",
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            background: selectedDesc?.name === (fullPath || "/") ? "rgba(80,200,255,0.08)" : "transparent",
            borderRadius: 3,
          }}
        >
          <span style={{ color: "var(--color-v2-text-muted)" }}>{prefix}{connector}</span>
          <span style={{
            color: hasChildren ? "#50C8FF" : "#AAB4BE",
            fontWeight: hasChildren ? 600 : 400,
          }}>{node.name}</span>
        </div>
        {hasChildren && isExpanded && node.children.map((c, ci) =>
          renderNode(c, fullPath, depth + 1, ci === node.children.length - 1, childPrefix)
        )}
      </div>
    );
  };

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10, padding: 20, margin: "14px 0",
    }}>
      <div style={{ color: "#AAB4BE", fontWeight: 700, fontSize: 10, marginBottom: 10, letterSpacing: "0.5px" }}>
        ▸ FILESYSTEM EXPLORER
      </div>

      {/* Terminal Window */}
      <div style={{
        background: "rgba(0,0,0,0.5)", borderRadius: 8, overflow: "hidden",
        border: "1px solid rgba(80,200,255,0.1)", marginBottom: phase === "tree" ? 12 : 0,
      }}>
        {/* Title bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6, padding: "7px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.3)",
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF5F57" }} />
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FEBC2E" }} />
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#28C840" }} />
          <span style={{ fontFamily: "monospace", fontSize: 10, color: "var(--color-v2-text-muted)", marginLeft: 8 }}>ops@srv-01:~$</span>
        </div>

        <div style={{ padding: "12px 14px" }}>
          {/* Phase: prompt */}
          {phase === "prompt" && (
            <div>
              <p style={{ color: "#A0B0C0", fontSize: 11, margin: "0 0 10px 0", lineHeight: 1.6,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                <span style={{ color: "#FFA832" }}># </span>
                The Linux filesystem is a single tree rooted at /.<br/>
                <span style={{ color: "#FFA832" }}># </span>
                What command would you run to visualize the directory structure?
              </p>
            </div>
          )}

          {/* Phase: hint */}
          {phase === "hint" && cmdHistory.length === 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ color: "#A0B0C0", fontSize: 10, margin: "0 0 6px 0",
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                <span style={{ color: "#FFA832" }}># </span>
                The command is <span style={{ color: "#50C8FF" }}>tree</span>. Common flags:
              </p>
              <p style={{ color: "var(--color-v2-text-muted)", fontSize: 10, margin: "0 0 0 0",
                fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.8,
              }}>
                <span style={{ color: "#7AE87A" }}>tree /</span>          — show tree from root<br/>
                <span style={{ color: "#7AE87A" }}>tree -L 2 /</span>     — limit depth to 2 levels<br/>
                <span style={{ color: "#7AE87A" }}>tree -d /</span>        — directories only
              </p>
            </div>
          )}

          {/* Command history */}
          {cmdHistory.map((entry, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
                <span style={{ color: "#7AE87A" }}>ops@srv-01</span>
                <span style={{ color: "var(--color-v2-text-muted)" }}>:</span>
                <span style={{ color: "#50C8FF" }}>~</span>
                <span style={{ color: "var(--color-v2-text-muted)" }}>$ </span>
                <span style={{ color: "#E8ECF0" }}>{entry.cmd}</span>
              </div>
              {entry.type === "error" && (
                <div style={{ color: "#FF6B6B", fontSize: 10, fontFamily: "monospace", marginTop: 2 }}>{entry.msg}</div>
              )}
              {entry.type === "partial" && (
                <div style={{ color: "#FFA832", fontSize: 10, fontFamily: "monospace", marginTop: 2 }}>{entry.msg}</div>
              )}
            </div>
          ))}

          {/* Input line */}
          {phase !== "tree" && (
            <div style={{ display: "flex", alignItems: "center", gap: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
              <span style={{ color: "#7AE87A" }}>ops@srv-01</span>
              <span style={{ color: "var(--color-v2-text-muted)" }}>:</span>
              <span style={{ color: "#50C8FF" }}>~</span>
              <span style={{ color: "var(--color-v2-text-muted)" }}>$ </span>
              <input aria-label="type a command"
                ref={inputRef}
                value={cmdInput}
                onChange={(e) => setCmdInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="type a command..."
                autoFocus
                style={{
                  flex: 1, background: "transparent", border: "none",
                  color: "#E8ECF0", fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                  padding: 0, margin: 0,
                }}
              />
            </div>
          )}

          {/* Hint button */}
          {phase === "prompt" && cmdHistory.length === 0 && (
            <button onClick={handleHint} style={{
              marginTop: 10, padding: "5px 14px", background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 5,
              color: "var(--color-v2-text-muted)", fontSize: 10, cursor: "pointer", fontFamily: "monospace",
            }}>Need a hint?</button>
          )}

          {/* Success: show the command that worked */}
          {phase === "tree" && (
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, marginBottom: 8 }}>
                <span style={{ color: "#7AE87A" }}>ops@srv-01</span>
                <span style={{ color: "var(--color-v2-text-muted)" }}>:</span>
                <span style={{ color: "#50C8FF" }}>~</span>
                <span style={{ color: "var(--color-v2-text-muted)" }}>$ </span>
                <span style={{ color: "#E8ECF0" }}>{cmdHistory[cmdHistory.length - 1]?.cmd}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tree Output + Description Panel */}
      {phase === "tree" && (
        <>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{
              flex: "1 1 300px", background: "rgba(0,0,0,0.35)", borderRadius: 8, padding: "10px 14px",
              border: "1px solid rgba(80,200,255,0.1)", maxHeight: 380, overflowY: "auto",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {renderNode(tree)}
            </div>
            <div style={{ flex: "1 1 200px", minHeight: 60, display: "flex", alignItems: "flex-start" }}>
              {selectedDesc ? (
                <div style={{ padding: 14, background: "rgba(80,200,255,0.06)", borderRadius: 8, border: "1px solid rgba(80,200,255,0.15)", width: "100%" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#50C8FF", marginBottom: 6, fontWeight: 600 }}>
                    {selectedDesc.name}
                  </div>
                  <p style={{ color: "#E8ECF0", margin: 0, fontSize: 11, lineHeight: 1.6 }}>{selectedDesc.desc}</p>
                </div>
              ) : (
                <p style={{ color: "var(--color-v2-text-muted)", fontSize: 11, fontStyle: "italic" }}>Click any node to learn what it's for.</p>
              )}
            </div>
          </div>
          <div style={{
            marginTop: 12, padding: "10px 14px", borderRadius: 6,
            background: "rgba(122,232,122,0.06)", borderLeft: "3px solid #4A9A5A",
          }}>
            <span style={{ color: "#7AE87A", fontWeight: 700, fontSize: 10 }}>COMMAND LEARNED: </span>
            <span style={{ color: "#C8CCD0", fontSize: 10 }}>
              <code style={{ color: "#7DD8FF", background: "rgba(80,200,255,0.1)", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace" }}>tree</code> displays directory structures visually. Useful flags:
              <code style={{ color: "#7DD8FF", background: "rgba(80,200,255,0.1)", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace", marginLeft: 4 }}>-L N</code> limits depth,
              <code style={{ color: "#7DD8FF", background: "rgba(80,200,255,0.1)", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace", marginLeft: 4 }}>-d</code> directories only,
              <code style={{ color: "#7DD8FF", background: "rgba(80,200,255,0.1)", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace", marginLeft: 4 }}>-a</code> includes hidden files.
            </span>
          </div>
          <div style={{ marginTop: 12, textAlign: "right" }}>
            <button
              onClick={() => {
                setPhase("prompt");
                setCmdInput("");
                setCmdHistory([]);
                setExpanded(new Set([""]));
                setSelectedDesc(null);
              }}
              style={{
                padding: "6px 14px", background: "transparent",
                border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6,
                color: "var(--color-v2-text-muted)", fontWeight: 600, fontSize: 10, cursor: "pointer",
              }}
            >↻ Reset</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── INTERACTIVE: FLIP CARD CHALLENGE (Why Linux Dominates) ─────────────────
function FlipCardChallenge({ onComplete }) {
  const cards = [
    { clue: "$0", clueLabel: "per server", advantage: "Cost", body: "Open-source. No per-server license fees. At 100,000 servers, this matters enormously.", color: "#7AE87A" },
    { clue: "Years", clueLabel: "without reboot", advantage: "Stability", body: "Linux servers routinely run for months or years without rebooting. The kernel is modular — many updates don't require a restart.", color: "#50C8FF" },
    { clue: "/etc/", clueLabel: "readable configs", advantage: "Transparency", body: "Configuration lives in plain text files you can read, edit, diff, and version-control. No hidden registries or binary formats.", color: "#FFA832" },
    { clue: "5,000", clueLabel: "servers, one script", advantage: "Automation", body: "Every action can be performed from the command line, which means every action can be scripted. At scale, you write scripts, not click menus.", color: "#FF6B6B" },
    { clue: "1991", clueLabel: "and still growing", advantage: "Community", body: "Decades of contributors, massive package repositories, and thousands of tools. If you have a problem, someone has already solved it and shared the solution.", color: "#C8A0FF" },
    { clue: "chmod 700", clueLabel: "your rules", advantage: "Security", body: "Granular permission model — control exactly who can read, write, or execute any file. Audit logs, SELinux, and a transparent security model.", color: "#FF8C69" },
  ];

  const [flipped, setFlipped] = useState(new Set());
  const [guesses, setGuesses] = useState({});
  const options = ["Cost", "Stability", "Transparency", "Automation", "Community", "Security"];
  const optionColors = { Cost: "#7AE87A", Stability: "#50C8FF", Transparency: "#FFA832", Automation: "#FF6B6B", Community: "#C8A0FF", Security: "#FF8C69" };

  const handleGuess = (idx, guess) => {
    if (flipped.has(idx)) return;
    setGuesses(prev => ({ ...prev, [idx]: guess }));
  };

  const handleFlip = (idx) => {
    if (!guesses[idx]) return;
    const next = new Set(flipped);
    next.add(idx);
    setFlipped(next);
    if (next.size === cards.length && onComplete) onComplete();
  };

  const allFlipped = flipped.size === cards.length;
  const correctCount = cards.filter((c, i) => guesses[i] === c.advantage).length;

  const handleReset = () => { setFlipped(new Set()); setGuesses({}); };

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10, padding: 20, margin: "14px 0",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ color: "#AAB4BE", fontWeight: 700, fontSize: 10, letterSpacing: "0.5px" }}>
          ▸ FLIP CARD CHALLENGE — Guess the advantage from the clue, then flip to reveal
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {allFlipped && <span style={{ color: "#7AE87A", fontSize: 10, fontWeight: 600 }}>{correctCount}/{cards.length} correct</span>}
          {flipped.size > 0 && (
            <button onClick={handleReset} style={{
              padding: "3px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-v2-text-muted)",
            }}>↻ Reset</button>
          )}
        </div>
      </div>
      <p style={{ color: "var(--color-v2-text-muted)", fontSize: 11, margin: "0 0 14px 0" }}>Each card shows a clue. Pick which Linux advantage it represents, then flip.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {cards.map((card, i) => {
          const isFlipped = flipped.has(i);
          const guess = guesses[i];
          const wasCorrect = guess === card.advantage;
          return (
            <div key={i} style={{
              borderRadius: 8, overflow: "hidden",
              border: `1px solid ${isFlipped ? (wasCorrect ? card.color + "55" : "rgba(255,107,107,0.4)") : "rgba(255,255,255,0.08)"}`,
              background: isFlipped ? `${card.color}0D` : "rgba(0,0,0,0.35)",
              transition: "all 0.35s ease",
              display: "flex", flexDirection: "column",
            }}>
              {!isFlipped ? (
                <div style={{ padding: "12px 10px", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ color: "#E8ECF0", fontSize: 15, fontWeight: 800, lineHeight: 1 }}>{card.clue}</div>
                  <div style={{ color: "var(--color-v2-text-muted)", fontSize: 10, marginTop: 3, marginBottom: 10 }}>{card.clueLabel}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3, width: "100%" }}>
                    {options.map((opt) => {
                      const pillColor = optionColors[opt] || "#93a5c1";
                      return (
                      <button key={opt} onClick={() => handleGuess(i, opt)} style={{
                        padding: "2px 0", borderRadius: 4, fontSize: 9, fontWeight: 600, cursor: "pointer",
                        background: guess === opt ? `${pillColor}30` : "rgba(255,255,255,0.04)",
                        border: guess === opt ? `1px solid ${pillColor}80` : `1px solid ${pillColor}25`,
                        color: guess === opt ? pillColor : `${pillColor}CC`,
                        transition: "all 0.15s", textAlign: "center",
                      }}>{opt}</button>
                      );
                    })}
                  </div>
                  <button onClick={() => handleFlip(i)} disabled={!guess} style={{
                    marginTop: 8, padding: "4px 14px", borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: guess ? "pointer" : "not-allowed",
                    background: guess ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.12)", color: guess ? "#CCD" : "var(--color-v2-text-muted)",
                    transition: "all 0.2s",
                  }}>Flip</button>
                </div>
              ) : (
                <div style={{ padding: "10px 10px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ color: card.color, fontWeight: 800, fontSize: 11 }}>{card.advantage}</div>
                    <span style={{
                      fontSize: 10, padding: "1px 6px", borderRadius: 6,
                      background: wasCorrect ? "rgba(122,232,122,0.2)" : "rgba(255,107,107,0.2)",
                      color: wasCorrect ? "#7AE87A" : "#FF6B6B", fontWeight: 700,
                    }}>{wasCorrect ? "✓" : "✗"}</span>
                  </div>
                  <p style={{ color: "#B8BCC0", fontSize: 10, lineHeight: 1.5, margin: 0, flex: 1 }}>{card.body}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── INTERACTIVE: DISTRO FAMILY SORT ────────────────────────────────────────
function DistroFamilySort({ onComplete }) {
  const allCards = [
    { label: "RHEL", type: "distro", family: "rhel" },
    { label: "CentOS", type: "distro", family: "rhel" },
    { label: "Rocky Linux", type: "distro", family: "rhel" },
    { label: "AlmaLinux", type: "distro", family: "rhel" },
    { label: "Ubuntu Server", type: "distro", family: "debian" },
    { label: "Debian", type: "distro", family: "debian" },
    { label: "dnf / yum", type: "pkg", family: "rhel" },
    { label: "apt", type: "pkg", family: "debian" },
    { label: "XFS", type: "fs", family: "rhel" },
    { label: "ext4", type: "fs", family: "debian" },
    { label: "Stability-focused, long support cycles", type: "trait", family: "rhel" },
    { label: "Frequent releases, popular in cloud/dev", type: "trait", family: "debian" },
  ];

  const [pool, setPool] = useState(() => [...allCards].sort(() => Math.random() - 0.5));
  const [rhel, setRhel] = useState([]);
  const [debian, setDebian] = useState([]);
  const [checked, setChecked] = useState(false);
  const [dragItem, setDragItem] = useState(null);

  const typeColors = { distro: "#50C8FF", pkg: "#FFA832", fs: "#7AE87A", trait: "#C8A0FF" };
  const typeLabels = { distro: "DISTRO", pkg: "PKG MGR", fs: "FILESYSTEM", trait: "TRAIT" };

  const handleDragStart = (item, source) => setDragItem({ item, source });

  const handleDrop = (target) => {
    if (!dragItem) return;
    const { item, source } = dragItem;
    // Remove from source
    if (source === "pool") setPool(p => p.filter(c => c.label !== item.label));
    else if (source === "rhel") setRhel(p => p.filter(c => c.label !== item.label));
    else if (source === "debian") setDebian(p => p.filter(c => c.label !== item.label));
    // Add to target
    if (target === "pool") setPool(p => [...p, item]);
    else if (target === "rhel") setRhel(p => [...p, item]);
    else if (target === "debian") setDebian(p => [...p, item]);
    setDragItem(null);
    setChecked(false);
  };

  const check = () => {
    setChecked(true);
    const rhelCorrect = rhel.every(c => c.family === "rhel");
    const debianCorrect = debian.every(c => c.family === "debian");
    const allPlaced = pool.length === 0;
    if (rhelCorrect && debianCorrect && allPlaced && onComplete) onComplete();
  };

  const rhelCorrectCount = rhel.filter(c => c.family === "rhel").length;
  const debianCorrectCount = debian.filter(c => c.family === "debian").length;
  const rhelWrongCount = rhel.filter(c => c.family !== "rhel").length;
  const debianWrongCount = debian.filter(c => c.family !== "debian").length;
  const allPlaced = pool.length === 0;
  const allCorrect = allPlaced && rhelWrongCount === 0 && debianWrongCount === 0;

  const renderCard = (card, source) => (
    <div
      key={card.label}
      draggable
      onDragStart={() => handleDragStart(card, source)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "6px 12px", borderRadius: 6, cursor: "grab", fontSize: 10, fontWeight: 600,
        background: checked && source !== "pool"
          ? (card.family === source ? "rgba(122,232,122,0.1)" : "rgba(255,107,107,0.1)")
          : "rgba(255,255,255,0.05)",
        border: `1px solid ${checked && source !== "pool"
          ? (card.family === source ? "rgba(122,232,122,0.3)" : "rgba(255,107,107,0.3)")
          : "rgba(255,255,255,0.1)"}`,
        color: typeColors[card.type],
        transition: "all 0.2s",
      }}
    >
      <span style={{ fontSize: 10, color: "var(--color-v2-text-muted)", fontWeight: 700 }}>{typeLabels[card.type]}</span>
      {card.label}
    </div>
  );

  const bucketStyle = (family) => ({
    flex: "1 1 240px", minHeight: 140, padding: 14, borderRadius: 10,
    background: "rgba(0,0,0,0.3)",
    border: `2px dashed ${family === "rhel" ? "rgba(255,107,107,0.25)" : "rgba(167,139,250,0.25)"}`,
    transition: "all 0.2s",
  });

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10, padding: 20, margin: "14px 0",
    }}>
      <div style={{ color: "#AAB4BE", fontWeight: 700, fontSize: 10, marginBottom: 6, letterSpacing: "0.5px" }}>
        ▸ SORT INTO FAMILIES — Drag each card into the correct distribution family
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button onClick={() => { setPool([...allCards].sort(() => Math.random() - 0.5)); setRhel([]); setDebian([]); setChecked(false); }} style={{
          padding: "3px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer",
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-v2-text-muted)",
        }}>↻ Reset</button>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
        {Object.entries(typeColors).map(([type, color]) => (
          <span key={type} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: "inline-block" }} />
            <span style={{ color: "var(--color-v2-text-muted)" }}>{typeLabels[type]}</span>
          </span>
        ))}
      </div>

      {/* Pool */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => handleDrop("pool")}
        style={{
          minHeight: 50, padding: 12, borderRadius: 8, marginBottom: 14,
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexWrap: "wrap", gap: 6,
        }}
      >
        {pool.length > 0 ? pool.map(c => renderCard(c, "pool")) : (
          <span style={{ color: "var(--color-v2-text-muted)", fontSize: 10, fontStyle: "italic" }}>All cards placed — check your answers below</span>
        )}
      </div>

      {/* Buckets */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop("rhel")}
          style={bucketStyle("rhel")}
        >
          <div style={{ color: "#FF6B6B", fontWeight: 800, fontSize: 11, marginBottom: 10, letterSpacing: "0.5px" }}>RHEL FAMILY</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {rhel.map(c => renderCard(c, "rhel"))}
          </div>
          {rhel.length === 0 && <span style={{ color: "var(--color-v2-text-muted)", fontSize: 10 }}>Drop cards here</span>}
        </div>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop("debian")}
          style={bucketStyle("debian")}
        >
          <div style={{ color: "#A78BFA", fontWeight: 800, fontSize: 11, marginBottom: 10, letterSpacing: "0.5px" }}>DEBIAN FAMILY</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {debian.map(c => renderCard(c, "debian"))}
          </div>
          {debian.length === 0 && <span style={{ color: "var(--color-v2-text-muted)", fontSize: 10 }}>Drop cards here</span>}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
        <button onClick={check} disabled={!allPlaced} style={{
          padding: "8px 22px", background: allPlaced ? "#50C8FF" : "rgba(80,200,255,0.15)",
          border: "none", borderRadius: 6, color: allPlaced ? "#1A1A2E" : "var(--color-v2-text-muted)",
          fontWeight: 700, fontSize: 11, cursor: allPlaced ? "pointer" : "not-allowed",
        }}>Check Sort</button>
        {checked && (
          <span style={{ color: allCorrect ? "#7AE87A" : "#FF6B6B", fontWeight: 600, fontSize: 11 }}>
            {allCorrect
              ? "✓ Perfect sort! RHEL family uses dnf and XFS. Debian family uses apt and ext4."
              : `${rhelWrongCount + debianWrongCount} card${rhelWrongCount + debianWrongCount > 1 ? "s" : ""} in the wrong bucket — drag them to the correct family and re-check.`}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── INTERACTIVE: NETWORK ADDRESS BUILDER ───────────────────────────────────
function NetworkAddressBuilder() {
  const [ip, setIp] = useState("10.0.5.20");
  const [port, setPort] = useState("443");
  const [protocol, setProtocol] = useState("TCP");

  const portMap = { "22": "SSH", "80": "HTTP", "443": "HTTPS", "53": "DNS", "9100": "Monitoring" };
  const serviceName = portMap[port] || "Custom Service";

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10, padding: 20, margin: "14px 0",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ color: "#AAB4BE", fontWeight: 700, fontSize: 10, letterSpacing: "0.5px" }}>
          ▸ NETWORK ADDRESS BUILDER — Construct a connection
        </div>
        <button onClick={() => { setIp("10.0.5.20"); setPort("443"); setProtocol("TCP"); }} style={{
          padding: "3px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer",
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-v2-text-muted)",
        }}>↻ Reset</button>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <div style={{ color: "#FF6B6B", fontSize: 10, fontWeight: 700, marginBottom: 4 }}>IP ADDRESS (the building)</div>
          <select aria-label="IP address" value={ip} onChange={e => setIp(e.target.value)} style={{
            padding: "8px 12px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,107,107,0.3)",
            borderRadius: 6, color: "#FF6B6B", fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
          }}>
            <option value="10.0.5.20">10.0.5.20</option>
            <option value="192.168.1.100">192.168.1.100</option>
            <option value="172.16.0.1">172.16.0.1</option>
          </select>
        </div>
        <div>
          <div style={{ color: "#FFA832", fontSize: 10, fontWeight: 700, marginBottom: 4 }}>PORT (the apartment)</div>
          <select aria-label="Port" value={port} onChange={e => setPort(e.target.value)} style={{
            padding: "8px 12px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,168,50,0.3)",
            borderRadius: 6, color: "#FFA832", fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
          }}>
            {Object.entries(portMap).map(([p, s]) => <option key={p} value={p}>{p} ({s})</option>)}
          </select>
        </div>
        <div>
          <div style={{ color: "#7AE87A", fontSize: 10, fontWeight: 700, marginBottom: 4 }}>PROTOCOL (the language)</div>
          <select aria-label="Protocol" value={protocol} onChange={e => setProtocol(e.target.value)} style={{
            padding: "8px 12px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(122,232,122,0.3)",
            borderRadius: 6, color: "#7AE87A", fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
          }}>
            <option value="TCP">TCP (reliable)</option>
            <option value="UDP">UDP (fast)</option>
          </select>
        </div>
      </div>
      <div style={{
        background: "rgba(0,0,0,0.4)", borderRadius: 8, padding: 16,
        border: "1px solid rgba(80,200,255,0.1)",
        fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textAlign: "center",
      }}>
        <span style={{ color: "#FF6B6B" }}>{ip}</span>
        <span style={{ color: "var(--color-v2-text-muted)" }}>:</span>
        <span style={{ color: "#FFA832" }}>{port}</span>
        <span style={{ color: "var(--color-v2-text-muted)" }}> over </span>
        <span style={{ color: "#7AE87A" }}>{protocol}</span>
        <span style={{ color: "var(--color-v2-text-muted)" }}> → </span>
        <span style={{ color: "#50C8FF" }}>{serviceName}</span>
      </div>
      <p style={{ color: "var(--color-v2-text-muted)", fontSize: 10, marginTop: 10, textAlign: "center" }}>
        {protocol === "TCP" ? "TCP guarantees delivery — packets arrive in order, lost packets are retransmitted. Used for SSH, HTTP, databases." : "UDP sends packets without confirmation — faster, but no delivery guarantee. Used for DNS queries, streaming, monitoring metrics."}
      </p>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAIN APP ─────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export default function LinuxFoundations({ initialSection, missionMode, onMissionComplete }: { initialSection?: number; missionMode?: boolean; onMissionComplete?: () => void } = {}) {
  const [activeSection, setActiveSection] = useState(initialSection ?? 1);
  const [completedInteractions, setCompletedInteractions] = useState(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lessonScale, cycleLessonScale] = useLessonScale();
  const contentRef = useRef(null);

  const markComplete = (id) => setCompletedInteractions(prev => new Set([...prev, id]));

  const goTo = (id) => {
    setActiveSection(id);
    setSidebarOpen(false);
    requestAnimationFrame(() => {
      if (contentRef.current) contentRef.current.scrollTop = 0;
    });
  };

  // ─── SECTION RENDERERS ──────────────────────────────────────────────────
  const renderSection = () => {
    switch (activeSection) {
      case 1: return <Section1 markComplete={markComplete} />;
      case 2: return <Section2 markComplete={markComplete} />;
      case 3: return <Section3 markComplete={markComplete} />;
      case 4: return <Section4 markComplete={markComplete} />;
      case 5: return <Section5 markComplete={markComplete} />;
      case 6: return <Section6 markComplete={markComplete} />;
      case 7: return <Section7 markComplete={markComplete} />;
      case 8: return <Section8 markComplete={markComplete} />;
      case 9: return <Section9 markComplete={markComplete} />;
      case 10: return <Section10 markComplete={markComplete} />;
      default: return null;
    }
  };

  const progress = Math.round((completedInteractions.size / 30) * 100);

  return (
    <div style={{
      minHeight: "100vh", background: "#12121F",
      fontFamily: "'Geist', 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
      color: "#D8DCE0", display: "flex", flexDirection: "column",
    }}>
      {/* ─── TOP BAR ─── */}
      {/* Sticks below the app's own chrome (nav, plus the sample-data banner
          when it shows) instead of colliding with it at top: 0. z-index stays
          under the nav's 50. */}
      <div style={{
        position: "sticky", top: "var(--chrome-h)", zIndex: 40,
        background: "rgba(18,18,31,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 20px",
        display: "flex", alignItems: "center", height: 56, gap: 14, flexShrink: 0,
      }}>
        {/* Inside a mission, the mission header owns the way out; a second
            link here that silently abandons the mission only confuses. */}
        {!missionMode && (
          <>
            <Link href="/" style={{
              color: "#50C8FF", fontSize: 11, cursor: "pointer", textDecoration: "none",
              padding: "4px 8px", display: "flex", alignItems: "center", fontWeight: 600,
              opacity: 0.8, transition: "opacity 0.15s",
            }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.8}
            >← Galaxy Map</Link>
            <span aria-hidden="true" style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>|</span>
          </>
        )}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Sections" aria-expanded={sidebarOpen} style={{
          background: "none", border: "none", color: "#AAB4BE", fontSize: 15, cursor: "pointer",
          padding: "4px 8px", display: "flex", alignItems: "center",
        }}>☰</button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <span style={{ color: "#50C8FF", fontWeight: 800, fontSize: 11, whiteSpace: "nowrap" }}>LINUX FOUNDATIONS</span>
          <span style={{ color: "var(--color-v2-text-muted)", fontSize: 11 }}>|</span>
          <span style={{ color: "#AAB4BE", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {SECTIONS[activeSection - 1].icon} {SECTIONS[activeSection - 1].title}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ width: 100, height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 3, background: "#50C8FF", width: `${progress}%`, transition: "width 0.4s" }} />
          </div>
          <span style={{ color: "var(--color-v2-text-muted)", fontSize: 10, fontWeight: 600, minWidth: 36 }}>{progress}%</span>
          <button
            onClick={cycleLessonScale}
            title={`Text size: ${scaleLabel(lessonScale)} (click to cycle XS → S → M → L)`}
            aria-label={`Change text size (currently ${scaleLabel(lessonScale)})`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6,
              color: "#AAB4BE",
              fontSize: 11,
              fontWeight: 600,
              padding: "0 8px",
              height: 24,
              cursor: "pointer",
              letterSpacing: "0.5px",
            }}
          >
            <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 13, letterSpacing: 0 }}>Aa</span>
            <span>{scaleLabel(lessonScale)}</span>
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <FoundationsNav activeSection={activeSection} sidebarOpen={sidebarOpen} onGoTo={goTo} />

        {/* ─── CONTENT ─── */}
        <div ref={contentRef} style={{
          flex: 1, overflowY: "auto", padding: "20px 24px 56px", maxWidth: 820, margin: "0 auto", zoom: lessonScale,
        }}>
          {renderSection()}
          {/* ─── NAVIGATION ─── */}
          <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {missionMode && onMissionComplete ? (
              /* Mission mode: primary = complete mission step, secondary = keep reading */
              <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
                <button onClick={onMissionComplete} style={{
                  padding: "12px 32px", background: "rgba(80,200,255,0.15)", border: "1px solid rgba(80,200,255,0.4)",
                  borderRadius: 8, color: "#50C8FF", fontWeight: 700, fontSize: 11, cursor: "pointer",
                  width: "100%", maxWidth: 360,
                  transition: "all 0.2s",
                  boxShadow: "0 0 8px rgba(80,200,255,0.1)",
                }}>Completed reading, Continue mission</button>
                {activeSection < 10 && (
                  <button onClick={() => goTo(activeSection + 1)} style={{
                    padding: "6px 16px", background: "transparent", border: "none",
                    color: "var(--color-v2-text-muted)", fontSize: 10, cursor: "pointer",
                    transition: "color 0.2s",
                  }}>Leave the mission for now and read on →</button>
                )}
              </div>
            ) : (
              /* Standalone mode: normal prev/next navigation */
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {activeSection > 1 && (
                  <button onClick={() => goTo(activeSection - 1)} style={{
                    padding: "10px 24px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8, color: "#AAB4BE", fontWeight: 600, fontSize: 11, cursor: "pointer",
                  }}>← Previous</button>
                )}
                <div style={{ flex: 1 }} />
                {activeSection < 10 && (
                  <button onClick={() => goTo(activeSection + 1)} style={{
                    padding: "10px 24px", background: "rgba(80,200,255,0.15)", border: "1px solid rgba(80,200,255,0.3)",
                    borderRadius: 8, color: "#50C8FF", fontWeight: 700, fontSize: 11, cursor: "pointer",
                  }}>Next Section →</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// ─── SECTION COMPONENTS ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function Section1({ markComplete }) {
  return (
    <div>
      <h2 style={{ color: "#E8ECF0", fontSize: 18, fontWeight: 700, margin: "0 0 6px 0" }}>1. What Is an Operating System?</h2>
      <p style={{ color: "var(--color-v2-text-muted)", fontSize: 11, marginTop: 0, marginBottom: 16, fontStyle: "italic" }}>Everything between your keystroke and the pixel on screen.</p>

      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        You press a key on your keyboard. Characters appear on a screen. Between those two events, thousands of operations occur: electrical signals travel from the keyboard to a USB controller, get translated into a scan code, routed through a driver, interpreted by a program, rendered as pixels by a graphics card, and pushed to a display. You never see any of it.
      </p>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        That invisible machinery is the <strong style={{ color: "#E8ECF0" }}>operating system</strong> (OS).
      </p>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>An OS does three things:</p>

      <OsFunctionCards />

      <ThinkAboutIt
        scenario="Your phone has an operating system too — iOS or Android. What happens when you switch between apps? Think about what the OS is doing behind the scenes when you swipe from one app to another."
        answer="The OS is suspending one process, saving its state, and resuming another. Every 'app switch' is the OS managing resources in real time — preserving exactly where you left off in one app while loading the context of another."
        onComplete={() => markComplete("s1-think")}
      />

      <SectionHeading>The Kernel vs. Everything Else</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        The OS has layers. At the center is the <strong style={{ color: "#E8ECF0" }}>kernel</strong> — the code that runs with full hardware access. It handles memory allocation, process scheduling, device drivers, and system calls. Everything else (your file manager, your web browser, your terminal) runs in <strong style={{ color: "#E8ECF0" }}>user space</strong>, where it must ask the kernel for permission to do anything involving hardware.
      </p>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        When a program wants to read a file, it doesn't talk to the disk directly. It makes a <strong style={{ color: "#E8ECF0" }}>system call</strong> — a formal request to the kernel. The kernel checks permissions, locates the data on disk, copies it into the program's memory, and returns control. This happens millions of times per second on a busy server.
      </p>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        <strong style={{ color: "#FFA832" }}>Why does this matter for datacenter operations?</strong> Because when something goes wrong — a disk fails, a process consumes all available memory, a network interface drops — the symptoms you see and the tools you use all interact with the kernel. Understanding this layer is how you move from "the server is broken" to "the kernel remounted the filesystem read-only because it detected I/O errors on the NVMe drive."
      </p>

      <LayerSorter onComplete={() => markComplete("s1-sort")} />

      <KnowledgeCheck
        question="If a program crashes, why doesn't it crash the whole computer? What part of the OS prevents that?"
        correctAnswer="The kernel enforces process isolation through virtual memory — each process gets its own memory space and cannot access another's. If a process crashes, only its memory space is affected."
        onComplete={() => markComplete("s1-kc")}
      />
    </div>
  );
}

function Section2({ markComplete }) {
  return (
    <div>
      <h2 style={{ color: "#E8ECF0", fontSize: 18, fontWeight: 700, margin: "0 0 6px 0" }}>2. What Is Linux?</h2>
      <p style={{ color: "var(--color-v2-text-muted)", fontSize: 11, marginTop: 0, marginBottom: 16, fontStyle: "italic" }}>The kernel that runs 90%+ of the world's servers.</p>

      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        Linux is an operating system kernel created by Linus Torvalds in 1991. Specifically, "Linux" refers to the kernel — the core component that manages hardware, memory, and processes. What most people call "Linux" is actually a <strong style={{ color: "#E8ECF0" }}>distribution</strong> (distro): the kernel bundled with a package manager, system utilities, default configurations, and sometimes a graphical interface.
      </p>

      <SectionHeading>Why Linux Dominates Servers</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        Over 90% of the world's servers run Linux. Every major cloud provider (AWS, Azure, GCP) defaults to Linux. Every top supercomputer runs Linux. The reasons are practical:
      </p>
      <FlipCardChallenge onComplete={() => markComplete("s2-flip")} />

      <SectionHeading>Distributions You Will Encounter</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        A distribution packages the Linux kernel with tools, a package manager, and default configurations. In datacenter environments, you will primarily see:
      </p>
      <DistroFamilySort onComplete={() => markComplete("s2-sort")} />
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        The commands and concepts are nearly identical across distributions. The main differences are the package manager (<Code>dnf</Code> vs. <Code>apt</Code>), the default filesystem (<Code>XFS</Code> vs. <Code>ext4</Code>), and where certain configuration files live. Learn one, and the other is a short translation.
      </p>

      <SectionHeading>What Is a Package?</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        A <strong style={{ color: "#E8ECF0" }}>package</strong> is a compressed bundle of files — the program itself, its configuration files, and metadata describing what it needs to run. Think of it as a shipping box that contains both the product and the assembly instructions.
      </p>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        The <strong style={{ color: "#E8ECF0" }}>package manager</strong> (<Code>apt</Code>, <Code>dnf</Code>) installs, updates, and removes these packages. Its critical capability is <strong style={{ color: "#E8ECF0" }}>dependency resolution</strong>. Most programs rely on shared libraries — reusable code that other programs also use. When you install a package, the package manager automatically finds and installs every library (dependency) that program needs. Without one, you would track down and install each dependency by hand — unmanageable on a system running dozens of services.
      </p>

      <ThinkAboutIt
        scenario="Why would a datacenter team mirror package repositories internally instead of letting servers download packages directly from the internet? Consider what happens if 5,000 servers all try to update at once — and what happens if an untested update breaks a critical service."
        answer="Two reasons: (1) Bandwidth — 5,000 servers pulling from the same external repository simultaneously could saturate the internet link and be extremely slow. A local mirror means fast LAN-speed downloads. (2) Control — mirroring lets the team test updates before distributing them. If an update breaks something, they catch it before it hits production."
        onComplete={() => markComplete("s2-think1")}
      />

      <ThinkAboutIt
        scenario="If Linux is just a kernel, what makes Ubuntu different from Rocky Linux? They share the same kernel — so what is actually different between them?"
        answer="The distribution layer: different package managers (apt vs. dnf), different default configurations, different release schedules, different included utilities, different communities and support models. The kernel is the same foundation; everything built on top is what differentiates them."
        onComplete={() => markComplete("s2-think2")}
      />

      <KnowledgeCheck
        question="Name two reasons Linux is preferred over Windows for servers in a datacenter environment."
        correctAnswer="(1) No per-server license cost at scale. (2) Full command-line control enables automation across thousands of servers. Also acceptable: stability, transparency/text-based configuration, open-source community support."
        onComplete={() => markComplete("s2-kc")}
      />
    </div>
  );
}

function Section3({ markComplete }) {
  return (
    <div>
      <h2 style={{ color: "#E8ECF0", fontSize: 18, fontWeight: 700, margin: "0 0 6px 0" }}>3. The Command Line — Your Primary Interface</h2>
      <p style={{ color: "var(--color-v2-text-muted)", fontSize: 11, marginTop: 0, marginBottom: 16, fontStyle: "italic" }}>No GUI. No mouse. Just text — and that's an advantage.</p>

      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        Most computers you have used have a <strong style={{ color: "#E8ECF0" }}>graphical user interface</strong> (GUI): windows, icons, a mouse pointer. Servers almost never have one. They sit in racks in a datacenter — no monitor, no keyboard, no mouse attached. You access them remotely, and when you do, you get a <strong style={{ color: "#E8ECF0" }}>command line interface</strong> (CLI).
      </p>

      <SectionHeading>Terminal, Shell, Command Line — What's What?</SectionHeading>
      <CliTermsCards />
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        The relationship: you open a <strong style={{ color: "#FF6B6B" }}>terminal</strong>, which runs a <strong style={{ color: "#FFA832" }}>shell</strong>, and you interact with both via the <strong style={{ color: "#50C8FF" }}>command line</strong>.
      </p>

      <SectionHeading>From Commands to Scripts</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        When you type a command and press Enter, the shell executes it immediately. But what if you need to run the same 15 commands every morning — checking disk usage, verifying services, reviewing logs?
      </p>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        A <strong style={{ color: "#E8ECF0" }}>script</strong> is just a text file containing a sequence of shell commands. Instead of typing each command interactively, you write them all into a file, mark that file as executable, and run it once. The shell reads it top-to-bottom and executes each command in order — exactly as if you had typed them yourself, but faster and without mistakes.
      </p>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        This is the bridge from "operator" to "automator." Scripting is how a datacenter technician goes from manually checking one server at a time to running a health check across an entire fleet with a single command.
      </p>

      <SectionHeading>Anatomy of a Command</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        Every command follows a pattern: <Code>command [options] [arguments]</Code>
      </p>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        Options usually start with a dash. A single dash with a letter (<Code>-l</Code>) is a short option. Two dashes with a word (<Code>--all</Code>) is a long option. Short options can often be combined: <Code>-l -a</Code> becomes <Code>-la</Code>.
      </p>

      <CommandDissector />

      <ThinkAboutIt
        scenario="Why would datacenter technicians prefer a text-based interface over a graphical one? Consider: you manage 5,000 servers. You need to check the disk usage on all of them. How would you do that with a GUI? How would you do it with a CLI?"
        answer="With a GUI, you'd need to log in to each server individually, navigate through menus, and read each screen — 5,000 times. With a CLI, you write one script and run it against all 5,000 servers simultaneously. The text-based interface is automatable; the graphical one is not."
        onComplete={() => markComplete("s3-think")}
      />

      <SectionHeading>Where Commands Live</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        When you type <Code>ls</Code>, how does the shell know what program to run? The shell searches a list of directories called the <strong style={{ color: "#E8ECF0" }}>PATH</strong>. The PATH is an environment variable — a named value stored in your shell session — that contains a colon-separated list of directories.
      </p>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        Typical PATH directories: <Code>/usr/local/bin</Code>, <Code>/usr/bin</Code>, <Code>/bin</Code>, <Code>/usr/sbin</Code>, <Code>/sbin</Code>
      </p>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        When you type <Code>ls</Code>, the shell checks each directory in order until it finds an executable file named <Code>ls</Code>. If it does not find one, you get "command not found."
      </p>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        This matters because when you install new software, it needs to be in a PATH directory — or you call it by its full path (e.g., <Code>/opt/monitoring/bin/check_health</Code>).
      </p>

      <KnowledgeCheck
        question="What is the difference between a terminal and a shell? Could you run a different shell inside the same terminal?"
        correctAnswer="The terminal is the display container; the shell is the interpreter running inside it. Yes — you could run Bash, then start Zsh inside that same terminal window. The terminal doesn't change; the shell does."
        onComplete={() => markComplete("s3-kc")}
      />
    </div>
  );
}

function Section4({ markComplete }) {
  return (
    <div>
      <h2 style={{ color: "#E8ECF0", fontSize: 18, fontWeight: 700, margin: "0 0 6px 0" }}>4. How Computers Work — The Operations Perspective</h2>
      <p style={{ color: "var(--color-v2-text-muted)", fontSize: 11, marginTop: 0, marginBottom: 16, fontStyle: "italic" }}>You don't need a CS degree. You need to know where to look when something breaks.</p>

      <SectionHeading>CPU — The Executor</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        The <strong style={{ color: "#E8ECF0" }}>Central Processing Unit</strong> executes instructions. It fetches an instruction from memory, decodes it, executes it, and moves to the next one — billions of times per second. Modern servers have CPUs with dozens of cores, each capable of running instructions independently.
      </p>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        For operations, what matters is <strong style={{ color: "#E8ECF0" }}>CPU utilization</strong>. If all cores are saturated, the system becomes sluggish. When troubleshooting a slow server, CPU is one of the first things to check.
      </p>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        CPUs also generate heat proportional to their workload. In a datacenter, thousands of CPUs at high utilization create enormous thermal loads — which is why cooling infrastructure is critical.
      </p>

      <SectionHeading>RAM — The Fast Workspace</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        <strong style={{ color: "#E8ECF0" }}>Random Access Memory</strong> is where the CPU keeps data it is actively working with. It is fast (nanoseconds to access) but volatile — everything is lost when power is lost.
      </p>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        The critical concept: <strong style={{ color: "#E8ECF0" }}>RAM is finite.</strong> A server might have 128 GB, 256 GB, or more — but if running processes demand more memory than is physically available, the system must start using <strong style={{ color: "#E8ECF0" }}>swap</strong> (disk space used as overflow memory). Swap is orders of magnitude slower than RAM, so a system that is "swapping" performs terribly.
      </p>

      <ThinkAboutIt
        scenario="A server has 128 GB of RAM. You check and see 125 GB is 'used.' Is the server in trouble?"
        hint="Think about what Linux does with free RAM proactively."
        answer="Not necessarily — Linux intentionally uses free RAM for disk caching to speed up file access. The key question is not 'how much is used' but 'how much is available.' A server showing 125 GB 'used' might have 100 GB of that as cache that can be freed instantly. The distinction between 'used' and 'available' is one of the most common points of confusion in Linux memory management."
        onComplete={() => markComplete("s4-think")}
      />

      <SectionHeading>Storage — The Persistent Record</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        Storage (SSDs, NVMe drives, HDDs) holds data that persists across reboots: the OS, applications, logs, user data. Much slower than RAM but retains data without power.
      </p>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        Key concepts: <strong style={{ color: "#E8ECF0" }}>Capacity</strong> — storage fills up, and when a filesystem reaches 100%, services that try to write fail. Monitoring disk usage is a fundamental ops task. <strong style={{ color: "#E8ECF0" }}>Speed</strong> — NVMe drives (connected directly to the CPU via PCIe) are vastly faster than SATA SSDs, which are vastly faster than spinning HDDs. <strong style={{ color: "#E8ECF0" }}>Health</strong> — storage devices have a finite lifespan. Both SSDs and HDDs report health data through <strong style={{ color: "#E8ECF0" }}>S.M.A.R.T.</strong> (Self-Monitoring, Analysis, and Reporting Technology), which ops teams monitor to predict failures.
      </p>

      <SectionHeading>The Bus — How Components Talk</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        The CPU, RAM, storage, GPUs, and network cards all communicate through <strong style={{ color: "#E8ECF0" }}>buses</strong> — data pathways on the motherboard. The most important one in modern servers is <strong style={{ color: "#E8ECF0" }}>PCIe</strong> (Peripheral Component Interconnect Express). GPUs, NVMe drives, and high-speed network cards all connect via PCIe lanes.
      </p>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        For datacenter operations, bus architecture matters because GPU training workloads are bandwidth-sensitive. A GPU that cannot feed data fast enough through its PCIe connection becomes a bottleneck — the GPU sits idle waiting for data, wasting expensive compute time.
      </p>

      <ResourceInvestigator onComplete={() => markComplete("s4-diag")} />

      <KnowledgeCheck
        question="A server is running slowly. Name the four main hardware resources you would check and briefly explain why each could be the cause."
        correctAnswer="CPU (saturated cores cause slowness), RAM (exhausted memory forces swapping to slow disk), Storage (full disk prevents writes; failing disk causes I/O errors), Network (connectivity issues prevent communication)."
        onComplete={() => markComplete("s4-kc")}
      />
    </div>
  );
}

function Section5({ markComplete }) {
  return (
    <div>
      <h2 style={{ color: "#E8ECF0", fontSize: 18, fontWeight: 700, margin: "0 0 6px 0" }}>5. Files, Directories, and the Filesystem Tree</h2>
      <p style={{ color: "var(--color-v2-text-muted)", fontSize: 11, marginTop: 0, marginBottom: 16, fontStyle: "italic" }}>One tree. Everything lives in it — including hardware.</p>

      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        Every piece of data on a Linux system lives in a <strong style={{ color: "#E8ECF0" }}>file</strong>. Every file lives inside a <strong style={{ color: "#E8ECF0" }}>directory</strong> (folder). Directories can contain other directories, forming a tree structure.
      </p>

      <SectionHeading>The Tree Model</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        Unlike Windows, which uses drive letters (C:\, D:\), Linux has a single tree rooted at <Code>/</Code> (called "root"). Everything branches from there. This is called the <strong style={{ color: "#E8ECF0" }}>Filesystem Hierarchy Standard</strong> (FHS). It defines where things go so that any Linux administrator on any distribution can find configuration in <Code>/etc</Code>, logs in <Code>/var/log</Code>, and temporary files in <Code>/tmp</Code> without guessing.
      </p>

      <FilesystemTree />

      <SectionHeading>Paths — Addresses for Files</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        A <strong style={{ color: "#E8ECF0" }}>path</strong> is the address of a file or directory. Two types: an <strong style={{ color: "#E8ECF0" }}>absolute path</strong> starts from root <Code>/</Code> and works from anywhere (e.g., <Code>/var/log/syslog</Code>). A <strong style={{ color: "#E8ECF0" }}>relative path</strong> starts from wherever you currently are — it depends on context.
      </p>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        Two special symbols: <Code>.</Code> (single dot) is the current directory. <Code>..</Code> (double dot) is the parent directory (one level up). So if you are in <Code>/var/log</Code>, the path <Code>../../etc</Code> means "go up to <Code>/var</Code>, up to <Code>/</Code>, then down into <Code>etc</Code>" — ending at <Code>/etc</Code>.
      </p>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        At any moment, you are "standing" in a directory — your <strong style={{ color: "#E8ECF0" }}>current working directory</strong>. In scripts and documentation, <strong style={{ color: "#FFA832" }}>always use absolute paths</strong> to avoid ambiguity.
      </p>

      <PathResolver onComplete={() => markComplete("s5-path")} />

      <SectionHeading>Everything Is a File</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        Linux takes a philosophically extreme position: almost everything is represented as a file. Regular files, directories, hardware devices, running processes, kernel parameters — all accessible through the filesystem.
      </p>

      <InfoTable
        headers={["What It Actually Is", "Where It Appears"]}
        rows={[
          ["A SATA/SAS hard disk", <Code>/dev/sda</Code>],
          ["An NVMe drive", <Code>/dev/nvme0n1</Code>],
          ["A USB device", <Code>/dev/sdb1</Code>],
          ["A GPU", <Code>/dev/nvidia0</Code>],
          ["CPU information", <Code>/proc/cpuinfo</Code>],
          ["Memory statistics", <Code>/proc/meminfo</Code>],
          ["A running process", <Code>/proc/&lt;PID&gt;/</Code>],
          ["Network interface settings", <Code>/sys/class/net/eth0/</Code>],
        ]}
      />

      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        A naming note worth internalizing: traditional SATA/SAS drives appear as <Code>/dev/sda</Code>, <Code>/dev/sdb</Code>, etc. But in high-density datacenters — like a modern hyperscale AI campus — you will primarily work with <strong style={{ color: "#E8ECF0" }}>NVMe</strong> drives, which connect directly to the CPU over PCIe. NVMe drives use: <Code>/dev/nvme0n1</Code> (controller 0, namespace 1), with partitions as <Code>/dev/nvme0n1p1</Code>, <Code>/dev/nvme0n1p2</Code>, etc. Recognizing <Code>sd*</Code> vs. <Code>nvme*</Code> tells you immediately what storage hardware you're dealing with.
      </p>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        GPUs are files too. In a hyperscale GPU training cluster, the compute nodes are packed with NVIDIA GPUs — and the kernel exposes each one as a device file (<Code>/dev/nvidia0</Code>, <Code>/dev/nvidia1</Code>, etc.). When you run <Code>nvidia-smi</Code> to check GPU health, it reads status through this device-file interface. The "everything is a file" philosophy is not academic — it is how you interact with the hardware that powers the compute infrastructure.
      </p>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        You can literally read <Code>/proc/cpuinfo</Code> as if it were a text file and see your CPU details. The kernel generates this content on the fly when you read it — the "file" does not exist on disk. This means the same tools you use to work with regular files (<Code>cat</Code>, <Code>grep</Code>, <Code>less</Code>) also work for inspecting hardware and kernel state. One set of tools, consistent interface.
      </p>

      <KnowledgeCheck
        question="What is the difference between /dev/sda and a regular file like /home/ops/notes.txt? Both appear in the filesystem — what makes them fundamentally different?"
        correctAnswer="/dev/sda is a device file — it represents a physical hard disk. Reading or writing to it interacts with the disk hardware through the kernel. /home/ops/notes.txt is a regular file — its data is stored as blocks on a filesystem. The device file is an interface to hardware; the regular file is stored data."
        onComplete={() => markComplete("s5-kc")}
      />
    </div>
  );
}

function Section6({ markComplete }) {
  return (
    <div>
      <h2 style={{ color: "#E8ECF0", fontSize: 18, fontWeight: 700, margin: "0 0 6px 0" }}>6. Users, Groups, and Ownership</h2>
      <p style={{ color: "var(--color-v2-text-muted)", fontSize: 11, marginTop: 0, marginBottom: 16, fontStyle: "italic" }}>Isolation and access control — the foundation of Linux security.</p>

      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        Linux is a <strong style={{ color: "#E8ECF0" }}>multi-user</strong> system. Even when only one person is logged in, the system has multiple user accounts operating behind the scenes — each service (web server, database, logging daemon) typically runs as its own user.
      </p>

      <SectionHeading>Why Multi-User Matters</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        Isolation. If the web server is compromised by an attacker, the damage is limited to what the <Code>www-data</Code> user can access. It cannot read database files owned by the <Code>postgres</Code> user. It cannot modify system configuration owned by <Code>root</Code>.
      </p>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        Every file and process has an <strong style={{ color: "#E8ECF0" }}>owner</strong> (a user) and a <strong style={{ color: "#E8ECF0" }}>group</strong>. Access is controlled based on three categories: the <strong style={{ color: "#FF6B6B" }}>User</strong> (owner, usually who created it), the <strong style={{ color: "#FFA832" }}>Group</strong> (a named collection of users), and <strong style={{ color: "#7AE87A" }}>Others</strong> (everyone else on the system).
      </p>

      <SectionHeading>The root Account</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        <Code>root</Code> is the superuser — unrestricted access to every file, process, and system function. Root can delete any file, kill any process, and modify any configuration.
      </p>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        Because of this power, you almost never log in as root directly. Instead, you log in as a normal user and use <Code>sudo</Code> (superuser do) to execute specific commands with root privileges when necessary. This creates an audit trail and reduces catastrophic accidents.
      </p>

      <ThinkAboutIt
        scenario="Why is it dangerous to do routine work as root? Imagine typing `rm -rf /` as root vs. as a normal user."
        answer="Root would begin deleting the entire filesystem — every file, every directory, the OS itself. A normal user would be stopped by permission errors on the first system directory. The principle: use the minimum privilege necessary for the task."
        onComplete={() => markComplete("s6-think")}
      />

      <SectionHeading>Permissions — The Access Control Model</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        Every file has three permission sets: one for the owner, one for the group, and one for everyone else. Each set can grant three abilities:
      </p>
      <InfoTable
        headers={["Permission", "On a File", "On a Directory"]}
        rows={[
          [<span><strong style={{ color: "#50C8FF" }}>Read</strong> (r)</span>, "View the file's contents", "List the directory's contents"],
          [<span><strong style={{ color: "#50C8FF" }}>Write</strong> (w)</span>, "Modify the file", "Create or delete files in the directory"],
          [<span><strong style={{ color: "#50C8FF" }}>Execute</strong> (x)</span>, "Run the file as a program", "Enter (cd into) the directory"],
        ]}
      />
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        These permissions are displayed as a string like <Code>rwxr-xr--</Code>, which reads as three groups of three characters — owner, group, others.
      </p>

      <SectionHeading>Octal (Numeric) Notation</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        While <Code>rwxr-xr--</Code> is how Linux <em>displays</em> permissions, the <Code>chmod</Code> command often uses a shorthand: a three-digit number called <strong style={{ color: "#E8ECF0" }}>octal notation</strong>. Each permission bit has a numeric value:
      </p>
      <OctalFlipCards />
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        For each group (owner, group, others), you <strong style={{ color: "#E8ECF0" }}>sum the values</strong> of the granted permissions. The result is a single digit from 0 to 7. Three digits — one per group — give you the full permission.
      </p>

      <div style={{
        background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "16px 20px", margin: "14px 0 20px",
        border: "1px solid rgba(80,200,255,0.1)", fontFamily: "'JetBrains Mono', monospace",
      }}>
        <div style={{ color: "var(--color-v2-text-muted)", fontSize: 10, marginBottom: 10, fontFamily: "'Chakra Petch', sans-serif", letterSpacing: "0.5px" }}>EXAMPLE: CONVERTING rwxr-xr-- TO OCTAL</div>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 16px", fontSize: 11 }}>
          <span style={{ color: "#FF6B6B", fontWeight: 700 }}>Owner:</span>
          <span style={{ color: "#C8CCD0" }}>rwx = 4 + 2 + 1 = <strong style={{ color: "#E8ECF0" }}>7</strong></span>
          <span style={{ color: "#FFA832", fontWeight: 700 }}>Group:</span>
          <span style={{ color: "#C8CCD0" }}>r-x = 4 + 0 + 1 = <strong style={{ color: "#E8ECF0" }}>5</strong></span>
          <span style={{ color: "#7AE87A", fontWeight: 700 }}>Others:</span>
          <span style={{ color: "#C8CCD0" }}>r-- = 4 + 0 + 0 = <strong style={{ color: "#E8ECF0" }}>4</strong></span>
        </div>
        <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 10 }}>
          <span style={{ color: "var(--color-v2-text-muted)", fontSize: 10 }}>Result: </span>
          <span style={{ color: "#50C8FF", fontSize: 15, fontWeight: 700 }}>754</span>
          <span style={{ color: "var(--color-v2-text-muted)", fontSize: 10 }}> — so <Code>chmod 754 file</Code> sets these exact permissions.</span>
        </div>
      </div>

      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        Common patterns you will see everywhere:
      </p>
      <InfoTable
        headers={["Octal", "String", "Meaning"]}
        rows={[
          [<Code>755</Code>, <Code>rwxr-xr-x</Code>, "Owner: full. Everyone else: read + execute. Default for scripts and directories."],
          [<Code>644</Code>, <Code>rw-r--r--</Code>, "Owner: read + write. Everyone else: read only. Default for most files."],
          [<Code>700</Code>, <Code>rwx------</Code>, "Owner only. Private scripts, SSH keys."],
          [<Code>600</Code>, <Code>rw-------</Code>, "Owner read + write only. Private config files."],
          [<Code>444</Code>, <Code>r--r--r--</Code>, "Read-only for everyone. Protected reference files."],
        ]}
      />

      <PermissionBuilder onComplete={() => markComplete("s6-perm")} />

      <KnowledgeCheck
        question="A script file has permissions r-x------. Who can run it? Who can modify it? Can other users on the system even read it?"
        correctAnswer="The owner can read and execute it (r-x). Nobody can modify it (no 'w' in any position). Group and others have no permissions at all (------), so they cannot read, write, or execute it."
        onComplete={() => markComplete("s6-kc")}
      />
    </div>
  );
}

function Section7({ markComplete }) {
  return (
    <div>
      <h2 style={{ color: "#E8ECF0", fontSize: 18, fontWeight: 700, margin: "0 0 6px 0" }}>7. Processes — Programs in Motion</h2>
      <p style={{ color: "var(--color-v2-text-muted)", fontSize: 11, marginTop: 0, marginBottom: 16, fontStyle: "italic" }}>A program is a file on disk. A process is that file alive in memory.</p>

      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        A <strong style={{ color: "#E8ECF0" }}>program</strong> is a file on disk — a set of instructions. A <strong style={{ color: "#E8ECF0" }}>process</strong> is what happens when that program is loaded into memory and begins executing. The same program can have multiple processes running simultaneously (e.g., multiple users each running their own instance of a text editor).
      </p>

      <SectionHeading>Process Lifecycle</SectionHeading>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 8, margin: "12px 0 20px" }}>
        {[
          { phase: "1. Creation", desc: "A process is started. The kernel assigns it a unique Process ID (PID).", color: "#7AE87A" },
          { phase: "2. Running", desc: "The process executes on a CPU core. The kernel's scheduler shares CPU time.", color: "#50C8FF" },
          { phase: "3. Waiting", desc: "The process may pause — waiting for disk I/O, network data, or user input.", color: "#FFA832" },
          { phase: "4. Termination", desc: "The process finishes (or is killed). Exit code 0 = success; non-zero = error.", color: "#FF6B6B" },
        ].map((item, i) => (
          <div key={i} style={{
            padding: "12px 14px", borderRadius: 8, background: "rgba(255,255,255,0.02)",
            border: `1px solid ${item.color}22`,
          }}>
            <div style={{ color: item.color, fontWeight: 700, fontSize: 10, marginBottom: 6 }}>{item.phase}</div>
            <div style={{ color: "#B8BCC0", fontSize: 11, lineHeight: 1.5 }}>{item.desc}</div>
          </div>
        ))}
      </div>

      <SectionHeading>Foreground vs. Background</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        When you run a command in the terminal, it runs in the <strong style={{ color: "#E8ECF0" }}>foreground</strong> — your terminal is occupied until the command finishes. You can run commands in the <strong style={{ color: "#E8ECF0" }}>background</strong> by adding <Code>&</Code> to the end, which frees your terminal immediately.
      </p>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        On a server, many processes run in the background permanently: web servers, databases, monitoring agents. These are managed by a <strong style={{ color: "#E8ECF0" }}>service manager</strong> (on modern Linux, this is <Code>systemd</Code>), which starts them at boot, restarts them if they crash, and lets administrators control them.
      </p>

      <SectionHeading>Signals — Talking to Processes</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        The OS communicates with processes through <strong style={{ color: "#E8ECF0" }}>signals</strong> — standardized messages. Two are fundamental:
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "12px 0" }}>
        <div style={{ padding: 14, borderRadius: 8, background: "rgba(255,168,50,0.06)", border: "1px solid rgba(255,168,50,0.2)" }}>
          <div style={{ color: "#FFA832", fontWeight: 700, fontSize: 11 }}>SIGTERM (Signal 15)</div>
          <div style={{ color: "#B8BCC0", fontSize: 11, lineHeight: 1.6, marginTop: 4 }}>"Please shut down gracefully." The process can save its state, close files, and exit cleanly.</div>
        </div>
        <div style={{ padding: 14, borderRadius: 8, background: "rgba(255,68,68,0.06)", border: "1px solid rgba(255,68,68,0.2)" }}>
          <div style={{ color: "#FF4444", fontWeight: 700, fontSize: 11 }}>SIGKILL (Signal 9)</div>
          <div style={{ color: "#B8BCC0", fontSize: 11, lineHeight: 1.6, marginTop: 4 }}>"Stop immediately." Terminated by the kernel with no chance to clean up. Use only when SIGTERM fails.</div>
        </div>
      </div>

      <SignalSimulator onComplete={() => markComplete("s7-sig")} />

      <SectionHeading>Daemons — The Silent Workers</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        A <strong style={{ color: "#E8ECF0" }}>daemon</strong> is a background process that runs continuously, usually started at boot, providing a service. The SSH server (<Code>sshd</Code>) that lets you connect remotely is a daemon. The logging service (<Code>rsyslog</Code> or <Code>journald</Code>) is a daemon. The time synchronization service (<Code>chronyd</Code> or <Code>ntpd</Code>) is a daemon.
      </p>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        Daemons are the workhorses of a server. Most troubleshooting involves checking whether a daemon is running, why it stopped, or what it is logging.
      </p>

      <KnowledgeCheck
        question="What is the difference between a program and a process? Can one program have multiple processes running at the same time?"
        correctAnswer="A program is a file on disk (the instructions). A process is an active instance of that program loaded into memory and executing. Yes — if five users each open the same text editor, there are five processes running from one program."
        onComplete={() => markComplete("s7-kc")}
      />
    </div>
  );
}

function Section8({ markComplete }) {
  return (
    <div>
      <h2 style={{ color: "#E8ECF0", fontSize: 18, fontWeight: 700, margin: "0 0 6px 0" }}>8. Networking Fundamentals</h2>
      <p style={{ color: "var(--color-v2-text-muted)", fontSize: 11, marginTop: 0, marginBottom: 16, fontStyle: "italic" }}>The fabric that connects everything in the datacenter.</p>

      <SectionHeading>IP Addresses — The Mailing Address</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        Every device on a network has an <strong style={{ color: "#E8ECF0" }}>IP address</strong> — a numerical identifier that allows other devices to find it and send it data. <strong style={{ color: "#E8ECF0" }}>IPv4</strong> addresses look like <Code>192.168.1.100</Code> — four numbers (0-255) separated by dots, giving roughly 4.3 billion possible addresses.
      </p>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        Some address ranges are reserved for internal (private) networks — not routable on the public internet:
      </p>
      <InfoTable
        headers={["Range", "Typical Use"]}
        rows={[
          [<Code>10.0.0.0/8</Code>, "Large private networks (datacenters, enterprises)"],
          [<Code>172.16.0.0/12</Code>, "Medium private networks"],
          [<Code>192.168.0.0/16</Code>, "Small private networks (home routers)"],
        ]}
      />
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        Datacenters typically use <Code>10.x.x.x</Code> addressing internally because the range is large enough for thousands of servers, switches, and management interfaces.
      </p>

      <SectionHeading>Ports — The Apartment Number</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        An IP address identifies a machine. A <strong style={{ color: "#E8ECF0" }}>port</strong> identifies a specific service on that machine. If the IP is the building's street address, the port is the apartment number. Port numbers range from 0 to 65535. Ports below 1024 are "well-known" and reserved for standard services:
      </p>
      <InfoTable
        headers={["Port", "Service"]}
        rows={[
          ["22", "SSH (remote shell access)"],
          ["80", "HTTP (web, unencrypted)"],
          ["443", "HTTPS (web, encrypted)"],
          ["53", "DNS (name resolution)"],
        ]}
      />

      <SectionHeading>Protocols — The Language</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        A <strong style={{ color: "#E8ECF0" }}>protocol</strong> is a set of rules for how data is formatted and transmitted. <strong style={{ color: "#E8ECF0" }}>TCP</strong> (Transmission Control Protocol) provides reliable, ordered delivery — packets arrive in order, lost ones are retransmitted. Used for SSH, HTTP, databases. <strong style={{ color: "#E8ECF0" }}>UDP</strong> (User Datagram Protocol) is fast with no guarantees — packets are sent without confirmation. Used for DNS queries, video streaming, and monitoring metrics.
      </p>

      <NetworkAddressBuilder />

      <SectionHeading>DNS — Names to Numbers</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        Humans remember names (<Code>google.com</Code>). Computers use IP addresses (<Code>142.250.80.46</Code>). <strong style={{ color: "#E8ECF0" }}>DNS</strong> (Domain Name System) translates between the two. In a datacenter, internal DNS is critical. Servers are referenced by hostname (e.g., <Code>gpu-rack03-node12</Code>), and DNS maps that name to its IP. If DNS breaks, almost everything that uses hostnames breaks with it — even if the network itself is fine.
      </p>

      <ThinkAboutIt
        scenario='A technician reports "the server is unreachable." You can access other servers on the same network just fine. Before assuming the server is down, what simpler failure could explain the symptom?'
        hint="What if the name-to-IP translation failed?"
        answer="DNS failure. If the DNS server is down or the hostname's DNS record is missing/incorrect, the name won't resolve to an IP address — making the server appear unreachable even though it's running perfectly fine. Always try pinging the IP address directly to rule out DNS before assuming a server is down."
        onComplete={() => markComplete("s8-think")}
      />

      <SectionHeading>SSH — Remote Access</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        <strong style={{ color: "#E8ECF0" }}>SSH</strong> (Secure Shell) is how you access Linux servers remotely. It creates an encrypted connection between your machine and the server, giving you a command line on the remote system.
      </p>
      <CodeBlock label="CONNECT TO A REMOTE SERVER">{`ssh username@192.168.1.50`}</CodeBlock>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        This connects to the server at <Code>192.168.1.50</Code>, authenticates as <Code>username</Code>, and drops you into a shell on that machine. Every command you type is executed on the remote server, not your local machine.
      </p>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        SSH is the single most important protocol for datacenter operations. Without it, you would need physical access to every server — impractical when they are racked in a datacenter miles away.
      </p>

      <KnowledgeCheck
        question="A service is running on a server with IP 10.0.5.20 and is listening on port 443. What does each piece of that information (IP, port) tell you?"
        correctAnswer="The IP address 10.0.5.20 identifies the specific server on the network. Port 443 identifies the specific service (HTTPS) running on that server. Together, they form a complete destination: which machine and which service on that machine."
        onComplete={() => markComplete("s8-kc")}
      />
    </div>
  );
}

function Section9({ markComplete }) {
  return (
    <div>
      <h2 style={{ color: "#E8ECF0", fontSize: 18, fontWeight: 700, margin: "0 0 6px 0" }}>9. Servers and the Datacenter Context</h2>
      <p style={{ color: "var(--color-v2-text-muted)", fontSize: 11, marginTop: 0, marginBottom: 16, fontStyle: "italic" }}>Where the hardware lives and how it all stays running.</p>

      <SectionHeading>What Makes a Server a Server?</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        A server is a computer optimized for running services continuously rather than for interactive human use. Physically, a server typically:
      </p>
      <div style={{ display: "grid", gap: 6, margin: "10px 0 20px" }}>
        {[
          "Mounts in a standard 19-inch rack (measured in rack units or 'U' — 1U = 1.75 inches tall)",
          "Has redundant power supplies (two PSUs so it survives if one fails)",
          "Has multiple high-speed network connections",
          "Has hot-swappable components (drives, fans, sometimes PSUs) replaceable without shutting down",
          "Has a BMC/IPMI (Baseboard Management Controller) — a small embedded computer on the motherboard for out-of-band management",
          "Has no monitor, keyboard, or mouse attached",
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", color: "#C0C4C8", fontSize: 11, lineHeight: 1.6 }}>
            <span style={{ color: "#50C8FF", marginTop: 2, flexShrink: 0 }}>›</span>
            <span>{item}</span>
          </div>
        ))}
      </div>

      <SectionHeading>Headless Operation</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        Servers run <strong style={{ color: "#E8ECF0" }}>headless</strong> — no graphical display. You interact with them entirely over the network via SSH. If the OS crashes and SSH stops working, you use the BMC/IPMI to access a virtual console — a text-based display streamed over the network from the management controller.
      </p>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        This is why the command line is not optional for datacenter work. There is no fallback GUI. The CLI is the interface.
      </p>

      <SectionHeading>The Datacenter Environment</SectionHeading>
      <div style={{ display: "grid", gap: 12, margin: "12px 0" }}>
        {[
          { title: "Racks", desc: "Standardized metal frames that hold servers. A standard rack is 42U tall and holds a mix of servers, switches, and cable management.", color: "#50C8FF" },
          { title: "Power", desc: "Servers connect to Power Distribution Units (PDUs) mounted in the rack. Redundancy is key: dual power feeds, battery backup (UPS), and diesel generators ensure servers stay running during outages.", color: "#FFA832" },
          { title: "Cooling", desc: "Servers generate significant heat. Cooling systems (CRAC/CRAH units, hot aisle/cold aisle containment, sometimes liquid cooling) remove heat continuously. If cooling fails, servers thermal-throttle or shut down.", color: "#7AE87A" },
          { title: "Networking", desc: "Each rack typically has a Top-of-Rack (ToR) switch that aggregates connections from all servers and uplinks to the core network. The hierarchy: server NICs → ToR switches → aggregation/spine switches → core.", color: "#FF6B6B" },
        ].map((item, i) => (
          <div key={i} style={{
            padding: "14px 18px", borderRadius: 8, background: "rgba(255,255,255,0.02)",
            borderLeft: `3px solid ${item.color}`,
          }}>
            <strong style={{ color: item.color }}>{item.title}</strong>
            <span style={{ color: "#B8BCC0", fontSize: 11 }}> — {item.desc}</span>
          </div>
        ))}
      </div>

      <RackDiagnosis onComplete={() => markComplete("s9-rack")} />

      <KnowledgeCheck
        question="What is the BMC/IPMI, and why is it critical for datacenter operations? What can it do that SSH cannot?"
        correctAnswer="The BMC/IPMI is an independent management controller embedded on the server's motherboard. It provides remote power control (on, off, reboot), a virtual console (video output over the network), and hardware sensor data (temperatures, fan speeds, voltages) — all of which work even when the server's main OS is completely unresponsive. SSH requires the OS to be running; BMC/IPMI does not."
        onComplete={() => markComplete("s9-kc")}
      />
    </div>
  );
}

function Section10({ markComplete }) {
  return (
    <div>
      <h2 style={{ color: "#E8ECF0", fontSize: 18, fontWeight: 700, margin: "0 0 6px 0" }}>10. Putting It All Together</h2>
      <p style={{ color: "var(--color-v2-text-muted)", fontSize: 11, marginTop: 0, marginBottom: 16, fontStyle: "italic" }}>The mental model you need before Level 2.</p>

      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        Before you proceed to Level 2, you should be able to hold this complete mental model:
      </p>

      <div style={{ display: "grid", gap: 8, margin: "16px 0 20px" }}>
        {[
          { text: "A server is a headless computer in a rack, running Linux, managed remotely over a network.", color: "#FF6B6B" },
          { text: "Linux is the operating system — specifically a kernel plus distribution tools — that manages the server's hardware and provides a command-line interface.", color: "#FFA832" },
          { text: "You connect to the server via SSH, landing in a shell (Bash) where you type commands.", color: "#50C8FF" },
          { text: "Commands follow a consistent structure: command [options] [arguments]. They operate on files, processes, and system resources.", color: "#7AE87A" },
          { text: "Files live in a single directory tree rooted at /, with standardized locations for logs, configuration, and hardware abstractions.", color: "#FF6B6B" },
          { text: "Permissions control who can access what. Users and groups define identity. Read, write, and execute bits define access.", color: "#FFA832" },
          { text: "Processes are running programs. They are created, scheduled by the kernel, and terminated. Services (daemons) run in the background managed by systemd.", color: "#50C8FF" },
          { text: "Networking connects everything: IP addresses identify machines, ports identify services, protocols define the conversation rules, and DNS translates names to addresses.", color: "#7AE87A" },
        ].map((item, i) => (
          <div key={i} style={{
            padding: "12px 16px", borderRadius: 8, background: "rgba(255,255,255,0.02)",
            borderLeft: `3px solid ${item.color}`, color: "#C8CCD0", fontSize: 11, lineHeight: 1.6,
          }}>{item.text}</div>
        ))}
      </div>

      <div style={{
        padding: 18, borderRadius: 10, margin: "14px 0",
        background: "linear-gradient(135deg, rgba(80,200,255,0.06), rgba(255,168,50,0.04))",
        border: "1px solid rgba(80,200,255,0.2)",
      }}>
        <div style={{ color: "#FFA832", fontWeight: 700, fontSize: 11, marginBottom: 8 }}>TROUBLESHOOTING MENTAL MODEL</div>
        <p style={{ color: "#D0D4D8", fontSize: 11, lineHeight: 1.55, margin: 0 }}>
          <strong style={{ color: "#E8ECF0" }}>When something breaks</strong>, use this mental model to reason about the problem: Is it a <strong style={{ color: "#FF6B6B" }}>hardware</strong> issue (CPU, RAM, disk, network card)? An <strong style={{ color: "#FFA832" }}>OS</strong> issue (process crash, filesystem full, permission denied)? A <strong style={{ color: "#50C8FF" }}>network</strong> issue (DNS, connectivity, firewall)? A <strong style={{ color: "#7AE87A" }}>service</strong> issue (daemon stopped, misconfigured)? Each category has different tools and different symptoms.
        </p>
      </div>

      <SectionHeading>Quick Reference — Rapid-Fire Flashcards</SectionHeading>
      <p style={{ color: "#D0D4D8", fontSize: 12, lineHeight: 1.55 }}>
        Lock in every concept from this module. Type your definition, flip the card, then self-rate. No multiple choice — you have to produce the answer.
      </p>

      <FlashcardRapidFire />
    </div>
  );
}
