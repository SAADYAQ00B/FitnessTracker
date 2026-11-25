import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

export function Button({ 
  children, 
  variant = "primary", 
  icon: Icon, 
  onClick, 
  type = "button", 
  className = "",
  disabled = false 
}: {
  children: ReactNode; 
  variant?: "primary" | "secondary" | "ghost" | "danger"; 
  icon?: LucideIcon; 
  onClick?: () => void; 
  type?: "button" | "submit"; 
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button 
      type={type} 
      onClick={onClick} 
      className={`btn btn-${variant} ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      disabled={disabled}
    >
      {Icon && <Icon size={17} />}
      {children}
    </button>
  );
}