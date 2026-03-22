# ArticleLang - Composable Storytelling Language (CSL)

[![npm version](https://img.shields.io/npm/v/articlelang.svg)](https://www.npmjs.com/package/articlelang)
[![license](https://img.shields.io/npm/l/articlelang.svg)](https://github.com/pelayomendez/articlelang/blob/main/LICENSE)

A domain-specific language for writing article and story specifications. Compose narrative structures and constraints, and the system compiles them into prompts and generated prose.

## Pipeline

```
.csl source -> Lexer -> Parser -> AST -> Validator -> Narrative IR -> Prompt Compiler -> Provider -> Output
```

## Install

```bash
npm install articlelang
```

## Usage

```bash
# Parse a CSL file into AST
csl parse examples/essay_ai_architecture.csl

# Validate a CSL file
csl validate examples/essay_ai_architecture.csl

# Compile to prompt payload
csl compile examples/essay_ai_architecture.csl

# Render to prose (uses mock provider by default)
csl render examples/essay_ai_architecture.csl --target blog

# Lint generated output against constraints
csl lint examples/essay_ai_architecture.csl
```

## Example

```
article "Why AI Agents Will Replace Microservices" {
  thesis: "Agent-based architectures will supersede microservice patterns"
  goal: persuade
  audience: "Senior software engineers"
  tone: provocative

  use contrarian_intro
  use progressive_argument

  contrarian_intro {
    claim: "Microservices solved distributed computing"
    reframe: "But agents solve it better"
  }

  progressive_argument {
    points: [
      "Agents internalize routing logic",
      "State becomes agent-scoped",
      "Deployment collapses to a single artifact"
    ]
  }

  constraints {
    min_words: 1500
    max_words: 2500
    no_lists: true
  }
}
```

## Try it Online

[ArticleLang Studio](https://articlelang-studio.onrender.com) is a browser-based editor for CSL with Monaco, live validation, pipeline inspection, and LLM rendering.

## Docs

- [Language Overview](docs/language-overview.md)
- [Syntax Reference](docs/syntax.md)
- [AST Specification](docs/ast.md)
- [Compiler Pipeline](docs/compiler-pipeline.md)
- [Built-in Patterns](docs/patterns.md)
- [V2 Roadmap](docs/roadmap.md)

## Development

```bash
npm test        # run tests
npm run build   # compile TypeScript
npm run lint    # type-check without emit
```

## Author

**Pelayo Mendez** — [GitHub](https://github.com/pelayomendez)

## License

MIT
