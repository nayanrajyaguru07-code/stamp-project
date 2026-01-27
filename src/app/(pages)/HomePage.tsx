/* eslint-disable @next/next/no-img-element */
import React, { JSX } from "react";
import { SubscriptionCard } from "./SubscriptionCard";

interface HomePageProps {
  setRoute: (route: "home" | "generate" | "dashboard") => void;
}

export function HomePage({ setRoute }: HomePageProps): JSX.Element {
  return (
    <>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
        {/* Background Blob */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-3xl opacity-60 mix-blend-multiply animate-blob"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl opacity-60 mix-blend-multiply animate-blob animation-delay-2000"></div>
        </div>

        <div>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Build professional <br />
            <span className="text-blue-600">
              stamps in seconds
            </span>
          </h2>
          <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-lg">
            CS Stamp helps CA firms and professionals create crisp vector seals
            and signatory stamps for documents, certificates and labels with
            ease.
          </p>
          <div className="mt-10 flex gap-4">
            <button
              onClick={() => {
                const token = localStorage.getItem("authToken");

                if (!token) {
                  window.dispatchEvent(new Event("open-login"));
                  return;
                }
                setRoute("generate");
              }}
              className="px-8 py-3.5 bg-blue-600 text-white rounded-full font-semibold shadow-xl shadow-blue-200 hover:bg-blue-700 hover:shadow-2xl hover:-translate-y-1 transition-all duration-200"
            >
              Try Generator
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center perspective-1000">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl shadow-indigo-100 w-full max-w-lg border border-white/50 transform hover:rotate-y-2 transition-transform duration-500">
            <div className="flex flex-col items-center gap-6">
              <div className="w-full aspect-square bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 relative group">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>
                <img
                  src="stemp.webp"
                  alt="Example stamp preview"
                  className="w-3/4 h-3/4 object-contain drop-shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
                />
              </div>
              <div className="text-center text-sm font-medium text-slate-500">
                Fully customizable shapes, fonts & colors.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-20">
        {/* HEADER */}
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900">
            Simple & Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Choose a plan that fits your needs. No hidden fees, cancel anytime.
          </p>

          {/* DISCOUNT OFFER HEADER */}
          <div className="mt-12 mb-16 rounded-3xl bg-gray-900 p-8 text-white text-center shadow-2xl relative overflow-hidden group border border-gray-700">
            {/* Glossy Effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gray-700/50 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

            <div className="relative z-10">
              <div className="inline-block px-4 py-1.5 rounded-full bg-gray-700 backdrop-blur-md border border-gray-600 text-xs font-bold uppercase tracking-wider mb-4 text-gray-300">
                Limited Time Offer
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">
                Unlock Premium Features
              </h2>

              <p className="text-base md:text-xl font-medium mb-8 text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Get{" "}
                <span className="text-white font-bold bg-blue-600 px-2 py-0.5 rounded border border-blue-500">
                  20% OFF
                </span>{" "}
                on Basic plans with code{" "}
                <span className="font-mono text-blue-400">OMG</span>
                <br className="hidden md:block" />
                Get{" "}
                <span className="text-white font-bold bg-gray-700 px-2 py-0.5 rounded border border-gray-500">
                  25% OFF
                </span>{" "}
                on Annual plans with code{" "}
                <span className="font-mono text-gray-300">GOD</span>
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4 text-sm font-semibold">
                <span className="bg-gray-800 backdrop-blur-sm border border-gray-700 px-6 py-3 rounded-full flex items-center justify-center gap-2 hover:bg-gray-700 transition cursor-default">
                  🔥 Trending Offer
                </span>
                <span className="bg-gray-800 backdrop-blur-sm border border-gray-700 px-6 py-3 rounded-full flex items-center justify-center gap-2 hover:bg-gray-700 transition cursor-default">
                  💎 Rated #1 by Professionals
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= BASIC / MONTHLY PLANS ================= */}
        <h3 className="text-xl font-semibold text-center mb-10">
          Basic Plans – Pay as You Go
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-24">
          {/* ₹100 → ₹20 (80% OFF) */}
          <SubscriptionCard
            title="Basic Pack"
            originalPrice="₹500"
            offerPrice="₹100"
            planType="manual"
            discountPercent="80%"
            features={[
              "create a 10 stamps only ",
              "Circular stamp only",
              "Limited font options",
              "No color customization",
            ]}
          />

          {/* ₹500 → ₹100 (80% OFF) */}
          <SubscriptionCard
            title="Starter Pack"
            originalPrice="₹2500"
            offerPrice="₹500"
            planType="manual"
            discountPercent="80%"
            features={[
              "create a 50 stamps only",
              "Circle and Ractangle  stamp types",
              "Limited colors",
              "Basic font options",
              "No commercial use",
            ]}
          />
          <SubscriptionCard
            title="Advanced "
            originalPrice="₹3500"
            offerPrice="₹700"
            planType="manual"
            discountPercent="80%"
            features={[
              "create a 100 stamps only",
              "All fonts & colors",
              "Commercial use allowed",
              "Email & chat support",
              "⭐ Most popular choice",
            ]}
          />
        </div>

        {/* ================= ANNUAL PLANS ================= */}
        <h3 className="text-2xl font-semibold text-center mb-3">
          Annual Plans – Best Value 💎
        </h3>
        <p className="text-center text-gray-600 mb-12">
          Ideal for Professionals, CA / CS & Firms
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <SubscriptionCard
            title="Pro – Annual"
            originalPrice="₹5000/mo"
            offerPrice="₹1000/mo"
            planType="annual"
            discountPercent="80% "
            features={[
              "Unlimited stamp generation",
              "All stamp types unlocked",
              "All fonts & colors",
              "Email & chat support",
              "Most popular choice",
            ]}
          />

          <SubscriptionCard
            title="Business – Annual"
            originalPrice="₹12000/mo"
            offerPrice="₹2500/mo"
            planType="annual"
            discountPercent="80% "
            features={[
              "Unlimited stamp generation",
              "Provide A Background Removal option",
              "Download 4K stamp images",
              "All stamp types unlocked",
              "All fonts & colors",
              "Email & chat support",
              "Unlocked The Mirror Img option",
              "Unclock CYK colour option",
              "⭐ Most popular choice",
            ]}
          />
        </div>
      </section>
    </>
  );
}
