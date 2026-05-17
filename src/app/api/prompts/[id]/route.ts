import { NextResponse } from "next/server";
import { getPromptById, updatePrompt, deletePrompt } from "@/lib/db";
import { logger } from "@/lib/logger";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    const prompt = await getPromptById(id);
    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }
    return NextResponse.json({ prompt });
  } catch (err) {
    logger.error("GET /api/prompts/[id] failed", { id, error: String(err) });
    return NextResponse.json({ error: "Failed to fetch prompt" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    const body = await request.json();
    const prompt = await updatePrompt(id, body);
    return NextResponse.json({ prompt });
  } catch (err) {
    logger.error("PUT /api/prompts/[id] failed", { id, error: String(err) });
    return NextResponse.json({ error: "Failed to update prompt" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    await deletePrompt(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("DELETE /api/prompts/[id] failed", { id, error: String(err) });
    return NextResponse.json({ error: "Failed to delete prompt" }, { status: 500 });
  }
}
