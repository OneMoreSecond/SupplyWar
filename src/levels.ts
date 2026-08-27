import mvp from "../maps/mvp.json";
import transport from "../maps/tutorial-1-transport.json";
import support from "../maps/tutorial-2-support.json";
import cutSupply from "../maps/tutorial-3-cut-supply.json";
import siege from "../maps/tutorial-4-siege.json";
import type { MapConfig } from "./game";

export interface LevelDefinition {
  id: string;
  kind: "tutorial" | "final-exam";
  pickerLabel: string;
  mechanism: string;
  title: string;
  briefing: string;
  hint: string;
  config: MapConfig;
}

export const levels: readonly LevelDefinition[] = [
  {
    id: "transport",
    kind: "tutorial",
    pickerLabel: "Tutorial 1 — Send forces",
    mechanism: "TRANSPORT & CAPTURE",
    title: "Send forces down a road.",
    briefing: "Active roads continuously move force from their source to their target.",
    hint: "Drag from Your Base to the Small Enemy Base and keep the route active until capture.",
    config: transport as MapConfig,
  },
  {
    id: "support",
    kind: "tutorial",
    pickerLabel: "Tutorial 2 — Allied supply",
    mechanism: "ALLIED SUPPORT",
    title: "Feed the attack from behind.",
    briefing: "A route targeting an allied node reinforces it, creating a supply chain.",
    hint: "Send Your Resource to Your Base, then send Your Base to the Enemy Base.",
    config: support as MapConfig,
  },
  {
    id: "cut-supply",
    kind: "tutorial",
    pickerLabel: "Tutorial 3 — Cut supply",
    mechanism: "SOURCE CAPTURE",
    title: "Choose the supply cut.",
    briefing: "The direct road is tempting, but active enemy support makes that attack fail.",
    hint: "Capture the Enemy Resource first. Its support will stop, then the supply road becomes your winning route.",
    config: cutSupply as MapConfig,
  },
  {
    id: "siege",
    kind: "tutorial",
    pickerLabel: "Tutorial 4 — Siege",
    mechanism: "UNSUPPORTED SIEGE",
    title: "Hold pressure on an unsupported fortress.",
    briefing: "An attacked node without allied support loses force over time, marked by a red ring.",
    hint: "Attack the Unsupported Fortress and keep the route active. Your smaller force can still win.",
    config: siege as MapConfig,
  },
  {
    id: "mvp",
    kind: "final-exam",
    pickerLabel: "Final Exam — Supply War MVP",
    mechanism: "FINAL EXAM",
    title: "Cut the enemy supply line.",
    briefing: "The enemy's strong frontline threatens our base. But their supply line is vulnerable—break it.",
    hint: "Capture the enemy resource, then attack the unsupported frontline.",
    config: mvp as MapConfig,
  },
];

export function levelById(id: string | null): LevelDefinition {
  return levels.find((level) => level.id === id) ?? levels[0]!;
}

export function nextLevel(id: string): LevelDefinition | undefined {
  const index = levels.findIndex((level) => level.id === id);
  return index >= 0 ? levels[index + 1] : undefined;
}
