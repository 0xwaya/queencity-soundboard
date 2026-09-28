import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "s1.ticketm.net" },
      { protocol: "https", hostname: "i.ticketweb.com" },
      { protocol: "https", hostname: "media.ticketmaster.com" },
    ],
  },
};

export default nextConfig;
