/** @type {import('next').NextConfig} */
const nextConfig = {
  // Les pages statiques déjà en ligne (dans /public) restent servies telles quelles.
  async rewrites() {
    return [{ source: "/", destination: "/index.html" }];
  },
};
export default nextConfig;
