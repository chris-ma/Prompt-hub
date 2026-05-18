export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import PromptRunner from "@/components/PromptRunner";
import RunHistory from "@/components/RunHistory";
import { getPromptById, getRunsForPrompt, getModels } from "@/lib/db";

interface PromptDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PromptDetailPage({ params }: PromptDetailPageProps) {
  const { id } = await params;
  const [prompt, runs, models] = await Promise.all([
    getPromptById(id),
    getRunsForPrompt(id),
    getModels(),
  ]);

  if (!prompt) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-[#2d1a19]">{prompt.title}</h1>
            {prompt.description && (
              <p className="text-[#9e7b78]">{prompt.description}</p>
            )}
          </div>
          <Link href="/prompts" className="shrink-0 text-sm text-[#c4a8a5] hover:text-[#c47068] transition-colors">
            ← Back
          </Link>
        </div>

        {prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {prompt.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#fce8e6] px-2.5 py-0.5 text-xs font-medium text-[#9e5a54]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#c4a8a5]">Template</h2>
        <pre className="overflow-x-auto rounded-2xl border border-[#f0d9d5] bg-white/80 p-4 text-sm text-[#2d1a19] whitespace-pre-wrap font-mono backdrop-blur-sm">
          {prompt.template}
        </pre>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-[#2d1a19]">Run this prompt</h2>
        <PromptRunner prompt={prompt} models={models} />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-[#2d1a19]">
          Run history{runs.length > 0 ? ` (${runs.length})` : ""}
        </h2>
        <RunHistory runs={runs} />
      </div>
    </div>
  );
}
