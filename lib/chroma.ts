import { ChromaClient, Collection } from "chromadb";

const COLLECTION_NAME = "knowledgebase";

let client: ChromaClient | null = null;
let collection: Collection | null = null;

function getChromaUrl(): string {
  return process.env.CHROMA_URL ?? "http://localhost:8000";
}

export async function getChromaClient(): Promise<ChromaClient> {
  if (!client) {
    client = new ChromaClient({ path: getChromaUrl() });
  }
  return client;
}

export async function getCollection(): Promise<Collection> {
  if (collection) return collection;

  const chromaClient = await getChromaClient();

  try {
    collection = await chromaClient.getOrCreateCollection({
      name: COLLECTION_NAME,
      metadata: { "hnsw:space": "cosine" },
    });
  } catch (error) {
    console.error("[ChromaDB] Failed to connect or create collection:", error);
    throw new Error(
      "Failed to connect to ChromaDB. Make sure Docker is running with docker-compose up."
    );
  }

  return collection;
}

export async function resetCollection(): Promise<void> {
  const chromaClient = await getChromaClient();

  try {
    await chromaClient.deleteCollection({ name: COLLECTION_NAME });
  } catch {
    // Collection may not exist yet
  }

  collection = null;
  await getCollection();
}
