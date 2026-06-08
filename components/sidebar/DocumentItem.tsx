"use client";

import { FileText, Globe, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Document } from "@/types";

interface DocumentItemProps {
  document: Document;
  onDelete: (docId: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (docId: string) => void;
}

function DocIcon({ type }: { type: Document["type"] }) {
  if (type === "url") {
    return <Globe className="h-4 w-4 shrink-0 text-green-600" />;
  }
  return <FileText className="h-4 w-4 shrink-0 text-blue-600" />;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DocumentItem({
  document,
  onDelete,
  isSelected,
  onToggleSelect,
}: DocumentItemProps) {
  return (
    <div
      className={cn(
        "group flex items-start gap-2 rounded-lg border p-3 transition-colors",
        isSelected
          ? "border-blue-300 bg-blue-50"
          : "border-slate-200 bg-white hover:border-slate-300"
      )}
    >
      {onToggleSelect && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(document.id)}
          className="mt-1 h-4 w-4 rounded border-slate-300"
        />
      )}
      <DocIcon type={document.type} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800" title={document.name}>
          {document.name}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {document.chunkCount} chunks · {formatDate(document.createdAt)}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-slate-400 hover:bg-red-50 hover:text-red-500"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(document.id);
        }}
        aria-label={`Delete ${document.name}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
