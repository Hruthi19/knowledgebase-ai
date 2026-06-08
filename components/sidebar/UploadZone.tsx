"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, Link, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/store/useAppStore";
import type { Document } from "@/types";

const ACCEPTED_TYPES = ".pdf,.txt,.docx";
const MAX_SIZE = 10 * 1024 * 1024;

export function UploadZone() {
  const [url, setUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploading = useAppStore((s) => s.isUploading);
  const uploadProgress = useAppStore((s) => s.uploadProgress);
  const addDocument = useAppStore((s) => s.addDocument);
  const setIsUploading = useAppStore((s) => s.setIsUploading);
  const setUploadProgress = useAppStore((s) => s.setUploadProgress);

  const handleSuccess = (data: {
    docId: string;
    docName: string;
    chunkCount: number;
    type: Document["type"];
  }) => {
    addDocument({
      id: data.docId,
      name: data.docName,
      type: data.type,
      chunkCount: data.chunkCount,
      createdAt: new Date().toISOString(),
    });
    toast.success(`"${data.docName}" ingested (${data.chunkCount} chunks)`);
  };

  const uploadFile = async (file: File) => {
    if (file.size > MAX_SIZE) {
      toast.error("File too large. Maximum size is 10MB.");
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["pdf", "txt", "docx"].includes(ext)) {
      toast.error("Unsupported file type. Allowed: PDF, TXT, DOCX");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadProgress(30);
      const response = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(80);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Upload failed");
      }

      setUploadProgress(100);
      handleSuccess({
        docId: data.docId,
        docName: data.docName,
        chunkCount: data.chunkCount,
        type: ext as Document["type"],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      console.error("[UploadZone] File upload error:", error);
      toast.error(message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const uploadUrl = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error("Please enter a URL");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      setUploadProgress(30);
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      setUploadProgress(80);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "URL ingestion failed");
      }

      setUploadProgress(100);
      setUrl("");
      handleSuccess({
        docId: data.docId,
        docName: data.docName,
        chunkCount: data.chunkCount,
        type: "url",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "URL ingestion failed";
      console.error("[UploadZone] URL upload error:", error);
      toast.error(message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
          isDragging
            ? "border-blue-400 bg-blue-50"
            : "border-slate-300 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50"
        } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={onFileSelect}
          className="hidden"
        />
        {isUploading ? (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
        ) : (
          <Upload className="mx-auto h-8 w-8 text-slate-400" />
        )}
        <p className="mt-2 text-sm font-medium text-slate-700">
          {isUploading ? "Processing..." : "Drop files here or click to upload"}
        </p>
        <p className="mt-1 text-xs text-slate-500">PDF, TXT, DOCX · Max 10MB</p>
      </div>

      {isUploading && (
        <div className="space-y-1">
          <Progress value={uploadProgress} />
          <p className="text-center text-xs text-slate-500">Processing document...</p>
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a public URL..."
            className="pl-9"
            disabled={isUploading}
            onKeyDown={(e) => e.key === "Enter" && uploadUrl()}
          />
        </div>
        <Button
          onClick={uploadUrl}
          disabled={isUploading || !url.trim()}
          variant="outline"
          className="shrink-0"
        >
          Add
        </Button>
      </div>
    </div>
  );
}
