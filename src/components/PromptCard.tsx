import Link from "next/link";
import type { Prompt } from "@/types/types";

export default function PromptCard({ prompt }: { prompt: Prompt }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#f0d9d5] bg-white/90 p-4 shadow-sm hover:shadow-md transition-shadow backdrop-blur-sm">
      <div className="flex flex-col gap-1">
        <Link
          href={`/prompts/${prompt.id}`}
          className="text-base font-semibold text-[#2d1a19] hover:text-[#c47068] leading-snug transition-colors"
        >
          {prompt.title}
        </Link>
        {prompt.description && (
          <p className="text-sm text-[#9e7b78] line-clamp-2">{prompt.description}</p>
        )}
      </div>

      {prompt.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {prompt.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-[#fce8e6] px-2.5 py-0.5 text-xs font-medium text-[#9e5a54]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Link
          href={`/prompts/${prompt.id}`}
          className="inline-flex items-center justify-center rounded-xl bg-[#c47068] px-4 py-2 text-sm font-medium text-white hover:bg-[#a85a55] transition-colors w-full md:w-auto"
        >
          Open
        </Link>
        <span className="text-xs text-[#c4a8a5] whitespace-nowrap">
          {new Date(prompt.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
