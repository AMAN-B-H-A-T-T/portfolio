"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// Full boot experience - premium aesthetic with visible animation
const BOOT_LOGS = [
  "[    0.000000] Linux version 4.14.0-core (aman@amanOS)",
  "[    0.042134] x86/fpu: Supporting XSAVE feature set: 0x001",
  "[    0.154231] smpboot: CPU0: Intel(R) Core(TM) i9-12900K @ 3.20GHz",
  "[    0.287612] ACPI: Core revision 20170831",
  "[    0.432198] SCSI subsystem initialized",
  "[    0.567890] Initializing AmanOS Shell...",
  "[    0.712345] Loading Neural Engine Assets...",
  "[    0.823456] Mounting Virtual Filesystem...",
  "[    0.901234] Establishing Encrypted Tunnel...",
  "[    0.956789] Checking System Integrity...",
  "[    0.989012] Loading User Preferences...",
  "[    1.000000] SYSTEM_READY: Initiating UI_TERMINAL",
];

export const BootScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let currentLog = 0;
    // 120ms per log × 12 logs = 1440ms + 600ms delay = ~2 seconds total
    const logInterval = setInterval(() => {
      if (currentLog < BOOT_LOGS.length) {
        setLogs((prev) => [...prev, BOOT_LOGS[currentLog]]);
        currentLog++;
        setProgress((currentLog / BOOT_LOGS.length) * 100);
      } else {
        clearInterval(logInterval);
        setTimeout(onComplete, 600);
      }
    }, 120);

    return () => clearInterval(logInterval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-[#05070a] flex items-center justify-center p-4 sm:p-10 crt-container overflow-hidden">
      <div className="max-w-2xl w-full space-y-4">
        <div className="space-y-1">
          {logs.map((log, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-primary-neon/80 text-[10px] sm:text-xs leading-tight"
            >
              {log}
            </motion.div>
          ))}
        </div>

        <div className="space-y-2 pt-4">
          <div className="flex justify-between text-[10px] text-white/40 uppercase">
            <span>Initialising_System</span>
            <span>{Math.floor(progress)}%</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div
              className="h-full bg-primary-neon"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
          <div className="flex justify-center">
            <motion.div
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-[10px] text-primary-neon/40 mt-4 uppercase"
            >
              Please wait for kernel handshake...
            </motion.div>
          </div>
        </div>
      </div>
      <div className="scanline" />
    </div>
  );
};
