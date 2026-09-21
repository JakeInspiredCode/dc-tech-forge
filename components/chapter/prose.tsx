"use client";

import type { ReactNode } from "react";

type Token =
  | { kind: "text"; text: string }
  | { kind: "code"; text: string }
  | { kind: "bold"; inner: Token[] }
  | { kind: "em"; inner: Token[] };

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === "`") {
      const end = src.indexOf("`", i + 1);
      if (end !== -1) {
        out.push({ kind: "code", text: src.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    if (ch === "*" && src[i + 1] === "*") {
      const end = src.indexOf("**", i + 2);
      if (end !== -1) {
        out.push({ kind: "bold", inner: tokenize(src.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }
    if (ch === "*") {
      const end = src.indexOf("*", i + 1);
      if (end !== -1) {
        out.push({ kind: "em", inner: tokenize(src.slice(i + 1, end)) });
        i = end + 1;
        continue;
      }
    }
    let nextSpecial = src.length;
    for (const marker of ["`", "**", "*"]) {
      const p = src.indexOf(marker, i);
      if (p !== -1 && p < nextSpecial) nextSpecial = p;
    }
    out.push({ kind: "text", text: src.slice(i, nextSpecial) });
    i = nextSpecial;
  }
  return out;
}

function render(tokens: Token[], keyPrefix = ""): ReactNode[] {
  return tokens.map((t, idx) => {
    const key = `${keyPrefix}${idx}`;
    switch (t.kind) {
      case "text":
        return <span key={key}>{t.text}</span>;
      case "code":
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
            {t.text}
          </code>
        );
      case "bold":
        return (
          <strong key={key} style={{ color: "#E8ECF0" }}>
            {render(t.inner, `${key}-`)}
          </strong>
        );
      case "em":
        return (
          <em key={key} style={{ color: "#D8DCE0" }}>
            {render(t.inner, `${key}-`)}
          </em>
        );
    }
  });
}

// `text` is a tiny markdown subset (`code`, **bold**, *em*). It is tokenized
// into React text nodes — never parsed or injected as HTML.
export function Prose({ text }: { text: string }) {
  return (
    <p
      style={{
        color: "#D0D4D8",
        fontSize: 12,
        lineHeight: 1.55,
        margin: "10px 0",
      }}
    >
      {render(tokenize(text))}
    </p>
  );
}
