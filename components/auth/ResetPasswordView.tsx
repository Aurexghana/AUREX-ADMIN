"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { resetPassword, validateResetToken } from "@/lib/passwordReset";
import { motion } from "framer-motion";
import AuthCard from "@/components/auth/AuthCard";
import AuthField from "@/components/auth/AuthField";
import { hoverScale } from "@/lib/motion";
import { isValidPassword, MIN_PASSWORD_LENGTH } from "@/lib/validation";
import { LockIcon, EyeIcon, EyeOffIcon, SpinnerIcon, CheckIcon, ArrowLeftIcon } from "@/components/icons";

/**
 * Reached from the emailed link (/reset-password?token=...). The token is
 * validated up front so an expired or used link never shows the form.
 */
export default function ResetPasswordView() {
  const token = useSearchParams().get("token") ?? "";
  const [tokenState, setTokenState] = useState<"checking" | "valid" | "invalid">(token ? "checking" : "invalid");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    validateResetToken(token).then((ok) => {
      if (!cancelled) setTokenState(ok ? "valid" : "invalid");
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isValidPassword(password)) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters and include a number and a symbol.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 400 || err.status === 401 || err.status === 404 || err.status === 410)) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (tokenState === "checking") {
    return (
      <AuthCard title="Checking your link" description="One moment while we verify your reset link.">
        <div className="flex justify-center py-4 text-gold-bright">
          <SpinnerIcon className="size-5 animate-spin" />
        </div>
      </AuthCard>
    );
  }

  if (tokenState === "invalid") {
    return (
      <AuthCard
        title="Link expired or invalid"
        description="This password reset link can't be used. Request a new one to continue."
        footer={
          <Link href="/login" className="inline-flex items-center gap-1.5 text-gold-bright transition-colors hover:text-gold-light">
            <ArrowLeftIcon className="size-3" /> Back to sign in
          </Link>
        }
      >
        <Link href="/forgot-password" className="w-full">
          <motion.span
            {...hoverScale}
            className="flex w-full items-center justify-center bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-5 py-2.5 font-jakarta text-sm font-medium text-amainblack"
          >
            Request a New Link
          </motion.span>
        </Link>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard title="Password updated" description="Your password has been reset. Sign in with your new one.">
        <div className="flex flex-col items-center gap-4 py-2">
          <span className="flex size-11 items-center justify-center border border-gold/30 bg-gold/10 text-gold-bright">
            <CheckIcon className="size-5" />
          </span>
          <Link href="/login" className="w-full">
            <motion.span
              {...hoverScale}
              className="flex w-full items-center justify-center bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-5 py-2.5 font-jakarta text-sm font-medium text-amainblack"
            >
              Continue to Sign In
            </motion.span>
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set a new password"
      description="Choose a new password for your admin account."
      footer={
        <Link href="/login" className="inline-flex items-center gap-1.5 text-gold-bright transition-colors hover:text-gold-light">
          <ArrowLeftIcon className="size-3" /> Back to sign in
        </Link>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {error && (
          <div className="border border-[#f87171]/30 bg-[#f87171]/5 p-3 font-sans text-sm text-[#f87171]">{error}</div>
        )}

        <AuthField
          label="New Password"
          icon={<LockIcon className="size-4" />}
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          trailing={
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              disabled={submitting}
              className="text-cream-dim transition-colors hover:text-cream disabled:cursor-not-allowed disabled:opacity-60"
            >
              {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
            </button>
          }
        />

        <AuthField
          label="Confirm Password"
          icon={<LockIcon className="size-4" />}
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <motion.button
          {...hoverScale}
          type="submit"
          disabled={submitting}
          className="mt-1 flex items-center justify-center gap-2 bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-5 py-2.5 font-jakarta text-sm font-medium text-amainblack disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? <SpinnerIcon className="size-4 animate-spin" /> : "Update Password"}
        </motion.button>
      </form>
    </AuthCard>
  );
}
