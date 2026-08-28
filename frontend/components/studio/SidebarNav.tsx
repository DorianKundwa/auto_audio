"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Layers,
  Music,
  FolderOpen,
  Download,
  Settings,
  Sparkles,
  Zap,
} from "lucide-react";

interface SidebarNavProps {
  activeTab?: "studio" | "library" | "assets" | "exports";
  onTabChange?: (tab: "studio" | "library" | "assets" | "exports") => void;
  onOpenLibrary?: () => void;
  onOpenExport?: () => void;
}

export function SidebarNav({
  activeTab = "studio",
  onTabChange,
  onOpenLibrary,
  onOpenExport,
}: SidebarNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNav = (tab: "studio" | "library" | "assets" | "exports") => {
    if (onTabChange) {
      onTabChange(tab);
    }
    if (tab === "library" && onOpenLibrary) {
      onOpenLibrary();
    } else if (tab === "exports" && onOpenExport) {
      onOpenExport();
    } else if (tab === "studio" && pathname !== "/" && !pathname.startsWith("/analyze")) {
      router.push("/");
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-20 bg-surface-container-lowest flex flex-col items-center py-5 z-50 border-r border-outline-variant/10 select-none">
      {/* Brand Icon */}
      <button
        onClick={() => router.push("/")}
        className="mb-8 w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary-container to-secondary p-[1px] shadow-lg shadow-primary/20 hover:scale-105 transition-transform cursor-pointer"
        title="AutoAudio Studio"
      >
        <div className="w-full h-full bg-surface-container-lowest rounded-[11px] flex items-center justify-center text-sm font-bold text-primary">
          ⚡
        </div>
      </button>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-4 w-full px-2 flex-1">
        {/* Studio Link */}
        <button
          onClick={() => handleNav("studio")}
          className={`flex flex-col items-center justify-center py-3 rounded-xl transition-all cursor-pointer ${
            activeTab === "studio"
              ? "bg-primary-container text-on-primary-container shadow-md shadow-primary/20"
              : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
          }`}
          title="Studio Workstation"
        >
          <Layers className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">Studio</span>
        </button>

        {/* Library Link */}
        <button
          onClick={() => handleNav("library")}
          className={`flex flex-col items-center justify-center py-3 rounded-xl transition-all cursor-pointer ${
            activeTab === "library"
              ? "bg-primary-container text-on-primary-container shadow-md shadow-primary/20"
              : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
          }`}
          title="Sound Design Library"
        >
          <Music className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">Library</span>
        </button>

        {/* Assets Link */}
        <button
          onClick={() => handleNav("assets")}
          className={`flex flex-col items-center justify-center py-3 rounded-xl transition-all cursor-pointer ${
            activeTab === "assets"
              ? "bg-primary-container text-on-primary-container shadow-md shadow-primary/20"
              : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
          }`}
          title="Audio Assets & Stems"
        >
          <FolderOpen className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">Assets</span>
        </button>

        {/* Exports Link */}
        <button
          onClick={() => handleNav("exports")}
          className={`flex flex-col items-center justify-center py-3 rounded-xl transition-all cursor-pointer ${
            activeTab === "exports"
              ? "bg-primary-container text-on-primary-container shadow-md shadow-primary/20"
              : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
          }`}
          title="Export Video & Mixdown"
        >
          <Download className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">Exports</span>
        </button>
      </nav>

      {/* Bottom Settings Link */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="w-10 h-10 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
          title="Engine Status: Online"
        >
          <Sparkles className="w-4 h-4 text-tertiary" />
        </button>
      </div>
    </aside>
  );
}
