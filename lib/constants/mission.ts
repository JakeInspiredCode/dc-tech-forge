/** Icon map for mission step types — single source of truth */
export const STEP_TYPE_ICONS: Record<string, string> = {
  reading: "📖",
  flashcards: "🃏",
  interactive: "🔬",
  "quick-draw": "⚡",
  diagnosis: "🔍",
  terminal: "💻",
  assessment: "📋",
};

/** What a step asks of you, in plain words. Falls back to the raw type. */
export const STEP_TYPE_LABELS: Record<string, string> = {
  reading: "Read",
  flashcards: "Flashcards",
  interactive: "Explore",
  "quick-draw": "Quick Draw",
  diagnosis: "Diagnose",
  terminal: "Terminal practice",
  assessment: "Drill",
};
