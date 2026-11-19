/**
 * High-level content access used by pages and the admin. Falls back to the
 * bundled seed when a page/settings row has never been saved, so the site
 * renders correctly on day one, before anything has been edited.
 */
import { getRepository } from "./repository";
import { SEED_PAGES, SEED_SETTINGS, PAGE_INDEX } from "./seed";
import type { Page, SiteSettings } from "./types";
import type { SiteMapEntry } from "./site-map";
import { mergeContent } from "./merge";

/**
 * Public pages must keep working if the database is briefly unreachable or
 * misconfigured (and a build must not fail because of it): reads fall back to
 * the built-in content and the error is logged. The admin passes
 * `strict: true` so it never edits, and then saves over, stale content.
 */
export type ReadOptions = { strict?: boolean };

export async function readSafely<T>(what: string, read: () => Promise<T>, opts?: ReadOptions): Promise<T | null> {
  if (opts?.strict) return read();
  try {
    return await read();
  } catch (err) {
    console.error(`[content] Could not read ${what} from the database; showing built-in content instead.`, err);
    return null;
  }
}

/** A readable one-line description of a database error, for the admin. */
export function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    const e = err as { message?: string; hint?: string; code?: string };
    return [e.message, e.hint, e.code && `(code ${e.code})`].filter(Boolean).join(" ") || JSON.stringify(err);
  }
  return String(err);
}

/** Is the content database reachable and set up? Shown on the admin dashboard. */
export async function checkBackend(): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await getRepository().getSettings();
    await getRepository().getPage("home");
    return { ok: true };
  } catch (err) {
    return { ok: false, message: describeError(err) };
  }
}

export async function getPage(slug: string, opts?: ReadOptions): Promise<Page | null> {
  const saved = await readSafely(`page "${slug}"`, () => getRepository().getPage(slug), opts);
  if (saved) return saved;
  return SEED_PAGES[slug] ?? null;
}

export async function savePage(page: Page): Promise<void> {
  await getRepository().savePage(page);
}

export async function getSettings(opts?: ReadOptions): Promise<SiteSettings> {
  const saved = await readSafely("site settings", () => getRepository().getSettings(), opts);
  const s = saved ? { ...SEED_SETTINGS, ...saved } : SEED_SETTINGS;
  return { ...s, nav: renamePillars(s.nav) };
}

/**
 * November 2026: "Say No to Bare Soil" became a campaign inside the new
 * "Organic Soil Cover" pillar. Menus saved before the change still carry the
 * old item, so swap it for the new pillar wherever it appears.
 */
function renamePillars(nav: SiteSettings["nav"]): SiteSettings["nav"] {
  return (nav ?? []).map((n) =>
    (n.href ?? "").replace(/\/$/, "") === "/say-no-to-bare-soil"
      ? { ...n, label: "Organic Soil Cover", href: "/organic-soil-cover" }
      : n,
  );
}

export async function saveSettings(settings: SiteSettings): Promise<void> {
  await getRepository().saveSettings(settings);
}

/** The pages offered in the admin: the known index, plus any already saved. */
export function listPages(): SiteMapEntry[] {
  return PAGE_INDEX;
}

/**
 * Content for a fixed-layout page: the page's built-in defaults with any
 * edits saved in the admin layered on top.
 */
export async function getPageContent<T>(slug: string, defaults: T, opts?: ReadOptions): Promise<T> {
  const saved = await readSafely(`page "${slug}"`, () => getRepository().getPage(slug), opts);
  return mergeContent(defaults, saved?.content);
}

/** Last-saved timestamp for each page that has been edited in the admin. */
export async function lastEdited(slugs: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all(
    slugs.map(async (slug) => {
      try {
        const p = await getRepository().getPage(slug);
        if (p?.updatedAt) out[slug] = p.updatedAt;
      } catch {
        /* unreadable entries just show no date */
      }
    }),
  );
  return out;
}

/** Build the live WhatsApp link from settings. */
export function whatsappUrl(settings: SiteSettings): string {
  return `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
    settings.whatsappMessage,
  )}`;
}

/** Settings-backed values for {whatsapp}-style link shortcuts in page content. */
export async function linkSettings() {
  const s = await getSettings();
  return {
    whatsapp: whatsappUrl(s),
    whatsappCatalogueUrl: s.whatsappCatalogueUrl,
    youtubeUrl: s.youtubeUrl,
    flowerBedsYoutubeUrl: s.flowerBedsYoutubeUrl,
    snbsPlaylistUrl: s.snbsPlaylistUrl ?? "",
  };
}
