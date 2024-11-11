import useSWR from "swr";
import { piHelper } from "@/lib/pi-helper";
import type { User } from "db/schema";
import { useState } from "react";

interface AuthError {
  code?: string;
  message: string;
  details?: any;
}

interface AuthState {
  isAuthenticating: boolean;
  error: AuthError | null;
  retryCount: number;
}

export function useUser() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticating: false,
    error: null,
    retryCount: 0,
  });

  const { data: authData, error, mutate } = useSWR<{
    authenticated: boolean;
    user: User | null;
  }>("/api/auth-status");

  const authenticateWithPi = async (maxRetries = 3) => {
    if (authState.isAuthenticating) {
      console.warn("Authentication already in progress");
      return { ok: false, message: "Authentication already in progress" };
    }

    setAuthState(prev => ({ ...prev, isAuthenticating: true, error: null }));

    try {
      // Initialize Pi SDK first
      await piHelper.init();
      const piUid = await piHelper.authenticate();
      
      const response = await fetch("/pi-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          piUid,
          username: `pi_user_${piUid.slice(0, 8)}`,
          accessToken: "demo_token", // In production, this would be a real Pi Network token
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Authentication failed");
      }

      await mutate();
      setAuthState(prev => ({ 
        ...prev, 
        isAuthenticating: false, 
        error: null,
        retryCount: 0 
      }));
      
      return { ok: true };
    } catch (error: any) {
      console.error("Pi authentication error:", error);
      
      const formattedError: AuthError = {
        code: error.code,
        message: error.message || "Authentication failed",
        details: error.details
      };

      setAuthState(prev => {
        const newRetryCount = prev.retryCount + 1;
        const shouldRetry = newRetryCount < maxRetries;

        if (shouldRetry) {
          // Retry authentication after a delay
          setTimeout(() => {
            authenticateWithPi(maxRetries);
          }, 1000 * newRetryCount);
        }

        return {
          isAuthenticating: shouldRetry,
          error: formattedError,
          retryCount: newRetryCount
        };
      });

      return { 
        ok: false, 
        message: formattedError.message,
        code: formattedError.code,
        details: formattedError.details
      };
    }
  };

  const logout = async () => {
    try {
      const response = await fetch("/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      await mutate();
      setAuthState({
        isAuthenticating: false,
        error: null,
        retryCount: 0
      });
      
      return { ok: true };
    } catch (error: any) {
      return { 
        ok: false, 
        message: error.message 
      };
    }
  };

  return {
    user: authData?.user ?? null,
    isLoading: !error && !authData,
    error: authState.error,
    isAuthenticating: authState.isAuthenticating,
    retryCount: authState.retryCount,
    login: authenticateWithPi,
    logout,
  };
}
