import type {
  ArticleNode,
  FieldNode,
  ValueNode,
} from "../ast/types.js";

export function serialize(ast: ArticleNode): string {
  const lines: string[] = [];

  lines.push(`article "${escapeString(ast.title.value)}" {`);

  // Article-level fields
  for (const field of ast.fields) {
    lines.push(`  ${field.name.name}: ${serializeValue(field.value)}`);
  }

  // Use statements
  if (ast.useStatements.length > 0) {
    lines.push("");
    for (const use of ast.useStatements) {
      lines.push(`  use ${use.patternName.name}`);
    }
  }

  // Pattern invocations
  if (ast.patternInvocations.length > 0) {
    lines.push("");
    for (const pattern of ast.patternInvocations) {
      lines.push(`  ${pattern.patternName.name} {`);
      for (const field of pattern.fields) {
        lines.push(`    ${field.name.name}: ${serializeValue(field.value)}`);
      }
      lines.push("  }");
    }
  }

  // Filters
  if (ast.filters && ast.filters.filters.length > 0) {
    lines.push("");
    lines.push("  filters {");
    for (const filter of ast.filters.filters) {
      if (filter.fields.length === 0) {
        lines.push(`    ${filter.filterName.name} {}`);
      } else {
        lines.push(`    ${filter.filterName.name} {`);
        for (const field of filter.fields) {
          lines.push(`      ${field.name.name}: ${serializeValue(field.value)}`);
        }
        lines.push("    }");
      }
    }
    lines.push("  }");
  }

  // Constraints
  if (ast.constraints && ast.constraints.fields.length > 0) {
    lines.push("");
    lines.push("  constraints {");
    for (const field of ast.constraints.fields) {
      lines.push(`    ${field.name.name}: ${serializeValue(field.value)}`);
    }
    lines.push("  }");
  }

  lines.push("}");
  return lines.join("\n") + "\n";
}

function serializeValue(node: ValueNode): string {
  switch (node.type) {
    case "StringLiteral":
      return `"${escapeString(node.value)}"`;
    case "NumberLiteral":
      return String(node.value);
    case "BooleanLiteral":
      return String(node.value);
    case "Identifier":
      return node.name;
    case "ArrayLiteral": {
      if (node.elements.length === 0) return "[]";
      const items = node.elements.map(serializeValue);
      const singleLine = `[${items.join(", ")}]`;
      if (singleLine.length <= 60) return singleLine;
      return "[\n" + items.map((i) => `      ${i}`).join(",\n") + "\n    ]";
    }
  }
}

function escapeString(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t");
}
