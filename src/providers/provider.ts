import type { PromptPayload } from "../compiler/types.js";

export interface RenderResult {
  content: string;
  provider: string;
  metadata: Record<string, unknown>;
}

export interface LLMProvider {
  name: string;
  render(payload: PromptPayload): Promise<RenderResult>;
}
