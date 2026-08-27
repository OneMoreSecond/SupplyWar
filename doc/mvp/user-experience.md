# MVP User Experience

Source: user-confirmed onboarding and visual-feedback decisions in [the game progress record](../../agents/progress/2026-08-26-game-demo-plan-grill.md), Sections 4 and 7, map-editor requirements in [the map-editor progress record](../../agents/progress/2026-08-27-browser-map-editor.md), and level-flow requirements in [the tutorial progress record](../../agents/progress/2026-08-27-tutorial-level-progression.md), summarized on 2026-08-27.

## Learning progression

Normal play starts at Tutorial 1. Each tutorial names one focal mechanism and gives one concrete action; the existing MVP scenario is the final exam. Source: user tutorial goal; implementation: [`src/levels.ts`](../../src/levels.ts).

| Order | Level | Focal mechanism | Action taught |
| --- | --- | --- | --- |
| 1 | Send forces | Transport and capture | Drag from a player source to an adjacent hostile target and keep the route active |
| 2 | Allied supply | Support | Feed the player base from a resource while the base attacks |
| 3 | Cut supply | Source capture | Capture the enemy resource to cancel its active support route |
| 4 | Siege | Unsupported attrition | Keep attacking a stronger unsupported base while its red siege ring is active |
| 5 | Supply War MVP | Final exam | Combine flanking, source capture, support cutting, and siege |

Source: level metadata in [`src/levels.ts`](../../src/levels.ts) and authored maps under [`maps/`](../../maps/).

## Controls

| Action | Input | Result |
| --- | --- | --- |
| Start a transport | Drag from a green player-owned node to an adjacent node | Starts a player transport if its road is unused |
| Preview a transport | Hold the drag | Shows an arrowed dashed path and explains whether release will send force |
| Cancel a transport | Right-click a green active road | Cancels that player transport and removes force on it |
| Pick a level | Choose any entry from `Level` | Opens that authored tutorial or the MVP final exam |
| Continue after victory | Select `Next level` after capturing the enemy base | Opens the next ordered level; the action is hidden before victory and after the final exam |
| Pan the map | Drag non-interactive map space | Moves the viewport without changing map coordinates |
| Zoom the map | Use the wheel over the canvas | Zooms around the pointer while keeping node markers readable |
| Restart | Select `Restart map` | Reloads the authored map state |
| Open the editor | Select `Map editor` | Opens the browser map editor in the same site |

Source: user-confirmed input and level-flow decisions; implementation: [`src/main.ts`](../../src/main.ts) and [`src/levels.ts`](../../src/levels.ts).

## Visual language

| State | Presentation | Purpose |
| --- | --- | --- |
| Ownership | Green = player, red = enemy, grey = neutral | Read who controls each node and route |
| Force | Rounded number inside each node | Read immediate strength |
| Node role | White base ring; gold resource ring and label | Identify production sources and victory target |
| Active transport | Owner-colored road with animated white triangles from transport source to target | Read occupancy and actual flow direction |
| Valid drag target | Green dashed arrow and target ring | Confirm a release will start a transport |
| Invalid drag | Grey dashed arrow and explicit guidance | Explain why no transport will start yet |
| Unsupported siege | Pulsing bright-red ring | Distinguish active attrition from the gold resource-node marker |

Source: user visual-feedback decisions and browser verification; implementation: [`src/main.ts`](../../src/main.ts), [`src/style.css`](../../src/style.css).

## Map-editor flow

| Action | Input | Result |
| --- | --- | --- |
| Load a map | Select `Load JSON`, then a `.json` file | A valid version-1 map replaces the draft; an invalid file leaves it unchanged and explains the correction needed |
| Select an object | Select a node or road in the preview | Shows only that object's editable fields in the inspector |
| Edit values | Use global settings and the selected-object inspector | Updates the draft and preview immediately; node ID changes preserve its road/transport references |
| Move a node | Drag the node body or enter exact `X` / `Y` values | Updates the node coordinates |
| Create a road | Drag a node's square connector onto another node | Adds and selects a width-1 road; selecting an existing connection chooses that road instead of duplicating it |
| Edit an initial transport | Select a road, then use its `Initial transport` subsection | Adds, edits, or removes that road's optional one transport |
| Navigate a large map | Drag empty preview space, use the wheel, or select `Fit map` | Pans or zooms the unbounded coordinate space without altering authored coordinates |
| Change collections | Select `Add node`, connector-drag a road, or a selected object's `Remove` action | Adds or removes the chosen draft item; removing a road also removes its initial transport |
| Save a map | Select `Save JSON` when the map is valid | Downloads formatted JSON under the current map filename |
| Playtest | Select `Playtest current map` when the draft is valid | Runs the current editor draft in the game without changing the authored map |
| Accelerate playtest | Move the playtest-only `Speed` bar from 1× up to 8× | Advances more fixed simulation steps per real second without changing the authored logic tick |
| Return from playtest | Select `Back to editor` | Restores the same draft and filename for continued editing |
| Reset | Select `Reset to MVP`, then confirm | Replaces the draft with the authored MVP map; canceling preserves the current draft |

The validation status states whether saving and playtesting are available and gives a specific correction when the draft is invalid. Failed file loads and canceled resets state that the current map was not changed. Source: error-state requirements from the error-message skill; implementation and browser evidence in [`src/editor.ts`](../../src/editor.ts) and [the map-editor progress record](../../agents/progress/2026-08-27-browser-map-editor.md).

## Final-exam play

After the four tutorials, the player should recognize that the nearby strong frontline is dangerous, see the distant resource as its source of support, capture that resource through the long flank route, siege the frontline, and then take the enemy base. The target final-exam run remains 2–4 minutes. Source: user tutorial goal and user-confirmed pacing/map decisions in the game progress record.
