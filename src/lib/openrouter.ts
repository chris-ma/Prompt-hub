import { logger } from "@/lib/logger";
import type { PromptModelHint, RunOutput } from "@/types/types";

interface OpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage?: OpenRouterUsage;
}

export async function callOpenRouter(
  modelId: PromptModelHint,
  prompt: string
): Promise<RunOutput> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseUrl =
    process.env.OPENROUTER_BASE_URL ??
    "https://openrouter.ai/api/v1/chat/completions";

  if (!apiKey) {
    logger.error("OPENROUTER_API_KEY is not set");
    return { model: modelId, content: "", error: "OpenRouter API key is not configured" };
  }

  const startTime = Date.now();
  logger.info("Calling OpenRouter", { model: modelId });

  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://prompt-hub.vercel.app",
        "X-Title": "Prompt Hub",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const durationMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("OpenRouter API error", { model: modelId, status: response.status, durationMs });
      return { model: modelId, content: "", error: `API error ${response.status}: ${errorText}` };
    }

    const data = (await response.json()) as OpenRouterResponse;
    const content = data.choices[0]?.message?.content ?? "";

    logger.info("OpenRouter call succeeded", {
      model: modelId,
      durationMs,
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
    });

    return {
      model: modelId,
      content,
      usage: data.usage
        ? { prompt_tokens: data.usage.prompt_tokens, completion_tokens: data.usage.completion_tokens }
        : undefined,
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("OpenRouter fetch threw", { model: modelId, durationMs, error: errorMessage });
    return { model: modelId, content: "", error: errorMessage };
  }
}
