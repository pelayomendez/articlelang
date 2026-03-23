export interface SourceLocation {
  line: number;
  column: number;
  offset: number;
}

export interface SourceSpan {
  start: SourceLocation;
  end: SourceLocation;
}

export interface StringLiteral {
  type: "StringLiteral";
  value: string;
  span: SourceSpan;
}

export interface NumberLiteral {
  type: "NumberLiteral";
  value: number;
  span: SourceSpan;
}

export interface BooleanLiteral {
  type: "BooleanLiteral";
  value: boolean;
  span: SourceSpan;
}

export interface Identifier {
  type: "Identifier";
  name: string;
  span: SourceSpan;
}

export interface ArrayLiteral {
  type: "ArrayLiteral";
  elements: ValueNode[];
  span: SourceSpan;
}

export type ValueNode =
  | StringLiteral
  | NumberLiteral
  | BooleanLiteral
  | Identifier
  | ArrayLiteral;

export interface FieldNode {
  type: "Field";
  name: Identifier;
  value: ValueNode;
  span: SourceSpan;
}

export interface UseStatement {
  type: "UseStatement";
  patternName: Identifier;
  span: SourceSpan;
}

export interface PatternInvocation {
  type: "PatternInvocation";
  patternName: Identifier;
  fields: FieldNode[];
  span: SourceSpan;
}

export interface ConstraintsBlock {
  type: "ConstraintsBlock";
  fields: FieldNode[];
  span: SourceSpan;
}

export interface FilterInvocation {
  type: "FilterInvocation";
  filterName: Identifier;
  fields: FieldNode[];
  span: SourceSpan;
}

export interface FiltersBlock {
  type: "FiltersBlock";
  filters: FilterInvocation[];
  span: SourceSpan;
}

export interface ArticleNode {
  type: "Article";
  title: StringLiteral;
  fields: FieldNode[];
  useStatements: UseStatement[];
  patternInvocations: PatternInvocation[];
  constraints: ConstraintsBlock | null;
  filters: FiltersBlock | null;
  span: SourceSpan;
}

export type ASTNode =
  | ArticleNode
  | FieldNode
  | StringLiteral
  | NumberLiteral
  | BooleanLiteral
  | Identifier
  | ArrayLiteral
  | UseStatement
  | PatternInvocation
  | ConstraintsBlock
  | FilterInvocation
  | FiltersBlock;
