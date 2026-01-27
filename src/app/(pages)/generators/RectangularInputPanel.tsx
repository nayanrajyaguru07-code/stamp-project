import React, { JSX } from "react";

interface RectangularInputPanelProps {
  rectTop: string;
  setRectTop: (text: string) => void;
  rectBottom: string;
  setRectBottom: (text: string) => void;
}

export function RectangularInputPanel({
  rectTop,
  setRectTop,
  rectBottom,
  setRectBottom,
}: RectangularInputPanelProps): JSX.Element {
  return (
    <div className="space-y-4 pt-4">
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Top text
        </label>
        <input
          value={rectTop}
          onChange={(e) => setRectTop(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Bottom text
        </label>
        <input
          value={rectBottom}
          onChange={(e) => setRectBottom(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}
