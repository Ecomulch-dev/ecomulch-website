/**
 * Where blog articles live. All articles are kept together in one CMS record
 * ("blog-articles"), using the same storage as the pages; until the blog is
 * first saved in the admin, the built-in seed articles are served.
 */
import { getRepository } from "@/lib/content/repository";
import { readSafely, type ReadOptions } from "@/lib/content/store";
import { SEED_ARTICLES, type Article } from "./articles";

const RECORD = "blog-articles";

export async function loadArticles(opts?: ReadOptions): Promise<Article[]> {
  const saved = await readSafely("blog articles", () => getRepository().getPage(RECORD), opts);
  const list = saved?.content?.articles;
  return Array.isArray(list) ? (list as Article[]) : SEED_ARTICLES;
}

export async function saveArticles(articles: Article[]): Promise<void> {
  await getRepository().savePage({
    slug: RECORD,
    title: "Blog articles",
    path: "/blog",
    blocks: [],
    content: { articles },
  });
}
