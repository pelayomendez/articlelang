import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import * as path from "node:path";

const CLI = path.join(process.cwd(), "dist", "cli", "index.js");
const EXAMPLES = path.join(process.cwd(), "examples");

function run(args: string): { stdout: string; exitCode: number } {
  try {
    const stdout = execSync(`node ${CLI} ${args}`, { encoding: "utf-8", timeout: 10000 });
    return { stdout, exitCode: 0 };
  } catch (error: any) {
    return { stdout: (error.stdout ?? "") + (error.stderr ?? ""), exitCode: error.status ?? 1 };
  }
}

describe("CLI", () => {
  it("shows help with no args", () => {
    const result = run("--help");
    expect(result.stdout).toContain("Usage:");
    expect(result.exitCode).toBe(0);
  });

  it("parse outputs valid JSON", () => {
    const result = run(`parse ${EXAMPLES}/essay_ai_architecture.csl`);
    expect(result.exitCode).toBe(0);
    const ast = JSON.parse(result.stdout);
    expect(ast.type).toBe("Article");
  });

  it("validate passes on valid file", () => {
    const result = run(`validate ${EXAMPLES}/essay_ai_architecture.csl`);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("passed");
  });

  it("validate fails on invalid file", () => {
    const result = run(`validate ${EXAMPLES}/invalid_missing_thesis.csl`);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("MISSING_THESIS");
  });

  it("compile outputs prompt JSON", () => {
    const result = run(`compile ${EXAMPLES}/essay_ai_architecture.csl`);
    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.sections).toHaveLength(2);
    expect(payload.target).toBe("blog");
  });

  it("compile accepts --target", () => {
    const result = run(`compile ${EXAMPLES}/essay_ai_architecture.csl --target newsletter`);
    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.target).toBe("newsletter");
  });

  it("render produces markdown output", () => {
    const result = run(`render ${EXAMPLES}/essay_ai_architecture.csl`);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("AI Agents");
  });

  it("lint runs on valid file", () => {
    const result = run(`lint ${EXAMPLES}/essay_ai_architecture.csl`);
    // May pass or have warnings, but should not crash
    expect(result.stdout).toBeTruthy();
  });

  it("returns error for unknown command", () => {
    const result = run(`foobar ${EXAMPLES}/essay_ai_architecture.csl`);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("Unknown command");
  });

  it("returns error for missing file", () => {
    const result = run("parse nonexistent.csl");
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("Cannot read file");
  });
});
