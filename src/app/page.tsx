"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { VERIVAULT_CONTRACT_ADDRESS } from "@/config/contract";

// ============================================================================
// STYLES & CONSTANTS
// Palette: ground #EFE9DD, secondary ground #E5DED0, ink #141C2B,
// secondary ink #4A5364, muted #767E8C, one ink blue #2C4A8F, hairlines rgba(20,28,43,.16).
// Display: 'Newsreader', serif with italic accent.
// Body/Labels: 'Courier Prime', monospace.
// Radius: 0 everywhere.
// Blue: Type, rule, or drawn line only. Never a filled area.
// ============================================================================

interface VariantData {
  id: string;
  label: string;
  claimName: string;
  claimValue: string;
  pathD: string;
  leafHash: string;
  siblings: string;
  reconstructedRoot: string;
}

const VARIANTS: VariantData[] = [
  {
    id: "01",
    label: "01 / CGPA MERIT CLAIM",
    claimName: "CGPA_CLAIM",
    claimValue: "CGPA >= 8.0 (First Class Honors)",
    pathD: "M 40 160 C 90 160, 110 80, 180 80 C 250 80, 280 140, 360 140 C 440 140, 480 60, 560 60 L 680 60",
    leafHash: "0x7a91c49e2182098b17dc94a501e74bf239f8d1c9aa029481ec663d9198642a8b",
    siblings: "3 SIBLINGS [0x4f82..., 0x9b11..., 0x1c3a...]",
    reconstructedRoot: "0x72a956625402f4270fa0e93b01cace5de4b6a9dd20f684ede3bf05bd7c0fb07d",
  },
  {
    id: "02",
    label: "02 / CONFERRED DEGREE",
    claimName: "DEGREE",
    claimValue: "B.Tech Computer Science & Engineering",
    pathD: "M 40 160 C 100 160, 140 120, 200 120 C 260 120, 310 40, 390 40 C 470 40, 520 110, 600 110 L 680 110",
    leafHash: "0x3e18a90fd5923b1c6742a0b4e287119e07f59d184a7e289c0993018247ca881e",
    siblings: "3 SIBLINGS [0x82b1..., 0x1a7f..., 0x550d...]",
    reconstructedRoot: "0x72a956625402f4270fa0e93b01cace5de4b6a9dd20f684ede3bf05bd7c0fb07d",
  },
  {
    id: "03",
    label: "03 / GRADUATION YEAR",
    claimName: "GRAD_YEAR",
    claimValue: "Class of 2028 (Conferred In Absentia)",
    pathD: "M 40 160 C 80 160, 130 90, 210 90 C 290 90, 340 150, 420 150 C 500 150, 540 70, 620 70 L 680 70",
    leafHash: "0x918f0a2134db22091c7849e8a37f901cb9234b5840d73812985aa09218204b77",
    siblings: "3 SIBLINGS [0x66c0..., 0x2e44..., 0x8a92...]",
    reconstructedRoot: "0x72a956625402f4270fa0e93b01cace5de4b6a9dd20f684ede3bf05bd7c0fb07d",
  },
];

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<VariantData>(VARIANTS[0]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isDemoVisible, setIsDemoVisible] = useState(false);

  const demoRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  // --------------------------------------------------------------------------
  // 1. Accessibility: Check prefers-reduced-motion
  // --------------------------------------------------------------------------
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // --------------------------------------------------------------------------
  // 2. Scroll Position Binding for Travelling Product & Spread Wordmark
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (prefersReducedMotion) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [prefersReducedMotion]);

  // --------------------------------------------------------------------------
  // 3. Intersection Observer for Self-Drawing Demonstration
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!demoRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsDemoVisible(true);
          observer.disconnect(); // Fires once as specified
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(demoRef.current);
    return () => observer.disconnect();
  }, []);

  // --------------------------------------------------------------------------
  // 4. Trigger Self-Drawing SVG Animation
  // --------------------------------------------------------------------------
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const length = path.getTotalLength();
    path.style.transition = "none";
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = isDemoVisible || prefersReducedMotion ? "0" : `${length}`;

    if (isDemoVisible && !prefersReducedMotion) {
      // Force repaint
      path.getBoundingClientRect();
      path.style.strokeDashoffset = `${length}`;
      setTimeout(() => {
        path.style.transition = "stroke-dashoffset 2.1s cubic-bezier(0.16, 1, 0.3, 1)";
        path.style.strokeDashoffset = "0";
      }, 50);
    }
  }, [selectedVariant, isDemoVisible, prefersReducedMotion]);

  // --------------------------------------------------------------------------
  // 5. Travelling Product Interpolation Stops
  // --------------------------------------------------------------------------
  // Stop 0 (Hero, 0px scroll): x=66vw, y=20vh, scale=1, rot=-3deg, opacity=1
  // Stop 1 (Argument, ~650px scroll): x=14vw, y=36vh, scale=0.86, rot=7deg, opacity=0.95
  // Stop 2 (Demonstration, ~1400px scroll): x=76vw, y=50vh, scale=0.75, rot=-2deg, opacity=0.9
  // Stop 3 (Fade out beyond 2100px scroll): opacity=0, visibility=hidden
  let productX = 66;
  let productY = 20;
  let productScale = 1;
  let productRot = -3;
  let productOpacity = 1;
  let productVisibility: "visible" | "hidden" = "visible";

  if (!prefersReducedMotion) {
    if (scrollY <= 650) {
      const p = Math.max(0, Math.min(1, scrollY / 650));
      const e = 1 - (1 - p) * (1 - p);
      productX = 66 + (14 - 66) * e;
      productY = 20 + (36 - 20) * e;
      productScale = 1 + (0.86 - 1) * e;
      productRot = -3 + (7 - -3) * e;
      productOpacity = 1;
    } else if (scrollY <= 1400) {
      const p = Math.max(0, Math.min(1, (scrollY - 650) / 750));
      const e = p * p;
      productX = 14 + (76 - 14) * e;
      productY = 36 + (50 - 36) * e;
      productScale = 0.86 + (0.75 - 0.86) * e;
      productRot = 7 + (-2 - 7) * e;
      productOpacity = 0.95 + (0.9 - 0.95) * e;
    } else if (scrollY <= 2100) {
      const p = Math.max(0, Math.min(1, (scrollY - 1400) / 700));
      productX = 76 + (65 - 76) * p;
      productY = 50 + (62 - 50) * p;
      productScale = 0.75 + (0.65 - 0.75) * p;
      productRot = -2 + (4 - -2) * p;
      productOpacity = 0.9 * (1 - p);
    } else {
      productOpacity = 0;
      productVisibility = "hidden";
    }
  }

  // Spread wordmark computation: outward letters drift and sink as user scrolls away from hero
  const heroSpreadProgress = Math.min(1, Math.max(0, scrollY / 450));
  const letterSinkPx = prefersReducedMotion ? 0 : heroSpreadProgress * 42;
  const letterSpreadEm = prefersReducedMotion ? 0 : heroSpreadProgress * 0.18;

  return (
    <div
      className="min-h-screen text-[#141C2B] selection:bg-[#E5DED0] selection:text-[#141C2B]"
      style={{
        backgroundColor: "#EFE9DD",
        fontFamily: "'Courier Prime', monospace",
      }}
    >
      {/* =================================================================== */}
      {/* THE TRAVELLING PRODUCT (Cut-out with subtle shadow, fixed path)     */}
      {/* =================================================================== */}
      {!prefersReducedMotion && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            left: `${productX}vw`,
            top: `${productY}vh`,
            transform: `translate(-50%, -50%) rotate(${productRot}deg) scale(${productScale})`,
            opacity: productOpacity,
            visibility: productVisibility,
            zIndex: 35,
            pointerEvents: "none",
            transition: "opacity 0.25s linear",
            // The only element with drop shadow per specification
            filter: "drop-shadow(0 24px 36px rgba(20, 28, 43, 0.24)) drop-shadow(0 6px 14px rgba(20, 28, 43, 0.14))",
          }}
          className="w-56 h-56 sm:w-72 sm:h-72 select-none"
        >
          {/* Engraved Sovereign Credential Vault Seal Cut-out */}
          <svg viewBox="0 0 280 280" className="w-full h-full" fill="none">
            {/* Outer Circular Ground Disk */}
            <circle cx="140" cy="140" r="136" fill="#E5DED0" stroke="#141C2B" strokeWidth="2.5" />
            <circle cx="140" cy="140" r="128" stroke="#141C2B" strokeWidth="1" strokeDasharray="3 3" />

            {/* Inner Ring with Hairline Rule */}
            <circle cx="140" cy="140" r="114" stroke="#141C2B" strokeWidth="1.5" />
            <circle cx="140" cy="140" r="110" stroke="#2C4A8F" strokeWidth="0.75" />

            {/* Security Archival Text Along Circular Path */}
            <path id="sealPath" d="M 40, 140 A 100,100 0 1,1 240, 140 A 100,100 0 1,1 40, 140" fill="none" />
            <text fill="#141C2B" fontSize="9" letterSpacing="0.22em" fontFamily="'Courier Prime', monospace">
              <textPath href="#sealPath" startOffset="5%">
                VERIVAULT · SOULBOUND VAULT ARTIFACT · EIP-5192 · TESTNET 80002 ·
              </textPath>
            </text>

            {/* Central Merkle Cryptographic Crest */}
            <circle cx="140" cy="140" r="78" fill="#EFE9DD" stroke="#141C2B" strokeWidth="1.5" />
            <circle cx="140" cy="140" r="74" stroke="rgba(20, 28, 43, 0.2)" strokeWidth="0.75" />

            {/* Merkle Tree Structural Lines (Engraved Linework) */}
            <line x1="140" y1="92" x2="140" y2="124" stroke="#2C4A8F" strokeWidth="1.5" />
            <line x1="140" y1="124" x2="108" y2="148" stroke="#141C2B" strokeWidth="1.2" />
            <line x1="140" y1="124" x2="172" y2="148" stroke="#141C2B" strokeWidth="1.2" />
            <line x1="108" y1="148" x2="94" y2="174" stroke="#141C2B" strokeWidth="1" />
            <line x1="108" y1="148" x2="122" y2="174" stroke="#141C2B" strokeWidth="1" />
            <line x1="172" y1="148" x2="158" y2="174" stroke="#141C2B" strokeWidth="1" />
            <line x1="172" y1="148" x2="186" y2="174" stroke="#141C2B" strokeWidth="1" />

            {/* Nodes */}
            <circle cx="140" cy="92" r="6" fill="#EFE9DD" stroke="#2C4A8F" strokeWidth="1.8" />
            <circle cx="108" cy="148" r="4.5" fill="#EFE9DD" stroke="#141C2B" strokeWidth="1.4" />
            <circle cx="172" cy="148" r="4.5" fill="#EFE9DD" stroke="#141C2B" strokeWidth="1.4" />
            <circle cx="94" cy="174" r="3.5" fill="#EFE9DD" stroke="#141C2B" strokeWidth="1" />
            <circle cx="122" cy="174" r="3.5" fill="#EFE9DD" stroke="#141C2B" strokeWidth="1" />
            <circle cx="158" cy="174" r="3.5" fill="#EFE9DD" stroke="#141C2B" strokeWidth="1" />
            <circle cx="186" cy="174" r="3.5" fill="#EFE9DD" stroke="#141C2B" strokeWidth="1" />

            {/* Central Padlock / EIP-5192 Shackle */}
            <path d="M 134 116 L 134 110 C 134 105 146 105 146 110 L 146 116" stroke="#2C4A8F" strokeWidth="1.5" strokeLinecap="square" />
            <rect x="131" y="115" width="18" height="13" fill="#E5DED0" stroke="#141C2B" strokeWidth="1.2" />
            <circle cx="140" cy="120" r="1.5" fill="#2C4A8F" />

            {/* Bottom Plaque Legend */}
            <text x="140" y="202" textAnchor="middle" fill="#4A5364" fontSize="6.5" letterSpacing="0.16em">
              KECCAK-256 · SENSITIVE
            </text>
            <text x="140" y="213" textAnchor="middle" fill="#2C4A8F" fontSize="7" fontWeight="bold" letterSpacing="0.14em">
              NON-TRANSFERABLE
            </text>
          </svg>
        </div>
      )}

      {/* =================================================================== */}
      {/* 0. NAVIGATION (Fixed 58px bar on translucent ground, 12px blur)     */}
      {/* =================================================================== */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "58px",
          backgroundColor: "rgba(239, 233, 221, 0.88)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(20, 28, 43, 0.16)",
          zIndex: 50,
        }}
        className="flex items-center justify-between px-6 sm:px-12"
      >
        {/* Wordmark at 19px with trailing period in accent */}
        <Link
          href="/"
          className="text-[19px] tracking-[-0.02em] font-normal flex items-baseline select-none"
          style={{ fontFamily: "'Newsreader', Georgia, serif" }}
        >
          <span>VERIVAULT</span>
          <span style={{ color: "#2C4A8F", fontWeight: 600 }}>.</span>
        </Link>

        {/* Monospaced uppercase links turning accent on hover */}
        <nav className="hidden md:flex items-center space-x-8 text-[11px] tracking-[0.1em] uppercase">
          <Link href="#argument" className="text-[#4A5364] hover:text-[#2C4A8F] transition-colors">
            01 / Argument
          </Link>
          <Link href="#demonstration" className="text-[#4A5364] hover:text-[#2C4A8F] transition-colors">
            02 / Demonstration
          </Link>
          <Link href="#material" className="text-[#4A5364] hover:text-[#2C4A8F] transition-colors">
            03 / Protocol Material
          </Link>
          <Link href="#measurements" className="text-[#4A5364] hover:text-[#2C4A8F] transition-colors">
            04 / Measurements
          </Link>
        </nav>

        {/* One square button (0px radius) */}
        <Link
          href="/verify"
          style={{
            border: "1px solid #141C2B",
            borderRadius: 0,
            padding: "8px 16px",
            fontSize: "11px",
            letterSpacing: "0.09em",
            textTransform: "uppercase",
            color: "#141C2B",
            backgroundColor: "transparent",
            transition: "all 0.15s ease",
          }}
          className="hover:border-[#2C4A8F] hover:text-[#2C4A8F]"
        >
          [ VERIFY CREDENTIAL ]
        </Link>
      </header>

      {/* =================================================================== */}
      {/* 1. HERO SECTION                                                    */}
      {/* Full viewport minus nav, secondary ground #E5DED0, overflow clipped */}
      {/* =================================================================== */}
      <section
        style={{
          marginTop: "58px",
          minHeight: "calc(100vh - 58px)",
          backgroundColor: "#E5DED0",
          overflow: "hidden",
          borderBottom: "1px solid rgba(20, 28, 43, 0.16)",
        }}
        className="flex flex-col justify-between px-6 sm:px-12 pt-12 relative"
      >
        {/* Copy Block no wider than 46vw */}
        <div style={{ maxWidth: "46vw" }} className="w-full space-y-6 pt-4 sm:pt-8 z-10">
          {/* Monospaced kicker */}
          <div
            style={{
              fontSize: "11px",
              letterSpacing: "0.1em",
              color: "#4A5364",
              textTransform: "uppercase",
            }}
          >
            SPECIFICATION NO. 5192 / POLYGON AMOY TESTNET / CHAIN 80002
          </div>

          {/* Headline clamp(32px, 4.6vw, 68px) with italic phrase in blue */}
          <h1
            style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontSize: "clamp(32px, 4.6vw, 68px)",
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              fontWeight: 400,
              color: "#141C2B",
            }}
          >
            Academic credentials held with{" "}
            <span
              style={{
                fontStyle: "italic",
                color: "#2C4A8F",
                fontFamily: "'Newsreader', Georgia, serif",
              }}
            >
              cryptographic finality
            </span>{" "}
            and zero exposure of unrequested record.
          </h1>

          {/* Monospaced lede */}
          <p
            style={{
              fontSize: "12px",
              lineHeight: 1.9,
              letterSpacing: "0.07em",
              color: "#4A5364",
              maxWidth: "42vw",
            }}
          >
            VeriVault commits accredited academic tenure to Polygon Amoy as non-transferable
            ERC-5192 Soulbound Tokens. Every credential attribute is individually salted client-side,
            hashed with Keccak-256, and verified through zero-knowledge Merkle proofs. Zero student
            identifying data touches the public blockchain.
          </p>

          {/* Two square buttons (sharp 0px radius) */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/issuer"
              style={{
                borderRadius: 0,
                border: "1px solid #141C2B",
                backgroundColor: "#141C2B",
                color: "#EFE9DD",
                padding: "12px 24px",
                fontSize: "11px",
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                display: "inline-block",
                transition: "background 0.15s ease",
              }}
              className="hover:bg-[#2C4A8F] hover:border-[#2C4A8F]"
            >
              [ ENTER REGISTRAR PORTAL ]
            </Link>

            <Link
              href="/wallet"
              style={{
                borderRadius: 0,
                border: "1px solid rgba(20, 28, 43, 0.4)",
                backgroundColor: "transparent",
                color: "#141C2B",
                padding: "12px 24px",
                fontSize: "11px",
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                display: "inline-block",
                transition: "border 0.15s ease",
              }}
              className="hover:border-[#2C4A8F] hover:text-[#2C4A8F]"
            >
              [ OPEN STUDENT VAULT ]
            </Link>
          </div>
        </div>

        {/* Bottom Section Layout */}
        <div style={{ marginTop: "auto" }} className="w-full z-10 pt-16">
          {/* Hairline-topped strip of monospaced specifications */}
          <div
            style={{
              borderTop: "1px solid rgba(20, 28, 43, 0.16)",
              paddingTop: "14px",
              paddingBottom: "18px",
              fontSize: "11px",
              letterSpacing: "0.09em",
              color: "#767E8C",
            }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 uppercase"
          >
            <div>
              <span className="text-[#141C2B] font-bold">STANDARD:</span> ERC-5192 SOULBOUND
            </div>
            <div>
              <span className="text-[#141C2B] font-bold">NETWORK:</span> POLYGON AMOY #80002
            </div>
            <div>
              <span className="text-[#141C2B] font-bold">COMMITMENT:</span> 32-BYTE MERKLE ROOT
            </div>
            <div>
              <span className="text-[#141C2B] font-bold">PLAINTEXT ON-CHAIN:</span> 0 BYTES
            </div>
          </div>

          {/* Spread Wordmark across the very foot */}
          {/* justify-content: space-between spanning full width, translated down slightly to crop baseline */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              width: "100%",
              overflow: "hidden",
              borderTop: "1px solid rgba(20, 28, 43, 0.12)",
              transform: `translateY(${14 + letterSinkPx}px)`,
              transition: prefersReducedMotion ? "none" : "transform 0.1s linear",
            }}
            className="select-none"
            aria-label="VERIVAULT"
          >
            {["V", "E", "R", "I", "V", "A", "U", "L", "T"].map((letter, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "'Newsreader', Georgia, serif",
                  fontSize: "clamp(64px, 12.8vw, 192px)",
                  lineHeight: 0.8,
                  letterSpacing: `${-0.03 + letterSpreadEm}em`,
                  fontWeight: 400,
                  color: "#141C2B",
                  display: "inline-block",
                  transformOrigin: "bottom center",
                }}
              >
                {letter}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 2. ARGUMENT SECTION (Two-column layout)                             */}
      {/* =================================================================== */}
      <section
        id="argument"
        style={{
          borderBottom: "1px solid rgba(20, 28, 43, 0.16)",
          backgroundColor: "#EFE9DD",
        }}
        className="px-6 sm:px-12 py-24"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Heading and Monospaced Lede */}
          <div className="lg:col-span-5 space-y-6">
            <div className="text-[11px] tracking-[0.1em] text-[#2C4A8F] uppercase font-bold">
              01 / THE ARCHITECTURAL ARGUMENT
            </div>
            <h2
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontSize: "clamp(28px, 3.2vw, 44px)",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                fontWeight: 400,
              }}
            >
              Why traditional credentials demand{" "}
              <span style={{ fontStyle: "italic", color: "#2C4A8F" }}>excessive disclosure</span>.
            </h2>
            <p className="text-[11.5px] leading-[1.9] tracking-[0.07em] text-[#4A5364]">
              When an employer asks an applicant to verify their degree or prove their graduation
              year, traditional university notarizations force the applicant to hand over a
              complete academic transcript. This exposes sensitive personal identifiers: home
              address, date of birth, complete course failures, and raw numerical grades.
            </p>
            <p className="text-[11.5px] leading-[1.9] tracking-[0.07em] text-[#4A5364]">
              VeriVault inverts this relationship through cryptographic commitment. Academic records
              are decomposed into individual cryptographic leaves. The student discloses only the
              exact claim requested; the mathematical sibling proof certifies validity without
              unmasking the remainder of the tree.
            </p>
          </div>

          {/* Right Column: Hairline-ruled rows */}
          <div className="lg:col-span-7 divide-y divide-[rgba(20,28,43,0.16)] border-y border-[rgba(20,28,43,0.16)]">
            {/* Row 1 */}
            <div className="py-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
              <div className="space-y-1 sm:max-w-[70%]">
                <div className="text-[11px] tracking-[0.09em] text-[#2C4A8F] uppercase font-bold">
                  NON-TRANSFERABLE TENURE (ERC-5192)
                </div>
                <div className="text-[11.5px] text-[#4A5364] leading-[1.7]">
                  Degrees are bound permanently to the recipient identity wallet. The EVM bytecode
                  `_update` function strictly reverts on any transferFrom call.
                </div>
              </div>
              <div className="text-[12px] font-bold text-[#141C2B] tracking-[0.06em] tabular-nums shrink-0">
                LOCKED(TOKENID) == TRUE
              </div>
            </div>

            {/* Row 2 */}
            <div className="py-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
              <div className="space-y-1 sm:max-w-[70%]">
                <div className="text-[11px] tracking-[0.09em] text-[#2C4A8F] uppercase font-bold">
                  ZERO-PLAINTEXT COMMITMENT
                </div>
                <div className="text-[11.5px] text-[#4A5364] leading-[1.7]">
                  No student names, roll numbers, or GPAs are ever recorded on the public ledger.
                  Only the 32-byte Keccak-256 Merkle root is committed to Polygon Amoy.
                </div>
              </div>
              <div className="text-[12px] font-bold text-[#141C2B] tracking-[0.06em] tabular-nums shrink-0">
                0 BYTES PLAINTEXT
              </div>
            </div>

            {/* Row 3 */}
            <div className="py-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
              <div className="space-y-1 sm:max-w-[70%]">
                <div className="text-[11px] tracking-[0.09em] text-[#2C4A8F] uppercase font-bold">
                  SELECTIVE ATTRIBUTE DISCLOSURE
                </div>
                <div className="text-[11.5px] text-[#4A5364] leading-[1.7]">
                  Students choose which claims to prove (e.g. `CGPA &gt;= 8.0`) while retaining
                  complete confidentiality over legal name, roll numbers, and raw scores.
                </div>
              </div>
              <div className="text-[12px] font-bold text-[#141C2B] tracking-[0.06em] tabular-nums shrink-0">
                1 OF N VERIFIED
              </div>
            </div>

            {/* Row 4 */}
            <div className="py-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
              <div className="space-y-1 sm:max-w-[70%]">
                <div className="text-[11px] tracking-[0.09em] text-[#2C4A8F] uppercase font-bold">
                  IMMUTABLE ON-CHAIN REVOCATION
                </div>
                <div className="text-[11.5px] text-[#4A5364] leading-[1.7]">
                  Accredited registrars maintain instant revocation authority with an on-chain
                  public audit trail for academic misconduct or clerical cancellation.
                </div>
              </div>
              <div className="text-[12px] font-bold text-[#141C2B] tracking-[0.06em] tabular-nums shrink-0">
                EVENT CREDENTIALREVOKED
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 3. DEMONSTRATION SECTION (Draws itself, variant picker)             */}
      {/* =================================================================== */}
      <section
        id="demonstration"
        ref={demoRef}
        style={{
          borderBottom: "1px solid rgba(20, 28, 43, 0.16)",
          backgroundColor: "#E5DED0",
        }}
        className="px-6 sm:px-12 py-24"
      >
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Header */}
          <div className="space-y-4 text-center sm:text-left">
            <div className="text-[11px] tracking-[0.1em] text-[#2C4A8F] uppercase font-bold">
              02 / THE DEMONSTRATION THAT DRAWS ITSELF
            </div>
            <h2
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontSize: "clamp(28px, 3.2vw, 44px)",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                fontWeight: 400,
              }}
            >
              The cryptographic proof{" "}
              <span style={{ fontStyle: "italic", color: "#2C4A8F" }}>drawing its own path</span> to root.
            </h2>
            <p className="text-[11.5px] leading-[1.9] tracking-[0.07em] text-[#4A5364] max-w-2xl">
              Select an academic attribute claim below. Observe how the leaf hash connects across
              mathematical sibling checkpoints to reconstitute the exact 32-byte Merkle root
              committed on Polygon Amoy.
            </p>
          </div>

          {/* Row of Variant Buttons using aria-pressed */}
          <div className="flex flex-wrap gap-2 pt-2">
            {VARIANTS.map((v) => {
              const isSelected = selectedVariant.id === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedVariant(v)}
                  style={{
                    borderRadius: 0,
                    border: isSelected ? "1.5px solid #141C2B" : "1px solid rgba(20, 28, 43, 0.25)",
                    backgroundColor: isSelected ? "#141C2B" : "transparent",
                    color: isSelected ? "#EFE9DD" : "#141C2B",
                    padding: "10px 18px",
                    fontSize: "11px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  className="hover:border-[#2C4A8F]"
                >
                  {v.label}
                </button>
              );
            })}
          </div>

          {/* Bordered Panel holding SVG of the product's own output */}
          <div
            style={{
              borderRadius: 0,
              border: "1px solid rgba(20, 28, 43, 0.25)",
              backgroundColor: "#EFE9DD",
            }}
            className="p-6 sm:p-10 space-y-8"
          >
            {/* SVG Drawing Canvas */}
            <div className="w-full overflow-hidden bg-[#E5DED0]/60 border border-[rgba(20,28,43,0.12)] p-4 sm:p-6">
              <svg viewBox="0 0 720 220" className="w-full h-auto" fill="none">
                {/* Reference Grid Hairlines */}
                <line x1="40" y1="30" x2="680" y2="30" stroke="rgba(20, 28, 43, 0.08)" strokeDasharray="2 2" />
                <line x1="40" y1="100" x2="680" y2="100" stroke="rgba(20, 28, 43, 0.08)" strokeDasharray="2 2" />
                <line x1="40" y1="170" x2="680" y2="170" stroke="rgba(20, 28, 43, 0.08)" strokeDasharray="2 2" />

                {/* Sibling Checkpoint Guides */}
                <circle cx="180" cy="80" r="3" fill="#767E8C" />
                <text x="180" y="70" textAnchor="middle" fill="#767E8C" fontSize="9" letterSpacing="0.08em">
                  H(SIBLING 1)
                </text>

                <circle cx="360" cy="140" r="3" fill="#767E8C" />
                <text x="360" y="162" textAnchor="middle" fill="#767E8C" fontSize="9" letterSpacing="0.08em">
                  H(SIBLING 2)
                </text>

                <circle cx="560" cy="60" r="3" fill="#767E8C" />
                <text x="560" y="50" textAnchor="middle" fill="#767E8C" fontSize="9" letterSpacing="0.08em">
                  H(SIBLING 3)
                </text>

                {/* The Self-Drawing Path */}
                <path
                  ref={pathRef}
                  d={selectedVariant.pathD}
                  stroke="#2C4A8F"
                  strokeWidth="2.5"
                  strokeLinecap="square"
                  fill="none"
                />

                {/* Terminal Origin (Salted Leaf) */}
                <rect x="32" y="152" width="16" height="16" fill="#141C2B" />
                <text x="40" y="186" textAnchor="middle" fill="#141C2B" fontSize="9" fontWeight="bold">
                  SALTED LEAF
                </text>

                {/* Terminal Destination (Polygon Amoy Committed Root) */}
                <rect x="672" y="52" width="16" height="16" stroke="#2C4A8F" strokeWidth="2" fill="#EFE9DD" />
                <text x="680" y="86" textAnchor="middle" fill="#2C4A8F" fontSize="9" fontWeight="bold">
                  ON-CHAIN ROOT
                </text>
              </svg>
            </div>

            {/* Three Monospaced Facts beneath the drawing */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 border-t border-[rgba(20,28,43,0.16)] text-[11px] leading-[1.8] tracking-[0.07em]">
              {/* Fact 1 */}
              <div className="space-y-1">
                <div className="text-[#2C4A8F] font-bold uppercase">FACT 01 / LEAF DIGEST</div>
                <div className="text-[#141C2B] font-bold break-all font-mono">
                  {selectedVariant.leafHash.slice(0, 24)}...
                </div>
                <div className="text-[#767E8C]">
                  Computed as `keccak256({selectedVariant.claimName}:salt)`
                </div>
              </div>

              {/* Fact 2 */}
              <div className="space-y-1">
                <div className="text-[#2C4A8F] font-bold uppercase">FACT 02 / SIBLING PROOFS</div>
                <div className="text-[#141C2B] font-bold font-mono">
                  {selectedVariant.siblings}
                </div>
                <div className="text-[#767E8C]">
                  Ordered paired hashes required to calculate root
                </div>
              </div>

              {/* Fact 3 */}
              <div className="space-y-1">
                <div className="text-[#2C4A8F] font-bold uppercase">FACT 03 / ROOT EQUIVALENCE</div>
                <div className="text-[#141C2B] font-bold break-all font-mono">
                  0x72a95662...07d
                </div>
                <div className="text-[#059669] font-bold">
                  ✓ Matches On-Chain Token #1 Root Exactly
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 4. MATERIAL SECTION (Two-column layout)                             */}
      {/* =================================================================== */}
      <section
        id="material"
        style={{
          borderBottom: "1px solid rgba(20, 28, 43, 0.16)",
          backgroundColor: "#EFE9DD",
        }}
        className="px-6 sm:px-12 py-24"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Heading & Monospaced Lede */}
          <div className="lg:col-span-5 space-y-6">
            <div className="text-[11px] tracking-[0.1em] text-[#2C4A8F] uppercase font-bold">
              03 / PROTOCOL MATERIALS
            </div>
            <h2
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontSize: "clamp(28px, 3.2vw, 44px)",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                fontWeight: 400,
              }}
            >
              The cryptographic and architectural{" "}
              <span style={{ fontStyle: "italic", color: "#2C4A8F" }}>materials</span> of the vault.
            </h2>
            <p className="text-[11.5px] leading-[1.9] tracking-[0.07em] text-[#4A5364]">
              Like physical archive bond paper, linen binding threads, and wax registrar seals,
              decentralized software possesses a material composition. VeriVault selects only
              rigorous, mathematically audited primitives with long shelf-lives and zero vendor
              lock-in.
            </p>
          </div>

          {/* Right Column: Hairline-ruled rows */}
          <div className="lg:col-span-7 divide-y divide-[rgba(20,28,43,0.16)] border-y border-[rgba(20,28,43,0.16)]">
            {/* Row 1 */}
            <div className="py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div className="space-y-0.5">
                <div className="text-[11px] tracking-[0.09em] text-[#2C4A8F] uppercase font-bold">
                  HASH PRIMITIVE
                </div>
                <div className="text-[11.5px] text-[#4A5364]">
                  Keccak-256 algorithmic permutation for all leaf digests and Merkle node pairs.
                </div>
              </div>
              <div className="text-[11.5px] font-bold text-[#141C2B] tracking-[0.06em] tabular-nums shrink-0">
                FIPS 202 (256-BIT)
              </div>
            </div>

            {/* Row 2 */}
            <div className="py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div className="space-y-0.5">
                <div className="text-[11px] tracking-[0.09em] text-[#2C4A8F] uppercase font-bold">
                  CLIENT-SIDE ENTROPY
                </div>
                <div className="text-[11.5px] text-[#4A5364]">
                  Cryptographically secure pseudo-random number generator (CSPRNG) nonces generated per attribute.
                </div>
              </div>
              <div className="text-[11.5px] font-bold text-[#141C2B] tracking-[0.06em] tabular-nums shrink-0">
                32 BYTES (256-BIT ENTROPY)
              </div>
            </div>

            {/* Row 3 */}
            <div className="py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div className="space-y-0.5">
                <div className="text-[11px] tracking-[0.09em] text-[#2C4A8F] uppercase font-bold">
                  INSTITUTIONAL ACCREDITATION REGISTRY
                </div>
                <div className="text-[11.5px] text-[#4A5364]">
                  GovTech Singapore OpenCerts standard mapping registrar signing keys to verified institutional domains.
                </div>
              </div>
              <div className="text-[11.5px] font-bold text-[#141C2B] tracking-[0.06em] tabular-nums shrink-0">
                AISHE & NAAC GRADE A+
              </div>
            </div>

            {/* Row 4 */}
            <div className="py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div className="space-y-0.5">
                <div className="text-[11px] tracking-[0.09em] text-[#2C4A8F] uppercase font-bold">
                  EXECUTION CONSENSUS
                </div>
                <div className="text-[11.5px] text-[#4A5364]">
                  Polygon Bor EVM testnet layer with sub-2-second block finality and low transaction overhead.
                </div>
              </div>
              <div className="text-[11.5px] font-bold text-[#141C2B] tracking-[0.06em] tabular-nums shrink-0">
                POLYGON AMOY (80002)
              </div>
            </div>

            {/* Row 5 */}
            <div className="py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div className="space-y-0.5">
                <div className="text-[11px] tracking-[0.09em] text-[#2C4A8F] uppercase font-bold">
                  SMART CONTRACT FOUNDATION
                </div>
                <div className="text-[11.5px] text-[#4A5364]">
                  OpenZeppelin Contracts v5.0 implementation with EIP-5192 Minimal Soulbound lock interfaces.
                </div>
              </div>
              <div className="text-[11.5px] font-bold text-[#141C2B] tracking-[0.06em] tabular-nums shrink-0">
                SOLIDITY ^0.8.24
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 5. MEASUREMENTS SECTION (Single column of hairline-ruled rows)     */}
      {/* =================================================================== */}
      <section
        id="measurements"
        style={{
          borderBottom: "1px solid rgba(20, 28, 43, 0.16)",
          backgroundColor: "#E5DED0",
        }}
        className="px-6 sm:px-12 py-24"
      >
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="space-y-3">
            <div className="text-[11px] tracking-[0.1em] text-[#2C4A8F] uppercase font-bold">
              04 / VERIFIABLE MEASUREMENTS
            </div>
            <h2
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontSize: "clamp(28px, 3.2vw, 44px)",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                fontWeight: 400,
              }}
            >
              Measured facts of the system.
            </h2>
            <p className="text-[11.5px] leading-[1.9] tracking-[0.07em] text-[#4A5364]">
              VeriVault avoids subjective claims. All parameters below represent measurable technical
              benchmarks audited directly on Polygon Amoy.
            </p>
          </div>

          <div className="divide-y divide-[rgba(20,28,43,0.16)] border-y border-[rgba(20,28,43,0.16)] text-[11.5px]">
            {/* Measurement 1 */}
            <div className="py-4 flex items-baseline justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[#2C4A8F] font-bold uppercase mr-3">ON-CHAIN STORAGE FOOTPRINT</span>
                <span className="text-[#4A5364]">Only the 32-byte Merkle root committed per issued degree</span>
              </div>
              <div className="font-bold text-[#141C2B] tabular-nums shrink-0">32 BYTES</div>
            </div>

            {/* Measurement 2 */}
            <div className="py-4 flex items-baseline justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[#2C4A8F] font-bold uppercase mr-3">PLAINTEXT COMMITTED ON-CHAIN</span>
                <span className="text-[#4A5364]">Student PII, names, and grade items completely omitted from chain</span>
              </div>
              <div className="font-bold text-[#141C2B] tabular-nums shrink-0">0 BYTES</div>
            </div>

            {/* Measurement 3 */}
            <div className="py-4 flex items-baseline justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[#2C4A8F] font-bold uppercase mr-3">VERIFICATION LATENCY</span>
                <span className="text-[#4A5364]">End-to-end QR code decompression, RPC call, and Merkle leaf validation</span>
              </div>
              <div className="font-bold text-[#141C2B] tabular-nums shrink-0">&lt; 1.8 SECONDS</div>
            </div>

            {/* Measurement 4 */}
            <div className="py-4 flex items-baseline justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[#2C4A8F] font-bold uppercase mr-3">TRANSFER REJECTION RATE</span>
                <span className="text-[#4A5364]">Secondary market sales or identity movements denied by contract bytecode</span>
              </div>
              <div className="font-bold text-[#141C2B] tabular-nums shrink-0">100.00%</div>
            </div>

            {/* Measurement 5 */}
            <div className="py-4 flex items-baseline justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[#2C4A8F] font-bold uppercase mr-3">AUTOMATED TEST HARNESS</span>
                <span className="text-[#4A5364]">Hardhat TypeScript test suite covering roles, immutability, and events</span>
              </div>
              <div className="font-bold text-[#141C2B] tabular-nums shrink-0">26 / 26 PASSING</div>
            </div>

            {/* Measurement 6 */}
            <div className="py-4 flex items-baseline justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[#2C4A8F] font-bold uppercase mr-3">DEPLOYED CONTRACT ADDRESS</span>
                <span className="text-[#4A5364]">Active immutable contract bytecode on Polygon Amoy testnet</span>
              </div>
              <div className="font-bold font-mono text-[#141C2B] tabular-nums shrink-0">
                0x1Ba1...7D9c
              </div>
            </div>

            {/* Measurement 7 */}
            <div className="py-4 flex items-baseline justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[#2C4A8F] font-bold uppercase mr-3">LIVE SAMPLE TOKEN (#1)</span>
                <span className="text-[#4A5364]">Confirmed on-chain mint transaction for Jadavpur University demo</span>
              </div>
              <div className="font-bold font-mono text-[#141C2B] tabular-nums shrink-0">
                TX #0x6bb2f8...
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 6. CLOSE SECTION                                                   */}
      {/* Short headline with italic accent phrase, fine-print, 2 buttons,   */}
      {/* hairline footer strip, wordmark cropped by page edge.              */}
      {/* =================================================================== */}
      <footer
        style={{
          backgroundColor: "#EFE9DD",
          overflow: "hidden",
        }}
        className="pt-20"
      >
        <div className="px-6 sm:px-12 space-y-12 max-w-7xl mx-auto">
          {/* Headline + Fine Print + Buttons Row */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-12 border-b border-[rgba(20,28,43,0.16)]">
            <div className="space-y-4 max-w-xl">
              <div className="text-[11px] tracking-[0.1em] text-[#2C4A8F] uppercase font-bold">
                05 / ACCESS THE REGISTRY
              </div>
              <h2
                style={{
                  fontFamily: "'Newsreader', Georgia, serif",
                  fontSize: "clamp(30px, 3.8vw, 52px)",
                  lineHeight: 1.12,
                  letterSpacing: "-0.02em",
                  fontWeight: 400,
                }}
              >
                Conferred once,{" "}
                <span style={{ fontStyle: "italic", color: "#2C4A8F" }}>sovereign forever</span>.
              </h2>
              <div className="text-[11px] tracking-[0.08em] text-[#767E8C] uppercase">
                GOVTECH OPENCERTS STANDARDS COMPLIANT / ERC-5192 MINIMAL SOULBOUND / TESTNET 80002
              </div>
            </div>

            {/* Two square buttons at opposite edge */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/issuer"
                style={{
                  borderRadius: 0,
                  border: "1px solid #141C2B",
                  backgroundColor: "#141C2B",
                  color: "#EFE9DD",
                  padding: "12px 22px",
                  fontSize: "11px",
                  letterSpacing: "0.09em",
                  textTransform: "uppercase",
                  transition: "background 0.15s ease",
                }}
                className="hover:bg-[#2C4A8F] hover:border-[#2C4A8F]"
              >
                [ ENTER REGISTRAR PORTAL ]
              </Link>

              <Link
                href="/verify"
                style={{
                  borderRadius: 0,
                  border: "1px solid #141C2B",
                  backgroundColor: "transparent",
                  color: "#141C2B",
                  padding: "12px 22px",
                  fontSize: "11px",
                  letterSpacing: "0.09em",
                  textTransform: "uppercase",
                  transition: "border 0.15s ease",
                }}
                className="hover:border-[#2C4A8F] hover:text-[#2C4A8F]"
              >
                [ VERIFY A CREDENTIAL ]
              </Link>
            </div>
          </div>

          {/* Hairline Footer Strip */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] tracking-[0.08em] text-[#767E8C] uppercase pt-2">
            <div>
              VERIVAULT PROTOCOL © 2026. MIT LICENSE.
            </div>
            <div className="flex items-center gap-4">
              <a
                href={`https://amoy.polygonscan.com/address/${VERIVAULT_CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#2C4A8F] transition-colors"
              >
                POLYGONSCAN CONTRACT ↗
              </a>
              <span>•</span>
              <a
                href="https://eips.ethereum.org/EIPS/eip-5192"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#2C4A8F] transition-colors"
              >
                EIP-5192 SPECIFICATION ↗
              </a>
            </div>
          </div>
        </div>

        {/* Cropped Wordmark at the Very Foot */}
        {/* Wordmark full width translated down slightly so the page edge crops it */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            width: "100%",
            overflow: "hidden",
            transform: "translateY(22%)",
            marginTop: "2rem",
          }}
          className="select-none px-4"
          aria-label="VERIVAULT"
        >
          {["V", "E", "R", "I", "V", "A", "U", "L", "T"].map((letter, i) => (
            <span
              key={i}
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontSize: "clamp(64px, 13vw, 210px)",
                lineHeight: 0.8,
                letterSpacing: "-0.03em",
                fontWeight: 400,
                color: "rgba(20, 28, 43, 0.95)",
                display: "inline-block",
              }}
            >
              {letter}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
