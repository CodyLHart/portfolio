import { createClient } from "@supabase/supabase-js";
import {
  buildFriendSummaries,
  findFriendSummary,
  type FriendSummary,
} from "../features/friends/lib/friend-utils";
import { loadSharedCandidateLists } from "../features/lists/lib/list-api";

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

  try {
    const { allCollaborators, lists } = await loadSharedCandidateLists(
      supabase,
      user.id,
    );

    return {
      data: buildFriendSummaries({
        collaborators: allCollaborators,
        currentUserId: user.id,
        lists,
      }),
      status: 200,
    };
  } catch {
    return { error: "Unable to load shared users.", status: 500 };
  }
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
