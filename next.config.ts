import type { NextConfig } from "next";

// Public files in Supabase Storage (course covers, avatars, blog images), once the project URL is set.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;

const nextConfig: NextConfig = {
  experimental: {
    // Studio → Media library accepts files up to 10 MB (plus form overhead).
    serverActions: { bodySizeLimit: "11mb" },
  },
  images: {
    remotePatterns: [
      // YouTube video thumbnails for the lesson player.
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**", search: "" },
      // Profile photos of people who signed up with Google.
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      ...(supabaseHost
        ? [
            {
              protocol: supabaseHost.protocol.replace(":", "") as "http" | "https",
              hostname: supabaseHost.hostname,
              port: supabaseHost.port,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
