// Where the cloud is. Both values are inlined at build time (NEXT_PUBLIC_*),
// come from the Supabase integration on Vercel, and are public by design: the
// anon key can only reach what supabase/schema.sql grants it. A build without
// them (CI, a laptop without .env.local) simply has no cloud features.

export const CLOUD = {
  url: (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, ""),
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

export function isCloudConfigured(): boolean {
  return CLOUD.url.length > 0 && CLOUD.key.length > 0;
}
