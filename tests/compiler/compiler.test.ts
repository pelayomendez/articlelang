import { describe, it, expect } from "vitest";
import { lex } from "../../src/lexer/index.js";
import { parse } from "../../src/parser/index.js";
import { compileToIR } from "../../src/ir/index.js";
import { compilePrompt } from "../../src/compiler/index.js";
import * as fs from "node:fs";
import * as path from "node:path";

function promptFromCSL(source: string, target?: string) {
  const ast = parse(lex(source));
  const ir = compileToIR(ast);
  return compilePrompt(ir, { target });
}

describe("prompt compiler", () => {
  it("produces a prompt payload with system and user sections", () => {
    const payload = promptFromCSL(`
      article "Test" {
        thesis: "A thesis"
        goal: persuade
        tone: provocative
        audience: "Engineers"
      }
    `);
    expect(payload.sections).toHaveLength(2);
    expect(payload.sections[0].role).toBe("system");
    expect(payload.sections[1].role).toBe("user");
  });

  it("includes goal in system prompt", () => {
    const payload = promptFromCSL(`
      article "Test" {
        thesis: "X"
        goal: persuade
      }
    `);
    expect(payload.sections[0].content).toContain("persuade");
  });

  it("includes audience in system prompt", () => {
    const payload = promptFromCSL(`
      article "Test" {
        thesis: "X"
        audience: "Senior engineers"
      }
    `);
    expect(payload.sections[0].content).toContain("Senior engineers");
  });

  it("includes tone in system prompt", () => {
    const payload = promptFromCSL(`
      article "Test" {
        thesis: "X"
        tone: analytical
      }
    `);
    expect(payload.sections[0].content).toContain("analytical");
  });

  it("includes constraints in system prompt", () => {
    const payload = promptFromCSL(`
      article "Test" {
        thesis: "X"
        constraints {
          min_words: 1000
          max_words: 2000
          no_lists: true
          banned_phrases: ["in conclusion"]
          required_phrases: ["key insight"]
          paragraph_min_sentences: 3
        }
      }
    `);
    const sys = payload.sections[0].content;
    expect(sys).toContain("1000");
    expect(sys).toContain("2000");
    expect(sys).toContain("bullet points");
    expect(sys).toContain("in conclusion");
    expect(sys).toContain("key insight");
    expect(sys).toContain("3 sentences");
  });

  it("includes title and thesis in user prompt", () => {
    const payload = promptFromCSL(`
      article "My Title" {
        thesis: "My thesis"
      }
    `);
    expect(payload.sections[1].content).toContain("My Title");
    expect(payload.sections[1].content).toContain("My thesis");
  });

  it("includes narrative structure in user prompt", () => {
    const payload = promptFromCSL(`
      article "Test" {
        thesis: "X"
        use contrarian_intro
        contrarian_intro {
          claim: "Old"
          reframe: "New"
        }
      }
    `);
    const user = payload.sections[1].content;
    expect(user).toContain("Argue");
    expect(user).toContain("Transition");
    expect(user).toContain("Old");
    expect(user).toContain("New");
  });

  it("uses default target 'blog'", () => {
    const payload = promptFromCSL('article "Test" { thesis: "X" }');
    expect(payload.target).toBe("blog");
  });

  it("accepts custom target", () => {
    const payload = promptFromCSL('article "Test" { thesis: "X" }', "newsletter");
    expect(payload.target).toBe("newsletter");
    expect(payload.sections[0].content).toContain("newsletter");
  });

  it("metadata reflects article properties", () => {
    const payload = promptFromCSL(`
      article "Test" {
        thesis: "X"
        goal: inform
        tone: conversational
        audience: "Readers"
        constraints { min_words: 500 max_words: 1000 }
      }
    `);
    expect(payload.metadata.title).toBe("Test");
    expect(payload.metadata.goal).toBe("inform");
    expect(payload.metadata.tone).toBe("conversational");
    expect(payload.metadata.audience).toBe("Readers");
    expect(payload.metadata.wordRange).toEqual({ min: 500, max: 1000 });
  });

  it("is deterministic", () => {
    const source = `
      article "Test" {
        thesis: "X"
        use progressive_argument
        progressive_argument { points: ["A", "B"] }
        constraints { min_words: 100 }
      }
    `;
    const p1 = promptFromCSL(source);
    const p2 = promptFromCSL(source);
    expect(JSON.stringify(p1)).toBe(JSON.stringify(p2));
  });
});

describe("prompt compiler - fixtures", () => {
  const examplesDir = path.join(process.cwd(), "examples");

  it("compiles essay_ai_architecture.csl to prompt", () => {
    const source = fs.readFileSync(path.join(examplesDir, "essay_ai_architecture.csl"), "utf-8");
    const payload = promptFromCSL(source);
    expect(payload.sections).toHaveLength(2);
    expect(payload.metadata.title).toContain("AI Agents");
    expect(payload.sections[0].content).toContain("agent-based architecture");
  });
});
