"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import AuthCard from "@/components/auth/AuthCard";
import AuthField from "@/components/auth/AuthField";
import { hoverScale } from "@/lib/motion";
import { ApiError } from "@/lib/api/client";
import { requestPasswordReset } from "@/lib/passwordReset";
import { MailIcon, SpinnerIcon, CheckIcon, ArrowLeftIcon } from "@/components/icons";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BACK_TO_SIGN_IN = (
  <Link href="/login" className="inline-flex items-center gap-1.5 text-gold-bright transition-colors hover:text-gold-light">
    <ArrowLeftIcon className="size-3" /> Back to sign in
  </Link>
);

export default function ForgotPasswordView() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!EMAIL_PATTERN.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <AuthCard title="Check your email" description={`If an account exists for ${email}, a reset link is on its way.`} footer={BACK_TO_SIGN_IN}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="flex size-11 items-center justify-center border border-gold/30 bg-gold/10 text-gold-bright">
            <CheckIcon className="size-5" />
          </span>
          <p className="font-sans text-sm text-cream-dim">Open the link in the email to choose a new password.</p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Forgot your password?" description="Enter your admin email and we'll send you a link to reset it." footer={BACK_TO_SIGN_IN}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {error && (
          <div className="border border-[#f87171]/30 bg-[#f87171]/5 p-3 font-sans text-sm text-[#f87171]">{error}</div>
        )}

        <AuthField
          label="Email"
          icon={<MailIcon className="size-4" />}
          type="email"
          autoComplete="email"
          placeholder="you@aurexgh.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <motion.button
          {...hoverScale}
          type="submit"
          disabled={submitting}
          className="mt-1 flex items-center justify-center gap-2 bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-5 py-2.5 font-jakarta text-sm font-medium text-amainblack disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? <SpinnerIcon className="size-4 animate-spin" /> : "Send Reset Link"}
        </motion.button>
      </form>
    </AuthCard>
  );
}
