import { NextResponse } from "next/server";
import { deleteProvider } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteProvider(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    logger.error("DELETE /api/providers/[id] failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to delete provider" }, { status: 500 });
  }
}
