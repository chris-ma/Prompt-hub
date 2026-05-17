import { NextResponse } from "next/server";
import { getPromptById, saveRun, prisma } from "@/lib/db";
import { callModel } from "@/lib/llm";
import { logger } from "@/lib/logger";
import type { RunInput } from "@/types/types";

function resolveTemplate(template: string, input: string): string {
  return template.replace(/\{\{input\}\}/g, input);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RunInput;
    const { promptId, input, models: modelIds } = body;

    if (!promptId || !input || !modelIds || modelIds.length === 0) {
      return NextResponse.json(
        { error: "promptId, input, and at least one model are required" },
        { status: 400 }
      );
    }

    const prompt = await getPromptById(promptId);
    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    const modelRecords = await prisma.model.findMany({
      where: { modelId: { in: modelIds } },
      include: { provider: true },
    });

    const modelMap = new Map(modelRecords.map((m) => [m.modelId, m]));
    const resolvedPrompt = resolveTemplate(prompt.template, input);
    logger.info("Starting parallel LLM calls", { promptId, modelCount: modelIds.length });

    const outputs = await Promise.all(
      modelIds.map((modelId) => {
        const record = modelMap.get(modelId);
        return callModel(
          { modelId, provider: record?.provider ?? null },
          resolvedPrompt
        );
      })
    );

    const run = await saveRun({ promptId, input, outputs });
    logger.info("Run saved", { runId: run.id });

    return NextResponse.json({ run }, { status: 201 });
  } catch (err) {
    logger.error("POST /api/runs failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to execute run" }, { status: 500 });
  }
}
