"""Deterministic first-pass balance model for the authored MVP map."""

from __future__ import annotations

from dataclasses import dataclass
from math import exp, log


DT_SECONDS = 0.1
SIEGE_HALF_LIFE_SECONDS = 35.0
ROAD_LATENCY_SECONDS = 3.0
ROAD_THROUGHPUT_PER_SECOND = 1.0
SIMULATION_SECONDS = 240.0


@dataclass
class Node:
    name: str
    owner: str
    force: float
    production_per_second: float
    is_base: bool = False


@dataclass
class Transport:
    source: str
    target: str
    owner: str
    active: bool = True
    queued_force: list[tuple[float, float]] | None = None

    def __post_init__(self) -> None:
        if self.queued_force is None:
            self.queued_force = []

    def mode(self, nodes: dict[str, Node]) -> str:
        if nodes[self.target].owner == self.owner:
            return "support"
        return "attack"


def deliver_due_force(
    nodes: dict[str, Node], transports: list[Transport], now: float
) -> list[str]:
    events: list[str] = []
    for transport in transports:
        if not transport.active:
            continue
        due_force = 0.0
        pending_force: list[tuple[float, float]] = []
        for arrival_time, force in transport.queued_force:
            if arrival_time <= now:
                due_force += force
            else:
                pending_force.append((arrival_time, force))
        transport.queued_force = pending_force
        if due_force == 0.0:
            continue

        target = nodes[transport.target]
        if target.owner == transport.owner:
            target.force += due_force
            continue

        target.force -= due_force
        if target.force <= 0.0:
            surplus = -target.force
            target.owner = transport.owner
            target.force = surplus
            events.append(f"{now:5.1f}s {target.name} captured by delivery")
    return events


def refresh_transports(nodes: dict[str, Node], transports: list[Transport]) -> None:
    for transport in transports:
        if not transport.active:
            continue
        if nodes[transport.source].owner != transport.owner:
            transport.active = False
            transport.queued_force = []


def apply_siege(nodes: dict[str, Node], transports: list[Transport], now: float) -> list[str]:
    events: list[str] = []
    for node in nodes.values():
        attackers = [
            transport
            for transport in transports
            if transport.active
            and transport.target == node.name
            and transport.mode(nodes) == "attack"
        ]
        supporters = [
            transport
            for transport in transports
            if transport.active
            and transport.target == node.name
            and transport.mode(nodes) == "support"
        ]
        if not attackers or supporters:
            continue

        node.force *= exp(-log(2) * DT_SECONDS / SIEGE_HALF_LIFE_SECONDS)
        if node.force <= 0.01:
            node.owner = attackers[0].owner
            node.force = 0.0
            events.append(f"{now:5.1f}s {node.name} surrendered under siege")
    return events


def dispatch_force(nodes: dict[str, Node], transports: list[Transport], now: float) -> None:
    for transport in transports:
        if not transport.active:
            continue
        source = nodes[transport.source]
        if source.owner != transport.owner:
            continue
        sent_force = min(source.force, ROAD_THROUGHPUT_PER_SECOND * DT_SECONDS)
        source.force -= sent_force
        if sent_force > 0.0:
            transport.queued_force.append((now + ROAD_LATENCY_SECONDS, sent_force))


def produce_force(nodes: dict[str, Node]) -> None:
    for node in nodes.values():
        node.force += node.production_per_second * DT_SECONDS


def run_intended_path() -> list[str]:
    nodes = {
        "player_base": Node("player_base", "player", 45.0, 0.5, True),
        "frontline": Node("frontline", "enemy", 70.0, 0.0),
        "resource": Node("resource", "enemy", 38.0, 1.0),
        "backup": Node("backup", "enemy", 80.0, 0.0),
        "enemy_base": Node("enemy_base", "enemy", 85.0, 1.0, True),
    }
    transports = [
        Transport("resource", "frontline", "enemy"),
        Transport("enemy_base", "backup", "enemy"),
        Transport("player_base", "resource", "player"),
    ]
    events: list[str] = []
    started_frontline_attack = False
    started_base_attack = False

    for tick in range(int(SIMULATION_SECONDS / DT_SECONDS)):
        now = tick * DT_SECONDS
        produce_force(nodes)
        events.extend(deliver_due_force(nodes, transports, now))
        refresh_transports(nodes, transports)

        if nodes["resource"].owner == "player" and not started_frontline_attack:
            transports.append(Transport("resource", "frontline", "player"))
            started_frontline_attack = True
            events.append(f"{now:5.1f}s player starts resource -> frontline")

        events.extend(apply_siege(nodes, transports, now))
        refresh_transports(nodes, transports)

        if nodes["frontline"].owner == "player" and not started_base_attack:
            transports.append(Transport("frontline", "enemy_base", "player"))
            started_base_attack = True
            events.append(f"{now:5.1f}s player starts frontline -> enemy_base")

        dispatch_force(nodes, transports, now)
        if nodes["enemy_base"].owner == "player":
            events.append(f"{now:5.1f}s intended path wins")
            break
    return events


def run_direct_assault() -> tuple[list[str], Node]:
    nodes = {
        "player_base": Node("player_base", "player", 45.0, 0.5, True),
        "frontline": Node("frontline", "enemy", 70.0, 0.0),
        "resource": Node("resource", "enemy", 38.0, 1.0),
        "backup": Node("backup", "enemy", 80.0, 0.0),
        "enemy_base": Node("enemy_base", "enemy", 85.0, 1.0, True),
    }
    transports = [
        Transport("resource", "frontline", "enemy"),
        Transport("enemy_base", "backup", "enemy"),
        Transport("player_base", "frontline", "player"),
    ]
    events: list[str] = []
    for tick in range(int(SIMULATION_SECONDS / DT_SECONDS)):
        now = tick * DT_SECONDS
        produce_force(nodes)
        events.extend(deliver_due_force(nodes, transports, now))
        refresh_transports(nodes, transports)
        events.extend(apply_siege(nodes, transports, now))
        dispatch_force(nodes, transports, now)
        if nodes["frontline"].owner == "player":
            events.append(f"{now:5.1f}s direct assault unexpectedly captured frontline")
            break
    return events, nodes["frontline"]


def main() -> None:
    print("Intended path")
    for event in run_intended_path():
        print(event)

    direct_events, frontline = run_direct_assault()
    print("\nDirect assault")
    for event in direct_events:
        print(event)
    print(
        f"240.0s frontline owner={frontline.owner} force={frontline.force:.1f}"
    )


if __name__ == "__main__":
    main()
