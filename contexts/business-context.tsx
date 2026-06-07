"use client";

import type { Business } from "@/lib/backend-resource-types";
import { trpc } from "@/server/trpc/client";
import Cookies from "js-cookie";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const BUSINESS_COOKIE_NAME = "active_business_id";
const COOKIE_MAX_AGE = 365;

type BusinessContextValue = {
  business: Business | null;
  businessId: string | null;
  isLoading: boolean;
  setBusiness: (business: Business | null) => void;
};

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [business, setBusinessState] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { refetch } = trpc.businesses.myBusiness.useQuery(undefined, {
    enabled: false,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    let isActive = true;

    void Promise.resolve().then(async () => {
      if (!isActive) return;
      setIsLoading(true);

      try {
        const { data } = await refetch();
        if (!isActive) return;

        if (data) {
          setBusinessState(data);
          Cookies.set(BUSINESS_COOKIE_NAME, data.id, {
            path: "/",
            expires: COOKIE_MAX_AGE,
          });
        } else {
          setBusinessState(null);
          Cookies.remove(BUSINESS_COOKIE_NAME, { path: "/" });
        }
      } catch {
        if (!isActive) return;
        setBusinessState(null);
        Cookies.remove(BUSINESS_COOKIE_NAME, { path: "/" });
      } finally {
        if (isActive) setIsLoading(false);
      }
    });

    return () => {
      isActive = false;
    };
  }, [refetch]);

  const setBusiness = useCallback((biz: Business | null) => {
    setBusinessState(biz);
    if (biz) {
      Cookies.set(BUSINESS_COOKIE_NAME, biz.id, {
        path: "/",
        expires: COOKIE_MAX_AGE,
      });
    } else {
      Cookies.remove(BUSINESS_COOKIE_NAME, { path: "/" });
    }
  }, []);

  return (
    <BusinessContext
      value={{
        business,
        businessId: business?.id ?? null,
        isLoading,
        setBusiness,
      }}
    >
      {children}
    </BusinessContext>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error("useBusiness must be used within a BusinessProvider");
  }
  return context;
}

export function getActiveBusinessId() {
  return Cookies.get(BUSINESS_COOKIE_NAME) ?? null;
}
