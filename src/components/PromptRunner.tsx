"use client";

import { useState } from "react";
import type { Prompt, PromptModelHint, RunOutput } from "@/types/types";

const ALL_MODELS: PromptModelHint[] = [
  "openai/gpt-4o",
  "anthropic/claude-3-opus",
  "google/gemini-pro",
  "deepseek/deepseek-chat",
  "mistral/mistral-large",
];

const MODEL_LABELS: Record<PromptModelHint, string> = {
  "openai/gpt-4o": "GPT-4o",
  "anthropic/claude-3-opus": "Claude 3 Opus",
  "google/gemini-pro": "Gemini Pro",
  "deepseek/deepseek-chat": "DeepSeek Chat",
  "mistral/mistral-large": "Mistral Large",
};

export default function PromptRunner({ prompt }: { prompt: Prompt }) {
  const [input, setInput] = useState("");
  const [selectedModels, setSelectedModels] = useState<PromptModelHint[]>(
    prompt.defaultModels.length > 0
      ? (prompt.defaultModels as PromptModelHint[])
      : ["openai/gpt-4o"]
  );
  const [outputs, setOutputs] = useState<RunOutput[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleModel(model: PromptModelHint) {
    setSelectedModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    );
  }

  async function handleRun() {
    if (!input.trim() || selectedModels.length === 0) return;
    setIsLoading(true);
    setError(null);
    setOutputs([]);

    try {
      const response = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId: prompt.id, input: input.trim(), models: selectedModels }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Run failed");
      }

      const data = await response.json();
      setOutputs(data.run.outputs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="runner-input" className="text-sm font-medium text-gray-700">
          Your input
        </label>
        <textarea
          id="runner-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter your input here..."
          rows={4}
          className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gray-700">Select models</span>
        <div className="flex flex-wrap gap-2">
          {ALL_MODELS.map((model) => (
            <label
              key={model}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                selectedModels.includes(model)
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={selectedModels.includes(model)}
                onChange={() => toggleModel(model)}
              />
              {MODEL_LABELS[model]}
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleRun}
        disabled={isLoading || !input.trim() || selectedModels.length === 0}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors md:w-auto md:self-start"
      >
        {isLoading
          ? "Running..."
          : `Run on ${selectedModels.length} model${selectedModels.length !== 1 ? "s" : ""}`}
      </button>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {outputs.length > 0 && (
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-semibold text-gray-900">Results</h3>
          <div
            className={`grid gap-4 ${
              outputs.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
            }`}
          >
            {outputs.map((output) => (
              <div
                key={output.model}
                className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {MODEL_LABELS[output.model]}
                  </span>
                  {output.usage && (
                    <span className="text-xs text-gray-400">
                      {output.usage.prompt_tokens + output.usage.completion_tokens} tokens
                    </span>
                  )}
                </div>
                {output.error ? (
                  <p className="text-sm text-red-600">{output.error}</p>
                ) : (
                  <p className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                    {output.content}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
