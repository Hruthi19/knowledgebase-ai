import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, Document } from "@/types";

interface AppState {
  documents: Document[];
  messages: ChatMessage[];
  isUploading: boolean;
  uploadProgress: number;
  selectedDocIds: string[];

  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  removeDocument: (docId: string) => void;
  clearDocuments: () => void;

  addMessage: (message: ChatMessage) => void;
  updateLastAssistantMessage: (content: string, sources?: ChatMessage["sources"]) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;

  setIsUploading: (isUploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  setSelectedDocIds: (docIds: string[]) => void;
  toggleDocSelection: (docId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      documents: [],
      messages: [],
      isUploading: false,
      uploadProgress: 0,
      selectedDocIds: [],

      setDocuments: (documents) => set({ documents }),

      addDocument: (document) =>
        set((state) => ({
          documents: [document, ...state.documents.filter((d) => d.id !== document.id)],
        })),

      removeDocument: (docId) =>
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== docId),
          selectedDocIds: state.selectedDocIds.filter((id) => id !== docId),
        })),

      clearDocuments: () => set({ documents: [], selectedDocIds: [] }),

      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      updateLastAssistantMessage: (content, sources) =>
        set((state) => {
          const messages = [...state.messages];
          const lastIndex = messages.length - 1;

          if (lastIndex >= 0 && messages[lastIndex].role === "assistant") {
            messages[lastIndex] = {
              ...messages[lastIndex],
              content,
              ...(sources ? { sources } : {}),
            };
          }

          return { messages };
        }),

      setMessages: (messages) => set({ messages }),
      clearMessages: () => set({ messages: [] }),

      setIsUploading: (isUploading) => set({ isUploading }),
      setUploadProgress: (uploadProgress) => set({ uploadProgress }),
      setSelectedDocIds: (selectedDocIds) => set({ selectedDocIds }),

      toggleDocSelection: (docId) =>
        set((state) => ({
          selectedDocIds: state.selectedDocIds.includes(docId)
            ? state.selectedDocIds.filter((id) => id !== docId)
            : [...state.selectedDocIds, docId],
        })),
    }),
    {
      name: "knowledgebase-ai-storage",
      partialize: (state) => ({
        documents: state.documents,
        selectedDocIds: state.selectedDocIds,
      }),
    }
  )
);
