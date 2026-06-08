import { NextRequest, NextResponse } from "next/server";
import {
  ingestPdf,
  ingestTxt,
  ingestDocx,
  ingestFromUrl,
} from "@/lib/ingest";
import { getErrorMessage } from "@/lib/utils";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "text/plain": "txt",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
};

function getExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function isOpenAIRateLimit(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes("429") || message.includes("rate limit");
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body = await request.json();

      if (!body.url || typeof body.url !== "string") {
        return NextResponse.json(
          { success: false, error: "URL is required" },
          { status: 400 }
        );
      }

      const result = await ingestFromUrl(body.url.trim());
      return NextResponse.json({ success: true, ...result });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: "File is required" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const fileName =
      file instanceof File ? file.name : "uploaded-document";
    const mimeType = file.type;
    const extension = getExtension(fileName);

    let fileType = ALLOWED_TYPES[mimeType];

    if (!fileType) {
      if (extension === "pdf") fileType = "pdf";
      else if (extension === "txt") fileType = "txt";
      else if (extension === "docx") fileType = "docx";
    }

    if (!fileType) {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported file type. Allowed: PDF, TXT, DOCX",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let result;
    switch (fileType) {
      case "pdf":
        result = await ingestPdf(buffer, fileName);
        break;
      case "txt":
        result = await ingestTxt(buffer, fileName);
        break;
      case "docx":
        result = await ingestDocx(buffer, fileName);
        break;
      default:
        return NextResponse.json(
          { success: false, error: "Unsupported file type" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[POST /api/ingest] Error:", error);

    if (isOpenAIRateLimit(error)) {
      return NextResponse.json(
        {
          success: false,
          error: "OpenAI rate limit reached. Please try again in a moment.",
        },
        { status: 429 }
      );
    }

    const message = getErrorMessage(error);

    if (message.includes("ChromaDB")) {
      return NextResponse.json(
        { success: false, error: message },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
