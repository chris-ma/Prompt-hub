import { NextResponse } from "next/server";
import { getModels, addModel } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const models = await getModels();
    return NextResponse.json({ models });
  } catch (err) {
    logger.error("GET /api/models failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { modelId, label } = body as { modelId?: string; label?: string };
    if (!modelId?.trim() || !label?.trim()) {
      return NextResponse.json({ error: "modelId and label are required" }, { status: 400 });
    }
    const model = await addModel(modelId.trim(), label.trim());
    return NextResponse.json({ model }, { status: 201 });
  } catch (err) {
    logger.error("POST /api/models failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to add model" }, { status: 500 });
  }
}
