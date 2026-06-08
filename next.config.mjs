/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "chromadb",
      "pdf-parse",
      "mammoth",
      "@langchain/community",
    ],
  },
};

export default nextConfig;
