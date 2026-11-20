"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId } from "wagmi";
import {
  ShieldCheck,
  GraduationCap,
  Wallet,
  CheckCircle2,
  Menu,
  X,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    name: "University Portal",
    href: "/issuer",
    icon: GraduationCap,
    description: "Issue & Revoke Credentials",
  },
  {
    name: "Student Wallet",
    href: "/wallet",
    icon: Wallet,
    description: "Soulbound SBT Vault",
  },
  {
    name: "Public Verifier",
    href: "/verify",
    icon: CheckCircle2,
    description: "Cryptographic Proofs",
  },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isConnected } = useAccount();
  const chainId = useChainId();

  if (pathname === "/") return null;

  const isPolygonAmoy = chainId === 80002;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[rgba(89,43,155,0.1)] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-[62px] max-w-[1248px] items-center justify-between px-6 sm:px-8">
        {/* Brand / Logo + Momentum Pulse Dot */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-90 group"
          >
            {/* Momentum Pulse Dot */}
            <div className="relative flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-momentum-pulse" />
              <span className="absolute w-4 h-4 rounded-full bg-[#ef4444]/30 animate-ping pointer-events-none" />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#592B9B]/10 text-[#592B9B] border border-[#592B9B]/20 transition-transform group-hover:scale-105">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span
                className="text-lg font-extrabold tracking-[-0.04em] text-[#1A1523]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                VeriVault
                <span className="ml-1 text-[10px] font-bold tracking-[0.1em] text-[#592B9B] uppercase font-mono">
                  Amoy
                </span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 pl-6 border-l border-[#ECE8F2]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-bold transition-all duration-200",
                    isActive
                      ? "bg-[#592B9B]/10 text-[#592B9B] border border-[#592B9B]/20"
                      : "text-[#55505F] hover:text-[#F16221] hover:bg-white"
                  )}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5",
                      isActive ? "text-[#592B9B]" : "text-[#767E8C]"
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side: Network Status & Connect Button */}
        <div className="flex items-center gap-3">
          {/* Network indicator badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F7F5FB] border border-[#ECE8F2] text-xs font-mono font-bold text-[#592B9B]">
            <Radio
              className={cn(
                "h-3 w-3",
                isConnected
                  ? isPolygonAmoy
                    ? "text-[#059669] animate-pulse"
                    : "text-[#F16221]"
                  : "text-[#767E8C]"
              )}
            />
            <span>AMOY 80002</span>
          </div>

          <ConnectButton
            chainStatus="none"
            showBalance={false}
            accountStatus={{
              smallScreen: "avatar",
              largeScreen: "full",
            }}
          />

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="md:hidden p-2 rounded-xl text-[#1A1523] hover:bg-[#F7F5FB]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5 text-[#1A1523]" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#ECE8F2] bg-white px-6 py-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl p-3 text-sm font-bold transition-all",
                  isActive
                    ? "bg-[#592B9B]/10 text-[#592B9B]"
                    : "text-[#55505F] hover:text-[#F16221] hover:bg-[#F7F5FB]"
                )}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <Icon className="h-4 w-4" />
                <div>
                  <div className="font-bold">{item.name}</div>
                  <div className="text-xs text-[#767E8C] font-normal">{item.description}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}

export default Navbar;
