# Compiler Pipeline

## Overview

The CSL compiler transforms `.csl` source files through a series of deterministic stages into prompt payloads and rendered prose.

```
Source (.csl)
  |
  v
[Lexer] -> Token[]
  |
  v
[Parser] -> ArticleNode (AST)
  |
  v
[Validator] -> ValidationResult
  |
  v
[IR Compiler] -> NarrativeIR
  |
  v
[Prompt Compiler] -> PromptPayload
  |
  v
[Provider] -> RenderResult (prose)
  |
  v
[Linter] -> LintResult
```

## Stages

### 1. Lexer (`src/lexer/`)
Tokenizes source text into a flat array of tokens. Handles strings, numbers, booleans, identifiers, keywords, and punctuation. Tracks line/column positions for error reporting.

### 2. Parser (`src/parser/`)
Consumes tokens and produces a typed AST (`ArticleNode`). Handles the full V1 syntax: article declarations, fields, use statements, pattern invocations, and constraints blocks.

### 3. Validator (`src/validator/`)
Checks the AST against language rules:
- Required fields (thesis)
- Valid enum values (goal, tone)
- Known patterns (via pattern registry)
- Pattern field schemas
- Constraint types
- Duplicate detection

### 4. IR Compiler (`src/ir/`)
Transforms the AST into a Narrative IR that represents rhetorical intent rather than syntax. Each pattern invocation is expanded into narrative units (claims, supports, transitions, conclusions) based on the pattern's IR expansion rules.

### 5. Prompt Compiler (`src/compiler/`)
Transforms the Narrative IR into a `PromptPayload` with system and user prompt sections. The system prompt includes tone, audience, constraints. The user prompt includes the narrative structure as an ordered sequence of rhetorical moves.

### 6. Provider (`src/providers/`)
Sends the prompt payload to an LLM for generation. The `LLMProvider` interface is abstract; a `MockProvider` is included for testing and development.

### 7. Linter (`src/lint/`)
Validates rendered output against the article's constraints (word count, banned/required phrases, list prohibition, paragraph length).

## Key Design Decisions

- **AST is syntax, IR is semantics.** The AST faithfully represents the source structure. The IR represents rhetorical intent. This separation allows the prompt compiler to work with narrative concepts, not syntax trees.

- **Patterns expand at the IR level.** Pattern invocations in the AST are syntactic references. Their expansion into narrative units happens during IR compilation, not during parsing.

- **Providers are pluggable.** The `LLMProvider` interface decouples generation from the deterministic compilation stages. The mock provider enables end-to-end testing without API calls.

- **Constraints are checked post-generation.** The linter runs against rendered output, not against the AST or IR. This keeps the generation pipeline forward-only and makes constraint checking independently testable.
