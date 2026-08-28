import { type Camera2D, type Point2D } from "./camera";
import { prepareHiDPICanvas } from "./canvas";
import { type NodeState, type Owner, type RoadV2, type Simulation, type Transport } from "./game";
import { type VisibilityProjection } from "./visibility";

const colors: Record<Owner, string> = { player: "#42c97a", enemy: "#ed5d62", neutral: "#8d9aa7" };

function pointLineDistance(point: Point2D, a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point.x - a.x, point.y - a.y);
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (a.x + dx * t), point.y - (a.y + dy * t));
}

export class GameView {
  private readonly context: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly camera: Camera2D) {
    this.context = canvas.getContext("2d")!;
  }

  private nodeRadius(): number { return Math.max(27, 32 * this.camera.zoom); }
  private labelsVisible(): boolean { return this.camera.zoom >= 0.65; }

  nodeAt(game: Simulation, visibility: VisibilityProjection, point: Point2D): NodeState | undefined {
    return [...game.nodes.values()].find((node) => {
      if (visibility.nodeVisibility(node.id) !== "visible") return false;
      const screen = this.camera.worldToScreen(node);
      return Math.hypot(screen.x - point.x, screen.y - point.y) < this.nodeRadius() + 3;
    });
  }

  transportAt(game: Simulation, visibility: VisibilityProjection, point: Point2D, predicate: (transport: Transport) => boolean): Transport | undefined {
    return game.transports
      .filter((transport) => transport.active && visibility.isTransportVisible(transport) && predicate(transport))
      .find((transport) => {
        const a = this.camera.worldToScreen(game.node(transport.source));
        const b = this.camera.worldToScreen(game.node(transport.target));
        return pointLineDistance(point, a, b) < 16;
      });
  }

  draw(game: Simulation, visibility: VisibilityProjection, dragSource: string | null, dragPoint: Point2D | null): void {
    const display = prepareHiDPICanvas(this.canvas, this.context, this.camera);
    this.canvas.dataset.nodeRadius = this.nodeRadius().toFixed(2);
    this.canvas.dataset.nodeLabelsVisible = String(this.labelsVisible());
    this.context.clearRect(0, 0, display.width, display.height);
    this.context.fillStyle = "#17212b";
    this.context.fillRect(0, 0, display.width, display.height);
    for (const road of game.roads.values()) {
      if (!visibility.isRoadDiscovered(road)) continue;
      const active = game.activeOnRoad(road.id);
      const visibleTransport = active && visibility.isTransportVisible(active) ? active : undefined;
      this.drawRoad(game, road, visibleTransport, visibleTransport ? game.node(visibleTransport.source) : game.node(road.a), visibleTransport ? game.node(visibleTransport.target) : game.node(road.b));
    }
    this.drawDragPreview(game, visibility, dragSource, dragPoint);
    for (const node of game.nodes.values()) this.drawNode(game, visibility, node);
  }

  private drawDirectionTriangle(a: Point2D, b: Point2D, t: number, color: string): void {
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    this.context.save();
    this.context.translate(x, y);
    this.context.rotate(Math.atan2(b.y - a.y, b.x - a.x));
    this.context.fillStyle = color;
    this.context.beginPath();
    this.context.moveTo(9, 0);
    this.context.lineTo(-6, -6);
    this.context.lineTo(-6, 6);
    this.context.closePath();
    this.context.fill();
    this.context.restore();
  }

  private drawRoad(game: Simulation, road: RoadV2, transport: Transport | undefined, a: NodeState, b: NodeState): void {
    const screenA = this.camera.worldToScreen(a);
    const screenB = this.camera.worldToScreen(b);
    this.context.lineWidth = transport ? Math.max(6, road.width * 5) : 2 + road.width * 2;
    const interdicted = transport && !game.isTransportOperational(transport);
    this.context.strokeStyle = interdicted ? "#d89cff" : transport ? colors[transport.owner] : "#536475";
    this.context.globalAlpha = transport ? 0.82 : 0.8;
    this.context.setLineDash(road.travelTimeMultiplier > 1 ? [10, 4 + road.travelTimeMultiplier * 3] : []);
    this.context.beginPath();
    this.context.moveTo(screenA.x, screenA.y);
    this.context.lineTo(screenB.x, screenB.y);
    this.context.stroke();
    this.context.globalAlpha = 1;
    this.context.setLineDash([]);
    if (!transport) return;
    if (interdicted) {
      const remaining = Math.max(0, transport.interdictedUntil - game.time);
      this.context.fillStyle = "#f1d9ff";
      this.context.font = "700 12px Barlow, system-ui";
      this.context.textAlign = "center";
      this.context.fillText(`${remaining.toFixed(1)}s`, (screenA.x + screenB.x) / 2, (screenA.y + screenB.y) / 2 - 10);
      return;
    }
    const phase = game.time % 1;
    for (let index = 0; index < 3; index++) this.drawDirectionTriangle(screenA, screenB, 0.14 + ((phase + index / 3) % 1) * 0.72, "#f7fbff");
  }

  private drawNodeShape(node: NodeState, x: number, y: number, radius: number): void {
    this.context.beginPath();
    if (node.kind === "base") {
      for (let index = 0; index < 10; index++) {
        const angle = -Math.PI / 2 + index * Math.PI / 5;
        const distance = index % 2 === 0 ? radius : radius * 0.48;
        const pointX = x + Math.cos(angle) * distance;
        const pointY = y + Math.sin(angle) * distance;
        if (index === 0) this.context.moveTo(pointX, pointY); else this.context.lineTo(pointX, pointY);
      }
      this.context.closePath();
      return;
    }
    if (node.kind === "resource") {
      const half = radius * 0.78;
      this.context.rect(x - half, y - half, half * 2, half * 2);
      return;
    }
    this.context.arc(x, y, radius, 0, Math.PI * 2);
  }

  private drawDragPreview(game: Simulation, visibility: VisibilityProjection, dragSource: string | null, dragPoint: Point2D | null): void {
    if (!dragSource || !dragPoint) return;
    const source = this.camera.worldToScreen(game.node(dragSource));
    const target = this.nodeAt(game, visibility, dragPoint);
    const road = target ? game.roadBetween(dragSource, target.id) : undefined;
    const valid = target !== undefined && target.id !== dragSource && road !== undefined && !game.activeOnRoad(road.id) && !game.isGuarded(target.id, "player");
    const color = valid ? colors.player : "#b9c5d0";
    this.context.save();
    this.context.setLineDash([9, 7]);
    this.context.lineWidth = 4;
    this.context.strokeStyle = color;
    this.context.globalAlpha = 0.9;
    this.context.beginPath();
    this.context.moveTo(source.x, source.y);
    this.context.lineTo(dragPoint.x, dragPoint.y);
    this.context.stroke();
    this.context.restore();
    this.drawDirectionTriangle(source, dragPoint, 0.82, color);
    if (!valid || !target) return;
    const targetScreen = this.camera.worldToScreen(target);
    this.context.strokeStyle = color;
    this.context.lineWidth = 4;
    this.context.beginPath();
    this.context.arc(targetScreen.x, targetScreen.y, this.nodeRadius() + 7, 0, Math.PI * 2);
    this.context.stroke();
  }

  private drawNode(game: Simulation, visibility: VisibilityProjection, node: NodeState): void {
    const screen = this.camera.worldToScreen(node);
    const radius = this.nodeRadius();
    const nodeVisibility = visibility.nodeVisibility(node.id);
    if (nodeVisibility === "unknown") return;
    if (nodeVisibility === "discovered") {
      this.context.globalAlpha = 0.42;
      this.context.fillStyle = "#52606d";
      this.drawNodeShape(node, screen.x, screen.y, Math.max(23, radius - 4));
      this.context.fill();
      this.context.strokeStyle = "#8795a3";
      this.context.lineWidth = 2;
      this.context.stroke();
      if (this.labelsVisible()) {
        this.context.fillStyle = "#a5b0ba";
        this.context.font = "600 11px Barlow, system-ui";
        this.context.textAlign = "center";
        this.context.fillText(node.label, screen.x, screen.y + radius + 20);
      }
      this.context.globalAlpha = 1;
      return;
    }
    const attacked = game.transports.some((transport) => game.isTransportOperational(transport) && transport.target === node.id && game.mode(transport) === "attack");
    if (attacked && !game.isSupplied(node.id)) {
      this.context.strokeStyle = "#ff334d";
      this.context.lineWidth = 5;
      this.context.beginPath();
      this.context.arc(screen.x, screen.y, radius + 9 + Math.sin(game.time * 5) * 2, 0, Math.PI * 2);
      this.context.stroke();
    }
    this.context.fillStyle = colors[node.owner];
    this.drawNodeShape(node, screen.x, screen.y, radius);
    this.context.fill();
    this.context.strokeStyle = node.kind === "base" ? "#fff" : node.kind === "resource" ? "#f0bd4f" : "#1a2530";
    this.context.lineWidth = node.kind === "ordinary" ? 2 : 5;
    this.context.stroke();
    this.context.fillStyle = "#10151c";
    this.context.font = "700 18px Barlow, system-ui";
    this.context.textAlign = "center";
    this.context.fillText(String(Math.round(node.force)), screen.x, screen.y + 6);
    if (game.isGuarded(node.id, "player")) {
      const markerX = screen.x + radius * 0.72;
      const markerY = screen.y - radius * 0.72;
      this.context.fillStyle = "#f0bd4f";
      this.context.beginPath();
      this.context.moveTo(markerX, markerY - 7);
      this.context.lineTo(markerX + 7, markerY - 2);
      this.context.lineTo(markerX + 5, markerY + 7);
      this.context.lineTo(markerX, markerY + 10);
      this.context.lineTo(markerX - 5, markerY + 7);
      this.context.lineTo(markerX - 7, markerY - 2);
      this.context.closePath();
      this.context.fill();
    }
    if (this.labelsVisible()) {
      this.context.fillStyle = "#dbe7ef";
      this.context.font = "600 11px Barlow, system-ui";
      this.context.fillText(node.label, screen.x, screen.y + radius + 20);
    }
    if (node.kind === "ordinary") return;
    this.context.fillStyle = "#f0bd4f";
    this.context.font = "700 11px Barlow, system-ui";
    this.context.fillText(node.kind === "resource" ? `+${node.production}/s` : "BASE", screen.x, screen.y - radius - 12);
  }
}
