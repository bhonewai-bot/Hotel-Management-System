"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck, Lock, EnvelopeSimple } from "@phosphor-icons/react";

import { authClient } from "@/lib/auth-client";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";

export default function VerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const verifyingRef = useRef(false);
  const otpSentRef = useRef(false);

  useEffect(() => {
    if (code.length === 6 && !verifyingRef.current) {
      verifyingRef.current = true;
      handleVerify(code);
    }
  }, [code]);

  useEffect(() => {
    if (!otpSentRef.current) {
      otpSentRef.current = true;
      sendInitialOtp();
    }
  }, []);

  async function sendInitialOtp() {
    const { error } = await authClient.twoFactor.sendOtp();
    if (error) {
      toast.error("Failed to send verification code. Please try again.");
    }
  }

  async function handleVerify(otpCode: string) {
    setIsVerifying(true);
    setError(null);

    const { data, error } = await authClient.twoFactor.verifyOtp({
      code: otpCode,
    });

    if (error) {
      setError(
        error.code === "INVALID_CODE"
          ? "Invalid code. Please try again."
          : error.code === "OTP_HAS_EXPIRED"
            ? "Code has expired. Request a new one."
            : "Verification failed. Please try again."
      );
      setCode("");
      verifyingRef.current = false;
      setIsVerifying(false);
      return;
    }

    toast.success("Welcome back!");
    router.push("/dashboard");
    router.refresh();
  }

  async function handleResend() {
    setIsResending(true);
    setError(null);

    const { error } = await authClient.twoFactor.sendOtp();

    if (error) {
      toast.error("Failed to resend code. Please try again.");
    } else {
      toast.success("A new code has been sent to your email.");
    }

    setIsResending(false);
  }

  return (
    <div className="flex min-h-svh">
      {/* Left Panel — Brand */}
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-[#1e1b4b] p-10 lg:flex xl:p-14">
        {/* Glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7c3aed]/20 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-[#6366f1]/10 blur-[100px]" />
        </div>

        {/* Brand */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
              <ShieldCheck className="size-5 text-white/90" weight="duotone" />
            </div>
            <span className="font-mono text-xl font-semibold tracking-tight text-white">
              HMS
            </span>
          </div>
        </div>

        {/* Center Content */}
        <div className="relative z-10 max-w-md">
          <h1 className="font-mono text-3xl font-semibold leading-tight tracking-tight text-white xl:text-4xl">
            Verify
            <br />
            your identity
          </h1>
          <div className="mt-6 h-px w-16 bg-white/20" />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/50">
            A verification code was sent to your email. This extra step keeps
            your hotel data secure.
          </p>
        </div>

        {/* Bottom Trust */}
        <div className="relative z-10 flex items-center gap-2 text-xs text-white/30">
          <Lock className="size-3.5" />
          <span>Encrypted &middot; Two-factor authentication</span>
        </div>
      </div>

      {/* Right Panel — Verify Form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background p-6 sm:p-8">
        <div className="w-full max-w-[380px]">
          {/* Mobile Brand */}
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#1e1b4b]">
              <ShieldCheck className="size-4.5 text-white" weight="duotone" />
            </div>
            <span className="font-mono text-lg font-semibold tracking-tight">
              HMS
            </span>
          </div>

          {/* Icon */}
          <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-primary/10">
            <EnvelopeSimple className="size-6 text-primary" weight="duotone" />
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="font-mono text-xl font-semibold tracking-tight">
              Check your email
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Enter the 6-digit code sent to your email address.
            </p>
          </div>

          {/* OTP Input */}
          <div className="flex flex-col items-center gap-5">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
              disabled={isVerifying}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            {error && (
              <div className="w-full rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-center text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 space-y-4">
            <Button
              className="h-11 w-full text-sm font-medium"
              disabled={code.length !== 6 || isVerifying}
              onClick={() => handleVerify(code)}
            >
              {isVerifying ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  Verifying&hellip;
                </span>
              ) : (
                "Verify code"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Didn&apos;t receive it?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 disabled:opacity-50"
              >
                {isResending ? "Sending&hellip;" : "Resend code"}
              </button>
            </p>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-muted-foreground/60">
            Code expires in 5 minutes
          </p>
        </div>
      </div>
    </div>
  );
}
