import type { SupabaseClient } from "@supabase/supabase-js";
import { getOAuthRedirectUrl } from "./auth-helpers";

export async function signInWithGoogle(supabase: SupabaseClient) {
  return supabase.auth.signInWithOAuth({
    options: {
      redirectTo: getOAuthRedirectUrl(),
      skipBrowserRedirect: true,
    },
    provider: "google",
  });
}

export async function signOutUser(supabase: SupabaseClient) {
  return supabase.auth.signOut();
}
