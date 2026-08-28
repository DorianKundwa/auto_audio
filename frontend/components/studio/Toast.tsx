"use client";

import React from "react";
import { Sparkles, CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastItem {
  id: string;
  message: string;
  type?: "success" | "info" | "error";
}

interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#0e111a]/95 border border-white/10 shadow-2xl backdrop-blur-xl text-slate-100 text-xs font-medium animate-in slide-in-from-bottom-3 duration-200"
        >
          {t.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          ) : t.type === "info" ? (
            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          )}

          <span className="leading-snug">{t.message}</span>

          <button
            onClick={() => onDismiss(t.id)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
