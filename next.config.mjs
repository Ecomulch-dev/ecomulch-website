/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    // Until go-live (ALLOW_INDEXING=true) ask search engines not to index
    // anything, images included. See src/lib/indexing.ts.
    if (process.env.ALLOW_INDEXING === "true") return [];
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
  async redirects() {
    // November 2026: "Say No to Bare Soil" became a campaign inside the new
    // Organic Soil Cover pillar. Keep old links working.
    const osc = "/organic-soil-cover";
    return [
      { source: "/say-no-to-bare-soil", destination: `${osc}/our-response/say-no-to-bare-soil`, permanent: false },
      { source: "/say-no-to-bare-soil/the-challenge", destination: `${osc}/the-challenge`, permanent: false },
      { source: "/say-no-to-bare-soil/our-response", destination: `${osc}/our-response`, permanent: false },
      {
        source: "/say-no-to-bare-soil/our-response/help-build-the-movement",
        destination: `${osc}/our-response/say-no-to-bare-soil`,
        permanent: false,
      },
      {
        source: "/say-no-to-bare-soil/our-response/mulching-your-home",
        destination: `${osc}/our-response/organic-mulches`,
        permanent: false,
      },
      { source: "/say-no-to-bare-soil/:rest*", destination: osc, permanent: false },
    ];
  },
};

export default nextConfig;
