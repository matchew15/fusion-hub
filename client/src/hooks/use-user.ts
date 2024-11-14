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
    revalidateOnFocus: false,
    onError: (err) => {
      console.error('Auth status error:', err);
    }
  });

  // Handle automatic redirection to profile page for new users
  useEffect(() => {
    if (authData?.user && authData.user.status === 'unverified') {
      setLocation('/profile');
    }
  }, [authData?.user, setLocation]);

  const authenticateWithPi = async () => {
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
      error: null
    }));

    try {
      await piHelper.init();
      const authResult = await piHelper.authenticate();
      
      if (!authResult?.uid) {
        throw new Error('Authentication failed');
      }

      const response = await fetch("/pi-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          piUid: authResult.uid,
          accessToken: authResult.accessToken,
          username: `pi_user_${authResult.uid.slice(0, 8)}`
        }),
        credentials: "include"
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
      console.error('Pi auth error:', error);
      
      setAuthState(prev => ({
        ...prev,
        isAuthenticating: false,
        error: {
          message: error.message,
          code: error.code,
          details: error.details
        },
        lastAttempt: Date.now()
      }));

      return { 
        ok: false, 
        message: error.message 
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