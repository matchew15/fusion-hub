import useSWR from "swr";
import { piHelper } from "@/lib/pi-helper";
import type { User } from "db/schema";

export function useUser() {
  const { data: authData, error, mutate } = useSWR<{
    authenticated: boolean;
    user: User | null;
  }>("/api/auth-status");

  const authenticateWithPi = async () => {
    try {
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
      return { ok: true };
    } catch (error: any) {
      console.error("Pi authentication error:", error);
      return { ok: false, message: error.message };
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
      return { ok: true };
    } catch (error: any) {
      return { ok: false, message: error.message };
    }
  };

  return {
    user: authData?.user ?? null,
    isLoading: !error && !authData,
    error,
    login: authenticateWithPi,
    logout,
  };
}
