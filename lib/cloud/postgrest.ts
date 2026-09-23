// The only place the app talks to the cloud: plain fetch against PostgREST.
// No SDK — the whole API is seven functions and one view, and a client
// library would be more code than this file.

import { CLOUD, isCloudConfigured } from "./config";

export type CloudErrorCode =
  | "NOT_CONFIGURED"
  | "OFFLINE"
  | "TIMEOUT"
  | "AUTH_FAILED"
  | "CALLSIGN_INVALID"
  | "CALLSIGN_RESERVED"
  | "CALLSIGN_TAKEN"
  | "RATE_LIMITED"
  | "SAVE_INVALID"
  | "SAVE_TOO_LARGE"
  | "ACTIVITY_INVALID"
  | "SERVER";

// The messages supabase/schema.sql raises, verbatim.
const RAISED = new Set<CloudErrorCode>([
  "AUTH_FAILED", "CALLSIGN_INVALID", "CALLSIGN_RESERVED", "CALLSIGN_TAKEN",
  "RATE_LIMITED", "SAVE_INVALID", "SAVE_TOO_LARGE", "ACTIVITY_INVALID",
]);

export class CloudError extends Error {
  constructor(public readonly code: CloudErrorCode, detail?: string) {
    super(detail ? `${code}: ${detail}` : code);
    this.name = "CloudError";
  }
}

const TIMEOUT_MS = 15_000;

async function call<T>(path: string, init: RequestInit): Promise<T> {
  if (!isCloudConfigured()) throw new CloudError("NOT_CONFIGURED");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${CLOUD.url}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: CLOUD.key,
        Authorization: `Bearer ${CLOUD.key}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
      signal: controller.signal,
    });
  } catch {
    throw new CloudError(controller.signal.aborted ? "TIMEOUT" : "OFFLINE");
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null);
    const message =
      body && typeof body === "object" && typeof (body as { message?: unknown }).message === "string"
        ? (body as { message: string }).message
        : "";
    const code = RAISED.has(message as CloudErrorCode) ? (message as CloudErrorCode) : "SERVER";
    throw new CloudError(code, code === "SERVER" ? `${res.status} ${message}`.trim() : undefined);
  }
  return (await res.json()) as T;
}

/** Call one of the forge_* functions. */
export function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  return call<T>(`rpc/${fn}`, { method: "POST", body: JSON.stringify(args) });
}

/** Read rows from a view; `query` is the PostgREST query string without the `?`. */
export function select<T>(view: string, query: string): Promise<T[]> {
  return call<T[]>(`${view}?${query}`, { method: "GET" });
}
