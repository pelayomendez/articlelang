import { describe, it, expect } from "vitest";
import { lex } from "../../src/lexer/index.js";
import { parse, ParseError } from "../../src/parser/index.js";
import * as fs from "node:fs";
import * as path from "node:path";

function parseCSL(source: string) {
  return parse(lex(source));
}

describe("parser", () => {
  it("parses a minimal article", () => {
    const ast = parseCSL('article "Test" { thesis: "A thesis" }');
    expect(ast.type).toBe("Article");
    expect(ast.title.value).toBe("Test");
    expect(ast.fields).toHaveLength(1);
    expect(ast.fields[0].name.name).toBe("thesis");
    expect(ast.fields[0].value).toEqual(
      expect.objectContaining({ type: "StringLiteral", value: "A thesis" }),
    );
  });

  it("parses use statements", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "A thesis"
        use contrarian_intro
        use progressive_argument
      }
    `);
    expect(ast.useStatements).toHaveLength(2);
    expect(ast.useStatements[0].patternName.name).toBe("contrarian_intro");
    expect(ast.useStatements[1].patternName.name).toBe("progressive_argument");
  });

  it("parses pattern invocations", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "A thesis"
        use contrarian_intro
        contrarian_intro {
          claim: "A claim"
          reframe: "A reframe"
        }
      }
    `);
    expect(ast.patternInvocations).toHaveLength(1);
    const pattern = ast.patternInvocations[0];
    expect(pattern.patternName.name).toBe("contrarian_intro");
    expect(pattern.fields).toHaveLength(2);
  });

  it("parses constraints block", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "A thesis"
        constraints {
          min_words: 1000
          max_words: 2000
          no_lists: true
          banned_phrases: ["foo", "bar"]
        }
      }
    `);
    expect(ast.constraints).not.toBeNull();
    const c = ast.constraints!;
    expect(c.fields).toHaveLength(4);

    const minWords = c.fields.find((f) => f.name.name === "min_words");
    expect(minWords?.value).toEqual(expect.objectContaining({ type: "NumberLiteral", value: 1000 }));

    const noLists = c.fields.find((f) => f.name.name === "no_lists");
    expect(noLists?.value).toEqual(expect.objectContaining({ type: "BooleanLiteral", value: true }));

    const banned = c.fields.find((f) => f.name.name === "banned_phrases");
    expect(banned?.value.type).toBe("ArrayLiteral");
  });

  it("parses identifier values (enums)", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "A thesis"
        goal: persuade
        tone: provocative
      }
    `);
    const goal = ast.fields.find((f) => f.name.name === "goal");
    expect(goal?.value).toEqual(expect.objectContaining({ type: "Identifier", name: "persuade" }));
  });

  it("parses arrays with trailing commas", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "A thesis"
        constraints {
          banned_phrases: ["a", "b",]
        }
      }
    `);
    const banned = ast.constraints!.fields[0];
    expect(banned.value.type).toBe("ArrayLiteral");
    if (banned.value.type === "ArrayLiteral") {
      expect(banned.value.elements).toHaveLength(2);
    }
  });

  it("includes span data on all nodes", () => {
    const ast = parseCSL('article "Test" { thesis: "A thesis" }');
    expect(ast.span.start.line).toBe(1);
    expect(ast.title.span.start).toBeDefined();
    expect(ast.fields[0].span.start).toBeDefined();
  });

  it("throws on missing article keyword", () => {
    expect(() => parseCSL('"Test" { }')).toThrow(ParseError);
  });

  it("throws on missing title", () => {
    expect(() => parseCSL("article { }")).toThrow(ParseError);
  });

  it("throws on duplicate constraints", () => {
    expect(() =>
      parseCSL(`
        article "Test" {
          thesis: "A"
          constraints { min_words: 1 }
          constraints { min_words: 2 }
        }
      `),
    ).toThrow(ParseError);
  });

  it("provides location info in parse errors", () => {
    try {
      parseCSL("article 123 { }");
      expect.unreachable("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ParseError);
      expect((e as ParseError).location.line).toBe(1);
    }
  });
});

describe("parser - example fixtures", () => {
  const examplesDir = path.join(process.cwd(), "examples");
  const validFiles = [
    "essay_ai_architecture.csl",
    "linkedin_agents.csl",
    "newsletter_reverse_engineering.csl",
  ];

  for (const file of validFiles) {
    it(`parses ${file} successfully`, () => {
      const source = fs.readFileSync(path.join(examplesDir, file), "utf-8");
      const ast = parseCSL(source);
      expect(ast.type).toBe("Article");
      expect(ast.title.value).toBeTruthy();
      expect(ast.fields.length).toBeGreaterThan(0);
      expect(ast.useStatements.length).toBeGreaterThan(0);
      expect(ast.patternInvocations.length).toBeGreaterThan(0);
    });
  }

  const invalidSyntaxFiles = [
    "invalid_missing_thesis.csl",
    "invalid_unknown_pattern.csl",
  ];

  for (const file of invalidSyntaxFiles) {
    it(`parses ${file} without syntax errors (semantic issues only)`, () => {
      const source = fs.readFileSync(path.join(examplesDir, file), "utf-8");
      // These files are syntactically valid but semantically invalid
      const ast = parseCSL(source);
      expect(ast.type).toBe("Article");
    });
  }
});
