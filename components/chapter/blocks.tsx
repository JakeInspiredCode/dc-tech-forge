"use client";

import { useMemo, useState, type ReactNode } from "react";
import type {
  CalloutVariant,
  CollapsibleItem,
  FillBlankSlot,
  FlipCardItem,
  InlineChoice,
  TableCell,
} from "@/lib/types/chapter";
import { Prose } from "./prose";

// ─── Heading ────────────────────────────────────────────────────────────────

export function Heading({
  level,
  text,
  subtitle,
}: {
  level: 2 | 3;
  text: string;
  subtitle?: string;
}) {
  if (level === 2) {
    return (
      <>
        <h2
          style={{
            color: "#E8ECF0",
            fontSize: 18,
            fontWeight: 700,
            margin: "0 0 6px 0",
            lineHeight: 1.3,
          }}
        >
          {text}
        </h2>
        {subtitle && (
          <p
            style={{
              color: "var(--color-v2-text-muted)",
              fontSize: 11,
              marginTop: 0,
              marginBottom: 16,
              fontStyle: "italic",
            }}
          >
            {subtitle}
          </p>
        )}
      </>
    );
  }
  return (
    <h3
      style={{
        color: "#E8ECF0",
        fontSize: 15,
        fontWeight: 700,
        margin: "20px 0 10px 0",
        lineHeight: 1.3,
      }}
    >
      {text}
    </h3>
  );
}

// ─── CodeBlock ──────────────────────────────────────────────────────────────

export function CodeBlock({
  code,
  label,
}: {
  code: string;
  label?: string;
  language?: string;
}) {
  return (
    <div style={{ margin: "12px 0" }}>
      {label && (
        <div
          style={{
            color: "var(--color-v2-text-muted)",
            fontSize: 10,
            fontWeight: 600,
            marginBottom: 4,
            letterSpacing: "0.5px",
          }}
        >
          {label}
        </div>
      )}
      <pre
        style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(80,200,255,0.12)",
          borderRadius: 8,
          padding: "14px 16px",
          overflowX: "auto",
          margin: 0,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: 11,
          lineHeight: 1.6,
          color: "#C8D8E8",
        }}
      >
        {code}
      </pre>
    </div>
  );
}

// ─── InfoTable ──────────────────────────────────────────────────────────────

function renderCell(cell: TableCell, key: string): ReactNode {
  if (typeof cell === "string") {
    return <Prose text={cell} key={key} />;
  }
  return (
    <code
      key={key}
      style={{
        background: "rgba(80,200,255,0.1)",
        color: "#7DD8FF",
        padding: "2px 7px",
        borderRadius: 4,
        fontSize: "0.92em",
        fontFamily:
          "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      }}
    >
      {cell.code}
    </code>
  );
}

export function InfoTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: TableCell[][];
}) {
  return (
    <div style={{ overflowX: "auto", margin: "12px 0" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  textAlign: "left",
                  padding: "10px 14px",
                  borderBottom: "2px solid rgba(80,200,255,0.3)",
                  color: "#50C8FF",
                  fontWeight: 700,
                  fontSize: 10,
                  letterSpacing: "0.5px",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              style={{
                background: ri % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
              }}
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    color: "#C8CCD0",
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ display: "block" }}>
                    {renderCell(cell, `${ri}-${ci}`)}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Bullets ────────────────────────────────────────────────────────────────

const BULLET_COLORS = ["#50C8FF", "#FFA832", "#7AE87A", "#FF6B6B", "#C58AFF"];

export function Bullets({ items }: { items: string[] }) {
  return (
    <div style={{ display: "grid", gap: 6, margin: "10px 0 14px" }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
            color: "#C0C4C8",
            fontSize: 11,
            lineHeight: 1.6,
          }}
        >
          <span
            style={{
              color: BULLET_COLORS[i % BULLET_COLORS.length],
              marginTop: 2,
              flexShrink: 0,
              fontWeight: 700,
            }}
          >
            ›
          </span>
          <Prose text={item} />
        </div>
      ))}
    </div>
  );
}

// ─── Callout ────────────────────────────────────────────────────────────────

const CALLOUT_STYLES: Record<
  CalloutVariant,
  { accent: string; bg: string; label: string; icon: string }
> = {
  info: {
    accent: "#50C8FF",
    bg: "rgba(80,200,255,0.08)",
    label: "NOTE",
    icon: "◇",
  },
  warning: {
    accent: "#FFA832",
    bg: "rgba(255,170,50,0.08)",
    label: "WATCH OUT",
    icon: "⚠",
  },
  troubleshooting: {
    accent: "#FF6B6B",
    bg: "rgba(255,107,107,0.08)",
    label: "WHEN IT BREAKS",
    icon: "✦",
  },
};

export function Callout({
  variant,
  title,
  body,
}: {
  variant: CalloutVariant;
  title?: string;
  body: string;
}) {
  const s = CALLOUT_STYLES[variant];
  return (
    <div
      style={{
        padding: "14px 18px",
        borderRadius: 10,
        margin: "14px 0",
        background: s.bg,
        border: `1px solid ${s.accent}33`,
        borderLeft: `3px solid ${s.accent}`,
      }}
    >
      <div
        style={{
          color: s.accent,
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: "0.5px",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span>{s.icon}</span>
        {title ? title.toUpperCase() : s.label}
      </div>
      <Prose text={body} />
    </div>
  );
}

// ─── ThinkAboutIt ───────────────────────────────────────────────────────────

export function ThinkAboutIt({
  scenario,
  hint,
  answer,
}: {
  scenario: string;
  hint?: string;
  answer: string;
}) {
  const [userAnswer, setUserAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);

  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(255,170,50,0.08), rgba(255,120,20,0.04))",
        border: "1px solid rgba(255,170,50,0.25)",
        borderLeft: "3px solid #FFA832",
        borderRadius: 8,
        padding: "18px 20px",
        margin: "14px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
          color: "#FFA832",
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: "0.5px",
        }}
      >
        <span style={{ fontSize: 12 }}>⚡</span> THINK ABOUT IT
      </div>
      <div style={{ color: "#E0D8CF" }}>
        <Prose text={scenario} />
      </div>
      {hint && (
        <p
          style={{
            color: "#A09080",
            fontSize: 11,
            fontStyle: "italic",
            margin: "0 0 12px 0",
          }}
        >
          Hint: {hint}
        </p>
      )}
      {!revealed && (
        <>
          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Try to answer before revealing — or reveal when ready..."
            style={{
              width: "100%",
              minHeight: 70,
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,170,50,0.2)",
              borderRadius: 6,
              padding: 12,
              color: "#E8E0D8",
              fontSize: 11,
              fontFamily: "inherit",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={() => setRevealed(true)}
            style={{
              marginTop: 10,
              padding: "8px 20px",
              background: "#FFA832",
              border: "none",
              borderRadius: 6,
              color: "#1A1A2E",
              fontWeight: 700,
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            Reveal Insight
          </button>
        </>
      )}
      {revealed && (
        <>
          <div
            style={{
              marginTop: 12,
              padding: 14,
              background: "rgba(255,170,50,0.1)",
              borderRadius: 6,
              border: "1px solid rgba(255,170,50,0.2)",
            }}
          >
            <div
              style={{
                color: "#FFA832",
                fontWeight: 700,
                fontSize: 10,
                marginBottom: 6,
              }}
            >
              INSIGHT
            </div>
            <div style={{ color: "#E8E0D8" }}>
              <Prose text={answer} />
            </div>
          </div>
          <button
            onClick={() => {
              setUserAnswer("");
              setRevealed(false);
            }}
            style={{
              marginTop: 10,
              padding: "6px 14px",
              background: "transparent",
              border: "1px solid rgba(255,170,50,0.35)",
              borderRadius: 6,
              color: "#FFC878",
              fontWeight: 600,
              fontSize: 10,
              cursor: "pointer",
            }}
          >
            ↻ Try Again
          </button>
        </>
      )}
    </div>
  );
}

// ─── KnowledgeCheck ─────────────────────────────────────────────────────────

export function KnowledgeCheck({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [userAnswer, setUserAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [confidence, setConfidence] = useState<string | null>(null);

  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(80,200,255,0.08), rgba(40,140,255,0.04))",
        border: "1px solid rgba(80,200,255,0.25)",
        borderLeft: "3px solid #50C8FF",
        borderRadius: 8,
        padding: "18px 20px",
        margin: "14px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
          color: "#50C8FF",
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: "0.5px",
        }}
      >
        <span style={{ fontSize: 12 }}>◇</span> KNOWLEDGE CHECK
      </div>
      <div style={{ color: "#E0E4E8", fontWeight: 500 }}>
        <Prose text={question} />
      </div>
      {!revealed && (
        <>
          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Try to answer before checking — or check when ready..."
            style={{
              width: "100%",
              minHeight: 70,
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(80,200,255,0.2)",
              borderRadius: 6,
              padding: 12,
              color: "#E8E8F0",
              fontSize: 11,
              fontFamily: "inherit",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 10,
              flexWrap: "wrap",
            }}
          >
            <span style={{ color: "var(--color-v2-text-muted)", fontSize: 10, marginRight: 4 }}>
              Confidence:
            </span>
            {["Sure", "Unsure", "Guessing"].map((c) => (
              <button
                key={c}
                onClick={() => setConfidence(c)}
                style={{
                  padding: "5px 14px",
                  borderRadius: 20,
                  background:
                    confidence === c
                      ? c === "Sure"
                        ? "#2A8A4A"
                        : c === "Unsure"
                        ? "#AA7A20"
                        : "#AA3030"
                      : "rgba(255,255,255,0.05)",
                  border:
                    confidence === c
                      ? "none"
                      : "1px solid rgba(255,255,255,0.15)",
                  color: confidence === c ? "#FFF" : "var(--color-v2-text-muted)",
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {c}
              </button>
            ))}
            <button
              onClick={() => setRevealed(true)}
              style={{
                marginLeft: "auto",
                padding: "8px 20px",
                background: "#50C8FF",
                border: "none",
                borderRadius: 6,
                color: "#1A1A2E",
                fontWeight: 700,
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              Check Answer
            </button>
          </div>
        </>
      )}
      {revealed && (
        <>
          <div
            style={{
              marginTop: 12,
              padding: 14,
              background: "rgba(80,200,255,0.08)",
              borderRadius: 6,
              border: "1px solid rgba(80,200,255,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <span style={{ color: "#50C8FF", fontWeight: 700, fontSize: 10 }}>
                ANSWER
              </span>
              {confidence && (
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 10px",
                    borderRadius: 10,
                    background:
                      confidence === "Sure"
                        ? "rgba(42,138,74,0.3)"
                        : confidence === "Unsure"
                        ? "rgba(170,122,32,0.3)"
                        : "rgba(170,48,48,0.3)",
                    color:
                      confidence === "Sure"
                        ? "#5ADA7A"
                        : confidence === "Unsure"
                        ? "#DDAA44"
                        : "#EE6666",
                  }}
                >
                  You were: {confidence}
                </span>
              )}
            </div>
            <div style={{ color: "#E8E8F0" }}>
              <Prose text={answer} />
            </div>
          </div>
          <button
            onClick={() => {
              setUserAnswer("");
              setRevealed(false);
              setConfidence(null);
            }}
            style={{
              marginTop: 10,
              padding: "6px 14px",
              background: "transparent",
              border: "1px solid rgba(80,200,255,0.35)",
              borderRadius: 6,
              color: "#9CD8FF",
              fontWeight: 600,
              fontSize: 10,
              cursor: "pointer",
            }}
          >
            ↻ Try Again
          </button>
        </>
      )}
    </div>
  );
}

// ─── WhyThisMatters ─────────────────────────────────────────────────────────

export function WhyThisMatters({ body }: { body: string }) {
  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(197,138,255,0.10), rgba(139,92,246,0.05))",
        border: "1px solid rgba(197,138,255,0.25)",
        borderLeft: "3px solid #C58AFF",
        borderRadius: 10,
        padding: "16px 20px",
        margin: "14px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
          color: "#C58AFF",
          fontWeight: 800,
          fontSize: 10,
          letterSpacing: "0.8px",
          textTransform: "uppercase",
        }}
      >
        <span style={{ fontSize: 11 }}>✦</span> Why this matters
      </div>
      <Prose text={body} />
    </div>
  );
}

// ─── Collapsible ────────────────────────────────────────────────────────────

const COLLAPSIBLE_COLORS = ["#50C8FF", "#FFA832", "#7AE87A", "#FF6B6B", "#C58AFF", "#5AD0D0"];

export function Collapsible({
  intro,
  items,
}: {
  intro?: string;
  items: CollapsibleItem[];
}) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const toggle = (i: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div style={{ margin: "12px 0 14px" }}>
      {intro && (
        <div style={{ marginBottom: 6 }}>
          <Prose text={intro} />
        </div>
      )}
      <div style={{ display: "grid", gap: 8 }}>
        {items.map((item, i) => {
          const color = item.color ?? COLLAPSIBLE_COLORS[i % COLLAPSIBLE_COLORS.length];
          const isOpen = expanded.has(i);
          return (
            <div
              key={i}
              onClick={() => toggle(i)}
              style={{
                padding: "14px 18px",
                borderRadius: 8,
                background: isOpen
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(255,255,255,0.02)",
                borderLeft: `3px solid ${color}`,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <strong style={{ color, fontSize: 11 }}>{item.title}</strong>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {!isOpen && (
                    <span
                      style={{
                        color: "var(--color-v2-text-muted)",
                        fontSize: 10,
                        fontStyle: "italic",
                      }}
                    >
                      click to expand
                    </span>
                  )}
                  <span
                    style={{
                      color: "var(--color-v2-text-muted)",
                      fontSize: 10,
                      flexShrink: 0,
                      transition: "transform 0.2s",
                      transform: isOpen ? "rotate(90deg)" : "none",
                    }}
                  >
                    ▸
                  </span>
                </div>
              </div>
              {isOpen && (
                <div style={{ marginTop: 10 }}>
                  <Prose text={item.body} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── FillBlank ──────────────────────────────────────────────────────────────

function normalize(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[.,!?'"`]/g, "")
    .replace(/\s+/g, " ");
}

function matches(input: string, slot: FillBlankSlot) {
  const norm = normalize(input);
  if (norm === normalize(slot.answer)) return true;
  if (slot.alternates) {
    for (const alt of slot.alternates) {
      if (norm === normalize(alt)) return true;
    }
  }
  return false;
}

export function FillBlank({
  prompt,
  sentence,
  blanks,
  reveal,
}: {
  prompt: string;
  sentence: string;
  blanks: FillBlankSlot[];
  reveal: string;
}) {
  const [values, setValues] = useState<string[]>(() => blanks.map(() => ""));
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const parts = useMemo(() => sentence.split(/(\{\d+\})/g), [sentence]);
  const correctCount = useMemo(() => {
    if (!checked) return 0;
    return values.reduce(
      (acc, v, i) => acc + (matches(v, blanks[i]) ? 1 : 0),
      0
    );
  }, [values, blanks, checked]);
  const allCorrect = checked && correctCount === blanks.length;

  const updateValue = (i: number, v: string) => {
    setValues((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  };

  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(122,232,122,0.08), rgba(60,200,120,0.04))",
        border: "1px solid rgba(122,232,122,0.25)",
        borderLeft: "3px solid #7AE87A",
        borderRadius: 8,
        padding: "18px 20px",
        margin: "14px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
          color: "#7AE87A",
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: "0.5px",
        }}
      >
        <span style={{ fontSize: 11 }}>▣</span> FILL IN THE BLANK
      </div>
      <div style={{ color: "#D8E8D8", marginBottom: 12 }}>
        <Prose text={prompt} />
      </div>
      <div
        style={{
          color: "#E0E8E0",
          fontSize: 12,
          lineHeight: 2,
          fontFamily: "inherit",
          margin: "6px 0 14px",
        }}
      >
        {parts.map((part, idx) => {
          const m = part.match(/^\{(\d+)\}$/);
          if (m) {
            const slotIdx = Number(m[1]);
            const slot = blanks[slotIdx];
            const val = values[slotIdx] ?? "";
            const isCorrect = checked && matches(val, slot);
            const isWrong = checked && val.length > 0 && !isCorrect;
            return (
              <input
                key={idx}
                value={val}
                onChange={(e) => updateValue(slotIdx, e.target.value)}
                placeholder={slot.hint ?? "…"}
                disabled={revealed}
                style={{
                  display: "inline-block",
                  minWidth: 90,
                  width: `${Math.max((slot.answer.length + 2) * 10, 90)}px`,
                  padding: "3px 8px",
                  margin: "0 4px",
                  background: isCorrect
                    ? "rgba(42,138,74,0.25)"
                    : isWrong
                    ? "rgba(170,48,48,0.2)"
                    : "rgba(0,0,0,0.35)",
                  border: `1px solid ${
                    isCorrect
                      ? "rgba(90,218,122,0.6)"
                      : isWrong
                      ? "rgba(238,102,102,0.5)"
                      : "rgba(122,232,122,0.3)"
                  }`,
                  borderRadius: 4,
                  color: isCorrect ? "#9EE8AE" : "#E8E8F0",
                  fontFamily:
                    "'JetBrains Mono', 'Fira Code', monospace",
                  fontSize: 11,
                }}
              />
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </div>
      {!revealed && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => setChecked(true)}
            style={{
              padding: "7px 18px",
              background: "#7AE87A",
              border: "none",
              borderRadius: 6,
              color: "#14281A",
              fontWeight: 700,
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            Check
          </button>
          <button
            onClick={() => setRevealed(true)}
            style={{
              padding: "7px 16px",
              background: "transparent",
              border: "1px solid rgba(122,232,122,0.35)",
              borderRadius: 6,
              color: "#9EE8AE",
              fontWeight: 600,
              fontSize: 10,
              cursor: "pointer",
            }}
          >
            Reveal answers
          </button>
          {checked && (
            <span
              style={{
                color: allCorrect ? "#5ADA7A" : "#DDAA44",
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              {correctCount} / {blanks.length} correct
              {allCorrect ? " — nice." : " — try again or reveal."}
            </span>
          )}
        </div>
      )}
      {revealed && (
        <>
          <div
            style={{
              marginTop: 12,
              padding: 14,
              background: "rgba(122,232,122,0.08)",
              borderRadius: 6,
              border: "1px solid rgba(122,232,122,0.2)",
            }}
          >
            <div
              style={{
                color: "#7AE87A",
                fontWeight: 700,
                fontSize: 10,
                marginBottom: 6,
              }}
            >
              ANSWER
            </div>
            <div style={{ color: "#E8F0E8" }}>
              <Prose text={reveal} />
            </div>
          </div>
          <button
            onClick={() => {
              setValues(blanks.map(() => ""));
              setChecked(false);
              setRevealed(false);
            }}
            style={{
              marginTop: 10,
              padding: "6px 14px",
              background: "transparent",
              border: "1px solid rgba(122,232,122,0.35)",
              borderRadius: 6,
              color: "#A8E8A8",
              fontWeight: 600,
              fontSize: 10,
              cursor: "pointer",
            }}
          >
            ↻ Try Again
          </button>
        </>
      )}
      {!revealed && checked && (
        <button
          onClick={() => {
            setValues(blanks.map(() => ""));
            setChecked(false);
          }}
          style={{
            marginTop: 10,
            marginLeft: 10,
            padding: "6px 14px",
            background: "transparent",
            border: "1px solid rgba(122,232,122,0.25)",
            borderRadius: 6,
            color: "#9EE8AE",
            fontWeight: 600,
            fontSize: 10,
            cursor: "pointer",
          }}
        >
          ↻ Clear
        </button>
      )}
    </div>
  );
}

// ─── FlipCards ──────────────────────────────────────────────────────────────

function FlipCard({ card, index }: { card: FlipCardItem; index: number }) {
  const [flipped, setFlipped] = useState(false);
  const accent = COLLAPSIBLE_COLORS[index % COLLAPSIBLE_COLORS.length];
  return (
    <div
      onClick={() => setFlipped((f) => !f)}
      style={{
        position: "relative",
        minHeight: 140,
        padding: "18px 18px",
        background: flipped
          ? "rgba(255,255,255,0.05)"
          : "rgba(0,0,0,0.35)",
        border: `1px solid ${accent}44`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 10,
        cursor: "pointer",
        transition: "all 0.25s",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 10,
          fontSize: 10,
          letterSpacing: "0.8px",
          color: accent,
          fontWeight: 700,
          opacity: 0.7,
        }}
      >
        {flipped ? "BACK · click to flip" : "FRONT · click to flip"}
      </div>
      <div
        style={{
          color: flipped ? "#E8ECF0" : accent,
          fontSize: flipped ? 13 : 15,
          fontWeight: flipped ? 500 : 700,
          lineHeight: 1.5,
          marginTop: 12,
        }}
      >
        <Prose text={flipped ? card.back : card.front} />
      </div>
    </div>
  );
}

export function FlipCards({
  intro,
  cards,
}: {
  intro?: string;
  cards: FlipCardItem[];
}) {
  return (
    <div style={{ margin: "14px 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
          color: "#FFA832",
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: "0.5px",
        }}
      >
        <span style={{ fontSize: 11 }}>⟲</span> FLIP TO RECALL
      </div>
      {intro && (
        <div style={{ marginBottom: 10 }}>
          <Prose text={intro} />
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 10,
        }}
      >
        {cards.map((c, i) => (
          <FlipCard key={i} card={c} index={i} />
        ))}
      </div>
    </div>
  );
}

// ─── MCQInline ──────────────────────────────────────────────────────────────

export function MCQInline({
  question,
  choices,
  correctAnswer,
  explanation,
}: {
  question: string;
  choices: InlineChoice[];
  correctAnswer: string;
  explanation: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const reveal = () => {
    if (selected) setLocked(true);
  };

  const correct = selected === correctAnswer;

  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(80,200,255,0.08), rgba(40,140,255,0.04))",
        border: "1px solid rgba(80,200,255,0.25)",
        borderLeft: "3px solid #50C8FF",
        borderRadius: 8,
        padding: "18px 20px",
        margin: "14px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
          color: "#50C8FF",
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: "0.5px",
        }}
      >
        <span style={{ fontSize: 11 }}>◈</span> QUICK CHECK
      </div>
      <div style={{ color: "#E0E4E8", fontWeight: 500, marginBottom: 12 }}>
        <Prose text={question} />
      </div>
      <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
        {choices.map((c) => {
          const isSelected = selected === c.label;
          const isCorrectChoice = c.label === correctAnswer;
          const showState = locked;
          let bg = "rgba(255,255,255,0.03)";
          let border = "1px solid rgba(255,255,255,0.1)";
          let color = "#C8CCD0";
          if (showState && isCorrectChoice) {
            bg = "rgba(42,138,74,0.18)";
            border = "1px solid rgba(90,218,122,0.55)";
            color = "#9EE8AE";
          } else if (showState && isSelected && !isCorrectChoice) {
            bg = "rgba(170,48,48,0.18)";
            border = "1px solid rgba(238,102,102,0.5)";
            color = "#EE9999";
          } else if (!showState && isSelected) {
            bg = "rgba(80,200,255,0.12)";
            border = "1px solid rgba(80,200,255,0.55)";
            color = "#E8ECF0";
          }
          return (
            <button
              key={c.label}
              type="button"
              disabled={locked}
              onClick={() => setSelected(c.label)}
              style={{
                textAlign: "left",
                padding: "10px 14px",
                background: bg,
                border,
                borderRadius: 8,
                color,
                fontSize: 11,
                lineHeight: 1.55,
                cursor: locked ? "default" : "pointer",
                fontFamily: "inherit",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  fontWeight: 800,
                  color: showState && isCorrectChoice ? "#9EE8AE" : "var(--color-v2-text-muted)",
                  minWidth: 18,
                }}
              >
                {c.label}
              </span>
              <span>
                <Prose text={c.text} />
              </span>
            </button>
          );
        })}
      </div>
      {!locked && (
        <button
          onClick={reveal}
          disabled={!selected}
          style={{
            padding: "7px 20px",
            background: selected ? "#50C8FF" : "rgba(80,200,255,0.2)",
            border: "none",
            borderRadius: 6,
            color: selected ? "#1A1A2E" : "var(--color-v2-text-muted)",
            fontWeight: 700,
            fontSize: 11,
            cursor: selected ? "pointer" : "not-allowed",
          }}
        >
          Check answer
        </button>
      )}
      {locked && (
        <>
          <div
            style={{
              marginTop: 8,
              padding: 14,
              background: correct
                ? "rgba(42,138,74,0.12)"
                : "rgba(255,170,50,0.1)",
              borderRadius: 6,
              border: `1px solid ${
                correct ? "rgba(90,218,122,0.3)" : "rgba(255,170,50,0.25)"
              }`,
            }}
          >
            <div
              style={{
                color: correct ? "#5ADA7A" : "#FFA832",
                fontWeight: 700,
                fontSize: 10,
                marginBottom: 6,
              }}
            >
              {correct ? "CORRECT" : `ANSWER: ${correctAnswer}`}
            </div>
            <div style={{ color: "#E8ECF0" }}>
              <Prose text={explanation} />
            </div>
          </div>
          <button
            onClick={() => {
              setSelected(null);
              setLocked(false);
            }}
            style={{
              marginTop: 10,
              padding: "6px 14px",
              background: "transparent",
              border: "1px solid rgba(80,200,255,0.35)",
              borderRadius: 6,
              color: "#9CD8FF",
              fontWeight: 600,
              fontSize: 10,
              cursor: "pointer",
            }}
          >
            ↻ Try Again
          </button>
        </>
      )}
    </div>
  );
}
