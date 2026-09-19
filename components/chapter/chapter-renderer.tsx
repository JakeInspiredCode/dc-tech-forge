"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Block, ChapterSection } from "@/lib/types/chapter";
import { getChapterSection } from "@/lib/seeds/chapters";
import {
  Bullets,
  Callout,
  CodeBlock,
  Collapsible,
  FillBlank,
  FlipCards,
  Heading,
  InfoTable,
  KnowledgeCheck,
  MCQInline,
  ThinkAboutIt,
  WhyThisMatters,
} from "./blocks";
import { Prose } from "./prose";
import { getInteractiveComponent } from "./interactive";
import { useLessonScale, scaleLabel } from "@/lib/use-lesson-scale";

function renderBlock(block: Block, idx: number) {
  switch (block.kind) {
    case "heading":
      return (
        <Heading
          key={idx}
          level={block.level}
          text={block.text}
          subtitle={block.subtitle}
        />
      );
    case "prose":
      return <Prose key={idx} html={block.html} />;
    case "code":
      return (
        <CodeBlock
          key={idx}
          label={block.label}
          language={block.language}
          code={block.code}
        />
      );
    case "table":
      return <InfoTable key={idx} headers={block.headers} rows={block.rows} />;
    case "bullets":
      return <Bullets key={idx} items={block.items} />;
    case "callout":
      return (
        <Callout
          key={idx}
          variant={block.variant}
          title={block.title}
          body={block.body}
        />
      );
    case "think-about-it":
      return (
        <ThinkAboutIt
          key={idx}
          scenario={block.scenario}
          hint={block.hint}
          answer={block.answer}
        />
      );
    case "knowledge-check":
      return (
        <KnowledgeCheck key={idx} question={block.question} answer={block.answer} />
      );
    case "why-this-matters":
      return <WhyThisMatters key={idx} body={block.body} />;
    case "collapsible":
      return <Collapsible key={idx} intro={block.intro} items={block.items} />;
    case "fill-blank":
      return (
        <FillBlank
          key={idx}
          prompt={block.prompt}
          sentence={block.sentence}
          blanks={block.blanks}
          reveal={block.reveal}
        />
      );
    case "flip-cards":
      return <FlipCards key={idx} intro={block.intro} cards={block.cards} />;
    case "mcq-inline":
      return (
        <MCQInline
          key={idx}
          question={block.question}
          choices={block.choices}
          correctAnswer={block.correctAnswer}
          explanation={block.explanation}
        />
      );
    case "custom-component": {
      const Component = getInteractiveComponent(block.id);
      if (!Component) {
        return (
          <div
            key={idx}
            style={{
              padding: 14,
              border: "1px dashed rgba(255,170,50,0.3)",
              borderRadius: 8,
              color: "#B8C4D8",
              fontSize: 10,
              margin: "12px 0",
            }}
          >
            (Custom component &quot;{block.id}&quot; — not yet implemented)
          </div>
        );
      }
      return <Component key={idx} {...(block.props ?? {})} />;
    }
  }
}

interface ChapterRendererProps {
  sectionId: string;
  missionMode?: boolean;
  onMissionComplete?: () => void;
}

export default function ChapterRenderer({
  sectionId,
  missionMode,
  onMissionComplete,
}: ChapterRendererProps) {
  const [lessonScale, cycleLessonScale] = useLessonScale();
  const section = useMemo<ChapterSection | null>(
    () => getChapterSection(sectionId),
    [sectionId]
  );

  if (!section) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#12121F",
          color: "#D8DCE0",
          fontFamily:
            "'Geist', 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
          padding: "60px 24px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#AAB4BE" }}>
          Chapter section &quot;{sectionId}&quot; not found.
        </p>
        {missionMode && onMissionComplete && (
          <button
            onClick={onMissionComplete}
            style={{
              marginTop: 20,
              padding: "10px 24px",
              background: "rgba(80,200,255,0.15)",
              border: "1px solid rgba(80,200,255,0.4)",
              borderRadius: 8,
              color: "#50C8FF",
              fontWeight: 700,
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            Continue mission
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#12121F",
        fontFamily:
          "'Geist', 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#D8DCE0",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(18,18,31,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          height: 56,
          gap: 14,
          flexShrink: 0,
        }}
      >
        <Link
          href="/"
          style={{
            color: "#50C8FF",
            fontSize: 11,
            textDecoration: "none",
            padding: "4px 8px",
            fontWeight: 600,
            opacity: 0.8,
          }}
        >
          ← L1NX
        </Link>
        <span style={{ color: "rgba(255,255,255,0.08)", fontSize: 13 }}>|</span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flex: 1,
            minWidth: 0,
          }}
        >
          <span
            style={{
              color: "#50C8FF",
              fontWeight: 800,
              fontSize: 11,
              whiteSpace: "nowrap",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {section.topicId} chapter
          </span>
          <span style={{ color: "#445", fontSize: 11 }}>|</span>
          <span
            style={{
              color: "#AAB4BE",
              fontSize: 11,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {section.icon && `${section.icon} `}
            {section.title}
          </span>
        </div>
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
            flexShrink: 0,
            letterSpacing: "0.5px",
          }}
        >
          <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 13, letterSpacing: 0 }}>Aa</span>
          <span>{scaleLabel(lessonScale)}</span>
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 24px 56px",
          maxWidth: 820,
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
          zoom: lessonScale,
        }}
      >
        <Heading level={2} text={section.title} subtitle={section.subtitle} />
        {section.blocks.map((block, idx) => renderBlock(block, idx))}

        <div
          style={{
            marginTop: 40,
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {missionMode && onMissionComplete ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                alignItems: "center",
              }}
            >
              <button
                onClick={onMissionComplete}
                style={{
                  padding: "12px 32px",
                  background: "rgba(80,200,255,0.15)",
                  border: "1px solid rgba(80,200,255,0.4)",
                  borderRadius: 8,
                  color: "#50C8FF",
                  fontWeight: 700,
                  fontSize: 11,
                  cursor: "pointer",
                  width: "100%",
                  maxWidth: 360,
                  boxShadow: "0 0 8px rgba(80,200,255,0.1)",
                }}
              >
                Completed reading, Continue mission
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
