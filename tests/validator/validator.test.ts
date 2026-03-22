import { describe, it, expect } from "vitest";
import { lex } from "../../src/lexer/index.js";
import { parse } from "../../src/parser/index.js";
import { validate, type PatternSchema } from "../../src/validator/index.js";
import * as fs from "node:fs";
import * as path from "node:path";

function parseCSL(source: string) {
  return parse(lex(source));
}

const TEST_PATTERNS = new Map<string, PatternSchema>([
  ["contrarian_intro", { name: "contrarian_intro", requiredFields: ["claim", "reframe"], optionalFields: [] }],
  ["progressive_argument", { name: "progressive_argument", requiredFields: ["points"], optionalFields: [] }],
  ["concrete_example", { name: "concrete_example", requiredFields: ["scenario", "before", "after"], optionalFields: [] }],
  ["counterpoint_rebuttal", { name: "counterpoint_rebuttal", requiredFields: ["counterpoint", "rebuttal"], optionalFields: [] }],
  ["analogy_bridge", { name: "analogy_bridge", requiredFields: ["source", "target", "insight"], optionalFields: [] }],
  ["reframe_conclusion", { name: "reframe_conclusion", requiredFields: ["callback", "reframe"], optionalFields: [] }],
  ["open_ending", { name: "open_ending", requiredFields: ["question"], optionalFields: [] }],
]);

describe("validator", () => {
  it("accepts a valid article", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "A valid thesis"
        goal: persuade
        tone: provocative
      }
    `);
    const result = validate(ast);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects missing thesis", () => {
    const ast = parseCSL('article "Test" { goal: inform }');
    const result = validate(ast);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "MISSING_THESIS")).toBe(true);
  });

  it("rejects empty thesis", () => {
    const ast = parseCSL('article "Test" { thesis: "" }');
    const result = validate(ast);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "EMPTY_THESIS")).toBe(true);
  });

  it("rejects invalid goal", () => {
    const ast = parseCSL('article "Test" { thesis: "X" goal: destroy }');
    const result = validate(ast);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "INVALID_GOAL")).toBe(true);
  });

  it("rejects invalid tone", () => {
    const ast = parseCSL('article "Test" { thesis: "X" tone: aggressive }');
    const result = validate(ast);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "INVALID_TONE")).toBe(true);
  });

  it("rejects unknown article fields", () => {
    const ast = parseCSL('article "Test" { thesis: "X" foo: "bar" }');
    const result = validate(ast);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "UNKNOWN_FIELD")).toBe(true);
  });

  it("rejects duplicate fields", () => {
    const ast = parseCSL('article "Test" { thesis: "X" thesis: "Y" }');
    const result = validate(ast);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "DUPLICATE_FIELD")).toBe(true);
  });

  it("rejects unknown patterns when registry is provided", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        use nonexistent_pattern
      }
    `);
    const result = validate(ast, { knownPatterns: TEST_PATTERNS });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "UNKNOWN_PATTERN")).toBe(true);
  });

  it("rejects undeclared pattern invocation", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        contrarian_intro {
          claim: "A"
          reframe: "B"
        }
      }
    `);
    const result = validate(ast);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "UNDECLARED_PATTERN")).toBe(true);
  });

  it("rejects missing required pattern fields", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        use contrarian_intro
        contrarian_intro {
          claim: "A"
        }
      }
    `);
    const result = validate(ast, { knownPatterns: TEST_PATTERNS });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "MISSING_PATTERN_FIELD")).toBe(true);
  });

  it("rejects unknown pattern fields", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        use contrarian_intro
        contrarian_intro {
          claim: "A"
          reframe: "B"
          foo: "unknown"
        }
      }
    `);
    const result = validate(ast, { knownPatterns: TEST_PATTERNS });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "UNKNOWN_PATTERN_FIELD")).toBe(true);
  });

  it("rejects unknown constraints", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        constraints {
          unknown_thing: 5
        }
      }
    `);
    const result = validate(ast);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "UNKNOWN_CONSTRAINT")).toBe(true);
  });

  it("rejects wrong constraint types", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        constraints {
          min_words: "not a number"
          no_lists: 42
          banned_phrases: "not an array"
        }
      }
    `);
    const result = validate(ast);
    expect(result.valid).toBe(false);
    const codes = result.errors.map((e) => e.code);
    expect(codes.filter((c) => c === "INVALID_CONSTRAINT_TYPE")).toHaveLength(3);
  });

  it("errors include readable messages", () => {
    const ast = parseCSL('article "Test" { goal: inform }');
    const result = validate(ast);
    for (const error of result.errors) {
      expect(error.message).toBeTruthy();
      expect(error.code).toBeTruthy();
    }
  });
});

describe("validator - example fixtures", () => {
  const examplesDir = path.join(process.cwd(), "examples");

  it("validates essay_ai_architecture.csl", () => {
    const source = fs.readFileSync(path.join(examplesDir, "essay_ai_architecture.csl"), "utf-8");
    const result = validate(parseCSL(source), { knownPatterns: TEST_PATTERNS });
    expect(result.valid).toBe(true);
  });

  it("validates linkedin_agents.csl", () => {
    const source = fs.readFileSync(path.join(examplesDir, "linkedin_agents.csl"), "utf-8");
    const result = validate(parseCSL(source), { knownPatterns: TEST_PATTERNS });
    expect(result.valid).toBe(true);
  });

  it("validates newsletter_reverse_engineering.csl", () => {
    const source = fs.readFileSync(path.join(examplesDir, "newsletter_reverse_engineering.csl"), "utf-8");
    const result = validate(parseCSL(source), { knownPatterns: TEST_PATTERNS });
    expect(result.valid).toBe(true);
  });

  it("rejects invalid_missing_thesis.csl", () => {
    const source = fs.readFileSync(path.join(examplesDir, "invalid_missing_thesis.csl"), "utf-8");
    const result = validate(parseCSL(source), { knownPatterns: TEST_PATTERNS });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "MISSING_THESIS")).toBe(true);
  });

  it("rejects invalid_unknown_pattern.csl", () => {
    const source = fs.readFileSync(path.join(examplesDir, "invalid_unknown_pattern.csl"), "utf-8");
    const result = validate(parseCSL(source), { knownPatterns: TEST_PATTERNS });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "UNKNOWN_PATTERN")).toBe(true);
  });
});
