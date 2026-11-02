"use client";

import BrandMark from "@/components/brand/brand-mark";
import SpaceBanner from "@/components/auth/space-banner";
import ForgotPasswordForm from "@/components/forms/forgot-password-form";
import LoginForm from "@/components/forms/login-form";
import OtpStep from "@/components/forms/otp-step";
import RegisterForm from "@/components/forms/register-form";
import LanguageSelect from "@/components/language-select";
import { useUser } from "@/contexts/user-context";
import { useRouter } from "@/i18n/navigation";
import { isAuthSuccessData, type ValidateOtpData } from "@/lib/backend-utils";
import {
  clearPendingOtp,
  savePendingOtp,
  usePendingOtp,
  type PendingOtp,
} from "@/lib/pending-otp";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useState } from "react";

type AuthMode = "login" | "register" | "forgot-password";

// `useSearchParams` (the `?mode=register` cross-space link) needs Suspense.
export default function AuthPage() {
  return (
    <Suspense>
      <AuthContent />
    </Suspense>
  );
}

function AuthContent() {
  const router = useRouter();
  const { isAuthenticated } = useUser();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<AuthMode>(
    searchParams.get("mode") === "register" ? "register" : "login",
  );
  // Survit au rechargement : tant qu'une validation est en cours, on la reprend.
  const pendingOtp = usePendingOtp();
  const [otpMessage, setOtpMessage] = useState<string | null>(null);

  const startOtp = (otp: PendingOtp, message: string) => {
    setOtpMessage(message);
    savePendingOtp(otp);
  };

  const leaveOtp = () => {
    clearPendingOtp();
    setOtpMessage(null);
    setMode("login");
  };

  const handleOtpValidated = (result: ValidateOtpData) => {
    clearPendingOtp();

    if (isAuthSuccessData(result)) {
      router.replace("/callback");
      router.refresh();
      return;
    }

    setOtpMessage(null);
    setMode("login");
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push("/callback");
    }
  }, [isAuthenticated, router]);

  return (
    <section className="flex min-h-screen items-center justify-center py-8">
      <div className="container mx-auto space-y-8">
      <div className="flex flex-wrap items-center justify-center gap-4">
        <BrandMark />
        <LanguageSelect />
      </div>
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        <div className="mx-auto w-full min-w-0 px-4 lg:px-0">
          <div className="mx-auto w-full max-w-md">
            <SpaceBanner mode={mode === "register" ? "register" : "login"} />
          </div>
          {pendingOtp ? (
            <OtpStep
              key={`${pendingOtp.purpose}:${pendingOtp.identifier}`}
              context={pendingOtp}
              initialMessage={otpMessage}
              onBack={leaveOtp}
              onValidated={handleOtpValidated}
            />
          ) : (
            <>
              {mode === "login" && (
                <LoginForm
                  onSwitchToRegister={() => setMode("register")}
                  onForgotPassword={() => setMode("forgot-password")}
                  onOtpRequired={startOtp}
                />
              )}
              {mode === "register" && (
                <RegisterForm
                  onSwitchToLogin={() => setMode("login")}
                  onOtpRequired={startOtp}
                />
              )}
            </>
          )}
          {!pendingOtp && mode === "forgot-password" && (
            <ForgotPasswordForm onBackToLogin={() => setMode("login")} />
          )}
        </div>
        <WelcomePanel />
      </div>
      </div>
    </section>
  );
}

const SUPPLIER_PROFILES = [
  "producer",
  "exporter",
  "trader",
  "contractingAuthority",
] as const;

const ADMIN_LEVELS = ["central", "national", "regional"] as const;

function WelcomePanel() {
  const t = useTranslations("auth.landing");

  return (
    <div className="bg-primary/5 flex w-full flex-col justify-center gap-8 rounded-2xl p-10">
      <h2 className="text-primary text-3xl font-bold">{t("welcome")}</h2>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">{t("supplierInterface")}</h3>
        <ul className="text-muted-foreground list-disc space-y-1 ps-5">
          {SUPPLIER_PROFILES.map((profile) => (
            <li key={profile}>{t(`supplierProfiles.${profile}`)}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">{t("adminInterface")}</h3>
        <ul className="text-muted-foreground list-disc space-y-1 ps-5">
          {ADMIN_LEVELS.map((level) => (
            <li key={level}>{t(`adminLevels.${level}`)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
