"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import AuthCard from "@/components/auth/AuthCard";
import AuthField from "@/components/auth/AuthField";
import { hoverScale } from "@/lib/motion";
import { useSession } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon, SpinnerIcon } from "@/components/icons";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * `next` (from ?next=, set by AuthGate when it redirects a signed-out
 * visitor here) sends them back to whatever they were actually trying
 * to reach, defaulting to the Overview page.
 */
export default function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, login } = useSession();
  const next = searchParams.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in (e.g. an old /login bookmark) - send straight
  // through instead of showing the form again.
  useEffect(() => {
    if (isAuthenticated) router.replace(next);
  }, [isAuthenticated, next, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!EMAIL_PATTERN.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (isAuthenticated) return null;

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to manage AUREX's members, investments, and reports."
      footer={
        <>
          Don&rsquo;t have an account?{" "}
          <Link href="/register" className="text-gold-bright transition-colors hover:text-gold-light">
            Create one
          </Link>
        </>
      }
    >
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

        <AuthField
          label="Password"
          labelAction={
            <Link href="/forgot-password" className="font-sans text-xs text-gold-bright transition-colors hover:text-gold-light">
              Forgot password?
            </Link>
          }
          icon={<LockIcon className="size-4" />}
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
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

        <motion.button
          {...hoverScale}
          type="submit"
          disabled={submitting}
          className="mt-1 flex items-center justify-center gap-2 bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-5 py-2.5 font-jakarta text-sm font-medium text-amainblack disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? <SpinnerIcon className="size-4 animate-spin" /> : "Sign In"}
        </motion.button>
      </form>
    </AuthCard>
  );
}
