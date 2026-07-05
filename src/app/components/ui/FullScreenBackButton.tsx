import React from "react";
import { ChevronLeft } from "lucide-react";

type Props = {
  onClick: () => void;
  label?: string;
};

export default function FullScreenBackButton({ onClick, label = "Kembali" }: Props) {
  return (
    <button
      onClick={onClick}
      className="absolute left-4 top-4 z-50 flex items-center gap-2 bg-white/90 text-slate-800 px-3 py-2 rounded-md shadow-sm hover:bg-white"
      aria-label={label}
    >
      <ChevronLeft size={18} />
      <span className="text-sm font-medium hidden xs:inline">{label}</span>
    </button>
  );
}
