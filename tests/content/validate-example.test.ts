import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { lex } from "../../src/lexer/index.js";
import { parse } from "../../src/parser/index.js";
import { validate } from "../../src/validator/index.js";
import { defaultFilterRegistry } from "../../src/filters/index.js";
import { defaultRegistry } from "../../src/patterns/index.js";
import { compileToIR } from "../../src/ir/index.js";
import { compilePrompt } from "../../src/compiler/index.js";

describe("content_block_showcase example", () => {
  it("parses, validates, and compiles through the full pipeline", () => {
    const source = readFileSync("./examples/content_block_showcase.csl", "utf8");
    const ast = parse(lex(source));

    const result = validate(ast, {
      knownPatterns: defaultRegistry.toSchemaMap(),
      knownFilters: defaultFilterRegistry.toSchemaMap(),
    });
    expect(result.valid).toBe(true);

    expect(ast.contentBlocks).toHaveLength(2);
    expect(ast.contentBlocks[0].label!.value).toBe("author note");
    expect(ast.contentBlocks[0].filters).toBeNull();
    expect(ast.contentBlocks[1].label!.value).toBe("executive summary");
    expect(ast.contentBlocks[1].filters!.filters[0].filterName.name).toBe("ogilvy");

    const ir = compileToIR(ast);
    const verbatim = ir.units.find((u) => u.kind === "verbatim");
    const rewrite = ir.units.find((u) => u.kind === "rewrite");
    expect(verbatim).toBeDefined();
    expect(rewrite).toBeDefined();
    expect(rewrite!.filters).toHaveLength(1);

    const prompt = compilePrompt(ir);
    const user = prompt.sections[1].content;
    expect(user).toContain("EXACTLY as written");
    expect(user).toContain("Rewrite the following text");
  });
});
