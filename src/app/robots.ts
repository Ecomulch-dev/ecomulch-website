import type { MetadataRoute } from "next";
import { allowIndexing } from "@/lib/indexing";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return allowIndexing
    ? { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] } }
    : { rules: { userAgent: "*", disallow: "/" } };
}
