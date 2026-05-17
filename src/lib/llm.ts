import { logger } from "@/lib/logger";
import type { RunOutput } from "@/types/types";

interface ModelWithProvider {
  modelId: string;
  provider: {
    slug: string;
    apiKey: string;
    baseUrl: string | null;
  } | null;
}

const DEFAULT_BASE_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1/chat/completions",
  mistral: "https://api.mistral.ai/v1/chat/completions",
  deepseek: "https://api.deepseek.com/v1/chat/completions",
  xai: "https://api.x.ai/v1/chat/completions",
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
};

async function callAnthropic(
  modelId: string,
  apiKey: string,
  baseUrl: string | null,
  prompt: string
): Promise<RunOutput> {
  const url = baseUrl ?? "https://api.anthropic.com/v1/messages";
  const startTime = Date.now();
  logger.info("Calling Anthropic", { model: modelId });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const durationMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Anthropic API error", { model: modelId, status: response.status, durationMs });
      return { model: modelId, content: "", error: `API error ${response.status}: ${errorText}` };
    }

    const data = await response.json() as {
      content: Array<{ type: string; text: string }>;
      usage: { input_tokens: number; output_tokens: number };
    };

    const content = data.content[0]?.text ?? "";
    logger.info("Anthropic call succeeded", { model: modelId, durationMs });

    return {
      model: modelId,
      content,
      usage: {
        prompt_tokens: data.usage.input_tokens,
        completion_tokens: data.usage.output_tokens,
      },
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("Anthropic fetch threw", { model: modelId, durationMs, error: errorMessage });
    return { model: modelId, content: "", error: errorMessage };
  }
}

async function callOpenAICompatible(
  modelId: string,
  apiKey: string,
  baseUrl: string,
  prompt: string,
  extraHeaders?: Record<string, string>
): Promise<RunOutput> {
  const startTime = Date.now();
  logger.info("Calling OpenAI-compatible API", { model: modelId, baseUrl });

  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...extraHeaders,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const durationMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("API error", { model: modelId, status: response.status, durationMs });
      return { model: modelId, content: "", error: `API error ${response.status}: ${errorText}` };
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number };
    };

    const content = data.choices[0]?.message?.content ?? "";
    logger.info("API call succeeded", { model: modelId, durationMs });

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
    logger.error("API fetch threw", { model: modelId, durationMs, error: errorMessage });
    return { model: modelId, content: "", error: errorMessage };
  }
}

export async function callModel(
  model: ModelWithProvider,
  prompt: string
): Promise<RunOutput> {
  const { modelId, provider } = model;

  if (!provider) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return { model: modelId, content: "", error: "No provider configured and OPENROUTER_API_KEY is not set" };
    }
    return callOpenAICompatible(
      modelId,
      apiKey,
      "https://openrouter.ai/api/v1/chat/completions",
      prompt,
      {
        "HTTP-Referer": "https://prompt-hub.vercel.app",
        "X-Title": "Prompt Hub",
      }
    );
  }

  const { slug, apiKey, baseUrl } = provider;

  if (slug === "anthropic") {
    return callAnthropic(modelId, apiKey, baseUrl, prompt);
  }

  const resolvedBaseUrl = baseUrl ?? DEFAULT_BASE_URLS[slug] ?? "https://openrouter.ai/api/v1/chat/completions";
  const extraHeaders = slug === "openrouter"
    ? { "HTTP-Referer": "https://prompt-hub.vercel.app", "X-Title": "Prompt Hub" }
    : undefined;

  return callOpenAICompatible(modelId, apiKey, resolvedBaseUrl, prompt, extraHeaders);
}
