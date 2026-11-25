import { Link } from "react-router";
import { Zap } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 ${className}`} aria-label="FITNESSTRACKER Home">
      <span className="grid size-9 place-items-center rounded-xl bg-[var(--color-lime)] text-[var(--color-ink)] shadow-[0_0_20px_color-mix(in_srgb,var(--color-lime)_35%,transparent)] shrink-0 transition-transform hover:scale-105">
        <Zap size={18} fill="currentColor" />
      </span>
      <span className="text-lg font-black tracking-wider uppercase" style={{ color: "var(--color-white, white)" }}>
        FITNESSTRACKER
      </span>
    </Link>
  );
}
