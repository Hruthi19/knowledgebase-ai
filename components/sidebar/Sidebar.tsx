"use client";

import { useEffect } from "react";
import { Trash2, BookOpen, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DocumentItem } from "@/components/sidebar/DocumentItem";
import { UploadZone } from "@/components/sidebar/UploadZone";
import { useAppStore } from "@/store/useAppStore";

interface SidebarProps {
  onNewChat: () => void;
}

export function Sidebar({ onNewChat }: SidebarProps) {
  const documents = useAppStore((s) => s.documents);
  const selectedDocIds = useAppStore((s) => s.selectedDocIds);
  const setDocuments = useAppStore((s) => s.setDocuments);
  const removeDocument = useAppStore((s) => s.removeDocument);
  const clearDocuments = useAppStore((s) => s.clearDocuments);
  const toggleDocSelection = useAppStore((s) => s.toggleDocSelection);

  useEffect(() => {
    async function syncDocuments() {
      try {
        const response = await fetch("/api/documents");
        if (response.ok) {
          const data = await response.json();
          if (data.documents?.length > 0 && documents.length === 0) {
            setDocuments(data.documents);
          }
        }
      } catch (error) {
        console.error("[Sidebar] Failed to sync documents:", error);
      }
    }
    syncDocuments();
    // Only sync on mount when local store is empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (docId: string) => {
    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to delete document");
      }

      removeDocument(docId);
      toast.success("Document removed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete failed";
      console.error("[Sidebar] Delete error:", error);
      toast.error(message);
    }
  };

  const handleClearAll = async () => {
    if (documents.length === 0) return;

    try {
      const response = await fetch("/api/documents/all", {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to clear documents");
      }

      clearDocuments();
      toast.success("All documents cleared");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Clear failed";
      console.error("[Sidebar] Clear all error:", error);
      toast.error(message);
    }
  };

  return (
    <aside className="flex h-full w-1/2 min-w-0 flex-col border-r border-slate-200 bg-slate-50">
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-800">KnowledgeBase AI</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onNewChat}
            className="shrink-0"
          >
            <MessageSquarePlus className="mr-1.5 h-4 w-4" />
            New Chat
          </Button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Upload docs and chat with your knowledge base
        </p>
      </div>

      <div className="shrink-0 border-b border-slate-200 px-6 py-5">
        <UploadZone />
      </div>

      <div className="flex shrink-0 items-center justify-between px-6 py-3">
        <h2 className="text-sm font-semibold text-slate-700">
          Documents ({documents.length})
        </h2>
        {documents.length > 0 && (
          <p className="text-xs text-slate-400">Select to filter chat</p>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1 px-6">
        {documents.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            No documents yet. Upload a file or paste a URL above.
          </p>
        ) : (
          <div className="space-y-2 pb-4">
            {documents.map((doc) => (
              <DocumentItem
                key={doc.id}
                document={doc}
                onDelete={handleDelete}
                isSelected={selectedDocIds.includes(doc.id)}
                onToggleSelect={toggleDocSelection}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {documents.length > 0 && (
        <div className="shrink-0 border-t border-slate-200 p-6">
          <Button
            variant="outline"
            className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleClearAll}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear all
          </Button>
        </div>
      )}
    </aside>
  );
}
