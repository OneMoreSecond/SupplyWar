import { type Camera2D } from "./camera";

export interface CanvasDisplaySize { width: number; height: number; devicePixelRatio: number; }

export function prepareHiDPICanvas(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, camera: Camera2D): CanvasDisplaySize {
  const bounds = canvas.getBoundingClientRect();
  const width = Math.max(1, bounds.width);
  const height = Math.max(1, bounds.height);
  const devicePixelRatio = Math.max(1, window.devicePixelRatio || 1);
  const backingWidth = Math.round(width * devicePixelRatio);
  const backingHeight = Math.round(height * devicePixelRatio);
  if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
    canvas.width = backingWidth;
    canvas.height = backingHeight;
  }
  camera.resizeViewport(width, height);
  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  canvas.dataset.viewportWidth = width.toFixed(2);
  canvas.dataset.viewportHeight = height.toFixed(2);
  canvas.dataset.devicePixelRatio = devicePixelRatio.toFixed(2);
  return { width, height, devicePixelRatio };
}
