"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import {
  CheckCircle2,
  Search,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Camera,
  CameraOff,
  ExternalLink,
  Clock,
  UserCheck,
  Ban,
  Fingerprint,
  Loader2,
  Lock,
  HelpCircle,
  FileCheck,
  Sparkles,
  Landmark,
  BadgeCheck,
  Award,
  Radio,
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import { VERIVAULT_CONTRACT_ADDRESS, VERIVAULT_ABI } from "@/config/contract";
import { getInstitutionalData } from "@/config/institutions";
import { publicClient } from "@/lib/rpc";
import {
  decompressPayload,
  hashLeaf,
  verifyLeaf,
  VerificationProofPayload,
} from "@/lib/crypto";

enum VerificationStatus {
  IDLE = "IDLE",
  VERIFYING = "VERIFYING",
  AUTHENTIC = "AUTHENTIC",
  REVOKED = "REVOKED",
  TAMPERED = "TAMPERED",
}

interface VerificationResult {
  status: VerificationStatus;
  tokenId: number;
  onChainRoot: string;
  issuerAddress: string;
  issuedAt: number;
  revoked: boolean;
  revokedAt: number;
  revocationReason: string;
  executionTimeMs: number;
  disclosedAttributes: {
    key: string;
    value: string;
    isValid: boolean;
  }[];
  errorMessage?: string;
}

// Demo strings for instant 1-click test during presentations (Matches on-chain Token #1 on Polygon Amoy)
const DEMO_VALID_PAYLOAD =
  "N4IgLg9g1gpgdgSQCYgFwEYA0IkEsDOAxgDYT4xICCYYATrgEYCuYM+aA2qLAJ5ogARAKIBxAEpChIbADcAhsSYx+AIQB0AFRiEAFgAIAwhAC2ABxYxaegMqFc8QjD0AyPULgBzXHBiXvH6RB8BTB+AAYAD0IAZiQAFhgAVgAzADYwgHZ0AA4AJgBOaLk4hkTCVKQMmGzk-LD0XOi4xNSM7Py5BkIkGGT6xubW9s7u3v6QAF9Mbhg+VBADEQAFSgB9AwAZSgQAWUD5RWV5xZW9AD4AXj1stUTA4OJQ+ciktMycgqKSsoqqmrqGk0Wm0Ol0en1AYMQSNwf0mpMALrYUy0CAQZLsVAcDggSLFdCpOLJYrJdq5dDoQi5XJyaKEKphVK5OLZRK5MLJaL5fJIfKEMJ8-K5VL5Bg89nRBjJOKpQjoBgVaKJdBtQKRZkUuKEbLoUVNHLdVlIEXJGAMBhyJByDrRDJyQgMckMMIMaKpdBIJA6gkZMUJMJyhq5DL85JqiKJT0MDIJbJIZW1e3RbLOjL5ZLM7VyzK+dIy3V2gNxW26uJWwjc7phMJsl0slBInGReKs23x3LdJCu9BxdBhGBuuL5Uu5bTZdKOmDoKeU+LZmDDtnZQh9bKW12k6IUEAIpEgFFosNY3ERfGE4lEskUqk0ukMpks2uc7m8-mC4Wi8VhSXS2XyxXKqq2Dqr2Pbarqrq9suXqRiaZoWlaNp2g6Toum6HpehSrR+jAAYUtSIYcuGkZdjG1TxugiYxCmmTppmy59lUMB5u6+SFoQxZZPkZb2pWSDVrWDD1juExAA";

function VerifierContent() {
  const searchParams = useSearchParams();
  const [dataInput, setDataInput] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);

  // --------------------------------------------------------------------------
  // Core Verification Engine (Target < 2 Seconds)
  // --------------------------------------------------------------------------
  const runVerification = async (rawString: string) => {
    if (!rawString.trim()) {
      toast.error("Please provide a verification payload or scan a QR code.");
      return;
    }

    const startTime = performance.now();
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // Clean string if a full URL was pasted or scanned
      let compressedPayload = rawString.trim();
      if (compressedPayload.includes("data=")) {
        const urlObj = new URL(compressedPayload, "https://verivault.local");
        compressedPayload = urlObj.searchParams.get("data") || compressedPayload;
      }

      // Step A: Decompress payload
      let payload: VerificationProofPayload;
      try {
        payload = decompressPayload(compressedPayload);
      } catch {
        throw new Error(
          "Invalid or corrupted verification payload string. Unable to decode LZ-String data."
        );
      }

      if (!payload.tokenId || !payload.disclosedAttributes || payload.disclosedAttributes.length === 0) {
        throw new Error("Payload does not contain valid token ID or disclosed attributes.");
      }

      // Step B: Blockchain State Check via direct Viem client (no wallet required)
      let onChainData: readonly [
        `0x${string}`,
        `0x${string}`,
        bigint,
        boolean,
        bigint,
        string
      ];

      try {
        onChainData = (await publicClient.readContract({
          address: VERIVAULT_CONTRACT_ADDRESS,
          abi: VERIVAULT_ABI,
          functionName: "getCredential",
          args: [BigInt(payload.tokenId)],
        })) as [
          `0x${string}`,
          `0x${string}`,
          bigint,
          boolean,
          bigint,
          string
        ];
      } catch (rpcErr: unknown) {
        console.error("Contract query failed:", rpcErr);
        const elapsed = Math.round(performance.now() - startTime);
        setVerificationResult({
          status: VerificationStatus.TAMPERED,
          tokenId: payload.tokenId,
          onChainRoot: "0x0",
          issuerAddress: "Unknown",
          issuedAt: 0,
          revoked: false,
          revokedAt: 0,
          revocationReason: "",
          executionTimeMs: elapsed,
          disclosedAttributes: [],
          errorMessage: `Token #${payload.tokenId} does not exist on Polygon Amoy contract (${VERIVAULT_CONTRACT_ADDRESS}) or registry query failed.`,
        });
        setIsVerifying(false);
        return;
      }

      const onChainRoot = onChainData[0];
      const issuer = onChainData[1];
      const issuedAt = Number(onChainData[2]);
      const revoked = onChainData[3];
      const revokedAt = Number(onChainData[4]);
      const revocationReason = onChainData[5];

      // Step C: Cryptographic Math Check
      let allLeavesValid = true;
      const checkedAttributes = [];

      for (let i = 0; i < payload.disclosedAttributes.length; i++) {
        const attr = payload.disclosedAttributes[i];
        const leaf = hashLeaf(attr);

        // Support multi-proofs array or single proof fallback
        const proof =
          payload.proofs && payload.proofs[i] ? payload.proofs[i] : payload.proof;

        const isValid = verifyLeaf(leaf, proof, onChainRoot);

        checkedAttributes.push({
          key: attr.key,
          value: attr.value,
          isValid,
        });

        if (!isValid) {
          allLeavesValid = false;
        }
      }

      const elapsed = Math.round(performance.now() - startTime);

      // Determine Outcome State
      if (!allLeavesValid) {
        setVerificationResult({
          status: VerificationStatus.TAMPERED,
          tokenId: payload.tokenId,
          onChainRoot,
          issuerAddress: issuer,
          issuedAt,
          revoked,
          revokedAt,
          revocationReason,
          executionTimeMs: elapsed,
          disclosedAttributes: checkedAttributes,
          errorMessage:
            "CRYPTOGRAPHIC PROOF FAILED: Potential document forgery detected. One or more attributes failed Merkle root inclusion.",
        });
      } else if (revoked) {
        setVerificationResult({
          status: VerificationStatus.REVOKED,
          tokenId: payload.tokenId,
          onChainRoot,
          issuerAddress: issuer,
          issuedAt,
          revoked,
          revokedAt,
          revocationReason,
          executionTimeMs: elapsed,
          disclosedAttributes: checkedAttributes,
        });
      } else {
        setVerificationResult({
          status: VerificationStatus.AUTHENTIC,
          tokenId: payload.tokenId,
          onChainRoot,
          issuerAddress: issuer,
          issuedAt,
          revoked,
          revokedAt,
          revocationReason,
          executionTimeMs: elapsed,
          disclosedAttributes: checkedAttributes,
        });
      }
    } catch (err: unknown) {
      console.error("Verification error:", err);
      const elapsed = Math.round(performance.now() - startTime);
      const message = err instanceof Error ? err.message : "Verification error occurred";
      setVerificationResult({
        status: VerificationStatus.TAMPERED,
        tokenId: 0,
        onChainRoot: "0x0",
        issuerAddress: "Unknown",
        issuedAt: 0,
        revoked: false,
        revokedAt: 0,
        revocationReason: "",
        executionTimeMs: elapsed,
        disclosedAttributes: [],
        errorMessage: message,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // --------------------------------------------------------------------------
  // 1. Auto-Verify on Page Load from URL Query Param ?data=...
  // --------------------------------------------------------------------------
  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (dataParam) {
      setDataInput(dataParam);
      runVerification(dataParam);
    }
  }, [searchParams]);

  // --------------------------------------------------------------------------
  // 2. Camera QR Scanner Lifecycle (html5-qrcode)
  // --------------------------------------------------------------------------
  const startCameraScanner = async () => {
    setIsCameraActive(true);
    setVerificationResult(null);

    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            stopCameraScanner();
            setDataInput(decodedText);
            toast.success("QR Code detected!");
            runVerification(decodedText);
          },
          () => {}
        );
        isScanningRef.current = true;
      } catch (err) {
        console.error("Camera access failed:", err);
        toast.error("Unable to access camera. Please grant camera permissions or paste the payload.");
        setIsCameraActive(false);
      }
    }, 150);
  };

  const stopCameraScanner = async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.warn("Camera stop error:", err);
      } finally {
        scannerRef.current = null;
        isScanningRef.current = false;
        setIsCameraActive(false);
      }
    } else {
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current && isScanningRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="max-w-[1248px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10 sm:space-y-12">
      {/* -------------------------------------------------------------------- */}
      {/* Editorial Page Header with Momentum Branding                        */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#ECE8F2]">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#592B9B]/8 text-[#592B9B] border border-[#592B9B]/15">
            <ShieldCheck className="h-3.5 w-3.5 text-[#592B9B]" />
            <span className="font-['Sometype_Mono',monospace] text-xs font-bold uppercase tracking-[0.1em]">
              Zero-Trust Audit Verification Engine
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.04em] text-[#1A1523] font-['Plus_Jakarta_Sans',sans-serif] leading-[1.05]">
            Public Instant Verifier
          </h1>
          <p className="text-base text-[#55505F] font-['Inter',sans-serif] leading-relaxed">
            Sub-2s zero-knowledge proof verification on Polygon Amoy — no Web3 wallet, browser extensions, or private account required.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#ECE8F2] shadow-sm text-xs font-['Sometype_Mono',monospace]">
            <Radio className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="font-semibold text-[#1A1523]">Polygon Amoy (80002)</span>
          </div>

          <a
            href={`https://amoy.polygonscan.com/address/${VERIVAULT_CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F7F5FB] hover:bg-white border border-[#ECE8F2] hover:border-[#592B9B]/30 text-xs font-semibold text-[#592B9B] transition-all group shadow-sm"
          >
            <span>Contract</span>
            <ExternalLink className="h-3 w-3 text-[#592B9B] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Input Handling: Camera Scanner / URL / Paste                         */}
      {/* -------------------------------------------------------------------- */}
      <Card className="rounded-[28px] border border-[rgba(89,43,155,0.12)] bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-[#ECE8F2] bg-[#F7F5FB]/60">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#592B9B]/10 text-[#592B9B]">
              <Search className="h-3.5 w-3.5" />
            </div>
            <span className="font-['Sometype_Mono',monospace] text-[11px] font-bold uppercase tracking-wider text-[#592B9B]">
              Proof Ingestion Console
            </span>
          </div>

          <Button
            variant={isCameraActive ? "destructive" : "outline"}
            size="sm"
            onClick={isCameraActive ? stopCameraScanner : startCameraScanner}
            className="gap-2 border-[#ECE8F2] text-xs font-bold rounded-full h-8"
          >
            {isCameraActive ? (
              <>
                <CameraOff className="h-3.5 w-3.5" />
                Close Camera
              </>
            ) : (
              <>
                <Camera className="h-3.5 w-3.5 text-[#592B9B]" />
                Scan with Camera
              </>
            )}
          </Button>
        </div>

        <CardHeader className="space-y-1">
          <CardTitle className="text-xl sm:text-2xl font-extrabold text-[#1A1523] flex items-center gap-2.5">
            <Search className="h-5 w-5 text-[#592B9B]" />
            Scan or Paste Credential Proof
          </CardTitle>
          <CardDescription className="text-sm text-[#55505F]">
            Scan the graduate&apos;s dynamic QR code or paste their compressed selective disclosure proof string.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Camera Viewport */}
          {isCameraActive && (
            <div className="p-4 rounded-2xl border-2 border-[#592B9B]/30 bg-[#F7F5FB] flex flex-col items-center space-y-3">
              <div
                id="qr-reader"
                className="w-full max-w-[280px] sm:max-w-sm rounded-xl overflow-hidden border border-[#ECE8F2] bg-black aspect-square shadow-md"
              />
              <p className="text-xs font-medium text-[#592B9B] flex items-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin text-[#592B9B]" />
                Point camera steadily at student QR code
              </p>
            </div>
          )}

          {/* Manual Input / Paste Field */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                placeholder="Paste verification link or compressed proof payload (e.g. N4IgLg9g...)"
                value={dataInput}
                onChange={(e) => setDataInput(e.target.value)}
                disabled={isVerifying}
                className="font-mono text-xs pr-14 h-12"
              />
              {dataInput && (
                <button
                  type="button"
                  onClick={() => setDataInput("")}
                  className="absolute right-4 top-3.5 text-xs text-[#55505F] hover:text-[#1A1523] font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            <Button
              onClick={() => runVerification(dataInput)}
              disabled={isVerifying || !dataInput.trim()}
              className="gap-2 shrink-0 font-bold h-12 px-8 bg-[#F16221] hover:bg-[#d95216] text-white rounded-full shadow-md shadow-[#F16221]/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4" />
                  Verify Instantly
                </>
              )}
            </Button>
          </div>

          {/* Quick Demo Buttons for Hackathon Presenters */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-[#55505F] font-semibold font-['Sometype_Mono',monospace]">
              1-Click Demo Tests:
            </span>
            <button
              type="button"
              onClick={() => {
                setDataInput(DEMO_VALID_PAYLOAD);
                runVerification(DEMO_VALID_PAYLOAD);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F7F5FB] border border-[#ECE8F2] hover:border-[#592B9B]/40 text-[#592B9B] hover:bg-white text-xs font-semibold transition-all shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#F16221]" />
              Load Sample Valid Proof
            </button>
            <button
              type="button"
              onClick={() => {
                const forgedPayload = DEMO_VALID_PAYLOAD.slice(0, -6) + "FAKE99";
                setDataInput(forgedPayload);
                runVerification(forgedPayload);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 hover:border-red-300 text-red-700 hover:bg-red-100 text-xs font-semibold transition-all shadow-sm"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
              Test Forged / Tampered Proof
            </button>
          </div>
        </CardContent>
      </Card>

      {/* -------------------------------------------------------------------- */}
      {/* Verification In-Progress Indicator                                   */}
      {/* -------------------------------------------------------------------- */}
      {isVerifying && (
        <Card className="rounded-[28px] border border-[rgba(89,43,155,0.2)] bg-[#F7F5FB] p-8 text-center shadow-lg animate-pulse">
          <div className="max-w-sm mx-auto space-y-3">
            <Loader2 className="h-9 w-9 animate-spin text-[#592B9B] mx-auto" />
            <h4 className="text-lg font-bold text-[#1A1523] font-['Plus_Jakarta_Sans',sans-serif]">
              Executing Cryptographic Verification
            </h4>
            <p className="text-xs text-[#55505F]">
              Querying Polygon Amoy node state & validating Keccak-256 Merkle proofs...
            </p>
          </div>
        </Card>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* Verification Outcomes                                                */}
      {/* -------------------------------------------------------------------- */}
      {verificationResult && (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
          {/* ================================================================= */}
          {/* STATE 1: GREEN (VERIFIED & AUTHENTIC)                             */}
          {/* ================================================================= */}
          {verificationResult.status === VerificationStatus.AUTHENTIC && (
            <Card className="rounded-[32px] border-2 border-emerald-500/40 bg-white shadow-2xl overflow-hidden ring-4 ring-emerald-500/10">
              {/* Status Header Banner */}
              <div className="border-b border-emerald-100 bg-emerald-50/80 px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30 shrink-0">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 font-['Plus_Jakarta_Sans',sans-serif] tracking-tight flex items-center gap-2.5">
                      VERIFIED & AUTHENTIC
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                        {verificationResult.executionTimeMs} ms
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-800 font-medium">
                      Cryptographically confirmed against Polygon Amoy on-chain commitment
                    </p>
                  </div>
                </div>

                <Badge variant="outline" className="border-emerald-300 text-emerald-800 font-mono text-xs sm:text-sm px-3 py-1 bg-white font-bold">
                  Token #{verificationResult.tokenId}
                </Badge>
              </div>

              <CardContent className="p-6 sm:p-8 space-y-8">
                {/* GovTech OpenCerts Institutional Identity Card */}
                {(() => {
                  const institution = getInstitutionalData(verificationResult.issuerAddress);
                  if (institution) {
                    return (
                      <div className="rounded-2xl border-2 border-emerald-500/30 bg-[#F7F5FB] p-6 shadow-sm relative overflow-hidden">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                          <div className="flex items-start gap-4">
                            <div className="p-3.5 rounded-2xl bg-white border border-[#ECE8F2] text-[#592B9B] shrink-0 shadow-sm">
                              <Landmark className="h-8 w-8" />
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold tracking-wide uppercase">
                                  <BadgeCheck className="h-3.5 w-3.5 text-emerald-700" />
                                  GovTech OpenCerts Verified
                                </span>
                                <span className="text-xs text-[#55505F] font-mono">
                                  {institution.registryId}
                                </span>
                              </div>

                              <h3 className="text-xl sm:text-2xl font-extrabold text-[#1A1523] tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
                                Verified Issuer: {institution.name}
                              </h3>

                              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-[#55505F] pt-0.5">
                                <a
                                  href={institution.portalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 font-bold text-[#592B9B] hover:underline transition-colors"
                                  title="Visit Official Institutional Portal"
                                >
                                  <Lock className="h-3.5 w-3.5 text-[#592B9B] shrink-0" />
                                  <span>Official Domain: {institution.domain}</span>
                                  <ExternalLink className="h-3.5 w-3.5 text-[#592B9B] shrink-0" />
                                </a>

                                <span className="text-[#ECE8F2] hidden sm:inline">•</span>

                                <span className="inline-flex items-center gap-1.5 text-[#1A1523] font-medium">
                                  <Award className="h-4 w-4 text-[#F16221] shrink-0" />
                                  <span>Regulatory Registry: {institution.accreditation}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-start lg:items-end justify-between border-t lg:border-t-0 border-[#ECE8F2] pt-3 lg:pt-0 shrink-0 gap-1.5">
                            <span className="text-[11px] font-bold text-[#55505F] uppercase tracking-wider font-['Sometype_Mono',monospace]">
                              On-Chain Coordinates
                            </span>
                            <a
                              href={`https://amoy.polygonscan.com/address/${VERIVAULT_CONTRACT_ADDRESS}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#F7F5FB] border border-[#ECE8F2] hover:border-[#592B9B]/40 text-xs font-mono font-semibold text-[#592B9B] transition-all shadow-sm"
                            >
                              <Fingerprint className="h-3.5 w-3.5 text-[#592B9B]" />
                              <span>Polygon Amoy Contract</span>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <span className="text-[10px] text-[#55505F] font-mono">
                              Chain ID: 80002 • EVM
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/80 p-5 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-2xl bg-amber-100 text-amber-700 shrink-0">
                          <AlertTriangle className="h-7 w-7" />
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                            Unregistered Issuer Warning
                          </span>
                          <h3 className="text-base font-bold text-amber-950">
                            Signed by an unverified wallet ({verificationResult.issuerAddress.slice(0, 8)}...{verificationResult.issuerAddress.slice(-6)}).
                          </h3>
                          <p className="text-xs text-amber-900/90 leading-relaxed">
                            While the cryptographic Merkle tree integrity matches the on-chain root, this signing address is not catalogued in the National Institutional Accreditation Directory.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 3-Stat Proof Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-[#F7F5FB] border border-[#ECE8F2] space-y-1">
                    <span className="text-xs font-bold text-[#55505F] uppercase tracking-wider font-['Sometype_Mono',monospace] flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-[#592B9B]" />
                      Authorized Issuer
                    </span>
                    <p className="font-mono text-xs text-[#1A1523] break-all font-medium pt-1">
                      {verificationResult.issuerAddress}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F7F5FB] border border-[#ECE8F2] space-y-1">
                    <span className="text-xs font-bold text-[#55505F] uppercase tracking-wider font-['Sometype_Mono',monospace] flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#592B9B]" />
                      Conferred / Issued Date
                    </span>
                    <p className="text-sm font-bold text-[#1A1523] pt-1 font-['Plus_Jakarta_Sans',sans-serif]">
                      {new Date(verificationResult.issuedAt * 1000).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F7F5FB] border border-[#ECE8F2] space-y-1">
                    <span className="text-xs font-bold text-[#55505F] uppercase tracking-wider font-['Sometype_Mono',monospace] flex items-center gap-1.5">
                      <Fingerprint className="h-3.5 w-3.5 text-[#592B9B]" />
                      Committed Merkle Root
                    </span>
                    <p className="font-mono text-xs text-[#592B9B] break-all font-medium pt-1">
                      {verificationResult.onChainRoot}
                    </p>
                  </div>
                </div>

                {/* Disclosed Verified Attributes List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-[#1A1523] font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      Disclosed Verified Attributes ({verificationResult.disclosedAttributes.length})
                    </h4>
                    <span className="text-xs text-emerald-700 font-mono font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      All proofs verified
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {verificationResult.disclosedAttributes.map((attr) => (
                      <div
                        key={attr.key}
                        className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/25 bg-emerald-50/40 flex items-center justify-between gap-3 shadow-sm"
                      >
                        <div>
                          <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-900 font-['Sometype_Mono',monospace]">
                            {attr.key.replace(/_/g, " ")}
                          </span>
                          <p className="text-base sm:text-lg font-black text-[#1A1523] mt-0.5 font-['Plus_Jakarta_Sans',sans-serif]">
                            {attr.value}
                          </p>
                        </div>
                        <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Privacy Guarantee Notice */}
                <Alert variant="info" className="border-[rgba(89,43,155,0.2)] bg-[#F7F5FB] p-5 rounded-2xl">
                  <Lock className="h-5 w-5 text-[#592B9B]" />
                  <AlertTitle className="text-[#1A1523] text-sm font-bold">
                    Zero-Knowledge Privacy Guarantee
                  </AlertTitle>
                  <AlertDescription className="text-[#55505F] text-xs sm:text-sm leading-relaxed mt-1">
                    All undisclosed fields remain mathematically sealed and cryptographically unexposed.
                    The student has chosen to selectively prove only the attributes listed above.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* ================================================================= */}
          {/* STATE 2: RED (REVOKED BY ISSUER)                                  */}
          {/* ================================================================= */}
          {verificationResult.status === VerificationStatus.REVOKED && (
            <Card className="rounded-[32px] border-2 border-red-500 bg-white shadow-2xl overflow-hidden ring-4 ring-red-500/10">
              <div className="border-b border-red-100 bg-red-50/80 px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-2xl bg-red-600 text-white shadow-md shadow-red-600/30 shrink-0">
                    <Ban className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-red-950 font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
                      CREDENTIAL HAS BEEN REVOKED
                    </h3>
                    <p className="text-xs sm:text-sm text-red-800 font-medium">
                      The issuing university has permanently cancelled this credential on Polygon Amoy
                    </p>
                  </div>
                </div>

                <Badge variant="destructive" className="text-xs px-3 py-1 bg-red-600 text-white font-bold">
                  Revoked Token #{verificationResult.tokenId}
                </Badge>
              </div>

              <CardContent className="p-6 sm:p-8 space-y-5">
                <div className="p-5 rounded-2xl bg-red-50 border-2 border-red-200 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-700 flex items-center gap-1.5 font-['Sometype_Mono',monospace]">
                    <AlertTriangle className="h-4 w-4" />
                    Official On-Chain Revocation Reason
                  </span>
                  <p className="text-lg font-black text-red-950 font-['Plus_Jakarta_Sans',sans-serif]">
                    &quot;{verificationResult.revocationReason}&quot;
                  </p>
                  <p className="text-xs text-red-800 pt-1">
                    Revocation Timestamp:{" "}
                    <span className="font-bold text-red-950">
                      {new Date(verificationResult.revokedAt * 1000).toUTCString()}
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#55505F]">
                  <div className="p-4 rounded-2xl bg-[#F7F5FB] border border-[#ECE8F2]">
                    <span className="font-semibold text-[#1A1523]">Issuing Institution:</span>{" "}
                    <span className="font-mono text-[#592B9B] block mt-1 break-all">
                      {verificationResult.issuerAddress}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F7F5FB] border border-[#ECE8F2]">
                    <span className="font-semibold text-[#1A1523]">Original Issuance:</span>{" "}
                    <span className="block mt-1 font-bold text-[#1A1523]">
                      {new Date(verificationResult.issuedAt * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ================================================================= */}
          {/* STATE 3: RED (TAMPERED / INVALID)                                 */}
          {/* ================================================================= */}
          {verificationResult.status === VerificationStatus.TAMPERED && (
            <Card className="rounded-[32px] border-2 border-red-500 bg-white shadow-2xl overflow-hidden ring-4 ring-red-500/10">
              <div className="border-b border-red-100 bg-red-50/80 px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-2xl bg-red-600 text-white shadow-md shadow-red-600/30 shrink-0">
                    <ShieldAlert className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-red-950 font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
                      CRYPTOGRAPHIC PROOF FAILED
                    </h3>
                    <p className="text-xs sm:text-sm text-red-800 font-medium">
                      Potential document forgery detected. Credential cannot be verified.
                    </p>
                  </div>
                </div>

                <Badge variant="destructive" className="bg-red-600 text-white font-bold">
                  Invalid / Forged
                </Badge>
              </div>

              <CardContent className="p-6 sm:p-8 space-y-5">
                <Alert variant="destructive" className="p-5 rounded-2xl">
                  <AlertTriangle className="h-5 w-5" />
                  <AlertTitle className="text-sm font-bold">Document Integrity Alert</AlertTitle>
                  <AlertDescription className="text-xs sm:text-sm leading-relaxed mt-1 text-red-900 font-medium">
                    {verificationResult.errorMessage ||
                      "The disclosed attributes do not match the immutable Merkle root committed on Polygon Amoy. The data may have been altered, fabricated, or forged."}
                  </AlertDescription>
                </Alert>

                {verificationResult.disclosedAttributes.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1A1523] font-['Sometype_Mono',monospace]">
                      Attribute Invariant Check Breakdown:
                    </span>
                    <div className="space-y-2.5">
                      {verificationResult.disclosedAttributes.map((attr) => (
                        <div
                          key={attr.key}
                          className="p-4 rounded-2xl border border-[#ECE8F2] bg-[#F7F5FB] flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="text-[#55505F] font-mono mr-2 font-bold">{attr.key}:</span>
                            <span className="text-[#1A1523] font-semibold">{attr.value}</span>
                          </div>
                          {attr.isValid ? (
                            <span className="text-emerald-800 font-bold flex items-center gap-1 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Valid
                            </span>
                          ) : (
                            <span className="text-red-700 font-bold flex items-center gap-1 bg-red-100 px-2.5 py-0.5 rounded-full">
                              <Ban className="h-3.5 w-3.5" /> FAILED
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Protocol Explainer Card */}
      <Card className="rounded-[28px] border border-[rgba(89,43,155,0.12)] bg-[#F7F5FB]/70">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-[#592B9B]" />
            <span className="font-['Sometype_Mono',monospace] text-xs font-bold uppercase tracking-wider text-[#592B9B]">
              Sub-2s Proof Engine Architecture
            </span>
          </div>
          <CardTitle className="text-base sm:text-lg font-bold text-[#1A1523] mt-1">
            Why VeriVault Verifications Complete in Milliseconds
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs sm:text-sm text-[#55505F] space-y-2 leading-relaxed pt-0">
          <p>
            Traditional credential verifiers take days or weeks communicating with university registrars.
            VeriVault executes in milliseconds by reading the immutable 32-byte Merkle root on Polygon Amoy
            and proving Keccak-256 leaf commitments client-side.
          </p>
          <p>
            No user tracking, no cookies, and no Web3 wallet connection required for employers or verifiers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1248px] mx-auto px-4 py-20 text-center text-[#55505F] space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#592B9B]" />
          <p className="text-sm font-medium font-['Plus_Jakarta_Sans',sans-serif]">Initializing Public Instant Verifier...</p>
        </div>
      }
    >
      <VerifierContent />
    </Suspense>
  );
}
