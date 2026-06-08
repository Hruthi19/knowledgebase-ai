import { NextRequest, NextResponse } from "next/server";
import { deleteAllChunks, deleteChunksByDocId } from "@/lib/pinecone";
import { removeDocument, clearAllDocuments } from "@/lib/documents";
import { getErrorMessage } from "@/lib/utils";

export const runtime = "nodejs";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (id === "all") {
      await clearAllDocuments();
      await deleteAllChunks();
      return NextResponse.json({ success: true });
    }

    await deleteChunksByDocId(id);

    const removed = await removeDocument(id);

    if (!removed) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/documents/[id]] Error:", error);

    const message = getErrorMessage(error);

    if (message.includes("Pinecone")) {
      return NextResponse.json({ success: false, error: message }, { status: 503 });
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
