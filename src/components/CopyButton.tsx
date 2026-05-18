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
      className="rounded-full px-2 py-0.5 text-xs font-medium transition-colors border border-[#f0d9d5] text-[#9e7b78] hover:border-[#c47068] hover:text-[#c47068] active:bg-[#fce8e6]"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
