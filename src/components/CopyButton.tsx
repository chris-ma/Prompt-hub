"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded px-2 py-0.5 text-xs font-medium transition-colors border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 active:bg-gray-100"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
