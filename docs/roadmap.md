# V2 Roadmap

Ideas and directions for future development beyond V1.

## Language Extensions
- **Custom patterns** — allow users to define patterns inline or in separate files
- **Pattern composition** — patterns that reference other patterns
- **Conditional sections** — `if`/`else` blocks based on audience or goal
- **Template strings** — interpolation in string values
- **Multi-article files** — support for series or collections
- **Import system** — `import` patterns from external files or packages

## Compiler Improvements
- **Multiple output targets** — newsletter, whitepaper, social post, etc.
- **Target-specific prompt tuning** — different prompt strategies per output format
- **IR optimization pass** — reorder or merge narrative units for better flow
- **Incremental compilation** — cache and reuse intermediate results
- **Source maps** — map generated output sections back to CSL source

## Provider System
- **Real LLM providers** — OpenAI, Anthropic, local models
- **Provider configuration** — model selection, temperature, token limits
- **Streaming output** — stream rendered prose as it generates
- **Multi-pass generation** — generate, lint, revise cycle
- **Cost estimation** — estimate token usage before generation

## Linting & Validation
- **Custom lint rules** — user-defined output constraints
- **Style checking** — readability scores, passive voice detection
- **Structural linting** — verify output follows the narrative structure
- **Auto-fix suggestions** — suggest edits to fix constraint violations

## Tooling
- **Language server (LSP)** — IDE support with diagnostics, completions, hover info
- **Syntax highlighting** — TextMate/VS Code grammar for `.csl` files
- **Playground** — web-based editor with live preview
- **Watch mode** — recompile on file changes
- **Plugin system** — extend patterns, providers, and lint rules via plugins
