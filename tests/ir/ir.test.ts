import { describe, it, expect } from "vitest";
import { lex } from "../../src/lexer/index.js";
import { parse } from "../../src/parser/index.js";
import { compileToIR } from "../../src/ir/index.js";
import * as fs from "node:fs";
import * as path from "node:path";

function compileCSL(source: string) {
  return compileToIR(parse(lex(source)));
}

describe("IR compiler", () => {
  it("compiles a minimal article", () => {
    const ir = compileCSL(`
      article "Test" {
        thesis: "A thesis"
        goal: persuade
      }
    `);
    expect(ir.title).toBe("Test");
    expect(ir.thesis).toBe("A thesis");
    expect(ir.goal).toBe("persuade");
    expect(ir.units).toHaveLength(0);
  });

  it("expands contrarian_intro pattern", () => {
    const ir = compileCSL(`
      article "Test" {
        thesis: "X"
        use contrarian_intro
        contrarian_intro {
          claim: "Old way"
          reframe: "New way"
        }
      }
    `);
    expect(ir.units).toHaveLength(3);
    expect(ir.units[0].kind).toBe("claim");
    expect(ir.units[0].content).toBe("Old way");
    expect(ir.units[1].kind).toBe("transition");
    expect(ir.units[1].transitionStyle).toBe("reversal");
    expect(ir.units[2].kind).toBe("claim");
    expect(ir.units[2].content).toBe("New way");
  });

  it("expands progressive_argument pattern", () => {
    const ir = compileCSL(`
      article "Test" {
        thesis: "X"
        use progressive_argument
        progressive_argument {
          points: ["A", "B", "C"]
        }
      }
    `);
    expect(ir.units).toHaveLength(3);
    expect(ir.units.every((u) => u.kind === "support")).toBe(true);
    expect(ir.units[0].content).toBe("A");
    expect(ir.units[2].content).toBe("C");
  });

  it("expands concrete_example pattern", () => {
    const ir = compileCSL(`
      article "Test" {
        thesis: "X"
        use concrete_example
        concrete_example {
          scenario: "DB migration"
          before: "Old system"
          after: "New system"
        }
      }
    `);
    expect(ir.units).toHaveLength(4);
    expect(ir.units[0].kind).toBe("context");
    expect(ir.units[1].kind).toBe("support");
    expect(ir.units[2].kind).toBe("transition");
    expect(ir.units[3].kind).toBe("support");
  });

  it("expands reframe_conclusion pattern", () => {
    const ir = compileCSL(`
      article "Test" {
        thesis: "X"
        use reframe_conclusion
        reframe_conclusion {
          callback: "Earlier point"
          reframe: "New perspective"
        }
      }
    `);
    expect(ir.units).toHaveLength(2);
    expect(ir.units[0].kind).toBe("transition");
    expect(ir.units[0].transitionStyle).toBe("callback");
    expect(ir.units[1].kind).toBe("conclusion");
  });

  it("expands open_ending pattern", () => {
    const ir = compileCSL(`
      article "Test" {
        thesis: "X"
        use open_ending
        open_ending {
          question: "What if?"
        }
      }
    `);
    expect(ir.units).toHaveLength(1);
    expect(ir.units[0].kind).toBe("conclusion");
    expect(ir.units[0].content).toBe("What if?");
  });

  it("compiles constraints", () => {
    const ir = compileCSL(`
      article "Test" {
        thesis: "X"
        constraints {
          min_words: 1000
          max_words: 2000
          no_lists: true
          banned_phrases: ["foo"]
          required_phrases: ["bar"]
          paragraph_min_sentences: 3
        }
      }
    `);
    expect(ir.constraints.minWords).toBe(1000);
    expect(ir.constraints.maxWords).toBe(2000);
    expect(ir.constraints.noLists).toBe(true);
    expect(ir.constraints.bannedPhrases).toEqual(["foo"]);
    expect(ir.constraints.requiredPhrases).toEqual(["bar"]);
    expect(ir.constraints.paragraphMinSentences).toBe(3);
  });

  it("compiles audience and tone", () => {
    const ir = compileCSL(`
      article "Test" {
        thesis: "X"
        audience: "Engineers"
        tone: analytical
      }
    `);
    expect(ir.audience?.description).toBe("Engineers");
    expect(ir.tone?.tone).toBe("analytical");
  });

  it("is deterministic — same input yields same output", () => {
    const source = `
      article "Test" {
        thesis: "X"
        use contrarian_intro
        use progressive_argument
        contrarian_intro {
          claim: "A"
          reframe: "B"
        }
        progressive_argument {
          points: ["C", "D"]
        }
      }
    `;
    const ir1 = compileCSL(source);
    const ir2 = compileCSL(source);
    expect(JSON.stringify(ir1)).toBe(JSON.stringify(ir2));
  });
});

describe("IR compiler - fixtures", () => {
  const examplesDir = path.join(process.cwd(), "examples");

  it("compiles essay_ai_architecture.csl to IR", () => {
    const source = fs.readFileSync(path.join(examplesDir, "essay_ai_architecture.csl"), "utf-8");
    const ir = compileCSL(source);
    expect(ir.title).toBe("Why AI Agents Will Replace Microservices");
    expect(ir.units.length).toBeGreaterThan(0);
    expect(ir.constraints.minWords).toBe(1500);
    expect(ir.constraints.requiredPhrases).toContain("agent-based architecture");
  });

  it("compiles linkedin_agents.csl to IR", () => {
    const source = fs.readFileSync(path.join(examplesDir, "linkedin_agents.csl"), "utf-8");
    const ir = compileCSL(source);
    expect(ir.title).toContain("AI Wrappers");
    expect(ir.units.length).toBeGreaterThan(0);
  });

  it("compiles newsletter_reverse_engineering.csl to IR", () => {
    const source = fs.readFileSync(path.join(examplesDir, "newsletter_reverse_engineering.csl"), "utf-8");
    const ir = compileCSL(source);
    expect(ir.goal).toBe("explain");
    expect(ir.units.length).toBeGreaterThan(0);
  });
});
