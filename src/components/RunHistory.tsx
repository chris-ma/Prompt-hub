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
      <p className="text-sm text-gray-400 py-4 text-center">
        No runs yet. Run this prompt above to see history here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {runs.map((run) => (
        <details
          key={run.id}
          className="group rounded-xl border border-gray-200 bg-white overflow-hidden"
        >
          <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition-colors list-none">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs text-gray-400">{formatDate(run.createdAt)}</span>
              <span className="text-sm text-gray-700 truncate">
                {run.input.slice(0, 80)}{run.input.length > 80 ? "…" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-400">
                {run.outputs.length} model{run.outputs.length !== 1 ? "s" : ""}
              </span>
              <span className="text-gray-400 text-xs group-open:rotate-180 transition-transform">▼</span>
            </div>
          </summary>

          <div className="border-t border-gray-100 px-4 py-3 flex flex-col gap-3">
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <p className="text-xs font-medium text-gray-400 mb-1">Input</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{run.input}</p>
            </div>

            <div className={`grid gap-3 ${run.outputs.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
              {run.outputs.map((output) => (
                <div key={output.model} className="flex flex-col gap-1.5 rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 truncate">
                      {output.model}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {output.usage && (
                        <span className="text-xs text-gray-400">
                          {output.usage.prompt_tokens + output.usage.completion_tokens} tokens
                        </span>
                      )}
                      {!output.error && <CopyButton text={output.content} />}
                    </div>
                  </div>
                  {output.error ? (
                    <p className="text-xs text-red-600">{output.error}</p>
                  ) : (
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
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
