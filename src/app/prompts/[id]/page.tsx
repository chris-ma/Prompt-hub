export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import PromptRunner from "@/components/PromptRunner";
import { getPromptById } from "@/lib/db";

interface PromptDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PromptDetailPage({ params }: PromptDetailPageProps) {
  const { id } = await params;
  const prompt = await getPromptById(id);

  if (!prompt) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-gray-900">{prompt.title}</h1>
            {prompt.description && (
              <p className="text-gray-500">{prompt.description}</p>
            )}
          </div>
          <Link
            href="/prompts"
            className="shrink-0 text-sm text-gray-400 hover:text-gray-600"
          >
            ← Back
          </Link>
        </div>

        {prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {prompt.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Template
        </h2>
        <pre className="overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap font-mono">
          {prompt.template}
        </pre>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Run this prompt</h2>
        <PromptRunner prompt={prompt} />
      </div>
    </div>
  );
}
