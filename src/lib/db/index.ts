import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";
import type { Prompt, Run, RunOutput, PromptModelHint } from "@/types/types";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

type DbPrompt = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  template: string;
  tags: string[];
  defaultModels: string[];
  createdAt: Date;
  updatedAt: Date;
};

function mapPrompt(p: DbPrompt): Prompt {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description ?? "",
    template: p.template,
    tags: p.tags,
    defaultModels: p.defaultModels as PromptModelHint[],
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

type DbRun = {
  id: string;
  promptId: string;
  input: string;
  outputs: unknown;
  createdAt: Date;
};

function mapRun(r: DbRun): Run {
  return {
    id: r.id,
    promptId: r.promptId,
    input: r.input,
    outputs: (r.outputs as RunOutput[]) ?? [],
    createdAt: r.createdAt.toISOString(),
  };
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function getPrompts(): Promise<Prompt[]> {
  logger.debug("getPrompts");
  const prompts = await prisma.prompt.findMany({ orderBy: { createdAt: "desc" } });
  return prompts.map(mapPrompt);
}

export async function getPromptById(id: string): Promise<Prompt | null> {
  logger.debug("getPromptById", { id });
  const prompt = await prisma.prompt.findUnique({ where: { id } });
  return prompt ? mapPrompt(prompt) : null;
}

export async function getPromptBySlug(slug: string): Promise<Prompt | null> {
  logger.debug("getPromptBySlug", { slug });
  const prompt = await prisma.prompt.findUnique({ where: { slug } });
  return prompt ? mapPrompt(prompt) : null;
}

export interface CreatePromptData {
  title: string;
  description?: string;
  template: string;
  tags?: string[];
  defaultModels?: PromptModelHint[];
  slug?: string;
}

export async function createPrompt(data: CreatePromptData): Promise<Prompt> {
  logger.info("createPrompt", { title: data.title });
  let slug = data.slug ?? generateSlug(data.title);
  const existing = await prisma.prompt.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }
  const prompt = await prisma.prompt.create({
    data: {
      slug,
      title: data.title,
      description: data.description ?? "",
      template: data.template,
      tags: data.tags ?? [],
      defaultModels: data.defaultModels ?? [],
    },
  });
  return mapPrompt(prompt);
}

export interface UpdatePromptData {
  title?: string;
  description?: string;
  template?: string;
  tags?: string[];
  defaultModels?: PromptModelHint[];
}

export async function updatePrompt(id: string, data: UpdatePromptData): Promise<Prompt> {
  logger.info("updatePrompt", { id });
  const current = await prisma.prompt.findUniqueOrThrow({ where: { id } });
  const updatedSlug =
    data.title && data.title !== current.title ? generateSlug(data.title) : current.slug;

  const prompt = await prisma.prompt.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title, slug: updatedSlug }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.template !== undefined && { template: data.template }),
      ...(data.tags !== undefined && { tags: data.tags }),
      ...(data.defaultModels !== undefined && { defaultModels: data.defaultModels }),
    },
  });
  return mapPrompt(prompt);
}

export async function deletePrompt(id: string): Promise<void> {
  logger.info("deletePrompt", { id });
  await prisma.run.deleteMany({ where: { promptId: id } });
  await prisma.prompt.delete({ where: { id } });
}

export interface SaveRunData {
  promptId: string;
  input: string;
  outputs: RunOutput[];
}

export async function saveRun(data: SaveRunData): Promise<Run> {
  logger.info("saveRun", { promptId: data.promptId, modelCount: data.outputs.length });
  const run = await prisma.run.create({
    data: { promptId: data.promptId, input: data.input, outputs: JSON.parse(JSON.stringify(data.outputs)) },
  });
  return mapRun(run);
}

export async function getRunsForPrompt(promptId: string): Promise<Run[]> {
  logger.debug("getRunsForPrompt", { promptId });
  const runs = await prisma.run.findMany({
    where: { promptId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return runs.map(mapRun);
}
