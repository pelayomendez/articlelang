export type NarrativeUnitKind =
  | "claim"
  | "support"
  | "transition"
  | "conclusion"
  | "context";

export type TransitionStyle =
  | "reversal"
  | "concession"
  | "progression"
  | "transformation"
  | "mapping"
  | "callback";

export interface NarrativeUnit {
  kind: NarrativeUnitKind;
  content: string;
  role: string;
  transitionStyle?: TransitionStyle;
  sourcePattern: string | null;
}

export interface ToneDirective {
  tone: string;
  instructions: string[];
}

export interface AudienceDirective {
  description: string;
}

export interface OutputConstraints {
  minWords?: number;
  maxWords?: number;
  noLists?: boolean;
  bannedPhrases: string[];
  requiredPhrases: string[];
  paragraphMinSentences?: number;
}

export interface StyleFilter {
  name: string;
  directives: string[];
  config: Record<string, string>;
}

export interface NarrativeIR {
  title: string;
  thesis: string;
  goal: string | null;
  audience: AudienceDirective | null;
  tone: ToneDirective | null;
  voice: string | null;
  units: NarrativeUnit[];
  constraints: OutputConstraints;
  filters: StyleFilter[];
}
