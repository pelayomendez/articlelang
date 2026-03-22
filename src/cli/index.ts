#!/usr/bin/env node

import * as fs from "node:fs";
import * as process from "node:process";
import { lex, LexerError } from "../lexer/index.js";
import { parse, ParseError } from "../parser/index.js";
import { validate } from "../validator/index.js";
import { defaultRegistry } from "../patterns/index.js";
import { compileToIR } from "../ir/index.js";
import { compilePrompt } from "../compiler/index.js";
import { renderPipeline } from "../providers/index.js";
import { lintOutput } from "../lint/index.js";

const USAGE = `Usage: csl <command> <file> [options]

Commands:
  parse     Parse a .csl file and output the AST as JSON
  validate  Validate a .csl file against language rules
  compile   Compile a .csl file to a prompt payload
  render    Render a .csl file to prose (mock provider)
  lint      Lint rendered output against constraints

Options:
  --target <type>  Output target (default: blog)
  --help           Show this help message
`;

function readFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    console.error(`Error: Cannot read file '${filePath}'`);
    return process.exit(1) as never;
  }
}

function handleError(error: unknown): never {
  if (error instanceof LexerError || error instanceof ParseError) {
    console.error(`${error.name}: ${error.message}`);
  } else if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
  } else {
    console.error("Unknown error");
  }
  return process.exit(1) as never;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help")) {
    console.log(USAGE);
    process.exit(0);
  }

  const command = args[0];
  const filePath = args[1];

  if (!filePath) {
    console.error("Error: No file specified");
    process.exit(1);
  }

  const targetIdx = args.indexOf("--target");
  const target = targetIdx !== -1 ? args[targetIdx + 1] : "blog";

  const source = readFile(filePath);

  try {
    switch (command) {
      case "parse": {
        const tokens = lex(source);
        const ast = parse(tokens);
        console.log(JSON.stringify(ast, null, 2));
        break;
      }

      case "validate": {
        const tokens = lex(source);
        const ast = parse(tokens);
        const result = validate(ast, {
          knownPatterns: defaultRegistry.toSchemaMap(),
        });

        if (result.valid) {
          console.log("Validation passed.");
        } else {
          console.error("Validation failed:");
          for (const error of result.errors) {
            const loc = error.span
              ? ` (line ${error.span.start.line}, col ${error.span.start.column})`
              : "";
            console.error(`  [${error.code}] ${error.message}${loc}`);
          }
          process.exit(1);
        }
        break;
      }

      case "compile": {
        const tokens = lex(source);
        const ast = parse(tokens);
        const ir = compileToIR(ast);
        const prompt = compilePrompt(ir, { target });
        console.log(JSON.stringify(prompt, null, 2));
        break;
      }

      case "render": {
        const result = await renderPipeline(source, { target });
        console.log(result.rendered.content);
        break;
      }

      case "lint": {
        const result = await renderPipeline(source, { target });
        const lintResult = lintOutput(result.rendered.content, result.ir.constraints);

        if (lintResult.passed && lintResult.violations.length === 0) {
          console.log("Lint passed. No violations.");
        } else {
          if (!lintResult.passed) {
            console.error("Lint failed:");
          } else {
            console.log("Lint passed with warnings:");
          }
          for (const v of lintResult.violations) {
            const prefix = v.severity === "error" ? "ERROR" : "WARN";
            console.log(`  [${prefix}] [${v.rule}] ${v.message}`);
          }
          if (!lintResult.passed) {
            process.exit(1);
          }
        }
        break;
      }

      default:
        console.error(`Unknown command: '${command}'`);
        console.log(USAGE);
        process.exit(1);
    }
  } catch (error) {
    handleError(error);
  }
}

main();
