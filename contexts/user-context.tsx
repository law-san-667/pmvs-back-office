"use client";

import type { PublicUser } from "@/lib/backend-utils";
import { trpc } from "@/server/trpc/client";
import Cookies from "js-cookie";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type UserContextValue = {
  user: PublicUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: PublicUser | null) => void;
  logout: () => void;
};

const UserContext = createContext<UserContextValue | null>(null);

const clearAuthCookies = () => {
  Cookies.remove("access_token", { path: "/" });
  Cookies.remove("refresh_token", { path: "/" });
};

export function UserProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUserState] = useState<PublicUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authCheckKey, setAuthCheckKey] = useState(0);

  const { refetch: fetchMe } = trpc.auth.me.useQuery(undefined, {
    enabled: false,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { mutate: logoutMutate } = trpc.auth.logout.useMutation();

  useEffect(() => {
    let isActive = true;

    void Promise.resolve().then(async () => {
      if (!isActive) {
        return;
      }

      setIsLoading(true);

      try {
        const { data } = await fetchMe();

        if (!isActive) {
          return;
        }

        setUserState(data ?? null);
        setIsAuthenticated(data != null);

        if (!data) {
          clearAuthCookies();
        }
      } catch {
        if (!isActive) {
          return;
        }

        clearAuthCookies();
        setUserState(null);
        setIsAuthenticated(false);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isActive = false;
    };
  }, [authCheckKey, fetchMe, pathname]);

  const logout = useCallback(() => {
    setIsLoading(true);
    logoutMutate(undefined, {
      onSettled: () => {
        clearAuthCookies();
        setUserState(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        setAuthCheckKey((key) => key + 1);
      },
    });
  }, [logoutMutate]);

  const setUser = useCallback((user: PublicUser | null) => {
    setUserState(user);
    setIsAuthenticated(user != null);
    setAuthCheckKey((key) => key + 1);
  }, []);

  return (
    <UserContext
      value={{
        user,
        isAuthenticated,
        isLoading,
        setUser,
        logout,
      }}
    >
      {children}
    </UserContext>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
