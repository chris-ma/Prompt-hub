"use client";

import { useState, useEffect, useCallback } from "react";
import type { Provider } from "@/types/types";

const PROVIDER_OPTIONS = [
  { slug: "openai", name: "OpenAI" },
  { slug: "anthropic", name: "Anthropic" },
  { slug: "mistral", name: "Mistral" },
  { slug: "deepseek", name: "DeepSeek" },
  { slug: "xai", name: "xAI (Grok)" },
  { slug: "openrouter", name: "OpenRouter" },
];

export default function ProvidersSettingsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [slug, setSlug] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    const res = await fetch("/api/providers");
    const data = await res.json();
    setProviders(data.providers ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setIsAdding(true);
    setError(null);
    try {
      const selectedOption = PROVIDER_OPTIONS.find((p) => p.slug === slug);
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedOption?.name ?? slug,
          slug,
          apiKey: apiKey.trim(),
          baseUrl: baseUrl.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to add provider");
      }
      setApiKey("");
      setBaseUrl("");
      await fetchProviders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error adding provider");
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/providers/${id}`, { method: "DELETE" });
      setProviders((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError("Failed to delete provider");
    }
  }

  return (
    <div className="mx-auto max-w-2xl flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">API Providers</h1>
        <p className="mt-1 text-sm text-gray-500">
          Connect your own LLM provider accounts. API keys are stored securely and never exposed to the browser.
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-700">Add a provider</h2>

        <div className="flex flex-col gap-2">
          <select
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {PROVIDER_OPTIONS.map((p) => (
              <option key={p.slug} value={p.slug}>{p.name}</option>
            ))}
          </select>

          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="API key"
            autoComplete="off"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="Custom base URL (optional — leave blank for default)"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isAdding || !apiKey.trim()}
          className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors sm:w-auto sm:self-end sm:px-6"
        >
          {isAdding ? "Adding..." : "Add Provider"}
        </button>
      </form>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-gray-700">Connected providers ({providers.length})</h2>
        {isLoading ? (
          <p className="text-sm text-gray-400 py-4 text-center">Loading...</p>
        ) : providers.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No providers connected yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden">
            {providers.map((provider) => (
              <div key={provider.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-gray-900">{provider.name}</span>
                  <span className="text-xs font-mono text-gray-400">{provider.slug}</span>
                  {provider.baseUrl && (
                    <span className="text-xs text-gray-400 truncate">{provider.baseUrl}</span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(provider.id)}
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
