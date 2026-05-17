export interface ParsedConversation {
  title: string;
  description: string;
  tags: string[];
  turns: Array<{ input: string; output: string; model: string }>;
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
