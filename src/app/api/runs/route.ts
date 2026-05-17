import { NextResponse } from "next/server";
import { getPromptById, saveRun } from "@/lib/db";
import { callOpenRouter } from "@/lib/openrouter";
import { logger } from "@/lib/logger";
import type { RunInput, PromptModelHint } from "@/types/types";

function resolveTemplate(template: string, input: string): string {
  return template.replace(/\{\{input\}\}/g, input);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RunInput;
    const { promptId, input, models } = body;

    if (!promptId || !input || !models || models.length === 0) {
      return NextResponse.json(
        { error: "promptId, input, and at least one model are required" },
        { status: 400 }
      );
    }

    const prompt = await getPromptById(promptId);
    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    const resolvedPrompt = resolveTemplate(prompt.template, input);
    logger.info("Starting parallel LLM calls", { promptId, modelCount: models.length });

    const outputs = await Promise.all(
      models.map((model: PromptModelHint) => callOpenRouter(model, resolvedPrompt))
    );

    const run = await saveRun({ promptId, input, outputs });
    logger.info("Run saved", { runId: run.id });

    return NextResponse.json({ run }, { status: 201 });
  } catch (err) {
    logger.error("POST /api/runs failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to execute run" }, { status: 500 });
  }
}
