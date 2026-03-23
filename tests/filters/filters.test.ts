import { describe, it, expect } from "vitest";
import { lex } from "../../src/lexer/index.js";
import { parse } from "../../src/parser/index.js";
import { validate } from "../../src/validator/index.js";
import { defaultRegistry } from "../../src/patterns/index.js";
import { defaultFilterRegistry } from "../../src/filters/index.js";
import { compileToIR } from "../../src/ir/index.js";
import { compilePrompt } from "../../src/compiler/index.js";
import { serialize } from "../../src/serializer/index.js";

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

describe("filter registry", () => {
  it("has 6 built-in filters", () => {
    expect(defaultFilterRegistry.names()).toHaveLength(6);
  });

  const expected = ["ogilvy", "hemingway", "gonzo", "orwell", "scientific", "storyteller"];
  for (const name of expected) {
    it(`has filter '${name}'`, () => {
      expect(defaultFilterRegistry.has(name)).toBe(true);
      const f = defaultFilterRegistry.get(name)!;
      expect(f.directives.length).toBeGreaterThan(0);
    });
  }
});

describe("filter parsing", () => {
  it("parses an empty filters block", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        filters {}
      }
    `);
    expect(ast.filters).not.toBeNull();
    expect(ast.filters!.filters).toHaveLength(0);
  });

  it("parses filters with empty config", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        filters {
          hemingway {}
        }
      }
    `);
    expect(ast.filters!.filters).toHaveLength(1);
    expect(ast.filters!.filters[0].filterName.name).toBe("hemingway");
    expect(ast.filters!.filters[0].fields).toHaveLength(0);
  });

  it("parses filters with config fields", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        filters {
          ogilvy { intensity: high }
        }
      }
    `);
    const filter = ast.filters!.filters[0];
    expect(filter.filterName.name).toBe("ogilvy");
    expect(filter.fields).toHaveLength(1);
    expect(filter.fields[0].name.name).toBe("intensity");
  });

  it("parses multiple filters", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        filters {
          ogilvy { intensity: high }
          hemingway {}
          orwell {}
        }
      }
    `);
    expect(ast.filters!.filters).toHaveLength(3);
  });

  it("rejects duplicate filters block", () => {
    expect(() => parseCSL(`
      article "Test" {
        thesis: "X"
        filters {}
        filters {}
      }
    `)).toThrow();
  });
});

describe("filter validation", () => {
  it("accepts known filters", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        filters {
          hemingway {}
          ogilvy {}
        }
      }
    `);
    const result = validate(ast, VALIDATOR_OPTIONS);
    expect(result.valid).toBe(true);
  });

  it("rejects unknown filter", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        filters {
          nonexistent {}
        }
      }
    `);
    const result = validate(ast, VALIDATOR_OPTIONS);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "UNKNOWN_FILTER")).toBe(true);
  });

  it("rejects duplicate filter", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        filters {
          hemingway {}
          hemingway {}
        }
      }
    `);
    const result = validate(ast, VALIDATOR_OPTIONS);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "DUPLICATE_FILTER")).toBe(true);
  });

  it("rejects unknown filter field", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        filters {
          hemingway { unknown_field: "foo" }
        }
      }
    `);
    const result = validate(ast, VALIDATOR_OPTIONS);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "UNKNOWN_FILTER_FIELD")).toBe(true);
  });

  it("accepts known optional field", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        filters {
          ogilvy { intensity: high }
        }
      }
    `);
    const result = validate(ast, VALIDATOR_OPTIONS);
    expect(result.valid).toBe(true);
  });
});

describe("filter IR compilation", () => {
  it("compiles filters to IR", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        filters {
          hemingway {}
          ogilvy { intensity: high }
        }
      }
    `);
    const ir = compileToIR(ast);
    expect(ir.filters).toHaveLength(2);
    expect(ir.filters[0].name).toBe("hemingway");
    expect(ir.filters[0].directives.length).toBeGreaterThan(0);
    expect(ir.filters[1].name).toBe("ogilvy");
    expect(ir.filters[1].config.intensity).toBe("high");
  });

  it("compiles empty filters", () => {
    const ast = parseCSL('article "Test" { thesis: "X" }');
    const ir = compileToIR(ast);
    expect(ir.filters).toHaveLength(0);
  });
});

describe("filter prompt compilation", () => {
  it("injects filter directives into system prompt", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        filters {
          hemingway {}
        }
      }
    `);
    const ir = compileToIR(ast);
    const prompt = compilePrompt(ir);
    const sys = prompt.sections[0].content;
    expect(sys).toContain("Style filters");
    expect(sys).toContain("hemingway");
    expect(sys).toContain("short, declarative sentences");
  });

  it("includes intensity in filter label", () => {
    const ast = parseCSL(`
      article "Test" {
        thesis: "X"
        filters {
          ogilvy { intensity: high }
        }
      }
    `);
    const ir = compileToIR(ast);
    const prompt = compilePrompt(ir);
    const sys = prompt.sections[0].content;
    expect(sys).toContain("ogilvy (high)");
  });
});

describe("filter serialization round-trip", () => {
  it("round-trips filters with config", () => {
    const source = `
      article "Test" {
        thesis: "X"
        filters {
          ogilvy { intensity: high }
          hemingway {}
        }
      }
    `;
    const ast1 = parseCSL(source);
    const serialized = serialize(ast1);
    const ast2 = parseCSL(serialized);
    expect(stripSpans(ast2)).toEqual(stripSpans(ast1));
  });

  it("round-trips article without filters", () => {
    const source = 'article "Test" { thesis: "X" }';
    const ast1 = parseCSL(source);
    const serialized = serialize(ast1);
    const ast2 = parseCSL(serialized);
    expect(stripSpans(ast2)).toEqual(stripSpans(ast1));
  });
});
