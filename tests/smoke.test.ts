import { describe, it, expect } from "vitest";
import type { ArticleNode } from "../src/ast/types.js";

describe("smoke test", () => {
  it("AST types are importable and structurally correct", () => {
    const node: ArticleNode = {
      type: "Article",
      title: {
        type: "StringLiteral",
        value: "Test",
        span: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 5, offset: 4 } },
      },
      fields: [],
      useStatements: [],
      patternInvocations: [],
      contentBlocks: [],
      constraints: null,
      span: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 5, offset: 4 } },
    };

    expect(node.type).toBe("Article");
    expect(node.title.value).toBe("Test");
    expect(node.fields).toEqual([]);
    expect(node.constraints).toBeNull();
  });
});
