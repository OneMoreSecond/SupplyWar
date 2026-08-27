export interface Point2D { x: number; y: number; }

export class Camera2D {
  centerX: number;
  centerY: number;
  zoom = 1;

  constructor(readonly viewportWidth: number, readonly viewportHeight: number) {
    this.centerX = viewportWidth / 2;
    this.centerY = viewportHeight / 2;
  }

  worldToScreen(point: Point2D): Point2D {
    return {
      x: (point.x - this.centerX) * this.zoom + this.viewportWidth / 2,
      y: (point.y - this.centerY) * this.zoom + this.viewportHeight / 2,
    };
  }

  screenToWorld(point: Point2D): Point2D {
    return {
      x: (point.x - this.viewportWidth / 2) / this.zoom + this.centerX,
      y: (point.y - this.viewportHeight / 2) / this.zoom + this.centerY,
    };
  }

  panByPixels(dx: number, dy: number): void {
    this.centerX -= dx / this.zoom;
    this.centerY -= dy / this.zoom;
  }

  zoomAt(screenPoint: Point2D, multiplier: number): void {
    const anchor = this.screenToWorld(screenPoint);
    this.zoom = Math.max(0.02, Math.min(4, this.zoom * multiplier));
    this.centerX = anchor.x - (screenPoint.x - this.viewportWidth / 2) / this.zoom;
    this.centerY = anchor.y - (screenPoint.y - this.viewportHeight / 2) / this.zoom;
  }

  fit(points: readonly Point2D[], padding = 70): void {
    if (points.length === 0) return;
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    this.centerX = (minX + maxX) / 2;
    this.centerY = (minY + maxY) / 2;
    const availableWidth = Math.max(1, this.viewportWidth - padding * 2);
    const availableHeight = Math.max(1, this.viewportHeight - padding * 2);
    const widthZoom = maxX === minX ? 4 : availableWidth / (maxX - minX);
    const heightZoom = maxY === minY ? 4 : availableHeight / (maxY - minY);
    this.zoom = Math.max(0.02, Math.min(1, widthZoom, heightZoom));
  }
}
