import { Suspense } from "react";
import type { Metadata } from "next";
import ResetPasswordView from "@/components/auth/ResetPasswordView";

export const metadata: Metadata = {
  title: "Reset Password | AUREX Admin",
};

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordView />
    </Suspense>
  );
}
