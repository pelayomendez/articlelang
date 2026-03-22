import type { NarrativeIR, NarrativeUnit } from "../ir/types.js";
import type { PromptPayload, PromptSection } from "./types.js";

export interface PromptCompilerOptions {
  target?: string;
}

export function compilePrompt(
  ir: NarrativeIR,
  options: PromptCompilerOptions = {},
): PromptPayload {
  const target = options.target ?? "blog";
  const sections: PromptSection[] = [];

  // System prompt
  sections.push({
    role: "system",
    content: buildSystemPrompt(ir, target),
  });

  // User prompt with narrative structure
  sections.push({
    role: "user",
    content: buildUserPrompt(ir),
  });

  return {
    target,
    sections,
    metadata: {
      title: ir.title,
      goal: ir.goal,
      tone: ir.tone?.tone ?? null,
      audience: ir.audience?.description ?? null,
      wordRange:
        ir.constraints.minWords || ir.constraints.maxWords
          ? { min: ir.constraints.minWords, max: ir.constraints.maxWords }
          : null,
    },
  };
}

function buildSystemPrompt(ir: NarrativeIR, target: string): string {
  const lines: string[] = [];

  lines.push(`You are a skilled writer producing a ${target} article.`);
  lines.push("");

  if (ir.goal) {
    lines.push(`Goal: ${ir.goal} the reader.`);
  }

  if (ir.audience) {
    lines.push(`Target audience: ${ir.audience.description}`);
  }

  if (ir.tone) {
    lines.push(`Tone: ${ir.tone.tone}`);
  }

  if (ir.voice) {
    lines.push(`Voice: ${ir.voice}`);
  }

  // Constraints
  lines.push("");
  lines.push("Output constraints:");

  if (ir.constraints.minWords) {
    lines.push(`- Minimum ${ir.constraints.minWords} words`);
  }
  if (ir.constraints.maxWords) {
    lines.push(`- Maximum ${ir.constraints.maxWords} words`);
  }
  if (ir.constraints.noLists) {
    lines.push("- Do NOT use bullet points or numbered lists. Use flowing prose only.");
  }
  if (ir.constraints.paragraphMinSentences) {
    lines.push(`- Each paragraph must have at least ${ir.constraints.paragraphMinSentences} sentences`);
  }
  if (ir.constraints.bannedPhrases.length > 0) {
    lines.push(`- Do NOT use these phrases: ${ir.constraints.bannedPhrases.map((p) => `"${p}"`).join(", ")}`);
  }
  if (ir.constraints.requiredPhrases.length > 0) {
    lines.push(`- You MUST include these phrases: ${ir.constraints.requiredPhrases.map((p) => `"${p}"`).join(", ")}`);
  }

  return lines.join("\n");
}

function buildUserPrompt(ir: NarrativeIR): string {
  const lines: string[] = [];

  lines.push(`Write an article titled "${ir.title}".`);
  lines.push("");
  lines.push(`Thesis: ${ir.thesis}`);
  lines.push("");

  if (ir.units.length > 0) {
    lines.push("Follow this narrative structure:");
    lines.push("");

    let sectionNum = 1;
    for (const unit of ir.units) {
      lines.push(`${sectionNum}. [${unit.kind.toUpperCase()}] ${formatUnit(unit)}`);
      sectionNum++;
    }
  }

  return lines.join("\n");
}

function formatUnit(unit: NarrativeUnit): string {
  const parts: string[] = [];

  if (unit.role) {
    parts.push(`(${unit.role})`);
  }

  if (unit.content) {
    parts.push(unit.content);
  }

  if (unit.transitionStyle) {
    parts.push(`[style: ${unit.transitionStyle}]`);
  }

  return parts.join(" — ");
}
