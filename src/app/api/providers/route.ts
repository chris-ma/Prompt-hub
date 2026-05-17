import { NextResponse } from "next/server";
import { getProviders, addProvider } from "@/lib/db";
import { logger } from "@/lib/logger";

const ALLOWED_SLUGS = ["openai", "anthropic", "mistral", "deepseek", "xai", "openrouter"];

export async function GET() {
  try {
    const providers = await getProviders();
    return NextResponse.json({ providers });
  } catch (err) {
    logger.error("GET /api/providers failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      name?: string;
      slug?: string;
      apiKey?: string;
      baseUrl?: string;
    };

    const { name, slug, apiKey, baseUrl } = body;

    if (!name?.trim() || !slug?.trim() || !apiKey?.trim()) {
      return NextResponse.json(
        { error: "name, slug, and apiKey are required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_SLUGS.includes(slug.trim())) {
      return NextResponse.json(
        { error: `slug must be one of: ${ALLOWED_SLUGS.join(", ")}` },
        { status: 400 }
      );
    }

    const provider = await addProvider({
      name: name.trim(),
      slug: slug.trim(),
      apiKey: apiKey.trim(),
      baseUrl: baseUrl?.trim() || undefined,
    });

    return NextResponse.json({ provider }, { status: 201 });
  } catch (err) {
    logger.error("POST /api/providers failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to add provider" }, { status: 500 });
  }
}
