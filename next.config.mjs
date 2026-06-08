/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "@pinecone-database/pinecone",
      "pdf-parse",
      "mammoth",
      "@langchain/community",
    ],
  },
};

export default nextConfig;
