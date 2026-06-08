import { embedText } from "@/lib/embeddings";
import { queryChunks } from "@/lib/pinecone";
import type { SourceChunk } from "@/types";

const TOP_K = 5;

export function buildSystemPrompt(context: string): string {
  return `You are a helpful knowledge assistant. Answer the user's question using ONLY the context provided below.
If the answer is not found in the context, say "I couldn't find that in the uploaded documents."
Never make up information. Always cite your sources by referencing the document name and chunk.

Context:
${context}`;
}

function metadataToSourceChunk(
  content: string,
  metadata: Record<string, unknown>
): SourceChunk {
  return {
    docId: String(metadata.docId ?? ""),
    docName: String(metadata.docName ?? "Unknown"),
    chunkIndex: Number(metadata.chunkIndex ?? 0),
    totalChunks: Number(metadata.totalChunks ?? 0),
    content,
    sourceType: metadata.sourceType as SourceChunk["sourceType"],
    pageNumber:
      metadata.pageNumber !== undefined
        ? Number(metadata.pageNumber)
        : undefined,
  };
}

export function assembleContext(chunks: SourceChunk[]): string {
  return chunks
    .map(
      (chunk, i) =>
        `[Source ${i + 1}] Document: "${chunk.docName}" | Chunk: ${chunk.chunkIndex + 1}/${chunk.totalChunks}${
          chunk.pageNumber ? ` | Page: ${chunk.pageNumber}` : ""
        }\n${chunk.content}`
    )
    .join("\n\n---\n\n");
}

export async function retrieveRelevantChunks(
  query: string,
  docIds?: string[]
): Promise<SourceChunk[]> {
  const queryEmbedding = await embedText(query);
  const results = await queryChunks(queryEmbedding, TOP_K, docIds);
  const matches = results.matches ?? [];
  const chunks: SourceChunk[] = [];

  for (const match of matches) {
    const metadata = match.metadata;

    if (!metadata) continue;

    const content = String(metadata.content ?? "");
    if (!content) continue;

    chunks.push(
      metadataToSourceChunk(content, metadata as Record<string, unknown>)
    );
  }

  return chunks;
}

export async function retrieveContext(
  query: string,
  docIds?: string[]
): Promise<{ context: string; sources: SourceChunk[] }> {
  const sources = await retrieveRelevantChunks(query, docIds);
  const context = assembleContext(sources);
  return { context, sources };
}
