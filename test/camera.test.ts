import { describe, expect, it } from "vitest";
import { Camera2D } from "../src/camera";

describe("Camera2D", () => {
  it("round-trips between world and screen coordinates", () => {
    const camera = new Camera2D(900, 560);
    camera.centerX = 1200;
    camera.centerY = -400;
    camera.zoom = 0.5;

    const screen = camera.worldToScreen({ x: 1500, y: 200 });
    expect(camera.screenToWorld(screen)).toEqual({ x: 1500, y: 200 });
  });

  it("keeps the world point under the pointer fixed while zooming", () => {
    const camera = new Camera2D(900, 560);
    const pointer = { x: 180, y: 120 };
    const before = camera.screenToWorld(pointer);

    camera.zoomAt(pointer, 2);

    expect(camera.screenToWorld(pointer).x).toBeCloseTo(before.x, 8);
    expect(camera.screenToWorld(pointer).y).toBeCloseTo(before.y, 8);
  });

  it("fits widely separated nodes inside the viewport", () => {
    const camera = new Camera2D(900, 560);
    const points = [{ x: -2_000, y: -1_000 }, { x: 8_000, y: 5_000 }];

    camera.fit(points, 70);

    for (const point of points) {
      const screen = camera.worldToScreen(point);
      expect(screen.x).toBeGreaterThanOrEqual(69.999);
      expect(screen.x).toBeLessThanOrEqual(830.001);
      expect(screen.y).toBeGreaterThanOrEqual(69.999);
      expect(screen.y).toBeLessThanOrEqual(490.001);
    }
    expect(camera.zoom).toBeLessThan(0.1);
  });

  it("pans in screen pixels without changing zoom", () => {
    const camera = new Camera2D(900, 560);
    camera.zoom = 2;

    camera.panByPixels(100, -40);

    expect(camera.centerX).toBe(400);
    expect(camera.centerY).toBe(300);
    expect(camera.zoom).toBe(2);
  });
});
