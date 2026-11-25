import { ReactNode, CSSProperties } from "react";
export function Card({ children, className = "", style, onClick }: { children: ReactNode; className?: string; style?: CSSProperties; onClick?: () => void }) {
  return <section className={`card ${className}`} style={style} onClick={onClick}>{children}</section>;
}