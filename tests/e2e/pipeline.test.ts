import { describe, it, expect } from "vitest";
import { renderPipeline } from "../../src/providers/index.js";
import * as fs from "node:fs";
import * as path from "node:path";

describe("end-to-end pipeline", () => {
  it("renders a minimal article through mock provider", async () => {
    const result = await renderPipeline(`
      article "Test Article" {
        thesis: "Testing works"
        goal: inform
        tone: conversational
        audience: "Developers"

        use progressive_argument
        progressive_argument {
          points: ["Point one", "Point two"]
        }

        constraints {
          min_words: 100
        }
      }
    `);

    expect(result.ast.type).toBe("Article");
    expect(result.validation.valid).toBe(true);
    expect(result.ir.title).toBe("Test Article");
    expect(result.prompt.sections).toHaveLength(2);
    expect(result.rendered.provider).toBe("mock");
    expect(result.rendered.content).toContain("Test Article");
    expect(result.rendered.content.split(/\s+/).length).toBeGreaterThanOrEqual(50);
  });

  it("rejects invalid source", async () => {
    await expect(
      renderPipeline('article "No Thesis" { goal: inform }'),
    ).rejects.toThrow("Validation failed");
  });

  it("renders essay_ai_architecture.csl end-to-end", async () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "examples", "essay_ai_architecture.csl"),
      "utf-8",
    );
    const result = await renderPipeline(source);
    expect(result.rendered.content).toContain("AI Agents");
    expect(result.rendered.content).toContain("agent-based architecture");
    expect(result.rendered.provider).toBe("mock");
  });

  it("renders linkedin_agents.csl end-to-end", async () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "examples", "linkedin_agents.csl"),
      "utf-8",
    );
    const result = await renderPipeline(source);
    expect(result.rendered.content).toBeTruthy();
    expect(result.rendered.provider).toBe("mock");
  });

  it("renders newsletter_reverse_engineering.csl end-to-end", async () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "examples", "newsletter_reverse_engineering.csl"),
      "utf-8",
    );
    const result = await renderPipeline(source);
    expect(result.rendered.content).toBeTruthy();
    expect(result.rendered.content).toContain("rhetorical structure");
  });

  it("provider failures are explicit", async () => {
    const failProvider = {
      name: "fail",
      async render() {
        throw new Error("Provider unavailable");
      },
    };

    await expect(
      renderPipeline(
        `article "Test" {
          thesis: "X"
          use progressive_argument
          progressive_argument { points: ["A"] }
        }`,
        { provider: failProvider },
      ),
    ).rejects.toThrow("Provider unavailable");
  });
});
