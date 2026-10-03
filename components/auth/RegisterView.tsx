"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AuthCard from "@/components/auth/AuthCard";
import AuthField from "@/components/auth/AuthField";
import { hoverScale } from "@/lib/motion";
import { useSession } from "@/lib/auth";
import { isValidPassword, MIN_PASSWORD_LENGTH } from "@/lib/validation";
import { ApiError } from "@/lib/api/client";
import { UserIcon, MailIcon, LockIcon, KeyIcon, EyeIcon, EyeOffIcon, SpinnerIcon } from "@/components/icons";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterView() {
  const router = useRouter();
  const { isAuthenticated, registerAdmin } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Already signed in - send straight through instead of showing the
  // form again.
  useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Enter your full name.");
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!isValidPassword(password)) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters and include a number and a symbol.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (!secretCode.trim()) {
      setError("Enter the secret code.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await registerAdmin({ name: name.trim(), email, password, pincode: secretCode });
      if (result.activated) {
        router.replace("/");
        return;
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isAuthenticated) return null;

  if (done) {
    return (
      <AuthCard
        title="Request received"
        description={`An existing admin needs to approve ${email} before you can sign in with it. We'll email you once it's active.`}
      >
        <div className="flex flex-col items-center gap-4 py-2">
          <Link href="/login" className="w-full">
            <motion.span
              {...hoverScale}
              className="flex w-full items-center justify-center bg-gradient-to-r from-gold via-gold-light via-50% to-gold px-5 py-2.5 font-jakarta text-sm font-medium text-amainblack"
            >
              Back to Sign In
            </motion.span>
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      description="Set up admin access to manage AUREX's members, investments, and reports."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-gold-bright transition-colors hover:text-gold-light">
            Sign in
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {error && (
          <div className="border border-[#f87171]/30 bg-[#f87171]/5 p-3 font-sans text-sm text-[#f87171]">{error}</div>
        )}

        <AuthField
          label="Secret Code"
          icon={<KeyIcon className="size-4" />}
          type="text"
          autoComplete="off"
          placeholder="Ask an admin for this"
          value={secretCode}
          onChange={(e) => setSecretCode(e.target.value)}
          required
        />

        <AuthField
          label="Full Name"
          icon={<UserIcon className="size-4" />}
          type="text"
          autoComplete="name"
          placeholder="Jane Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

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
          {submitting ? <SpinnerIcon className="size-4 animate-spin" /> : "Create Account"}
        </motion.button>
      </form>
    </AuthCard>
  );
}
