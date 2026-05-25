import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloud Run (Docker) デプロイ用: standaloneモードで最小イメージを生成
  output: "standalone",
  images: {
    remotePatterns: [
      // X (Twitter) のプロフィール画像
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
      },
      // Supabase Storage（将来の利用に備えて）
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
