export type AssistantTask = {
  id: string;
  title: string;
  done: boolean;
};

export type PersonaPreset = {
  id: string;
  name: string;
  tagline: string;
  instructions: string;
  strengths: string[];
  tone: "warm" | "direct" | "playful" | "analytical";
  gradient: string;
};

export type AssistantProfile = {
  name?: string;
  focus?: string;
  mood?: string;
  notes?: string;
};
