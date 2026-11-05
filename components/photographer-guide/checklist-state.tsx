"use client";

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

type ChecklistState = { checked: Set<string>; setChecked: Dispatch<SetStateAction<Set<string>>> };
const ChecklistContext = createContext<ChecklistState | null>(null);

export function ChecklistProvider({ children }: { children: ReactNode }) {
  const [checked, setChecked] = useState<Set<string>>(() => new Set());
  return <ChecklistContext.Provider value={{ checked, setChecked }}>{children}</ChecklistContext.Provider>;
}

export function useChecklist() {
  const state = useContext(ChecklistContext);
  if (!state) throw new Error("Checklist must be used inside ChecklistProvider");
  return state;
}
