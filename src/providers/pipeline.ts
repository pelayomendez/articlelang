import { lex } from "../lexer/index.js";
import { parse } from "../parser/index.js";
import { validate } from "../validator/index.js";
import { defaultRegistry } from "../patterns/index.js";
import { defaultFilterRegistry } from "../filters/index.js";
import { compileToIR } from "../ir/index.js";
import { compilePrompt } from "../compiler/index.js";
import type { LLMProvider, RenderResult } from "./provider.js";
import { mockProvider } from "./mock.js";
import type { ArticleNode } from "../ast/types.js";
import type { NarrativeIR } from "../ir/types.js";
import type { PromptPayload } from "../compiler/types.js";
import type { ValidationResult } from "../validator/errors.js";

export interface PipelineResult {
  ast: ArticleNode;
  validation: ValidationResult;
  ir: NarrativeIR;
  prompt: PromptPayload;
  rendered: RenderResult;
}

export interface PipelineOptions {
  provider?: LLMProvider;
  target?: string;
}

export async function renderPipeline(
  source: string,
  options: PipelineOptions = {},
): Promise<PipelineResult> {
  const provider = options.provider ?? mockProvider;
  const target = options.target ?? "blog";

  const tokens = lex(source);
  const ast = parse(tokens);

  const validation = validate(ast, {
    knownPatterns: defaultRegistry.toSchemaMap(),
    knownFilters: defaultFilterRegistry.toSchemaMap(),
  });

  if (!validation.valid) {
    const messages = validation.errors.map((e) => e.message).join("; ");
    throw new Error(`Validation failed: ${messages}`);
  }

  const ir = compileToIR(ast);
  const prompt = compilePrompt(ir, { target });
  const rendered = await provider.render(prompt);

  return { ast, validation, ir, prompt, rendered };
}
