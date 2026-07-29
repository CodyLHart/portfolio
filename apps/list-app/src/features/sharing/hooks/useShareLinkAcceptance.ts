import type { SupabaseClient, User } from "@supabase/supabase-js";
import { useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { acceptShareLink } from "../../lists/lib/sharing-api";

export function useShareLinkAcceptance({
  loadLists,
  setActiveListId,
  setStatusMessage,
  supabase,
  user,
}: {
  loadLists: (userId: string) => Promise<void>;
  setActiveListId: Dispatch<SetStateAction<string | null>>;
  setStatusMessage: Dispatch<SetStateAction<string | null>>;
  supabase: SupabaseClient;
  user: User | null;
}) {
  const acceptedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const joinToken = params.get("join");
    const requestedRole = params.get("role") === "editor" ? "editor" : "viewer";

    if (!joinToken || acceptedTokenRef.current === joinToken) {
      return;
    }

    acceptedTokenRef.current = joinToken;

    const acceptShareLinkFromUrl = async () => {
      const { data, error } = await acceptShareLink(supabase, {
        requestedRole,
        token: joinToken,
      });

      if (error) {
        setStatusMessage(error.message);
        return;
      }

      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.delete("join");
      nextUrl.searchParams.delete("role");
      window.history.replaceState({}, "", nextUrl.toString());

      await loadLists(user.id);
      setActiveListId(data as string);
      setStatusMessage("You joined the shared list.");
    };

    void acceptShareLinkFromUrl();
  }, [loadLists, setActiveListId, setStatusMessage, supabase, user]);
}
