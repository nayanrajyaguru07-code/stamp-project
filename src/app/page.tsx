"use client";
import { LineStyle, Mode, StampType } from "@/types";
import { defaultEditorImg } from "@/utils/canvas";
import React, { JSX, useState } from "react";
import toast from "react-hot-toast";
import { Header } from "./(pages)/Header";
import { HomePage } from "./(pages)/HomePage";
import { GeneratorPage } from "./(pages)/GeneratorPage";
import { Footer } from "./(pages)/Footer";
import { Dashboard } from "./(pages)/Dashboard";
import RecentBuyersPopup from "./dummy-buyers/page";

export default function StampGeneratorApp(): JSX.Element {
  const [route, setRoute] = useState<"home" | "generate" | "dashboard">("home");

  const [, setStampType] = useState<StampType>("circular");
  const [, setCurvedInnerText] = useState<string>("NAYAN RAJYAGURU KISHORBHU");
  const [, setFirmText] = useState<string>("nayan rajyaguru kishorbh u");
  const [, setRectTop] = useState<string>("TOP LINE");
  const [, setRectBottom] = useState<string>("BOTTOM LINE");
  const [, setAddressLine1] = useState<string>("");
  const [, setAddressLine2] = useState<string>("");
  const [, setAddressLine3] = useState<string>("");
  const [, setRectFontSizeOption] = useState<string>("36");
  const [, setColor] = useState<string>("#0b34ff");
  const [, setFontFamily] = useState<string>("Times New Roman, serif");
  const [, setPerLetterCurved] = useState<boolean>(true);
  const [, setMode] = useState<Mode>("both");
  const [, setTextOffsetX] = useState<number>(0);
  const [, setTextOffsetY] = useState<number>(0);
  const [, setLineStyle] = useState<LineStyle>("solid");
  // The states below are used in the original logic but are mocked here for reset:
  const [, setImgSrc] = useState<string>(defaultEditorImg);
  const [, setImgZoom] = useState<number>(100);
  const [, setImgOffsetX] = useState<number>(0);
  const [, setImgOffsetY] = useState<number>(0);

  // --- Reset Function ---
  const resetAllSettings = () => {
    // Reset all states managed by MainGenerator/App.tsx
    setStampType("circular");
    setCurvedInnerText("NAYAN RAJYAGURU KISHORBHU");
    setFirmText("nayan rajyaguru kishorbh u");
    setRectTop("TOP LINE");
    setRectBottom("BOTTOM LINE");
    setAddressLine1("");
    setAddressLine2("");
    setAddressLine3("");
    setRectFontSizeOption("36");
    setColor("#0b34ff");
    setFontFamily("Times New Roman, serif");
    setPerLetterCurved(true);
    setMode("both");
    setImgSrc(defaultEditorImg);
    setImgZoom(100);
    setImgOffsetX(0);
    setImgOffsetY(0);
    setTextOffsetX(0);
    setTextOffsetY(0);
    setLineStyle("solid"); // Reset lineStyle
    toast.success("All settings reset.");
  };
  return (
    <div
      className="min-h-screen"
      style={{ background: "#FFFFFF" }}
    >
      <Header route={route} setRoute={setRoute} />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {route === "home" ? (
          <>
            <HomePage setRoute={setRoute} />
            <RecentBuyersPopup />
          </>
        ) : route === "dashboard" ? (
          (() => {
            if (typeof window === "undefined") return;
            const adminToken = localStorage.getItem("adminAccessToken");

            if (!adminToken) {
              toast.error("Admin access only");
              setRoute("home");
              return null;
            }

            return <Dashboard />;
          })()
        ) : (
          <GeneratorPage resetAllSettings={resetAllSettings} />
        )}
      </main>

      <Footer />
    </div>
  );
}
