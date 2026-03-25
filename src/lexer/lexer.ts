import type { SourceLocation } from "../ast/types.js";
import { TokenType, type Token } from "./tokens.js";

export class LexerError extends Error {
  constructor(
    message: string,
    public location: SourceLocation,
  ) {
    super(`${message} at line ${location.line}, column ${location.column}`);
    this.name = "LexerError";
  }
}

const KEYWORDS: Record<string, TokenType> = {
  article: TokenType.Article,
  use: TokenType.Use,
  constraints: TokenType.Constraints,
  filters: TokenType.Filters,
  content: TokenType.Content,
  true: TokenType.True,
  false: TokenType.False,
};

export function lex(source: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  let line = 1;
  let column = 1;

  function location(): SourceLocation {
    return { line, column, offset: pos };
  }

  function advance(): string {
    const ch = source[pos];
    pos++;
    if (ch === "\n") {
      line++;
      column = 1;
    } else {
      column++;
    }
    return ch;
  }

  function peek(): string {
    return source[pos];
  }

  function skipWhitespace(): void {
    while (pos < source.length && /\s/.test(source[pos])) {
      advance();
    }
  }

  function readString(): Token {
    const start = location();
    advance(); // skip opening quote
    let value = "";
    while (pos < source.length && peek() !== '"') {
      if (peek() === "\\") {
        advance();
        const escaped = advance();
        switch (escaped) {
          case "n": value += "\n"; break;
          case "t": value += "\t"; break;
          case "\\": value += "\\"; break;
          case '"': value += '"'; break;
          default: value += escaped; break;
        }
      } else {
        value += advance();
      }
    }
    if (pos >= source.length) {
      throw new LexerError("Unterminated string literal", start);
    }
    advance(); // skip closing quote
    return { type: TokenType.String, value, span: { start, end: location() } };
  }

  function readNumber(): Token {
    const start = location();
    let value = "";
    while (pos < source.length && /[0-9]/.test(peek())) {
      value += advance();
    }
    return { type: TokenType.Number, value, span: { start, end: location() } };
  }

  function readIdentifierOrKeyword(): Token {
    const start = location();
    let value = "";
    while (pos < source.length && /[a-zA-Z0-9_]/.test(peek())) {
      value += advance();
    }
    const type = KEYWORDS[value] ?? TokenType.Identifier;
    return { type, value, span: { start, end: location() } };
  }

  function readComment(): void {
    // Skip // and rest of line
    advance(); // first /
    advance(); // second /
    while (pos < source.length && peek() !== "\n") {
      advance();
    }
  }

  function readTextBody(): Token {
    const start = location();
    advance(); // first -
    advance(); // second -
    advance(); // third -
    // Skip the rest of the opening --- line (whitespace/newline)
    while (pos < source.length && peek() !== "\n") {
      if (!/\s/.test(peek())) {
        throw new LexerError("Unexpected content after opening ---", location());
      }
      advance();
    }
    if (pos < source.length) advance(); // skip newline

    let value = "";
    while (pos < source.length) {
      // Check for closing ---
      if (
        source[pos] === "-" &&
        pos + 1 < source.length && source[pos + 1] === "-" &&
        pos + 2 < source.length && source[pos + 2] === "-"
      ) {
        // Verify it's --- on its own (only whitespace before it on the line)
        const lineStart = value.lastIndexOf("\n");
        const lineContent = lineStart === -1 ? value : value.slice(lineStart + 1);
        if (lineContent.trim() === "") {
          // Remove trailing whitespace-only line from value
          if (lineStart !== -1) {
            value = value.slice(0, lineStart + 1);
          } else {
            value = "";
          }
          advance(); advance(); advance(); // skip ---
          // Skip rest of closing --- line
          while (pos < source.length && peek() !== "\n" && /\s/.test(peek())) {
            advance();
          }
          // Trim trailing newline from captured text
          if (value.endsWith("\n")) {
            value = value.slice(0, -1);
          }
          return { type: TokenType.TextBody, value, span: { start, end: location() } };
        }
      }
      value += advance();
    }
    throw new LexerError("Unterminated text body (missing closing ---)", start);
  }

  while (pos < source.length) {
    skipWhitespace();
    if (pos >= source.length) break;

    const ch = peek();
    const start = location();

    if (ch === "/" && pos + 1 < source.length && source[pos + 1] === "/") {
      readComment();
      continue;
    }

    if (ch === "-" && pos + 1 < source.length && source[pos + 1] === "-" &&
        pos + 2 < source.length && source[pos + 2] === "-") {
      tokens.push(readTextBody());
      continue;
    }

    switch (ch) {
      case '"':
        tokens.push(readString());
        break;
      case "{":
        advance();
        tokens.push({ type: TokenType.LeftBrace, value: "{", span: { start, end: location() } });
        break;
      case "}":
        advance();
        tokens.push({ type: TokenType.RightBrace, value: "}", span: { start, end: location() } });
        break;
      case "[":
        advance();
        tokens.push({ type: TokenType.LeftBracket, value: "[", span: { start, end: location() } });
        break;
      case "]":
        advance();
        tokens.push({ type: TokenType.RightBracket, value: "]", span: { start, end: location() } });
        break;
      case ":":
        advance();
        tokens.push({ type: TokenType.Colon, value: ":", span: { start, end: location() } });
        break;
      case ",":
        advance();
        tokens.push({ type: TokenType.Comma, value: ",", span: { start, end: location() } });
        break;
      default:
        if (/[0-9]/.test(ch)) {
          tokens.push(readNumber());
        } else if (/[a-zA-Z_]/.test(ch)) {
          tokens.push(readIdentifierOrKeyword());
        } else {
          throw new LexerError(`Unexpected character: '${ch}'`, start);
        }
    }
  }

  tokens.push({
    type: TokenType.EOF,
    value: "",
    span: { start: location(), end: location() },
  });

  return tokens;
}
