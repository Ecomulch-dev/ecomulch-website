/**
 * Search-engine indexing switch. The site is kept out of search results
 * (noindex + robots.txt disallow) until ALLOW_INDEXING=true is set in the
 * hosting environment, which happens at go-live on ecomulch.co.ke. This keeps
 * preview deployments from competing with the live site.
 */
export const allowIndexing = process.env.ALLOW_INDEXING === "true";
