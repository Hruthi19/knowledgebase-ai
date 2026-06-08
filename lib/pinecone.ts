import { Pinecone, type RecordMetadataValue } from "@pinecone-database/pinecone";

const BATCH_SIZE = 100;
const EMBEDDING_DIMENSION = 1536;
const REGISTRY_PREFIX = "registry-";
const CHUNK_RECORD_TYPE = "chunk";
const REGISTRY_RECORD_TYPE = "registry";

let client: Pinecone | null = null;

function getRegistryPlaceholderVector(): number[] {
  const vector = Array.from({ length: EMBEDDING_DIMENSION }, () => 0);
  vector[0] = 1;
  return vector;
}

export function registryIdFor(docId: string): string {
  return `${REGISTRY_PREFIX}${docId}`;
}

function getIndexName(): string {
  return process.env.PINECONE_INDEX_NAME ?? "knowledgebase";
}

function getPineconeClient(): Pinecone {
  if (!client) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error("PINECONE_API_KEY is not configured");
    }

    client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  }

  return client;
}

export async function getIndex() {
  try {
    const pc = getPineconeClient();
    return pc.index(getIndexName());
  } catch (error) {
    console.error("[Pinecone] Failed to connect to index:", error);
    throw new Error(
      "Failed to connect to Pinecone. Check PINECONE_API_KEY and PINECONE_INDEX_NAME."
    );
  }
}

export interface ChunkMetadata {
  docId: string;
  docName: string;
  chunkIndex: number;
  totalChunks: number;
  sourceType: string;
  content: string;
  pageNumber?: number;
}

function toPineconeMetadata(metadata: ChunkMetadata): Record<string, RecordMetadataValue> {
  const record: Record<string, RecordMetadataValue> = {
    recordType: CHUNK_RECORD_TYPE,
    docId: metadata.docId,
    docName: metadata.docName,
    chunkIndex: metadata.chunkIndex,
    totalChunks: metadata.totalChunks,
    sourceType: metadata.sourceType,
    content: metadata.content,
  };

  if (metadata.pageNumber !== undefined) {
    record.pageNumber = metadata.pageNumber;
  }

  return record;
}

export async function upsertChunks(
  ids: string[],
  embeddings: number[][],
  metadatas: ChunkMetadata[]
): Promise<void> {
  if (embeddings.some((embedding) => embedding.length !== EMBEDDING_DIMENSION)) {
    throw new Error(
      `Embedding dimension must be ${EMBEDDING_DIMENSION}. Check your Pinecone index configuration.`
    );
  }

  const index = await getIndex();
  const records = ids.map((id, i) => ({
    id,
    values: embeddings[i],
    metadata: toPineconeMetadata(metadatas[i]),
  }));

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    await index.upsert(records.slice(i, i + BATCH_SIZE));
  }
}

function buildChunkFilter(docIds?: string[]) {
  const chunkFilter = { recordType: { $eq: CHUNK_RECORD_TYPE } };

  if (docIds && docIds.length > 0) {
    return {
      $and: [chunkFilter, { docId: { $in: docIds } }],
    };
  }

  return chunkFilter;
}

export async function queryChunks(
  queryEmbedding: number[],
  topK: number,
  docIds?: string[]
) {
  const index = await getIndex();

  return index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
    filter: buildChunkFilter(docIds),
  });
}

export async function upsertRegistryRecord(metadata: {
  docId: string;
  docName: string;
  type: string;
  chunkCount: number;
  createdAt: string;
}): Promise<void> {
  const index = await getIndex();

  await index.upsert([
    {
      id: registryIdFor(metadata.docId),
      values: getRegistryPlaceholderVector(),
      metadata: {
        recordType: REGISTRY_RECORD_TYPE,
        docId: metadata.docId,
        docName: metadata.docName,
        type: metadata.type,
        chunkCount: metadata.chunkCount,
        createdAt: metadata.createdAt,
      },
    },
  ]);
}

export async function listRegistryIds(): Promise<string[]> {
  const index = await getIndex();
  const ids: string[] = [];
  let paginationToken: string | undefined;

  do {
    const response = await index.listPaginated({
      prefix: REGISTRY_PREFIX,
      limit: 100,
      ...(paginationToken ? { paginationToken } : {}),
    });

    const vectors = response.vectors ?? [];
    ids.push(...vectors.map((vector) => vector.id).filter(Boolean) as string[]);
    paginationToken = response.pagination?.next;
  } while (paginationToken);

  return ids;
}

export async function fetchRegistryRecords(ids: string[]) {
  if (ids.length === 0) {
    return {};
  }

  const index = await getIndex();
  const response = await index.fetch(ids);
  return response.records;
}

export async function registryRecordExists(docId: string): Promise<boolean> {
  const index = await getIndex();
  const response = await index.fetch([registryIdFor(docId)]);
  return Boolean(response.records[registryIdFor(docId)]);
}

export async function deleteChunksByDocId(docId: string): Promise<void> {
  const index = await getIndex();
  await index.deleteMany({ docId: { $eq: docId } });
}

export async function deleteAllChunks(): Promise<void> {
  const index = await getIndex();
  await index.deleteAll();
}
