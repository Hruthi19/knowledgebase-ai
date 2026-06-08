import { NextRequest, NextResponse } from "next/server";
import { getCollection, resetCollection } from "@/lib/chroma";
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
      await resetCollection();
      return NextResponse.json({ success: true });
    }

    const collection = await getCollection();

    await collection.delete({
      where: { docId: id },
    });

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

    if (message.includes("ChromaDB")) {
      return NextResponse.json({ success: false, error: message }, { status: 503 });
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
