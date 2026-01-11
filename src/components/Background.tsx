"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const BinaryRain = () => {
  const [columns, setColumns] = useState<number>(0);

  useEffect(() => {
    setColumns(Math.floor(window.innerWidth / 20));
    const handleResize = () => setColumns(Math.floor(window.innerWidth / 20));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
      {columns > 0 &&
        [...Array(columns)].map((_, i) => (
          <BinaryColumn key={i} delay={Math.random() * 5} />
        ))}
    </div>
  );
};

const BinaryColumn = ({ delay }: { delay: number }) => {
  const [text, setText] = useState("");

  useEffect(() => {
    const chars = "01";
    const length = 20 + Math.floor(Math.random() * 30);
    let currentText = "";
    for (let i = 0; i < length; i++) {
      currentText += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setText(currentText);
  }, []);

  return (
    <motion.div
      initial={{ y: -500 }}
      animate={{ y: 1000 }}
      transition={{
        duration: 10 + Math.random() * 10,
        repeat: Infinity,
        ease: "linear",
        delay,
      }}
      className="absolute text-[10px] font-mono whitespace-pre leading-none"
      style={{ left: `${Math.random() * 100}%` }}
    >
      {text.split("").map((char, i) => (
        <div key={i}>{char}</div>
      ))}
    </motion.div>
  );
};

export const Background = () => {
  return (
    <div className="fixed inset-0 z-0 bg-[#05070a] overflow-hidden">
      <BinaryRain />

      {/* Animated gradient orbs - more subtle */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.15, 0.25, 0.15],
          x: [0, 50, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] bg-[#00ffe1] blur-[150px] rounded-full"
      />
      <motion.div
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.1, 0.2, 0.1],
          x: [0, -50, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -bottom-1/4 -right-1/4 w-[700px] h-[700px] bg-[#8b5cf6] blur-[130px] rounded-full"
      />

      <div className="noise" />
      <div className="scanline" />
    </div>
  );
};
