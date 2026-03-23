export interface FilterSchema {
  name: string;
  optionalFields: string[];
}

export interface FilterDefinition extends FilterSchema {
  description: string;
  directives: string[];
}

const builtinFilters: FilterDefinition[] = [
  {
    name: "ogilvy",
    description: "David Ogilvy's advertising copy style — specific facts, conversational authority, benefit-driven headlines.",
    directives: [
      "Use specific facts and figures instead of vague adjectives",
      "Write headlines that promise a concrete benefit to the reader",
      "Address the reader directly as 'you'",
      "Prefer short paragraphs and clear, unadorned language",
      "Do not be clever or witty for its own sake — be persuasive",
      "Treat the reader as intelligent — never patronize",
    ],
    optionalFields: ["intensity"],
  },
  {
    name: "hemingway",
    description: "Hemingway's minimalist prose — short sentences, concrete nouns, active voice, no ornamentation.",
    directives: [
      "Use short, declarative sentences",
      "Prefer concrete nouns and active verbs over abstractions",
      "Cut every adverb — if the verb is right, the adverb is unnecessary",
      "Avoid subordinate clauses where a period would do",
      "Show, do not tell — let facts carry their own weight",
      "Use simple, common words over sophisticated alternatives",
    ],
    optionalFields: ["intensity"],
  },
  {
    name: "gonzo",
    description: "Hunter S. Thompson's gonzo journalism — first-person immersion, subjective, visceral, irreverent.",
    directives: [
      "Write in vivid, immersive first person",
      "Mix subjective experience with factual reporting",
      "Use visceral, sensory language that makes the reader feel present",
      "Be irreverent toward authority and convention",
      "Let the writer's personality dominate the narrative voice",
      "Embrace digression when it reveals a deeper truth",
    ],
    optionalFields: ["intensity"],
  },
  {
    name: "orwell",
    description: "George Orwell's clarity rules from 'Politics and the English Language'.",
    directives: [
      "Never use a metaphor, simile, or figure of speech that you are used to seeing in print",
      "Never use a long word where a short one will do",
      "If it is possible to cut a word out, always cut it out",
      "Never use the passive where you can use the active",
      "Never use a foreign phrase, a scientific word, or jargon if you can think of an everyday equivalent",
      "Break any of these rules sooner than say anything outright barbarous",
    ],
    optionalFields: ["intensity"],
  },
  {
    name: "scientific",
    description: "Academic and scientific register — precise, hedged, evidence-oriented.",
    directives: [
      "Use precise, domain-specific terminology",
      "Hedge claims appropriately: 'suggests', 'indicates', 'appears to'",
      "Structure arguments with clear logical connectives",
      "Cite evidence and data rather than making unsupported assertions",
      "Maintain an objective, third-person perspective",
      "Use passive voice where it appropriately foregrounds the subject over the agent",
    ],
    optionalFields: ["intensity"],
  },
  {
    name: "storyteller",
    description: "Narrative-driven nonfiction — anecdotal, character-driven, scene-setting.",
    directives: [
      "Open with a specific scene, anecdote, or character moment",
      "Ground abstract ideas in concrete human experiences",
      "Use sensory detail to build scenes the reader can picture",
      "Delay the thesis — let the reader discover it through the narrative",
      "Create tension by withholding resolution",
      "Return to the opening scene or character at the conclusion for resonance",
    ],
    optionalFields: ["intensity"],
  },
];

export class FilterRegistry {
  private filters: Map<string, FilterDefinition>;

  constructor() {
    this.filters = new Map();
    for (const filter of builtinFilters) {
      this.filters.set(filter.name, filter);
    }
  }

  get(name: string): FilterDefinition | undefined {
    return this.filters.get(name);
  }

  has(name: string): boolean {
    return this.filters.has(name);
  }

  all(): FilterDefinition[] {
    return Array.from(this.filters.values());
  }

  names(): string[] {
    return Array.from(this.filters.keys());
  }

  toSchemaMap(): Map<string, FilterSchema> {
    const map = new Map<string, FilterSchema>();
    for (const [name, def] of this.filters) {
      map.set(name, { name: def.name, optionalFields: def.optionalFields });
    }
    return map;
  }
}

export const defaultFilterRegistry = new FilterRegistry();
