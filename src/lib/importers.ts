export interface ParsedConversation {
  title: string;
  description: string;
  tags: string[];
  turns: Array<{ input: string; output: string; model: string }>;
  template?: string;
}

// ChatGPT export format: conversations.json array of objects with "mapping" tree
export function parseChatGPT(raw: unknown[]): ParsedConversation[] {
  const results: ParsedConversation[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const conv = item as Record<string, unknown>;
    const mapping = conv["mapping"] as Record<string, {
      id: string;
      parent: string | null;
      children: string[];
      message?: {
        author?: { role: string };
        content?: { parts?: unknown[] };
      };
    }> | undefined;

    if (!mapping) continue;

    const title = typeof conv["title"] === "string" ? conv["title"] : "Imported Chat";

    // Find root node (no parent or parent is null)
    let rootId: string | null = null;
    for (const [id, node] of Object.entries(mapping)) {
      if (!node.parent || !mapping[node.parent]) {
        rootId = id;
        break;
      }
    }
    if (!rootId) continue;

    type MappingNode = (typeof mapping)[string];
    // Walk the tree following first child
    const messages: Array<{ role: string; text: string }> = [];
    let currentId: string | null = rootId;
    while (currentId && mapping[currentId]) {
      const node: MappingNode = mapping[currentId];
      const msg = node.message;
      if (msg?.author?.role && (msg.author.role === "user" || msg.author.role === "assistant")) {
        const parts = msg.content?.parts ?? [];
        const text = (parts as unknown[])
          .map((p) => (typeof p === "string" ? p : ""))
          .join("")
          .trim();
        if (text) {
          messages.push({ role: msg.author.role, text });
        }
      }
      currentId = node.children[0] ?? null;
    }

    // Pair user→assistant turns
    const turns: ParsedConversation["turns"] = [];
    for (let i = 0; i < messages.length - 1; i++) {
      if (messages[i].role === "user" && messages[i + 1].role === "assistant") {
        turns.push({
          input: messages[i].text,
          output: messages[i + 1].text,
          model: "chatgpt",
        });
        i++;
      }
    }

    if (turns.length > 0) {
      results.push({ title, description: "Imported from ChatGPT", tags: ["imported", "chatgpt"], turns });
    }
  }

  return results;
}

// Claude.ai export format: array of objects with "chat_messages" array
export function parseClaude(raw: unknown[]): ParsedConversation[] {
  const results: ParsedConversation[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const conv = item as Record<string, unknown>;
    const messages = conv["chat_messages"] as Array<{
      sender: string;
      text: string;
    }> | undefined;

    if (!messages) continue;

    const title = typeof conv["name"] === "string" ? conv["name"] : "Imported Chat";

    const turns: ParsedConversation["turns"] = [];
    for (let i = 0; i < messages.length - 1; i++) {
      if (messages[i].sender === "human" && messages[i + 1].sender === "assistant") {
        const input = messages[i].text?.trim() ?? "";
        const output = messages[i + 1].text?.trim() ?? "";
        if (input && output) {
          turns.push({ input, output, model: "claude-ai" });
        }
        i++;
      }
    }

    if (turns.length > 0) {
      results.push({ title, description: "Imported from Claude.ai", tags: ["imported", "claude"], turns });
    }
  }

  return results;
}

// Plain text / markdown file → one prompt, no runs
export function parseTextFile(content: string, filename: string): ParsedConversation {
  const title = filename.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
  return {
    title,
    description: `Imported from ${filename}`,
    tags: ["imported", "note"],
    turns: [],
  };
}

// ChatGPT memory.json: array of { memory: string, ... }
// Creates a single reference prompt listing all stored memories
export function parseMemory(raw: unknown[]): ParsedConversation | null {
  const memories: string[] = [];
  for (const item of raw) {
    if (item && typeof item === "object") {
      const m = (item as Record<string, unknown>)["memory"];
      if (typeof m === "string" && m.trim()) {
        memories.push(m.trim());
      }
    }
  }
  if (memories.length === 0) return null;
  return {
    title: "ChatGPT Memories",
    description: "Stored memory facts from ChatGPT",
    tags: ["imported", "chatgpt", "memory"],
    turns: [],
    template: memories.map((m, i) => `${i + 1}. ${m}`).join("\n"),
  };
}

// Google Takeout Gemini format
// Array of objects with title + conversationState.conversation.turns[]
export function parseGemini(raw: unknown[]): ParsedConversation[] {
  const results: ParsedConversation[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const conv = item as Record<string, unknown>;
    const title = typeof conv["title"] === "string" ? conv["title"] : "Gemini Chat";

    const state = conv["conversationState"] as Record<string, unknown> | undefined;
    const conversation = state?.["conversation"] as Record<string, unknown> | undefined;
    const rawTurns = conversation?.["turns"] as unknown[] | undefined;

    if (!rawTurns) continue;

    const turns: ParsedConversation["turns"] = [];
    for (const t of rawTurns) {
      if (!t || typeof t !== "object") continue;
      const turn = t as Record<string, unknown>;
      const request = turn["request"] as Record<string, unknown> | undefined;
      const response = turn["response"] as Record<string, unknown> | undefined;

      const reqParts = (request?.["parts"] as unknown[] | undefined) ?? [];
      const input = reqParts
        .map((p) => (p && typeof p === "object" ? (p as Record<string, unknown>)["text"] : ""))
        .filter((t) => typeof t === "string")
        .join("")
        .trim();

      const candidates = (response?.["candidates"] as unknown[] | undefined) ?? [];
      const first = candidates[0] as Record<string, unknown> | undefined;
      const content = first?.["content"] as Record<string, unknown> | undefined;
      const resParts = (content?.["parts"] as unknown[] | undefined) ?? [];
      const output = resParts
        .map((p) => (p && typeof p === "object" ? (p as Record<string, unknown>)["text"] : ""))
        .filter((t) => typeof t === "string")
        .join("")
        .trim();

      if (input && output) {
        turns.push({ input, output, model: "gemini" });
      }
    }

    if (turns.length > 0) {
      results.push({ title, description: "Imported from Gemini", tags: ["imported", "gemini"], turns });
    }
  }

  return results;
}
