"use client";

import { useLocale } from "next-intl";
import { createContext, useContext, useMemo, useState } from "react";

type UserPreferencesContextValue = {
  language: string;
  country: string;
  setLanguage: (language: string) => void;
  setCountry: (country: string) => void;
};

const UserPreferencesContext =
  createContext<UserPreferencesContextValue | null>(null);

const DEFAULT_COUNTRY = "SN";

function getCountryFromHostname(): string {
  if (typeof window === "undefined") return DEFAULT_COUNTRY;

  const hostname = window.location.hostname;
  const prefix = hostname.split(".")[0]?.toUpperCase();

  if (prefix && prefix.length === 2 && prefix !== hostname.toUpperCase()) {
    return prefix;
  }

  return DEFAULT_COUNTRY;
}

export function UserPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const [language, setLanguage] = useState(locale);
  const [country, setCountry] = useState(getCountryFromHostname);

  const value = useMemo(
    () => ({ language, country, setLanguage, setCountry }),
    [language, country],
  );

  return (
    <UserPreferencesContext value={value}>{children}</UserPreferencesContext>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error(
      "useUserPreferences must be used within a UserPreferencesProvider",
    );
  }
  return context;
}
