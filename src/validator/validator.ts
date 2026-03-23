import type { ArticleNode, FieldNode, ValueNode } from "../ast/types.js";
import type { ValidationResult, ValidationError } from "./errors.js";
import { validationError } from "./errors.js";

const VALID_GOALS = ["persuade", "inform", "entertain", "explain"];
const VALID_TONES = ["authoritative", "conversational", "provocative", "analytical", "witty"];

const KNOWN_ARTICLE_FIELDS = ["thesis", "goal", "audience", "tone", "voice"];

const KNOWN_CONSTRAINT_KEYS = [
  "min_words",
  "max_words",
  "no_lists",
  "banned_phrases",
  "required_phrases",
  "paragraph_min_sentences",
];

export interface PatternSchema {
  name: string;
  requiredFields: string[];
  optionalFields: string[];
}

interface FilterSchema {
  name: string;
  optionalFields: string[];
}

export interface ValidatorOptions {
  knownPatterns?: Map<string, PatternSchema>;
  knownFilters?: Map<string, FilterSchema>;
}

export function validate(
  ast: ArticleNode,
  options: ValidatorOptions = {},
): ValidationResult {
  const errors: ValidationError[] = [];
  const knownPatterns = options.knownPatterns ?? new Map<string, PatternSchema>();
  const knownFilters = options.knownFilters ?? new Map<string, FilterSchema>();

  // Required fields
  const thesisField = ast.fields.find((f) => f.name.name === "thesis");
  if (!thesisField) {
    errors.push(validationError("MISSING_THESIS", "Article must have a thesis field", ast.span));
  } else if (thesisField.value.type === "StringLiteral" && thesisField.value.value.trim() === "") {
    errors.push(
      validationError("EMPTY_THESIS", "Thesis cannot be empty", thesisField.value.span),
    );
  }

  // Validate known article fields
  for (const field of ast.fields) {
    if (!KNOWN_ARTICLE_FIELDS.includes(field.name.name)) {
      errors.push(
        validationError(
          "UNKNOWN_FIELD",
          `Unknown article field '${field.name.name}'`,
          field.name.span,
        ),
      );
    }
  }

  // Validate goal enum
  const goalField = ast.fields.find((f) => f.name.name === "goal");
  if (goalField) {
    if (goalField.value.type === "Identifier") {
      if (!VALID_GOALS.includes(goalField.value.name)) {
        errors.push(
          validationError(
            "INVALID_GOAL",
            `Invalid goal '${goalField.value.name}'. Valid goals: ${VALID_GOALS.join(", ")}`,
            goalField.value.span,
          ),
        );
      }
    } else {
      errors.push(
        validationError(
          "INVALID_GOAL_TYPE",
          "Goal must be an identifier (one of: " + VALID_GOALS.join(", ") + ")",
          goalField.value.span,
        ),
      );
    }
  }

  // Validate tone enum
  const toneField = ast.fields.find((f) => f.name.name === "tone");
  if (toneField) {
    if (toneField.value.type === "Identifier") {
      if (!VALID_TONES.includes(toneField.value.name)) {
        errors.push(
          validationError(
            "INVALID_TONE",
            `Invalid tone '${toneField.value.name}'. Valid tones: ${VALID_TONES.join(", ")}`,
            toneField.value.span,
          ),
        );
      }
    } else {
      errors.push(
        validationError(
          "INVALID_TONE_TYPE",
          "Tone must be an identifier (one of: " + VALID_TONES.join(", ") + ")",
          toneField.value.span,
        ),
      );
    }
  }

  // Validate string fields are strings
  for (const fieldName of ["thesis", "audience", "voice"]) {
    const field = ast.fields.find((f) => f.name.name === fieldName);
    if (field && field.value.type !== "StringLiteral") {
      errors.push(
        validationError(
          "INVALID_TYPE",
          `Field '${fieldName}' must be a string`,
          field.value.span,
        ),
      );
    }
  }

  // Duplicate field check
  const fieldNames = ast.fields.map((f) => f.name.name);
  const seen = new Set<string>();
  for (const name of fieldNames) {
    if (seen.has(name)) {
      const field = ast.fields.find((f) => f.name.name === name)!;
      errors.push(
        validationError("DUPLICATE_FIELD", `Duplicate field '${name}'`, field.name.span),
      );
    }
    seen.add(name);
  }

  // Validate use statements — check pattern names against registry
  const usedPatterns = new Set<string>();
  for (const use of ast.useStatements) {
    const name = use.patternName.name;
    if (usedPatterns.has(name)) {
      errors.push(
        validationError("DUPLICATE_USE", `Duplicate use statement for '${name}'`, use.span),
      );
    }
    usedPatterns.add(name);

    if (knownPatterns.size > 0 && !knownPatterns.has(name)) {
      errors.push(
        validationError(
          "UNKNOWN_PATTERN",
          `Unknown pattern '${name}'`,
          use.patternName.span,
        ),
      );
    }
  }

  // Validate pattern invocations
  const invokedPatterns = new Set<string>();
  for (const invocation of ast.patternInvocations) {
    const name = invocation.patternName.name;

    if (invokedPatterns.has(name)) {
      errors.push(
        validationError(
          "DUPLICATE_INVOCATION",
          `Duplicate invocation of pattern '${name}'`,
          invocation.patternName.span,
        ),
      );
    }
    invokedPatterns.add(name);

    // Must be declared with use
    if (!usedPatterns.has(name)) {
      errors.push(
        validationError(
          "UNDECLARED_PATTERN",
          `Pattern '${name}' is invoked but not declared with 'use'`,
          invocation.patternName.span,
        ),
      );
    }

    // Validate against pattern schema
    const schema = knownPatterns.get(name);
    if (schema) {
      const providedFields = new Set(invocation.fields.map((f) => f.name.name));
      const allKnown = new Set([...schema.requiredFields, ...schema.optionalFields]);

      for (const required of schema.requiredFields) {
        if (!providedFields.has(required)) {
          errors.push(
            validationError(
              "MISSING_PATTERN_FIELD",
              `Pattern '${name}' requires field '${required}'`,
              invocation.span,
            ),
          );
        }
      }

      for (const field of invocation.fields) {
        if (!allKnown.has(field.name.name)) {
          errors.push(
            validationError(
              "UNKNOWN_PATTERN_FIELD",
              `Unknown field '${field.name.name}' in pattern '${name}'`,
              field.name.span,
            ),
          );
        }
      }
    }
  }

  // Validate constraints
  if (ast.constraints) {
    for (const field of ast.constraints.fields) {
      if (!KNOWN_CONSTRAINT_KEYS.includes(field.name.name)) {
        errors.push(
          validationError(
            "UNKNOWN_CONSTRAINT",
            `Unknown constraint '${field.name.name}'`,
            field.name.span,
          ),
        );
      }
    }

    validateConstraintTypes(ast.constraints.fields, errors);
  }

  // Validate filters
  if (ast.filters) {
    const usedFilters = new Set<string>();
    for (const filter of ast.filters.filters) {
      const name = filter.filterName.name;

      if (usedFilters.has(name)) {
        errors.push(
          validationError("DUPLICATE_FILTER", `Duplicate filter '${name}'`, filter.filterName.span),
        );
      }
      usedFilters.add(name);

      if (knownFilters.size > 0 && !knownFilters.has(name)) {
        errors.push(
          validationError("UNKNOWN_FILTER", `Unknown filter '${name}'`, filter.filterName.span),
        );
      }

      const schema = knownFilters.get(name);
      if (schema) {
        for (const field of filter.fields) {
          if (!schema.optionalFields.includes(field.name.name)) {
            errors.push(
              validationError(
                "UNKNOWN_FILTER_FIELD",
                `Unknown field '${field.name.name}' in filter '${name}'`,
                field.name.span,
              ),
            );
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateConstraintTypes(fields: FieldNode[], errors: ValidationError[]): void {
  const numberConstraints = ["min_words", "max_words", "paragraph_min_sentences"];
  const booleanConstraints = ["no_lists"];
  const arrayConstraints = ["banned_phrases", "required_phrases"];

  for (const field of fields) {
    const name = field.name.name;
    const value = field.value;

    if (numberConstraints.includes(name) && value.type !== "NumberLiteral") {
      errors.push(
        validationError(
          "INVALID_CONSTRAINT_TYPE",
          `Constraint '${name}' must be a number`,
          value.span,
        ),
      );
    }

    if (booleanConstraints.includes(name) && value.type !== "BooleanLiteral") {
      errors.push(
        validationError(
          "INVALID_CONSTRAINT_TYPE",
          `Constraint '${name}' must be a boolean`,
          value.span,
        ),
      );
    }

    if (arrayConstraints.includes(name)) {
      if (value.type !== "ArrayLiteral") {
        errors.push(
          validationError(
            "INVALID_CONSTRAINT_TYPE",
            `Constraint '${name}' must be an array`,
            value.span,
          ),
        );
      } else {
        for (const el of value.elements) {
          if (el.type !== "StringLiteral") {
            errors.push(
              validationError(
                "INVALID_CONSTRAINT_TYPE",
                `Elements of '${name}' must be strings`,
                el.span,
              ),
            );
          }
        }
      }
    }
  }
}
