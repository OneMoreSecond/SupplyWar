# From MVP to Demo

update requirement from "playable" to "really fun".

## Scaling

### Large map

Create large maps consisting dozens of nodes, then the player can expand their territory.
Expected game time on such maps would increase to 10-15 minutes.
Typical stages include:

1. both players expand their node control
2. frontline touch and battle, usually around resource nodes
3. One side breaks the balance and enlarge advantage
4. finalize the game

#### Diversity of micro map component

To enrich the playing experience, there should be multiple kinds of micro component in the large map.
For example:

- Resource nodes with different production
- roads with different width level, resulting the difficulty of transport.
- Bad roads slowing down the speed.
- Urban area with dense roads, and Rural area with sparse roads.
- Special design allowing ambush, under Fog of War.

#### Strategy of resource allocation

Suppose resource nodes are sparse along all nodes, then total available force would be bounded by the resource node.

This forces the player to choose where to put their force.

#### Longer road

Large map allows longer road, enabling sudden attack.

### Computer AI

To make the whole process a challenge to the player, the computer AI must be actionable.
The expectation is like:

- try to control occupied nodes
- focus on resource node
- try to attack weak or bad-positioned enemy nodes.

The rule-based system should be enough to achieve a fun experience.

## Mechanism update

### Siege

Change: update the criteria from "no income support" to "not support route from resource or base".
The goal is prevent "circle support" of isolated nodes.

This change would make resource and base nodes unable to be sieged, and become the stabilizer of frontline.

### Destabilize

It can be imaged the frontline would be hard to move, like the case in World War I.

So I want to introduce some destabilization mechanism:

- Cast powerful skills, like destroying force in target node directly, or slow down enemy transport. Computer AI can also cast them.
- Randomly triggered events for attacking transport, like halving the force in defense node.
- You may propose others

The expectation is making the war state up and down, and finally not revertible.

### Information mechanism

In MVP the whole map is visible to both players.
We may want to introduce Fog or War: The player can only see nodes adjacent to occupied nodes.

## UI/UX update

The visual style can reference the `Mini Metro` experience.
For new mechanisms, please also consider how to present them well to the player.

Following points are only a part of it.
You may do other changes by yourself to improve.

### Refine shape

Use different shape for different nodes:

- Star for base
- Square for resource

### Font

To choose some fonts more suitable for the game theme.
