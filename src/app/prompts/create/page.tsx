"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PromptModelHint } from "@/types/types";

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

export default function CreatePromptPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [defaultModels, setDefaultModels] = useState<PromptModelHint[]>(["openai/gpt-4o"]);

  function toggleModel(model: PromptModelHint) {
    setDefaultModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !template.trim()) {
      setError("Title and template are required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, template, tags, defaultModels }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create prompt");
      }

      const data = await res.json();
      router.push(`/prompts/${data.prompt.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Create Prompt</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className="text-sm font-medium text-gray-700">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My Prompt"
            required
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm font-medium text-gray-700">
            Description
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this prompt do?"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="template" className="text-sm font-medium text-gray-700">
            Template <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-400">
            Use{" "}
            <code className="font-mono bg-gray-100 px-1 rounded">{"{{input}}"}</code> as a
            placeholder for user input.
          </p>
          <textarea
            id="template"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            placeholder={"Context:\n{{input}}\n\nTask: Summarize the above."}
            rows={6}
            required
            className="rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="tags" className="text-sm font-medium text-gray-700">
            Tags (comma-separated)
          </label>
          <input
            id="tags"
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="trading, coding, marketing"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Default models</span>
          <div className="flex flex-wrap gap-2">
            {ALL_MODELS.map((model) => (
              <label
                key={model}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  defaultModels.includes(model)
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={defaultModels.includes(model)}
                  onChange={() => toggleModel(model)}
                />
                {MODEL_LABELS[model]}
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Creating..." : "Create Prompt"}
        </button>
      </form>
    </div>
  );
}
