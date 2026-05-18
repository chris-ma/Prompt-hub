import type { Run } from "@/types/types";
import CopyButton from "@/components/CopyButton";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RunHistory({ runs }: { runs: Run[] }) {
  if (runs.length === 0) {
    return (
      <p className="text-sm text-[#c4a8a5] py-4 text-center">
        No runs yet. Run this prompt above to see history here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {runs.map((run) => (
        <details
          key={run.id}
          className="group rounded-2xl border border-[#f0d9d5] bg-white/90 overflow-hidden backdrop-blur-sm"
        >
          <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 hover:bg-[#fdf5f3] transition-colors list-none">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs text-[#c4a8a5]">{formatDate(run.createdAt)}</span>
              <span className="text-sm text-[#2d1a19] truncate">
                {run.input.slice(0, 80)}{run.input.length > 80 ? "…" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-[#c4a8a5]">
                {run.outputs.length} model{run.outputs.length !== 1 ? "s" : ""}
              </span>
              <span className="text-[#c4a8a5] text-xs group-open:rotate-180 transition-transform">▼</span>
            </div>
          </summary>

          <div className="border-t border-[#f0d9d5] px-4 py-3 flex flex-col gap-3">
            <div className="rounded-xl bg-[#fdf5f3] px-3 py-2">
              <p className="text-xs font-medium text-[#c4a8a5] mb-1">Input</p>
              <p className="text-sm text-[#2d1a19] whitespace-pre-wrap">{run.input}</p>
            </div>

            <div className={`grid gap-3 ${run.outputs.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
              {run.outputs.map((output) => (
                <div key={output.model} className="flex flex-col gap-1.5 rounded-xl border border-[#f0d9d5] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#c4a8a5] truncate">
                      {output.model}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {output.usage && (
                        <span className="text-xs text-[#c4a8a5]">
                          {output.usage.prompt_tokens + output.usage.completion_tokens} tokens
                        </span>
                      )}
                      {!output.error && <CopyButton text={output.content} />}
                    </div>
                  </div>
                  {output.error ? (
                    <p className="text-xs text-red-500">{output.error}</p>
                  ) : (
                    <p className="text-sm text-[#2d1a19] whitespace-pre-wrap leading-relaxed">
                      {output.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}
