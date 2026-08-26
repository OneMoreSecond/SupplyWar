Task ID: 2026-08-26-game-demo-plan-grill

# Original request

Source: user instruction, 2026-08-26.

`$grill-me on current game demo plan in AGENTS.md`

---

# 1. Research

- The supplied project brief in `AGENTS.md` defines a browser MVP for a two-side supply-route strategy game inspired by Tentacle Wars. Source: `AGENTS.md`, project-doc section.
- The stated gameplay loop is: generate force at bases and captured resource nodes; drag along an unused adjacent road to transport; capture, reinforce, or attack depending on the destination; cancel to remove units on that road. Source: `AGENTS.md`, `Demo design > Play`.
- The game must demonstrate that a weaker human can beat a stronger, poorly positioned static enemy through supply-route decisions. Source: `AGENTS.md`, `MVP`.
- No game source files exist yet; the repository currently contains only `AGENTS.md`. Source: repository file listing, 2026-08-26.

| Term | Meaning in this review | Source |
| --- | --- | --- |
| MVP | The smallest playable map that tests the intended supply-route strategy | `AGENTS.md` |
| Core loop | The repeated player decision of selecting, sending, and cancelling forces over roads | Inference from `AGENTS.md` transport rules |
| Breakthrough | A rule intended to resolve a stalled frontline | `AGENTS.md` |
| Transport state | Whether an active road flow supports an allied destination or attacks an enemy destination | User response, 2026-08-26 |
| Siege | Accelerated force loss for an attacked node that has no support | `AGENTS.md` |
| Siege formula plugin | The replaceable component that calculates siege attrition | User response, 2026-08-26 |
| Backbone | The main ordered road chain in the authored map | User response, 2026-08-26 |
| Onboarding | The initial instructions that frame the player’s first tactical objective | User response, 2026-08-26 |

# 2. Constraint and Assumption

- Browser-based implementation is preferred. Source: `AGENTS.md`, `Tech stack`.
- Visual rendering and simulation should use separate ticks. Source: `AGENTS.md`, `Tech stack`.
- The initial enemy AI must not react to the player's attack. Source: `AGENTS.md`, `MVP`.
- The MVP excludes breakthrough, a formal map editor, external runtime formula plugins, capacity limits, browser end-to-end tests, and a detailed HUD. Source: user decisions, 2026-08-26.

# 3. Challenges

- Keep the engine’s simulation order identical to the balance model; a different ordering of production, arrival, cancellation, or siege can alter phase timing.
- Make support loss and siege visually obvious, because the player receives the intended tactic as a hint and must understand its effect in play.
- Verify that Canvas geometry yields the configured three-second critical-road latency without weakening the stated direct-versus-tactical scenario results.

# 4. Decisions

- Start the review from MVP success criteria, because they determine which mechanics and map topology are actually required. Source: grill-me review method and research above.
- The MVP is a playable prototype with one specially designed map that enables the intended tactical attack; its theoretical fun will be assessed through play. Source: user response, 2026-08-26.
- When the map loads, the enemy has pre-established transports in progress and initiates no further transports during the game. Source: user response, 2026-08-26.
- At each logic tick, an established transport whose endpoints remain unchanged refreshes its state from current node ownership. In particular, a changed target can turn an enemy support route into an attack route on the next tick. Source: user response, 2026-08-26.
- If a transport source changes owner, cancel the transport and remove its forces from the road. If only its target changes owner, keep the transport and refresh its state on the next logic tick. Source: user response, 2026-08-26.
- Include siege because it enables a weaker force to defeat a stronger force through supply tactics. Defer breakthrough because the authored MVP map need not require it. Source: user response, 2026-08-26.
- For the MVP, an attacked node is supported only by an active allied transport in `support` state targeting that node. A recent-delivery window is preferred for a later iteration, not this MVP. Source: user response, 2026-08-26.
- Implement siege attrition as a modular plugin. The MVP plugin removes a percentage of the current defender force per unit time while the node is attacked and unsupported. Source: user response, 2026-08-26.
- For the MVP, a siege plugin is an internal formula interface selected and parameterized by map or game configuration; it is not an external runtime mod system. Source: user response, 2026-08-26.
- The MVP siege plugin uses a real-time exponential half-life: `force *= 0.5^(elapsedSeconds / halfLifeSeconds)`. Source: user response, 2026-08-26.
- The authored map teaches the simplest supply tactic: capture a lightly defended upstream enemy source, cancel its support transport, then attack and siege its formerly reinforced frontline node. Source: user response, 2026-08-26.
- The upstream enemy source is a capturable resource node, so one node demonstrates both source capture and production ownership. Source: user response, 2026-08-26.
- The authored map uses this backbone: player base — enemy frontline (strong) — enemy resource (weak) — enemy backup-force node (strong) — enemy base. It also has roads from player base to enemy resource and from enemy frontline to enemy base. The intended sequence is to capture the resource through the first side road, siege the frontline, then siege the enemy base through the second side road. Source: user response, 2026-08-26.
- The map begins with two enemy support transports: enemy resource → enemy frontline, and enemy base → enemy backup force. The backup is supplied but bypassed by the intended winning route. Source: user response, 2026-08-26.
- Use one fixed authored map configuration for the MVP and tune its force amounts, production rates, road parameters, and siege half-life through play. Defer a formal map editor. Source: user response, 2026-08-26.
- A player-initiated transport is a continuous flow. Each logic tick it sends force from its source up to road throughput while force is available; it pauses, remains active, and resumes with later production if its source is empty. It ends only when cancelled or when its source changes owner. Source: user response, 2026-08-26.
- Target a 2–4 minute successful first playthrough for a player following the intended tactic after onboarding. This is a pacing constraint for force amounts, production, road latency, throughput, and siege half-life. Source: user response, 2026-08-26.
- For a roughly three-minute success path, target 30–45 seconds for resource capture, 45–60 seconds for frontline siege, and 45–60 seconds for base siege; reserve the remaining time for route recognition and input. Source: user response, 2026-08-26.
- When an attack exceeds a node's defenders, subtract the defender force and retain the attacking surplus as the captured node's garrison. Source: user response, 2026-08-26.
- If siege attrition reduces an actively attacked unsupported node to zero, it surrenders to the owner of the active attacking transport with zero garrison. Source: user response, 2026-08-26.
- Implement the MVP with vanilla TypeScript, Vite, and Canvas 2D. Keep the simulation independent from rendering. Source: user response, 2026-08-26.
- Store the map as a versioned JSON asset, load it at startup, and validate it against TypeScript-defined types. Source: user response, 2026-08-26.
- Validate the simulation with unit tests and deterministic intended-versus-direct-assault scenarios; separately perform a manual browser playtest for controls, feedback, and the 2–4 minute experience. Source: user response, 2026-08-26.
- MVP nodes have no force-storage capacity; force accumulates without a maximum. Source: user response, 2026-08-26.
- Derive the first numeric map configuration from the agreed phase budget, validate it with a deterministic balance model, then tune it through play. Source: user response, 2026-08-26.
- Right-clicking anywhere along a player-owned active road cancels that individual transport. Right-clicking an enemy or idle road does nothing. Source: user response, 2026-08-26.
- The MVP renderer includes ownership colors and force numbers, distinct base/resource markers, directional animation on active roads, and a visible siege cue for attacked unsupported nodes. Source: user response, 2026-08-26.
- Active transport routes use animated triangles that point from each active transport's source to its target, independent of a road's declared endpoint order. During a player drag, show a dashed arrow from the source to the pointer, highlight a valid adjacent destination, and state whether release will start the transport. Source: user instruction, 2026-08-26.
- Onboard the player with a brief mission statement that the strong enemy frontline threatens the player base but its supply line is vulnerable, plus controls, the base-capture objective, and an immediate hint to capture the enemy resource to break support. Source: user instruction, 2026-08-26.
- Place the enemy frontline near the player base, but place the enemy resource, backup, and base far away. The longer player-resource flank makes the enemy's rear-area supply relationship legible; road transit remains geometry-derived and its pacing must be revalidated. This supersedes the earlier equal-critical-road-length decision. Source: user instruction, 2026-08-26.
- Use a fixed 10 Hz logic tick and `requestAnimationFrame` rendering. Source: user response, 2026-08-26.
- Resolve remaining numeric choices with recommended defaults and keep them configurable in map or game configuration. Source: user response, 2026-08-26.

# 5. Design

Use a JSON-defined five-node map with a pure TypeScript simulation, a Canvas 2D view, and an internal siege-formula interface. The simulation owns all mutable game state and advances independently from rendering. The view reads simulation snapshots, draws nodes/roads/force values/state, and translates drag/right-click input into transport commands.

1. Advance logic in deterministic 0.1-second steps and render independently at browser-frame cadence.
2. Load and validate the JSON map, including all numeric defaults as editable configuration.
3. Implement transport, endpoint ownership, siege, capture, and production rules as pure simulation code.
4. Render the map with directional route markers and live drag feedback, then connect drag/right-click commands to the simulation.
5. Add unit/scenario tests for mechanics and the intended/direct paths; tune configuration after manual play.

# 6. Todo

- [x] Read the supplied game-demo plan and repository context.
- [x] Establish the question ledger and first decision branch.
- [x] Resolve the MVP success criterion with the user.
- [x] Resolve the enemy supply model that makes the tactical attack meaningful.
- [x] Resolve the interaction between player actions and in-flight enemy transports.
- [x] Resolve the interaction and state changes for transports whose endpoints change owner.
- [x] Decide whether siege and breakthrough mechanics are in the first prototype.
- [x] Define the siege support condition.
- [x] Choose the MVP siege attrition formula.
- [x] Define the siege-formula plugin boundary.
- [x] Define siege timing semantics.
- [x] Define the authored map's tactical sequence.
- [x] Define the source as a resource node.
- [x] Define the authored map topology and tactical sequence.
- [x] Define initial enemy transports.
- [x] Choose the balance approach and defer the map editor.
- [x] Define continuous transport behavior.
- [x] Define empty-source behavior for continuous transport.
- [x] Set intended successful-playthrough duration.
- [x] Allocate the intended playthrough duration.
- [x] Define attacker surplus on capture.
- [x] Define siege capture behavior.
- [x] Choose browser stack.
- [x] Define map-data boundary.
- [x] Define validation scope.
- [x] Define force storage behavior.
- [x] Define the initial numeric map configuration.
- [x] Define cancellation interaction.
- [x] Define minimum visual feedback.
- [x] Define player onboarding and playtest discovery boundary.
- [x] Define road-geometry variation scope.
- [x] Define logic and render tick cadence.
- [x] Review `AGENTS.md` for conflicts, outdated design, and duplicable MVP content.
- [x] Implement map data, simulation, renderer, input, and tests.
- [x] Validate the map through browser play and retain its initial configuration.
- [x] Make transport direction and in-progress drag state unambiguous.
- [x] Correct route-arrow orientation and make the enemy rear area spatially distant.
- [x] Add a flavor briefing that frames the tactical objective.
- [x] Summarize whether to proceed, revise, or stop.

# 7. Results

## 7.1 Initial numeric configuration

Source: deterministic model in `agents/tmp/2026-08-26-game-demo-plan-grill/script/balance_model.py`, 2026-08-26. These are first-pass values to validate again in the implemented engine and tune through manual play.

| Parameter | Initial value | Rationale |
| --- | --- | --- |
| Road latency | Geometry-derived at 0.015 seconds/unit: player → frontline is 200 units / 3.0 seconds; player → resource is 561.4 units / 8.4 seconds; resource → frontline is 375.7 units / 5.6 seconds; frontline → base is 555.6 units / 8.3 seconds. | Keeps the frontline immediately adjacent while making the rear-area flank visibly distant. |
| Road throughput | Width 1 × 1 force/width-unit/second = 1 force/second | Makes the resource and base support streams balance their own production. |
| Siege half-life | 35 seconds | Produces 45–60 second siege phases under the stated forces. |
| Player base | 45 initial force; 0.5 force/second | Can capture the resource but cannot overpower the supplied frontline. |
| Enemy resource | 38 initial force; 1 force/second | Is a 30–45 second flank capture and sustains frontline support before capture. |
| Enemy frontline | 70 initial force; no production | Is strong while supplied, then falls during siege. |
| Enemy backup | 80 initial force; no production | Is visibly strong but bypassed by the winning route. |
| Enemy base | 85 initial force; 1 force/second | Sustains the backup and becomes the final siege target. |

## 7.2 Close verification: tactical path

Method: simulate production, each road's JSON-derived geometry latency and width throughput, endpoint-change cancellation/refresh, a 35-second siege half-life, and surrender at zero force. The player attacks the resource, then starts resource → frontline after capture, then frontline → enemy base after frontline capture. Source: `agents/tmp/2026-08-26-game-demo-plan-grill/script/balance_model.py`.

| Milestone | Model result | Target | Result |
| --- | --- | --- | --- |
| Resource captured | 33.4 seconds | 30–45 seconds | Meets target |
| Frontline captured | 89.8 seconds | 45–60 seconds after resource | Meets target: 56.4 seconds |
| Enemy base captured | 143.0 seconds | 45–60 seconds after frontline | Meets target: 53.2 seconds |
| Total victory | 143.0 seconds | 2–4 minutes | Meets target |

Interpretation: the intended three-step route satisfies every agreed timing target in this deterministic model.

**Result: the initial configuration is suitable for engine implementation and manual tuning.**

## 7.3 Close verification: direct assault

Method: simulate player base → frontline while enemy resource → frontline remains active; all other parameters match Section 7.2. Source: `agents/tmp/2026-08-26-game-demo-plan-grill/script/balance_model.py`.

| Milestone | Model result |
| --- | --- |
| Frontline ownership after 240 seconds | Enemy |
| Frontline force after 240 seconds | 140.8 |

Interpretation: while support remains active, the direct assault cannot capture the frontline; it eventually loses momentum when the player-base flow exhausts its available force.

**Result: the model supports the intended claim that the supply cut, not a direct assault, enables victory.**

## 7.4 Limitation

The model is not the game engine. It verifies the chosen rules and values at a 0.1-second simulation step but does not validate Canvas input, geometry-derived latency, rendering, or player understanding. Engine scenario tests and a manual playtest remain required.

## 7.5 Review conclusion

Proceed with implementation. The MVP is a bounded vertical slice: a JSON-configured five-node map, 10 Hz deterministic simulation, Canvas feedback, continuous transports, supply-dependent siege, a direct tactical hint, and model-backed initial values.

Acceptance criteria:

- The JSON map loads and exposes numeric parameters without engine-code changes.
- Simulation tests cover transport cancellation/refresh, surplus capture, siege surrender, and the configured siege formula.
- The intended route captures resource, frontline, and base within the model’s timing targets; direct frontline assault does not capture the frontline while support remains active.
- Manual play confirms drag/right-click control, explicit state cues, and a satisfying 2–4 minute hinted playthrough.

Remaining risks are implementation verification, visual legibility, and real-player pacing—not unresolved product-design decisions. Mitigate them through the agreed scenario tests and manual tuning of configuration values.

## 7.6 Implementation and verification

Source: implementation and local validation, 2026-08-26.

| Requirement | Evidence | Result |
| --- | --- | --- |
| Browser implementation | `src/main.ts`, `src/game.ts`, `maps/mvp.json`; Vite serves the application. | Implemented |
| Separate ticks | Fixed 0.1-second simulation accumulator plus `requestAnimationFrame` renderer in `src/main.ts`. | Implemented |
| JSON map data | `maps/mvp.json` supplies node geometry, road widths, initial enemy transports, configurable values, and an internal siege-formula identifier; `validateMap` rejects invalid topology/settings. | Implemented |
| Supply, transport, siege, capture | Pure `Simulation` model covers continuous packets, source cancellation, target state refresh, active-support siege rule, configurable internal formula, surrender, and surplus garrisons. | Implemented |
| Input and feedback | Canvas supports drag-to-transport and right-click route cancellation; rendering shows ownership, force, node types, directional route triangles, siege rings, and a live drag preview. | Implemented |
| Automated validation | `npm run typecheck`, `npm test`, and `npm run build` passed. Seven Vitest cases cover geometry/width derivation, internal siege formula, endpoint rules, siege surrender, intended victory, and direct-assault failure. | Passed |
| Browser play | Headless Chromium executed the full hinted route at normal speed and reached `Victory — the enemy base surrendered.` after the distant-rear layout. Separate Canvas-input runs verified live drag feedback and player-route cancellation. Screenshots are in `agents/tmp/2026-08-26-game-demo-plan-grill/output/`. | Passed |

The completed browser route reached victory within the 2–4 minute target. The deterministic geometry-aware model predicts 143.0 simulation seconds; browser interaction waits add no balance risk.

## 7.7 Remaining risk

The application has been verified through automated simulation, production build, and headless-browser interaction. The only remaining non-blocking risk is qualitative feedback from additional human players; all MVP implementation and acceptance criteria are complete.

## 7.8 Completion audit

| Scope | Evidence | Status |
| --- | --- | --- |
| MVP map and rules | `maps/mvp.json` plus `src/game.ts`; 10 Hz logic, geometry/width roads, continuous transport, source cancellation, target refresh, internal siege formula, and surrender are implemented. | Complete |
| Player experience | `index.html`, `src/main.ts`, and Canvas CSS provide a mission briefing, hinted objective, drag/right-click control, colors, force values, active flow, node markers, and siege cue. | Complete |
| Map and balance | Seven simulation tests verify geometry-derived road timing, the formula, endpoint changes, siege, intended victory, and direct-assault failure. The geometry-aware balance model predicts 143.0-second tactical victory and direct-assault failure at 240 seconds. | Complete |
| Runnable browser deliverable | `npm run build` succeeded; Chromium completed the actual hinted route and reported victory. | Complete |
| Dependency health | `npm audit` reported no vulnerabilities. | Complete |

## 7.9 `AGENTS.md` review

Source: `AGENTS.md`, reviewed and updated 2026-08-26 against the decisions in Section 4.

### Resolved conflicts

| Previous `AGENTS.md` location | Conflict | Applied resolution |
| --- | --- | --- |
| Lines 20–22 | Stated that all players start only at their base and all other nodes are unoccupied. The MVP begins with enemy-held frontline, resource, and backup nodes. | Removed the universal initial-ownership claim; the linked MVP plan is authoritative. |
| Lines 48–54 | Required a breakthrough mechanism to avoid stalemate. The MVP explicitly defers breakthrough because its authored map does not need it. | Removed from `AGENTS.md`; deferred scope is recorded in the MVP plan. |

### Replaced design details

| Previous `AGENTS.md` location | Replaced content | Current MVP source |
| --- | --- | --- |
| Lines 30–41 | Broad transport rules omitted continuous flow, pause/resume, source-change cancellation, target-change refresh, and surplus capture. | Section 4. |
| Lines 43–46 | Siege formula remained `TODO`. | Section 4. |
| Lines 56–68 | Omitted directional transport animation and explicit siege feedback. | Section 4. |
| Lines 70–75 | Described a “basic computer AI” without the decisive initialization rule. | Section 4. |
| Lines 77–81 | Gave preferences rather than the selected implementation. | Sections 4–5. |
| Lines 83–85 | Term table was unfilled. | Section 1. |

### Consolidated MVP design

| Previous `AGENTS.md` location | Consolidated material | Applied replacement |
| --- | --- | --- |
| Lines 7–75 | Map, node, transport, siege, visualization, and scenario design. | Replaced with the root-relative link `agents/progress/2026-08-26-game-demo-plan-grill.md`. |
| Lines 77–81 | Selected MVP stack and tick model. | Retained only the durable separate-tick constraint. |

Applied approach: retain `AGENTS.md` as a concise project charter and repository instructions; put changeable MVP rules, values, and acceptance criteria in the linked task record.

Outcome: confirmed by the user and applied. `AGENTS.md` now retains only the project premise and durable constraints, with a relative link to this task record as the detailed MVP source of truth.

## 7.10 Transport feedback follow-up

Source: user visual-feedback report and local browser verification, 2026-08-26.

| Feedback issue | Change | Evidence | Result |
| --- | --- | --- | --- |
| Active transport direction was unclear. | Added animated white triangles, then corrected their endpoints to use each `Transport.source` → `Transport.target` rather than map road order. | `src/main.ts`; `agents/tmp/2026-08-26-game-demo-plan-grill/output/browser-drag-preview.png` | Direction is visible and correct on both initial enemy transports. |
| A drag had no visible in-progress state. | Added a dashed arrow from the player source to the pointer, a ring on a valid destination, release guidance, pointer capture, and cancellation cleanup. | `src/main.ts`; headless Chromium check in `agents/tmp/2026-08-26-game-demo-plan-grill/script/browser-drag-preview.mjs` | Holding Player Base → Enemy Resource reports `Release to send forces to Enemy Resource.` and visibly previews the action. |

Validation: `npm run typecheck`, `npm test` (seven tests), and `npm run build` passed. The headless-browser held-drag check passed and captured the evidence screenshot above.

## 7.11 Direction and rear-area layout correction

Source: user correction, map/configuration update, deterministic model, and Chromium playthrough, 2026-08-26.

| Requirement | Applied change | Verification |
| --- | --- | --- |
| Triangles follow transport direction. | The renderer draws each active road using `Transport.source` and `Transport.target`; only inactive roads retain map endpoint order. | Browser screenshot shows resource → frontline arrows pointing up-left and enemy base → backup arrows pointing downward. |
| Enemy rear area is far from the player. | `maps/mvp.json` keeps Player Base → Enemy Frontline at 200 units, and moves Enemy Resource, Enemy Backup, and Enemy Base to 561.4, 754.4, and 750.1 units from Player Base respectively. | Browser screenshot visibly separates the rear area; the map remains planar. |
| Tactical path remains viable. | The balance model now reads `maps/mvp.json` geometry per route rather than assuming a fixed latency. | Resource/frontline/base capture at 33.4/89.8/143.0 seconds; direct assault leaves the frontline enemy-held at 240 seconds; full normal-speed Chromium route reaches victory. |

## 7.12 Mission briefing

Source: user instruction and implementation, 2026-08-26.

The level header now frames the tactical situation before the action hint: “The enemy's strong frontline threatens our base. But their supply line is vulnerable—break it.” The unchanged next line still directs the MVP route: capture the enemy resource, then attack the unsupported frontline.
