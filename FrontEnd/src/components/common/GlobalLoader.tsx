import { useState, useEffect } from "react";
import { Zap } from "lucide-react";

export default function GlobalLoader() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleLoadingChange = (e: Event) => {
      const customEvent = e as CustomEvent<boolean | { isLoading?: boolean }>;
      if (typeof customEvent.detail === "boolean") {
        setLoading(customEvent.detail);
      } else if (customEvent.detail && typeof customEvent.detail.isLoading === "boolean") {
        setLoading(customEvent.detail.isLoading);
      }
    };

    window.addEventListener("api-loading-change", handleLoadingChange);
    return () => {
      window.removeEventListener("api-loading-change", handleLoadingChange);
    };
  }, []);

  if (!loading) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading data from server"
      className="pointer-events-none fixed inset-x-0 top-0 z-[99999]"
    >
      {/* Sleek slim top emerald progress bar (#16d9a0) */}
      <div className="relative h-[3px] w-full overflow-hidden bg-emerald-950/20">
        <div
          className="h-full bg-gradient-to-r from-[#08a978] via-[#16d9a0] to-[#6ee7b7] shadow-[0_0_14px_#16d9a0]"
          style={{
            width: "100%",
            animation: "globalProgress 1.4s ease-in-out infinite",
          }}
        />
      </div>

      {/* Compact glassmorphic pill badge with Zap icon and FITNESSTRACKER pulsing brand text */}
      <div className="flex justify-center pt-3 sm:justify-end sm:pr-6">
        <div className="flex items-center gap-2 rounded-full border border-[#16d9a0]/30 bg-[#101827]/85 px-3.5 py-1.5 shadow-[0_4px_24px_rgba(22,217,160,0.25)] backdrop-blur-md transition-all duration-200">
          <Zap size={14} className="animate-bounce text-[#16d9a0]" />
          <span className="text-[11px] font-bold tracking-wider text-[#16d9a0] animate-pulse">
            FITNESSTRACKER
          </span>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#16d9a0] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#16d9a0]" />
          </span>
        </div>
      </div>

      <style>{`
        @keyframes globalProgress {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
