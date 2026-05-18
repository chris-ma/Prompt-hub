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
        <h1 className="text-3xl font-bold text-[#2d1a19] md:text-4xl">Prompt Hub</h1>
        <p className="max-w-2xl text-[#9e7b78]">
          Store your prompts, run them across multiple AI models, and compare outputs side-by-side.
        </p>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <Link
              key={tag}
              href={`/prompts?tag=${encodeURIComponent(tag)}`}
              className="rounded-full bg-[#fce8e6] px-3 py-1 text-sm text-[#9e5a54] hover:bg-[#f7ddd7] transition-colors"
            >
              {tag}
            </Link>
          ))}
        </div>
      )}

      {prompts.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[#f0d9d5] py-16 text-center">
          <p className="text-[#c4a8a5]">No prompts yet. Import some conversations to get started.</p>
          <Link
            href="/import"
            className="rounded-xl bg-[#c47068] px-4 py-2 text-sm font-medium text-white hover:bg-[#a85a55] transition-colors"
          >
            Import
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
