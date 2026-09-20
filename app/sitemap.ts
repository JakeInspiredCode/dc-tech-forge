import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";
import { ALL_MISSIONS } from "@/lib/seeds/campaigns";

export const dynamic = "force-static";

const HUBS = ["", "/missions", "/arsenal", "/battle-station", "/profile"];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...HUBS.map((path) => ({ url: `${BRAND.url}${path}`, priority: path === "" ? 1 : 0.8 })),
    ...ALL_MISSIONS.map((m) => ({ url: `${BRAND.url}/missions/${m.id}`, priority: 0.6 })),
  ];
}
