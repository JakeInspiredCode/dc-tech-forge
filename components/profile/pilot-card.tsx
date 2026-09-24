"use client";

import { useState, useSyncExternalStore } from "react";
import { callsignProblem, formatCode, normalizeCallsign, normalizeCode } from "@/lib/cloud/callsign";
import { isCloudConfigured } from "@/lib/cloud/config";
import { deleteCloudAccount, registerCallsign, rotateCode, signIn, signOut, usePilot } from "@/lib/cloud/pilot";
import { CloudError } from "@/lib/cloud/postgrest";
import { adoptCloudSave, markLogStart, pushLocalSave, useSyncStatus } from "@/lib/cloud/sync";
import { hasUserActivity } from "@/lib/data/activity";
import { mutations } from "@/lib/data/operations";
import { isSampleDataLoaded } from "@/lib/data/sample-flag";
import { subscribe } from "@/lib/data/store";
import { formatRelativeTime } from "@/lib/activity/describe";

// Matches the Identity panel it renders inside (app/profile/page.tsx).
const accent = "#e0e4ec";
const cyan = "var(--color-v2-cyan)";
const danger = "#ef4444";

function explain(err: unknown): string {
  const code = err instanceof CloudError ? err.code : "SERVER";
  switch (code) {
    case "CALLSIGN_TAKEN": return "That callsign is taken.";
    case "CALLSIGN_INVALID": return "3–20 characters: lower-case letters, numbers and underscores.";
    case "CALLSIGN_RESERVED": return "That one is reserved.";
    case "AUTH_FAILED": return "No account matches that callsign and code.";
    case "RATE_LIMITED": return "Too many attempts right now. Try again in a minute.";
    case "OFFLINE": return "The cloud can't be reached. Check your connection.";
    case "TIMEOUT": return "The cloud took too long to answer. Try again.";
    case "NOT_CONFIGURED": return "Accounts aren't available in this build.";
    default: return "Something went wrong on the cloud side. Try again.";
  }
}

function Button({ onClick, children, tone = accent, disabled = false, type = "button" }: { onClick?: () => void; children: React.ReactNode; tone?: string; disabled?: boolean; type?: "button" | "submit" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-2 max-md:min-h-[44px] rounded-lg text-[11px] display-font tracking-wider uppercase transition-all duration-200 disabled:cursor-not-allowed"
      style={{
        color: tone,
        background: `color-mix(in srgb, ${tone} 6%, transparent)`,
        border: `1px solid color-mix(in srgb, ${tone} 35%, transparent)`,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

const inputClass = "w-full px-3 py-2 max-md:min-h-[44px] rounded-lg text-[12px] mono text-v2-text bg-v2-bg-surface border border-v2-border focus:border-v2-cyan/50 placeholder:text-v2-text-muted";

function CodeBlock({ code, note }: { code: string; note: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatCode(code));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // No clipboard: it is selectable.
    }
  };
  return (
    <div className="rounded-lg p-3 space-y-2" style={{ background: `color-mix(in srgb, ${cyan} 6%, transparent)`, border: `1px solid color-mix(in srgb, ${cyan} 35%, transparent)` }}>
      <div className="text-[10px] display-font tracking-[0.14em] uppercase" style={{ color: cyan }}>Recovery code</div>
      <code className="block text-[12px] mono text-v2-text break-all select-all leading-relaxed">{formatCode(code)}</code>
      <p className="text-[11px] text-v2-text-dim leading-snug">{note}</p>
      <Button onClick={copy} tone={cyan}>{copied ? "Copied" : "Copy code"}</Button>
    </div>
  );
}

type Mode = "idle" | "signin" | "choose" | "fresh-code";

export default function PilotCard() {
  const pilot = usePilot();
  const sync = useSyncStatus();
  const sampleLoaded = useSyncExternalStore(subscribe, isSampleDataLoaded, () => false);
  const [mode, setMode] = useState<Mode>("idle");
  const [busy, setBusy] = useState(false);
  const [callsign, setCallsign] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shownCode, setShownCode] = useState<string | null>(null);
  const [deleteArmed, setDeleteArmed] = useState(false);

  if (!isCloudConfigured()) return null;

  const heading = (text: string) => (
    <h2 className="text-[11px] tracking-widest uppercase mb-2" style={{ color: accent, fontFamily: "'Chakra Petch', sans-serif", opacity: 0.7 }}>{text}</h2>
  );

  if (sampleLoaded) {
    return (
      <div className="w-full">
        {heading("Callsign")}
        <p className="text-[11px] text-v2-text-dim leading-snug">Sample progress is loaded. Start fresh (Settings → Your data) before claiming a callsign — sample activity is never saved to the cloud.</p>
      </div>
    );
  }

  const run = async (work: () => Promise<void>) => {
    setError(null);
    setBusy(true);
    try {
      await work();
    } catch (err) {
      setError(explain(err));
    } finally {
      setBusy(false);
    }
  };

  const claim = () =>
    run(async () => {
      const name = normalizeCallsign(callsign);
      const problem = callsignProblem(name);
      if (problem) throw new CloudError(problem.startsWith("That") ? "CALLSIGN_RESERVED" : "CALLSIGN_INVALID");
      const created = await registerCallsign(name);
      // The server has already written "joined the fleet" for everyone to see.
      // This browser's copy, and the badge for it, are logged before the mark
      // below, so they stay private rows and nothing is announced twice.
      await mutations["forgeActivity:joinedFleet"]({});
      await mutations["forgeProfile:awardBadge"]({ id: "enlisted" });
      markLogStart();
      // Save at once, even an empty account: the first save of a week is the
      // weekly board's baseline, and it must predate the first XP earned.
      await pushLocalSave();
      setShownCode(created.code);
      setMode("fresh-code");
      setCallsign("");
    });

  const enter = () =>
    run(async () => {
      const name = normalizeCallsign(callsign);
      const clean = normalizeCode(code);
      if (!clean) throw new CloudError("AUTH_FAILED");
      const { saveRev } = await signIn(name, clean);
      markLogStart();
      setCallsign("");
      setCode("");
      if (saveRev > 0 && hasUserActivity()) {
        setMode("choose"); // both sides have progress: the person decides
        return;
      }
      if (saveRev > 0) await adoptCloudSave();
      else await pushLocalSave(); // a fresh account: this browser's progress (or nothing) becomes the save and the week's baseline
      setMode("idle");
    });

  const choose = (useCloud: boolean) =>
    run(async () => {
      if (useCloud) await adoptCloudSave();
      else await pushLocalSave();
      setMode("idle");
    });

  // ── Signed out ──
  if (!pilot) {
    if (mode === "fresh-code" && shownCode) {
      // Reached only in the instant between registering and the pilot state settling.
      return null;
    }
    return (
      <form
        className="w-full space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (mode === "signin") void enter();
          else void claim();
        }}
      >
        {heading("Callsign")}
        <p className="text-[11px] text-v2-text-dim leading-snug">
          {mode === "signin"
            ? "Enter the callsign and the recovery code you were given."
            : "Pick a callsign to keep your progress across devices and appear in the Fleet Log. No email, no password: you get a recovery code instead."}
        </p>
        <input aria-label="Callsign" className={inputClass} value={callsign} onChange={(e) => setCallsign(e.target.value)} placeholder="e.g. rack_rat" autoComplete="username" spellCheck={false} maxLength={40} disabled={busy} />
        {mode === "signin" && (
          <input aria-label="Recovery code" className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} placeholder="xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx" autoComplete="off" spellCheck={false} disabled={busy} />
        )}
        {error && <p role="alert" className="text-[11px] leading-snug" style={{ color: danger }}>{error}</p>}
        <div className="flex flex-wrap gap-2">
          {mode === "signin" ? (
            <>
              <Button type="submit" tone={cyan} disabled={busy || !callsign || !code}>{busy ? "Working…" : "Sign in"}</Button>
              <Button onClick={() => { setMode("idle"); setError(null); }}>Back</Button>
            </>
          ) : (
            <>
              <Button type="submit" tone={cyan} disabled={busy || !callsign}>{busy ? "Working…" : "Claim callsign"}</Button>
              <Button onClick={() => { setMode("signin"); setError(null); }} disabled={busy}>I have a code</Button>
            </>
          )}
        </div>
      </form>
    );
  }

  // ── Signed in ──
  const syncLine =
    sync.state === "syncing" ? "Saving to the cloud…"
    : sync.state === "synced" && sync.at ? `Saved to the cloud ${formatRelativeTime(new Date(sync.at).toISOString())}`
    : sync.state === "offline" ? "Cloud unreachable — saving here; it catches up when you're back online."
    : sync.state === "error" ? (sync.message ?? "Cloud error.")
    : "Signed in.";

  return (
    <div className="w-full space-y-2">
      {heading("Callsign")}
      <div className="text-[13px] mono text-v2-text">{pilot.callsign}</div>
      {mode === "fresh-code" && (
        <p className="text-[12px] leading-snug text-v2-text">
          Welcome to the fleet, <span style={{ color: cyan }}>{pilot.callsign}</span>. The Fleet Log has your arrival, and your first badge is yours.
        </p>
      )}
      <p className="text-[11px] text-v2-text-dim leading-snug" aria-live="polite">{syncLine}</p>

      {mode === "choose" && (
        <div className="rounded-lg p-3 space-y-2" style={{ border: `1px solid color-mix(in srgb, ${cyan} 35%, transparent)` }}>
          <p className="text-[11px] text-v2-text leading-snug">This browser and your cloud save both have progress. Which one do you want to keep? The other is replaced.</p>
          <div className="flex flex-wrap gap-2">
            <Button tone={cyan} onClick={() => void choose(true)}>Use the cloud save</Button>
            <Button onClick={() => void choose(false)}>Keep this browser&apos;s</Button>
          </div>
        </div>
      )}

      {(mode === "fresh-code" || shownCode) && shownCode && (
        <CodeBlock
          code={shownCode}
          note={mode === "fresh-code"
            ? "This is the only way to sign in on another device. Save it somewhere safe — it is not shown again unless you ask."
            : "Signs you in on another device. Anyone who has it is you."}
        />
      )}
      {error && <p role="alert" className="text-[11px] leading-snug" style={{ color: danger }}>{error}</p>}

      <div className="flex flex-wrap gap-2">
        {mode === "fresh-code" ? (
          <Button tone={cyan} onClick={() => { setShownCode(null); setMode("idle"); }}>I&apos;ve saved it</Button>
        ) : shownCode ? (
          <Button onClick={() => setShownCode(null)}>Hide code</Button>
        ) : (
          <Button onClick={() => setShownCode(pilot.code)} disabled={busy}>Show recovery code</Button>
        )}
        <Button onClick={() => run(async () => { const fresh = await rotateCode(); setShownCode(fresh); setMode("idle"); })} disabled={busy}>New code</Button>
        <Button onClick={() => { signOut(); setShownCode(null); setMode("idle"); }} disabled={busy}>Sign out</Button>
      </div>

      <div className="pt-1">
        {!deleteArmed ? (
          <Button tone={danger} onClick={() => setDeleteArmed(true)} disabled={busy}>Delete cloud account</Button>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] leading-snug text-v2-text">Deletes the callsign, the cloud save and your rows in the Fleet Log. Progress in this browser stays.</p>
            <div className="flex flex-wrap gap-2">
              <Button tone={danger} onClick={() => run(async () => { await deleteCloudAccount(); setDeleteArmed(false); setMode("idle"); })}>Confirm delete</Button>
              <Button onClick={() => setDeleteArmed(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
