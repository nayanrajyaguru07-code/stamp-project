"use client";

import { useEffect, useState } from "react";
import { dummyUsers, subscriptionPlans } from "@/data/dummy-buyers";

type Buyer = {
  name: string;
  plan: string;
};

export default function RecentBuyersPopup() {
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showBuyer = () => {
      const newBuyer: Buyer = {
        name: dummyUsers[Math.floor(Math.random() * dummyUsers.length)],
        plan: subscriptionPlans[
          Math.floor(Math.random() * subscriptionPlans.length)
        ],
      };

      setBuyer(newBuyer);
      setVisible(true);

      // Hide after 5 seconds
      setTimeout(() => {
        setVisible(false);
      }, 6000);
    };

    // Show immediately on load
    showBuyer();

    // Repeat every 3 minutes (180000 ms)
    const interval = setInterval(showBuyer, 16000);

    return () => clearInterval(interval);
  }, []);

  if (!visible || !buyer) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-slideUpFade">
      <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl px-5 py-4 border border-white/50 flex items-center gap-4 transition-all hover:scale-105 active:scale-95 cursor-default group">
        <div className="relative">
          <span className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></span>
          <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
        </div>
        <div className="text-sm">
          <p className="font-bold text-gray-800 leading-tight group-hover:text-indigo-900 transition-colors">
            {buyer.name}
          </p>
          <p className="text-xs text-gray-500 font-medium">
            just purchased{" "}
            <span className="text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">
              {buyer.plan}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
