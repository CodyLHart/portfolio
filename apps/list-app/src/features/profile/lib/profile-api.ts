import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Profile } from "../../../lib/types";

export async function loadProfileForUser(
  supabase: SupabaseClient,
  authUser: User,
): Promise<Profile> {
  const metadata = authUser.user_metadata;
  const nextProfile = {
    avatar_url: (metadata.avatar_url as string | undefined) ?? null,
    display_name:
      (metadata.full_name as string | undefined) ??
      (metadata.name as string | undefined) ??
      authUser.email ??
      "List App User",
    email: authUser.email ?? "",
    id: authUser.id,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("profiles").upsert(nextProfile, {
    onConflict: "id",
  });

  if (error) {
    throw error;
  }

  const { data, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (profileError) {
    throw profileError;
  }

  return data as Profile;
}
