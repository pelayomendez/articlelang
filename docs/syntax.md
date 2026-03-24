# CSL V1 Syntax

## Overview
CSL (Composable Storytelling Language) files describe article specifications through declarations, pattern invocations, and constraints. The compiler transforms these into prompt payloads for prose generation.

## File Structure
A `.csl` file contains a single `article` declaration with nested blocks.

```
article "Title Here" {
  // metadata fields
  // use statements
  // pattern invocations
  // constraints block
}
```

## Article Declaration
The top-level construct. Requires a quoted title string.

```
article "Why AI Agents Will Replace Microservices" {
  ...
}
```

## Fields
Fields are key-value pairs. Keys are bare identifiers. Values can be:
- **Strings**: double-quoted `"value"`
- **Identifiers**: bare words for enum-like values `persuasive`
- **Arrays**: bracket-delimited `["item1", "item2"]`

### Required Fields
- `title` — article title (string, set in the declaration)
- `thesis` — the core argument or thesis (string)

### Optional Fields
- `goal` — the article's purpose. Values: `persuade`, `inform`, `entertain`, `explain`
- `audience` — target reader description (string)
- `tone` — writing tone. Values: `authoritative`, `conversational`, `provocative`, `analytical`, `witty`
- `voice` — narrative voice (string, e.g. `"first-person"`, `"third-person"`)

## Use Statements
Import narrative patterns for use in the article.

```
use contrarian_intro
use progressive_argument
use concrete_example
```

## Pattern Invocations
Configure imported patterns with a block.

```
contrarian_intro {
  claim: "Microservices are the gold standard"
  reframe: "But agent-based systems make them obsolete"
}

progressive_argument {
  points: [
    "Agents handle routing internally",
    "State management becomes implicit",
    "Deployment collapses to a single unit"
  ]
}
```

### Pattern Block Fields
Each pattern defines its own schema of required and optional fields. Field values follow the same types as article fields (strings, identifiers, arrays).

## Constraints Block
Define output constraints that the generated prose must satisfy.

```
constraints {
  min_words: 1500
  max_words: 2500
  no_lists: true
  banned_phrases: ["in conclusion", "it is important to note"]
  required_phrases: ["agent-based architecture"]
  paragraph_min_sentences: 3
}
```

### Supported Constraint Keys
- `min_words` — minimum word count (number)
- `max_words` — maximum word count (number)
- `no_lists` — prohibit bullet/numbered lists (boolean: `true`/`false`)
- `banned_phrases` — phrases that must not appear (string array)
- `required_phrases` — phrases that must appear (string array)
- `paragraph_min_sentences` — minimum sentences per paragraph (number)

## Filters Block
Apply writing style modifiers inspired by famous writers and copywriters. Filters inject style directives into the system prompt so the LLM generates in that voice from the start.

```
filters {
  hemingway {}
  ogilvy { intensity: high }
}
```

Each filter can optionally have configuration fields. Empty `{}` means use defaults.

### Built-in Filters
- `ogilvy` — David Ogilvy's advertising copy: specific facts, benefit-driven, direct address
- `hemingway` — minimalist prose: short sentences, concrete nouns, active voice, no adverbs
- `gonzo` — Hunter S. Thompson's gonzo journalism: first-person, visceral, irreverent
- `orwell` — George Orwell's clarity rules: short words, cut fluff, no cliches, active voice
- `scientific` — academic register: hedged claims, precise terminology, evidence-oriented
- `storyteller` — narrative nonfiction: anecdotal openings, scene-setting, delayed thesis

### Filter Options
- `intensity` — optional, values: `low`, `medium`, `high`

## Numbers and Booleans
- **Numbers**: bare integer literals `1500`
- **Booleans**: bare `true` or `false`

## Comments
Single-line comments start with `//`.

```
// This is a comment
article "Example" {
  // another comment
  thesis: "Something"
}
```

## Colons
Field separators use `:` between key and value. The colon is optional in the article declaration's direct fields but required inside pattern blocks and constraints.

## Complete Example

```
article "Why AI Agents Will Replace Microservices" {
  thesis: "Agent-based architectures will supersede microservice patterns within five years"
  goal: persuade
  audience: "Senior software engineers and technical architects"
  tone: provocative

  use contrarian_intro
  use progressive_argument
  use concrete_example
  use reframe_conclusion

  contrarian_intro {
    claim: "Microservices solved distributed computing"
    reframe: "But agents solve it better"
  }

  progressive_argument {
    points: [
      "Agents internalize routing logic",
      "State becomes agent-scoped",
      "Deployment is a single artifact"
    ]
  }

  concrete_example {
    scenario: "A payment processing pipeline"
    before: "Five microservices with async queues"
    after: "One agent with tool access"
  }

  reframe_conclusion {
    callback: "The same engineers who adopted microservices"
    reframe: "will be the first to abandon them"
  }

  filters {
    ogilvy { intensity: high }
    hemingway {}
  }

  constraints {
    min_words: 1500
    max_words: 2500
    no_lists: true
    banned_phrases: ["in conclusion", "it goes without saying"]
    required_phrases: ["agent-based architecture"]
    paragraph_min_sentences: 3
  }
}
```
