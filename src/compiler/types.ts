export interface PromptSection {
  role: "system" | "user";
  content: string;
}

export interface PromptPayload {
  target: string;
  sections: PromptSection[];
  metadata: {
    title: string;
    goal: string | null;
    tone: string | null;
    audience: string | null;
    wordRange: { min?: number; max?: number } | null;
  };
}
