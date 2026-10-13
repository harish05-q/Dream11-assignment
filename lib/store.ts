"use client";

import { create } from "zustand";

type ViewDepth = "new-fan" | "nerd";
type Language = "en" | "hi";

type ExperienceState = {
  selectedMatch: string | null;
  selectedMoment: string | null;
  depth: ViewDepth;
  lang: Language;
  replayPosition: number;
  setMatch: (id: string) => void;
  setMoment: (id: string | null) => void;
  setDepth: (depth: ViewDepth) => void;
  setLang: (lang: Language) => void;
  setReplayPosition: (position: number) => void;
};

export const useExperienceStore = create<ExperienceState>((set) => ({
  selectedMatch: null,
  selectedMoment: null,
  depth: "new-fan",
  lang: "en",
  replayPosition: 0,
  setMatch: (selectedMatch) => set({ selectedMatch }),
  setMoment: (selectedMoment) => set({ selectedMoment }),
  setDepth: (depth) => set({ depth }),
  setLang: (lang) => set({ lang }),
  setReplayPosition: (replayPosition) => set({ replayPosition }),
}));
