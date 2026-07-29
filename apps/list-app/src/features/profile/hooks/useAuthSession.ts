import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export function useAuthSession({
  onAuthenticated,
  onUnauthenticated,
  supabase,
}: {
  onAuthenticated: (authUser: User) => void;
  onUnauthenticated: () => void;
  supabase: SupabaseClient;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    const applySession = (nextSession: Session | null) => {
      if (nextSession?.user) {
        setSession(nextSession);
        setAuthStatus("authenticated");
        onAuthenticated(nextSession.user);
        return;
      }

      setSession(null);
      setAuthStatus("unauthenticated");
      onUnauthenticated();
    };

    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        applySession(nextSession);
      },
    );

    return () => subscription.subscription.unsubscribe();
  }, [onAuthenticated, onUnauthenticated, supabase]);

  return {
    authStatus,
    session,
    user: session?.user ?? null,
  };
}
