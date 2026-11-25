import { ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-wrap fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="modal w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--line)" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b p-5" style={{ borderColor: "var(--line)" }}>
          <h2 className="text-xl font-bold" style={{ color: "var(--color-white, white)" }}>{title}</h2>
          <button type="button" className="icon-button" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}