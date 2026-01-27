import React, { JSX } from "react";

interface AddressInputPanelProps {
  addressLine1: string;
  setAddressLine1: (text: string) => void;
  addressLine2: string;
  setAddressLine2: (text: string) => void;
  addressLine3: string;
  setAddressLine3: (text: string) => void;
}

export function AddressInputPanel({
  addressLine1,
  setAddressLine1,
  addressLine2,
  setAddressLine2,
  addressLine3,
  setAddressLine3,
}: AddressInputPanelProps): JSX.Element {
  return (
    <div className="space-y-4 pt-4">
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Address Lines
        </label>
        <div className="space-y-2">
          <input
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Line 1"
          />
          <input
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Line 2"
          />
          <input
            value={addressLine3}
            onChange={(e) => setAddressLine3(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Line 3"
          />
        </div>
      </div>
    </div>
  );
}
