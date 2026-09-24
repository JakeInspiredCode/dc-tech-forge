// End-to-end check of the cloud against the live project, using only the
// public key — exactly what a browser has. It claims a throwaway callsign,
// exercises every function, checks that the tables themselves are out of
// reach, and deletes the account again.
//
//   npm run cloud:smoke      (reads NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY from .env.local or the environment)

import { existsSync, readFileSync } from "node:fs";

for (const line of existsSync(".env.local") ? readFileSync(".env.local", "utf8").split("\n") : []) {
  const m = line.match(/^([A-Z0-9_]+)="?([^"\n]*)"?$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or fill .env.local).");
  process.exit(2);
}

const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
let failures = 0;
const ok = (msg) => console.log(`  ok   ${msg}`);
const bad = (msg) => { failures++; console.log(`  FAIL ${msg}`); };

async function rpc(fn, args) {
  const res = await fetch(`${url}/rest/v1/rpc/${fn}`, { method: "POST", headers, body: JSON.stringify(args) });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.message ?? `HTTP ${res.status}`);
  return body;
}
async function raw(method, path, body) {
  const res = await fetch(`${url}/rest/v1/${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: res.status, body: await res.json().catch(() => null) };
}
async function mustFail(label, promise, code) {
  try {
    await promise;
    bad(`${label}: succeeded, expected ${code}`);
  } catch (err) {
    if (err.message === code) ok(`${label} → ${code}`);
    else bad(`${label}: expected ${code}, got "${err.message}"`);
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const callsign = `smoke_${Date.now().toString(36).slice(-6)}`;
let code = null;

console.log(`Cloud smoke test against ${new URL(url).host} as ${callsign}`);
try {
  console.log("Nothing but the functions and the view is reachable:");
  for (const [method, path, body] of [["GET", "pilots?select=*"], ["GET", "saves?select=*"], ["GET", "activity?select=*"], ["POST", "activity", { kind: "badge_earned", ref: "x" }], ["POST", "pilots", { callsign: "x", code_hash: "y" }]]) {
    const { status } = await raw(method, path, body);
    if (status >= 400) ok(`${method} /${path.split("?")[0]} → ${status}`);
    else bad(`${method} /${path} answered ${status} — the table is exposed`);
  }
  const view = await raw("GET", "fleet_log?select=id,callsign,kind,ref,value,created_at&limit=3");
  if (view.status === 200 && Array.isArray(view.body)) ok(`fleet_log readable (${view.body.length} rows sampled)`);
  else bad(`fleet_log: ${view.status}`);

  console.log("Claiming a callsign:");
  const reg = await rpc("forge_register", { p_callsign: callsign });
  code = reg.code;
  if (/^[0-9a-f]{32}$/.test(code) && typeof reg.pilot_id === "string") ok("forge_register issues a 128-bit code");
  else bad(`forge_register returned ${JSON.stringify(reg)}`);
  await mustFail("claiming it again", rpc("forge_register", { p_callsign: callsign }), "CALLSIGN_TAKEN");
  await mustFail("a reserved name", rpc("forge_register", { p_callsign: "admin" }), "CALLSIGN_RESERVED");
  await mustFail("an invalid name", rpc("forge_register", { p_callsign: "Rack Rat" }), "CALLSIGN_INVALID");

  console.log("Signing in:");
  await mustFail("a wrong code", rpc("forge_sign_in", { p_callsign: callsign, p_code: "0".repeat(32) }), "AUTH_FAILED");
  await mustFail("a wrong callsign", rpc("forge_sign_in", { p_callsign: "nobody_here_" + callsign.slice(-4), p_code: code }), "AUTH_FAILED");
  const signedIn = await rpc("forge_sign_in", { p_callsign: callsign, p_code: code });
  if (signedIn.save_rev === 0) ok("forge_sign_in: no save yet");
  else bad(`forge_sign_in: ${JSON.stringify(signedIn)}`);

  console.log("The save:");
  const empty = await rpc("forge_load", { p_callsign: callsign, p_code: code });
  if (empty.data === null && empty.rev === 0) ok("forge_load: empty");
  else bad(`forge_load: ${JSON.stringify(empty)}`);
  const save1 = await rpc("forge_save", { p_callsign: callsign, p_code: code, p_data: { app: "smoke", data: { n: 1 } } });
  if (save1.rev === 1) ok("forge_save: rev 1");
  else bad(`forge_save: ${JSON.stringify(save1)}`);
  await mustFail("saving again within a second", rpc("forge_save", { p_callsign: callsign, p_code: code, p_data: { app: "smoke", data: { n: 2 } } }), "RATE_LIMITED");
  await mustFail("saving a non-object", rpc("forge_save", { p_callsign: callsign, p_code: code, p_data: [1, 2] }), "SAVE_INVALID");
  await sleep(1200);
  const save2 = await rpc("forge_save", { p_callsign: callsign, p_code: code, p_data: { app: "smoke", data: { n: 2 } } });
  if (save2.rev === 2) ok("forge_save: rev 2 after a second");
  else bad(`forge_save (2): ${JSON.stringify(save2)}`);
  const loaded = await rpc("forge_load", { p_callsign: callsign, p_code: code });
  if (loaded.rev === 2 && loaded.data?.data?.n === 2) ok("forge_load returns the latest save");
  else bad(`forge_load: ${JSON.stringify(loaded)}`);

  console.log("The Fleet Log:");
  const logged = await rpc("forge_log", { p_callsign: callsign, p_code: code, p_kind: "ticket_resolved", p_ref: "orientation", p_value: 92 });
  if (typeof logged.id === "number" || typeof logged.id === "string") ok("forge_log accepts a well-formed row");
  else bad(`forge_log: ${JSON.stringify(logged)}`);
  await mustFail("an unknown kind", rpc("forge_log", { p_callsign: callsign, p_code: code, p_kind: "hacked", p_ref: "x", p_value: null }), "ACTIVITY_INVALID");
  await mustFail("a ref with markup", rpc("forge_log", { p_callsign: callsign, p_code: code, p_kind: "badge_earned", p_ref: "<b>hi</b>", p_value: null }), "ACTIVITY_INVALID");
  await mustFail("logging without the code", rpc("forge_log", { p_callsign: callsign, p_code: "f".repeat(32), p_kind: "badge_earned", p_ref: "cards-10", p_value: null }), "AUTH_FAILED");
  const feed = await raw("GET", `fleet_log?select=callsign,kind,ref,value&callsign=eq.${callsign}`);
  if (feed.status === 200 && feed.body.length === 1 && feed.body[0].kind === "ticket_resolved" && Number(feed.body[0].value) === 92) ok("the row is in fleet_log under the callsign");
  else bad(`fleet_log after logging: ${feed.status} ${JSON.stringify(feed.body)}`);

  console.log("Rotating the code:");
  const rotated = await rpc("forge_rotate_code", { p_callsign: callsign, p_code: code });
  const oldCode = code;
  code = rotated.code;
  await mustFail("the old code afterwards", rpc("forge_sign_in", { p_callsign: callsign, p_code: oldCode }), "AUTH_FAILED");
  const again = await rpc("forge_sign_in", { p_callsign: callsign, p_code: code });
  if (again.save_rev === 2) ok("the new code signs in and sees the save");
  else bad(`sign-in after rotate: ${JSON.stringify(again)}`);
} catch (err) {
  bad(`unexpected: ${err.message}`);
} finally {
  if (code) {
    try {
      await rpc("forge_delete_account", { p_callsign: callsign, p_code: code });
      await mustFail("signing in after deletion", rpc("forge_sign_in", { p_callsign: callsign, p_code: code }), "AUTH_FAILED");
      const gone = await raw("GET", `fleet_log?select=id&callsign=eq.${callsign}`);
      if (gone.status === 200 && gone.body.length === 0) ok("deletion took the log rows with it");
      else bad(`fleet_log after deletion: ${JSON.stringify(gone.body)}`);
    } catch (err) {
      bad(`cleanup: ${err.message}`);
    }
  }
}
console.log(failures === 0 ? "PASS" : `FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
