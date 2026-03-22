import { describe, it, expect } from "vitest";
import { lex } from "../../src/lexer/index.js";
import { parse } from "../../src/parser/index.js";
import { serialize } from "../../src/serializer/index.js";
import * as fs from "node:fs";
import * as path from "node:path";

function parseCSL(source: string) {
  return parse(lex(source));
}

function stripSpans(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(stripSpans);
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (key === "span") continue;
      result[key] = stripSpans(value);
    }
    return result;
  }
  return obj;
}

function roundTrip(source: string) {
  const ast1 = parseCSL(source);
  const serialized = serialize(ast1);
  const ast2 = parseCSL(serialized);
  return { ast1, ast2, serialized };
}

describe("serializer", () => {
  it("serializes a minimal article", () => {
    const ast = parseCSL('article "Test" { thesis: "A thesis" }');
    const output = serialize(ast);
    expect(output).toContain('article "Test"');
    expect(output).toContain('thesis: "A thesis"');
  });

  it("serializes fields with different value types", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        goal: persuade
        tone: analytical
      }
    `);
    const output = serialize(ast);
    expect(output).toContain("goal: persuade");
    expect(output).toContain("tone: analytical");
  });

  it("serializes use statements", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        use contrarian_intro
        use progressive_argument
      }
    `);
    const output = serialize(ast);
    expect(output).toContain("use contrarian_intro");
    expect(output).toContain("use progressive_argument");
  });

  it("serializes pattern invocations", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        use contrarian_intro
        contrarian_intro {
          claim: "Old"
          reframe: "New"
        }
      }
    `);
    const output = serialize(ast);
    expect(output).toContain("contrarian_intro {");
    expect(output).toContain('claim: "Old"');
    expect(output).toContain('reframe: "New"');
  });

  it("serializes constraints", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        constraints {
          min_words: 1000
          max_words: 2000
          no_lists: true
          banned_phrases: ["foo", "bar"]
        }
      }
    `);
    const output = serialize(ast);
    expect(output).toContain("min_words: 1000");
    expect(output).toContain("no_lists: true");
    expect(output).toContain('banned_phrases: ["foo", "bar"]');
  });

  it("escapes strings correctly", () => {
    const ast = parseCSL('article "Test \\"quoted\\"" { thesis: "line1\\nline2" }');
    const output = serialize(ast);
    expect(output).toContain('article "Test \\"quoted\\""');
    expect(output).toContain('"line1\\nline2"');
  });

  it("round-trips a minimal article", () => {
    const { ast1, ast2 } = roundTrip('article "Test" { thesis: "A thesis" }');
    expect(stripSpans(ast2)).toEqual(stripSpans(ast1));
  });

  it("round-trips an article with all field types", () => {
    const source = `
      article "Test" {
        thesis: "X"
        goal: persuade
        audience: "Engineers"
        tone: provocative
        constraints {
          min_words: 1000
          no_lists: true
          banned_phrases: ["a", "b"]
        }
      }
    `;
    const { ast1, ast2 } = roundTrip(source);
    expect(stripSpans(ast2)).toEqual(stripSpans(ast1));
  });

  it("round-trips an article with patterns", () => {
    const source = `
      article "Test" {
        thesis: "X"
        use contrarian_intro
        use progressive_argument
        contrarian_intro {
          claim: "Old"
          reframe: "New"
        }
        progressive_argument {
          points: ["A", "B", "C"]
        }
      }
    `;
    const { ast1, ast2 } = roundTrip(source);
    expect(stripSpans(ast2)).toEqual(stripSpans(ast1));
  });
});

describe("serializer - fixture round-trips", () => {
  const examplesDir = path.join(process.cwd(), "examples");
  const fixtures = [
    "essay_ai_architecture.csl",
    "linkedin_agents.csl",
    "newsletter_reverse_engineering.csl",
    "invalid_missing_thesis.csl",
    "invalid_unknown_pattern.csl",
  ];

  for (const file of fixtures) {
    it(`round-trips ${file}`, () => {
      const source = fs.readFileSync(path.join(examplesDir, file), "utf-8");
      const { ast1, ast2 } = roundTrip(source);
      expect(stripSpans(ast2)).toEqual(stripSpans(ast1));
    });
  }
});
