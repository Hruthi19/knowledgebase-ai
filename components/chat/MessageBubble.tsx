"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { CitationCard } from "@/components/chat/CitationCard";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

interface MessageBubbleProps {
  message: ChatMessage;
}

function renderContentWithBadges(content: string, message: ChatMessage) {
  if (!message.sources?.length || message.role !== "assistant") {
    return <p className="whitespace-pre-wrap leading-relaxed">{content}</p>;
  }

  const docNames = Array.from(new Set(message.sources.map((s) => s.docName)));
  const parts: ReactNode[] = [];
  let remaining = content;
  let key = 0;

  while (remaining.length > 0) {
    let earliestMatch: { index: number; name: string } | null = null;

    for (const name of docNames) {
      const idx = remaining.indexOf(name);
      if (idx !== -1 && (earliestMatch === null || idx < earliestMatch.index)) {
        earliestMatch = { index: idx, name };
      }
    }

    if (!earliestMatch) {
      parts.push(
        <span key={key++} className="whitespace-pre-wrap">
          {remaining}
        </span>
      );
      break;
    }

    if (earliestMatch.index > 0) {
      parts.push(
        <span key={key++} className="whitespace-pre-wrap">
          {remaining.slice(0, earliestMatch.index)}
        </span>
      );
    }

    parts.push(
      <Badge key={key++} variant="source" className="mx-0.5 inline-flex align-middle">
        {earliestMatch.name}
      </Badge>
    );

    remaining = remaining.slice(
      earliestMatch.index + earliestMatch.name.length
    );
  }

  return <div className="leading-relaxed">{parts}</div>;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-blue-600 text-white"
            : "border border-slate-200 bg-white text-slate-800 shadow-sm"
        )}
      >
        {renderContentWithBadges(message.content, message)}

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Sources
            </p>
            <div className="space-y-2">
              {message.sources.map((source, i) => (
                <CitationCard key={`${source.docId}-${source.chunkIndex}`} source={source} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
