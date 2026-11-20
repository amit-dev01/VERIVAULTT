"use client";

import React, { useState } from "react";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useReadContract,
  useWriteContract,
  usePublicClient,
} from "wagmi";
import { polygonAmoy } from "wagmi/chains";
import { parseEventLogs, isAddress } from "viem";
import { toast } from "sonner";
import {
  Award,
  Send,
  Ban,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Download,
  CheckCircle2,
  Hash,
  User,
  BookOpen,
  Calendar,
  Sparkles,
  Info,
  Wallet,
  Radio,
  Zap,
  Building2,
} from "lucide-react";
import { useConnectModal } from "@rainbow-me/rainbowkit";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import { VERIVAULT_CONTRACT_ADDRESS, VERIVAULT_ABI } from "@/config/contract";
import {
  generateSalt,
  buildMerkleTree,
  AcademicAttribute,
  FullCredentialPayload,
} from "@/lib/crypto";

export default function IssuerPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { openConnectModal } = useConnectModal();

  const isPolygonAmoy = chainId === polygonAmoy.id;

  // --------------------------------------------------------------------------
  // 1. Role Verification
  // --------------------------------------------------------------------------
  const { data: issuerRoleHash } = useReadContract({
    address: VERIVAULT_CONTRACT_ADDRESS,
    abi: VERIVAULT_ABI,
    functionName: "ISSUER_ROLE",
    chainId: polygonAmoy.id,
  });

  const { data: hasIssuerRole, isLoading: isRoleLoading, refetch: refetchIssuerRole } = useReadContract({
    address: VERIVAULT_CONTRACT_ADDRESS,
    abi: VERIVAULT_ABI,
    functionName: "hasRole",
    args: address && issuerRoleHash ? [issuerRoleHash, address] : undefined,
    chainId: polygonAmoy.id,
    query: {
      enabled: !!address && !!issuerRoleHash && isPolygonAmoy,
    },
  });

  // --------------------------------------------------------------------------
  // 2. Issuance Form State
  // --------------------------------------------------------------------------
  const [mintMethod, setMintMethod] = useState<"relayer" | "wallet">("relayer");
  const [isAuthorizingRole, setIsAuthorizingRole] = useState(false);
  const [studentAddress, setStudentAddress] = useState("");
  const [fullName, setFullName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [degree, setDegree] = useState("");
  const [gradYear, setGradYear] = useState("2028");
  const [cgpaClaim, setCgpaClaim] = useState("CGPA >= 8.0");

  const [isMinting, setIsMinting] = useState(false);
  const [mintProgressStep, setMintProgressStep] = useState<string>("");
  const [mintedResult, setMintedResult] = useState<{
    tokenId: number;
    rootHash: string;
    txHash: string;
    payload: FullCredentialPayload;
  } | null>(null);

  // --------------------------------------------------------------------------
  // 3. Revocation Form State
  // --------------------------------------------------------------------------
  const [revokeTokenId, setRevokeTokenId] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [isRevoking, setIsRevoking] = useState(false);
  const [revokedResult, setRevokedResult] = useState<{
    tokenId: string;
    reason: string;
    txHash: string;
  } | null>(null);

  // --------------------------------------------------------------------------
  // Helper: Trigger JSON Download
  // --------------------------------------------------------------------------
  const triggerPayloadDownload = (payload: FullCredentialPayload, tokenId: number) => {
    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `VeriVault-Credential-${tokenId}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  // --------------------------------------------------------------------------
  // Helper: Fill Demo Preset for Jadavpur University
  // --------------------------------------------------------------------------
  const fillDemoData = () => {
    setStudentAddress(address || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
    setFullName("Aarav Sharma");
    setRollNumber("JU-CSE-2024-042");
    setDegree("B.Tech Computer Science & Engineering");
    setGradYear("2028");
    setCgpaClaim("CGPA >= 8.0");
    toast.success("Loaded mock data for Jadavpur University!");
  };

  // --------------------------------------------------------------------------
  // Handler: Self-Authorize Connected Wallet as Registrar (1-Click Testnet Demo)
  // --------------------------------------------------------------------------
  const handleSelfAuthorize = async () => {
    if (!address) {
      toast.error("Please connect your wallet first.");
      return;
    }
    try {
      setIsAuthorizingRole(true);
      const res = await fetch("/api/issuer/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetAddress: address }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to authorize address");
      }
      toast.success("Wallet successfully granted ISSUER_ROLE on Polygon Amoy!");
      await refetchIssuerRole();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(`Authorization error: ${error?.message || "Failed"}`);
    } finally {
      setIsAuthorizingRole(false);
    }
  };

  // --------------------------------------------------------------------------
  // Handler: Generate & Mint Credential
  // --------------------------------------------------------------------------
  const handleIssueCredential = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mintMethod === "wallet") {
      if (!isConnected) {
        toast.error("Please connect your wallet first.");
        return;
      }
      if (!isPolygonAmoy) {
        toast.error("Please switch your network to Polygon Amoy Testnet (Chain ID 80002).");
        return;
      }
    }

    if (!isAddress(studentAddress)) {
      toast.error("Invalid student Ethereum address. Please enter a valid 0x address.");
      return;
    }
    if (!fullName.trim() || !rollNumber.trim() || !degree.trim() || !gradYear.trim() || !cgpaClaim.trim()) {
      toast.error("Please fill in all credential fields.");
      return;
    }

    try {
      setIsMinting(true);
      setMintedResult(null);

      // Step 1: Generate individual cryptographic salts for each attribute
      setMintProgressStep("Generating cryptographically secure salts for each claim...");
      const attributes: AcademicAttribute[] = [
        {
          key: "NAME",
          value: fullName.trim(),
          salt: generateSalt(),
        },
        {
          key: "ROLL_NO",
          value: rollNumber.trim(),
          salt: generateSalt(),
        },
        {
          key: "DEGREE",
          value: degree.trim(),
          salt: generateSalt(),
        },
        {
          key: "GRAD_YEAR",
          value: gradYear.trim(),
          salt: generateSalt(),
        },
        {
          key: "CGPA_CLAIM",
          value: cgpaClaim.trim(),
          salt: generateSalt(),
        },
      ];

      // Step 2: Build Merkle Tree & extract rootHash
      setMintProgressStep("Constructing sorted Keccak-256 Merkle tree & computing root...");
      const { root: rootHash } = buildMerkleTree(attributes);

      let txHash = "";
      let mintedTokenId = 1;
      let actualIssuer = address || "0x95c9F3704D9851087C120B2f2de8369C9Bf66cb2";

      if (mintMethod === "relayer") {
        setMintProgressStep("Submitting on-chain via University Registrar Relayer (gasless)...");
        const res = await fetch("/api/issuer/mint-relayer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentAddress: studentAddress.trim(),
            rootHash,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to mint via university relayer");
        }
        txHash = data.txHash;
        mintedTokenId = data.tokenId;
        actualIssuer = data.issuerAddress;
      } else {
        if (!publicClient) {
          throw new Error("Blockchain client is unavailable. Please check your connection.");
        }
        setMintProgressStep("Requesting signature: minting Soulbound Token on Polygon Amoy...");
        txHash = await writeContractAsync({
          address: VERIVAULT_CONTRACT_ADDRESS,
          abi: VERIVAULT_ABI,
          functionName: "issueCredential",
          args: [studentAddress as `0x${string}`, rootHash as `0x${string}`],
        });

        // Wait for block confirmation
        setMintProgressStep(`Awaiting block confirmation for transaction ${txHash.slice(0, 10)}...`);
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });

        // Extract tokenId from event logs
        setMintProgressStep("Extracting minted Token ID from event logs...");
        try {
          const credentialLogs = parseEventLogs({
            abi: VERIVAULT_ABI,
            eventName: "CredentialIssued",
            logs: receipt.logs,
          });

          if (credentialLogs.length > 0 && credentialLogs[0].args.tokenId) {
            mintedTokenId = Number(credentialLogs[0].args.tokenId);
          } else {
            const transferLogs = parseEventLogs({
              abi: VERIVAULT_ABI,
              eventName: "Transfer",
              logs: receipt.logs,
            });
            if (transferLogs.length > 0 && transferLogs[0].args.tokenId) {
              mintedTokenId = Number(transferLogs[0].args.tokenId);
            }
          }
        } catch (err) {
          console.warn("Could not parse event log directly, defaulting tokenId to 1", err);
        }
      }

      // Step 6: Assemble FullCredentialPayload
      const payload: FullCredentialPayload = {
        tokenId: mintedTokenId,
        contractAddress: VERIVAULT_CONTRACT_ADDRESS,
        issuerAddress: actualIssuer,
        attributes,
        rootHash,
      };

      // Step 7: Automatically trigger download of credential file
      triggerPayloadDownload(payload, mintedTokenId);

      setMintedResult({
        tokenId: mintedTokenId,
        rootHash,
        txHash,
        payload,
      });

      toast.success(
        `Soulbound Credential #${mintedTokenId} successfully minted! Backup JSON downloaded.`
      );

      // Reset form fields
      setStudentAddress("");
      setFullName("");
      setRollNumber("");
      setDegree("");
    } catch (error: unknown) {
      console.error("Issuance failed:", error);
      const err = error as { shortMessage?: string; message?: string };
      const message =
        err?.shortMessage || err?.message || "Transaction failed. Please check permissions.";
      toast.error(`Issuance Error: ${message}`);
    } finally {
      setIsMinting(false);
      setMintProgressStep("");
    }
  };

  // --------------------------------------------------------------------------
  // Handler: Revoke Credential
  // --------------------------------------------------------------------------
  const handleRevokeCredential = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error("Please connect your wallet first.");
      return;
    }
    if (!isPolygonAmoy) {
      toast.error("Please switch your network to Polygon Amoy Testnet (Chain ID 80002).");
      return;
    }
    if (!revokeTokenId.trim() || isNaN(Number(revokeTokenId))) {
      toast.error("Please provide a valid numeric Token ID.");
      return;
    }
    if (!revokeReason.trim()) {
      toast.error("Please provide a specific revocation reason for the audit trail.");
      return;
    }
    if (!publicClient) {
      toast.error("Blockchain client unavailable.");
      return;
    }

    try {
      setIsRevoking(true);
      setRevokedResult(null);

      const tokenIdBigInt = BigInt(revokeTokenId.trim());

      const txHash = await writeContractAsync({
        address: VERIVAULT_CONTRACT_ADDRESS,
        abi: VERIVAULT_ABI,
        functionName: "revokeCredential",
        args: [tokenIdBigInt, revokeReason.trim()],
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });

      setRevokedResult({
        tokenId: revokeTokenId.trim(),
        reason: revokeReason.trim(),
        txHash,
      });

      toast.success(`Credential #${revokeTokenId} revoked successfully.`);
      setRevokeTokenId("");
      setRevokeReason("");
    } catch (error: unknown) {
      console.error("Revocation failed:", error);
      const err = error as { shortMessage?: string; message?: string };
      const message =
        err?.shortMessage || err?.message || "Revocation failed. Ensure token exists and is active.";
      toast.error(`Revocation Error: ${message}`);
    } finally {
      setIsRevoking(false);
    }
  };

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
              Institutional Registrar Gateway
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.04em] text-[#1A1523] font-['Plus_Jakarta_Sans',sans-serif] leading-[1.05]">
            University Portal
          </h1>
          <p className="text-base text-[#55505F] font-['Inter',sans-serif] leading-relaxed">
            Mint zero-plaintext EIP-5192 Soulbound degrees and register cryptographic revocation audits on Polygon Amoy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#ECE8F2] shadow-sm text-xs font-['Sometype_Mono',monospace]">
            <span className={`w-2 h-2 rounded-full ${isPolygonAmoy ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            <span className="font-semibold text-[#1A1523]">
              {isPolygonAmoy ? "Polygon Amoy 80002" : "Switch to Amoy"}
            </span>
          </div>

          <a
            href={`https://amoy.polygonscan.com/address/${VERIVAULT_CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F7F5FB] hover:bg-white border border-[#ECE8F2] hover:border-[#592B9B]/30 text-xs font-semibold text-[#592B9B] transition-all group shadow-sm"
            title="Inspect on Polygonscan"
          >
            <span>Contract</span>
            <ExternalLink className="h-3 w-3 text-[#592B9B] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 1. Wallet & Role Verification Banners                                */}
      {/* -------------------------------------------------------------------- */}
      {!isConnected ? (
        <Alert variant="warning" className="border-amber-200 bg-amber-50/90 text-amber-950">
          <ShieldAlert className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-900 font-bold">Wallet Connection Optional for Relayer</AlertTitle>
          <AlertDescription className="text-amber-800/90 text-sm mt-1">
            You can use the <strong>University Relayer</strong> for gasless instant minting without signing transactions,
            or connect your registrar wallet using the <strong>Connect Wallet</strong> button to sign directly.
          </AlertDescription>
        </Alert>
      ) : !isPolygonAmoy ? (
        <Alert variant="destructive">
          <ShieldAlert className="h-5 w-5 text-red-600" />
          <AlertTitle>Network Mismatch</AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
            <span>
              Your connected wallet is on Chain ID {chainId}. VeriVault is deployed on{" "}
              <strong>Polygon Amoy Testnet (Chain ID 80002)</strong>.
            </span>
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100 shrink-0"
              onClick={() => switchChain?.({ chainId: polygonAmoy.id })}
            >
              Switch to Polygon Amoy
            </Button>
          </AlertDescription>
        </Alert>
      ) : isRoleLoading ? (
        <Alert variant="info">
          <Loader2 className="h-5 w-5 animate-spin text-[#592B9B]" />
          <AlertTitle className="text-[#592B9B]">Validating Issuer Authorization...</AlertTitle>
          <AlertDescription className="text-[#55505F] mt-1">
            Querying <code className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-[#ECE8F2]">ISSUER_ROLE</code> on contract {VERIVAULT_CONTRACT_ADDRESS}...
          </AlertDescription>
        </Alert>
      ) : hasIssuerRole ? (
        <Alert variant="success" className="border-emerald-200 bg-emerald-50/80 text-emerald-950">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <AlertTitle className="text-emerald-900 font-bold flex items-center gap-2">
            Authorized University Registrar Active
            <Badge variant="success" className="text-[10px] py-0.5 px-2.5">
              ISSUER_ROLE Confirmed
            </Badge>
          </AlertTitle>
          <AlertDescription className="text-emerald-800/90 text-sm mt-1">
            Authenticated wallet <span className="font-mono font-medium">{address}</span> has on-chain authorization to mint Soulbound credentials and record revocation logs on Polygon Amoy.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* -------------------------------------------------------------------- */}
      {/* Main Tabs: Issue Degree vs Revocation Registry                       */}
      {/* -------------------------------------------------------------------- */}
      <Tabs defaultValue="issue" className="w-full space-y-8">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-[#F7F5FB] p-1.5 rounded-full border border-[#ECE8F2]">
          <TabsTrigger value="issue" className="gap-2 rounded-full py-2.5 text-xs sm:text-sm font-bold">
            <Send className="h-4 w-4" />
            Issue Degree
          </TabsTrigger>
          <TabsTrigger value="revoke" className="gap-2 rounded-full py-2.5 text-xs sm:text-sm font-bold">
            <Ban className="h-4 w-4" />
            Revocation Registry
          </TabsTrigger>
        </TabsList>

        {/* ================================================================= */}
        {/* TAB 1: ISSUE DEGREE                                               */}
        {/* ================================================================= */}
        <TabsContent value="issue" className="space-y-8 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Column */}
            <div className="lg:col-span-7">
              <Card className="rounded-[28px] border border-[rgba(89,43,155,0.12)] bg-white shadow-[0_4px_24px_-4px_rgba(89,43,155,0.06),0_2px_8px_-2px_rgba(0,0,0,0.02)] overflow-hidden">
                {/* Bento Traffic Lights Header */}
                <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-[#ECE8F2] bg-[#F7F5FB]/60">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                    <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                    <span className="ml-2 font-['Sometype_Mono',monospace] text-[11px] font-bold uppercase tracking-wider text-[#592B9B]">
                      EIP-5192 Soulbound Minting Console
                    </span>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={fillDemoData}
                    className="text-xs gap-1.5 h-8 border-[#ECE8F2] bg-white text-[#592B9B] hover:bg-[#F7F5FB] shadow-none"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#F16221]" />
                    <span>Fill Jadavpur Univ Demo</span>
                  </Button>
                </div>

                <form onSubmit={handleIssueCredential}>
                  <CardHeader className="space-y-1.5">
                    <CardTitle className="text-xl sm:text-2xl font-extrabold text-[#1A1523] flex items-center gap-2.5">
                      <Award className="h-6 w-6 text-[#592B9B]" />
                      Academic Credential Specification
                    </CardTitle>
                    <CardDescription className="text-sm text-[#55505F]">
                      Each attribute is salted client-side and committed to a cryptographic Merkle tree. Only the 32-byte Merkle root touches the blockchain.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    {/* Student Recipient Wallet Address */}
                    <div className="space-y-2">
                      <Label htmlFor="studentAddress" className="text-xs font-bold uppercase tracking-wider text-[#592B9B] flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-[#592B9B]" />
                        Student Wallet Address (Recipient)
                      </Label>
                      <Input
                        id="studentAddress"
                        placeholder="0x71C...392"
                        value={studentAddress}
                        onChange={(e) => setStudentAddress(e.target.value)}
                        className="font-mono text-xs"
                        disabled={isMinting}
                        required
                      />
                      <p className="text-[11px] text-[#55505F]/80">
                        Self-custody wallet that will permanently receive the soulbound token.
                      </p>
                    </div>

                    {/* Student Full Name & Roll Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider text-[#592B9B]">
                          Student Full Name
                        </Label>
                        <Input
                          id="fullName"
                          placeholder="e.g. Aarav Sharma"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          disabled={isMinting}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rollNumber" className="text-xs font-bold uppercase tracking-wider text-[#592B9B] flex items-center gap-1.5">
                          <Hash className="h-3.5 w-3.5 text-[#592B9B]" />
                          Roll / Registration Number
                        </Label>
                        <Input
                          id="rollNumber"
                          placeholder="e.g. JU-CSE-2024-042"
                          value={rollNumber}
                          onChange={(e) => setRollNumber(e.target.value)}
                          disabled={isMinting}
                          required
                        />
                      </div>
                    </div>

                    {/* Degree & Graduation Year */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="degree" className="text-xs font-bold uppercase tracking-wider text-[#592B9B] flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-[#592B9B]" />
                          Degree / Program
                        </Label>
                        <Input
                          id="degree"
                          placeholder="e.g. B.Tech Computer Science"
                          value={degree}
                          onChange={(e) => setDegree(e.target.value)}
                          disabled={isMinting}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gradYear" className="text-xs font-bold uppercase tracking-wider text-[#592B9B] flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-[#592B9B]" />
                          Graduation Year
                        </Label>
                        <Input
                          id="gradYear"
                          placeholder="e.g. 2028"
                          value={gradYear}
                          onChange={(e) => setGradYear(e.target.value)}
                          disabled={isMinting}
                          required
                        />
                      </div>
                    </div>

                    {/* CGPA Selective Disclosure Claim */}
                    <div className="space-y-2">
                      <Label htmlFor="cgpaClaim" className="text-xs font-bold uppercase tracking-wider text-[#592B9B] flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-[#F16221]" />
                        Selective Disclosure Claim (CGPA / Honors)
                      </Label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          id="cgpaClaim"
                          placeholder="e.g. CGPA >= 8.0"
                          value={cgpaClaim}
                          onChange={(e) => setCgpaClaim(e.target.value)}
                          disabled={isMinting}
                          className="flex-1"
                          required
                        />
                        <select
                          className="h-11 rounded-xl border border-[#ECE8F2] bg-white px-3.5 py-2 text-xs font-medium text-[#1A1523] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#592B9B]/20"
                          onChange={(e) => setCgpaClaim(e.target.value)}
                          disabled={isMinting}
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Select Merit Preset
                          </option>
                          <option value="CGPA >= 9.0">CGPA &gt;= 9.0 (Gold Medal)</option>
                          <option value="CGPA >= 8.5">CGPA &gt;= 8.5 (Distinction)</option>
                          <option value="CGPA >= 8.0">CGPA &gt;= 8.0 (First Class Honors)</option>
                          <option value="CGPA >= 7.5">CGPA &gt;= 7.5</option>
                          <option value="CGPA >= 7.0">CGPA &gt;= 7.0</option>
                        </select>
                      </div>
                      <p className="text-[11px] text-[#55505F]/80">
                        Allows students to prove academic honors to employers without revealing transcripts or unhashed GPA.
                      </p>
                    </div>

                    {/* Issuance Execution Channel Selection */}
                    <div className="space-y-2.5 pt-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold uppercase tracking-wider text-[#592B9B]">
                          Issuance Execution Channel
                        </Label>
                        <Badge variant="outline" className="text-[10px] bg-white border-[#ECE8F2] text-[#592B9B]">
                          Polygon Amoy
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setMintMethod("relayer")}
                          className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                            mintMethod === "relayer"
                              ? "border-[#592B9B] bg-[#F7F5FB] shadow-sm ring-2 ring-[#592B9B]/20"
                              : "border-[#ECE8F2] bg-white hover:border-[#592B9B]/40"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <Building2 className="h-4 w-4 text-[#592B9B] shrink-0" />
                            <span className="text-xs font-bold text-[#1A1523]">University Relayer</span>
                            <span className="ml-auto text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                              Gasless
                            </span>
                          </div>
                          <p className="text-xs text-[#55505F] leading-tight">
                            Instant on-chain minting via official registrar backend. 1-click testnet demo.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setMintMethod("wallet")}
                          className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                            mintMethod === "wallet"
                              ? "border-[#592B9B] bg-[#F7F5FB] shadow-sm ring-2 ring-[#592B9B]/20"
                              : "border-[#ECE8F2] bg-white hover:border-[#592B9B]/40"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <Wallet className="h-4 w-4 text-[#592B9B] shrink-0" />
                            <span className="text-xs font-bold text-[#1A1523]">Personal MetaMask</span>
                          </div>
                          <p className="text-xs text-[#55505F] leading-tight">
                            Sign transaction directly using your connected browser registrar wallet.
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Mint Progress Status */}
                    {isMinting && (
                      <div className="p-4 rounded-2xl border border-[#592B9B]/20 bg-[#F7F5FB] flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-[#592B9B] shrink-0" />
                        <span className="text-xs sm:text-sm font-medium text-[#1A1523]">{mintProgressStep}</span>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-2 pb-8">
                    {mintMethod === "relayer" ? (
                      <Button
                        type="submit"
                        disabled={isMinting}
                        className="w-full gap-2 text-base font-bold py-6 bg-[#F16221] hover:bg-[#d95216] text-white rounded-full shadow-lg shadow-[#F16221]/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                      >
                        {isMinting ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Minting via University Registrar Relayer...
                          </>
                        ) : (
                          <>
                            <Award className="h-5 w-5" />
                            Generate & Mint Credential (Instant Relayer)
                          </>
                        )}
                      </Button>
                    ) : !isConnected ? (
                      <Button
                        type="button"
                        onClick={openConnectModal}
                        className="w-full gap-2 text-base font-bold py-6 bg-[#592B9B] hover:bg-[#47227d] text-white rounded-full shadow-lg shadow-[#592B9B]/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <Wallet className="h-5 w-5" />
                        Connect Wallet to Sign Transaction
                      </Button>
                    ) : !isPolygonAmoy ? (
                      <Button
                        type="button"
                        onClick={() => switchChain?.({ chainId: polygonAmoy.id })}
                        className="w-full gap-2 text-base font-bold py-6 bg-amber-600 hover:bg-amber-500 text-white rounded-full shadow-lg shadow-amber-600/25 cursor-pointer"
                      >
                        <Radio className="h-5 w-5 animate-pulse" />
                        Switch Network to Polygon Amoy (Chain 80002)
                      </Button>
                    ) : isRoleLoading ? (
                      <Button
                        type="button"
                        disabled
                        className="w-full gap-2 text-base font-semibold py-6 opacity-60 rounded-full"
                      >
                        <Loader2 className="h-5 w-5 animate-spin text-[#592B9B]" />
                        Verifying ISSUER_ROLE Authorization...
                      </Button>
                    ) : !hasIssuerRole ? (
                      <div className="w-full space-y-3">
                        <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/80 text-xs text-amber-950">
                          <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
                            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
                            Wallet Not Yet Registered as University Issuer
                          </div>
                          <p className="text-amber-800/90 text-xs">
                            Connected: <span className="font-mono">{address?.slice(0, 8)}...{address?.slice(-6)}</span>.
                            You can self-authorize below for the demo, or switch back to the University Relayer.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Button
                            type="button"
                            onClick={handleSelfAuthorize}
                            disabled={isAuthorizingRole}
                            className="w-full gap-2 bg-[#592B9B] hover:bg-[#47227d] text-white text-xs font-bold py-5 rounded-full cursor-pointer shadow-md"
                          >
                            {isAuthorizingRole ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Authorizing On-Chain...
                              </>
                            ) : (
                              <>
                                <Zap className="h-4 w-4 text-[#F16221]" />
                                ⚡ Authorize My Wallet
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            onClick={() => setMintMethod("relayer")}
                            variant="outline"
                            className="w-full gap-2 border-[#ECE8F2] hover:bg-[#F7F5FB] text-[#1A1523] text-xs font-bold py-5 rounded-full cursor-pointer"
                          >
                            <Building2 className="h-4 w-4 text-[#592B9B]" />
                            Use University Relayer
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="submit"
                        disabled={isMinting}
                        className="w-full gap-2 text-base font-bold py-6 bg-[#F16221] hover:bg-[#d95216] text-white rounded-full shadow-lg shadow-[#F16221]/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                      >
                        {isMinting ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Minting Soulbound Credential...
                          </>
                        ) : (
                          <>
                            <Award className="h-5 w-5" />
                            Generate & Mint Credential (via MetaMask)
                          </>
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </form>
              </Card>
            </div>

            {/* Results & Cryptographic Explainer Column */}
            <div className="lg:col-span-5 space-y-6">
              {/* Minted Success Card */}
              {mintedResult && (
                <Card className="rounded-[28px] border-2 border-emerald-500/40 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-100 bg-emerald-50/60">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-sm sm:text-base text-emerald-950">
                        Credential #{mintedResult.tokenId} Minted
                      </span>
                    </div>
                    <Badge variant="success">EIP-5192 Soulbound</Badge>
                  </div>

                  <CardContent className="space-y-4 pt-6 text-xs sm:text-sm">
                    <div>
                      <span className="text-[#55505F] text-xs uppercase tracking-wider font-semibold font-['Sometype_Mono',monospace]">
                        On-Chain Token ID
                      </span>
                      <p className="text-2xl font-black text-[#1A1523] font-mono mt-0.5">
                        #{mintedResult.tokenId}
                      </p>
                    </div>

                    <div>
                      <span className="text-[#55505F] text-xs uppercase tracking-wider font-semibold font-['Sometype_Mono',monospace]">
                        Committed Merkle Root
                      </span>
                      <p className="font-mono text-xs text-[#592B9B] break-all p-3 rounded-xl bg-[#F7F5FB] border border-[#ECE8F2] mt-1 font-medium">
                        {mintedResult.rootHash}
                      </p>
                    </div>

                    <div>
                      <span className="text-[#55505F] text-xs uppercase tracking-wider font-semibold font-['Sometype_Mono',monospace]">
                        Polygon Amoy Transaction
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs text-[#1A1523] truncate max-w-[220px]">
                          {mintedResult.txHash}
                        </span>
                        <a
                          href={`https://amoy.polygonscan.com/tx/${mintedResult.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#592B9B] hover:text-[#F16221] transition-colors"
                          title="View on Polygonscan"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          triggerPayloadDownload(mintedResult.payload, mintedResult.tokenId)
                        }
                        className="w-full gap-2 border-[#ECE8F2] bg-[#F7F5FB] hover:bg-white text-[#1A1523]"
                      >
                        <Download className="h-4 w-4 text-[#592B9B]" />
                        Download Credential JSON (.json)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Protocol Architecture Bento Card */}
              <Card className="rounded-[28px] border border-[rgba(89,43,155,0.12)] bg-[#F7F5FB]/70 backdrop-blur-md">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#592B9B]" />
                    <span className="font-['Sometype_Mono',monospace] text-xs font-bold uppercase tracking-wider text-[#592B9B]">
                      Zero-Plaintext Architecture
                    </span>
                  </div>
                  <CardTitle className="text-lg font-extrabold text-[#1A1523] mt-1">
                    How VeriVault Protects Student Privacy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs sm:text-sm text-[#55505F] leading-relaxed">
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-[#ECE8F2] shadow-sm">
                    <span className="h-6 w-6 rounded-full bg-[#592B9B]/10 text-[#592B9B] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <strong className="text-[#1A1523] block mb-0.5">Client-Side Salting:</strong>
                      Every claim is paired with 32 cryptographically secure random bytes before hashing, preventing rainbow table attacks.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-[#ECE8F2] shadow-sm">
                    <span className="h-6 w-6 rounded-full bg-[#592B9B]/10 text-[#592B9B] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <strong className="text-[#1A1523] block mb-0.5">Sorted Keccak-256 Merkle Tree:</strong>
                      Leaf digests are organized into an immutable tree. Only the single 32-byte Merkle root is recorded on Polygon Amoy.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-[#ECE8F2] shadow-sm">
                    <span className="h-6 w-6 rounded-full bg-[#592B9B]/10 text-[#592B9B] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <strong className="text-[#1A1523] block mb-0.5">Zero Plaintext On-Chain:</strong>
                      Student names, roll numbers, and grades never touch blockchain storage, complying fully with GDPR, FERPA, and DPDP mandates.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ================================================================= */}
        {/* TAB 2: REVOCATION REGISTRY                                        */}
        {/* ================================================================= */}
        <TabsContent value="revoke" className="space-y-6 pt-2 focus-visible:outline-none">
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="rounded-[28px] border border-red-200/80 bg-white shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-red-100 bg-red-50/50">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  <span className="ml-2 font-['Sometype_Mono',monospace] text-[11px] font-bold uppercase tracking-wider text-red-700">
                    On-Chain Revocation Audit Log
                  </span>
                </div>
                <Badge variant="destructive">Immutable Audit</Badge>
              </div>

              <form onSubmit={handleRevokeCredential}>
                <CardHeader className="space-y-1.5">
                  <CardTitle className="text-xl sm:text-2xl font-extrabold text-[#1A1523] flex items-center gap-2">
                    <Ban className="h-6 w-6 text-red-600" />
                    Revoke Issued Credential
                  </CardTitle>
                  <CardDescription className="text-sm text-[#55505F]">
                    Permanently flag an issued credential as revoked on Polygon Amoy with an immutable on-chain explanatory reason.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="revokeTokenId" className="text-xs font-bold uppercase tracking-wider text-[#592B9B]">
                      Token ID to Revoke
                    </Label>
                    <Input
                      id="revokeTokenId"
                      type="number"
                      min="1"
                      placeholder="e.g. 1"
                      value={revokeTokenId}
                      onChange={(e) => setRevokeTokenId(e.target.value)}
                      disabled={isRevoking}
                      className="font-mono text-sm"
                      required
                    />
                    <p className="text-[11px] text-[#55505F]">
                      The on-chain ERC-5192 token identifier of the target credential.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="revokeReason" className="text-xs font-bold uppercase tracking-wider text-[#592B9B]">
                      Official Revocation Reason
                    </Label>
                    <Input
                      id="revokeReason"
                      placeholder="e.g. Degree cancelled due to academic malpractice confirmed on 12-Oct-2024"
                      value={revokeReason}
                      onChange={(e) => setRevokeReason(e.target.value)}
                      disabled={isRevoking}
                      required
                    />
                    <p className="text-[11px] text-[#55505F]">
                      This audit explanation will be permanently visible to employers and verifiers worldwide.
                    </p>
                  </div>

                  <Alert variant="warning" className="border-amber-200 bg-amber-50/80">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-900 font-bold text-xs uppercase tracking-wider">
                      Irreversible On-Chain Action
                    </AlertTitle>
                    <AlertDescription className="text-amber-800 text-xs leading-relaxed mt-1">
                      Once a credential is revoked on Polygon Amoy, its status cannot be reversed. Public verification queries will immediately report the token as invalidated.
                    </AlertDescription>
                  </Alert>
                </CardContent>

                <CardFooter className="pt-2 pb-8">
                  {!isConnected ? (
                    <Button
                      type="button"
                      onClick={openConnectModal}
                      className="w-full gap-2 text-base font-bold py-6 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg shadow-red-600/25 cursor-pointer"
                    >
                      <Wallet className="h-5 w-5" />
                      Connect Wallet to Revoke Credential
                    </Button>
                  ) : !isPolygonAmoy ? (
                    <Button
                      type="button"
                      onClick={() => switchChain?.({ chainId: polygonAmoy.id })}
                      className="w-full gap-2 text-base font-bold py-6 bg-amber-600 hover:bg-amber-500 text-white rounded-full shadow-lg cursor-pointer"
                    >
                      <Radio className="h-5 w-5 animate-pulse" />
                      Switch Network to Polygon Amoy (Chain 80002)
                    </Button>
                  ) : isRoleLoading ? (
                    <Button
                      type="button"
                      disabled
                      className="w-full gap-2 text-base font-semibold py-6 opacity-60 rounded-full"
                    >
                      <Loader2 className="h-5 w-5 animate-spin text-red-500" />
                      Verifying ISSUER_ROLE Authorization...
                    </Button>
                  ) : !hasIssuerRole ? (
                    <div className="w-full space-y-3">
                      <div className="p-4 rounded-2xl border border-red-200 bg-red-50/80 text-xs text-red-950">
                        <div className="flex items-center gap-2 font-bold text-red-900 mb-1">
                          <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" />
                          Wallet Lacks Registrar Role for Revocation
                        </div>
                        <p className="text-red-800 text-xs">
                          Connected: <span className="font-mono">{address?.slice(0, 8)}...{address?.slice(-6)}</span>.
                          You can self-authorize below for testing on Polygon Amoy.
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={handleSelfAuthorize}
                        disabled={isAuthorizingRole}
                        className="w-full gap-2 bg-[#592B9B] hover:bg-[#47227d] text-white text-xs font-bold py-5 rounded-full cursor-pointer shadow-md"
                      >
                        {isAuthorizingRole ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Authorizing On-Chain...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 text-[#F16221]" />
                            ⚡ 1-Click Authorize My Wallet as Registrar
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={isRevoking}
                      className="w-full gap-2 text-base font-bold py-6 rounded-full cursor-pointer"
                    >
                      {isRevoking ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Executing Revocation Transaction...
                        </>
                      ) : (
                        <>
                          <Ban className="h-5 w-5" />
                          Execute On-Chain Revocation
                        </>
                      )}
                    </Button>
                  )}
                </CardFooter>
              </form>
            </Card>

            {/* Revocation Result Card */}
            {revokedResult && (
              <Card className="rounded-[28px] border-2 border-red-300 bg-red-50/50 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <CardHeader className="pb-3 border-b border-red-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-red-600" />
                    <CardTitle className="text-base sm:text-lg text-red-900 font-bold">
                      Credential #{revokedResult.tokenId} Revoked
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-red-800 text-xs uppercase tracking-wider font-semibold font-['Sometype_Mono',monospace]">
                      Logged Reason:
                    </span>
                    <p className="font-semibold text-red-950 mt-0.5">{revokedResult.reason}</p>
                  </div>
                  <div>
                    <span className="text-red-800 text-xs uppercase tracking-wider font-semibold font-['Sometype_Mono',monospace]">
                      Transaction Confirmation:
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs text-red-950 truncate max-w-[280px]">
                        {revokedResult.txHash}
                      </span>
                      <a
                        href={`https://amoy.polygonscan.com/tx/${revokedResult.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-700 hover:text-red-900 inline-flex items-center gap-1 font-semibold"
                      >
                        Polygonscan
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
