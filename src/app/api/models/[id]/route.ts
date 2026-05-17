import { NextResponse } from "next/server";
import { deleteModel } from "@/lib/db";
import { logger } from "@/lib/logger";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    await deleteModel(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("DELETE /api/models/[id] failed", { id, error: String(err) });
    return NextResponse.json({ error: "Failed to delete model" }, { status: 500 });
  }
}
