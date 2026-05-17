"use client";

import { useState, useEffect, useCallback } from "react";
import type { Model } from "@/types/types";

export default function ModelsSettingsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modelId, setModelId] = useState("");
  const [label, setLabel] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    const res = await fetch("/api/models");
    const data = await res.json();
    setModels(data.models ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!modelId.trim() || !label.trim()) return;
    setIsAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId: modelId.trim(), label: label.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to add model");
      }
      setModelId("");
      setLabel("");
      await fetchModels();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error adding model");
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/models/${id}`, { method: "DELETE" });
      setModels((prev) => prev.filter((m) => m.id !== id));
    } catch {
      setError("Failed to delete model");
    }
  }

  return (
    <div className="mx-auto max-w-2xl flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">LLM Models</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage which OpenRouter models appear in the prompt runner. Use any model ID from{" "}
          <span className="font-mono text-xs bg-gray-100 px-1 rounded">openrouter.ai/models</span>.
        </p>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-700">Add a model</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Display name (e.g. GPT-4o)"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="text"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            placeholder="Model ID (e.g. openai/gpt-4o)"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isAdding || !modelId.trim() || !label.trim()}
          className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors sm:w-auto sm:self-end sm:px-6"
        >
          {isAdding ? "Adding..." : "Add"}
        </button>
      </form>

      {/* Model list */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-gray-700">Configured models ({models.length})</h2>
        {isLoading ? (
          <p className="text-sm text-gray-400 py-4 text-center">Loading...</p>
        ) : models.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No models configured yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden">
            {models.map((model) => (
              <div key={model.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-gray-900 truncate">{model.label}</span>
                  <span className="text-xs font-mono text-gray-400 truncate">{model.modelId}</span>
                </div>
                <button
                  onClick={() => handleDelete(model.id)}
                  className="shrink-0 rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
