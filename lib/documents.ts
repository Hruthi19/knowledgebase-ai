import { promises as fs } from "fs";
import path from "path";
import type { Document } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const REGISTRY_PATH = path.join(DATA_DIR, "documents.json");

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readRegistry(): Promise<Document[]> {
  try {
    const raw = await fs.readFile(REGISTRY_PATH, "utf-8");
    return JSON.parse(raw) as Document[];
  } catch {
    return [];
  }
}

async function writeRegistry(documents: Document[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(REGISTRY_PATH, JSON.stringify(documents, null, 2), "utf-8");
}

export async function listDocuments(): Promise<Document[]> {
  const documents = await readRegistry();
  return documents.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function addDocument(document: Document): Promise<void> {
  const documents = await readRegistry();
  documents.push(document);
  await writeRegistry(documents);
}

export async function removeDocument(docId: string): Promise<boolean> {
  const documents = await readRegistry();
  const filtered = documents.filter((doc) => doc.id !== docId);

  if (filtered.length === documents.length) {
    return false;
  }

  await writeRegistry(filtered);
  return true;
}

export async function clearAllDocuments(): Promise<void> {
  await writeRegistry([]);
}
