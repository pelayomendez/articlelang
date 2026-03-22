## `PLANS.md`

```md
# PLANS.md

## Project
Composable Storytelling Language (CSL)

## Objective
Build V1 of a storytelling DSL that lets users describe an article or narrative through structure, rhetoric, and constraints, then compile it through deterministic stages into prompt payloads and generated prose.

---

# Milestone 1 — Spec Freeze and Project Scaffold

## Goal
Create the initial project shape, freeze V1 syntax direction, define the first AST model, and add working examples.

## Tasks
- scaffold repository structure
- initialize TypeScript project
- create docs folder and core docs
- add `AGENTS.md`
- add `PLANS.md`
- write `README.md`
- define initial DSL syntax in `docs/syntax.md`
- define AST schema in `docs/ast.md`
- create example `.csl` files
- choose test framework and configure it
- add lint/format tooling if lightweight

## Deliverables
- repo scaffold
- initial docs
- syntax examples
- AST draft
- 5 example `.csl` files

## Suggested example files
- `examples/essay_ai_architecture.csl`
- `examples/linkedin_agents.csl`
- `examples/newsletter_reverse_engineering.csl`
- `examples/invalid_missing_thesis.csl`
- `examples/invalid_unknown_pattern.csl`

## Acceptance Criteria
- project installs and runs
- docs clearly describe V1 syntax direction
- AST document exists and matches syntax direction
- example files cover both valid and invalid cases
- test runner works with at least one smoke test

---

# Milestone 2 — Lexer and Parser

## Goal
Implement parsing from `.csl` source text into a typed AST.

## Tasks
- implement token definitions
- implement lexer
- implement parser
- define AST node interfaces in code
- support file position tracking
- parse valid example files into AST
- report parse errors with line/column info

## Scope
Support V1 syntax for:
- article declaration
- string values
- enum-like bare identifiers where allowed
- arrays
- object-like blocks
- `use` statements
- pattern invocation blocks
- constraints block

## Deliverables
- lexer implementation
- parser implementation
- typed AST code
- parser tests
- AST snapshots for fixtures

## Acceptance Criteria
- all valid example files parse successfully
- invalid syntax returns parse errors
- errors include location data
- AST output is stable enough for snapshot testing
- tests pass

---

# Milestone 3 — Semantic Validator

## Goal
Validate parsed AST according to CSL language rules.

## Tasks
- implement validator entry point
- validate required article fields
- validate known goals and tones
- validate pattern names
- validate duplicate or conflicting declarations
- validate structure of constraints
- validate pattern-specific argument shapes
- design readable validation error format

## Deliverables
- validator implementation
- validation error types
- validation tests
- invalid fixture coverage

## Rules to validate
- article must have title
- article must have thesis
- unknown patterns are invalid
- invalid enum values are invalid
- required strings cannot be empty
- arrays must contain expected item types
- constraints must match supported keys and value shapes
- pattern blocks must match registered pattern schemas

## Acceptance Criteria
- known invalid fixtures fail validation correctly
- errors are understandable and actionable
- valid fixtures pass validation
- validator can be run independently of rendering
- tests pass

---

# Milestone 4 — Built-in Pattern Registry

## Goal
Introduce reusable narrative patterns with typed configuration.

## Tasks
- implement built-in pattern registry
- define pattern metadata format
- define pattern config schema structure
- add built-in patterns
- validate pattern invocation against registry
- document all built-in patterns

## V1 Built-in Patterns
- `contrarian_intro`
- `progressive_argument`
- `concrete_example`
- `counterpoint_rebuttal`
- `analogy_bridge`
- `reframe_conclusion`
- `open_ending`

## Each pattern should define
- name
- description
- required inputs
- optional inputs
- validation rules
- IR expansion behavior
- prompt rendering hints if needed

## Deliverables
- pattern registry module
- pattern docs
- pattern validation tests
- example usage for each pattern

## Acceptance Criteria
- all built-in patterns are registered in one discoverable place
- pattern schemas are testable
- validator uses registry rather than hardcoded conditionals where practical
- docs explain each pattern clearly
- tests pass

---

# Milestone 5 — Narrative IR

## Goal
Create an intermediate representation between AST and prompt generation.

## Why this matters
The AST represents syntax.  
The Narrative IR represents storytelling intent and rhetorical flow.

This separation is required.

## Tasks
- define Narrative IR types
- design core IR units
- implement AST → IR compiler
- ensure deterministic compilation
- document the compiler mapping

## Suggested IR concepts
- narrative unit
- rhetorical move
- claim unit
- support unit
- transition unit
- conclusion unit
- tone directives
- audience directives
- output constraints

## Deliverables
- Narrative IR type definitions
- AST → IR compiler
- IR fixtures
- compiler tests
- docs for IR model

## Acceptance Criteria
- valid AST compiles to deterministic IR
- IR is independent from provider implementation
- IR captures all information needed for prompt generation
- tests cover pattern expansion into IR
- docs explain how syntax maps to IR

---

# Milestone 6 — Prompt Compiler

## Goal
Compile Narrative IR into prompt payloads that can be sent to a generation provider.

## Tasks
- define prompt compilation interface
- design prompt payload shape
- implement IR → prompt compiler
- support at least one target style, such as `blog`
- support prompt dump mode for inspection
- keep generation provider separate

## Prompt compiler should include
- article goal
- audience
- tone directives
- narrative order
- pattern-expanded rhetorical instructions
- constraints
- output target hints

## Deliverables
- prompt compiler module
- prompt fixtures
- prompt snapshot tests
- prompt compilation docs

## Acceptance Criteria
- same IR yields same prompt output
- prompt compiler can run without any live model
- prompt payload is inspectable for debugging
- tests pass

---

# Milestone 7 — Provider Adapter and Mock Rendering

## Goal
Add a provider abstraction and a mock rendering path so the pipeline can run end-to-end without real model dependency.

## Tasks
- define `LLMProvider` interface
- implement mock provider
- add render pipeline from `.csl` to markdown
- optionally add a placeholder real provider interface without wiring credentials
- make provider failures explicit

## Deliverables
- provider interface
- mock provider
- render command path
- end-to-end rendering tests

## Acceptance Criteria
- render works end-to-end with mock provider
- provider integration is isolated from parser/compiler layers
- failure modes are understandable
- tests pass

---

# Milestone 8 — Output Constraint Linting

## Goal
Validate rendered output against article constraints.

## Tasks
- define output lint result model
- implement checks for:
  - banned phrases
  - required phrases
  - list prohibition
  - paragraph length heuristics
- connect linting to rendered output
- produce readable reports

## Deliverables
- output linter
- lint tests
- sample reports
- lint docs

## Acceptance Criteria
- output can be linted independently
- at least the core constraints are checked
- failures identify which rule was broken
- tests pass

---

# Milestone 9 — CLI

## Goal
Provide a usable command-line interface for working with CSL files.

## Commands
- `csl parse <file>`
- `csl validate <file>`
- `csl compile <file>`
- `csl render <file> --target blog`
- `csl lint <file>`

## Tasks
- implement CLI entrypoint
- wire commands to compiler stages
- format human-readable output
- handle exit codes correctly
- add CLI smoke tests

## Deliverables
- CLI executable
- command docs
- CLI tests

## Acceptance Criteria
- each command runs on example fixtures
- errors are readable
- exit codes reflect success/failure
- tests pass

---

# Milestone 10 — Docs, Examples, and V1 Hardening

## Goal
Make the project understandable and stable as a usable V1.

## Tasks
- refine README
- update all docs to match implementation
- add end-to-end walkthrough
- add example outputs
- review naming consistency
- clean up architecture drift
- tighten tests
- add roadmap doc for V2

## Deliverables
- complete README
- complete docs set
- example input/output walkthrough
- stable test suite
- roadmap doc

## Acceptance Criteria
- a new contributor can understand the pipeline from docs
- examples run successfully
- test suite passes cleanly
- terminology is consistent across code and docs

---

# Recommended Repo Structure

```text
csl/
  AGENTS.md
  PLANS.md
  README.md
  package.json
  tsconfig.json
  src/
    lexer/
    parser/
    ast/
    validator/
    patterns/
    ir/
    compiler/
    providers/
    lint/
    cli/
  examples/
  tests/
    lexer/
    parser/
    validator/
    patterns/
    ir/
    compiler/
    e2e/
  docs/
    language-overview.md
    syntax.md
    ast.md
    compiler-pipeline.md
    patterns.md
    roadmap.md