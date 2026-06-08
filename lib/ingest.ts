import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { v4 as uuidv4 } from "uuid";
import { getCollection } from "@/lib/chroma";
import { embedTexts } from "@/lib/embeddings";
import { addDocument } from "@/lib/documents";
import { parsePdf } from "@/lib/parsers/pdf";
import { parseDocx } from "@/lib/parsers/docx";
import { parseUrl } from "@/lib/parsers/url";
import type { IngestResult, SourceType } from "@/types";

interface ChunkWithMeta {
  text: string;
  pageNumber?: number;
}

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,
  chunkOverlap: 100,
});

async function splitIntoChunks(items: ChunkWithMeta[]): Promise<ChunkWithMeta[]> {
  const allChunks: ChunkWithMeta[] = [];

  for (const item of items) {
    const chunks = await splitter.splitText(item.text);
    for (const chunk of chunks) {
      allChunks.push({
        text: chunk,
        pageNumber: item.pageNumber,
      });
    }
  }

  return allChunks;
}

async function storeChunks(
  docId: string,
  docName: string,
  sourceType: SourceType,
  chunks: ChunkWithMeta[]
): Promise<number> {
  if (chunks.length === 0) {
    throw new Error("No content could be extracted from the document");
  }

  const texts = chunks.map((c) => c.text);
  const embeddings = await embedTexts(texts);
  const collection = await getCollection();

  const ids = chunks.map((_, i) => `${docId}-chunk-${i}`);
  const metadatas = chunks.map((chunk, i) => ({
    docId,
    docName,
    chunkIndex: i,
    totalChunks: chunks.length,
    sourceType,
    ...(chunk.pageNumber !== undefined ? { pageNumber: chunk.pageNumber } : {}),
  }));

  await collection.add({
    ids,
    embeddings,
    documents: texts,
    metadatas,
  });

  return chunks.length;
}

export async function ingestPdf(
  buffer: Buffer,
  fileName: string
): Promise<IngestResult> {
  const docId = uuidv4();
  const parsed = await parsePdf(buffer);

  const items: ChunkWithMeta[] =
    parsed.pages.length > 0
      ? parsed.pages.map((p) => ({ text: p.text, pageNumber: p.pageNumber }))
      : [{ text: parsed.text }];

  const chunks = await splitIntoChunks(items);
  const chunkCount = await storeChunks(docId, fileName, "pdf", chunks);

  await addDocument({
    id: docId,
    name: fileName,
    type: "pdf",
    chunkCount,
    createdAt: new Date().toISOString(),
  });

  return { docId, docName: fileName, chunkCount };
}

export async function ingestTxt(
  buffer: Buffer,
  fileName: string
): Promise<IngestResult> {
  const docId = uuidv4();
  const text = buffer.toString("utf-8").trim();

  if (!text) {
    throw new Error("Text file is empty");
  }

  const chunks = await splitIntoChunks([{ text }]);
  const chunkCount = await storeChunks(docId, fileName, "txt", chunks);

  await addDocument({
    id: docId,
    name: fileName,
    type: "txt",
    chunkCount,
    createdAt: new Date().toISOString(),
  });

  return { docId, docName: fileName, chunkCount };
}

export async function ingestDocx(
  buffer: Buffer,
  fileName: string
): Promise<IngestResult> {
  const docId = uuidv4();
  const text = await parseDocx(buffer);

  if (!text) {
    throw new Error("DOCX file contains no readable text");
  }

  const chunks = await splitIntoChunks([{ text }]);
  const chunkCount = await storeChunks(docId, fileName, "docx", chunks);

  await addDocument({
    id: docId,
    name: fileName,
    type: "docx",
    chunkCount,
    createdAt: new Date().toISOString(),
  });

  return { docId, docName: fileName, chunkCount };
}

export async function ingestFromUrl(url: string): Promise<IngestResult> {
  const docId = uuidv4();
  const text = await parseUrl(url);

  let docName: string;
  try {
    const parsed = new URL(url);
    docName = parsed.hostname + parsed.pathname;
    if (docName.length > 80) {
      docName = docName.slice(0, 77) + "...";
    }
  } catch {
    docName = url.slice(0, 80);
  }

  const chunks = await splitIntoChunks([{ text }]);
  const chunkCount = await storeChunks(docId, docName, "url", chunks);

  await addDocument({
    id: docId,
    name: docName,
    type: "url",
    chunkCount,
    createdAt: new Date().toISOString(),
  });

  return { docId, docName, chunkCount };
}
