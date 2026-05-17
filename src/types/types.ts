export type PromptModelHint = string;

export interface Model {
  id: string;
  modelId: string;
  label: string;
  createdAt: string;
}

export interface Prompt {
  id: string;
  slug: string;
  title: string;
  description: string;
  template: string;
  tags: string[];
  defaultModels: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RunInput {
  promptId: string;
  input: string;
  models: string[];
}

export interface RunOutput {
  model: string;
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
