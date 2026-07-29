import type { SupabaseClient, User } from "@supabase/supabase-js";
import { useCallback, useState } from "react";
import type { Profile } from "../../../lib/types";
import { loadProfileForUser } from "../lib/profile-api";

export function useProfileController({
  supabase,
}: {
  supabase: SupabaseClient;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(
    async (authUser: User) => {
      const nextProfile = await loadProfileForUser(supabase, authUser);
      setProfile(nextProfile);
      return nextProfile;
    },
    [supabase],
  );

  const clearProfile = useCallback(() => {
    setProfile(null);
  }, []);

  return {
    clearProfile,
    loadProfile,
    profile,
    setProfile,
  };
}
