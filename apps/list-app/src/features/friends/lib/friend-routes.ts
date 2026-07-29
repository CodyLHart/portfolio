export type FriendsRouteState = {
  friendId: string | null;
  section: "friends" | "lists";
};

export const getFriendsRouteState = (): FriendsRouteState => {
  if (typeof window === "undefined") {
    return { friendId: null, section: "lists" };
  }

  const [, segment, friendId] = window.location.pathname.split("/");

  if (segment !== "friends") {
    return { friendId: null, section: "lists" };
  }

  return {
    friendId: friendId ? decodeURIComponent(friendId) : null,
    section: "friends",
  };
};

export const getFriendHref = (friendId: string) =>
  `/friends/${encodeURIComponent(friendId)}`;
