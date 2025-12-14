"use client";

import { ChecklistManager } from "./checklist-manager";

// Wrapper component to ensure stable hook order
export function ChecklistManagerWrapper() {
  return <ChecklistManager />;
}

export default ChecklistManagerWrapper;
