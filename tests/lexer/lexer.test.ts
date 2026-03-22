import { describe, it, expect } from "vitest";
import { lex, TokenType, LexerError } from "../../src/lexer/index.js";

describe("lexer", () => {
  it("tokenizes a minimal article", () => {
    const tokens = lex('article "Test" { }');
    const types = tokens.map((t) => t.type);
    expect(types).toEqual([
      TokenType.Article,
      TokenType.String,
      TokenType.LeftBrace,
      TokenType.RightBrace,
      TokenType.EOF,
    ]);
  });

  it("tokenizes string literals", () => {
    const tokens = lex('"hello world"');
    expect(tokens[0].type).toBe(TokenType.String);
    expect(tokens[0].value).toBe("hello world");
  });

  it("tokenizes numbers", () => {
    const tokens = lex("1500");
    expect(tokens[0].type).toBe(TokenType.Number);
    expect(tokens[0].value).toBe("1500");
  });

  it("tokenizes booleans", () => {
    const tokens = lex("true false");
    expect(tokens[0].type).toBe(TokenType.True);
    expect(tokens[1].type).toBe(TokenType.False);
  });

  it("tokenizes keywords", () => {
    const tokens = lex("article use constraints");
    expect(tokens[0].type).toBe(TokenType.Article);
    expect(tokens[1].type).toBe(TokenType.Use);
    expect(tokens[2].type).toBe(TokenType.Constraints);
  });

  it("tokenizes identifiers", () => {
    const tokens = lex("foo_bar baz123");
    expect(tokens[0].type).toBe(TokenType.Identifier);
    expect(tokens[0].value).toBe("foo_bar");
    expect(tokens[1].type).toBe(TokenType.Identifier);
    expect(tokens[1].value).toBe("baz123");
  });

  it("tokenizes punctuation", () => {
    const tokens = lex("{ } [ ] : ,");
    const types = tokens.filter((t) => t.type !== TokenType.EOF).map((t) => t.type);
    expect(types).toEqual([
      TokenType.LeftBrace,
      TokenType.RightBrace,
      TokenType.LeftBracket,
      TokenType.RightBracket,
      TokenType.Colon,
      TokenType.Comma,
    ]);
  });

  it("skips comments", () => {
    const tokens = lex('// comment\narticle "Test" { }');
    expect(tokens[0].type).toBe(TokenType.Article);
  });

  it("handles escape sequences in strings", () => {
    const tokens = lex('"hello\\nworld"');
    expect(tokens[0].value).toBe("hello\nworld");
  });

  it("tracks line and column", () => {
    const tokens = lex('article\n  "Test"');
    expect(tokens[0].span.start.line).toBe(1);
    expect(tokens[0].span.start.column).toBe(1);
    expect(tokens[1].span.start.line).toBe(2);
    expect(tokens[1].span.start.column).toBe(3);
  });

  it("throws on unterminated string", () => {
    expect(() => lex('"unterminated')).toThrow(LexerError);
  });

  it("throws on unexpected character", () => {
    expect(() => lex("@")).toThrow(LexerError);
  });
});
