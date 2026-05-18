"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function detectFormat(filename: string, content: string): string {
  if (filename.endsWith(".txt")) return "Text file";
  if (filename.endsWith(".md")) return "Markdown file";
  if (filename.endsWith(".zip")) return "Export ZIP";
  if (filename.endsWith(".json")) {
    try {
      const raw = JSON.parse(content) as unknown[];
      if (!Array.isArray(raw) || raw.length === 0) return "JSON (unknown format)";
      const first = raw[0] as Record<string, unknown>;
      if ("mapping" in first) return "ChatGPT conversations";
      if ("chat_messages" in first) return "Claude.ai conversations";
      if ("conversationState" in first) return "Gemini conversations";
      if ("memory" in first) return "ChatGPT memories";
      return "JSON (unknown format)";
    } catch {
      return "Invalid JSON";
    }
  }
  return "Unknown";
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    if (f.name.endsWith(".zip")) {
      setFileContent("__zip__");
    } else {
      const reader = new FileReader();
      reader.onload = (e) => setFileContent(e.target?.result as string ?? "");
      reader.readAsText(f);
    }
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }

  async function handleImport() {
    if (!file) return;
    setIsImporting(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body: formData });
      const data = await res.json() as { imported?: number; errors?: string[]; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Import failed");
      }
      setResult({ imported: data.imported ?? 0, errors: data.errors ?? [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  }

  const detectedFormat = file && fileContent ? detectFormat(file.name, fileContent) : null;

  return (
    <div className="mx-auto max-w-2xl flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import Conversations</h1>
        <p className="mt-1 text-sm text-gray-500">
          Import your existing conversations from ChatGPT, Claude.ai, or notes files. Each conversation becomes a prompt with its full run history.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-700">Supported formats</h2>
        <ul className="flex flex-col gap-2 text-sm text-gray-600">
          <li>
            <span className="font-semibold text-gray-700">ChatGPT</span>{" "}
            <span className="font-mono text-xs bg-gray-100 px-1 rounded">.zip</span>
            {" "}— Settings → Data controls → Export data. Imports conversations + memories.
          </li>
          <li>
            <span className="font-semibold text-gray-700">Claude.ai</span>{" "}
            <span className="font-mono text-xs bg-gray-100 px-1 rounded">.zip</span>
            {" "}— Settings → Privacy → Export data. Imports all conversations.
          </li>
          <li>
            <span className="font-semibold text-gray-700">Gemini</span>{" "}
            <span className="font-mono text-xs bg-gray-100 px-1 rounded">.zip</span>
            {" "}— Google Takeout → select "Gemini Apps" only. Imports conversations.
          </li>
          <li>
            <span className="font-semibold text-gray-700">Notes / prompts</span>{" "}
            <span className="font-mono text-xs bg-gray-100 px-1 rounded">.txt / .md</span>
            {" "}— Saved as a prompt template.
          </li>
          <li className="text-gray-400 text-xs pt-1">
            Perplexity, Grok: no official export — copy-paste conversations into a .txt file and upload it.
          </li>
        </ul>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 cursor-pointer transition-colors ${
          isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".zip,.json,.txt,.md"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <div className="text-3xl text-gray-400">↑</div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">Drop a file here or click to browse</p>
          <p className="text-xs text-gray-400 mt-1">ZIP, JSON, TXT, MD — max 10 MB</p>
        </div>
      </div>

      {file && (
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-gray-900 truncate">{file.name}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400">{formatBytes(file.size)}</span>
                {detectedFormat && (
                  <>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs font-medium text-blue-600">{detectedFormat}</span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); setFileContent(""); setResult(null); }}
              className="shrink-0 text-xs text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleImport}
            disabled={isImporting}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isImporting ? "Importing…" : "Import"}
          </button>
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
          {result.imported > 0 && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-green-700">
                Imported {result.imported} conversation{result.imported !== 1 ? "s" : ""} successfully.
              </p>
              <Link
                href="/prompts"
                className="shrink-0 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                View prompts →
              </Link>
            </div>
          )}
          {result.errors.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-red-600">{result.errors.length} error{result.errors.length !== 1 ? "s" : ""}:</p>
              {result.errors.map((e, i) => (
                <p key={i} className="text-xs text-red-500">{e}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
