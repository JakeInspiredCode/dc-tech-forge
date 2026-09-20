import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: BRAND.shortMark,
    description: BRAND.description,
    start_url: "/",
    display: "standalone",
    background_color: "#050508",
    theme_color: "#050508",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
  };
}
