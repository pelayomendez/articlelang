import type { PromptPayload } from "../compiler/types.js";
import type { LLMProvider, RenderResult } from "./provider.js";

export class MockProvider implements LLMProvider {
  name = "mock";

  async render(payload: PromptPayload): Promise<RenderResult> {
    const lines: string[] = [];
    const title = payload.metadata.title;
    const tone = payload.metadata.tone ?? "neutral";
    const goal = payload.metadata.goal ?? "inform";

    lines.push(`# ${title}`);
    lines.push("");

    // Extract narrative units from user prompt
    const userPrompt = payload.sections.find((s) => s.role === "user")?.content ?? "";
    const unitMatches = userPrompt.matchAll(/\d+\.\s*\[(\w+)\]\s*(.+)/g);

    for (const match of unitMatches) {
      const kind = match[1].toLowerCase();
      const description = match[2].trim();

      switch (kind) {
        case "claim":
          lines.push(
            `This article argues a central point. ${description} This perspective challenges conventional thinking and invites the reader to reconsider their assumptions.`,
          );
          lines.push("");
          break;
        case "support":
          lines.push(
            `Consider the following evidence. ${description} This point strengthens the overall argument and builds toward a compelling conclusion.`,
          );
          lines.push("");
          break;
        case "transition":
          lines.push(
            `However, there is more to consider. ${description} This shift in perspective reveals deeper implications.`,
          );
          lines.push("");
          break;
        case "context":
          lines.push(
            `To ground this discussion, consider a concrete scenario. ${description} This example illustrates the broader principle at work.`,
          );
          lines.push("");
          break;
        case "conclusion":
          lines.push(
            `In the final analysis, we arrive at a key insight. ${description} The reader is left to consider what this means for their own context.`,
          );
          lines.push("");
          break;
        default:
          lines.push(`${description}`);
          lines.push("");
      }
    }

    // Pad output to meet minimum word count if specified
    const minWords = payload.metadata.wordRange?.min;
    if (minWords) {
      let currentWords = lines.join(" ").split(/\s+/).length;
      while (currentWords < minWords) {
        lines.push(
          `The implications of this argument extend further than initially apparent. Each dimension reveals new complexity, and the careful reader will find that the evidence supports a ${tone} perspective aimed to ${goal} the audience. The depth of this topic rewards sustained attention and careful analysis.`,
        );
        lines.push("");
        currentWords = lines.join(" ").split(/\s+/).length;
      }
    }

    // Include required phrases
    const sysPrompt = payload.sections.find((s) => s.role === "system")?.content ?? "";
    const requiredMatch = sysPrompt.match(/MUST include these phrases:\s*(.+)/);
    if (requiredMatch) {
      const phrases = requiredMatch[1].match(/"([^"]+)"/g)?.map((p) => p.replace(/"/g, ""));
      if (phrases) {
        for (const phrase of phrases) {
          if (!lines.join("\n").includes(phrase)) {
            lines.push(`It is worth emphasizing the importance of ${phrase} in this context.`);
            lines.push("");
          }
        }
      }
    }

    return {
      content: lines.join("\n").trim(),
      provider: this.name,
      metadata: {
        target: payload.target,
        unitCount: [...userPrompt.matchAll(/\d+\.\s*\[/g)].length,
      },
    };
  }
}

export const mockProvider = new MockProvider();
