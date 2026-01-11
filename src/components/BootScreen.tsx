"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const BOOT_LOGS = [
  "[    0.000000] Linux version 4.14.0-core (aman@amanOS)",
  "[    0.000000] Command line: BOOT_IMAGE=/vmlinuz-linux root=PARTUUID=... quiet",
  "[    0.042134] x86/fpu: Supporting XSAVE feature set: 0x001",
  "[    0.154231] Freeing SMP alternatives memory: 24K",
  "[    0.287612] smpboot: CPU0: Intel(R) Core(TM) i9-12900K CPU @ 3.20GHz",
  "[    0.432198] performance_monitor: IPS: enabled",
  "[    0.654321] ACPI: Core revision 20170831",
  "[    0.876543] pci 0000:00:00.0: [8086:4610] rev 02",
  "[    1.123456] vgaarb: bridge control transition default vga device",
  "[    1.345678] SCSI subsystem initialized",
  "[    1.567890] libata version 3.00 loaded.",
  "[    1.789012] usbcore: registered new interface driver usbfs",
  "[    2.012345] Initializing AmanOS Shell...",
  "[    2.234567] Loading Neural Engine Assets...",
  "[    2.456789] Establishing Encrypted Tunnel...",
  "[    2.678901] Checking System Integrity...",
  "[    2.890123] SYSTEM_READY: Initiating UI_TERMINAL",
];

export const BootScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let currentLog = 0;
    const logInterval = setInterval(() => {
      if (currentLog < BOOT_LOGS.length) {
        setLogs((prev) => [...prev, BOOT_LOGS[currentLog]]);
        currentLog++;
        setProgress((currentLog / BOOT_LOGS.length) * 100);
      } else {
        clearInterval(logInterval);
        setTimeout(onComplete, 800);
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
