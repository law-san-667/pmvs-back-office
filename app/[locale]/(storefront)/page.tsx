"use client";

import Flag from "@/components/flag";
import ForgotPasswordForm from "@/components/forms/forgot-password-form";
import LoginForm from "@/components/forms/login-form";
import RegisterForm from "@/components/forms/register-form";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/contexts/user-context";
import { useRouter } from "@/i18n/navigation";
import React, { useState } from "react";

type AuthMode = "login" | "register" | "forgot-password";

export default function AuthPage() {
  const router = useRouter();
  const { isAuthenticated } = useUser();

  const [mode, setMode] = useState<AuthMode>("login");

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push("/callback");
    }
  }, [isAuthenticated, router]);

  return (
    <section className="flex items-center justify-center h-screen">
      <div className="container mx-auto space-y-8 pt-8">
      <div className="flex items-center justify-center">
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
          {mode === "login" && (
            <LoginForm
              onSwitchToRegister={() => setMode("register")}
              onForgotPassword={() => setMode("forgot-password")}
            />
          )}
          {mode === "register" && (
            <RegisterForm onSwitchToLogin={() => setMode("login")} />
          )}
          {mode === "forgot-password" && (
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
