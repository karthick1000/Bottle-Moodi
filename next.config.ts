import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error nodeMiddleware is not yet in the TS types but is valid in Next.js 15.3+
    nodeMiddleware: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
