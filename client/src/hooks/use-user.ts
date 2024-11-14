import useSWR from "swr";
import { piHelper } from "@/lib/pi-helper";
import type { User } from "db/schema";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

interface AuthError {
  code?: string;
  message: string;
  details?: any;
}

interface AuthState {
  isAuthenticating: boolean;
  error: AuthError | null;
  retryCount: number;
  lastAttempt: number | null;
}

const RETRY_DELAY_BASE = 1000; // Base delay of 1 second
const MAX_RETRIES = 3;
const MIN_RETRY_INTERVAL = 2000; // Minimum time between retries

export function useUser() {
  const [, setLocation] = useLocation();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticating: false,
    error: null,
    retryCount: 0,
    lastAttempt: null
  });

  const { data: authData, error, mutate } = useSWR<{
    authenticated: boolean;
    user: User | null;
  }>('/api/auth-status', {
    refreshInterval: 0,
    revalidateOnFocus: false
  });

  // Handle automatic redirection to profile page for new users
  useEffect(() => {
    if (authData?.user && authData.user.status === 'unverified') {
      setLocation('/profile');
    }
  }, [authData?.user, setLocation]);

  const authenticateWithPi = async (maxRetries = MAX_RETRIES) => {
    if (authState.isAuthenticating) {
      console.warn("Authentication already in progress");
      return { ok: false, message: "Authentication already in progress" };
    }

    // Check if we should wait before retrying
    if (authState.lastAttempt && Date.now() - authState.lastAttempt < MIN_RETRY_INTERVAL) {
      return {
        ok: false,
        message: "Please wait before retrying",
        code: "RETRY_TOO_SOON"
      };
    }

    setAuthState(prev => ({
      ...prev,
      isAuthenticating: true,
      error: null,
      lastAttempt: Date.now()
    }));

    try {
      await piHelper.init();
      const authResult = await piHelper.authenticate();
      
      if (!authResult?.uid) {
        throw new Error('Authentication response missing user ID');
      }

      const response = await fetch("/pi-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          piUid: authResult.uid,
          username: `pi_user_${authResult.uid.slice(0, 8)}`,
          accessToken: authResult.accessToken
        }),
        credentials: "include"
      });

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || "Authentication failed") as AuthError;
        error.code = data.code;
        error.details = data.details;
        throw error;
      }

      await mutate();
      setAuthState({
        isAuthenticating: false,
        error: null,
        retryCount: 0,
        lastAttempt: null
      });

      // Redirect to profile page if user is unverified
      if (data.user?.status === 'unverified') {
        setLocation('/profile');
      }
      
      return { ok: true };
    } catch (error: any) {
      console.error("Pi authentication error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        retryCount: authState.retryCount
      });
      
      const formattedError: AuthError = {
        code: error.code,
        message: error.message || "Authentication failed",
        details: error.details
      };

      setAuthState(prev => {
        const newRetryCount = prev.retryCount + 1;
        const shouldRetry = newRetryCount < maxRetries;

        if (shouldRetry) {
          const delay = Math.min(
            RETRY_DELAY_BASE * Math.pow(2, prev.retryCount),
            10000 // Max 10 second delay
          );

          setTimeout(() => {
            authenticateWithPi(maxRetries);
          }, delay);
        }

        return {
          isAuthenticating: shouldRetry,
          error: formattedError,
          retryCount: newRetryCount,
          lastAttempt: Date.now()
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
        retryCount: 0,
        lastAttempt: null
      });
      
      return { ok: true };
    } catch (error: any) {
      return { 
        ok: false, 
        message: error.message,
        code: "LOGOUT_ERROR"
      };
    }
  };

  return {
    user: authData?.user ?? null,
    isLoading: !error && !authData,
    error: authState.error,
    isAuthenticating: authState.isAuthenticating,
    retryCount: authState.retryCount,
    isProfileComplete: authData?.user?.status === 'active',
    authData,
    login: authenticateWithPi,
    logout,
  };
}
