import { NextResponse } from "next/server";
import { createPrompt, saveRun } from "@/lib/db";
import { parseChatGPT, parseClaude, parseTextFile } from "@/lib/importers";
import { logger } from "@/lib/logger";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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
    const content = await file.text();
    const errors: string[] = [];
    let imported = 0;

    if (filename.endsWith(".json")) {
      let raw: unknown;
      try {
        raw = JSON.parse(content);
      } catch {
        return NextResponse.json({ error: "Invalid JSON file" }, { status: 400 });
      }

      if (!Array.isArray(raw)) {
        return NextResponse.json({ error: "Expected a JSON array" }, { status: 400 });
      }

      // Detect format from first item
      const first = raw[0] as Record<string, unknown> | undefined;
      let conversations;

      if (first && "mapping" in first) {
        conversations = parseChatGPT(raw);
      } else if (first && "chat_messages" in first) {
        conversations = parseClaude(raw);
      } else {
        return NextResponse.json(
          { error: "Unrecognised JSON format. Expected ChatGPT or Claude.ai export." },
          { status: 400 }
        );
      }

      logger.info("Importing conversations", { count: conversations.length, filename });

      for (const conv of conversations) {
        try {
          const prompt = await createPrompt({
            title: conv.title,
            description: conv.description,
            template: "{{input}}",
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
    } else if (filename.endsWith(".txt") || filename.endsWith(".md")) {
      try {
        const conv = parseTextFile(content, filename);
        await createPrompt({
          title: conv.title,
          description: conv.description,
          template: content,
          tags: conv.tags,
        });
        imported++;
      } catch (err) {
        errors.push(`Failed to import file: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Upload a .json (ChatGPT/Claude export), .txt, or .md file." },
        { status: 400 }
      );
    }

    return NextResponse.json({ imported, errors });
  } catch (err) {
    logger.error("POST /api/import failed", { error: String(err) });
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
