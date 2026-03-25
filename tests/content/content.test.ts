import { describe, it, expect } from "vitest";
import { lex } from "../../src/lexer/index.js";
import { parse, ParseError } from "../../src/parser/index.js";
import { validate } from "../../src/validator/index.js";
import { defaultRegistry } from "../../src/patterns/index.js";
import { defaultFilterRegistry } from "../../src/filters/index.js";
import { compileToIR } from "../../src/ir/index.js";
import { compilePrompt } from "../../src/compiler/index.js";
import { serialize } from "../../src/serializer/index.js";
import { TokenType } from "../../src/lexer/tokens.js";

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

const VALIDATOR_OPTIONS = {
  knownPatterns: defaultRegistry.toSchemaMap(),
  knownFilters: defaultFilterRegistry.toSchemaMap(),
};

describe("content block lexing", () => {
  it("lexes the content keyword", () => {
    const tokens = lex("content");
    expect(tokens[0].type).toBe(TokenType.Content);
  });

  it("lexes a text body between --- delimiters", () => {
    const tokens = lex("---\nhello world\n---");
    expect(tokens[0].type).toBe(TokenType.TextBody);
    expect(tokens[0].value).toBe("hello world");
  });

  it("lexes multiline text body", () => {
    const tokens = lex("---\nline one\nline two\nline three\n---");
    expect(tokens[0].type).toBe(TokenType.TextBody);
    expect(tokens[0].value).toBe("line one\nline two\nline three");
  });

  it("preserves indentation in text body", () => {
    const tokens = lex("---\n  indented\n    more indented\n---");
    expect(tokens[0].value).toBe("  indented\n    more indented");
  });

  it("throws on unterminated text body", () => {
    expect(() => lex("---\nhello")).toThrow("Unterminated text body");
  });
});

describe("content block parsing", () => {
  it("parses a verbatim content block without label", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        content {
          ---
          Hello world
          ---
        }
      }
    `);
    expect(ast.contentBlocks).toHaveLength(1);
    expect(ast.contentBlocks[0].label).toBeNull();
    expect(ast.contentBlocks[0].body).toBe("          Hello world");
    expect(ast.contentBlocks[0].filters).toBeNull();
  });

  it("parses a content block with label", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        content "disclaimer" {
          ---
          The views expressed are solely those of the author.
          ---
        }
      }
    `);
    expect(ast.contentBlocks).toHaveLength(1);
    expect(ast.contentBlocks[0].label!.value).toBe("disclaimer");
    expect(ast.contentBlocks[0].body).toContain("The views expressed");
  });

  it("parses a content block with filters", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        content "draft" {
          filters {
            hemingway {}
          }
          ---
          We built a new tool. It helps developers write articles.
          ---
        }
      }
    `);
    expect(ast.contentBlocks).toHaveLength(1);
    expect(ast.contentBlocks[0].filters).not.toBeNull();
    expect(ast.contentBlocks[0].filters!.filters).toHaveLength(1);
    expect(ast.contentBlocks[0].filters!.filters[0].filterName.name).toBe("hemingway");
    expect(ast.contentBlocks[0].body).toContain("We built a new tool");
  });

  it("parses multiple content blocks", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        content "intro" {
          ---
          First block.
          ---
        }
        content "outro" {
          ---
          Second block.
          ---
        }
      }
    `);
    expect(ast.contentBlocks).toHaveLength(2);
  });

  it("parses content block with filters and config", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        content "styled" {
          filters {
            ogilvy { intensity: high }
            hemingway {}
          }
          ---
          Raw draft text here.
          ---
        }
      }
    `);
    const block = ast.contentBlocks[0];
    expect(block.filters!.filters).toHaveLength(2);
    expect(block.filters!.filters[0].filterName.name).toBe("ogilvy");
    expect(block.filters!.filters[0].fields[0].name.name).toBe("intensity");
  });
});

describe("content block validation", () => {
  it("accepts valid content block", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        content {
          ---
          Some text here
          ---
        }
      }
    `);
    const result = validate(ast, VALIDATOR_OPTIONS);
    expect(result.valid).toBe(true);
  });

  it("accepts content block with known filters", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        content "draft" {
          filters { hemingway {} }
          ---
          Some text
          ---
        }
      }
    `);
    const result = validate(ast, VALIDATOR_OPTIONS);
    expect(result.valid).toBe(true);
  });

  it("rejects content block with unknown filter", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        content {
          filters { nonexistent {} }
          ---
          Some text
          ---
        }
      }
    `);
    const result = validate(ast, VALIDATOR_OPTIONS);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "UNKNOWN_FILTER")).toBe(true);
  });

  it("rejects content block with duplicate filters", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        content {
          filters { hemingway {} hemingway {} }
          ---
          Some text
          ---
        }
      }
    `);
    const result = validate(ast, VALIDATOR_OPTIONS);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "DUPLICATE_FILTER")).toBe(true);
  });
});

describe("content block IR compilation", () => {
  it("compiles verbatim content to IR", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        content "disclaimer" {
          ---
          Verbatim text here.
          ---
        }
      }
    `);
    const ir = compileToIR(ast);
    expect(ir.units).toHaveLength(1);
    expect(ir.units[0].kind).toBe("verbatim");
    expect(ir.units[0].content).toContain("Verbatim text here.");
    expect(ir.units[0].role).toBe("disclaimer");
  });

  it("compiles rewrite content to IR", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        content "draft" {
          filters { hemingway {} }
          ---
          Some draft text.
          ---
        }
      }
    `);
    const ir = compileToIR(ast);
    expect(ir.units).toHaveLength(1);
    expect(ir.units[0].kind).toBe("rewrite");
    expect(ir.units[0].content).toContain("Some draft text.");
    expect(ir.units[0].filters).toHaveLength(1);
    expect(ir.units[0].filters![0].name).toBe("hemingway");
    expect(ir.units[0].filters![0].directives.length).toBeGreaterThan(0);
  });

  it("uses 'user content' as default role when no label", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        content {
          ---
          text
          ---
        }
      }
    `);
    const ir = compileToIR(ast);
    expect(ir.units[0].role).toBe("user content");
  });
});

describe("content block prompt compilation", () => {
  it("includes verbatim text with exact-copy instruction", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        content {
          ---
          Include this verbatim.
          ---
        }
      }
    `);
    const ir = compileToIR(ast);
    const prompt = compilePrompt(ir);
    const user = prompt.sections[1].content;
    expect(user).toContain("EXACTLY as written");
    expect(user).toContain("Include this verbatim.");
  });

  it("includes rewrite text with style directives", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        content {
          filters { hemingway {} }
          ---
          Rewrite this text.
          ---
        }
      }
    `);
    const ir = compileToIR(ast);
    const prompt = compilePrompt(ir);
    const user = prompt.sections[1].content;
    expect(user).toContain("Rewrite the following text");
    expect(user).toContain("hemingway");
    expect(user).toContain("Rewrite this text.");
  });
});

describe("content block serialization round-trip", () => {
  it("round-trips verbatim content block", () => {
    const source = `
      article "Test" {
        thesis: "X"
        content "disclaimer" {
          ---
          The views are the author's own.
          ---
        }
      }
    `;
    const ast1 = parseCSL(source);
    const serialized = serialize(ast1);
    const ast2 = parseCSL(serialized);
    expect(stripSpans(ast2.contentBlocks)).toEqual(stripSpans(ast1.contentBlocks));
  });

  it("round-trips content block with filters", () => {
    const source = `
      article "Test" {
        thesis: "X"
        content "draft" {
          filters {
            ogilvy { intensity: high }
            hemingway {}
          }
          ---
          Draft text here.
          ---
        }
      }
    `;
    const ast1 = parseCSL(source);
    const serialized = serialize(ast1);
    const ast2 = parseCSL(serialized);
    expect(stripSpans(ast2.contentBlocks)).toEqual(stripSpans(ast1.contentBlocks));
  });

  it("round-trips content block without label", () => {
    const source = `
      article "Test" {
        thesis: "X"
        content {
          ---
          Just some text.
          ---
        }
      }
    `;
    const ast1 = parseCSL(source);
    const serialized = serialize(ast1);
    const ast2 = parseCSL(serialized);
    expect(stripSpans(ast2.contentBlocks)).toEqual(stripSpans(ast1.contentBlocks));
  });
});
