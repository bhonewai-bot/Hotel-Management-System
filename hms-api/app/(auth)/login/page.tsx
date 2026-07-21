"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck } from "@phosphor-icons/react";

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

const loginSchema = z.object({
  email: z.email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(data: LoginFormValues) {
    setServerError(null);

    startTransition(async () => {
      const { data: signInData, error: signInError } =
        await authClient.signIn.email({
          email: data.email,
          password: data.password,
        });

      if (signInError) {
        setServerError(
          signInError.status === 401
            ? "Invalid email or password"
            : signInError.message || "Sign in failed"
        );
        return;
      }

      if (
        signInData &&
        "twoFactorRedirect" in signInData &&
        signInData.twoFactorRedirect
      ) {
        return;
      }

      // Redirect to dashboard after successful login (for non-2FA roles)
      router.push("/dashboard");
    });
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
            Hotel
            <br />
            Management
            <br />
            System
          </h1>
          <div className="mt-6 h-px w-16 bg-white/20" />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/50">
            Secure admin access to manage bookings, rooms, guests, and hotel
            operations.
          </p>
        </div>

        {/* Bottom Trust */}
        <div className="relative z-10 flex items-center gap-2 text-xs text-white/30">
          <Lock className="size-3.5" />
          <span>Encrypted &middot; Two-factor authentication</span>
        </div>
      </div>

      {/* Right Panel — Form */}
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

          {/* Header */}
          <div className="mb-8">
            <h2 className="font-mono text-xl font-semibold tracking-tight">
              Sign in
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Enter your credentials to access the dashboard.
            </p>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@hotel.com"
                        autoComplete="email"
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="mt-1">
                      <Link
                        href="/forgot-password"
                        className="text-xs font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                      >
                        Forgot password?
                      </Link>
                    </div>
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
                    Signing in&hellip;
                  </span>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          </Form>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-muted-foreground/60">
            Protected by two-factor authentication
          </p>
        </div>
      </div>
    </div>
  );
}
