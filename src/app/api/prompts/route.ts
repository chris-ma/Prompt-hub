import { NextResponse } from "next/server";
import { getPrompts, createPrompt } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { CreatePromptData } from "@/lib/db";

export async function GET() {
  try {
    const prompts = await getPrompts();
    return NextResponse.json({ prompts });
  } catch (err) {
    logger.error("GET /api/prompts failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to fetch prompts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreatePromptData;
    if (!body.title || !body.template) {
      return NextResponse.json({ error: "title and template are required" }, { status: 400 });
    }
    const prompt = await createPrompt(body);
    return NextResponse.json({ prompt }, { status: 201 });
  } catch (err) {
    logger.error("POST /api/prompts failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to create prompt" }, { status: 500 });
  }
}
