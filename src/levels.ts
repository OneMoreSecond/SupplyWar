import mvp from "../maps/mvp.json";
import demo from "../maps/demo.json";
import transport from "../maps/tutorial-1-transport.json";
import support from "../maps/tutorial-2-support.json";
import cutSupply from "../maps/tutorial-3-cut-supply.json";
import siege from "../maps/tutorial-4-siege.json";
import type { MapConfig } from "./game";

export interface LevelDefinition {
  id: string;
  kind: "tutorial" | "final-exam" | "demo";
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
    title: "Out-supply the defended base.",
    briefing: "Enemy support blocks siege damage. Reinforce your attack with both of your supply nodes.",
    hint: "Send Upper Supply and Lower Supply to Your Base, then attack the Supported Base.",
    config: support as MapConfig,
  },
  {
    id: "cut-supply",
    kind: "tutorial",
    pickerLabel: "Tutorial 3 — Cut supply",
    mechanism: "SOURCE CAPTURE",
    title: "Choose the supply cut.",
    briefing: "The direct road is tempting, but active enemy support makes that attack fail.",
    hint: "Go past the Supported Base to capture the Enemy Resource behind it, then use that supply road to attack.",
    config: cutSupply as MapConfig,
  },
  {
    id: "siege",
    kind: "tutorial",
    pickerLabel: "Tutorial 4 — Siege",
    mechanism: "ROOTED SUPPLY CUT",
    title: "Bypass the strong frontline.",
    briefing: "The base supplies Strong Front through Weak Middle. The frontline guards the base, so the shortcut can cut supply but cannot skip the siege.",
    hint: "Take Weak Middle through the shortcut, siege Strong Front, then attack the now-unguarded Enemy Base.",
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
  {
    id: "demo",
    kind: "demo",
    pickerLabel: "Demo — The Central Campaign",
    mechanism: "LARGE-MAP COMMAND",
    title: "Win the battle for the central arsenal.",
    briefing: "Explore through fog, secure sparse resources, then use Interdiction to open a temporary break in the enemy's rooted support chain.",
    hint: "Resources can move production through wide roads quickly. Select Interdict, then click a visible red route when the frontline stalls.",
    config: demo as MapConfig,
  },
];

export function levelById(id: string | null): LevelDefinition {
  return levels.find((level) => level.id === id) ?? levels[0]!;
}

export function nextLevel(id: string): LevelDefinition | undefined {
  const index = levels.findIndex((level) => level.id === id);
  return index >= 0 ? levels[index + 1] : undefined;
}
