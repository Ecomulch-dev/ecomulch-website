/**
 * Storage abstraction. The site and admin only ever talk to a `ContentRepository`;
 * the concrete backend is chosen once, here, from the environment:
 *
 *   - Supabase (Postgres + Storage) when SUPABASE env vars are present — the
 *     live, hosted, database-backed mode.
 *   - Local JSON files under `content/` otherwise — used in development so the
 *     whole CMS runs and is testable with no external services.
 *
 * Both back ends implement the same interface, so nothing else in the app needs
 * to know which is active.
 */
import type { Page, SiteSettings } from "./types";
import { FileRepository } from "./file-repo";
import { SupabaseRepository } from "./supabase-repo";

export type SavedImage = { url: string };

export interface ContentRepository {
  readonly kind: "file" | "supabase";
  getPage(slug: string): Promise<Page | null>;
  savePage(page: Page): Promise<void>;
  getSettings(): Promise<SiteSettings | null>;
  saveSettings(settings: SiteSettings): Promise<void>;
  /** Persist an uploaded image and return its public URL. */
  saveImage(filename: string, bytes: Buffer, contentType: string): Promise<SavedImage>;
}

let cached: ContentRepository | null = null;

/**
 * The Supabase client wants the bare project URL (https://<ref>.supabase.co).
 * Dashboards also show it with an API path such as /rest/v1/, which makes
 * every request fail with PGRST125 "Invalid path specified in request URL",
 * so trim any path, query or trailing slash off what was pasted.
 */
export function projectUrl(raw: string | undefined): string | undefined {
  const v = raw?.trim();
  if (!v) return undefined;
  try {
    const u = new URL(v);
    return `${u.protocol}//${u.host}`;
  } catch {
    return v.replace(/\/(rest|auth|storage)\/v1\/?.*$/, "").replace(/\/+$/, "");
  }
}

export function getRepository(): ContentRepository {
  if (cached) return cached;

  const url = projectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  const repo: ContentRepository =
    url && serviceKey
      ? new SupabaseRepository(url, serviceKey)
      : new FileRepository();
  cached = repo;
  return repo;
}

/** True when the production (database-backed) backend is active. */
export function isLiveBackend(): boolean {
  return getRepository().kind === "supabase";
}
