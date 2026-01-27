import React, { JSX } from "react";
import { MainGenerator } from "./generators/MainGenerator";

interface GeneratorPageProps {
  resetAllSettings: () => void;
}

export function GeneratorPage({}: GeneratorPageProps): JSX.Element {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <MainGenerator />
    </div>
  );
}
