import React, { JSX } from "react";
import { PREVIEW_SIZE } from "../../utils/canvas";

interface StampPreviewBoxProps {
  previewSvg: string;
  transparentBg: boolean;
  downloadSvgImage: () => Promise<void>;
  downloadImage: () => Promise<void>;
  exportSize: number;
}

export function StampPreviewBox({
  previewSvg,
  transparentBg,
  downloadImage,
  downloadSvgImage,
  exportSize,
}: StampPreviewBoxProps): JSX.Element {
  return (
    <div className="mt-8 p-4 sm:p-6 rounded-2xl border border-dashed border-gray-300 bg-white grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      {/* Live Preview */}
      <div className="md:col-span-1 flex flex-col items-center">
        <h3 className="text-sm sm:text-base font-bold mb-3 text-slate-700">
          Live Preview
        </h3>

        <div
          className="p-3 rounded-xl border border-gray-300 flex items-center justify-center"
          style={{
            background: transparentBg
              ? "repeating-linear-gradient(45deg,#f3f4f6 0 8px, #ffffff 8px 16px)"
              : "#ffffff",
            boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
            minWidth: PREVIEW_SIZE,
            minHeight: PREVIEW_SIZE,
            maxWidth: "100%",
          }}
        >
          {/* make inner svg responsive while preserving preview pixel size */}
          <div
            style={{
              width: PREVIEW_SIZE,
              height: PREVIEW_SIZE,
              maxWidth: "100%",
              maxHeight: "100%",
            }}
            dangerouslySetInnerHTML={{ __html: previewSvg }}
          />
        </div>

        <div className="mt-2 text-xs text-slate-500">
          {PREVIEW_SIZE} × {PREVIEW_SIZE} preview
        </div>
      </div>

      {/* Download Controls */}
      <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={downloadImage}
            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-base sm:text-lg font-semibold shadow-md transition-colors"
            aria-label={`Download PNG ${exportSize}px`}
          >
            Download Stamp PNG ({exportSize}px)
          </button>

          <button
            onClick={downloadSvgImage}
            className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-base sm:text-lg font-semibold shadow-md transition-colors"
            aria-label={`Download SVG ${exportSize}px`}
          >
            Download Stamp SVG ({exportSize}px)
          </button>
        </div>

        <div className="w-full flex flex-col sm:flex-row gap-3 items-start sm:items-center pt-2 border-t border-gray-200 mt-2">
          <div className="text-xs text-slate-600">
            Export uses the{" "}
            <strong>{transparentBg ? "Transparent" : "White"}</strong>{" "}
            background setting defined in the generator.
          </div>
          <div className="sm:ml-auto text-xs text-gray-500">
            Tip: For best print quality, use the SVG export.
          </div>
        </div>
      </div>
    </div>
  );
}
