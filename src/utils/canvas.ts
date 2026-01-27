// Utility: canvas measurement & autoscale
function createMeasureContext(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  return canvas.getContext("2d");
}

export function estimateFontSizeForText(
  text: string,
  maxWidth: number,
  fontFamily = "Times New Roman, serif",
  fontWeight = "500",
  minSize = 6,
  maxSize = 300
): number {
  if (!text) return minSize;
  const ctx = createMeasureContext();
  if (!ctx) return minSize;
  let lo = minSize;
  let hi = maxSize;
  const padding = 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    ctx.font = `${fontWeight} ${mid}px ${fontFamily}`;
    const w = ctx.measureText(text).width;
    if (w + padding <= maxWidth) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return Math.max(minSize, hi);
}

// Global Constants
export const PREVIEW_SIZE = 300;
export const EXPORT_SIZE = 520;
export const defaultEditorImg = "/mnt/data/Screenshot 2025-12-04 195246.png";
