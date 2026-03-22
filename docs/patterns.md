# Built-in Patterns

CSL ships with 7 built-in narrative patterns. Each pattern defines a reusable rhetorical structure that expands into narrative units during IR compilation.

## contrarian_intro

Opens by stating a widely held belief, then immediately reframes it. Creates tension and hooks the reader.

**Required fields:**
- `claim` (string) — the conventional wisdom
- `reframe` (string) — the surprising pivot

**IR expansion:** claim + reversal transition + reframed claim

**Example:**
```
contrarian_intro {
  claim: "Microservices solved distributed computing"
  reframe: "But agents solve it better"
}
```

## progressive_argument

Builds a case through a sequence of escalating points. Each point strengthens the overall argument.

**Required fields:**
- `points` (string array) — ordered argument points

**IR expansion:** ordered support units (one per point)

**Example:**
```
progressive_argument {
  points: [
    "Agents internalize routing logic",
    "State becomes agent-scoped",
    "Deployment collapses to a single artifact"
  ]
}
```

## concrete_example

Illustrates an abstract claim with a specific before/after scenario. Grounds the argument in reality.

**Required fields:**
- `scenario` (string) — what is being illustrated
- `before` (string) — the old state
- `after` (string) — the new state

**IR expansion:** context + before support + transformation transition + after support

**Example:**
```
concrete_example {
  scenario: "A payment processing pipeline"
  before: "Five microservices with async queues"
  after: "One agent with tool access"
}
```

## counterpoint_rebuttal

Acknowledges a likely objection, then dismantles it. Builds credibility by engaging with opposing views.

**Required fields:**
- `counterpoint` (string) — the opposing argument
- `rebuttal` (string) — the response

**IR expansion:** opposing claim + concession transition + rebuttal claim

**Example:**
```
counterpoint_rebuttal {
  counterpoint: "Good writing cannot be systematized"
  rebuttal: "Rhetorical structure is a learnable craft"
}
```

## analogy_bridge

Connects an unfamiliar concept to a familiar one through analogy. Helps readers build mental models.

**Required fields:**
- `source` (string) — the familiar domain
- `target` (string) — the unfamiliar domain
- `insight` (string) — what the comparison reveals

**IR expansion:** familiar support + mapping transition + target support + insight claim

**Example:**
```
analogy_bridge {
  source: "The difference between a calculator and a spreadsheet"
  target: "The difference between an AI wrapper and an AI agent"
  insight: "One performs a function; the other orchestrates workflows"
}
```

## reframe_conclusion

Closes by calling back to an earlier idea and reframing it in light of the full argument. Creates resonance.

**Required fields:**
- `callback` (string) — reference to an earlier idea
- `reframe` (string) — the new perspective

**IR expansion:** callback transition + reframed conclusion

**Example:**
```
reframe_conclusion {
  callback: "The same engineers who adopted microservices"
  reframe: "will be the first to abandon them"
}
```

## open_ending

Ends with a provocative question rather than a definitive conclusion. Invites the reader to continue thinking.

**Required fields:**
- `question` (string) — the closing question

**IR expansion:** open question conclusion

**Example:**
```
open_ending {
  question: "What would your product look like if it could act, not just respond?"
}
```
