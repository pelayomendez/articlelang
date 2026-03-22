import type { PatternSchema } from "../validator/validator.js";

export interface PatternDefinition extends PatternSchema {
  description: string;
  irExpansion: string;
  promptHints?: string[];
}

const builtinPatterns: PatternDefinition[] = [
  {
    name: "contrarian_intro",
    description:
      "Opens by stating a widely held belief, then immediately reframes it. Creates tension and hooks the reader.",
    requiredFields: ["claim", "reframe"],
    optionalFields: [],
    irExpansion: "claim_unit + transition_unit(reversal) + claim_unit(reframed)",
    promptHints: [
      "Open with the conventional wisdom as if the reader already believes it",
      "Pivot sharply — the reframe should feel like a surprise, not a gentle correction",
    ],
  },
  {
    name: "progressive_argument",
    description:
      "Builds a case through a sequence of escalating points. Each point strengthens the overall argument.",
    requiredFields: ["points"],
    optionalFields: [],
    irExpansion: "support_unit[] (ordered, escalating)",
    promptHints: [
      "Each point should be stronger or more specific than the last",
      "Use transitions that signal progression: 'further', 'moreover', 'critically'",
    ],
  },
  {
    name: "concrete_example",
    description:
      "Illustrates an abstract claim with a specific before/after scenario. Grounds the argument in reality.",
    requiredFields: ["scenario", "before", "after"],
    optionalFields: [],
    irExpansion: "claim_unit(context) + support_unit(before) + transition_unit(transformation) + support_unit(after)",
    promptHints: [
      "The scenario should be specific enough to be vivid",
      "The before/after contrast should make the argument feel inevitable",
    ],
  },
  {
    name: "counterpoint_rebuttal",
    description:
      "Acknowledges a likely objection, then dismantles it. Builds credibility by engaging with opposing views.",
    requiredFields: ["counterpoint", "rebuttal"],
    optionalFields: [],
    irExpansion: "claim_unit(opposition) + transition_unit(concession) + claim_unit(rebuttal)",
    promptHints: [
      "State the counterpoint fairly — straw-manning weakens the rebuttal",
      "The rebuttal should feel earned, not dismissive",
    ],
  },
  {
    name: "analogy_bridge",
    description:
      "Connects an unfamiliar concept to a familiar one through analogy. Helps readers build mental models.",
    requiredFields: ["source", "target", "insight"],
    optionalFields: [],
    irExpansion: "support_unit(familiar) + transition_unit(mapping) + claim_unit(insight)",
    promptHints: [
      "The source domain should be genuinely familiar to the target audience",
      "The insight should emerge naturally from the comparison",
    ],
  },
  {
    name: "reframe_conclusion",
    description:
      "Closes by calling back to an earlier idea and reframing it in light of the full argument. Creates resonance.",
    requiredFields: ["callback", "reframe"],
    optionalFields: [],
    irExpansion: "transition_unit(callback) + conclusion_unit(reframed)",
    promptHints: [
      "The callback should reference something the reader encountered earlier",
      "The reframe should feel like the argument has shifted the reader's perspective",
    ],
  },
  {
    name: "open_ending",
    description:
      "Ends with a provocative question rather than a definitive conclusion. Invites the reader to continue thinking.",
    requiredFields: ["question"],
    optionalFields: [],
    irExpansion: "conclusion_unit(open_question)",
    promptHints: [
      "The question should not have an obvious answer",
      "It should feel like a natural extension of the argument, not a non sequitur",
    ],
  },
];

export class PatternRegistry {
  private patterns: Map<string, PatternDefinition>;

  constructor() {
    this.patterns = new Map();
    for (const pattern of builtinPatterns) {
      this.patterns.set(pattern.name, pattern);
    }
  }

  get(name: string): PatternDefinition | undefined {
    return this.patterns.get(name);
  }

  has(name: string): boolean {
    return this.patterns.has(name);
  }

  all(): PatternDefinition[] {
    return Array.from(this.patterns.values());
  }

  names(): string[] {
    return Array.from(this.patterns.keys());
  }

  toSchemaMap(): Map<string, PatternSchema> {
    const map = new Map<string, PatternSchema>();
    for (const [name, def] of this.patterns) {
      map.set(name, {
        name: def.name,
        requiredFields: def.requiredFields,
        optionalFields: def.optionalFields,
      });
    }
    return map;
  }
}

export const defaultRegistry = new PatternRegistry();
