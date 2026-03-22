# CSL V1 AST

## Overview
The Abstract Syntax Tree represents the parsed structure of a `.csl` file. Every AST node carries source location information for error reporting.

## Location
```typescript
interface SourceLocation {
  line: number;
  column: number;
  offset: number;
}

interface SourceSpan {
  start: SourceLocation;
  end: SourceLocation;
}
```

## Node Types

### ArticleNode
Root node of any CSL file.

```typescript
interface ArticleNode {
  type: "Article";
  title: StringLiteral;
  fields: FieldNode[];
  useStatements: UseStatement[];
  patternInvocations: PatternInvocation[];
  constraints: ConstraintsBlock | null;
  span: SourceSpan;
}
```

### FieldNode
A key-value pair.

```typescript
interface FieldNode {
  type: "Field";
  name: Identifier;
  value: ValueNode;
  span: SourceSpan;
}
```

### ValueNode
Union of possible value types.

```typescript
type ValueNode = StringLiteral | NumberLiteral | BooleanLiteral | Identifier | ArrayLiteral;
```

### StringLiteral
```typescript
interface StringLiteral {
  type: "StringLiteral";
  value: string;
  span: SourceSpan;
}
```

### NumberLiteral
```typescript
interface NumberLiteral {
  type: "NumberLiteral";
  value: number;
  span: SourceSpan;
}
```

### BooleanLiteral
```typescript
interface BooleanLiteral {
  type: "BooleanLiteral";
  value: boolean;
  span: SourceSpan;
}
```

### Identifier
Bare word used as field name or enum-like value.

```typescript
interface Identifier {
  type: "Identifier";
  name: string;
  span: SourceSpan;
}
```

### ArrayLiteral
```typescript
interface ArrayLiteral {
  type: "ArrayLiteral";
  elements: ValueNode[];
  span: SourceSpan;
}
```

### UseStatement
```typescript
interface UseStatement {
  type: "UseStatement";
  patternName: Identifier;
  span: SourceSpan;
}
```

### PatternInvocation
```typescript
interface PatternInvocation {
  type: "PatternInvocation";
  patternName: Identifier;
  fields: FieldNode[];
  span: SourceSpan;
}
```

### ConstraintsBlock
```typescript
interface ConstraintsBlock {
  type: "ConstraintsBlock";
  fields: FieldNode[];
  span: SourceSpan;
}
```

## AST Type Union
```typescript
type ASTNode =
  | ArticleNode
  | FieldNode
  | StringLiteral
  | NumberLiteral
  | BooleanLiteral
  | Identifier
  | ArrayLiteral
  | UseStatement
  | PatternInvocation
  | ConstraintsBlock;
```

## Design Notes
- Every node carries a `span` for error reporting and source mapping.
- The AST is a faithful representation of syntax, not semantics. Semantic analysis (e.g., "is this pattern name valid?") is handled by the validator.
- `ValueNode` is a union rather than a base class, keeping the tree data-oriented.
- Pattern invocations are separate from use statements: `use` declares intent, the invocation block configures it.
