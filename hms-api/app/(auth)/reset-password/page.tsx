"use client";

import { useTransition, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { ShieldCheck, Lock, ArrowLeft, CheckCircle } from "@phosphor-icons/react";

import { authClient } from "@/lib/auth-client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const error = searchParams.get("error");

  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(
    error === "INVALID_TOKEN" ? "Invalid or expired reset link. Please request a new one." : null
  );
  const [success, setSuccess] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  if (!token) {
    return (
      <div className="flex min-h-svh">
        {/* Left Panel — Brand */}
        <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-[#1e1b4b] p-10 lg:flex xl:p-14">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7c3aed]/20 blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-[#6366f1]/10 blur-[100px]" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                <ShieldCheck className="size-5 text-white/90" weight="duotone" />
              </div>
              <span className="font-mono text-xl font-semibold tracking-tight text-white">HMS</span>
            </div>
          </div>
          <div className="relative z-10 max-w-md">
            <h1 className="font-mono text-3xl font-semibold leading-tight tracking-tight text-white xl:text-4xl">
              Invalid link
            </h1>
            <div className="mt-6 h-px w-16 bg-white/20" />
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/50">
              This reset link is invalid or has expired. Please request a new one.
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-2 text-xs text-white/30">
            <Lock className="size-3.5" />
            <span>Encrypted &middot; Two-factor authentication</span>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex flex-1 flex-col items-center justify-center bg-background p-6 sm:p-8">
          <div className="w-full max-w-[380px]">
            <div className="mb-10 flex items-center gap-2.5 lg:hidden">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#1e1b4b]">
                <ShieldCheck className="size-4.5 text-white" weight="duotone" />
              </div>
              <span className="font-mono text-lg font-semibold tracking-tight">HMS</span>
            </div>
            <p className="text-sm text-muted-foreground">
              This reset link is invalid or has expired.
            </p>
            <Link href="/forgot-password">
              <Button className="mt-6 h-11 w-full text-sm font-medium">
                Request a new link
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  function onSubmit(data: ResetPasswordFormValues) {
    setServerError(null);
    startTransition(async () => {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: data.newPassword,
        token: token!,
      });

      if (resetError) {
        setServerError(
          resetError.code === "INVALID_TOKEN"
            ? "Invalid or expired reset link. Please request a new one."
            : resetError.message || "Failed to reset password. Please try again."
        );
        return;
      }

      setSuccess(true);
    });
  }

  return (
    <div className="flex min-h-svh">
      {/* Left Panel — Brand */}
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-[#1e1b4b] p-10 lg:flex xl:p-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7c3aed]/20 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-[#6366f1]/10 blur-[100px]" />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
              <ShieldCheck className="size-5 text-white/90" weight="duotone" />
            </div>
            <span className="font-mono text-xl font-semibold tracking-tight text-white">HMS</span>
          </div>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="font-mono text-3xl font-semibold leading-tight tracking-tight text-white xl:text-4xl">
            Set new
            <br />
            password
          </h1>
          <div className="mt-6 h-px w-16 bg-white/20" />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/50">
            Choose a strong password for your account. Make sure it&apos;s something
            you&apos;ll remember.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2 text-xs text-white/30">
          <Lock className="size-3.5" />
          <span>Encrypted &middot; Two-factor authentication</span>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background p-6 sm:p-8">
        <div className="w-full max-w-[380px]">
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#1e1b4b]">
              <ShieldCheck className="size-4.5 text-white" weight="duotone" />
            </div>
            <span className="font-mono text-lg font-semibold tracking-tight">HMS</span>
          </div>

          {success ? (
            <>
              <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                <CheckCircle className="size-6 text-primary" weight="duotone" />
              </div>

              <div className="mb-8">
                <h2 className="font-mono text-xl font-semibold tracking-tight">
                  Password reset successfully
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Your password has been updated. You can now sign in with your new
                  password.
                </p>
              </div>

              <Button
                className="h-11 w-full text-sm font-medium"
                onClick={() => router.push("/login")}
              >
                Sign in
              </Button>
            </>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="font-mono text-xl font-semibold tracking-tight">
                  Set new password
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Enter your new password below.
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          New password
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="At least 8 characters"
                            autoComplete="new-password"
                            className="h-11"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Confirm password
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Re-enter your password"
                            autoComplete="new-password"
                            className="h-11"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {serverError && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
                      {serverError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="h-11 w-full text-sm font-medium"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                        Resetting password&hellip;
                      </span>
                    ) : (
                      "Reset password"
                    )}
                  </Button>
                </form>
              </Form>

              <Link
                href="/login"
                className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" />
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
