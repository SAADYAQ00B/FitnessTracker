import { Link } from "react-router";
import { Home } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="text-center py-20">
      <span className="text-7xl font-black text-[color-mix(in_srgb,var(--color-lime)_40%,transparent)]">404</span>
      <h1 className="text-2xl font-bold mt-2">That page took a rest day.</h1>
      <p className="text-muted mt-2 mb-6">Let’s get you back on track.</p>
      <Link to="/" className="btn-primary inline-flex"><Home size={16} />Back home</Link>
    </div>
  );
}