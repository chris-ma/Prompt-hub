export const dynamic = "force-dynamic";

import Link from "next/link";
import PromptCard from "@/components/PromptCard";
import { getPrompts } from "@/lib/db";

interface PromptsPageProps {
  searchParams: Promise<{ tag?: string; q?: string }>;
}

export default async function PromptsPage({ searchParams }: PromptsPageProps) {
  const { tag, q } = await searchParams;
  const allPrompts = await getPrompts();

  const filtered = allPrompts.filter((p) => {
    const matchesTag = tag ? p.tags.includes(tag) : true;
    const matchesQuery = q
      ? p.title.toLowerCase().includes(q.toLowerCase()) ||
        p.description.toLowerCase().includes(q.toLowerCase())
      : true;
    return matchesTag && matchesQuery;
  });

  const allTags = Array.from(new Set(allPrompts.flatMap((p) => p.tags))).sort();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#2d1a19]">All Prompts</h1>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/prompts"
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              !tag
                ? "bg-[#c47068] text-white"
                : "bg-[#fce8e6] text-[#9e5a54] hover:bg-[#f7ddd7]"
            }`}
          >
            All
          </Link>
          {allTags.map((t) => (
            <Link
              key={t}
              href={`/prompts?tag=${encodeURIComponent(t)}`}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                tag === t
                  ? "bg-[#c47068] text-white"
                  : "bg-[#fce8e6] text-[#9e5a54] hover:bg-[#f7ddd7]"
              }`}
            >
              {t}
            </Link>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-center text-[#c4a8a5] py-12">No prompts match your filter.</p>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>
      )}
    </div>
  );
}
