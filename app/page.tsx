"use client";

import { useCallback, useRef } from "react";
import { useChat } from "ai/react";
import { toast } from "sonner";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatInput } from "@/components/chat/ChatInput";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { useAppStore } from "@/store/useAppStore";
import type { ChatMessage, SourceChunk } from "@/types";

export default function HomePage() {
  const documents = useAppStore((s) => s.documents);
  const selectedDocIds = useAppStore((s) => s.selectedDocIds);
  const clearDocuments = useAppStore((s) => s.clearDocuments);
  const messageSourcesRef = useRef<Record<string, SourceChunk[]>>({});
  const sourcesRef = useRef<SourceChunk[]>([]);

  const { messages, append, isLoading, setMessages: setChatMessages } = useChat({
    api: "/api/chat",
    body: {
      docIds: selectedDocIds.length > 0 ? selectedDocIds : undefined,
    },
    onResponse: (response) => {
      const sourcesHeader = response.headers.get("x-sources");
      if (sourcesHeader) {
        try {
          sourcesRef.current = JSON.parse(
            decodeURIComponent(sourcesHeader)
          ) as SourceChunk[];
        } catch (error) {
          console.error("[Chat] Failed to parse sources header:", error);
          sourcesRef.current = [];
        }
      }
    },
    onFinish: (message) => {
      if (sourcesRef.current.length > 0) {
        messageSourcesRef.current[message.id] = sourcesRef.current;
      }
      sourcesRef.current = [];
    },
    onError: (error) => {
      console.error("[Chat] Stream error:", error);
      toast.error(error.message || "Failed to get a response");
    },
  });

  const displayMessages: ChatMessage[] = messages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    sources: messageSourcesRef.current[m.id],
  }));

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (documents.length === 0) {
        toast.error("Upload a document first");
        return;
      }

      await append(
        { role: "user", content },
        {
          body: {
            docIds: selectedDocIds.length > 0 ? selectedDocIds : undefined,
          },
        }
      );
    },
    [append, documents.length, selectedDocIds]
  );

  const handleNewChat = useCallback(async () => {
    try {
      const response = await fetch("/api/documents/all", { method: "DELETE" });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to reset session");
      }

      clearDocuments();
      setChatMessages([]);
      messageSourcesRef.current = {};
      sourcesRef.current = [];
      toast.success("New chat started");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start new chat";
      console.error("[HomePage] New chat error:", error);
      toast.error(message);
    }
  }, [clearDocuments, setChatMessages]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar onNewChat={handleNewChat} />
      <main className="flex w-1/2 min-w-0 flex-col overflow-hidden">
        <ChatWindow
          messages={displayMessages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          hasDocuments={documents.length > 0}
        />
        <ChatInput
          onSend={handleSendMessage}
          isLoading={isLoading}
          disabled={documents.length === 0}
        />
      </main>
    </div>
  );
}
