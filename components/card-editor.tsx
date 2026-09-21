"use client";

import { useState } from "react";
import { useMutation } from "@/lib/convex-shim";
import { api } from "../convex/_generated/api";
import { TOPICS, TopicId } from "@/lib/types";
import { useModalDialog } from "@/lib/use-modal-dialog";

interface CardEditorProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function CardEditor({ onClose, onCreated }: CardEditorProps) {
  const addCard = useMutation(api.forgeCards.addCard);
  const [topicId, setTopicId] = useState<TopicId>(TOPICS[0].id);
  const [type, setType] = useState<"easy" | "intermediate" | "scenario">("easy");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [difficulty, setDifficulty] = useState(1);
  const [tier, setTier] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useModalDialog(onClose);

  const handleSubmit = async () => {
    if (!front.trim() || !back.trim()) { setError("Front and back are required."); return; }
    setSaving(true);
    setError(null);
    const cardId = `custom-${topicId}-${Date.now()}`;
    const result = await addCard({ cardId, topicId, type, front: front.trim(), back: back.trim(), difficulty, tier });
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-editor-title"
        tabIndex={-1}
        className="bg-v2-bg-surface border border-v2-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="card-editor-title" className="text-lg font-semibold mono">Create Card</h2>
          <button onClick={onClose} aria-label="Close" className="text-v2-text-muted hover:text-v2-text text-lg">&times;</button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-v2-text-dim mb-1">Topic</label>
              <select aria-label="Topic" data-autofocus value={topicId} onChange={(e) => setTopicId(e.target.value as TopicId)}
                className="w-full bg-v2-bg-elevated border border-v2-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-v2-cyan/50">
                {TOPICS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-v2-text-dim mb-1">Type</label>
              <select aria-label="Type" value={type} onChange={(e) => setType(e.target.value as typeof type)}
                className="w-full bg-v2-bg-elevated border border-v2-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-v2-cyan/50">
                <option value="easy">Easy</option>
                <option value="intermediate">Intermediate</option>
                <option value="scenario">Scenario</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-v2-text-dim mb-1">Difficulty (1-3)</label>
              <select aria-label="Difficulty (1-3)" value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))}
                className="w-full bg-v2-bg-elevated border border-v2-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-v2-cyan/50">
                <option value={1}>1 - Easy</option>
                <option value={2}>2 - Medium</option>
                <option value={3}>3 - Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-v2-text-dim mb-1">Tier (1-4)</label>
              <select aria-label="Tier (1-4)" value={tier} onChange={(e) => setTier(Number(e.target.value))}
                className="w-full bg-v2-bg-elevated border border-v2-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-v2-cyan/50">
                <option value={1}>Tier 1</option>
                <option value={2}>Tier 2</option>
                <option value={3}>Tier 3</option>
                <option value={4}>Tier 4</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-v2-text-dim mb-1">Front (Question)</label>
            <textarea aria-label="Front (Question)" value={front} onChange={(e) => setFront(e.target.value)}
              placeholder="Enter the question..."
              className="w-full h-24 bg-v2-bg-elevated border border-v2-border rounded-lg p-3 text-sm resize-none outline-none focus:border-v2-cyan/50" />
          </div>

          <div>
            <label className="block text-xs text-v2-text-dim mb-1">Back (Answer)</label>
            <textarea aria-label="Back (Answer)" value={back} onChange={(e) => setBack(e.target.value)}
              placeholder="Enter the answer (supports markdown)..."
              className="w-full h-32 bg-v2-bg-elevated border border-v2-border rounded-lg p-3 text-sm resize-none outline-none focus:border-v2-cyan/50" />
          </div>

          {error && <p className="text-sm text-v2-danger">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button onClick={onClose}
              className="flex-1 py-2 border border-v2-border rounded-lg text-sm hover:bg-v2-bg-elevated transition-colors">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 py-2 bg-v2-cyan text-v2-bg-deep rounded-lg text-sm font-medium hover:bg-v2-cyan-bright transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Create Card"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
