export interface Agent {
  id: string;
  age: number;
  gender: string;
  attitude: number; // -1: Resistant, 0: Neutral, 1: Likely
  income?: string;
  education?: string;
  traits?: string;
}

export interface News {
  id: string;
  title: string;
  truthfulness: string; // True, Fake
  sentiment: string; // Pro-vaccine, Anti-vaccine, Fear-based, Neutral
  content?: string;
  source?: string;
}

export interface SimulationResult {
  agentId: string;
  newAttitude: number;
  reasoning: string;
}

export interface AIGeneratedProfile {
  income: string;
  education: string;
  attitude: number;
  traits: string;
}
