/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
import React, { JSX, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { RectangularInputPanel } from "./RectangularInputPanel";
import { AddressInputPanel } from "./AddressInputPanel";
import { CircularStampGenerator } from "./CircularStampGenerator";
import { LineStyle, StampType } from "@/types";
import { defaultEditorImg, estimateFontSizeForText } from "@/utils/canvas";
import { StampPreviewBox } from "../StampPreviewBox";

type MainGeneratorProps = object;

// === CONSTANTS ===
const LOCALSTORAGE_CREDITS_KEY = "stamp_credits_v2";
const LOCALSTORAGE_PLAN_KEY = "stamp_user_plan_v2"; // Simulating DB plan storage

// Plan Types based on your description
type PlanType = "trial" | "basic" | "starter" | "advanced" | "pro" | "business";

const fonts = [
  "Times New Roman, serif",
  "Arial, Helvetica, sans-serif",
  "Georgia, serif",
  "Garamond, serif",
  "Courier New, monospace",
];

const sizeOptions = [
  { label: "Small (240px)", value: 240, minPlan: "basic" },
  { label: "Medium (300px)", value: 300, minPlan: "basic" },
  { label: "Large (520px)", value: 520, minPlan: "basic" },
  { label: "Vector / 4K (800px)", value: 800, minPlan: "business" }, // Locked for business/trial
];

// Helper to convert Hex to CMYK
function hexToCMYK(hex: string): string {
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
}

export function MainGenerator(): JSX.Element {
  // === STATE ===
  const [currentPlan, setCurrentPlan] = useState<PlanType>("trial");
  const [credits, setCredits] = useState<number>(0);

  // Stamp State
  const [stampType, setStampType] = useState<StampType>("circular");
  const [curvedInnerText] = useState<string>("NAYAN RAJYAGURU KISHORBHU");
  const [firmText] = useState<string>("nayan rajyaguru kishorbh u");
  const [rectTop, setRectTop] = useState<string>("TOP LINE");
  const [rectBottom, setRectBottom] = useState<string>("BOTTOM LINE");
  const [addressLine1, setAddressLine1] = useState<string>("");
  const [addressLine2, setAddressLine2] = useState<string>("");
  const [addressLine3, setAddressLine3] = useState<string>("");
  const [rectFontSizeOption, setRectFontSizeOption] = useState<string>("20");
  const [color, setColor] = useState<string>("#0b34ff");
  const [inkOpacity] = useState<number>(1);
  const [fontFamily, setFontFamily] = useState<string>(
    "Times New Roman, serif",
  );
  const [fontWeight, setFontWeight] = useState<"bold" | "normal">("bold");
  const [lineStyle, setLineStyle] = useState<LineStyle>("solid");
  const [stampSize, setStampSize] = useState<number>(300);
  const [transparentBg] = useState<boolean>(true);
  const [isMirrored, setIsMirrored] = useState<boolean>(false);
  const [outerLineCount] = useState<number>(2);

  // Constants
  const EXPORT_SIZE = stampSize;
  const PREVIEW_SIZE = 300;

  // === INITIALIZATION & CREDITS ===
  useEffect(() => {
    // 1. Fetch User Data (Plan + Credits)
    const fetchUserData = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        // Guest / Trial Mode (Local Storage Fallback if needed, currently defaults to 5)
        const savedCredits = localStorage.getItem(LOCALSTORAGE_CREDITS_KEY);
        if (savedCredits) setCredits(Number(savedCredits));
        else {
          setCredits(5);
          localStorage.setItem(LOCALSTORAGE_CREDITS_KEY, "5");
        }
        return;
      }

      try {
        const res = await fetch("/api/auth/login", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            const userCredits = Number(data.user.credits || 0);
            setCredits(userCredits);

            if (userCredits >= 9999)
              setCurrentPlan("business"); // Unlimited flag
            else if (userCredits >= 5000)
              setCurrentPlan("pro"); // Unlimited flag
            else if (userCredits >= 100)
              setCurrentPlan("advanced"); // ₹700 pack
            else if (userCredits >= 50)
              setCurrentPlan("starter"); // ₹500 pack
            else if (userCredits >= 10)
              setCurrentPlan("basic"); // ₹100 pack
            else setCurrentPlan("trial");
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data", error);
      }
    };

    fetchUserData();
  }, []);

  // Persist credits locally for optimistic UI updates, but backend is source of truth
  const persistCredits = (val: number) => {
    setCredits(val);
    localStorage.setItem(LOCALSTORAGE_CREDITS_KEY, String(val));
  };

  // === ACCESS CONTROL LOGIC ===
  const features = useMemo(() => {
    const isTrial = currentPlan === "trial";
    const isBasic = currentPlan === "basic";
    const isStarter = currentPlan === "starter";
    const isAdvanced = currentPlan === "advanced";
    const isPro = currentPlan === "pro";
    const isBusiness = currentPlan === "business";

    return {
      // =======================
      // CREDIT / LIMIT LOGIC
      // =======================
      isUnlimited: isPro || isBusiness,

      // =======================
      // STAMP TYPE ACCESS
      // =======================
      allowedTypes: isBasic
        ? ["circular"]
        : isStarter
          ? ["circular", "rectangular"]
          : ["circular", "rectangular", "address"], // Advanced / Pro / Business

      // =======================
      // COLORS
      // =======================
      allowCustomColor: isAdvanced || isPro || isBusiness,
      allowCMYK: isBusiness, // Only Business

      // =======================
      // FONTS
      // =======================
      allowAllFonts: isAdvanced || isPro || isBusiness,
      fontLimit: isBasic ? 2 : isStarter ? 3 : fonts.length,

      // =======================
      // MIRROR / 4K EXPORT
      // =======================
      allowMirror: isBusiness,
      allowVector4K: isBusiness,

      // =======================
      // COMMERCIAL USE (FLAG ONLY)
      // =======================
      allowCommercialUse: isAdvanced || isPro || isBusiness,
    };
  }, [currentPlan]);

  // Handle Redirect if Credits 0
  const checkCreditsAndRedirect = () => {
    if (!features.isUnlimited && credits <= 0) {
      toast.error("Credits exhausted! Redirecting to plans...");
      setTimeout(() => {
        window.location.href = "/"; // Redirect to home/pricing
      }, 1500);
      return false;
    }
    return true;
  };

  // === SVG GENERATION (Same as before) ===
  const svgForExport = useMemo(() => {
    const S = EXPORT_SIZE;
    const strokeColor = color;
    const strokeOpacity = inkOpacity;
    const svgFontWeight = fontWeight === "bold" ? "700" : "400";
    const mirrorTransform = isMirrored
      ? `transform="scale(-1, 1) translate(-${S}, 0)"`
      : "";
    const esc = (s: string) =>
      String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    const dashFor = (style: string, width = 2) => {
      if (style === "dotted") return `${width}, ${width * 3}`;
      if (style === "dashed") return `${width * 8}, ${width * 4}`;
      return undefined;
    };

    if (stampType === "circular") {
      const cx = S / 2;
      const cy = S / 2;
      const outerR = Math.round(S * 0.47);
      const outerStroke = Math.max(2, Math.round(S * 0.01));
      const ringGap = Math.round(S * 0.12);
      const innerR = outerR - ringGap;
      const innerStroke = Math.max(2, Math.round(S * 0.008));
      const textPathR =
        Math.round((outerR + innerR) / 2) - Math.round(S * 0.01);
      const pathId = `innerBandPath_${S}_${strokeColor.replace("#", "")}`;
      const textPathD = `M ${cx} ${
        cy - textPathR
      } a ${textPathR} ${textPathR} 0 1 1 0 ${
        2 * textPathR
      } a ${textPathR} ${textPathR} 0 1 1 0 ${-2 * textPathR}`;
      const circumference = 2 * Math.PI * textPathR;
      const reservedGap = Math.max(6, Math.round(S * 0.014));
      const availableLength = Math.max(20, circumference - reservedGap * 2);
      const cleanText = (curvedInnerText || "").toUpperCase().trim();
      const curvedFontPx = estimateFontSizeForText(
        cleanText || " ",
        Math.round(availableLength * 0.85),
        fontFamily,
        svgFontWeight,
        8,
        Math.round(S * 0.12),
      );
      const bandWidth = innerR * 2 * 0.75;
      const firmFontPx = estimateFontSizeForText(
        firmText || " ",
        bandWidth,
        fontFamily,
        svgFontWeight,
        8,
        Math.round(S * 0.22),
      );
      const dash = dashFor(lineStyle, outerStroke);
      const dashAttr =
        lineStyle !== "solid" ? `stroke-dasharray=\"${dash}\"` : "";

      let outerRings = "";
      const ringSpacing = Math.round(S * 0.01);
      for (let i = 0; i < outerLineCount; i++) {
        const r = outerR + i * (outerStroke + ringSpacing);
        outerRings += `\n  <circle cx=\"${cx}\" cy=\"${cy}\" r=\"${r}\" fill=\"none\" stroke=\"${strokeColor}\" stroke-width=\"${
          i === 0 ? outerStroke : 1
        }\" stroke-opacity=\"${strokeOpacity}\" ${dashAttr} stroke-linecap=\"round\" stroke-linejoin=\"round\" />`;
      }
      const mainInner = `<circle cx=\"${cx}\" cy=\"${cy}\" r=\"${innerR}\" fill=\"none\" stroke=\"${strokeColor}\" stroke-width=\"${innerStroke}\" stroke-opacity=\"${strokeOpacity}\" ${dashAttr} stroke-linecap=\"round\" stroke-linejoin=\"round\" />`;
      const curvedFragment = `<text font-family=\"${fontFamily}\" font-weight=\"${svgFontWeight}\" font-size=\"${curvedFontPx}\" fill=\"${strokeColor}\" fill-opacity=\"${strokeOpacity}\">\n    <textPath href=\"#${pathId}\" startOffset=\"50%\" text-anchor=\"middle\" lengthAdjust=\"spacingAndGlyphs\" textLength=\"${Math.round(
        availableLength,
      )}\">${esc(cleanText)}</textPath>\n  </text>`;
      const centerFragment = `<text x=\"${cx}\" y=\"${cy}\" font-family=\"${fontFamily}\" font-weight=\"${svgFontWeight}\" font-size=\"${firmFontPx}\" text-anchor=\"middle\" dominant-baseline=\"middle\" fill=\"${strokeColor}\" fill-opacity=\"${strokeOpacity}\">${esc(
        firmText,
      ).toUpperCase()}</text>`;
      return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">\n  <defs>\n    <path id=\"${pathId}\" d=\"${textPathD}\" />\n  </defs>\n  <g ${mirrorTransform}>\n    ${outerRings}\n    <circle cx=\"${cx}\" cy=\"${cy}\" r=\"${outerR}\" fill=\"none\" stroke=\"${strokeColor}\" stroke-width=\"${outerStroke}\" stroke-opacity=\"${strokeOpacity}\" ${dashAttr} stroke-linecap=\"round\" stroke-linejoin=\"round\" />\n    ${mainInner}\n    ${curvedFragment}\n    ${centerFragment}\n  </g>\n</svg>`;
    } else {
      // Rectangle / Address Logic
      const S2 = EXPORT_SIZE;
      const padding = Math.round(S2 * 0.08);
      const w = S2 - padding * 2;
      const h = Math.round(S2 * 0.6);
      const x = padding;
      const y = Math.round((S2 - h) / 2);
      const inset = Math.round(Math.max(10, S2 * 0.04));
      const innerX = x + inset;
      const innerY = y + inset;
      const innerW = w - inset * 2;
      const innerH = h - inset * 2;
      const textStartX = x + inset + Math.max(8, Math.round(innerW * 0.03));

      const topFont =
        rectFontSizeOption === "auto"
          ? estimateFontSizeForText(
              rectTop || "",
              innerW,
              fontFamily,
              svgFontWeight,
              8,
              Math.round(S2 * 0.12),
            )
          : Number(rectFontSizeOption);
      const bottomFont =
        rectFontSizeOption === "auto"
          ? estimateFontSizeForText(
              rectBottom || "",
              innerW,
              fontFamily,
              svgFontWeight,
              8,
              Math.round(S2 * 0.12),
            )
          : Number(rectFontSizeOption);

      if (stampType === "address") {
        const linesRaw = [
          addressLine1 || "",
          addressLine2 || "",
          addressLine3 || "",
        ];
        const lines = linesRaw.map((l) => l.trim()).filter(Boolean);
        if (lines.length === 0) lines.push("");
        const longest = lines.reduce(
          (a, b) => (a.length > b.length ? a : b),
          lines[0] || "",
        );
        const fontPx =
          rectFontSizeOption === "auto"
            ? estimateFontSizeForText(
                longest || "",
                innerW,
                fontFamily,
                svgFontWeight,
                8,
                Math.round(S2 * 0.12),
              )
            : Number(rectFontSizeOption);
        const lineGap = Math.max(4, Math.round(fontPx * 0.25));
        const lineCount = lines.length;
        const blockHeight = lineCount * fontPx + (lineCount - 1) * lineGap;
        const startY =
          innerY +
          Math.round((innerH - blockHeight) / 2) +
          Math.round(fontPx * 0.85);
        let textLines = "";
        for (let i = 0; i < lines.length; i++) {
          const yPos = startY + i * (fontPx + lineGap);
          textLines += `\n  <text x=\"${textStartX}\" y=\"${yPos}\" font-family=\"${fontFamily}\" font-weight=\"${svgFontWeight}\" font-size=\"${fontPx}\" text-anchor=\"start\" dominant-baseline=\"alphabetic\" fill=\"${color}\" fill-opacity=\"${inkOpacity}\">${esc(
            lines[i],
          )}</text>`;
        }
        return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${S2}" height="${S2}" viewBox="0 0 ${S2} ${S2}">\n  <g ${mirrorTransform}>\n    <rect x=\"${x}\" y=\"${y}\" width=\"${w}\" height=\"${h}\" rx=\"${Math.round(
          S2 * 0.02,
        )}\" fill=\"none\" stroke=\"none\" />\n    <rect x=\"${innerX}\" y=\"${innerY}\" width=\"${innerW}\" height=\"${innerH}\" rx=\"${Math.round(
          S2 * 0.01,
        )}\" fill=\"none\" stroke=\"none\" />${textLines}\n  </g>\n</svg>`;
      }
      const topY = innerY + Math.round(innerH * 0.14);
      const bottomY = innerY + innerH - Math.round(innerH * 0.14);
      return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${S2}" height="${S2}" viewBox="0 0 ${S2} ${S2}">\n  <g ${mirrorTransform}>\n    <rect x=\"${x}\" y=\"${y}\" width=\"${w}\" height=\"${h}\" rx=\"${Math.round(
        S2 * 0.02,
      )}\" fill=\"none\" stroke=\"none\" />\n    <rect x=\"${innerX}\" y=\"${innerY}\" width=\"${innerW}\" height=\"${innerH}\" rx=\"${Math.round(
        S2 * 0.01,
      )}\" fill=\"none\" stroke=\"none\" />\n    <text x=\"${textStartX}\" y=\"${topY}\" font-family=\"${fontFamily}\" font-weight=\"${svgFontWeight}\" font-size=\"${topFont}\" text-anchor=\"start\" dominant-baseline=\"hanging\" fill=\"${color}\" fill-opacity=\"${inkOpacity}\">${esc(
        rectTop,
      ).toUpperCase()}</text>\n    <text x=\"${textStartX}\" y=\"${bottomY}\" font-family=\"${fontFamily}\" font-weight=\"${svgFontWeight}\" font-size=\"${bottomFont}\" text-anchor=\"start\" dominant-baseline=\"baseline\" fill=\"${color}\" fill-opacity=\"${inkOpacity}\">${esc(
        rectBottom,
      ).toUpperCase()}</text>\n  </g>\n</svg>`;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    stampType,
    curvedInnerText,
    firmText,
    rectTop,
    rectBottom,
    addressLine1,
    addressLine2,
    addressLine3,
    rectFontSizeOption,
    color,
    inkOpacity,
    fontFamily,
    fontWeight,
    lineStyle,
    EXPORT_SIZE,
    isMirrored,
  ]);

  const previewSvg = useMemo(() => {
    return svgForExport
      .replace(`width="${EXPORT_SIZE}"`, `width="${PREVIEW_SIZE}"`)
      .replace(`height="${EXPORT_SIZE}"`, `height="${PREVIEW_SIZE}"`)
      .replace(
        `viewBox="0 0 ${EXPORT_SIZE} ${EXPORT_SIZE}"`,
        `viewBox="0 0 ${EXPORT_SIZE} ${EXPORT_SIZE}"`,
      );
  }, [svgForExport, EXPORT_SIZE]);

  // === EXPORT HANDLERS ===
  async function rasterizeSvgStringToPngDataUrl(
    finalSvgString: string,
    transparent: boolean,
  ): Promise<string> {
    const svgDataUrl =
      "data:image/svg+xml;charset=utf-8," + encodeURIComponent(finalSvgString);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = EXPORT_SIZE;
        canvas.height = EXPORT_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context unavailable"));
        if (!transparent) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Image load error"));
      img.src = svgDataUrl;
    });
  }

  const consumeCredit = async () => {
    if (!features.isUnlimited) {
      // Optimistic update
      const newCredits = Math.max(0, credits - 1);
      persistCredits(newCredits);

      // Backend Call
      const token = localStorage.getItem("authToken");
      if (token) {
        try {
          await fetch("/api/user/deduct-credit", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (e) {
          console.error("Failed to deduct credit on server", e);
          // Revert if critical? For now, optimistic is fine.
        }
      } else {
        // Guest mode logic already handled by persistCredits above
      }

      if (newCredits <= 0) {
        checkCreditsAndRedirect();
      }
    }
  };

  const handleDownload = async (format: "png" | "svg") => {
    if (!checkCreditsAndRedirect()) return;

    try {
      const name = `stamp_${Date.now()}_${EXPORT_SIZE}px${
        isMirrored ? "_mirror" : ""
      }.${format}`;
      if (format === "png") {
        const pngData = await rasterizeSvgStringToPngDataUrl(
          svgForExport,
          transparentBg,
        );
        const a = document.createElement("a");
        a.href = pngData;
        a.download = name;
        a.click();
      } else {
        const blob = new Blob([svgForExport], {
          type: "image/svg+xml;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
      }
      toast.success("Saved successfully!");
      consumeCredit();
    } catch (err) {
      toast.error("Export failed.");
    }
  };

  const handleExportSuccessFromChild = () => {
    if (!checkCreditsAndRedirect()) return;
    consumeCredit();
  };

  const creditPercent = features.isUnlimited
    ? 100
    : Math.min(100, (credits / 10) * 100);

  return (
    <>
      <section className="w-full">
        {/* Changed wrapper for mobile full width:
            - rounded-none on mobile (sm:rounded-2xl on desktop)
            - shadow-none on mobile (sm:shadow-lg on desktop)
            - negative margins on mobile (-mx-4) to pull to edge if parent has padding
        */}
        <div className="bg-white p-4 sm:p-6 w-full rounded-none sm:rounded-2xl shadow-none sm:shadow-lg -mx-4 sm:mx-0">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
              {/* Plan Badge */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-4 flex items-center gap-4 shadow-md min-w-[200px] w-full sm:w-auto">
                <div className="flex flex-col">
                  <div className="text-xs uppercase opacity-90 font-bold">
                    Current Plan
                  </div>
                  <div className="text-xl font-bold leading-none mt-1 capitalize">
                    {currentPlan}
                  </div>
                  <div className="text-xs opacity-90 mt-1">
                    {features.isUnlimited
                      ? "Unlimited Access"
                      : `${credits} credits left`}
                  </div>
                </div>
              </div>

              {/* Credit Bar (Hidden for Unlimited) */}
              <div className="flex-1 w-full sm:w-auto">
                {!features.isUnlimited ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-slate-700">
                        {credits > 0 ? "Credits remaining" : "No credits left"}
                      </div>
                      <div className="text-xs text-gray-500">{credits}</div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, credits * 10)}%`,
                          background:
                            credits > 3
                              ? "linear-gradient(90deg,#10b981,#06b6d4)"
                              : "linear-gradient(90deg,#f97316,#ef4444)",
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-green-600 font-semibold bg-green-50 p-2 rounded-lg border border-green-200">
                    ✨ You have unlimited downloads with the {currentPlan} plan.
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  {features.isUnlimited
                    ? "Generate and download as many stamps as you need."
                    : "Downloads consume 1 credit. Top up when you run out."}
                </div>
              </div>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
            {/* Stamp Type */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Stamp Type
              </label>
              <select
                value={stampType}
                onChange={(e) => setStampType(e.target.value as StampType)}
                className="w-full rounded-md border px-2 py-2 text-sm"
              >
                {features.allowedTypes.includes("circular") && (
                  <option value="circular">Circular Seal</option>
                )}
                {features.allowedTypes.includes("rectangular") && (
                  <option value="rectangular">Rectangular Signatory</option>
                )}
                {features.allowedTypes.includes("address") && (
                  <option value="address">Address Stamp</option>
                )}
              </select>
            </div>

            {/* Size */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Stamp Size
              </label>
              <select
                value={stampSize}
                onChange={(e) => setStampSize(Number(e.target.value))}
                className="w-full rounded-md border px-2 py-2 text-sm"
              >
                {sizeOptions.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={!features.allowVector4K && opt.value > 520}
                  >
                    {!features.allowVector4K && opt.value > 520
                      ? "🔒 " + opt.label
                      : opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div className="relative">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Ink Color
              </label>
              {features.allowCustomColor ? (
                <div className="flex flex-col gap-1">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-9 p-0 rounded-md border cursor-pointer"
                  />
                  {features.allowCMYK && (
                    <div className="text-[10px] text-gray-500 font-mono text-center bg-gray-50 rounded border px-1 truncate">
                      {hexToCMYK(color)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex gap-1">
                  {["#0b34ff", "#000000", "#ff0000", "#008000"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border-2 ${
                        color === c
                          ? "border-orange-500 scale-110"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Font */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Font
              </label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full rounded-md border px-2 py-2 text-sm"
              >
                {fonts.slice(0, features.fontLimit).map((f) => (
                  <option key={f} value={f}>
                    {f.split(",")[0]}
                  </option>
                ))}
                {!features.allowAllFonts && (
                  <option disabled>Upgrade for more fonts...</option>
                )}
              </select>
            </div>

            {/* Weight */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Weight
              </label>
              <select
                value={fontWeight}
                onChange={(e) =>
                  setFontWeight(e.target.value as "bold" | "normal")
                }
                className="w-full rounded-md border px-2 py-2 text-sm"
              >
                <option value="bold">Bold</option>
                <option value="normal">Normal</option>
              </select>
            </div>

            {/* Orientation */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Orientation
              </label>
              <button
                onClick={() =>
                  features.allowMirror
                    ? setIsMirrored(!isMirrored)
                    : toast.error("Upgrade to Business plan for Mirroring")
                }
                className={`w-full rounded-md border px-2 py-2 text-sm transition-colors flex items-center justify-center gap-2 ${
                  !features.allowMirror
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : isMirrored
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                {features.allowMirror
                  ? isMirrored
                    ? "Mirrored On"
                    : "Mirror Img"
                  : "🔒 Mirror Img"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 mt-3">
            {stampType === "circular" && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Line Style
                </label>
                <select
                  value={lineStyle}
                  onChange={(e) => setLineStyle(e.target.value as LineStyle)}
                  className="w-full rounded-md border px-2 py-2 text-sm"
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                </select>
              </div>
            )}
            {stampType !== "circular" && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Rect font size
                </label>
                <select
                  value={rectFontSizeOption}
                  onChange={(e) => setRectFontSizeOption(e.target.value)}
                  className="w-full rounded-md border px-2 py-2 text-sm"
                >
                  <option value="auto">Auto</option>
                  <option value="20">20 px</option>
                  <option value="28">28 px</option>
                  <option value="36">36 px</option>
                </select>
              </div>
            )}
          </div>

          {/* GENERATORS */}
          {stampType === "circular" ? (
            <div className="mt-4">
              <CircularStampGenerator
                color={color}
                fontFamily={fontFamily}
                lineStyle={lineStyle}
                fontWeight={fontWeight}
                transparentBg={transparentBg}
                allowMirror={features.allowMirror}
                exportSize={EXPORT_SIZE}
                credits={features.isUnlimited ? 9999 : credits}
                onExportSuccess={handleExportSuccessFromChild}
              />
            </div>
          ) : (
            <div className="mt-4">
              {stampType === "rectangular" ? (
                <RectangularInputPanel
                  rectTop={rectTop}
                  setRectTop={setRectTop}
                  rectBottom={rectBottom}
                  setRectBottom={setRectBottom}
                />
              ) : (
                <AddressInputPanel
                  addressLine1={addressLine1}
                  setAddressLine1={setAddressLine1}
                  addressLine2={addressLine2}
                  setAddressLine2={setAddressLine2}
                  addressLine3={addressLine3}
                  setAddressLine3={setAddressLine3}
                />
              )}
              {/* Updated Preview/Download wrapper for mobile full width stacking */}
              <div className="mt-4 flex flex-col sm:flex-row gap-4 sm:justify-end sm:items-center">
                <StampPreviewBox
                  previewSvg={previewSvg}
                  transparentBg={transparentBg}
                  downloadImage={() => handleDownload("png")}
                  downloadSvgImage={() => handleDownload("svg")}
                  exportSize={EXPORT_SIZE}
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
