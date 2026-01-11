"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal as TerminalIcon } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getCommandResponse } from "@/lib/api";
import { portfolioData } from "@/data/portfolio";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type CommandResponse = {
  type: "text" | "component";
  content: any;
};

const Typewriter = ({
  text,
  delay = 10,
  onComplete,
}: {
  text: string;
  delay?: number;
  onComplete?: () => void;
}) => {
  const [segments, setSegments] = useState<
    { text: string; highlight: boolean }[]
  >([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHighlighting, setIsHighlighting] = useState(false);

  // Dynamically increase speed for longer texts to keep the experience snappy
  const adaptiveDelay = Math.max(1, delay - Math.floor(text.length / 400));

  useEffect(() => {
    if (currentIndex < text.length) {
      const char = text[currentIndex];

      // Handle highlight toggles
      if (char === "^") {
        setIsHighlighting(!isHighlighting);
        setCurrentIndex((prev) => prev + 1);
        return;
      }

      const randomDelay =
        char === "." || char === "," || char === "!"
          ? adaptiveDelay * 6
          : adaptiveDelay + Math.random() * 8;

      const timeout = setTimeout(() => {
        setSegments((prev) => {
          if (
            prev.length === 0 ||
            prev[prev.length - 1].highlight !== isHighlighting
          ) {
            return [...prev, { text: char, highlight: isHighlighting }];
          }
          const last = prev[prev.length - 1];
          const newSegments = [...prev];
          newSegments[newSegments.length - 1] = {
            ...last,
            text: last.text + char,
          };
          return newSegments;
        });
        setCurrentIndex((prev) => prev + 1);

        const terminalOutput = document.getElementById("terminal-scroller");
        if (terminalOutput) {
          const threshold = 150;
          const isAtBottom =
            terminalOutput.scrollHeight -
              terminalOutput.scrollTop -
              terminalOutput.clientHeight <=
            threshold;

          // Force scroll if we're near the bottom OR if it's the very beginning of typing
          if (isAtBottom || currentIndex < 5) {
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
          }
        }
      }, randomDelay);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, adaptiveDelay, text, onComplete, isHighlighting]);

  return (
    <>
      {segments.map((seg, i) => (
        <span
          key={i}
          className={
            seg.highlight
              ? "text-primary-neon font-bold brightness-110 drop-shadow-[0_0_8px_rgba(162,255,0,0.3)]"
              : ""
          }
        >
          {seg.text}
        </span>
      ))}
    </>
  );
};

export const Terminal = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [ghostSuggestion, setGhostSuggestion] = useState("");
  const [awaitingResponse, setAwaitingResponse] = useState<string | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [cpuUsage, setCpuUsage] = useState<string>("0.0");
  const [memUsage, setMemUsage] = useState<number>(400);
  const [hasMounted, setHasMounted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasMounted(true);
    setTime(new Date());
    setCpuUsage((Math.random() * 10).toFixed(1));
    setMemUsage(Math.floor(Math.random() * 100 + 400));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date | null) => {
    if (!date) return "--:--:--";
    return date.toLocaleTimeString([], {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  useEffect(() => {
    const scrollTask = setTimeout(() => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }, 100);
    return () => clearTimeout(scrollTask);
  }, [history]);

  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      handleCommand("neofetch");
      initialized.current = true;
    }
  }, []);

  const commands = [
    "help",
    "about",
    "skills",
    "projects",
    "experience",
    "education",
    "contact",
    "resume",
    "github",
    "hire",
    "clear",
    "neofetch",
    "whoami",
    "uptime",
    "reboot",
    "matrix",
  ];

  useEffect(() => {
    if (input.trim()) {
      const match = commands.find(
        (c) => c.startsWith(input.toLowerCase()) && c !== input.toLowerCase()
      );
      setGhostSuggestion(match ? match.slice(input.length) : "");
    } else {
      // Show 'help' as a hint when input is empty
      setGhostSuggestion("help");
    }
  }, [input]);

  const handleCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase();
    let response: CommandResponse | null = null;
    const timestamp = formatTime(new Date());
    setGhostSuggestion("");

    if (trimmedCmd === "clear") {
      setHistory([]);
      return;
    }

    if (trimmedCmd !== "") {
      setCommandHistory((prev) => [cmd, ...prev]);
    }

    if (awaitingResponse === "hire_confirm") {
      const timestamp = formatTime(new Date());
      setAwaitingResponse(null);
      if (trimmedCmd === "y" || trimmedCmd === "yes") {
        setHistory((prev) => [
          ...prev,
          { kind: "input", content: cmd, timestamp, isInteractive: true },
          {
            kind: "output",
            type: "component",
            content: <Contact />,
            timestamp,
          },
        ]);
        if (inputRef.current) inputRef.current.value = "";
        setInput("");
        return;
      } else {
        setHistory((prev) => [
          ...prev,
          { kind: "input", content: cmd, timestamp, isInteractive: true },
          {
            kind: "output",
            type: "text",
            content: "[ HIRE_SEQUENCE_ABORTED ]",
            timestamp,
          },
        ]);
        if (inputRef.current) inputRef.current.value = "";
        setInput("");
        return;
      }
    }

    if (awaitingResponse === "contact_choice") {
      const timestamp = formatTime(new Date());
      setAwaitingResponse(null);

      let redirectUrl = "";
      let outputText = "";

      if (trimmedCmd === "1" || trimmedCmd === "01" || trimmedCmd === "email") {
        redirectUrl = `mailto:${portfolioData.contact.email}`;
        outputText =
          "[ PROTOCOL_SELECTED ]: EMAIL\nLaunching default mail client...";
      } else if (
        trimmedCmd === "2" ||
        trimmedCmd === "02" ||
        trimmedCmd === "linkedin"
      ) {
        redirectUrl = portfolioData.contact.linkedin;
        outputText =
          "[ PROTOCOL_SELECTED ]: LINKEDIN\nRedirecting to professional network...";
      } else if (
        trimmedCmd === "3" ||
        trimmedCmd === "03" ||
        trimmedCmd === "github"
      ) {
        redirectUrl = portfolioData.contact.github;
        outputText =
          "[ PROTOCOL_SELECTED ]: GITHUB\nRedirecting to source repository...";
      } else {
        outputText = "[ ERROR ]: INVALID_SELECTION\nReturning to root shell.";
      }

      setHistory((prev) => [
        ...prev,
        { kind: "input", content: cmd, timestamp, isInteractive: true },
        {
          kind: "output",
          type: "text",
          content: outputText,
          timestamp,
        },
      ]);

      if (redirectUrl) {
        setTimeout(() => {
          if (redirectUrl.startsWith("mailto:")) {
            window.location.href = redirectUrl;
          } else {
            window.open(redirectUrl, "_blank");
          }
        }, 100);
      }

      if (inputRef.current) inputRef.current.value = "";
      setInput("");
      return;
    }

    switch (trimmedCmd) {
      case "help":
        response = {
          type: "text",
          content: `Available commands:
  help        Show this help message
  about       Learn more about me
  skills      View my technical stack
  projects    Browse my latest work
  experience  Professional journey
  education   Academic background
  contact     Ways to reach me
  resume      Get my latest CV
  github      Live GitHub stats
  hire        Why hire me?
  neofetch    Show system information
  whoami      Shows my philosophy
  uptime      Shows career journey
  reboot      Reload animation
  matrix      Matrix rain background
  clear       Empty the terminal`,
        };
        break;
      case "neofetch":
        response = {
          type: "component",
          content: <Neofetch />,
        };
        break;
      case "projects":
        response = getCommandResponse("projects");
        setIsTyping(true);
        break;
      case "contact":
        response = getCommandResponse("contact");
        setAwaitingResponse("contact_choice");
        break;
      case "hire":
        response = getCommandResponse("hire");
        setAwaitingResponse("hire_confirm");
        break;
      case "resume":
        response = {
          type: "component",
          content: (
            <DownloadProgress
              title="Aman_Bhatt_Resume.pdf"
              size="58KB"
              onComplete={() => {
                const link = document.createElement("a");
                link.href = "/resume/RESUME.pdf";
                link.download = "Aman_Bhatt_Resume.pdf";
                link.click();
              }}
            />
          ),
        };
        break;
      case "reboot":
        response = {
          type: "text",
          content:
            "[ SYSTEM MESSAGE: REBOOT_SEQUENCE_START ]\nClosing active sessions...\nSynchronizing cache...\nInitiating cold boot...",
        };
        setTimeout(() => window.location.reload(), 2000);
        break;
      case "matrix":
        response = {
          type: "component",
          content: <MatrixRainEffect />,
        };
        break;
      default:
        // Check API layer for other commands (about, skills, experience, etc.)
        const apiResponse = getCommandResponse(trimmedCmd);
        if (apiResponse) {
          if (apiResponse.content === "GITHUB_PROFILE") {
            apiResponse.content = <GithubProfile />;
          } else if (apiResponse.content === "EXPERIENCE_LIST") {
            apiResponse.content = <ExperienceList />;
          } else if (apiResponse.content === "EDUCATION_LIST") {
            apiResponse.content = <EducationList />;
          }
          response = apiResponse;
        } else if (trimmedCmd !== "") {
          response = {
            type: "text",
            content: `Command not found: ${trimmedCmd}. Type 'help' for a list of commands.`,
          };
        }
    }

    if (response) {
      if (response.type === "text") {
        setIsTyping(true);
      }
    }

    setHistory(
      (prev) =>
        [
          ...prev,
          { kind: "input", content: cmd, timestamp },
          response && { kind: "output", ...response, timestamp },
        ].filter(Boolean) as any[]
    );
    setHistoryIndex(-1);
    if (inputRef.current) inputRef.current.value = "";
    setInput("");
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCommand(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      } else {
        setHistoryIndex(-1);
        setInput("");
      }
    } else if (e.key === "Tab" || e.key === "ArrowRight") {
      if (ghostSuggestion) {
        e.preventDefault();
        setInput(input + ghostSuggestion);
        setGhostSuggestion("");
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-7xl h-[100dvh] sm:h-[90vh] md:h-[700px] rounded-none sm:rounded-xl overflow-hidden shadow-none sm:shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col relative z-20 border-none sm:border border-white/10 bg-[#0a0a0a] crt-container"
    >
      <div className="absolute inset-0 pointer-events-none crt-curve z-30" />

      {/* Terminal Title Bar */}
      <div className="flex flex-col bg-zinc-900/40 border-b border-white/5 backdrop-blur-md relative z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-[0_0_10px_rgba(255,95,86,0.5)] cursor-pointer hover:bg-[#ff7a72] transition-colors" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-[0_0_10px_rgba(255,189,46,0.5)] cursor-pointer hover:bg-[#ffca52] transition-colors" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-[0_0_10px_rgba(39,201,63,0.5)] cursor-pointer hover:bg-[#3de056] transition-colors" />
          </div>
          <div className="flex items-center gap-3 text-white/40 text-[10px] sm:text-xs select-none">
            <TerminalIcon
              size={14}
              className="text-primary-neon/60 animate-pulse"
            />
            <span className="line-clamp-1">kernel-core</span>
          </div>
        </div>

        {/* Quick Links Nav */}
        <div className="flex items-center gap-4 px-4 py-1.5 border-t border-white/5 bg-black/40 overflow-x-auto scrollbar-hide">
          {commands
            .filter((c) => c !== "clear" && c !== "neofetch")
            .map((cmd) => (
              <button
                key={cmd}
                onClick={() => handleCommand(cmd)}
                className="text-[10px] text-white/30 hover:text-primary-neon transition-colors uppercase whitespace-nowrap"
              >
                {cmd}
              </button>
            ))}
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={scrollRef}
        id="terminal-scroller"
        className="flex-1 overflow-y-auto p-6 sm:p-10 font-mono text-terminal-text space-y-2 scrollbar-hide crt-screen relative z-10 antialiased"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(circle_at_center,_#a2ff00_0%,_transparent_75%)]" />

        {history.map((item: any, i) => (
          <div
            key={i}
            className="whitespace-pre-wrap font-medium text-xs sm:text-sm md:text-base mb-1"
          >
            {item.kind === "input" ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                <span className="text-[10px] text-white/5 hidden sm:inline">
                  [{item.timestamp}]
                </span>
                <div className="flex items-center gap-1.5 overflow-hidden">
                  {!item.isInteractive ? (
                    <>
                      <span className="text-secondary-accent font-bold opacity-80 shrink-0 text-[10px] sm:text-xs md:text-sm">
                        aman@portfolio
                      </span>
                      <span className="text-primary-neon font-bold -ml-1 shrink-0 text-[10px] sm:text-xs md:text-sm">
                        :~$
                      </span>
                    </>
                  ) : (
                    <span className="text-primary-neon font-bold opacity-50 shrink-0 text-[10px] sm:text-xs md:text-sm">
                      [confirm] {">"}
                    </span>
                  )}
                  <span className="text-primary-neon font-bold ml-1 break-all">
                    {item.content}
                  </span>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-4"
              >
                <span className="text-xs text-transparent select-none hidden sm:inline">
                  [{item.timestamp}]
                </span>
                <div className="flex-1 text-terminal-text/80 leading-relaxed font-normal text-xs sm:text-sm md:text-base">
                  {item.type === "text" ? (
                    <Typewriter
                      text={item.content}
                      delay={5}
                      onComplete={
                        i === history.length - 1
                          ? () => setIsTyping(false)
                          : undefined
                      }
                    />
                  ) : (
                    item.content
                  )}
                </div>
              </motion.div>
            )}
          </div>
        ))}

        {/* Current Input */}
        <AnimatePresence>
          {!isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 group relative pb-10 mt-2 border-l border-primary-neon/10 pl-4 ml-1"
            >
              <span className="text-[11px] text-primary-neon/20 hidden sm:inline tabular-nums shrink-0">
                [{formatTime(time)}]
              </span>
              <div className="flex items-center gap-2 shrink-0">
                {!awaitingResponse ? (
                  <>
                    <span className="text-secondary-accent font-bold text-sm sm:text-base md:text-lg opacity-80">
                      aman@portfolio
                    </span>
                    <span className="text-primary-neon font-bold text-sm sm:text-base md:text-lg -ml-1">
                      :~$
                    </span>
                  </>
                ) : (
                  <span className="text-primary-neon font-bold text-sm sm:text-base md:text-lg opacity-50">
                    [confirm] {">"}
                  </span>
                )}
              </div>
              <div className="relative flex-1 min-w-0">
                {/* Ghost Suggestion Layer */}
                <div className="absolute inset-0 pointer-events-none text-terminal-text whitespace-pre opacity-20 text-sm sm:text-base md:text-lg font-medium overflow-hidden">
                  <span className="invisible">{input}</span>
                  {ghostSuggestion}
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  autoFocus
                  className="bg-transparent border-none outline-none w-full text-terminal-text font-mono relative z-10 text-sm sm:text-base md:text-lg font-medium caret-transparent"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <motion.div
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="absolute top-0.5 w-2 sm:w-2.5 h-5 sm:h-6 bg-primary-neon shadow-[0_0_15px_rgba(162,255,0,0.8)]"
                  style={{
                    left: `calc(${input.length}ch + 2px)`,
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} className="pb-10" />
      </div>

      {/* Terminal Footer Status Bar */}
      <div className="px-4 py-1 bg-zinc-900/90 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-white/30 relative z-40">
        <div className="flex gap-4">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>SYSTEM_READY</span>
          </div>
          {hasMounted && (
            <>
              <div className="flex items-center gap-1">
                <span>CPU:</span>
                <span className="text-primary-neon/60">{cpuUsage}%</span>
              </div>
              <div className="flex items-center gap-1">
                <span>MEM:</span>
                <span className="text-secondary-accent/60">
                  {memUsage}MB / 1024MB
                </span>
              </div>
            </>
          )}
        </div>
        <div className="flex gap-4 items-center">
          <span className="hover:text-primary-neon cursor-help">HELP [?]</span>
          <span className="text-white/10">|</span>
          <span>SECURE_SHELL_AES_256</span>
          <span className="text-white/10">|</span>
          <span className="text-white/50">
            {hasMounted ? new Date().toLocaleDateString() : "--/--/----"}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// Sub-components for commands

const Neofetch = () => (
  <div className="flex flex-col lg:flex-row gap-6 md:gap-10 py-4 md:py-6 items-center lg:items-start overflow-hidden">
    {/* ID Card inspired by the image */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[280px] lg:w-72 aspect-[3/4] glass border border-primary-neon/20 rounded-lg overflow-hidden flex flex-col relative group shrink-0"
    >
      <div className="h-1.5 md:h-2 bg-primary-neon/20 w-full" />
      <div className="flex-1 p-4 md:p-6 flex flex-col items-center justify-between">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-primary-neon/40 p-1 relative">
          <div className="absolute inset-0 rounded-full animate-spin-slow border-t-2 border-primary-neon/60 border-transparent" />
          <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden grayscale contrast-125">
            <img
              src="/images/my_self.jfif"
              alt="Aman Bhatt"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="text-center space-y-1">
          <div className="text-white font-bold tracking-widest text-base md:text-lg uppercase">
            Aman Bhatt
          </div>
          <div className="text-primary-neon/60 text-[9px] md:text-[10px] uppercase font-mono">
            Full Stack Developer
          </div>
        </div>
        <div className="w-full space-y-2 mt-3 md:mt-4">
          <div className="h-1 bg-white/5 w-full rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "85%" }}
              className="h-full bg-primary-neon/40"
            />
          </div>
          <div className="flex justify-between text-[7px] md:text-[8px] text-white/20 uppercase font-mono">
            <span>Authenticity</span>
            <span>85%</span>
          </div>
        </div>
        <div className="mt-3 md:mt-4 p-1.5 md:p-2 border border-white/5 bg-white/[0.02] w-full text-center">
          <div className="text-[7px] md:text-[8px] text-white/20 uppercase font-mono mb-0.5 md:mb-1">
            Access_Card
          </div>
          <div className="text-[9px] md:text-[10px] text-primary-neon font-mono tracking-widest uppercase">
            SYSPRT-7734-X
          </div>
        </div>
      </div>
      <div className="h-5 md:h-6 bg-zinc-900 flex items-center justify-center border-t border-white/5">
        <div className="flex gap-2 text-[7px] md:text-[8px] text-white/20 uppercase">
          <span>Status:</span>
          <span className="text-primary-neon animate-pulse">Online</span>
        </div>
      </div>
    </motion.div>

    <div className="space-y-1 flex-1 w-full max-w-full overflow-hidden">
      <div className="hidden sm:block text-primary-neon font-bold text-lg md:text-xl flex items-center gap-2">
        <span className="text-white/20">#</span> aman@portfolio
      </div>
      <div className="hidden sm:block text-white/20 py-1">
        --------------------------------
      </div>
      <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-xs md:text-sm">
        <div>
          <span className="text-primary-neon/60">OS:</span>{" "}
          <span className="text-white/80">AmanOS v2.0.24</span>
        </div>
        <div>
          <span className="text-primary-neon/60">KERNEL:</span>{" "}
          <span className="text-white/80">React-19-Core</span>
        </div>
        <div>
          <span className="text-primary-neon/60">DE:</span>{" "}
          <span className="text-white/80">RetroCRT-Next</span>
        </div>
        <div>
          <span className="text-primary-neon/60">CPU:</span>{" "}
          <span className="text-white/80">AI-Optimized-V8</span>
        </div>
        <div>
          <span className="text-primary-neon/60">MEMORY:</span>{" "}
          <span className="text-white/80">32GB Shared Flux</span>
        </div>
        <div className="col-span-1 md:col-span-2 lg:col-span-1">
          <span className="text-primary-neon/60">UPTIME:</span>{" "}
          <span className="text-white/80">{portfolioData.uptime.session}</span>
        </div>
        <div className="col-span-1 md:col-span-2 lg:col-span-1">
          <span className="text-primary-neon/60">LOC:</span>{" "}
          <span className="text-white/80">Earth/Remote</span>
        </div>
      </div>

      <div className="pt-4 md:pt-6 space-y-3">
        <div className="text-white/20 text-[9px] md:text-[10px] uppercase font-mono tracking-widest">
          {" >>> System_Directives"}
        </div>
        <p className="text-xs md:text-sm text-white/60 leading-relaxed italic border-l-2 border-primary-neon/20 pl-3 md:pl-4">
          {portfolioData.about.content}
        </p>
        <div className="flex items-center gap-2 text-primary-neon/40 text-[9px] md:text-[10px] uppercase font-bold mt-2">
          <span className="animate-pulse">▶</span>
          <span>Tip: Type 'help' to see available commands</span>
        </div>
      </div>
    </div>
  </div>
);

const DownloadProgress = ({
  title,
  size,
  onComplete,
}: {
  title: string;
  size: string;
  onComplete?: () => void;
}) => {
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);
  const hasCalledComplete = useRef(false);

  useEffect(() => {
    if (complete && !hasCalledComplete.current) {
      hasCalledComplete.current = true;
      onComplete?.();
    }
  }, [complete, onComplete]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setComplete(true);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const barWidth = 20;
  const completedChars = Math.floor((progress / 100) * barWidth);
  const bar =
    "[" +
    "=".repeat(completedChars) +
    ">" +
    " ".repeat(Math.max(0, barWidth - completedChars - 1)) +
    "]";

  return (
    <div className="py-2 space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-secondary-accent">
          {complete ? "✓" : "⚡"} {title}
        </span>
        <span className="text-white/40">{size}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-primary-neon font-bold tracking-tighter">
          {bar}
        </span>
        <span className="text-[10px] text-primary-neon">
          {Math.floor(progress)}%
        </span>
      </div>
      {complete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] text-green-400"
        >
          File ready: /downloads/{title}
        </motion.div>
      )}
    </div>
  );
};

const TerminalProgress = ({
  title,
  loading,
  onComplete,
}: {
  title: string;
  loading?: boolean;
  onComplete?: () => void;
}) => {
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90 && loading) {
          return 90;
        }
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setShowProgress(false);
            if (onComplete) onComplete();
          }, 400);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [onComplete, loading]);

  if (!showProgress) return null;

  const barWidth = 40;
  const completedChars = Math.floor((progress / 100) * barWidth);
  const bar =
    "[" +
    "=".repeat(completedChars) +
    ">" +
    " ".repeat(Math.max(0, barWidth - completedChars - 1)) +
    "]";

  return (
    <div className="py-2 space-y-1 font-mono">
      <div className="flex justify-between text-[10px] sm:text-xs">
        <span className="text-secondary-accent animate-pulse">⚡ {title}</span>
        <span className="text-white/40">FETCHING...</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-primary-neon font-bold tracking-tighter text-xs sm:text-sm">
          {bar}
        </span>
        <span className="text-[10px] text-primary-neon tabular-nums">
          {Math.floor(progress)}%
        </span>
      </div>
    </div>
  );
};

const GithubProfile = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/github");
        if (!res.ok) throw new Error("Failed to fetch GitHub data");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (error) {
    return (
      <div className="py-2 text-red-500 text-xs font-mono">
        [ ERROR ]: {error}
      </div>
    );
  }

  if (loading || !showProfile) {
    return (
      <div className="w-full">
        <TerminalProgress
          title="CONNECTING_TO_GITHUB_API"
          loading={loading}
          onComplete={() => setShowProfile(true)}
        />
      </div>
    );
  }

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-4 font-mono space-y-6"
    >
      {/* Header Info */}
      <div className="space-y-1">
        <div className="text-primary-neon font-bold text-lg">
          @{data.username.toUpperCase()}
        </div>
        <div className="text-white/60 text-xs italic">
          "{data.bio || "Digital Architect & Full Stack Developer"}"
        </div>
      </div>

      {/* Stats Table - Simple Terminal Style */}
      <div className="text-xs sm:text-sm space-y-1 border-l-2 border-white/5 pl-4">
        <div className="grid grid-cols-[120px_1fr] gap-2">
          <span className="text-white/30 uppercase">Full Name</span>
          <span className="text-white/80">{data.name || data.username}</span>
        </div>
        <div className="grid grid-cols-[120px_1fr] gap-2">
          <span className="text-white/30 uppercase">Repositores</span>
          <span className="text-primary-neon">{data.public_repos}</span>
        </div>
        <div className="grid grid-cols-[120px_1fr] gap-2">
          <span className="text-white/30 uppercase">Followers</span>
          <span className="text-secondary-accent">{data.followers}</span>
        </div>
        <div className="grid grid-cols-[120px_1fr] gap-2">
          <span className="text-white/30 uppercase">Contributions</span>
          <span className="text-white/80">
            {data.total_contributions} (Last 365 days)
          </span>
        </div>
        <div className="grid grid-cols-[120px_1fr] gap-2">
          <span className="text-white/30 uppercase">Location</span>
          <span className="text-white/80">{data.location || "Unknown"}</span>
        </div>
      </div>

      {/* Achievements - Simple List */}
      <div className="space-y-3">
        <div className="text-[10px] text-white/60 uppercase tracking-widest border-b border-white/10 pb-1">
          Achievements_Unlocked
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {data.achievements && data.achievements.length > 0 ? (
            data.achievements.map((ach: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 group">
                <span className="text-sm scale-110">{ach.icon}</span>
                <span className="text-[11px] text-white/70 group-hover:text-primary-neon transition-colors font-medium">
                  {ach.name}
                </span>
              </div>
            ))
          ) : (
            <span className="text-[10px] text-white/30 italic">
              [ NO_ACHIEVEMENTS_DUMPED ]
            </span>
          )}
        </div>
      </div>

      <div className="pt-2">
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-primary-neon hover:underline inline-flex items-center gap-2 border border-primary-neon/20 px-3 py-1 bg-primary-neon/5"
        >
          [ LAUNCH_GITHUB_PROFILE ]
        </a>
      </div>
    </motion.div>
  );
};

const ExperienceList = () => (
  <div className="space-y-4 py-2">
    <div className="text-secondary-accent font-bold mb-2 tracking-widest uppercase text-[10px]">
      {" >> Professional_Log"}
    </div>
    <div className="border-l border-white/10 ml-1 pl-4 space-y-4">
      {portfolioData.experience.entries.map((exp, idx) => (
        <div key={idx} className="space-y-3">
          <div className="space-y-1">
            <div className="text-white font-bold flex items-center gap-2 flex-wrap">
              <span className="text-primary-neon">{exp.id}.</span>
              {exp.role.toUpperCase()} @{" "}
              <span className="text-primary-neon/80 font-extrabold">
                {exp.company}
              </span>
            </div>
            <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider">
              {exp.period}
            </div>
          </div>

          <div className="space-y-1.5">
            {exp.points.map((point, pIdx) => (
              <div
                key={pIdx}
                className="text-xs sm:text-sm text-white/60 leading-relaxed max-w-2xl flex gap-3 group"
              >
                <span className="text-primary-neon/40 group-hover:text-primary-neon transition-colors flex-shrink-0 font-mono">
                  [+]
                </span>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const EducationList = () => (
  <div className="space-y-4 py-2">
    <div className="text-secondary-accent font-bold mb-2 tracking-widest uppercase text-[10px]">
      {" >> Academic_Records"}
    </div>
    <div className="space-y-4">
      {portfolioData.education.entries.map((edu, idx) => (
        <div
          key={idx}
          className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-2 border border-white/5 p-4 rounded bg-white/[0.01] hover:bg-white/[0.03] transition-colors group"
        >
          <div className="space-y-1">
            <div className="text-white font-bold text-base sm:text-lg group-hover:text-primary-neon transition-colors">
              {edu.degree}
            </div>
            <div className="text-xs sm:text-sm text-primary-neon/80 font-medium">
              {edu.institution}
            </div>
            <div className="text-[10px] text-white/30 uppercase tracking-widest mt-1">
              Spec: {edu.specialization}
            </div>
          </div>
          <div className="md:text-right flex flex-row md:flex-col justify-between md:justify-start items-center md:items-end gap-2">
            <div className="text-[10px] text-white/40 uppercase font-mono">
              {edu.classSpec.split("//")[0].trim()}
            </div>
            <div className="text-xs text-green-400 font-bold tracking-widest bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20">
              {edu.classSpec.split("//")[1]?.trim() || ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ProgressBar = ({ level, label }: { level: number; label: string }) => {
  const width = 20;
  const filled = Math.floor((level / 100) * width);
  const empty = width - filled;
  return (
    <div className="flex items-center gap-4 text-xs">
      <span className="w-24 text-white/80">{label}</span>
      <span className="text-primary-neon font-mono">
        {"[ "}
        {"■".repeat(filled)}
        {".".repeat(empty)}
        {" ]"}
      </span>
      <span className="text-[10px] text-white/40">{level}%</span>
    </div>
  );
};

const SkillTree = () => {
  const skills = [
    {
      category: "Backend_Development",
      items: [
        { name: "Node.js", level: 90 },
        { name: "PostgreSQL", level: 85 },
        { name: "Python/FastAPI", level: 75 },
      ],
    },
    {
      category: "Blockchain_&_Web3",
      items: [
        { name: "Solidity", level: 88 },
        { name: "Ethers.js", level: 92 },
        { name: "Rust", level: 60 },
      ],
    },
    {
      category: "Infrastructure",
      items: [
        { name: "Docker", level: 85 },
        { name: "AWS", level: 70 },
        { name: "CI/CD", level: 90 },
      ],
    },
  ];

  return (
    <div className="space-y-6 py-2">
      {skills.map((skill) => (
        <div key={skill.category}>
          <div className="text-secondary-accent font-bold mb-3 flex items-center gap-2 text-[10px] uppercase">
            <span className="w-1 h-1 bg-secondary-accent shadow-[0_0_8px_rgba(139,92,246,1)]" />
            {skill.category}
          </div>
          <div className="space-y-2 ml-4">
            {skill.items.map((item) => (
              <ProgressBar
                key={item.name}
                label={item.name}
                level={item.level}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const Contact = () => (
  <div className="flex flex-col gap-2 py-2 font-mono">
    <div className="text-xs text-white/30 mb-2 animate-pulse font-mono tracking-widest uppercase">
      / START_COMM_SEQ /
    </div>
    <div className="grid grid-cols-1 gap-2">
      <a
        href={portfolioData.contact.linkedin}
        target="_blank"
        className="flex items-center justify-between p-3 border border-white/5 hover:border-primary-neon/30 hover:bg-primary-neon/5 transition-all group"
      >
        <div className="flex items-center gap-4">
          <span className="text-primary-neon group-hover:translate-x-1 transition-transform">
            {">>>"}
          </span>
          <div className="text-sm text-white/80">LINKEDIN_CONNECT</div>
        </div>
        <div className="text-[10px] text-white/20 uppercase">
          {portfolioData.contact.linkedin.split("/in/").pop()}
        </div>
      </a>
      <a
        href={portfolioData.contact.github}
        target="_blank"
        className="flex items-center justify-between p-3 border border-white/5 hover:border-secondary-accent/30 hover:bg-secondary-accent/5 transition-all group"
      >
        <div className="flex items-center gap-4">
          <span className="text-secondary-accent group-hover:translate-x-1 transition-transform">
            {">>>"}
          </span>
          <div className="text-sm text-white/80">GITHUB_SOURCE</div>
        </div>
        <div className="text-[10px] text-white/20 uppercase">
          @{portfolioData.contact.github.split("/").pop()}
        </div>
      </a>
      <a
        href={`mailto:${portfolioData.contact.email}`}
        className="flex items-center justify-between p-3 border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all group cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <span className="text-white/40 group-hover:translate-x-1 transition-transform">
            {">>>"}
          </span>
          <div className="text-sm text-white/80">ENCRYPT_EMAIL</div>
        </div>
        <div className="text-[10px] text-white/20 uppercase">
          {portfolioData.contact.email}
        </div>
      </a>
    </div>
  </div>
);

const MatrixRainEffect = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"'#&_(),.;:?!\\|{}<>[]^~";
    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = 1;
    }

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#a2ff00";
      ctx.font = fontSize + "px monospace";

      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[-1] opacity-40 pointer-events-none"
    />
  );
};
