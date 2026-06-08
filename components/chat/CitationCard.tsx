"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { getTwoSentenceExcerpt } from "@/lib/utils";
import type { SourceChunk } from "@/types";

interface CitationCardProps {
  source: SourceChunk;
  index: number;
}

export function CitationCard({ source, index }: CitationCardProps) {
  const [open, setOpen] = useState(false);
  const excerpt = getTwoSentenceExcerpt(source.content);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-md border border-slate-200 bg-slate-50">
        <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-100">
          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
          )}
          <FileText className="h-4 w-4 shrink-0 text-blue-600" />
          <span className="min-w-0 flex-1 truncate font-medium text-slate-700">
            {source.docName}
          </span>
          <Badge variant="outline" className="shrink-0 text-xs">
            Chunk {source.chunkIndex + 1}
          </Badge>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-slate-200 px-3 py-2 text-sm text-slate-600">
            <p className="mb-1 text-xs text-slate-400">Source {index + 1}</p>
            <p className="leading-relaxed">{excerpt}</p>
            {source.pageNumber && (
              <p className="mt-2 text-xs text-slate-400">
                Page {source.pageNumber}
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
