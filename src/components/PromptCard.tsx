import Link from "next/link";
import type { Prompt } from "@/types/types";

export default function PromptCard({ prompt }: { prompt: Prompt }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-1">
        <Link
          href={`/prompts/${prompt.id}`}
          className="text-lg font-semibold text-gray-900 hover:text-blue-600 leading-snug"
        >
          {prompt.title}
        </Link>
        {prompt.description && (
          <p className="text-sm text-gray-500 line-clamp-2">{prompt.description}</p>
        )}
      </div>

      {prompt.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {prompt.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Link
          href={`/prompts/${prompt.id}`}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors w-full md:w-auto"
        >
          Run Prompt
        </Link>
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {new Date(prompt.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
