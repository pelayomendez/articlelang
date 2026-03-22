# AGENTS.md

## Project
ArtcleLang - Composable Storytelling Language (CSL)

## Source of Truth
- `PLANS.md` defines the milestone roadmap and is authoritative for scope and ordering.
- `docs/syntax.md` defines the V1 language syntax.
- `docs/ast.md` defines the V1 AST shape.

## Architecture
- TypeScript only, no runtime dependencies beyond Node.js stdlib
- Pipeline stages are separate and pure: Lexer -> Parser -> AST -> Validator -> IR -> Prompt Compiler -> Provider
- Narrative IR sits between AST and prompt generation
- Mock LLM provider first; real providers are pluggable later
- Output constraints are testable independently

## Conventions
- Source lives in `src/`, tests in `tests/`, examples in `examples/`, docs in `docs/`
- Test framework: Vitest
- File extension for CSL source files: `.csl`
- Each pipeline stage has its own directory under `src/`
- Tests mirror `src/` structure under `tests/`

## Working Rules
- Implement milestone by milestone per PLANS.md
- Keep diffs scoped to the current milestone
- Run tests after each milestone and fix failures before moving on
- Update docs continuously
