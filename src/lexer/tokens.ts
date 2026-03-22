import type { SourceSpan } from "../ast/types.js";

export enum TokenType {
  // Keywords
  Article = "Article",
  Use = "Use",
  Constraints = "Constraints",
  True = "True",
  False = "False",

  // Literals
  String = "String",
  Number = "Number",
  Identifier = "Identifier",

  // Punctuation
  LeftBrace = "LeftBrace",
  RightBrace = "RightBrace",
  LeftBracket = "LeftBracket",
  RightBracket = "RightBracket",
  Colon = "Colon",
  Comma = "Comma",

  // Special
  Comment = "Comment",
  EOF = "EOF",
}

export interface Token {
  type: TokenType;
  value: string;
  span: SourceSpan;
}
