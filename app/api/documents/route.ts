import { NextResponse } from "next/server";
import { listDocuments } from "@/lib/documents";
import { getErrorMessage } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET() {
  try {
    const documents = await listDocuments();
    return NextResponse.json({ documents });
  } catch (error) {
    console.error("[GET /api/documents] Error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
