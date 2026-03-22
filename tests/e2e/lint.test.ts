import { describe, it, expect } from "vitest";
import { lintOutput } from "../../src/lint/index.js";
import type { OutputConstraints } from "../../src/ir/types.js";

function makeConstraints(overrides: Partial<OutputConstraints> = {}): OutputConstraints {
  return {
    bannedPhrases: [],
    requiredPhrases: [],
    ...overrides,
  };
}

describe("output linter", () => {
  it("passes when no constraints are violated", () => {
    const result = lintOutput(
      "This is a test article with enough words to pass. It has several sentences that form complete paragraphs.",
      makeConstraints(),
    );
    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("detects min_words violation", () => {
    const result = lintOutput("Too short.", makeConstraints({ minWords: 100 }));
    expect(result.passed).toBe(false);
    expect(result.violations[0].rule).toBe("min_words");
  });

  it("detects max_words violation", () => {
    const words = Array(200).fill("word").join(" ");
    const result = lintOutput(words, makeConstraints({ maxWords: 100 }));
    expect(result.passed).toBe(false);
    expect(result.violations[0].rule).toBe("max_words");
  });

  it("detects bullet list violation", () => {
    const content = "Some text.\n\n- Item one\n- Item two\n\nMore text.";
    const result = lintOutput(content, makeConstraints({ noLists: true }));
    expect(result.passed).toBe(false);
    expect(result.violations[0].rule).toBe("no_lists");
  });

  it("detects numbered list violation", () => {
    const content = "Some text.\n\n1. First\n2. Second\n\nMore text.";
    const result = lintOutput(content, makeConstraints({ noLists: true }));
    expect(result.passed).toBe(false);
    expect(result.violations[0].rule).toBe("no_lists");
  });

  it("detects banned phrase", () => {
    const result = lintOutput(
      "In conclusion, this is the end.",
      makeConstraints({ bannedPhrases: ["in conclusion"] }),
    );
    expect(result.passed).toBe(false);
    expect(result.violations[0].rule).toBe("banned_phrase");
  });

  it("banned phrase check is case-insensitive", () => {
    const result = lintOutput(
      "IN CONCLUSION, this is the end.",
      makeConstraints({ bannedPhrases: ["in conclusion"] }),
    );
    expect(result.passed).toBe(false);
  });

  it("detects missing required phrase", () => {
    const result = lintOutput(
      "This article does not mention the key term.",
      makeConstraints({ requiredPhrases: ["agent-based architecture"] }),
    );
    expect(result.passed).toBe(false);
    expect(result.violations[0].rule).toBe("required_phrase");
  });

  it("passes when required phrase is present", () => {
    const result = lintOutput(
      "This discusses agent-based architecture in detail.",
      makeConstraints({ requiredPhrases: ["agent-based architecture"] }),
    );
    expect(result.passed).toBe(true);
  });

  it("detects short paragraphs", () => {
    const content = "Short paragraph.\n\nThis one has two sentences. It is longer.\n\nAnother short one.";
    const result = lintOutput(
      content,
      makeConstraints({ paragraphMinSentences: 3 }),
    );
    const shortParaViolations = result.violations.filter(
      (v) => v.rule === "paragraph_min_sentences",
    );
    expect(shortParaViolations.length).toBeGreaterThan(0);
    expect(shortParaViolations[0].severity).toBe("warning");
  });

  it("paragraph check is a warning, not an error", () => {
    const result = lintOutput(
      "Short paragraph.",
      makeConstraints({ paragraphMinSentences: 3 }),
    );
    // Warnings don't fail the lint
    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].severity).toBe("warning");
  });

  it("can lint independently without a full pipeline", () => {
    const constraints: OutputConstraints = {
      minWords: 10,
      maxWords: 50,
      noLists: true,
      bannedPhrases: ["however"],
      requiredPhrases: ["key point"],
      paragraphMinSentences: 2,
    };
    const content = "This is the key point of the article. It demonstrates that linting works independently from the generation pipeline.";
    const result = lintOutput(content, constraints);
    expect(result.passed).toBe(true);
  });
});
