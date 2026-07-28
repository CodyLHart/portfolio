import { createClient } from "@supabase/supabase-js";
import { buildFriendSummaries, findFriendSummary } from "./friends";
import type { FriendSummary } from "./friends";
import type { Collaborator, List } from "./types";

type SharedFriendsResult =
  | { data: FriendSummary[]; status: number }
  | { error: string; status: number };

type SharedFriendResult =
  | { data: FriendSummary; status: number }
  | { error: string; status: number };

export const loadSharedFriends = async (
  authorization: string,
): Promise<SharedFriendsResult> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { error: "Supabase is not configured.", status: 500 };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
  });
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Authentication required.", status: 401 };
  }

  const [ownedResult, collabResult] = await Promise.all([
    supabase
      .from("lists")
      .select("*")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("list_collaborators")
      .select("list_id, lists(*)")
      .eq("user_id", user.id)
      .eq("status", "accepted"),
  ]);

  if (ownedResult.error || collabResult.error) {
    return { error: "Unable to load shared lists.", status: 500 };
  }

  const ownedLists = (ownedResult.data ?? []) as List[];
  const collaboratorLists = (collabResult.data ?? [])
    .map((row) => row.lists as unknown as List | null)
    .filter(Boolean) as List[];
  const uniqueLists = Array.from(
    new Map(
      [...ownedLists, ...collaboratorLists].map((list) => [list.id, list]),
    ).values(),
  );
  const lists = uniqueLists.sort((first, second) =>
    second.updated_at.localeCompare(first.updated_at),
  );
  const listIds = lists.map((list) => list.id);

  if (listIds.length === 0) {
    return { data: [], status: 200 };
  }

  const { data: collaboratorsData, error: collaboratorsError } = await supabase
    .from("list_collaborators")
    .select("*, profile:profiles!list_collaborators_user_id_fkey(*)")
    .in("list_id", listIds)
    .eq("status", "accepted");

  if (collaboratorsError) {
    return { error: "Unable to load shared users.", status: 500 };
  }

  return {
    data: buildFriendSummaries({
      collaborators: (collaboratorsData ?? []) as Collaborator[],
      currentUserId: user.id,
      lists,
    }),
    status: 200,
  };
};

export const loadSharedFriend = async (
  authorization: string,
  friendId: string,
): Promise<SharedFriendResult> => {
  const result = await loadSharedFriends(authorization);

  if (!("data" in result)) {
    return result;
  }

  const friend = findFriendSummary(result.data, friendId);

  if (!friend) {
    return { error: "Friend not found.", status: 404 };
  }

  return { data: friend, status: 200 };
};
