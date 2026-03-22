# CSL Language Overview

## What is CSL?
CSL (Composable Storytelling Language) is a domain-specific language for describing article and narrative specifications. Instead of writing prose directly, you describe **what** the article should achieve, **how** it should be structured, and **what constraints** it must satisfy. The CSL compiler transforms this specification through deterministic stages into prompt payloads for prose generation.

## Pipeline

```
.csl source -> Lexer -> Parser -> AST -> Validator -> Narrative IR -> Prompt Compiler -> Provider -> Output
```

1. **Lexer**: Tokenizes source text
2. **Parser**: Builds typed AST from tokens
3. **Validator**: Checks semantic rules (required fields, valid patterns, valid enum values)
4. **IR Compiler**: Transforms AST into Narrative IR (rhetorical structure)
5. **Prompt Compiler**: Transforms IR into prompt payloads
6. **Provider**: Sends prompts to an LLM and returns generated prose
7. **Linter**: Validates output against constraints

## Key Concepts

### Article
The top-level unit. Every `.csl` file describes one article with a title, thesis, metadata, patterns, and constraints.

### Patterns
Reusable narrative structures like `contrarian_intro` or `progressive_argument`. You import them with `use` and configure them with a block. Patterns expand into rhetorical moves in the Narrative IR.

### Constraints
Rules the generated output must satisfy: word counts, banned phrases, paragraph structure, etc. These are checked after generation by the output linter.

### Narrative IR
An intermediate representation between syntax and prompts. Captures rhetorical intent (claims, supports, transitions, conclusions) rather than syntactic structure.

## Quick Example

```
article "The Case for Boring Technology" {
  thesis: "Mature, boring technology reduces operational risk more than any new framework"
  goal: persuade
  audience: "Engineering managers and CTOs"
  tone: authoritative

  use progressive_argument
  use concrete_example
  use reframe_conclusion

  progressive_argument {
    points: [
      "New technology has unknown failure modes",
      "Boring technology has known, documented solutions",
      "The cost of novelty is paid in operational incidents"
    ]
  }

  concrete_example {
    scenario: "Database selection for a payments system"
    before: "Evaluating the latest distributed NewSQL database"
    after: "Choosing PostgreSQL with well-understood replication"
  }

  reframe_conclusion {
    callback: "Innovation in technology choice"
    reframe: "is often just risk in disguise"
  }

  constraints {
    min_words: 1200
    max_words: 2000
    no_lists: true
    paragraph_min_sentences: 3
  }
}
```
