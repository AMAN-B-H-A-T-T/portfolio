"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";

// Pre-calculate a reasonable default for SSR to prevent CLS
const DEFAULT_COLUMNS = 80; // Reasonable default for most screens

const BinaryRain = () => {
  const [columns, setColumns] = useState<number>(DEFAULT_COLUMNS);
  const [isClient, setIsClient] = useState(false);

  // Generate stable random values using index as seed
  const columnData = useMemo(() => {
    return [...Array(columns)].map((_, i) => ({
      key: i,
      delay: (i * 0.0625) % 5, // Deterministic delay based on index
      left: (i * 1.25) % 100, // Deterministic position
    }));
  }, [columns]);

  useEffect(() => {
    setIsClient(true);
    const calculateColumns = () => Math.floor(window.innerWidth / 20);
    setColumns(calculateColumns());

    const handleResize = () => setColumns(calculateColumns());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]"
      style={{ contain: "strict" }} // CSS containment to isolate layout
    >
      {columnData.map((col) => (
        <BinaryColumn key={col.key} delay={col.delay} left={col.left} />
      ))}
    </div>
  );
};

const BinaryColumn = ({ delay, left }: { delay: number; left: number }) => {
  // Pre-generate text to avoid hydration mismatch
  const text = useMemo(() => {
    const chars = "01";
    const length = 30; // Fixed length to prevent layout shifts
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt((i + Math.floor(left)) % 2);
    }
    return result;
  }, [left]);

  return (
    <motion.div
      initial={{ y: -500 }}
      animate={{ y: 1000 }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: "linear",
        delay,
      }}
      className="absolute text-[10px] font-mono whitespace-pre leading-none will-change-transform"
      style={{
        left: `${left}%`,
        contain: "layout style", // Prevent layout recalculations
      }}
    >
      {text.split("").map((char, i) => (
        <div key={i}>{char}</div>
      ))}
    </motion.div>
  );
};

export const Background = () => {
  return (
    <div
      className="fixed inset-0 z-0 bg-[#05070a] overflow-hidden"
      style={{ contain: "strict" }} // Isolate background from affecting layout
    >
      <BinaryRain />

      {/* Animated gradient orbs - using will-change and contain for performance */}
      <motion.div
        animate={{
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] bg-[#00ffe1] blur-[150px] rounded-full will-change-opacity"
        style={{
          contain: "strict",
          transform: "translateZ(0)", // Force GPU layer
        }}
      />
      <motion.div
        animate={{
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -bottom-1/4 -right-1/4 w-[700px] h-[700px] bg-[#8b5cf6] blur-[130px] rounded-full will-change-opacity"
        style={{
          contain: "strict",
          transform: "translateZ(0)", // Force GPU layer
        }}
      />

      <div className="noise" />
      <div className="scanline" />
    </div>
  );
};
