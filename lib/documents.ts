import {
  deleteChunksByDocId,
  fetchRegistryRecords,
  listRegistryIds,
  registryRecordExists,
  upsertRegistryRecord,
} from "@/lib/pinecone";
import type { Document } from "@/types";

function metadataToDocument(
  metadata: Record<string, unknown> | undefined
): Document | null {
  if (!metadata) return null;

  const docId = String(metadata.docId ?? "");
  const docName = String(metadata.docName ?? "");
  const type = metadata.type as Document["type"];
  const chunkCount = Number(metadata.chunkCount ?? 0);
  const createdAt = String(metadata.createdAt ?? "");

  if (!docId || !docName || !type || !createdAt) {
    return null;
  }

  return {
    id: docId,
    name: docName,
    type,
    chunkCount,
    createdAt,
  };
}

export async function listDocuments(): Promise<Document[]> {
  const ids = await listRegistryIds();
  const records = await fetchRegistryRecords(ids);

  const documents = Object.values(records)
    .map((record) => metadataToDocument(record.metadata as Record<string, unknown>))
    .filter((document): document is Document => document !== null);

  return documents.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function addDocument(document: Document): Promise<void> {
  await upsertRegistryRecord({
    docId: document.id,
    docName: document.name,
    type: document.type,
    chunkCount: document.chunkCount,
    createdAt: document.createdAt,
  });
}

export async function removeDocument(docId: string): Promise<boolean> {
  const exists = await registryRecordExists(docId);
  if (!exists) {
    return false;
  }

  await deleteChunksByDocId(docId);
  return true;
}

export async function clearAllDocuments(): Promise<void> {
  // Vectors (chunks + registry records) are cleared by deleteAllChunks() in the API route.
}
