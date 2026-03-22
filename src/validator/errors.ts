import type { SourceSpan } from "../ast/types.js";

export interface ValidationError {
  code: string;
  message: string;
  span: SourceSpan | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validationError(
  code: string,
  message: string,
  span: SourceSpan | null = null,
): ValidationError {
  return { code, message, span };
}
