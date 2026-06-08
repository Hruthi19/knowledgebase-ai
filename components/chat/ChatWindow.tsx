"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessage } from "@/types";

const SUGGESTED_QUESTIONS = [
  "What are the main topics in my documents?",
  "Summarize what you know",
  "What questions can you answer?",
];

interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  hasDocuments: boolean;
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-slate-400 animate-typing-dot"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ChatWindow({
  messages,
  onSendMessage,
  isLoading,
  hasDocuments,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const isEmpty = messages.length === 0;
  const showTyping =
    isLoading && messages[messages.length - 1]?.role !== "assistant";

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {isEmpty && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-6 rounded-full bg-blue-50 p-4">
                <span className="text-3xl">📚</span>
              </div>
              <h2 className="mb-2 text-xl font-semibold text-slate-800">
                KnowledgeBase AI
              </h2>
              <p className="mb-8 max-w-md text-sm text-slate-500">
                {hasDocuments
                  ? "Ask questions about your uploaded documents. Answers include inline source citations."
                  : "Upload documents or paste a URL in the left panel to get started."}
              </p>
              {hasDocuments && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Suggested questions
                  </p>
                  {SUGGESTED_QUESTIONS.map((question) => (
                    <button
                      key={question}
                      onClick={() => onSendMessage(question)}
                      disabled={isLoading}
                      className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {showTyping && <TypingIndicator />}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
