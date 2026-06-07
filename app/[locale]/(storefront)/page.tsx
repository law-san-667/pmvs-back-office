"use client";

import Flag from "@/components/flag";
import LoginForm from "@/components/forms/login-form";
import RegisterForm from "@/components/forms/register-form";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/contexts/user-context";
import { useRouter } from "@/i18n/navigation";
import Image from "next/image";
import React, { useState } from "react";

type AuthMode = "login" | "register";

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
          {mode === "login" ? (
            <LoginForm onSwitchToRegister={() => setMode("register")} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setMode("login")} />
          )}
        </div>
        <div className="w-full">
          <Image
            src="/auth/auth-image.png"
            alt="Illustration promotionnelle"
            width={904}
            height={982}
            className="h-auto w-full"
            priority
          />
        </div>
      </div>
      </div>
    </section>
  );
}
