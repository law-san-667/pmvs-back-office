"use client";

import type { OtpPurpose } from "@/lib/backend-utils";
import { useSyncExternalStore } from "react";

/**
 * Vérification par code en cours, gardée dans le navigateur pour survivre à un
 * rechargement ou à un code erroné. Aucun secret n'y est stocké : seulement
 * l'identifiant (téléphone ou email) et l'objet du code.
 */
export type PendingOtp = {
  identifier: string;
  purpose: OtpPurpose;
};

const STORAGE_KEY = "pmvs:pending-otp";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

const listeners = new Set<() => void>();
// Repli si le stockage du navigateur est indisponible (navigation privée…).
let memoryRaw: string | null = null;
let cachedRaw: string | null | undefined;
let cachedValue: PendingOtp | null = null;

const parse = (raw: string | null): PendingOtp | null => {
  if (!raw) return null;

  try {
    const value = JSON.parse(raw) as PendingOtp & { savedAt?: number };

    if (
      typeof value.identifier !== "string" ||
      typeof value.purpose !== "string" ||
      typeof value.savedAt !== "number" ||
      Date.now() - value.savedAt > MAX_AGE_MS
    ) {
      return null;
    }

    return { identifier: value.identifier, purpose: value.purpose };
  } catch {
    return null;
  }
};

const readRaw = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return memoryRaw;
  }
};

const writeRaw = (raw: string | null) => {
  memoryRaw = raw;

  try {
    if (raw === null) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // La valeur reste disponible en mémoire pour cet onglet.
  }

  listeners.forEach((listener) => listener());
};

const read = () => {
  const raw = readRaw();

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = parse(raw);
  }

  return cachedValue;
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  window.addEventListener("storage", listener);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
};

export function savePendingOtp(otp: PendingOtp) {
  writeRaw(JSON.stringify({ ...otp, savedAt: Date.now() }));
}

export function clearPendingOtp() {
  writeRaw(null);
}

export function usePendingOtp() {
  return useSyncExternalStore(subscribe, read, () => null);
}
