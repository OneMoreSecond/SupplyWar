# MVP User Experience

Source: user-confirmed onboarding and visual-feedback decisions in [the progress record](../../agents/progress/2026-08-26-game-demo-plan-grill.md), Sections 4 and 7, summarized on 2026-08-26.

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

## Intended first play

The player should understand that the nearby strong frontline is dangerous, see the distant resource as its source of support, capture that resource through the long flank route, siege the frontline, and then take the enemy base. The target successful run is 2–4 minutes with the onboarding shown above. Source: user-confirmed pacing and map decisions in the progress record.
