import type { ArticleNode, FieldNode, ValueNode } from "../ast/types.js";
import type { PatternDefinition } from "../patterns/registry.js";
import { PatternRegistry, defaultRegistry } from "../patterns/registry.js";
import { FilterRegistry, defaultFilterRegistry } from "../filters/registry.js";
import type { NarrativeIR, NarrativeUnit, OutputConstraints, StyleFilter, TransitionStyle } from "./types.js";

export class IRCompilationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IRCompilationError";
  }
}

export interface IRCompilerOptions {
  registry?: PatternRegistry;
  filterRegistry?: FilterRegistry;
}

export function compileToIR(
  ast: ArticleNode,
  options: IRCompilerOptions = {},
): NarrativeIR {
  const registry = options.registry ?? defaultRegistry;
  const filterReg = options.filterRegistry ?? defaultFilterRegistry;

  const title = ast.title.value;
  const thesis = getStringField(ast.fields, "thesis") ?? "";
  const goal = getIdentifierField(ast.fields, "goal");
  const audienceStr = getStringField(ast.fields, "audience");
  const toneStr = getIdentifierField(ast.fields, "tone");
  const voice = getStringField(ast.fields, "voice");

  const units: NarrativeUnit[] = [];

  // Expand each pattern invocation into narrative units
  for (const invocation of ast.patternInvocations) {
    const patternName = invocation.patternName.name;
    const pattern = registry.get(patternName);
    if (!pattern) {
      throw new IRCompilationError(`Unknown pattern '${patternName}'`);
    }

    const expanded = expandPattern(pattern, invocation.fields);
    units.push(...expanded);
  }

  const constraints = compileConstraints(ast);
  const filters = compileFilters(ast, filterReg);

  return {
    title,
    thesis,
    goal,
    audience: audienceStr ? { description: audienceStr } : null,
    tone: toneStr
      ? { tone: toneStr, instructions: registry.get(toneStr)?.promptHints ?? [] }
      : null,
    voice,
    units,
    constraints,
    filters,
  };
}

function expandPattern(
  pattern: PatternDefinition,
  fields: FieldNode[],
): NarrativeUnit[] {
  const fieldMap = new Map<string, ValueNode>();
  for (const f of fields) {
    fieldMap.set(f.name.name, f.value);
  }

  switch (pattern.name) {
    case "contrarian_intro":
      return [
        unit("claim", extractString(fieldMap, "claim"), "conventional wisdom", pattern.name),
        unit("transition", "", "reversal pivot", pattern.name, "reversal"),
        unit("claim", extractString(fieldMap, "reframe"), "reframed thesis", pattern.name),
      ];

    case "progressive_argument":
      return extractArray(fieldMap, "points").map((point, i) =>
        unit("support", point, `argument point ${i + 1}`, pattern.name),
      );

    case "concrete_example":
      return [
        unit("context", extractString(fieldMap, "scenario"), "example scenario", pattern.name),
        unit("support", extractString(fieldMap, "before"), "before state", pattern.name),
        unit("transition", "", "transformation", pattern.name, "transformation"),
        unit("support", extractString(fieldMap, "after"), "after state", pattern.name),
      ];

    case "counterpoint_rebuttal":
      return [
        unit("claim", extractString(fieldMap, "counterpoint"), "opposing view", pattern.name),
        unit("transition", "", "concession and pivot", pattern.name, "concession"),
        unit("claim", extractString(fieldMap, "rebuttal"), "rebuttal", pattern.name),
      ];

    case "analogy_bridge":
      return [
        unit("support", extractString(fieldMap, "source"), "familiar domain", pattern.name),
        unit("transition", "", "analogy mapping", pattern.name, "mapping"),
        unit("support", extractString(fieldMap, "target"), "target domain", pattern.name),
        unit("claim", extractString(fieldMap, "insight"), "emergent insight", pattern.name),
      ];

    case "reframe_conclusion":
      return [
        unit("transition", extractString(fieldMap, "callback"), "callback", pattern.name, "callback"),
        unit("conclusion", extractString(fieldMap, "reframe"), "reframed conclusion", pattern.name),
      ];

    case "open_ending":
      return [
        unit("conclusion", extractString(fieldMap, "question"), "open question", pattern.name),
      ];

    default:
      throw new IRCompilationError(`No IR expansion defined for pattern '${pattern.name}'`);
  }
}

function unit(
  kind: NarrativeUnit["kind"],
  content: string,
  role: string,
  sourcePattern: string | null,
  transitionStyle?: TransitionStyle,
): NarrativeUnit {
  return { kind, content, role, sourcePattern, transitionStyle };
}

function extractString(fieldMap: Map<string, ValueNode>, key: string): string {
  const val = fieldMap.get(key);
  if (!val) return "";
  if (val.type === "StringLiteral") return val.value;
  if (val.type === "Identifier") return val.name;
  return "";
}

function extractArray(fieldMap: Map<string, ValueNode>, key: string): string[] {
  const val = fieldMap.get(key);
  if (!val || val.type !== "ArrayLiteral") return [];
  return val.elements
    .filter((e) => e.type === "StringLiteral")
    .map((e) => (e as { value: string }).value);
}

function getStringField(fields: FieldNode[], name: string): string | null {
  const field = fields.find((f) => f.name.name === name);
  if (!field || field.value.type !== "StringLiteral") return null;
  return field.value.value;
}

function getIdentifierField(fields: FieldNode[], name: string): string | null {
  const field = fields.find((f) => f.name.name === name);
  if (!field || field.value.type !== "Identifier") return null;
  return field.value.name;
}

function compileConstraints(ast: ArticleNode): OutputConstraints {
  const result: OutputConstraints = {
    bannedPhrases: [],
    requiredPhrases: [],
  };

  if (!ast.constraints) return result;

  for (const field of ast.constraints.fields) {
    const name = field.name.name;
    const value = field.value;

    switch (name) {
      case "min_words":
        if (value.type === "NumberLiteral") result.minWords = value.value;
        break;
      case "max_words":
        if (value.type === "NumberLiteral") result.maxWords = value.value;
        break;
      case "no_lists":
        if (value.type === "BooleanLiteral") result.noLists = value.value;
        break;
      case "banned_phrases":
        if (value.type === "ArrayLiteral") {
          result.bannedPhrases = value.elements
            .filter((e) => e.type === "StringLiteral")
            .map((e) => (e as { value: string }).value);
        }
        break;
      case "required_phrases":
        if (value.type === "ArrayLiteral") {
          result.requiredPhrases = value.elements
            .filter((e) => e.type === "StringLiteral")
            .map((e) => (e as { value: string }).value);
        }
        break;
      case "paragraph_min_sentences":
        if (value.type === "NumberLiteral") result.paragraphMinSentences = value.value;
        break;
    }
  }

  return result;
}

function compileFilters(ast: ArticleNode, filterReg: FilterRegistry): StyleFilter[] {
  if (!ast.filters) return [];

  return ast.filters.filters.map((inv) => {
    const name = inv.filterName.name;
    const def = filterReg.get(name);
    const config: Record<string, string> = {};
    for (const field of inv.fields) {
      if (field.value.type === "Identifier") {
        config[field.name.name] = field.value.name;
      } else if (field.value.type === "StringLiteral") {
        config[field.name.name] = field.value.value;
      }
    }
    return {
      name,
      directives: def?.directives ?? [],
      config,
    };
  });
}
