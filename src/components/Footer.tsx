"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { RotateCcw, Check, ShieldCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { VERIVAULT_CONTRACT_ADDRESS } from "@/config/contract";

export function Footer() {
  const pathname = usePathname();
  const [cleared, setCleared] = useState(false);

  if (pathname === "/") return null;

  const handleClearCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      setCleared(true);
      toast.success("Local cache cleared. Demo environment reset to clean state.");
      setTimeout(() => {
        setCleared(false);
        window.location.reload();
      }, 1000);
    } catch {
      toast.error("Failed to clear local cache.");
    }
  };

  return (
    <footer className="border-t border-[#ECE8F2] bg-[#F7F5FB] py-8 text-xs text-[#55505F]">
      <div className="max-w-[1248px] mx-auto px-6 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Brand & Copyright */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#592B9B]" />
          <span className="font-medium text-[#1A1523]">
            VeriVault © 2026. ERC-5192 Soulbound Credentials & Zero-Knowledge Verification.
          </span>
        </div>

        {/* Center: Amoy Status & Contract Link */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#ECE8F2] text-[#592B9B] font-mono font-bold">
            <span className="inline-block w-2 h-2 rounded-full bg-[#059669] animate-pulse"></span>
            <span>POLYGON AMOY (80002)</span>
          </div>
          <span className="text-[#ECE8F2]">•</span>
          <a
            href={`https://amoy.polygonscan.com/address/${VERIVAULT_CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#592B9B] hover:text-[#F16221] font-mono font-bold flex items-center gap-1 transition-colors"
          >
            CONTRACT
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Right: Reset Demo Cache Button */}
        <div>
          <button
            type="button"
            onClick={handleClearCache}
            className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold text-[#55505F] bg-white border border-[#ECE8F2] hover:border-[#F16221] hover:text-[#F16221] transition-all shadow-sm"
          >
            {cleared ? (
              <>
                <Check className="h-3 w-3 text-[#059669]" />
                <span>Resetting...</span>
              </>
            ) : (
              <>
                <RotateCcw className="h-3 w-3" />
                <span>Reset Demo State</span>
              </>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
}
