export type PromptModelHint =
  | "openai/gpt-4o"
  | "anthropic/claude-3-opus"
  | "google/gemini-pro"
  | "deepseek/deepseek-chat"
  | "mistral/mistral-large";

export interface Prompt {
  id: string;
  slug: string;
  title: string;
  description: string;
  template: string;
  tags: string[];
  defaultModels: PromptModelHint[];
  createdAt: string;
  updatedAt: string;
}

export interface RunInput {
  promptId: string;
  input: string;
  models: PromptModelHint[];
}

export interface RunOutput {
  model: PromptModelHint;
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
  error?: string;
}

export interface Run {
  id: string;
  promptId: string;
  input: string;
  outputs: RunOutput[];
  createdAt: string;
}
