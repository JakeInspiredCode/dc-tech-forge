"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@/lib/convex-shim";
import { api } from "../../convex/_generated/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Chunk = { label: string; summary: string; content: string };
type Story = {
  storyId: string;
  question: string;
  framework: string;
  answer: string;
  chunks?: Chunk[];
};

const DEFAULT_STORIES: Story[] = [
  {
    storyId: "story-1",
    question: "Tell me about yourself.",
    framework: "~85s — Identity + Background + Thread",
    answer: "",
    chunks: [
      { label: "A", summary: "Who I am now", content: "" },
      { label: "B", summary: "Where I came from", content: "" },
      { label: "C", summary: "The thread + closer", content: "" },
    ],
  },
  {
    storyId: "story-2",
    question: "Why this company / Why this role?",
    framework: "~72s — Company + Role + Fit",
    answer: "",
    chunks: [
      { label: "A", summary: "Why the company", content: "" },
      { label: "B", summary: "Why this role", content: "" },
      { label: "C", summary: "What I bring", content: "" },
    ],
  },
  {
    storyId: "story-3",
    question: "Walk me through your current role and biggest impact.",
    framework: "~88s — STAR",
    answer: "",
    chunks: [
      { label: "A", summary: "Situation", content: "" },
      { label: "B", summary: "Task", content: "" },
      { label: "C", summary: "Action", content: "" },
      { label: "D", summary: "Result", content: "" },
    ],
  },
  {
    storyId: "story-4",
    question: "Tell me about a time you resolved a critical issue under pressure.",
    framework: "~85s — STAR + optional follow-up",
    answer: "",
    chunks: [
      { label: "A", summary: "Situation", content: "" },
      { label: "B", summary: "Task", content: "" },
      { label: "C", summary: "Action", content: "" },
      { label: "D", summary: "Result", content: "" },
      { label: "E", summary: "Secondary example (optional)", content: "" },
    ],
  },
  {
    storyId: "story-5",
    question: "Describe a process improvement or automation you drove.",
    framework: "~66s — STAR",
    answer: "",
    chunks: [
      { label: "A", summary: "Situation + Task", content: "" },
      { label: "B", summary: "Action", content: "" },
      { label: "C", summary: "Result", content: "" },
    ],
  },
  {
    storyId: "story-6",
    question: "Tell me about a time you showed initiative without being asked.",
    framework: "~62s — STAR",
    answer: "",
    chunks: [
      { label: "A", summary: "Situation + Task", content: "" },
      { label: "B", summary: "Action", content: "" },
      { label: "C", summary: "Result", content: "" },
    ],
  },
  {
    storyId: "story-7",
    question: "How do you handle documentation, SOPs, and handoffs?",
    framework: "~82s — Process + Culture",
    answer: "",
    chunks: [
      { label: "A", summary: "Situation + Task", content: "" },
      { label: "B", summary: "Action — methodology", content: "" },
      { label: "C", summary: "Result", content: "" },
    ],
  },
  {
    storyId: "story-8",
    question: "Describe a time you coordinated cross-functionally.",
    framework: "~65s — STAR",
    answer: "",
    chunks: [
      { label: "A", summary: "Situation + Task", content: "" },
      { label: "B", summary: "Action", content: "" },
      { label: "C", summary: "Result", content: "" },
    ],
  },
  {
    storyId: "story-9",
    question: "What does your first 30 days look like?",
    framework: "~62s — Week-by-week",
    answer: "",
    chunks: [
      { label: "A", summary: "Week 1", content: "" },
      { label: "B", summary: "Week 2", content: "" },
      { label: "C", summary: "Weeks 3–4 + thesis", content: "" },
    ],
  },
  {
    storyId: "story-10",
    question: "Conflict or disagreement with a teammate.",
    framework: "~61s — STAR",
    answer: "",
    chunks: [
      { label: "A", summary: "Situation + Task", content: "" },
      { label: "B", summary: "Action", content: "" },
      { label: "C", summary: "Result + principle", content: "" },
    ],
  },
  {
    storyId: "story-11",
    question: "How do you prioritize a queue of 20+ tickets?",
    framework: "~56s — Method",
    answer: "",
    chunks: [
      { label: "A", summary: "First pass", content: "" },
      { label: "B", summary: "Second pass", content: "" },
      { label: "C", summary: "Third pass", content: "" },
      { label: "D", summary: "Throughout", content: "" },
    ],
  },
  {
    storyId: "story-12",
    question: "Tell me about a mistake and how you handled it.",
    framework: "~60s — STAR",
    answer: "",
    chunks: [
      { label: "A", summary: "Situation + Task", content: "" },
      { label: "B", summary: "Action", content: "" },
      { label: "C", summary: "Result + principle", content: "" },
    ],
  },
  {
    storyId: "story-13",
    question: "What excites you about a greenfield or high-growth environment?",
    framework: "~54s — Pattern match",
    answer: "",
    chunks: [
      { label: "A", summary: "What the environment is", content: "" },
      { label: "B", summary: "Pattern from my career", content: "" },
      { label: "C", summary: "Thesis", content: "" },
    ],
  },
  {
    storyId: "story-14",
    question:
      "How do you handle on-call rotations, physical demands, and schedule flexibility?",
    framework: "~45s — Experience + Approach + Commitment",
    answer: "",
    chunks: [
      { label: "A", summary: "Relevant experience", content: "" },
      { label: "B", summary: "Approach under strain", content: "" },
      { label: "C", summary: "Closer", content: "" },
    ],
  },
  {
    storyId: "story-15",
    question: "Why should we hire you over other candidates?",
    framework: "~54s — Differentiator",
    answer: "",
    chunks: [
      { label: "A", summary: "What others have vs. what I bring", content: "" },
      { label: "B", summary: "The impact I drive", content: "" },
      { label: "C", summary: "Closer", content: "" },
    ],
  },
];

function ChunkBlock({
  chunk,
  forceHidden,
  onSave,
}: {
  chunk: Chunk;
  forceHidden: boolean;
  onSave: (updated: Chunk) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(chunk.content);
  const [editSummary, setEditSummary] = useState(chunk.summary);
  const isOpen = !forceHidden && open;

  const handleSave = () => {
    onSave({ ...chunk, content: editContent, summary: editSummary });
    setEditing(false);
  };

  const handleCancel = () => {
    setEditContent(chunk.content);
    setEditSummary(chunk.summary);
    setEditing(false);
  };

  return (
    <div className="border border-forge-border/50 rounded-lg overflow-hidden">
      <button
        onClick={() => !forceHidden && setOpen(!open)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
          forceHidden
            ? "opacity-70 cursor-default"
            : "hover:bg-forge-surface-2 cursor-pointer"
        }`}
      >
        <span className="text-forge-accent-text mono text-xs font-bold shrink-0 w-5">
          {chunk.label}
        </span>
        <span className="text-forge-text-dim">{chunk.summary}</span>
        {!forceHidden && (
          <span className="ml-auto text-forge-text-muted text-xs shrink-0">
            {isOpen ? "▾" : "▸"}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-3 pt-1 border-t border-forge-border/30">
          {editing ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-xs text-forge-text-dim shrink-0">Summary:</label>
                <input aria-label="Summary"
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="flex-1 bg-forge-surface-2 border border-forge-border rounded px-2 py-1 text-sm focus:border-forge-accent focus:outline-none"
                />
              </div>
              <textarea aria-label="Story text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={5}
                className="w-full bg-forge-surface-2 border border-forge-border rounded-lg p-3 text-sm resize-y focus:border-forge-accent focus:outline-none"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleCancel}
                  className="text-xs px-3 py-1 rounded border border-forge-border text-forge-text-dim hover:text-forge-accent-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="text-xs px-3 py-1 rounded border border-forge-accent text-forge-accent-text hover:bg-forge-accent/10 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          ) : chunk.content ? (
            <div className="space-y-2">
              <div className="markdown-content text-sm leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {chunk.content}
                </ReactMarkdown>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(true);
                  }}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border border-forge-border text-forge-text-dim hover:text-forge-accent-text hover:border-forge-accent transition-colors"
                >
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11.5 2.5l2 2L5 13l-3 1 1-3z" />
                    <line x1="10" y1="4" x2="12" y2="6" />
                  </svg>
                  Edit
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
              className="w-full flex items-center justify-center gap-2 text-xs py-2.5 rounded border border-dashed border-forge-border text-forge-text-dim hover:text-forge-accent-text hover:border-forge-accent transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="3" x2="8" y2="13" />
                <line x1="3" y1="8" x2="13" y2="8" />
              </svg>
              Add content
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function StoriesPage() {
  const convexStoriesRaw = useQuery(api.forgeStories.getAll) as Array<{
    storyId: string; question: string; framework: string; answer: string;
    chunks?: Array<{ label: string; summary: string; content: string }>;
  }> | undefined;
  const upsertStory = useMutation(api.forgeStories.upsert);
  const [seeded, setSeeded] = useState(false);
  const [hiddenStories, setHiddenStories] = useState<Set<string>>(new Set());

  const isLoading = convexStoriesRaw === undefined;
  const convexStories = convexStoriesRaw ?? [];

  useEffect(() => {
    if (!isLoading && convexStories.length === 0 && !seeded) {
      setSeeded(true);
      DEFAULT_STORIES.forEach((s) => upsertStory(s));
    }
  }, [isLoading, convexStories.length, seeded, upsertStory]);

  const stories: Story[] =
    convexStories.length > 0
      ? convexStories.map((s) => ({
          storyId: s.storyId,
          question: s.question,
          framework: s.framework,
          answer: s.answer,
          chunks: s.chunks as Chunk[] | undefined,
        }))
      : DEFAULT_STORIES;

  const toggleHide = (storyId: string) => {
    setHiddenStories((prev) => {
      const next = new Set(prev);
      if (next.has(storyId)) next.delete(storyId);
      else next.add(storyId);
      return next;
    });
  };

  const saveChunk = (story: Story, updatedChunk: Chunk) => {
    const newChunks = (story.chunks ?? []).map((c) =>
      c.label === updatedChunk.label ? updatedChunk : c
    );
    upsertStory({
      storyId: story.storyId,
      question: story.question,
      framework: story.framework,
      answer: story.answer,
      chunks: newChunks,
    });
  };

  const allHidden = hiddenStories.size === stories.length;
  const toggleAll = () => {
    if (allHidden) {
      setHiddenStories(new Set());
    } else {
      setHiddenStories(new Set(stories.map((s) => s.storyId)));
    }
  };

  return (
    <div className="min-h-screen bg-v2-bg-deep">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1 mono">Story Bank</h1>
            <p className="text-forge-text-dim text-sm">
              15 behavioral answers with collapsible chunks. Hide chunks to
              practice recall.
            </p>
          </div>
          <button
            onClick={toggleAll}
            className="text-xs px-3 py-1.5 rounded border border-forge-border hover:border-forge-accent text-forge-text-dim hover:text-forge-accent-text transition-colors shrink-0 mt-1"
          >
            {allHidden ? "Reveal All" : "Hide All"}
          </button>
        </div>

        <div className="space-y-5">
          {stories.map((story, idx) => {
            const isHidden = hiddenStories.has(story.storyId);
            const chunks = story.chunks ?? [];

            return (
              <div
                key={story.storyId}
                className="bg-forge-surface border border-forge-border rounded-xl p-5"
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-forge-text-muted mono text-xs font-bold">
                      {idx + 1}.
                    </span>
                    <h2 className="font-semibold text-base leading-snug">
                      {story.question}
                    </h2>
                  </div>
                  <button
                    onClick={() => toggleHide(story.storyId)}
                    className="text-xs px-2.5 py-1 rounded border border-forge-border hover:border-forge-accent text-forge-text-dim hover:text-forge-accent-text transition-colors shrink-0 ml-3"
                  >
                    {isHidden ? "Show" : "Hide"}
                  </button>
                </div>
                <span className="text-xs text-forge-accent-text/70 mono ml-5 block mb-3">
                  {story.framework}
                </span>

                {!isHidden && chunks.length > 0 && (
                  <div className="space-y-1.5 ml-5">
                    {chunks.map((chunk) => (
                      <ChunkBlock
                        key={chunk.label}
                        chunk={chunk}
                        forceHidden={false}
                        onSave={(updated) => saveChunk(story, updated)}
                      />
                    ))}
                  </div>
                )}

                {!isHidden && chunks.length === 0 && story.answer && (
                  <div className="markdown-content text-sm leading-relaxed ml-5">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {story.answer}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 bg-forge-surface border border-forge-border rounded-xl p-5">
          <h2 className="font-semibold text-base mb-3 mono">Practice Notes</h2>
          <div className="text-sm text-forge-text-dim space-y-3">
            <div>
              <span className="text-forge-accent-text font-semibold">Drill daily:</span>{" "}
              Q1, Q2, Q4, Q15 — opener, "why this role," pressure story, closer.
            </div>
            <div>
              <span className="text-forge-accent-text font-semibold">Drill 2x/week:</span>{" "}
              Q3, Q5, Q6, Q13 — strongest differentiators (biggest impact,
              process wins, initiative, environment fit).
            </div>
            <div>
              <span className="text-forge-accent-text font-semibold">Drill 1x/week:</span>{" "}
              Q7–Q12, Q14 — more formulaic, get the structure then let them
              flow.
            </div>
            <div className="pt-2 border-t border-forge-border/50 text-xs">
              <strong>Chunk practice:</strong> Deliver chunk [A] out loud until
              it flows. Chain A+B, then A+B+C. If any chunk takes &gt;20s of
              hesitation to start, isolate and drill it. If any answer runs past
              90s, cut the weakest sentence.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
