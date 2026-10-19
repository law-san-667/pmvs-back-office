"use client";

import BrandMark from "@/components/brand/brand-mark";
import Flag from "@/components/flag";
import SpaceBanner from "@/components/auth/space-banner";
import ForgotPasswordForm from "@/components/forms/forgot-password-form";
import LoginForm from "@/components/forms/login-form";
import OtpStep from "@/components/forms/otp-step";
import RegisterForm from "@/components/forms/register-form";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/contexts/user-context";
import { useRouter } from "@/i18n/navigation";
import { isAuthSuccessData, type ValidateOtpData } from "@/lib/backend-utils";
import {
  clearPendingOtp,
  savePendingOtp,
  usePendingOtp,
  type PendingOtp,
} from "@/lib/pending-otp";
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
    <section className="flex items-center justify-center h-screen">
      <div className="container mx-auto space-y-8 pt-8">
      <div className="flex flex-wrap items-center justify-center gap-4">
        <BrandMark />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" className="rounded-full">
                <Flag country="FR" />
                FR
              </Button>
            }
          />
        </DropdownMenu>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="mx-auto w-full">
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
  "Producteur d'un bien ou Prestataire de service",
  "Exportateur",
  "Commerçant en gros, en demi-gros ou au détail",
  "Adjudicateur",
];

const ADMIN_LEVELS = [
  "Niveau Central (chef de file : Diarama MBA consulting SARL)",
  "Niveau National (Points Focaux Nationaux : Organismes d'Appui au Commerce)",
  "Niveau sous-régional (Point Focal Régional : ZLECAF)",
];

function WelcomePanel() {
  return (
    <div className="bg-primary/5 flex w-full flex-col justify-center gap-8 rounded-2xl p-10">
      <h2 className="text-primary text-3xl font-bold">
        Soyez les bienvenus !
      </h2>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">
          À l&apos;Interface des fournisseurs
        </h3>
        <ul className="text-muted-foreground list-disc space-y-1 pl-5">
          {SUPPLIER_PROFILES.map((profile) => (
            <li key={profile}>{profile}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">
          Et à l&apos;Interface des administrateurs
        </h3>
        <ul className="text-muted-foreground list-disc space-y-1 pl-5">
          {ADMIN_LEVELS.map((level) => (
            <li key={level}>{level}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
