"use client";

import { useState, useEffect } from "react";
import { Background } from "@/components/Background";
import { BootScreen } from "@/components/BootScreen";
import { Terminal } from "@/components/Terminal";
import { AnimatePresence } from "framer-motion";

export default function Home() {
  // Check if user has already seen boot screen in this session
  const [booting, setBooting] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Skip boot screen if already seen in this session for faster LCP
    const hasBooted = sessionStorage.getItem("hasBooted");
    if (hasBooted === "true") {
      setBooting(false);
    }
  }, []);

  const handleBootComplete = () => {
    sessionStorage.setItem("hasBooted", "true");
    setBooting(false);
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden flex items-center justify-center p-0 sm:p-4">
      <Background />

      <AnimatePresence mode="wait">
        {booting && isClient ? (
          <BootScreen key="boot" onComplete={handleBootComplete} />
        ) : (
          <div
            key="content"
            className="w-full h-full flex items-center justify-center p-0 sm:p-4 md:p-8"
          >
            <Terminal />
          </div>
        )}
      </AnimatePresence>

      {/* Floating UI elements for extra premium feel */}
      {!booting && (
        <div className="fixed bottom-4 right-4 text-[10px] text-white/20 font-mono uppercase tracking-[0.2em] pointer-events-none">
          AmanOS v2.0 // Unauthorized access is strictly prohibited
        </div>
      )}
    </main>
  );
}
