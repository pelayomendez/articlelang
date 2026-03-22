import { describe, it, expect } from "vitest";
import { PatternRegistry, defaultRegistry } from "../../src/patterns/index.js";

describe("pattern registry", () => {
  it("has all 7 built-in patterns", () => {
    expect(defaultRegistry.names()).toHaveLength(7);
  });

  const expectedPatterns = [
    "contrarian_intro",
    "progressive_argument",
    "concrete_example",
    "counterpoint_rebuttal",
    "analogy_bridge",
    "reframe_conclusion",
    "open_ending",
  ];

  for (const name of expectedPatterns) {
    it(`has pattern '${name}'`, () => {
      expect(defaultRegistry.has(name)).toBe(true);
      const pattern = defaultRegistry.get(name)!;
      expect(pattern.name).toBe(name);
      expect(pattern.description).toBeTruthy();
      expect(pattern.requiredFields.length).toBeGreaterThan(0);
      expect(pattern.irExpansion).toBeTruthy();
    });
  }

  it("returns undefined for unknown patterns", () => {
    expect(defaultRegistry.get("nonexistent")).toBeUndefined();
    expect(defaultRegistry.has("nonexistent")).toBe(false);
  });

  it("produces a schema map compatible with the validator", () => {
    const schemaMap = defaultRegistry.toSchemaMap();
    expect(schemaMap.size).toBe(7);
    for (const [name, schema] of schemaMap) {
      expect(schema.name).toBe(name);
      expect(Array.isArray(schema.requiredFields)).toBe(true);
      expect(Array.isArray(schema.optionalFields)).toBe(true);
    }
  });

  it("each pattern has prompt hints", () => {
    for (const pattern of defaultRegistry.all()) {
      expect(pattern.promptHints).toBeDefined();
      expect(pattern.promptHints!.length).toBeGreaterThan(0);
    }
  });
});
