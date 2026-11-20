"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  ShieldCheck,
  Upload,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  QrCode,
  Sparkles,
  Award,
  AlertCircle,
  Trash2,
  FolderOpen,
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import {
  FullCredentialPayload,
  buildSelectiveDisclosurePayload,
  compressPayload,
} from "@/lib/crypto";

// Default disclosure presets
const DEFAULT_DISCLOSED_KEYS: Record<string, boolean> = {
  DEGREE: true,
  GRAD_YEAR: true,
  CGPA_CLAIM: true,
  NAME: false,
  ROLL_NO: false,
};

// Friendly labels for credential attributes
const ATTRIBUTE_LABELS: Record<string, { title: string; description: string }> = {
  DEGREE: {
    title: "Degree / Program",
    description: "Your official conferred degree and major",
  },
  GRAD_YEAR: {
    title: "Graduation Year",
    description: "The cohort or completion year",
  },
  CGPA_CLAIM: {
    title: "CGPA Claim / Merit Level",
    description: "Zero-knowledge claim (e.g. CGPA >= 8.5) without revealing exact GPA",
  },
  NAME: {
    title: "Student Full Name",
    description: "Legal name (keep hidden for anonymous job applications)",
  },
  ROLL_NO: {
    title: "Roll / Registration Number",
    description: "Institutional student identity number",
  },
};

const LOCAL_STORAGE_KEY = "verivault_stored_credential";

export default function WalletPage() {
  const [credential, setCredential] = useState<FullCredentialPayload | null>(null);
  const [disclosedKeys, setDisclosedKeys] = useState<Record<string, boolean>>(DEFAULT_DISCLOSED_KEYS);
  const [compressedString, setCompressedString] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --------------------------------------------------------------------------
  // 1. Initial Load from LocalStorage
  // --------------------------------------------------------------------------
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as FullCredentialPayload;
        if (parsed.attributes && parsed.rootHash) {
          setCredential(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to read from localStorage:", e);
    }
  }, []);

  // --------------------------------------------------------------------------
  // 2. Dynamic QR & Proof Generation Pipeline
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!credential || !credential.attributes || credential.attributes.length === 0) {
      setCompressedString("");
      return;
    }

    const activeKeys = Object.entries(disclosedKeys)
      .filter(([, isRevealed]) => isRevealed)
      .map(([key]) => key);

    if (activeKeys.length === 0) {
      setCompressedString("");
      return;
    }

    try {
      // Build selective disclosure payload using cryptographic Merkle tree engine
      const payload = buildSelectiveDisclosurePayload(credential, activeKeys);

      // Compress to URI-safe string for QR Code & URL sharing
      const compressed = compressPayload(payload);
      setCompressedString(compressed);
    } catch (err) {
      console.error("Proof generation error:", err);
      toast.error("Failed to construct selective disclosure proof.");
    }
  }, [credential, disclosedKeys]);

  // --------------------------------------------------------------------------
  // 3. File Drop & Ingestion Handlers
  // --------------------------------------------------------------------------
  const processJsonFile = (file: File) => {
    if (!file.name.endsWith(".json")) {
      toast.error("Please upload a valid VeriVault-Credential-*.json file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content) as FullCredentialPayload;

        if (!parsed.attributes || !parsed.rootHash) {
          throw new Error("Missing required credential attributes or Merkle root hash.");
        }

        setCredential(parsed);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
        toast.success(`Loaded credential for Token #${parsed.tokenId || "N/A"}`);
      } catch (err: unknown) {
        console.error("File parse error:", err);
        const message = err instanceof Error ? err.message : "Malformed JSON file";
        toast.error(`Invalid Credential File: ${message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processJsonFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processJsonFile(file);
    }
  };

  // --------------------------------------------------------------------------
  // 4. Sample Credential Loader (Demo Helper)
  // --------------------------------------------------------------------------
  const loadDemoCredential = () => {
    const demoPayload: FullCredentialPayload = {
      tokenId: 1,
      contractAddress: "0x1Ba155930d87C46B53849e3E3Cfa7C3052EC7D9c",
      issuerAddress: "0x95c9F3704D9851087C120B2f2de8369C9Bf66cb2",
      rootHash: "0x72a956625402f4270fa0e93b01cace5de4b6a9dd20f684ede3bf05bd7c0fb07d",
      attributes: [
        {
          key: "NAME",
          value: "Aarav Sharma",
          salt: "0xa1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0",
        },
        {
          key: "ROLL_NO",
          value: "JU-CSE-2024-042",
          salt: "0xb2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01",
        },
        {
          key: "DEGREE",
          value: "B.Tech Computer Science & Engineering",
          salt: "0xc3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef012",
        },
        {
          key: "GRAD_YEAR",
          value: "2028",
          salt: "0xd4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0123",
        },
        {
          key: "CGPA_CLAIM",
          value: "CGPA >= 8.5",
          salt: "0xe5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01234",
        },
      ],
    };

    setCredential(demoPayload);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(demoPayload));
    toast.success("Loaded demo academic credential.");
  };

  const handleClearCredential = () => {
    setCredential(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    toast.info("Cleared credential from wallet memory.");
  };

  // --------------------------------------------------------------------------
  // 5. Toggle Switch Handler
  // --------------------------------------------------------------------------
  const toggleAttribute = (key: string) => {
    setDisclosedKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // --------------------------------------------------------------------------
  // 6. Copy Verification URL
  // --------------------------------------------------------------------------
  const getVerificationUrl = () => {
    if (typeof window === "undefined" || !compressedString) return "";
    return `${window.location.origin}/verify?data=${compressedString}`;
  };

  const copyVerificationLink = () => {
    const url = getVerificationUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Verification link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const disclosedCount = Object.values(disclosedKeys).filter(Boolean).length;
  const degreeAttr = credential?.attributes?.find((a) => a.key === "DEGREE")?.value || "Academic Credential";

  return (
    <div className="max-w-[1248px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10 sm:space-y-12">
      {/* -------------------------------------------------------------------- */}
      {/* Editorial Page Header with Momentum Branding                        */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#ECE8F2]">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ef4444] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ef4444]" />
            </span>
            <span className="font-['Sometype_Mono',monospace] text-xs font-bold uppercase tracking-[0.12em] text-[#592B9B]">
              Student Zero-Knowledge Vault
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.04em] text-[#1A1523] font-['Plus_Jakarta_Sans',sans-serif] leading-[1.05]">
            Student Privacy Wallet
          </h1>
          <p className="text-base text-[#55505F] font-['Inter',sans-serif] leading-relaxed">
            Manage Soulbound degrees, control selective disclosure with cryptographic switches, and generate verifiable instant proofs.
          </p>
        </div>

        {credential && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearCredential}
            className="text-xs text-[#55505F] hover:text-red-600 border-[#ECE8F2] hover:border-red-200 gap-1.5 self-start sm:self-auto rounded-full"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Credential
          </Button>
        )}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 1. File Upload Dropzone / Ingestion                                   */}
      {/* -------------------------------------------------------------------- */}
      {!credential ? (
        <Card
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`rounded-[32px] border-2 border-dashed transition-all duration-300 text-center p-8 sm:p-16 ${
            isDragging
              ? "border-[#592B9B] bg-[#F7F5FB] scale-[1.01]"
              : "border-[#ECE8F2] bg-white hover:border-[#592B9B]/40 shadow-sm"
          }`}
        >
          <div className="max-w-lg mx-auto space-y-5">
            <div className="h-20 w-20 rounded-3xl bg-[#F7F5FB] text-[#592B9B] mx-auto flex items-center justify-center border border-[rgba(89,43,155,0.15)] shadow-sm">
              <Upload className="h-9 w-9 text-[#592B9B]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold text-[#1A1523] font-['Plus_Jakarta_Sans',sans-serif]">
                Import Your Soulbound Credential
              </h3>
              <p className="text-sm text-[#55505F] leading-relaxed">
                Drag and drop your issued <code className="font-mono text-xs bg-[#F7F5FB] text-[#592B9B] px-2 py-0.5 rounded border border-[#ECE8F2]">VeriVault-Credential-*.json</code> file,
                or browse your file system.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto gap-2 bg-[#F16221] hover:bg-[#d95216] text-white rounded-full px-7 py-3 font-bold shadow-md shadow-[#F16221]/20 hover:scale-[1.02]"
              >
                <FolderOpen className="h-4 w-4" />
                Browse File
              </Button>
              <Button
                variant="outline"
                onClick={loadDemoCredential}
                className="w-full sm:w-auto gap-2 border-[#ECE8F2] hover:bg-[#F7F5FB] text-[#1A1523] rounded-full px-6 py-3 font-semibold"
              >
                <Sparkles className="h-4 w-4 text-[#592B9B]" />
                Load Sample Degree
              </Button>
            </div>

            <p className="text-xs text-[#55505F]/75 pt-2">
              🔒 100% client-side privacy. Zero private keys or plaintext credentials leave your device.
            </p>
          </div>
        </Card>
      ) : (
        /* ------------------------------------------------------------------ */
        /* Main Wallet Interface: Degree Card + Selective Disclosure Matrix  */
        /* ------------------------------------------------------------------ */
        <div className="space-y-10">
          {/* Degree Card (Visual Certificate Shell) */}
          <Card className="relative overflow-hidden rounded-[32px] border border-[rgba(89,43,155,0.15)] bg-gradient-to-br from-white via-[#F7F5FB] to-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-10">
            {/* Watermark Logo */}
            <div className="absolute top-0 right-0 p-8 opacity-[0.04] pointer-events-none">
              <Award className="h-64 w-64 text-[#592B9B]" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-4 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <Badge variant="default" className="text-xs font-semibold">
                    ERC-5192 Soulbound
                  </Badge>
                  <Badge variant="success" className="text-xs">
                    Polygon Amoy
                  </Badge>
                  <span className="text-xs font-mono font-bold text-[#592B9B] bg-white px-2.5 py-1 rounded-full border border-[#ECE8F2]">
                    Token #{credential.tokenId || 1}
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-[#1A1523] tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
                    {degreeAttr}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#55505F] mt-1.5 flex flex-wrap items-center gap-2">
                    <span>Issued by Registrar:</span>
                    <span className="font-mono font-medium text-[#592B9B] bg-white px-2 py-0.5 rounded border border-[#ECE8F2]">
                      {credential.issuerAddress}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-[#55505F] pt-1">
                  <div>
                    <span className="font-semibold text-[#1A1523]">Contract:</span>{" "}
                    <span className="font-mono">{credential.contractAddress?.slice(0, 8)}...</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#1A1523]">Committed Root:</span>{" "}
                    <span className="font-mono text-[#592B9B]">
                      {credential.rootHash?.slice(0, 10)}...{credential.rootHash?.slice(-6)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2 border-[#ECE8F2] bg-white hover:bg-[#F7F5FB] text-xs font-semibold rounded-full"
                >
                  <Upload className="h-3.5 w-3.5 text-[#592B9B]" />
                  Replace Credential
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          </Card>

          {/* ---------------------------------------------------------------- */}
          {/* Selective Disclosure Matrix & Live QR Pipeline                   */}
          {/* ---------------------------------------------------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Selective Disclosure Matrix */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="rounded-[28px] border border-[rgba(89,43,155,0.12)] bg-white shadow-xl overflow-hidden">
                {/* Traffic lights header */}
                <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-[#ECE8F2] bg-[#F7F5FB]/60">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                    <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                    <span className="ml-2 font-['Sometype_Mono',monospace] text-[11px] font-bold uppercase tracking-wider text-[#592B9B]">
                      Zero-Knowledge Disclosure Matrix
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs bg-white text-[#592B9B] font-bold">
                    {disclosedCount} of {credential.attributes.length} Disclosed
                  </Badge>
                </div>

                <CardHeader className="space-y-1">
                  <CardTitle className="text-xl sm:text-2xl font-extrabold text-[#1A1523] flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#592B9B]" />
                    Attribute Disclosure Controls
                  </CardTitle>
                  <CardDescription className="text-sm text-[#55505F]">
                    Toggle attributes to reveal to verifiers. Blinded fields are completely omitted from the proof, making deduction mathematically impossible.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {credential.attributes.map((attr) => {
                    const isRevealed = disclosedKeys[attr.key] ?? false;
                    const meta = ATTRIBUTE_LABELS[attr.key] || {
                      title: attr.key,
                      description: "Credential claim property",
                    };

                    return (
                      <div
                        key={attr.key}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-4 ${
                          isRevealed
                            ? "border-[rgba(89,43,155,0.25)] bg-[#F7F5FB]/70 shadow-sm"
                            : "border-[#ECE8F2] bg-white opacity-85"
                        }`}
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm sm:text-base font-bold text-[#1A1523] font-['Plus_Jakarta_Sans',sans-serif]">
                              {meta.title}
                            </span>
                            {isRevealed ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                <Eye className="h-3 w-3" /> Revealed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#55505F] bg-[#ECE8F2] px-2.5 py-0.5 rounded-full">
                                <EyeOff className="h-3 w-3" /> Blinded
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#55505F]">{meta.description}</p>
                          <div className="pt-1 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono font-bold text-[#592B9B] truncate">
                              {isRevealed ? attr.value : "••••••••••••••••"}
                            </span>
                            {isRevealed && (
                              <span className="text-[10px] text-[#55505F] font-mono truncate max-w-[140px] bg-white px-2 py-0.5 rounded border border-[#ECE8F2]">
                                salt: {attr.salt.slice(0, 8)}...
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Toggle Switch */}
                        <div className="flex items-center shrink-0">
                          <Switch
                            id={`switch-${attr.key}`}
                            checked={isRevealed}
                            onCheckedChange={() => toggleAttribute(attr.key)}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {disclosedCount === 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No Attributes Selected</AlertTitle>
                      <AlertDescription>
                        You must disclose at least one attribute to generate a valid cryptographic proof.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Live QR Code & Sharing Link */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="rounded-[28px] border border-[rgba(89,43,155,0.12)] bg-white shadow-xl overflow-hidden">
                <div className="flex items-center justify-center px-6 py-4 border-b border-[#ECE8F2] bg-[#F7F5FB]/60">
                  <span className="font-['Sometype_Mono',monospace] text-[11px] font-bold uppercase tracking-wider text-[#592B9B] flex items-center gap-1.5">
                    <QrCode className="h-3.5 w-3.5" />
                    Instant Verification QR Code
                  </span>
                </div>

                <CardContent className="space-y-6 flex flex-col items-center pt-6">
                  {/* Dynamic QR Code Canvas */}
                  <div className="p-4 bg-white rounded-2xl shadow-md flex items-center justify-center border-2 border-[#ECE8F2]">
                    {compressedString ? (
                      <QRCodeSVG
                        value={getVerificationUrl()}
                        size={210}
                        level="M"
                        includeMargin={false}
                      />
                    ) : (
                      <div className="h-[210px] w-[210px] flex items-center justify-center text-[#55505F] text-xs text-center p-4">
                        Select at least one attribute to generate proof QR
                      </div>
                    )}
                  </div>

                  {/* Summary of Disclosure */}
                  <div className="w-full text-xs text-[#55505F] space-y-2 p-4 rounded-2xl bg-[#F7F5FB] border border-[#ECE8F2]">
                    <div className="flex justify-between items-center text-[#1A1523]">
                      <span className="font-medium">Disclosed Claims:</span>
                      <span className="font-bold text-[#592B9B]">
                        {disclosedCount} properties
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[#1A1523]">
                      <span className="font-medium">Payload Compression:</span>
                      <span className="font-mono font-semibold text-emerald-700">
                        {compressedString ? `${compressedString.length} chars (LZ-String)` : "None"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[#1A1523]">
                      <span className="font-medium">Target Token ID:</span>
                      <span className="font-mono font-bold">#{credential.tokenId || 1}</span>
                    </div>
                  </div>

                  {/* Copy Link & Direct Open Actions */}
                  <div className="w-full space-y-3">
                    <Button
                      onClick={copyVerificationLink}
                      disabled={!compressedString}
                      className="w-full gap-2 text-sm font-bold bg-[#F16221] hover:bg-[#d95216] text-white rounded-full py-6 shadow-md shadow-[#F16221]/20 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="h-4 w-4" />
                          Link Copied to Clipboard!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy Instant Verification Link
                        </>
                      )}
                    </Button>

                    {compressedString && (
                      <Link
                        href={`/verify?data=${compressedString}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full"
                      >
                        <Button
                          variant="outline"
                          className="w-full gap-2 text-xs font-semibold border-[#ECE8F2] hover:bg-[#F7F5FB] text-[#1A1523] rounded-full py-5"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-[#592B9B]" />
                          Test in Verification Portal
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Security Explainer Card */}
              <Card className="rounded-[28px] border border-[rgba(89,43,155,0.12)] bg-[#F7F5FB]/70">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span className="font-['Sometype_Mono',monospace] text-xs font-bold uppercase tracking-wider text-[#592B9B]">
                      Zero-Knowledge Privacy Proof
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-[#55505F] space-y-2.5 leading-relaxed pt-0">
                  <p>
                    When you turn off an attribute (like your Name or Roll Number), its raw plaintext and private salt are stripped from the payload.
                  </p>
                  <p>
                    Only the intermediate cryptographic hashes of sibling branches are sent. Verifiers prove that your revealed claims combine with those sibling hashes to match the official Merkle root on Polygon Amoy.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
