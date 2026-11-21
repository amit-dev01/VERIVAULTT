"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Plus,
  ExternalLink,
  ShieldCheck,
  Award,
  Sparkles,
  Lock,
  Eye,
  QrCode,
  Building2,
  Wallet,
  CheckCircle2,
  Check,
} from "lucide-react";
import { VERIVAULT_CONTRACT_ADDRESS } from "@/config/contract";

// ============================================================================
// Scenario Scroll Data
// ============================================================================
const SCENARIOS = [
  {
    id: "01",
    time: "09:15 AM",
    headline: "Prove CGPA ≥ 8.5 to recruiters without sharing raw transcripts.",
  },
  {
    id: "02",
    time: "11:40 AM",
    headline: "University registrar mints 1,200 graduation credentials in one batch.",
  },
  {
    id: "03",
    time: "02:20 PM",
    headline: "Tech recruiter verifies candidate degree on-chain in 38ms.",
  },
  {
    id: "04",
    time: "04:45 PM",
    headline: "Graduate applies anonymously for foreign grants with zero data leaks.",
  },
  {
    id: "05",
    time: "07:10 PM",
    headline: "Registrar logs immutable revocation audit trail on Polygon Amoy.",
  },
];

// ============================================================================
// FAQ Accordion Data
// ============================================================================
const FAQS = [
  {
    question: "How does selective disclosure protect student privacy?",
    answer:
      "When you share your credential, you choose exactly which claims to reveal (e.g. your Degree and 'CGPA >= 8.5'). The hidden fields (like your legal name or roll number) are stripped, and only their cryptographic sibling hashes are provided. Verifiers mathematically prove your claims match the on-chain Merkle root without seeing unhashed data.",
  },
  {
    question: "Why does VeriVault store zero plaintext on-chain?",
    answer:
      "Public blockchains are permanent and transparent. Storing student names, grades, or IDs on-chain violates privacy laws like GDPR, FERPA, and DPDP. VeriVault only commits a single 32-byte Keccak-256 Merkle root. All personal data stays in your self-custody wallet.",
  },
  {
    question: "What makes an EIP-5192 Soulbound Token non-transferable?",
    answer:
      "Unlike standard ERC-721 NFTs that can be traded on OpenSea, ERC-5192 Soulbound tokens emit a Locked event on minting. Any attempt to transfer or sell the degree token automatically reverts at the smart contract level, binding it permanently to the student's Ethereum address.",
  },
  {
    question: "Do employers or verifiers need a crypto wallet to verify?",
    answer:
      "Not at all. The Public Instant Verifier is 100% web-based and runs in sub-2 seconds. Employers simply scan the student's dynamic QR code with any camera or paste the proof string. The browser queries the Polygon Amoy RPC directly without requiring MetaMask, gas tokens, or accounts.",
  },
  {
    question: "How are revocations logged on Polygon Amoy?",
    answer:
      "If a degree was conferred in error or cancelled, the authorized registrar calls revokeCredential(tokenId, reason) on-chain. This permanently flags the token as revoked and writes an immutable explanatory audit reason visible to verifiers worldwide.",
  },
];

export default function Home() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [emailInput, setEmailInput] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeTabPhone, setActiveTabPhone] = useState<"degree" | "gpa" | "name">("degree");

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setIsSubscribed(true);
      setTimeout(() => {
        setEmailInput("");
      }, 3000);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#FDFCF8] text-[#292524] selection:bg-[#FFB7B2] selection:text-[#292524] overflow-x-hidden font-['Outfit',sans-serif]">
      {/* -------------------------------------------------------------------- */}
      {/* 1. Global Persistent 0.35 Opacity Fractal Noise Grain Overlay        */}
      {/* -------------------------------------------------------------------- */}
      <div
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.35] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      {/* -------------------------------------------------------------------- */}
      {/* 2. Floating Pill-Shaped Navigation Bar                              */}
      {/* -------------------------------------------------------------------- */}
      <header className="fixed top-5 inset-x-0 z-40 px-4 pointer-events-none">
        <nav className="pointer-events-auto max-w-xl mx-auto h-14 rounded-full bg-white/70 backdrop-blur-[20px] border border-stone-200/80 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.04)] px-4 flex items-center justify-between transition-all duration-300">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-6 h-6 rounded-full bg-[#FFB7B2] flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="w-2 h-2 rounded-full bg-white" />
            </div>
            <span className="font-semibold text-base tracking-tight text-[#292524]">
              VeriVault
            </span>
          </Link>

          {/* Links */}
          <div className="hidden sm:flex items-center gap-6 text-sm text-[#78716C]">
            <Link
              href="/wallet"
              className="hover:text-[#292524] transition-colors font-medium"
            >
              Wallet
            </Link>
            <Link
              href="/verify"
              className="hover:text-[#292524] transition-colors font-medium"
            >
              Verifier
            </Link>
            <Link
              href="/issuer"
              className="hover:text-[#292524] transition-colors font-medium"
            >
              Registrar
            </Link>
          </div>

          {/* Dark Stone Pill CTA */}
          <Link
            href="/verify"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#292524] text-white text-xs font-semibold hover:bg-stone-800 transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Launch App</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </nav>
      </header>

      {/* -------------------------------------------------------------------- */}
      {/* 3. Hero Section                                                      */}
      {/* -------------------------------------------------------------------- */}
      <section className="relative pt-32 sm:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 max-w-4xl mx-auto text-center flex flex-col items-center">
        {/* Two Large Blurred Background Blobs */}
        <div
          className="absolute -top-10 -left-10 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-[#FFE4E1] opacity-60 blur-3xl pointer-events-none animate-softly-float -z-10"
          aria-hidden="true"
        />
        <div
          className="absolute top-20 -right-10 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-[#E6E6FA] opacity-60 blur-3xl pointer-events-none animate-softly-float-slow -z-10"
          aria-hidden="true"
        />

        {/* Soft Kicker Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8EFE8] border border-stone-200/50 text-xs text-[#292524] font-medium mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#292524]" />
          <span>Zero-Knowledge Academic Credentials</span>
        </div>

        {/* Main Headline with 'Reenie Beanie' Cursive Accent */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-[-0.025em] text-[#292524] leading-[1.08] max-w-3xl">
          Your academic proof, shared{" "}
          <span className="font-['Reenie_Beanie'] text-5xl sm:text-7xl md:text-8xl text-[#292524] font-normal mx-1 -rotate-2 inline-block">
            privately
          </span>{" "}
          with the world.
        </h1>

        {/* Sub-headline */}
        <p className="mt-6 text-base sm:text-lg text-[#78716C] max-w-[500px] leading-relaxed">
          VeriVault lets universities issue tamper-proof soulbound degrees on Polygon Amoy. Prove your honors and GPA without revealing transcripts.
        </p>

        {/* Dual CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm">
          <Link
            href="/wallet"
            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#FFB7B2] text-[#292524] font-semibold text-sm shadow-[0_4px_20px_-2px_rgba(255,183,178,0.5)] hover:bg-[#ffaaa4] hover:scale-[1.02] active:scale-[0.98] transition-all text-center"
          >
            Open Student Wallet
          </Link>
          <Link
            href="/verify"
            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white text-[#292524] font-semibold text-sm border border-stone-200 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] hover:bg-stone-50 hover:scale-[1.02] active:scale-[0.98] transition-all text-center"
          >
            Public Instant Verifier
          </Link>
        </div>

        {/* Proof Coordinates Subtext */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-[#78716C]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#292524]" />
            EIP-5192 Soulbound
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#292524]" />
            Polygon Amoy (80002)
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#292524]" />
            Zero Plaintext On-Chain
          </span>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 4. Horizontal Scenario Scroll                                        */}
      {/* -------------------------------------------------------------------- */}
      <section className="py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 mb-4 flex items-end justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-[#78716C]">
              Living Scenarios
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#292524] tracking-tight mt-1">
              How VeriVault breathes in everyday life
            </h2>
          </div>
          <span className="text-xs text-[#78716C] hidden sm:inline">
            Scroll horizontally →
          </span>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 sm:px-8 py-3 max-w-7xl mx-auto">
          {SCENARIOS.map((item) => (
            <div
              key={item.id}
              className="w-[288px] h-[160px] rounded-3xl bg-white border border-stone-200/80 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.04)] p-5 flex flex-col justify-between shrink-0 transition-all duration-300 hover:shadow-md hover:scale-[1.01] group cursor-default"
            >
              <div className="flex items-center justify-between text-xs text-stone-400 font-mono">
                <span>{item.time}</span>
                <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                  #{item.id}
                </span>
              </div>
              <p className="text-lg font-medium text-stone-800 leading-snug group-hover:text-[#FF857D] transition-colors">
                {item.headline}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 5. App Experience Preview (Three-Mockup Stacked Layout)              */}
      {/* -------------------------------------------------------------------- */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFEDF4] text-xs text-[#292524] font-medium mb-3">
            <Award className="w-3.5 h-3.5 text-[#292524]" />
            <span>Three Portals. One Protocol.</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#292524] tracking-tight">
            Designed like a tactile living room
          </h2>
          <p className="text-sm sm:text-base text-[#78716C] mt-2">
            Universities mint, students custody, and employers instantly verify with zero tracking.
          </p>
        </div>

        {/* Cascading 3-Phone Mockup Grid */}
        <div className="relative flex flex-col md:flex-row items-center justify-center gap-6 lg:gap-8 pt-4 pb-12">
          {/* Left Mockup: University Registrar (Sage #E8EFE8) */}
          <div className="w-[280px] sm:w-[300px] h-[520px] rounded-[2.5rem] bg-[#E8EFE8] border border-stone-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-5 flex flex-col justify-between md:translate-y-12 opacity-85 hover:opacity-100 transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-stone-600">
                <span className="font-semibold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  Registrar Portal
                </span>
                <span className="bg-white/80 px-2 py-0.5 rounded-full text-[10px]">
                  Gasless
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white/90 border border-stone-200/60 shadow-sm space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-mono">
                  Conferred Degree
                </span>
                <h4 className="font-bold text-sm text-[#292524] leading-tight">
                  B.Tech Computer Science
                </h4>
                <p className="text-xs text-stone-500">
                  Recipient: 0x71C...392
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/70 border border-stone-200/50 space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Merkle Commitment</span>
                  <span className="font-mono text-[10px] text-stone-800">32-Byte Root</span>
                </div>
                <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
                  <div className="bg-[#292524] h-full w-full" />
                </div>
                <span className="text-[10px] text-stone-500 block">
                  Zero Plaintext On-Chain
                </span>
              </div>
            </div>

            <Link
              href="/issuer"
              className="w-full py-3 rounded-full bg-[#292524] text-white text-xs font-semibold text-center hover:bg-stone-800 transition-colors"
            >
              Open Registrar Portal →
            </Link>
          </div>

          {/* Center Mockup: Student Privacy Wallet (White/Coral #FFB7B2) */}
          <div className="w-[300px] sm:w-[320px] h-[580px] rounded-[3rem] bg-white border-2 border-stone-200 shadow-[0_16px_40px_rgba(0,0,0,0.08)] p-6 flex flex-col justify-between relative z-10">
            <div className="space-y-4">
              {/* Top phone header */}
              <div className="flex items-center justify-between text-xs text-stone-600">
                <span className="font-bold text-[#292524] flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-[#FF857D]" />
                  Student ZK Vault
                </span>
                <span className="bg-[#E8EFE8] text-stone-800 font-mono text-[10px] px-2.5 py-0.5 rounded-full font-semibold">
                  Token #1
                </span>
              </div>

              {/* Dynamic QR Box */}
              <div className="p-4 rounded-2xl bg-[#FDFCF8] border border-stone-200/80 flex flex-col items-center justify-center">
                <div className="w-32 h-32 rounded-xl bg-white border border-stone-200 p-2 flex items-center justify-center shadow-inner">
                  <QrCode className="w-24 h-24 text-stone-800" />
                </div>
                <span className="text-[11px] text-stone-500 mt-2 font-mono">
                  Scan for Instant Proof
                </span>
              </div>

              {/* Interactive Selective Disclosure Toggles */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Selective Disclosure
                </span>

                <button
                  type="button"
                  onClick={() => setActiveTabPhone("degree")}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-colors ${
                    activeTabPhone === "degree"
                      ? "border-[#FFB7B2] bg-[#FFF0EF] text-stone-900 font-semibold"
                      : "border-stone-200 bg-stone-50/60 text-stone-600"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Degree: B.Tech CS
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700">Revealed</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTabPhone("gpa")}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-colors ${
                    activeTabPhone === "gpa"
                      ? "border-[#FFB7B2] bg-[#FFF0EF] text-stone-900 font-semibold"
                      : "border-stone-200 bg-stone-50/60 text-stone-600"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Claim: CGPA ≥ 8.5
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700">Revealed</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTabPhone("name")}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-colors ${
                    activeTabPhone === "name"
                      ? "border-stone-300 bg-stone-100 text-stone-800 font-semibold"
                      : "border-stone-200 bg-stone-50/60 text-stone-400"
                  }`}
                >
                  <span>Student Name</span>
                  <span className="text-[10px] font-mono text-stone-400">Blinded (Hidden)</span>
                </button>
              </div>
            </div>

            {/* Pulsing Coral Action Pill */}
            <Link
              href="/wallet"
              className="w-full py-3.5 rounded-full bg-[#FFB7B2] text-[#292524] text-xs font-bold text-center shadow-[0_4px_20px_-2px_rgba(255,183,178,0.6)] hover:bg-[#ffaaa4] transition-all flex items-center justify-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-[#292524] animate-ping" />
              <span>Open My Wallet</span>
            </Link>
          </div>

          {/* Right Mockup: Public Instant Verifier (Lavender #EFEDF4) */}
          <div className="w-[280px] sm:w-[300px] h-[520px] rounded-[2.5rem] bg-[#EFEDF4] border border-stone-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-5 flex flex-col justify-between md:translate-y-24 opacity-85 hover:opacity-100 transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-stone-600">
                <span className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  Instant Verifier
                </span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  38 ms
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white/90 border border-emerald-200 shadow-sm space-y-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Verified & Authentic
                </span>
                <h4 className="font-bold text-sm text-[#292524]">
                  GovTech OpenCerts
                </h4>
                <p className="text-xs text-stone-500">
                  Issuer: Jadavpur University
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/70 border border-stone-200/60 space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Degree Valid:</span>
                  <span className="font-bold text-emerald-700">Confirmed</span>
                </div>
                <div className="flex justify-between">
                  <span>Merit Level:</span>
                  <span className="font-bold text-emerald-700">CGPA ≥ 8.5</span>
                </div>
                <div className="flex justify-between">
                  <span>Revocation Check:</span>
                  <span className="font-bold text-emerald-700">Active</span>
                </div>
              </div>
            </div>

            <Link
              href="/verify"
              className="w-full py-3 rounded-full bg-[#292524] text-white text-xs font-semibold text-center hover:bg-stone-800 transition-colors"
            >
              Verify A Credential →
            </Link>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 6. Diary Entry Testimonials                                          */}
      {/* -------------------------------------------------------------------- */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="text-center max-w-lg mx-auto mb-12">
          <span className="text-xs uppercase tracking-wider font-semibold text-[#78716C]">
            Field Notes
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#292524] tracking-tight mt-1">
            Diary entries from the network
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Note 1: -1 degree rotation */}
          <div className="rounded-3xl bg-white border border-stone-200/80 p-7 sm:p-8 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.04)] transform md:-rotate-1 hover:rotate-0 transition-transform duration-300 flex flex-col justify-between">
            <p className="text-base sm:text-lg text-stone-700 leading-relaxed">
              &ldquo;I sent my job application with proof of first-class honors. No transcripts, no dox, no identity theft risk. It felt liberating to own my proof.&rdquo;
            </p>
            <div className="mt-8 flex items-center">
              <span className="w-8 h-[1px] bg-stone-300 inline-block mr-2" />
              <span className="font-['Reenie_Beanie'] text-2xl text-stone-500 font-normal">
                Aarav, Class of 2028
              </span>
            </div>
          </div>

          {/* Note 2: +1 degree rotation */}
          <div className="rounded-3xl bg-white border border-stone-200/80 p-7 sm:p-8 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.04)] transform md:rotate-1 hover:rotate-0 transition-transform duration-300 flex flex-col justify-between">
            <p className="text-base sm:text-lg text-stone-700 leading-relaxed">
              &ldquo;Zero student data touches the blockchain. We are 100% compliant with FERPA and GDPR while giving graduates irrevocable mathematical proof.&rdquo;
            </p>
            <div className="mt-8 flex items-center">
              <span className="w-8 h-[1px] bg-stone-300 inline-block mr-2" />
              <span className="font-['Reenie_Beanie'] text-2xl text-stone-500 font-normal">
                Dr. S. Banerjee, Academic Registrar
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 7. Interactive FAQ Accordion                                         */}
      {/* -------------------------------------------------------------------- */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-2xl mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <span className="text-xs uppercase tracking-wider font-semibold text-[#78716C]">
            Clarifications
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#292524] tracking-tight mt-1">
            Questions, gently answered
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={faq.question}
                className="rounded-2xl bg-white border border-stone-200/70 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-medium text-base text-[#292524] hover:text-[#FF857D] transition-colors"
                >
                  <span className="leading-snug">{faq.question}</span>
                  <span
                    className={`w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-45 bg-[#FFB7B2]/40" : ""
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 text-stone-700" />
                  </span>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-[#78716C] leading-relaxed animate-in fade-in duration-300">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 8. Waitlist & Quick Launch Conversion Section                        */}
      {/* -------------------------------------------------------------------- */}
      <section className="relative py-20 sm:py-28 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        {/* Soft Blurred Gradient Behind */}
        <div
          className="absolute inset-0 max-w-lg mx-auto h-72 rounded-full bg-gradient-to-tr from-[#E8EFE8] via-[#FFE4E1] to-[#EFEDF4] opacity-70 blur-3xl -z-10 pointer-events-none"
          aria-hidden="true"
        />

        {/* Feature dark stone rounded-square icon with coral dot */}
        <div className="w-14 h-14 rounded-2xl bg-[#292524] mx-auto flex items-center justify-center shadow-md mb-6 relative">
          <div className="w-3 h-3 rounded-full bg-[#FFB7B2]" />
        </div>

        <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-[#292524] max-w-xl mx-auto">
          Begin your journey into quiet, verifiable education.
        </h2>
        <p className="mt-4 text-sm sm:text-base text-[#78716C] max-w-md mx-auto">
          Try our live testnet portals on Polygon Amoy or join our institutional registry update stream.
        </p>

        {/* Form: Email input + Black submit button */}
        <form
          onSubmit={handleSubscribe}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-md mx-auto"
        >
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="Enter institutional or student email..."
            required
            className="w-full sm:w-auto flex-1 h-12 px-5 rounded-full bg-white border border-stone-200 text-sm text-[#292524] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FFB7B2] shadow-sm"
          />
          <button
            type="submit"
            className="w-full sm:w-auto h-12 px-7 rounded-full bg-[#292524] text-white text-sm font-semibold hover:bg-stone-800 hover:scale-105 active:scale-95 transition-all shadow-md shrink-0"
          >
            {isSubscribed ? "Subscribed!" : "Keep Me Updated"}
          </button>
        </form>

        {/* Direct Portal Quick Links */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/issuer"
            className="px-4 py-2 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors shadow-sm"
          >
            University Registrar Portal
          </Link>
          <Link
            href="/wallet"
            className="px-4 py-2 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors shadow-sm"
          >
            Student Privacy Wallet
          </Link>
          <Link
            href="/verify"
            className="px-4 py-2 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors shadow-sm"
          >
            Public Instant Verifier
          </Link>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* 9. Minimalist Footer Strip                                           */}
      {/* -------------------------------------------------------------------- */}
      <footer className="border-t border-stone-200/60 py-8 px-4 text-center text-xs text-[#78716C] space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <span>VeriVault Academic Protocol</span>
          <span>•</span>
          <a
            href={`https://amoy.polygonscan.com/address/${VERIVAULT_CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#292524] underline inline-flex items-center gap-1 font-mono"
          >
            Smart Contract on Amoy <ExternalLink className="w-3 h-3" />
          </a>
          <span>•</span>
          <span>EIP-5192 Soulbound</span>
        </div>
        <p className="text-[11px] text-stone-400">
          Built with digital minimalism & zero-knowledge privacy for global higher education.
        </p>
      </footer>
    </div>
  );
}
