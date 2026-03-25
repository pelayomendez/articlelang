import type { Token } from "../lexer/tokens.js";
import { TokenType } from "../lexer/tokens.js";
import type {
  ArticleNode,
  FieldNode,
  UseStatement,
  PatternInvocation,
  ConstraintsBlock,
  ContentBlock,
  FilterInvocation,
  FiltersBlock,
  ValueNode,
  StringLiteral,
  NumberLiteral,
  BooleanLiteral,
  Identifier,
  ArrayLiteral,
  SourceLocation,
} from "../ast/types.js";

export class ParseError extends Error {
  constructor(
    message: string,
    public location: SourceLocation,
  ) {
    super(`${message} at line ${location.line}, column ${location.column}`);
    this.name = "ParseError";
  }
}

export function parse(tokens: Token[]): ArticleNode {
  let pos = 0;

  function current(): Token {
    return tokens[pos];
  }

  function expect(type: TokenType, context?: string): Token {
    const tok = current();
    if (tok.type !== type) {
      const ctx = context ? ` (${context})` : "";
      throw new ParseError(
        `Expected ${type} but got ${tok.type} '${tok.value}'${ctx}`,
        tok.span.start,
      );
    }
    pos++;
    return tok;
  }

  function match(type: TokenType): Token | null {
    if (current().type === type) {
      const tok = current();
      pos++;
      return tok;
    }
    return null;
  }

  function parseValue(): ValueNode {
    const tok = current();

    switch (tok.type) {
      case TokenType.String:
        pos++;
        return {
          type: "StringLiteral",
          value: tok.value,
          span: tok.span,
        } satisfies StringLiteral;

      case TokenType.Number:
        pos++;
        return {
          type: "NumberLiteral",
          value: parseInt(tok.value, 10),
          span: tok.span,
        } satisfies NumberLiteral;

      case TokenType.True:
        pos++;
        return {
          type: "BooleanLiteral",
          value: true,
          span: tok.span,
        } satisfies BooleanLiteral;

      case TokenType.False:
        pos++;
        return {
          type: "BooleanLiteral",
          value: false,
          span: tok.span,
        } satisfies BooleanLiteral;

      case TokenType.LeftBracket:
        return parseArray();

      case TokenType.Identifier:
        pos++;
        return {
          type: "Identifier",
          name: tok.value,
          span: tok.span,
        } satisfies Identifier;

      default:
        throw new ParseError(
          `Expected a value but got ${tok.type} '${tok.value}'`,
          tok.span.start,
        );
    }
  }

  function parseArray(): ArrayLiteral {
    const start = expect(TokenType.LeftBracket).span.start;
    const elements: ValueNode[] = [];

    while (current().type !== TokenType.RightBracket) {
      elements.push(parseValue());
      if (!match(TokenType.Comma)) break;
    }

    const end = expect(TokenType.RightBracket).span.end;
    return { type: "ArrayLiteral", elements, span: { start, end } };
  }

  function parseField(): FieldNode {
    const nameTok = expect(TokenType.Identifier, "field name");
    const name: Identifier = { type: "Identifier", name: nameTok.value, span: nameTok.span };
    expect(TokenType.Colon, "field separator");
    const value = parseValue();
    return {
      type: "Field",
      name,
      value,
      span: { start: nameTok.span.start, end: value.span.end },
    };
  }

  function parseConstraintsBlock(): ConstraintsBlock {
    const start = expect(TokenType.Constraints).span.start;
    expect(TokenType.LeftBrace, "constraints block");
    const fields: FieldNode[] = [];

    while (current().type !== TokenType.RightBrace) {
      fields.push(parseField());
    }

    const end = expect(TokenType.RightBrace).span.end;
    return { type: "ConstraintsBlock", fields, span: { start, end } };
  }

  function parsePatternInvocation(nameTok: Token): PatternInvocation {
    const name: Identifier = { type: "Identifier", name: nameTok.value, span: nameTok.span };
    expect(TokenType.LeftBrace, "pattern block");
    const fields: FieldNode[] = [];

    while (current().type !== TokenType.RightBrace) {
      fields.push(parseField());
    }

    const end = expect(TokenType.RightBrace).span.end;
    return {
      type: "PatternInvocation",
      patternName: name,
      fields,
      span: { start: nameTok.span.start, end },
    };
  }

  function parseFilterInvocation(): FilterInvocation {
    const nameTok = expect(TokenType.Identifier, "filter name");
    const name: Identifier = { type: "Identifier", name: nameTok.value, span: nameTok.span };
    expect(TokenType.LeftBrace, "filter block");
    const fields: FieldNode[] = [];

    while (current().type !== TokenType.RightBrace) {
      fields.push(parseField());
    }

    const end = expect(TokenType.RightBrace).span.end;
    return {
      type: "FilterInvocation",
      filterName: name,
      fields,
      span: { start: nameTok.span.start, end },
    };
  }

  function parseContentBlock(): ContentBlock {
    const start = expect(TokenType.Content).span.start;
    let label: StringLiteral | null = null;
    if (current().type === TokenType.String) {
      const labelTok = current();
      pos++;
      label = { type: "StringLiteral", value: labelTok.value, span: labelTok.span };
    }
    expect(TokenType.LeftBrace, "content block");

    let filters: FiltersBlock | null = null;
    if (current().type === TokenType.Filters) {
      filters = parseFiltersBlock();
    }

    const bodyTok = expect(TokenType.TextBody, "content body (--- delimited text)");
    const body = bodyTok.value;

    const end = expect(TokenType.RightBrace).span.end;
    return {
      type: "ContentBlock",
      label,
      body,
      filters,
      span: { start, end },
    };
  }

  function parseFiltersBlock(): FiltersBlock {
    const start = expect(TokenType.Filters).span.start;
    expect(TokenType.LeftBrace, "filters block");
    const filters: FilterInvocation[] = [];

    while (current().type !== TokenType.RightBrace) {
      filters.push(parseFilterInvocation());
    }

    const end = expect(TokenType.RightBrace).span.end;
    return { type: "FiltersBlock", filters, span: { start, end } };
  }

  function parseArticle(): ArticleNode {
    const start = expect(TokenType.Article).span.start;
    const titleTok = expect(TokenType.String, "article title");
    const title: StringLiteral = { type: "StringLiteral", value: titleTok.value, span: titleTok.span };

    expect(TokenType.LeftBrace, "article body");

    const fields: FieldNode[] = [];
    const useStatements: UseStatement[] = [];
    const patternInvocations: PatternInvocation[] = [];
    const contentBlocks: ContentBlock[] = [];
    let constraints: ConstraintsBlock | null = null;
    let filters: FiltersBlock | null = null;

    while (current().type !== TokenType.RightBrace) {
      const tok = current();

      if (tok.type === TokenType.Content) {
        contentBlocks.push(parseContentBlock());
      } else if (tok.type === TokenType.Filters) {
        if (filters !== null) {
          throw new ParseError("Duplicate filters block", tok.span.start);
        }
        filters = parseFiltersBlock();
      } else if (tok.type === TokenType.Use) {
        const useStart = tok.span.start;
        pos++;
        const patternTok = expect(TokenType.Identifier, "pattern name");
        const patternName: Identifier = { type: "Identifier", name: patternTok.value, span: patternTok.span };
        useStatements.push({
          type: "UseStatement",
          patternName,
          span: { start: useStart, end: patternTok.span.end },
        });
      } else if (tok.type === TokenType.Constraints) {
        if (constraints !== null) {
          throw new ParseError("Duplicate constraints block", tok.span.start);
        }
        constraints = parseConstraintsBlock();
      } else if (tok.type === TokenType.Identifier) {
        // Could be a field (identifier: value) or a pattern invocation (identifier { ... })
        const next = tokens[pos + 1];
        if (next && next.type === TokenType.LeftBrace) {
          pos++;
          patternInvocations.push(parsePatternInvocation(tok));
        } else if (next && next.type === TokenType.Colon) {
          fields.push(parseField());
        } else {
          throw new ParseError(
            `Expected ':' or '{' after identifier '${tok.value}'`,
            tok.span.start,
          );
        }
      } else {
        throw new ParseError(
          `Unexpected token ${tok.type} '${tok.value}' in article body`,
          tok.span.start,
        );
      }
    }

    const end = expect(TokenType.RightBrace).span.end;

    return {
      type: "Article",
      title,
      fields,
      useStatements,
      patternInvocations,
      contentBlocks,
      constraints,
      filters,
      span: { start, end },
    };
  }

  const article = parseArticle();
  expect(TokenType.EOF, "end of file");
  return article;
}
