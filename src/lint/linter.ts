import type { OutputConstraints } from "../ir/types.js";

export interface LintViolation {
  rule: string;
  message: string;
  severity: "error" | "warning";
}

export interface LintResult {
  passed: boolean;
  violations: LintViolation[];
}

export function lintOutput(
  content: string,
  constraints: OutputConstraints,
): LintResult {
  const violations: LintViolation[] = [];

  const words = content.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;

  if (constraints.minWords && wordCount < constraints.minWords) {
    violations.push({
      rule: "min_words",
      message: `Output has ${wordCount} words, minimum is ${constraints.minWords}`,
      severity: "error",
    });
  }

  if (constraints.maxWords && wordCount > constraints.maxWords) {
    violations.push({
      rule: "max_words",
      message: `Output has ${wordCount} words, maximum is ${constraints.maxWords}`,
      severity: "error",
    });
  }

  if (constraints.noLists) {
    const listPatterns = /^[\s]*[-*]\s|^[\s]*\d+[\.)]\s/gm;
    if (listPatterns.test(content)) {
      violations.push({
        rule: "no_lists",
        message: "Output contains bullet points or numbered lists",
        severity: "error",
      });
    }
  }

  for (const phrase of constraints.bannedPhrases) {
    if (content.toLowerCase().includes(phrase.toLowerCase())) {
      violations.push({
        rule: "banned_phrase",
        message: `Output contains banned phrase: "${phrase}"`,
        severity: "error",
      });
    }
  }

  for (const phrase of constraints.requiredPhrases) {
    if (!content.toLowerCase().includes(phrase.toLowerCase())) {
      violations.push({
        rule: "required_phrase",
        message: `Output is missing required phrase: "${phrase}"`,
        severity: "error",
      });
    }
  }

  if (constraints.paragraphMinSentences) {
    const paragraphs = content
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0 && !p.startsWith("#"));

    for (let i = 0; i < paragraphs.length; i++) {
      const sentences = paragraphs[i]
        .split(/[.!?]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (sentences.length < constraints.paragraphMinSentences) {
        violations.push({
          rule: "paragraph_min_sentences",
          message: `Paragraph ${i + 1} has ${sentences.length} sentence(s), minimum is ${constraints.paragraphMinSentences}`,
          severity: "warning",
        });
      }
    }
  }

  return {
    passed: violations.filter((v) => v.severity === "error").length === 0,
    violations,
  };
}
