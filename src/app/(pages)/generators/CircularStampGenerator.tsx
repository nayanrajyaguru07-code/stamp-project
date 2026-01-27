/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { JSX, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { LineStyle, Mode } from "@/types";
import { defaultEditorImg } from "@/utils/canvas";

/**
 * CircularStampGenerator
 *
 * (kept your original comments/behavior)
 */

interface CircularStampGeneratorProps {
  color: string;
  fontFamily: string;
  lineStyle: LineStyle;
  transparentBg: boolean;
  fontWeight: "bold" | "normal";
  exportSize: number;
  credits?: number;
  allowMirror?: boolean;
  registerExportHandlers?: (handlers: {
    downloadPNG: () => Promise<void>;
    downloadSVG: () => Promise<void>;
  }) => void;
  onExportSuccess?: () => void;
}

/* ---------------- UTILITY: HEX -> CMYK (for display) ---------------- */
const hexToCMYK = (hex: string): string => {
  let c = 0,
    m = 0,
    y = 0,
    k = 0;
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  if (r === 0 && g === 0 && b === 0) {
    k = 1;
    return `C:0% M:0% Y:0% K:100%`;
  }

  const computedC = 1 - r / 255;
  const computedM = 1 - g / 255;
  const computedY = 1 - b / 255;

  const minCMY = Math.min(computedC, computedM, computedY);

  c = (computedC - minCMY) / (1 - minCMY);
  m = (computedM - minCMY) / (1 - minCMY);
  y = (computedY - minCMY) / (1 - minCMY);
  k = minCMY;

  return `C:${Math.round(c * 100)}% M:${Math.round(m * 100)}% Y:${Math.round(
    y * 100,
  )}% K:${Math.round(k * 100)}%`;
};

/* ---------------- UTILITY: file -> base64 data URL ---------------- */
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

/* ---------------- UTILITY: embed <image> tags into SVG clone as data URLs ---------------- */
const embedImagesInSVG = async (svgEl: SVGSVGElement) => {
  const imgs = Array.from(svgEl.querySelectorAll("image")) as SVGImageElement[];
  for (const imgEl of imgs) {
    try {
      const href =
        imgEl.getAttribute("href") || imgEl.getAttribute("xlink:href");
      if (!href) continue;
      if (href.startsWith("data:")) continue; // already embedded

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = href;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image load failed"));
      });

      const tmp = document.createElement("canvas");
      tmp.width = img.naturalWidth || img.width || 1;
      tmp.height = img.naturalHeight || img.height || 1;
      const ctx = tmp.getContext("2d");
      if (!ctx) continue;
      ctx.clearRect(0, 0, tmp.width, tmp.height);
      ctx.drawImage(img, 0, 0, tmp.width, tmp.height);

      const dataUrl = tmp.toDataURL("image/png");
      imgEl.setAttribute("href", dataUrl);
    } catch (err) {
      // If embedding fails (CORS, etc.), continue — download will still try raw SVG route.
      // Console a warning so developers can debug.
      console.warn("Failed to embed image into SVG (CORS?):", err);
    }
  }
};

/* ---------------- Export helpers: download SVG & PNG ---------------- */
const downloadSVG = async (svgRef: React.RefObject<SVGSVGElement | null>) => {
  if (!svgRef.current) return;
  const svgEl = svgRef.current;
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

  // Try embedding images for robust exports
  await embedImagesInSVG(clone);

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "circular-stamp.svg";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast.success("SVG saved successfully!");
};

const downloadPNG = async (
  svgRef: React.RefObject<SVGSVGElement | null>,
  size: number,
  scale = 2,
) => {
  if (!svgRef.current) return;
  const svgEl = svgRef.current;
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

  await embedImagesInSVG(clone);

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  const svgBlob = new Blob([svgString], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(svgBlob);
  const finalSize = Math.round(size * scale);

  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
    });

    const canvas = document.createElement("canvas");
    canvas.width = finalSize;
    canvas.height = finalSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");

    // transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob: Blob | null = await new Promise((res) =>
      canvas.toBlob((b) => res(b), "image/png"),
    );
    if (!blob) throw new Error("Failed to create PNG blob");

    const pngUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = `circular-stamp_${finalSize}px.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(pngUrl);

    toast.success(`PNG saved successfully! (${finalSize}px)`);
  } catch (err) {
    // fallback: try SVG download to at least give user something
    console.error("PNG export failed:", err);
    toast.error("Failed to export PNG. Attempting SVG fallback...");
    await downloadSVG(svgRef);
  } finally {
    URL.revokeObjectURL(url);
  }
};

/* ---------------- Component ---------------- */
export function CircularStampGenerator({
  color,
  fontFamily,
  lineStyle,
  transparentBg,
  fontWeight,
  exportSize,
  allowMirror = false,
  credits = 0,
  registerExportHandlers,
  onExportSuccess,
}: CircularStampGeneratorProps): JSX.Element {
  const svgFontWeight = fontWeight === "bold" ? "700" : "400";

  // Local editable state
  const [centerText, setCenterText] = useState<string>(
    "nayan rajyaguru kishorbhu",
  );
  const [outerText, setOuterText] = useState<string>("A O M Y C O M P A N Y");
  const [outerTextRotation, setOuterTextRotation] = useState<number>(0);
  const [centerFontSize, setCenterFontSize] = useState<number | "auto">("auto");
  const [outerFontSize, setOuterFontSize] = useState<number>(25);
  const [rmode, rsetMode] = useState<Mode>("text");
  const [rimgSrc, rsetImgSrc] = useState<string>(defaultEditorImg); // stores base64 or default
  const [rimgZoom, rsetImgZoom] = useState<number>(100);
  const [rimgOffsetX, rsetImgOffsetX] = useState<number>(0);
  const [rimgOffsetY, rsetImgOffsetY] = useState<number>(0);
  const [rtextOffsetX, rsetTextOffsetX] = useState<number>(0);
  const [rtextOffsetY, rsetTextOffsetY] = useState<number>(0);

  // Mirroring inside preview — parent also may mirror via svgForExport but preview should reflect it
  const [isMirrored, setIsMirrored] = useState<boolean>(false);

  // Pop animation states
  const [isPoppingPNG, setIsPoppingPNG] = useState<boolean>(false);
  const [isPoppingSVG, setIsPoppingSVG] = useState<boolean>(false);

  const size = 420;
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = size / 2 - 40;
  const textRadius = outerRadius - 18;
  const innerBandR = outerRadius - 40;
  const centerAllowedRadius = innerBandR - 10;
  const centerAllowedDiameter = centerAllowedRadius * 2;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  /* ---------------- File handling ---------------- */
  const handleFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      const base64Url = await fileToBase64(file);
      rsetImgSrc(base64Url);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Image processing error:", error);
      toast.error("Failed to load image. Ensure it's a valid image file.");
    }
  };

  /* ---------------- Layout logic (center text sizing etc.) ---------------- */
  const chars = useMemo(() => {
    const normalized = outerText.replace(/\s+/g, " ").trim();
    return normalized.length ? Array.from(normalized) : [];
  }, [outerText]);

  function computeSingleLine(text: string, forcedSize: number | "auto") {
    const maxFont = 60;
    const minFont = 10;
    const padding = 12;
    const approxCharWidthFactor = 0.58;
    const singleLine = text.replace(/\n/g, " ").trim() || " ";
    if (forcedSize !== "auto") {
      return { font: Number(forcedSize), line: singleLine };
    }
    for (let font = maxFont; font >= minFont; font--) {
      const approxWidth = singleLine.length * font * approxCharWidthFactor;
      if (approxWidth + padding * 2 <= centerAllowedDiameter) {
        return { font, line: singleLine };
      }
    }
    return { font: minFont, line: singleLine };
  }

  const centerLayout = useMemo(
    () => computeSingleLine(centerText || "", centerFontSize),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [centerText, centerAllowedDiameter, centerFontSize],
  );

  const baseImageBoxSize = Math.round(centerAllowedDiameter * 0.82);
  const imgScale = rimgZoom / 100;
  const imgDisplaySize = Math.max(8, Math.round(baseImageBoxSize * imgScale));
  const imageTopLeftX = Math.round(cx - imgDisplaySize / 2 + rimgOffsetX);
  const imageTopLeftY = Math.round(cx - imgDisplaySize / 2 + rimgOffsetY);

  const rquickPositionImg = (pos: "left" | "center" | "right") => {
    const maxOffset = Math.round(centerAllowedRadius * 0.5);
    if (pos === "left") rsetImgOffsetX(-maxOffset);
    else if (pos === "right") rsetImgOffsetX(maxOffset);
    else rsetImgOffsetX(0);
  };

  /* ---------------- expose handlers to parent if requested ---------------- */
  useEffect(() => {
    if (!registerExportHandlers) return;
    const handlers = {
      downloadPNG: async () => {
        if (credits <= 0) {
          toast.error("No credits remaining. plz Buy it.");
          return;
        }
        // animate pop for programmatic export as well
        setIsPoppingPNG(true);
        setTimeout(() => setIsPoppingPNG(false), 200);
        await downloadPNG(svgRef, exportSize, 2);
        onExportSuccess?.();
      },
      downloadSVG: async () => {
        if (credits <= 0) {
          toast.error("No credits remaining. plz Buy it ");
          return;
        }
        setIsPoppingSVG(true);
        setTimeout(() => setIsPoppingSVG(false), 200);
        await downloadSVG(svgRef);
        onExportSuccess?.();
      },
    };
    try {
      registerExportHandlers(handlers);
    } catch (err) {
      // ignore
    }
  }, [exportSize, credits, registerExportHandlers, onExportSuccess]);

  /* ---------------- Internal wrappers used by this component's own buttons ---------------- */
  const internalDownloadPNG = async () => {
    // trigger pop animation regardless; if no credits, show toast and do not download
    setIsPoppingPNG(true);
    setTimeout(() => setIsPoppingPNG(false), 200);

    if (credits <= 0) {
      toast.error("No credits remaining. plz Buy it");
      return;
    }
    await downloadPNG(svgRef, exportSize, 2);
    onExportSuccess?.();
  };

  const internalDownloadSVG = async () => {
    setIsPoppingSVG(true);
    setTimeout(() => setIsPoppingSVG(false), 200);

    if (credits <= 0) {
      toast.error("No credits remaining. plz Buy it");
      return;
    }
    await downloadSVG(svgRef);
    onExportSuccess?.();
  };

  const dashForPreview = (style: LineStyle) => {
    if (style === "dotted") return "4, 8";
    if (style === "dashed") return "16, 8";
    return undefined;
  };

  /* ---------------- UI ---------------- */
  return (
    <main className="min-h-full p-4">
      <section className="w-full">
        {/* Responsive layout: column on small, row on md+ */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Controls */}
          <div className="w-full md:w-1/2 bg-white rounded p-4 shadow-sm space-y-4">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => rsetMode("text")}
                className={`px-3 py-1 rounded ${
                  rmode === "text" ? "bg-blue-600 text-white" : "bg-gray-100"
                }`}
              >
                Text
              </button>
              <button
                onClick={() => rsetMode("image")}
                className={`px-3 py-1 rounded ${
                  rmode === "image" ? "bg-blue-600 text-white" : "bg-gray-100"
                }`}
              >
                Image
              </button>
              <button
                onClick={() => rsetMode("both")}
                className={`px-3 py-1 rounded ${
                  rmode === "both" ? "bg-blue-600 text-white" : "bg-gray-100"
                }`}
              >
                Text + Image
              </button>
            </div>

            <div>
              <button
                onClick={() => {
                  if (!allowMirror) {
                    toast.error(
                      "Upgrade to Business plan to unlock Mirror Image",
                    );
                    return;
                  }
                  setIsMirrored(!isMirrored);
                }}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded border text-sm font-medium transition-colors ${
                  !allowMirror
                    ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                    : isMirrored
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                {!allowMirror
                  ? "🔒 Mirror Image (Business Only)"
                  : isMirrored
                    ? "✅ Mirrored (Flipped)"
                    : "🔄 Mirror Image"}
              </button>
            </div>

            {(rmode === "text" || rmode === "both") && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Center text
                </label>
                <input
                  value={centerText}
                  onChange={(e) => setCenterText(e.target.value)}
                  className="mt-2 block w-full rounded border px-3 py-2"
                  placeholder="Single line auto arranged"
                />

                <div className="grid grid-cols-1 gap-2 mt-2">
                  <div>
                    <label className="text-xs text-gray-600">
                      Center font size
                    </label>
                    <select
                      value={String(centerFontSize)}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "auto") setCenterFontSize("auto");
                        else setCenterFontSize(Number(v));
                      }}
                      className="mt-1 w-full rounded border px-2 py-1 text-sm"
                    >
                      <option value="auto">Auto</option>
                      <option value="18">18 px</option>
                      <option value="24">24 px</option>
                      <option value="30">30 px</option>
                      <option value="36">36 px</option>
                      <option value="48">48 px</option>
                      <option value="60">60 px</option>
                    </select>
                  </div>
                </div>

                <div className="mt-2 text-xs text-slate-600">
                  Color and font family are taken from the main controls above
                  (Ink Color / Font / Weight).
                </div>
              </div>
            )}

            {(rmode === "text" || rmode === "both") && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Outer curved text
                </label>
                <input
                  value={outerText}
                  onChange={(e) => setOuterText(e.target.value)}
                  className="mt-2 block w-full rounded border px-3 py-2"
                  placeholder='Type letters (e.g. "A O M Y C O M")'
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="text-xs text-gray-600">
                      Outer font size
                    </label>
                    <select
                      value={outerFontSize}
                      onChange={(e) => setOuterFontSize(Number(e.target.value))}
                      className="mt-1 w-full rounded border px-2 py-1 text-sm"
                    >
                      <option value={12}>12 px</option>
                      <option value={14}>14 px</option>
                      <option value={16}>16 px</option>
                      <option value={20}>20 px</option>
                      <option value={24}>24 px</option>
                      <option value={28}>28 px</option>
                      <option value={32}>32 px</option>
                      <option value={40}>40 px</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-600">
                      Rotation: {outerTextRotation}°
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      step={1}
                      value={outerTextRotation}
                      onChange={(e) =>
                        setOuterTextRotation(Number(e.target.value))
                      }
                      className="mt-1 w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {(rmode === "image" || rmode === "both") && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Center image (optional)
                </label>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <label
                    htmlFor="center-image-upload"
                    className="cursor-pointer px-3 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition duration-150 shadow-sm flex items-center gap-2"
                  >
                    Upload Image
                  </label>

                  <input
                    id="center-image-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFile(e.target.files)}
                    className="hidden"
                  />

                  <button
                    onClick={() => {
                      rsetImgSrc(defaultEditorImg);
                      rsetImgZoom(100);
                      rsetImgOffsetX(0);
                      rsetImgOffsetY(0);
                    }}
                    className="px-2 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200 transition duration-150"
                  >
                    Reset image
                  </button>
                </div>

                <div className="mt-2">
                  <label className="text-xs text-gray-600">
                    Image zoom: {rimgZoom}%
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={200}
                    value={rimgZoom}
                    onChange={(e) => rsetImgZoom(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="text-xs text-gray-600">
                      Image horizontal
                    </label>
                    <input
                      type="range"
                      min={-Math.round(centerAllowedRadius)}
                      max={Math.round(centerAllowedRadius)}
                      value={rimgOffsetX}
                      onChange={(e) => rsetImgOffsetX(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">
                      Image vertical
                    </label>
                    <input
                      type="range"
                      min={-Math.round(centerAllowedRadius)}
                      max={Math.round(centerAllowedRadius)}
                      value={rimgOffsetY}
                      onChange={(e) => rsetImgOffsetY(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-3 flex-wrap">
                  <button
                    onClick={() => rquickPositionImg("left")}
                    className="px-2 py-1 bg-gray-100 rounded text-sm"
                  >
                    Left
                  </button>
                  <button
                    onClick={() => rquickPositionImg("center")}
                    className="px-2 py-1 bg-gray-100 rounded text-sm"
                  >
                    Center
                  </button>
                  <button
                    onClick={() => rquickPositionImg("right")}
                    className="px-2 py-1 bg-gray-100 rounded text-sm"
                  >
                    Right
                  </button>
                </div>
              </div>
            )}

            {(rmode === "text" || rmode === "both") && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Center text position
                </label>
                <div className="text-xs text-gray-500">
                  OffsetX: {rtextOffsetX}px • OffsetY: {rtextOffsetY}px
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  <div>
                    <input
                      type="range"
                      min={-Math.round(centerAllowedRadius)}
                      max={Math.round(centerAllowedRadius)}
                      value={rtextOffsetX}
                      onChange={(e) => rsetTextOffsetX(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <input
                      type="range"
                      min={-Math.round(centerAllowedRadius)}
                      max={Math.round(centerAllowedRadius)}
                      value={rtextOffsetY}
                      onChange={(e) => rsetTextOffsetY(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-2 flex-wrap">
                  <button
                    onClick={() => {
                      rsetTextOffsetX(0);
                      rsetTextOffsetY(0);
                    }}
                    className="px-2 py-1 bg-gray-100 rounded text-sm"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => {
                      rsetTextOffsetX(Math.round(centerAllowedRadius * 0.5));
                    }}
                    className="px-2 py-1 bg-gray-100 rounded text-sm"
                  >
                    Quick Right
                  </button>
                </div>
              </div>
            )}

            {/* Left-bottom download buttons (now animate pop on click; check credits inside handlers) */}
            <div className="mt-4 flex gap-2 flex-col sm:flex-row">
              <button
                onClick={internalDownloadPNG}
                aria-disabled={credits <= 0}
                className={`w-full sm:w-auto px-3 py-2 rounded transform transition duration-150 ${
                  credits > 0
                    ? "bg-green-600 text-white hover:scale-105"
                    : "bg-gray-200 text-gray-400"
                } ${isPoppingPNG ? "pop-scale" : ""}`}
                type="button"
              >
                Download PNG ({Math.round(exportSize * 2)}px)
              </button>

              <button
                onClick={internalDownloadSVG}
                aria-disabled={credits <= 0}
                className={`w-full sm:w-auto px-3 py-2 rounded transform transition duration-150 ${
                  credits > 0
                    ? "bg-gray-800 text-white hover:scale-105"
                    : "bg-gray-200 text-gray-400"
                } ${isPoppingSVG ? "pop-scale" : ""}`}
                type="button"
              >
                Download SVG
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="w-full md:w-1/2 flex flex-col items-center">
            <div
              className="bg-white rounded-lg p-4 shadow flex items-center justify-center"
              style={{ width: "100%", maxWidth: 520, height: 420 }}
            >
              <div
                className="p-3 rounded-xl border border-gray-300"
                style={{
                  background: transparentBg
                    ? "repeating-linear-gradient(45deg,#f3f4f6 0 8px, #ffffff 8px 16px)"
                    : "#ffffff",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                  width: size,
                  height: size,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${size} ${size}`}
                  width={size}
                  height={size}
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ backgroundColor: "transparent" }}
                >
                  <g
                    transform={
                      isMirrored
                        ? `translate(${size},0) scale(-1,1)`
                        : undefined
                    }
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={outerRadius + 12}
                      fill="none"
                      stroke={color}
                      strokeWidth={2}
                      strokeDasharray={dashForPreview(lineStyle)}
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={outerRadius + 4}
                      fill="none"
                      stroke={color}
                      strokeWidth={1}
                      strokeDasharray={dashForPreview(lineStyle)}
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={innerBandR}
                      fill="none"
                      stroke={color}
                      strokeWidth={1}
                      strokeDasharray={dashForPreview(lineStyle)}
                    />

                    {chars.length > 0 && (
                      <g
                        fill={color}
                        fontFamily={fontFamily}
                        fontSize={outerFontSize}
                        transform={`rotate(${outerTextRotation} ${cx} ${cy})`}
                        style={{ fontWeight: svgFontWeight }}
                      >
                        {chars.map((ch, i) => {
                          const startAngle = -90;
                          const angleDeg =
                            (i / chars.length) * 360 + startAngle;
                          const angleRad = (angleDeg * Math.PI) / 180;
                          const x = cx + Math.cos(angleRad) * textRadius;
                          const y = cy + Math.sin(angleRad) * textRadius;
                          return (
                            <text
                              key={i}
                              x={x}
                              y={y}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              transform={`rotate(${angleDeg + 90} ${x} ${y})`}
                              style={{ pointerEvents: "none" }}
                            >
                              {ch}
                            </text>
                          );
                        })}
                      </g>
                    )}

                    <defs>
                      <clipPath id="circle-clip">
                        <circle cx={cx} cy={cy} r={centerAllowedRadius} />
                      </clipPath>
                    </defs>

                    {(rmode === "image" || rmode === "both") && rimgSrc && (
                      <image
                        href={rimgSrc}
                        x={imageTopLeftX}
                        y={imageTopLeftY}
                        width={imgDisplaySize}
                        height={imgDisplaySize}
                        preserveAspectRatio="xMidYMid slice"
                        clipPath={`url(#circle-clip)`}
                      />
                    )}

                    {(rmode === "text" || rmode === "both") && (
                      <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontFamily={fontFamily}
                        fill={color}
                        fontSize={centerLayout.font}
                        transform={`translate(${rtextOffsetX} ${rtextOffsetY})`}
                        style={{
                          pointerEvents: "none",
                          fontWeight: svgFontWeight,
                        }}
                      >
                        {centerLayout.line}
                      </text>
                    )}
                  </g>
                </svg>
              </div>
            </div>

            <div className="mt-3 text-sm text-gray-600">
              Preview (right) — controls (left)
            </div>
          </div>
        </div>
      </section>

      {/* Pop keyframes + helper class */}
      <style>{`
        @keyframes pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        .pop-scale { animation: pop 180ms ease; }
      `}</style>
    </main>
  );
}
