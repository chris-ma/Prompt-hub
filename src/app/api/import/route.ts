import { NextResponse } from "next/server";
import { unzipSync, strFromU8 } from "fflate";
import { createPrompt, saveRun } from "@/lib/db";
import { parseChatGPT, parseClaude, parseTextFile, parseMemory, parseGemini } from "@/lib/importers";
import type { ParsedConversation } from "@/lib/importers";
import { logger } from "@/lib/logger";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

async function importConversations(
  conversations: ParsedConversation[]
): Promise<{ imported: number; errors: string[] }> {
  let imported = 0;
  const errors: string[] = [];

  for (const conv of conversations) {
    try {
      const prompt = await createPrompt({
        title: conv.title,
        description: conv.description,
        template: conv.template ?? "{{input}}",
        tags: conv.tags,
      });

      for (const turn of conv.turns) {
        await saveRun({
          promptId: prompt.id,
          input: turn.input,
          outputs: [{ model: turn.model, content: turn.output }],
        });
      }

      imported++;
    } catch (err) {
      errors.push(`Failed to import "${conv.title}": ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { imported, errors };
}

function parseJsonFile(content: string, filename: string): ParsedConversation[] {
  const raw = JSON.parse(content) as unknown[];
  if (!Array.isArray(raw) || raw.length === 0) return [];

  const first = raw[0] as Record<string, unknown>;

  if ("mapping" in first) return parseChatGPT(raw);
  if ("chat_messages" in first) return parseClaude(raw);
  if ("conversationState" in first) return parseGemini(raw);

  // memory.json
  if ("memory" in first) {
    const mem = parseMemory(raw);
    return mem ? [mem] : [];
  }

  throw new Error(`Unrecognised JSON format in ${filename}`);
}

async function processZip(bytes: Uint8Array): Promise<{ imported: number; errors: string[] }> {
  const files = unzipSync(bytes);
  let totalImported = 0;
  const allErrors: string[] = [];

  const TARGET_FILES = [
    "conversations.json",
    "memory.json",
    "Gemini Apps Activity.json",
  ];

  for (const [path, data] of Object.entries(files)) {
    const filename = path.split("/").pop() ?? path;
    if (!TARGET_FILES.includes(filename)) continue;

    logger.info("Processing ZIP entry", { path });

    try {
      const content = strFromU8(data);
      const conversations = parseJsonFile(content, filename);
      const { imported, errors } = await importConversations(conversations);
      totalImported += imported;
      allErrors.push(...errors);
    } catch (err) {
      allErrors.push(`${filename}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { imported: totalImported, errors: allErrors };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 10MB (got ${(file.size / 1024 / 1024).toFixed(1)}MB)` },
        { status: 400 }
      );
    }

    const filename = file.name;

    if (filename.endsWith(".zip")) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { imported, errors } = await processZip(bytes);
      return NextResponse.json({ imported, errors });
    }

    if (filename.endsWith(".json")) {
      let content: string;
      try {
        content = await file.text();
      } catch {
        return NextResponse.json({ error: "Could not read file" }, { status: 400 });
      }

      let conversations: ParsedConversation[];
      try {
        conversations = parseJsonFile(content, filename);
      } catch (err) {
        return NextResponse.json(
          { error: err instanceof Error ? err.message : "Unrecognised JSON format" },
          { status: 400 }
        );
      }

      const { imported, errors } = await importConversations(conversations);
      return NextResponse.json({ imported, errors });
    }

    if (filename.endsWith(".txt") || filename.endsWith(".md")) {
      const content = await file.text();
      const conv = parseTextFile(content, filename);
      const { imported, errors } = await importConversations([conv]);
      return NextResponse.json({ imported, errors });
    }

    return NextResponse.json(
      { error: "Unsupported file type. Upload a .zip, .json, .txt, or .md file." },
      { status: 400 }
    );
  } catch (err) {
    logger.error("POST /api/import failed", { error: String(err) });
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
