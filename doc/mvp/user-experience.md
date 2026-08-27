# MVP User Experience

Source: user-confirmed onboarding and visual-feedback decisions in [the game progress record](../../agents/progress/2026-08-26-game-demo-plan-grill.md), Sections 4 and 7, and map-editor requirements in [the map-editor progress record](../../agents/progress/2026-08-27-browser-map-editor.md), summarized on 2026-08-27.

## Player framing

The header establishes the threat, then gives the first actionable tactic.

> The enemy's strong frontline threatens our base. But their supply line is vulnerable—break it.

> Capture the enemy resource, then attack the unsupported frontline.

Source: user-requested mission briefing; implementation: [`index.html`](../../index.html).

## Controls

| Action | Input | Result |
| --- | --- | --- |
| Start a transport | Drag from a green player-owned node to an adjacent node | Starts a player transport if its road is unused |
| Preview a transport | Hold the drag | Shows an arrowed dashed path and explains whether release will send force |
| Cancel a transport | Right-click a green active road | Cancels that player transport and removes force on it |
| Restart | Select `Restart map` | Reloads the authored map state |
| Open the editor | Select `Map editor` | Opens the browser map editor in the same site |

Source: user-confirmed input decisions; implementation: [`src/main.ts`](../../src/main.ts).

## Visual language

| State | Presentation | Purpose |
| --- | --- | --- |
| Ownership | Green = player, red = enemy, grey = neutral | Read who controls each node and route |
| Force | Rounded number inside each node | Read immediate strength |
| Node role | White base ring; gold resource ring and label | Identify production sources and victory target |
| Active transport | Owner-colored road with animated white triangles from transport source to target | Read occupancy and actual flow direction |
| Valid drag target | Green dashed arrow and target ring | Confirm a release will start a transport |
| Invalid drag | Grey dashed arrow and explicit guidance | Explain why no transport will start yet |
| Unsupported siege | Pulsing gold ring | Make a supply cut's consequence visible |

Source: user visual-feedback decisions and browser verification; implementation: [`src/main.ts`](../../src/main.ts), [`src/style.css`](../../src/style.css).

## Map-editor flow

| Action | Input | Result |
| --- | --- | --- |
| Load a map | Select `Load JSON`, then a `.json` file | A valid version-1 map replaces the draft; an invalid file leaves it unchanged and explains the correction needed |
| Edit values | Use the settings and collection cards | Updates the draft and preview immediately; node ID changes preserve its road/transport references |
| Edit layout | Drag a node in the preview or enter exact `X` / `Y` values | Updates the node coordinates |
| Change collections | Select `Add` or `Remove` in a node, road, or transport section | Adds a usable default item or removes the chosen draft item |
| Save a map | Select `Save JSON` when the map is valid | Downloads formatted JSON under the current map filename |
| Return to play | Select `Back to game` | Returns to the game page |

The validation status states whether saving is available and gives a specific correction when the draft is invalid. A failed file load also states that the current map was not changed. Source: error-state requirements from the error-message skill; implementation and browser evidence in [`src/editor.ts`](../../src/editor.ts) and [the map-editor progress record](../../agents/progress/2026-08-27-browser-map-editor.md).

## Intended first play

The player should understand that the nearby strong frontline is dangerous, see the distant resource as its source of support, capture that resource through the long flank route, siege the frontline, and then take the enemy base. The target successful run is 2–4 minutes with the onboarding shown above. Source: user-confirmed pacing and map decisions in the progress record.
