export const dynamic = "force-dynamic";

import Link from "next/link";
import PromptCard from "@/components/PromptCard";
import { getPrompts } from "@/lib/db";

export default async function HomePage() {
  const prompts = await getPrompts();
  const allTags = Array.from(new Set(prompts.flatMap((p) => p.tags))).sort();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">Prompt Hub</h1>
        <p className="max-w-2xl text-gray-500">
          Store your prompts, run them across multiple AI models, and compare outputs side-by-side.
        </p>
        <Link
          href="/prompts/create"
          className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors md:w-auto"
        >
          Create your first prompt
        </Link>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <Link
              key={tag}
              href={`/prompts?tag=${encodeURIComponent(tag)}`}
              className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 transition-colors"
            >
              {tag}
            </Link>
          ))}
        </div>
      )}

      {prompts.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-gray-200 py-16 text-center">
          <p className="text-gray-400">No prompts yet.</p>
          <Link
            href="/prompts/create"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Create one
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {prompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>
      )}
    </div>
  );
}
